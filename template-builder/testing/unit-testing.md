# Unit Testing Templates

Production-ready unit testing patterns for JavaScript/TypeScript with Jest and Vitest, and Python with pytest.

## Overview

- **Jest Testing**: JavaScript/TypeScript unit tests with mocking
- **Vitest Testing**: Fast Vite-native test runner
- **Pytest Testing**: Python unit tests with fixtures
- **Test Organization**: Structure, naming, and best practices

## Quick Start

```bash
# Jest
npm install -D jest @types/jest ts-jest
npx jest --init

# Vitest
npm install -D vitest @vitest/coverage-v8
npx vitest

# Pytest
pip install pytest pytest-cov pytest-asyncio
pytest --cov
```

## Jest Testing

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
  restoreMocks: true,
};

export default config;
```

```typescript
// jest.setup.ts
import '@testing-library/jest-dom';

// Global test utilities
global.mockDate = (date: Date) => {
  jest.useFakeTimers();
  jest.setSystemTime(date);
};

// Clean up after each test
afterEach(() => {
  jest.useRealTimers();
});
```

```typescript
// src/services/__tests__/user-service.test.ts
import { UserService } from '../user-service';
import { UserRepository } from '../../repositories/user-repository';
import { EmailService } from '../email-service';
import { User } from '../../types';

// Mock dependencies
jest.mock('../../repositories/user-repository');
jest.mock('../email-service');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockEmailService: jest.Mocked<EmailService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    // Reset mocks
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>;
    mockEmailService = new EmailService() as jest.Mocked<EmailService>;

    userService = new UserService(mockUserRepo, mockEmailService);
  });

  describe('createUser', () => {
    it('should create a user and send welcome email', async () => {
      // Arrange
      const input = { email: 'new@example.com', name: 'New User' };
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({ ...mockUser, ...input });
      mockEmailService.sendWelcome.mockResolvedValue(undefined);

      // Act
      const result = await userService.createUser(input);

      // Assert
      expect(result).toMatchObject(input);
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining(input)
      );
      expect(mockEmailService.sendWelcome).toHaveBeenCalledWith(input.email);
    });

    it('should throw if email already exists', async () => {
      // Arrange
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        userService.createUser({ email: mockUser.email, name: 'Test' })
      ).rejects.toThrow('Email already exists');

      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });

    it('should handle email service failure gracefully', async () => {
      // Arrange
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);
      mockEmailService.sendWelcome.mockRejectedValue(new Error('SMTP error'));

      // Act - should not throw
      const result = await userService.createUser({
        email: 'test@example.com',
        name: 'Test',
      });

      // Assert - user still created
      expect(result).toBeDefined();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(mockUserRepo.findById).toHaveBeenCalledWith('1');
    });

    it('should return null when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await userService.getUserById('999');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const updates = { name: 'Updated Name' };
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.update.mockResolvedValue({ ...mockUser, ...updates });

      const result = await userService.updateUser('1', updates);

      expect(result.name).toBe('Updated Name');
      expect(mockUserRepo.update).toHaveBeenCalledWith('1', updates);
    });

    it('should throw if user does not exist', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        userService.updateUser('999', { name: 'Test' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.softDelete.mockResolvedValue(undefined);

      await userService.deleteUser('1');

      expect(mockUserRepo.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
```

```typescript
// src/utils/__tests__/validation.test.ts
import { validateEmail, validatePassword, sanitizeInput } from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it.each([
      ['test@example.com', true],
      ['user.name@domain.co.uk', true],
      ['user+tag@example.com', true],
      ['invalid-email', false],
      ['@nodomain.com', false],
      ['spaces in@email.com', false],
      ['', false],
    ])('validateEmail("%s") should return %s', (email, expected) => {
      expect(validateEmail(email)).toBe(expected);
    });
  });

  describe('validatePassword', () => {
    const validPassword = 'SecureP@ss123';

    it('should accept valid password', () => {
      const result = validatePassword(validPassword);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('securep@ss123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain uppercase letter');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('SecurePass123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain special character');
    });

    it('should reject short password', () => {
      const result = validatePassword('Sh0rt!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must be at least 8 characters');
    });

    it('should return multiple errors for very weak password', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should preserve normal text', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
    });
  });
});
```

## Vitest Testing

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/**/*.d.ts', 'src/**/__tests__/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

```typescript
// src/hooks/__tests__/use-async.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAsync } from '../use-async';

describe('useAsync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start in idle state', () => {
    const asyncFn = vi.fn();
    const { result } = renderHook(() => useAsync(asyncFn));

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should execute async function and return data', async () => {
    const mockData = { id: 1, name: 'Test' };
    const asyncFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useAsync(asyncFn));

    act(() => {
      result.current.execute();
    });

    expect(result.current.status).toBe('pending');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toEqual(mockData);
    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  it('should handle errors', async () => {
    const error = new Error('Network error');
    const asyncFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useAsync(asyncFn));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should pass arguments to async function', async () => {
    const asyncFn = vi.fn().mockResolvedValue('result');

    const { result } = renderHook(() => useAsync(asyncFn));

    act(() => {
      result.current.execute('arg1', 'arg2');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should reset state', async () => {
    const asyncFn = vi.fn().mockResolvedValue('data');

    const { result } = renderHook(() => useAsync(asyncFn));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('should handle immediate execution', async () => {
    const mockData = { value: 42 };
    const asyncFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useAsync(asyncFn, { immediate: true })
    );

    expect(result.current.status).toBe('pending');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toEqual(mockData);
  });
});
```

## Pytest Testing

```python
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
    unit: marks tests as unit tests
asyncio_mode = auto
```

```python
# conftest.py
"""Pytest configuration and fixtures."""
import pytest
from datetime import datetime
from typing import Generator
from unittest.mock import MagicMock, AsyncMock


@pytest.fixture
def mock_datetime(monkeypatch):
    """Fixture to mock datetime.now()."""
    class MockDatetime:
        @classmethod
        def now(cls):
            return datetime(2024, 1, 15, 12, 0, 0)

        @classmethod
        def utcnow(cls):
            return datetime(2024, 1, 15, 12, 0, 0)

    monkeypatch.setattr("datetime.datetime", MockDatetime)
    return MockDatetime


@pytest.fixture
def sample_user():
    """Sample user data fixture."""
    return {
        "id": "user_123",
        "email": "test@example.com",
        "name": "Test User",
        "created_at": datetime(2024, 1, 1),
    }


@pytest.fixture
def mock_db():
    """Mock database connection."""
    db = MagicMock()
    db.execute = MagicMock(return_value=MagicMock())
    db.fetch_one = MagicMock(return_value=None)
    db.fetch_all = MagicMock(return_value=[])
    return db


@pytest.fixture
def mock_async_db():
    """Mock async database connection."""
    db = AsyncMock()
    db.execute = AsyncMock(return_value=None)
    db.fetch_one = AsyncMock(return_value=None)
    db.fetch_all = AsyncMock(return_value=[])
    return db


@pytest.fixture
def temp_file(tmp_path):
    """Create a temporary file for testing."""
    file_path = tmp_path / "test_file.txt"
    file_path.write_text("test content")
    return file_path
```

```python
# tests/services/test_user_service.py
"""Tests for UserService."""
import pytest
from datetime import datetime
from unittest.mock import MagicMock, AsyncMock, patch
from services.user_service import UserService
from models.user import User
from exceptions import UserNotFoundError, DuplicateEmailError


class TestUserService:
    """Tests for UserService class."""

    @pytest.fixture
    def mock_user_repo(self):
        """Mock user repository."""
        repo = MagicMock()
        repo.find_by_id = MagicMock(return_value=None)
        repo.find_by_email = MagicMock(return_value=None)
        repo.create = MagicMock()
        repo.update = MagicMock()
        repo.delete = MagicMock()
        return repo

    @pytest.fixture
    def mock_email_service(self):
        """Mock email service."""
        service = MagicMock()
        service.send_welcome = MagicMock()
        return service

    @pytest.fixture
    def user_service(self, mock_user_repo, mock_email_service):
        """Create UserService with mocked dependencies."""
        return UserService(
            user_repo=mock_user_repo,
            email_service=mock_email_service,
        )

    @pytest.fixture
    def sample_user(self):
        """Sample user object."""
        return User(
            id="user_123",
            email="test@example.com",
            name="Test User",
            created_at=datetime(2024, 1, 1),
        )

    # Test create_user
    def test_create_user_success(
        self,
        user_service,
        mock_user_repo,
        mock_email_service,
        sample_user,
    ):
        """Test successful user creation."""
        # Arrange
        mock_user_repo.find_by_email.return_value = None
        mock_user_repo.create.return_value = sample_user

        # Act
        result = user_service.create_user(
            email="test@example.com",
            name="Test User",
        )

        # Assert
        assert result.email == "test@example.com"
        assert result.name == "Test User"
        mock_user_repo.create.assert_called_once()
        mock_email_service.send_welcome.assert_called_once_with("test@example.com")

    def test_create_user_duplicate_email(
        self,
        user_service,
        mock_user_repo,
        sample_user,
    ):
        """Test create user with existing email raises error."""
        mock_user_repo.find_by_email.return_value = sample_user

        with pytest.raises(DuplicateEmailError) as exc_info:
            user_service.create_user(
                email="test@example.com",
                name="Test User",
            )

        assert "already exists" in str(exc_info.value)
        mock_user_repo.create.assert_not_called()

    def test_create_user_email_failure_still_creates(
        self,
        user_service,
        mock_user_repo,
        mock_email_service,
        sample_user,
    ):
        """Test user is created even if email fails."""
        mock_user_repo.find_by_email.return_value = None
        mock_user_repo.create.return_value = sample_user
        mock_email_service.send_welcome.side_effect = Exception("SMTP error")

        # Should not raise
        result = user_service.create_user(
            email="test@example.com",
            name="Test User",
        )

        assert result is not None

    # Test get_user
    def test_get_user_by_id_found(
        self,
        user_service,
        mock_user_repo,
        sample_user,
    ):
        """Test getting user by ID when found."""
        mock_user_repo.find_by_id.return_value = sample_user

        result = user_service.get_user_by_id("user_123")

        assert result == sample_user
        mock_user_repo.find_by_id.assert_called_once_with("user_123")

    def test_get_user_by_id_not_found(
        self,
        user_service,
        mock_user_repo,
    ):
        """Test getting user by ID when not found."""
        mock_user_repo.find_by_id.return_value = None

        with pytest.raises(UserNotFoundError):
            user_service.get_user_by_id("nonexistent")

    # Test update_user
    def test_update_user_success(
        self,
        user_service,
        mock_user_repo,
        sample_user,
    ):
        """Test successful user update."""
        updated_user = User(
            id=sample_user.id,
            email=sample_user.email,
            name="Updated Name",
            created_at=sample_user.created_at,
        )
        mock_user_repo.find_by_id.return_value = sample_user
        mock_user_repo.update.return_value = updated_user

        result = user_service.update_user("user_123", name="Updated Name")

        assert result.name == "Updated Name"
        mock_user_repo.update.assert_called_once()

    # Test delete_user
    def test_delete_user_success(
        self,
        user_service,
        mock_user_repo,
        sample_user,
    ):
        """Test successful user deletion."""
        mock_user_repo.find_by_id.return_value = sample_user

        user_service.delete_user("user_123")

        mock_user_repo.delete.assert_called_once_with("user_123")

    def test_delete_user_not_found(
        self,
        user_service,
        mock_user_repo,
    ):
        """Test deleting non-existent user."""
        mock_user_repo.find_by_id.return_value = None

        with pytest.raises(UserNotFoundError):
            user_service.delete_user("nonexistent")


class TestUserServiceAsync:
    """Tests for async UserService methods."""

    @pytest.fixture
    def async_user_service(self, mock_async_db):
        """Create async UserService."""
        from services.async_user_service import AsyncUserService
        return AsyncUserService(db=mock_async_db)

    @pytest.mark.asyncio
    async def test_get_user_async(self, async_user_service, mock_async_db):
        """Test async user retrieval."""
        mock_async_db.fetch_one.return_value = {
            "id": "user_123",
            "email": "test@example.com",
            "name": "Test User",
        }

        result = await async_user_service.get_user("user_123")

        assert result["id"] == "user_123"
        mock_async_db.fetch_one.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_user_not_found_async(
        self,
        async_user_service,
        mock_async_db,
    ):
        """Test async user not found."""
        mock_async_db.fetch_one.return_value = None

        with pytest.raises(UserNotFoundError):
            await async_user_service.get_user("nonexistent")
```

```python
# tests/utils/test_validators.py
"""Tests for validation utilities."""
import pytest
from utils.validators import (
    validate_email,
    validate_password,
    validate_phone,
    sanitize_input,
)


class TestValidateEmail:
    """Tests for email validation."""

    @pytest.mark.parametrize(
        "email,expected",
        [
            ("test@example.com", True),
            ("user.name@domain.co.uk", True),
            ("user+tag@example.com", True),
            ("test@subdomain.example.com", True),
            ("invalid-email", False),
            ("@nodomain.com", False),
            ("spaces in@email.com", False),
            ("", False),
            (None, False),
            ("test@", False),
            ("@example.com", False),
        ],
    )
    def test_validate_email(self, email, expected):
        """Test email validation with various inputs."""
        assert validate_email(email) == expected


class TestValidatePassword:
    """Tests for password validation."""

    def test_valid_password(self):
        """Test valid password passes all rules."""
        result = validate_password("SecureP@ss123")
        assert result.is_valid
        assert len(result.errors) == 0

    def test_password_too_short(self):
        """Test short password fails."""
        result = validate_password("Sh0rt!")
        assert not result.is_valid
        assert "at least 8 characters" in result.errors[0].lower()

    def test_password_no_uppercase(self):
        """Test password without uppercase fails."""
        result = validate_password("securep@ss123")
        assert not result.is_valid
        assert any("uppercase" in e.lower() for e in result.errors)

    def test_password_no_lowercase(self):
        """Test password without lowercase fails."""
        result = validate_password("SECUREP@SS123")
        assert not result.is_valid
        assert any("lowercase" in e.lower() for e in result.errors)

    def test_password_no_digit(self):
        """Test password without digit fails."""
        result = validate_password("SecureP@ssword")
        assert not result.is_valid
        assert any("digit" in e.lower() or "number" in e.lower() for e in result.errors)

    def test_password_no_special(self):
        """Test password without special character fails."""
        result = validate_password("SecurePass123")
        assert not result.is_valid
        assert any("special" in e.lower() for e in result.errors)

    def test_weak_password_multiple_errors(self):
        """Test very weak password returns multiple errors."""
        result = validate_password("weak")
        assert not result.is_valid
        assert len(result.errors) > 1


class TestSanitizeInput:
    """Tests for input sanitization."""

    def test_escapes_html(self):
        """Test HTML characters are escaped."""
        result = sanitize_input('<script>alert("xss")</script>')
        assert "<" not in result
        assert ">" not in result
        assert "&lt;" in result

    def test_trims_whitespace(self):
        """Test whitespace is trimmed."""
        assert sanitize_input("  hello  ") == "hello"

    def test_preserves_normal_text(self):
        """Test normal text is unchanged."""
        assert sanitize_input("Hello World") == "Hello World"

    def test_handles_empty_string(self):
        """Test empty string returns empty."""
        assert sanitize_input("") == ""

    def test_handles_none(self):
        """Test None returns empty string."""
        assert sanitize_input(None) == ""

    def test_removes_null_bytes(self):
        """Test null bytes are removed."""
        assert "\x00" not in sanitize_input("test\x00string")
```

## CLAUDE.md Integration

```markdown
# Unit Testing Integration

## Commands
- `npm test` - Run all tests
- `npm test -- --watch` - Watch mode
- `npm test -- --coverage` - With coverage
- `pytest -v` - Run Python tests
- `pytest --cov=src` - With coverage

## Test Patterns
- AAA pattern: Arrange, Act, Assert
- One assertion per test (when possible)
- Descriptive test names
- Mock external dependencies
- Use fixtures for test data

## Coverage Requirements
- Lines: 80%
- Branches: 80%
- Functions: 80%
```

## AI Suggestions

1. **Property-based testing** - Add fast-check or Hypothesis tests
2. **Mutation testing setup** - Add Stryker configuration
3. **Test parallelization** - Configure parallel test execution
4. **Snapshot testing** - Add snapshot tests for complex objects
5. **Test data builders** - Create fluent test data builders
6. **Custom matchers** - Add domain-specific Jest/pytest matchers
7. **Test coverage trends** - Track coverage over time
8. **Flaky test detection** - Identify and fix flaky tests
9. **Test performance** - Monitor and optimize slow tests
10. **Contract testing** - Add Pact contract tests for APIs
