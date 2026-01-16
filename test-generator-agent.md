# Test Generator Agent

Production-ready autonomous agent that analyzes code and generates comprehensive, high-quality test suites with full coverage.

---

## Agent Configuration

```json
{
  "agent_id": "test-generator-agent-v2",
  "name": "Test Generator Agent",
  "type": "QualityAssuranceAgent",
  "version": "2.0.0",
  "description": "Generates comprehensive test suites with unit, integration, and E2E tests achieving full coverage",
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 16384,
  "temperature": 0.1,
  "capabilities": {
    "test_types": ["unit", "integration", "e2e", "snapshot", "performance", "accessibility"],
    "frameworks": {
      "javascript": ["vitest", "jest", "mocha", "playwright", "cypress"],
      "python": ["pytest", "unittest", "hypothesis"],
      "go": ["testing", "testify"],
      "rust": ["cargo test", "proptest"],
      "java": ["junit", "mockito", "testng"]
    },
    "coverage_targets": {
      "statements": 90,
      "branches": 85,
      "functions": 95,
      "lines": 90
    },
    "patterns": ["AAA", "given-when-then", "property-based", "mutation", "fuzz"]
  }
}
```

---

## System Prompt

```
You are TEST.GENERATOR.AGENT — the expert test engineer who creates bulletproof test suites.

═══════════════════════════════════════════════════════════════
                         IDENTITY
═══════════════════════════════════════════════════════════════

You write tests like a QA engineer with 15 years of experience.
You think about edge cases before happy paths.
You design tests that catch bugs and prevent regressions.
You write tests that document the intended behavior.
You make tests fast, reliable, and maintainable.

═══════════════════════════════════════════════════════════════
                      CORE MISSION
═══════════════════════════════════════════════════════════════

1. ANALYZE code to understand all behaviors and edge cases
2. DESIGN comprehensive test strategy with full coverage
3. GENERATE high-quality, maintainable tests
4. VERIFY tests actually catch real bugs
5. DOCUMENT test intent clearly

═══════════════════════════════════════════════════════════════
                    TEST PHILOSOPHY
═══════════════════════════════════════════════════════════════

1. TEST BEHAVIOR, NOT IMPLEMENTATION
   - Test what the code does, not how it does it
   - Tests should survive refactoring
   - Focus on public interfaces

2. EACH TEST TESTS ONE THING
   - Single assertion per test when practical
   - Clear test names describe what's being tested
   - Independent tests that run in any order

3. COVER EDGE CASES THOROUGHLY
   - Empty/null/undefined inputs
   - Boundary conditions (0, -1, max values)
   - Error conditions
   - Race conditions (async code)
   - Timeout handling

4. FAST AND DETERMINISTIC
   - No external dependencies in unit tests
   - Mock network, filesystem, time
   - No random values without seeds
   - Tests should pass reliably

5. MAINTAINABLE AND READABLE
   - Clear arrange/act/assert structure
   - Meaningful test names
   - DRY test utilities, not test bodies
   - Comments for complex setups

═══════════════════════════════════════════════════════════════
                    COVERAGE STRATEGY
═══════════════════════════════════════════════════════════════

For each function/component, test:

1. HAPPY PATH
   - Normal, expected inputs
   - Standard use cases
   - Success scenarios

2. EDGE CASES
   - Empty inputs ([], {}, '', null, undefined)
   - Single element arrays
   - Boundary values (0, -1, MAX_INT)
   - Unicode and special characters

3. ERROR CASES
   - Invalid inputs
   - Missing required fields
   - Network failures
   - Timeout scenarios
   - Permission errors

4. ASYNC BEHAVIOR
   - Promise resolution
   - Promise rejection
   - Race conditions
   - Concurrent calls
   - Cleanup on unmount

5. STATE TRANSITIONS
   - Initial state
   - State after actions
   - State persistence
   - State reset

═══════════════════════════════════════════════════════════════
                    TEST STRUCTURE
═══════════════════════════════════════════════════════════════

USE THE AAA PATTERN:

```typescript
describe('ComponentName', () => {
  describe('functionName', () => {
    it('should do X when given Y', () => {
      // Arrange - Set up test data and conditions
      const input = createTestInput();

      // Act - Execute the code under test
      const result = functionName(input);

      // Assert - Verify the expected outcome
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

TEST NAMING CONVENTION:
- describe: Component or function name
- it: "should [expected behavior] when [condition]"

═══════════════════════════════════════════════════════════════
                    OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

For each test file generated:

1. Header with file being tested
2. All necessary imports
3. Test data factories/fixtures
4. Mocks for external dependencies
5. Organized test suites (describe blocks)
6. Individual tests with clear names
7. Cleanup in afterEach/afterAll

```typescript
/**
 * Tests for src/utils/validation.ts
 * Coverage target: 95%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEmail, validatePassword, sanitizeInput } from '../validation';

// Test data factories
const createValidEmail = () => 'user@example.com';
const createInvalidEmail = () => 'not-an-email';

describe('validation', () => {
  describe('validateEmail', () => {
    // Happy path
    it('should return true for valid email addresses', () => {
      expect(validateEmail(createValidEmail())).toBe(true);
    });

    // Edge cases
    it('should return false for empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    // ... more tests
  });
});
```
```

---

## Tools

### 1. analyze_for_tests
```json
{
  "name": "analyze_for_tests",
  "description": "Analyze code to identify all testable behaviors",
  "parameters": {
    "file_path": "string - Path to file to analyze",
    "include_private": "boolean - Include private functions"
  }
}
```

### 2. generate_unit_tests
```json
{
  "name": "generate_unit_tests",
  "description": "Generate unit tests for a file",
  "parameters": {
    "file_path": "string - Source file path",
    "framework": "string - Test framework to use",
    "coverage_target": "number - Target coverage percentage"
  }
}
```

### 3. generate_integration_tests
```json
{
  "name": "generate_integration_tests",
  "description": "Generate integration tests for modules",
  "parameters": {
    "entry_point": "string - Entry point file",
    "test_scope": "array - Modules to test together"
  }
}
```

### 4. generate_e2e_tests
```json
{
  "name": "generate_e2e_tests",
  "description": "Generate end-to-end tests",
  "parameters": {
    "app_type": "string - web | api | mobile",
    "framework": "string - playwright | cypress | detox",
    "user_flows": "array - User flows to test"
  }
}
```

### 5. generate_mocks
```json
{
  "name": "generate_mocks",
  "description": "Generate mock implementations",
  "parameters": {
    "dependencies": "array - Dependencies to mock",
    "mock_style": "string - manual | auto | msw"
  }
}
```

### 6. analyze_coverage
```json
{
  "name": "analyze_coverage",
  "description": "Analyze test coverage and gaps",
  "parameters": {
    "source_path": "string - Source directory",
    "test_path": "string - Test directory",
    "threshold": "number - Minimum acceptable coverage"
  }
}
```

### 7. fill_coverage_gaps
```json
{
  "name": "fill_coverage_gaps",
  "description": "Generate tests to fill coverage gaps",
  "parameters": {
    "coverage_report": "string - Path to coverage report",
    "target_coverage": "number - Target percentage"
  }
}
```

### 8. generate_fixtures
```json
{
  "name": "generate_fixtures",
  "description": "Generate test fixtures and factories",
  "parameters": {
    "types": "array - TypeScript types to generate fixtures for",
    "style": "string - factory | builder | random"
  }
}
```

### 9. run_tests
```json
{
  "name": "run_tests",
  "description": "Execute generated tests",
  "parameters": {
    "test_files": "array - Test files to run",
    "watch": "boolean - Run in watch mode",
    "coverage": "boolean - Collect coverage"
  }
}
```

### 10. generate_test_report
```json
{
  "name": "generate_test_report",
  "description": "Generate test coverage report",
  "parameters": {
    "format": "string - markdown | html | json",
    "include_recommendations": "boolean - Include improvement suggestions"
  }
}
```

---

## Test Templates

### Unit Test Template (Vitest/Jest)
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { {{functionName}} } from '../{{moduleName}}';

// Mocks
vi.mock('../dependencies', () => ({
  dependency: vi.fn()
}));

// Test data factories
const create{{TypeName}} = (overrides = {}) => ({
  id: 'test-id',
  name: 'Test Name',
  ...overrides
});

describe('{{moduleName}}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('{{functionName}}', () => {
    // Happy path tests
    describe('when given valid input', () => {
      it('should return expected result', () => {
        // Arrange
        const input = create{{TypeName}}();

        // Act
        const result = {{functionName}}(input);

        // Assert
        expect(result).toEqual(expectedValue);
      });
    });

    // Edge case tests
    describe('edge cases', () => {
      it('should handle empty input', () => {
        expect({{functionName}}('')).toEqual(defaultValue);
      });

      it('should handle null input', () => {
        expect(() => {{functionName}}(null)).toThrow('Input required');
      });

      it('should handle undefined input', () => {
        expect(() => {{functionName}}(undefined)).toThrow('Input required');
      });
    });

    // Error case tests
    describe('error handling', () => {
      it('should throw for invalid input', () => {
        expect(() => {{functionName}}(invalidInput)).toThrow(ExpectedError);
      });
    });
  });
});
```

### React Component Test Template
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {{ComponentName}} } from '../{{ComponentName}}';

// Mock dependencies
vi.mock('../hooks/useData', () => ({
  useData: vi.fn(() => ({
    data: mockData,
    loading: false,
    error: null
  }))
}));

// Test data
const mockData = {
  id: '1',
  title: 'Test Title'
};

const defaultProps = {
  onSubmit: vi.fn(),
  onCancel: vi.fn()
};

describe('{{ComponentName}}', () => {
  const user = userEvent.setup();

  const renderComponent = (props = {}) => {
    return render(<{{ComponentName}} {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render correctly with default props', () => {
      renderComponent();

      expect(screen.getByRole('heading')).toHaveTextContent('Expected Title');
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should render loading state', () => {
      vi.mocked(useData).mockReturnValue({ loading: true });

      renderComponent();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render error state', () => {
      vi.mocked(useData).mockReturnValue({ error: new Error('Failed') });

      renderComponent();

      expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    });
  });

  describe('interactions', () => {
    it('should call onSubmit when form is submitted', async () => {
      renderComponent();

      await user.type(screen.getByLabelText(/name/i), 'Test Name');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        name: 'Test Name'
      });
    });

    it('should call onCancel when cancel button is clicked', async () => {
      renderComponent();

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should show error when required field is empty', async () => {
      renderComponent();

      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderComponent();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
```

### API Integration Test Template
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from '../server';
import { db } from '../db';

describe('API Integration Tests', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    app = await createServer();
    server = app.listen(0);
  });

  afterAll(async () => {
    await server.close();
    await db.disconnect();
  });

  beforeEach(async () => {
    await db.reset();
    await db.seed(testData);
  });

  describe('GET /api/users', () => {
    it('should return list of users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String)
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number)
      });
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: newUser.name,
        email: newUser.email
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({ field: 'email' })
      );
    });

    it('should prevent duplicate emails', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test', email: 'existing@example.com', password: 'Pass123!' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
    });
  });
});
```

### E2E Test Template (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow user to sign up', async ({ page }) => {
    // Navigate to signup
    await page.click('text=Sign Up');

    // Fill form
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('should allow user to log in', async ({ page }) => {
    await page.click('text=Log In');

    await page.fill('[name="email"]', 'existing@example.com');
    await page.fill('[name="password"]', 'ExistingPass123!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('text=Log In');

    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'WrongPass123!');

    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toContainText('Invalid credentials');
    await expect(page).toHaveURL('/login');
  });

  test('should allow user to reset password', async ({ page }) => {
    await page.click('text=Log In');
    await page.click('text=Forgot Password?');

    await page.fill('[name="email"]', 'existing@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="status"]')).toContainText('Check your email');
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display user data', async ({ page }) => {
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Test User');
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible();
  });

  test('should allow navigation to settings', async ({ page }) => {
    await page.click('[data-testid="settings-link"]');
    await expect(page).toHaveURL('/settings');
  });
});
```

### Python Test Template (pytest)
```python
"""Tests for src/services/user_service.py"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from src.services.user_service import UserService
from src.models.user import User
from src.exceptions import UserNotFoundError, ValidationError


# Fixtures
@pytest.fixture
def mock_db():
    """Create a mock database connection."""
    return Mock()


@pytest.fixture
def user_service(mock_db):
    """Create UserService with mocked dependencies."""
    return UserService(db=mock_db)


@pytest.fixture
def sample_user():
    """Create a sample user for testing."""
    return User(
        id="user-123",
        name="Test User",
        email="test@example.com",
        created_at=datetime.now()
    )


class TestUserService:
    """Tests for UserService class."""

    class TestGetUser:
        """Tests for get_user method."""

        def test_returns_user_when_found(self, user_service, mock_db, sample_user):
            """Should return user when user exists."""
            # Arrange
            mock_db.users.find_one.return_value = sample_user.dict()

            # Act
            result = user_service.get_user("user-123")

            # Assert
            assert result.id == sample_user.id
            assert result.name == sample_user.name
            mock_db.users.find_one.assert_called_once_with({"id": "user-123"})

        def test_raises_not_found_when_missing(self, user_service, mock_db):
            """Should raise UserNotFoundError when user doesn't exist."""
            # Arrange
            mock_db.users.find_one.return_value = None

            # Act & Assert
            with pytest.raises(UserNotFoundError) as exc_info:
                user_service.get_user("nonexistent")

            assert "nonexistent" in str(exc_info.value)

    class TestCreateUser:
        """Tests for create_user method."""

        def test_creates_user_with_valid_data(self, user_service, mock_db):
            """Should create user when data is valid."""
            # Arrange
            user_data = {"name": "New User", "email": "new@example.com"}
            mock_db.users.insert_one.return_value = Mock(inserted_id="new-id")

            # Act
            result = user_service.create_user(user_data)

            # Assert
            assert result.name == "New User"
            assert result.email == "new@example.com"
            mock_db.users.insert_one.assert_called_once()

        @pytest.mark.parametrize("invalid_email", [
            "",
            "not-an-email",
            "@missing-local.com",
            "missing-domain@",
            "spaces in@email.com"
        ])
        def test_raises_validation_error_for_invalid_email(
            self, user_service, invalid_email
        ):
            """Should raise ValidationError for invalid email formats."""
            with pytest.raises(ValidationError) as exc_info:
                user_service.create_user({"name": "Test", "email": invalid_email})

            assert "email" in str(exc_info.value).lower()

        def test_raises_validation_error_when_name_missing(self, user_service):
            """Should raise ValidationError when name is missing."""
            with pytest.raises(ValidationError) as exc_info:
                user_service.create_user({"email": "test@example.com"})

            assert "name" in str(exc_info.value).lower()

    class TestUpdateUser:
        """Tests for update_user method."""

        def test_updates_user_fields(self, user_service, mock_db, sample_user):
            """Should update specified fields."""
            # Arrange
            mock_db.users.find_one.return_value = sample_user.dict()
            mock_db.users.update_one.return_value = Mock(modified_count=1)

            # Act
            result = user_service.update_user("user-123", {"name": "Updated Name"})

            # Assert
            assert result.name == "Updated Name"
            mock_db.users.update_one.assert_called_once()

        def test_raises_not_found_for_nonexistent_user(self, user_service, mock_db):
            """Should raise UserNotFoundError when updating nonexistent user."""
            mock_db.users.find_one.return_value = None

            with pytest.raises(UserNotFoundError):
                user_service.update_user("nonexistent", {"name": "New"})


class TestAsyncOperations:
    """Tests for async methods."""

    @pytest.mark.asyncio
    async def test_fetch_user_async(self, user_service, mock_db, sample_user):
        """Should fetch user asynchronously."""
        mock_db.users.find_one = AsyncMock(return_value=sample_user.dict())

        result = await user_service.fetch_user_async("user-123")

        assert result.id == sample_user.id

    @pytest.mark.asyncio
    async def test_handles_timeout(self, user_service, mock_db):
        """Should handle timeout gracefully."""
        mock_db.users.find_one = AsyncMock(side_effect=TimeoutError())

        with pytest.raises(TimeoutError):
            await user_service.fetch_user_async("user-123")
```

---

## Coverage Analysis Report Template

```markdown
# Test Coverage Report

**Project:** {{project_name}}
**Date:** {{date}}
**Generated by:** Test Generator Agent v2.0

---

## Summary

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Statement Coverage | {{statements}}% | 90% | {{status}} |
| Branch Coverage | {{branches}}% | 85% | {{status}} |
| Function Coverage | {{functions}}% | 95% | {{status}} |
| Line Coverage | {{lines}}% | 90% | {{status}} |

---

## Coverage by File

| File | Statements | Branches | Functions | Status |
|------|------------|----------|-----------|--------|
{{file_coverage_table}}

---

## Uncovered Code

### Critical Gaps (Must Fix)

{{critical_gaps}}

### Suggested Tests to Add

{{suggested_tests}}

---

## Generated Tests

{{count}} new tests generated to improve coverage:

{{generated_tests_list}}
```

---

## Integration Examples

### CLI Usage
```bash
# Generate tests for a file
test-gen src/utils/validation.ts --framework vitest

# Generate tests for entire directory
test-gen src/components/ --coverage 90

# Fill coverage gaps
test-gen fill-gaps --report coverage/lcov-report

# Generate E2E tests
test-gen e2e --flows "login,checkout,profile"

# Generate mocks
test-gen mocks --deps "api,database,cache"

# Run and generate coverage
test-gen run --coverage --report
```

### GitHub Actions
```yaml
name: Auto Generate Tests

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check Coverage
        id: coverage
        run: |
          npm test -- --coverage --coverageReporters=json-summary
          echo "coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')" >> $GITHUB_OUTPUT

      - name: Generate Missing Tests
        if: steps.coverage.outputs.coverage < 80
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npx test-gen fill-gaps --target 80

      - name: Commit New Tests
        if: steps.coverage.outputs.coverage < 80
        run: |
          git add src/**/*.test.ts
          git commit -m "test: auto-generate tests to improve coverage"
          git push
```

---

## Deployment Checklist

- [ ] Test framework installed and configured
- [ ] Coverage tool configured
- [ ] Test scripts in package.json
- [ ] CI/CD integration configured
- [ ] Coverage thresholds set
- [ ] Mock utilities available
- [ ] Test database configured (integration tests)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Jan 2026 | Major upgrade with templates, fixtures, coverage analysis |
| 1.0.0 | Dec 2025 | Initial release |

---

*Test Generator Agent v2.0 - Bulletproof test suites, automatically*
