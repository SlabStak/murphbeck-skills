# Testing Templates

Comprehensive testing configurations for Vitest, Playwright, Jest, and pytest.

## Vitest (Unit & Integration Tests)

### Setup Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Environment
    environment: 'jsdom',

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Global APIs
    globals: true,

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Include/exclude patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'e2e'],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporters
    reporters: ['default', 'html'],
    outputFile: {
      html: './coverage/test-report.html',
    },

    // Pool options
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
})
```

### Setup File

```typescript
// tests/setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

vi.stubGlobal('ResizeObserver', MockResizeObserver)

// Mock fetch
global.fetch = vi.fn()
```

### Test Utilities

```typescript
// tests/utils.tsx
import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

type AllProvidersProps = {
  children: ReactNode
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
```

### Component Test Example

```typescript
// src/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../tests/utils'
import { Button } from './Button'

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200')
  })
})
```

### Hook Test Example

```typescript
// src/hooks/useCounter.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('starts with initial value', () => {
    const { result } = renderHook(() => useCounter(10))
    expect(result.current.count).toBe(10)
  })

  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0))

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5))

    act(() => {
      result.current.decrement()
    })

    expect(result.current.count).toBe(4)
  })

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10))

    act(() => {
      result.current.increment()
      result.current.increment()
      result.current.reset()
    })

    expect(result.current.count).toBe(10)
  })
})
```

### API Test Example

```typescript
// src/lib/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, ApiError } from './api'

describe('api', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('makes GET request', async () => {
    const mockData = { id: 1, name: 'Test' }

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response)

    const result = await api.get('/users/1')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.objectContaining({ method: 'GET' })
    )
    expect(result).toEqual(mockData)
  })

  it('makes POST request with body', async () => {
    const requestBody = { name: 'New User', email: 'test@example.com' }
    const mockResponse = { id: 1, ...requestBody }

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await api.post('/users', requestBody)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('throws ApiError on error response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found' }),
    } as Response)

    await expect(api.get('/users/999')).rejects.toThrow(ApiError)
  })

  it('includes auth header when token provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)

    await api.get('/protected', { token: 'test-token' })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })
})
```

## Playwright (E2E Tests)

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
```

### Authentication Setup

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Navigate to login
  await page.goto('/login')

  // Fill in credentials
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByLabel('Password').fill('testpassword123')

  // Submit form
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
```

### Page Object Model

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: 'Sign in' })
    this.errorMessage = page.getByRole('alert')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message)
  }

  async expectSuccess() {
    await this.page.waitForURL('/dashboard')
  }
}
```

```typescript
// e2e/pages/DashboardPage.ts
import { Page, Locator, expect } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly userMenu: Locator
  readonly logoutButton: Locator
  readonly createButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Dashboard' })
    this.userMenu = page.getByTestId('user-menu')
    this.logoutButton = page.getByRole('menuitem', { name: 'Log out' })
    this.createButton = page.getByRole('button', { name: 'Create' })
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  async logout() {
    await this.userMenu.click()
    await this.logoutButton.click()
    await this.page.waitForURL('/login')
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
  }
}
```

### E2E Test Examples

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

test.describe('Authentication', () => {
  test('user can log in with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const dashboardPage = new DashboardPage(page)

    await loginPage.goto()
    await loginPage.login('test@example.com', 'testpassword123')
    await dashboardPage.expectLoaded()
  })

  test('shows error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()
    await loginPage.login('wrong@example.com', 'wrongpassword')
    await loginPage.expectError('Invalid email or password')
  })

  test('user can log out', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)

    await dashboardPage.goto()
    await dashboardPage.logout()
    await expect(page).toHaveURL('/login')
  })
})
```

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()
  })

  test('displays user data', async ({ page }) => {
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByTestId('stats-card')).toHaveCount(4)
  })

  test('can create new item', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)

    await dashboardPage.createButton.click()

    // Fill modal form
    await page.getByLabel('Name').fill('New Item')
    await page.getByLabel('Description').fill('Test description')
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify item created
    await expect(page.getByText('New Item')).toBeVisible()
  })

  test('can filter items', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Search' }).fill('test')
    await page.keyboard.press('Enter')

    // Wait for filtered results
    await expect(page.getByTestId('item-row')).toHaveCount(2)
  })

  test('responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    // Sidebar should be hidden
    await expect(page.getByTestId('sidebar')).not.toBeVisible()

    // Mobile menu should appear
    await expect(page.getByTestId('mobile-menu-button')).toBeVisible()
  })
})
```

### Visual Regression Tests

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Visual Regression', () => {
  test('homepage matches snapshot', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
    })
  })

  test('dashboard matches snapshot', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveScreenshot('dashboard.png', {
      mask: [page.locator('[data-testid="dynamic-date"]')],
    })
  })

  test('components match snapshots', async ({ page }) => {
    await page.goto('/components')

    for (const component of ['button', 'card', 'input']) {
      await expect(page.getByTestId(component)).toHaveScreenshot(
        `${component}.png`
      )
    }
  })
})
```

## Jest (Legacy/Alternative)

### Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
}
```

## Pytest (Python)

### Configuration

```ini
# pytest.ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --tb=short
    --strict-markers
    --cov=app
    --cov-report=term-missing
    --cov-report=html
    --cov-fail-under=80
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
filterwarnings =
    ignore::DeprecationWarning
```

### Fixtures

```python
# tests/conftest.py
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.db.session import get_db
from app.models.base import Base
from app.core.security import hash_password

TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test"

test_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
async def setup_database() -> AsyncGenerator[None, None]:
    """Create test database tables."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(setup_database: None) -> AsyncGenerator[AsyncSession, None]:
    """Get a test database session."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Get a test client with overridden dependencies."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> dict:
    """Create a test user."""
    from app.models.user import User
    from ulid import ULID

    user = User(
        id=str(ULID()),
        email="test@example.com",
        hashed_password=hash_password("testpassword123"),
        name="Test User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return {"user": user, "password": "testpassword123"}


@pytest.fixture
async def auth_headers(client: AsyncClient, test_user: dict) -> dict:
    """Get authentication headers for test user."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user["user"].email,
            "password": test_user["password"],
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

### Test Examples

```python
# tests/test_auth.py
import pytest
from httpx import AsyncClient


class TestAuth:
    """Authentication tests."""

    async def test_register_new_user(self, client: AsyncClient):
        """Test user registration."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "new@example.com",
                "password": "newpassword123",
                "name": "New User",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_register_duplicate_email(
        self, client: AsyncClient, test_user: dict
    ):
        """Test registration with existing email fails."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user["user"].email,
                "password": "somepassword123",
            },
        )

        assert response.status_code == 409

    async def test_login_valid_credentials(
        self, client: AsyncClient, test_user: dict
    ):
        """Test login with valid credentials."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user["user"].email,
                "password": test_user["password"],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials fails."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "wrong@example.com",
                "password": "wrongpassword",
            },
        )

        assert response.status_code == 401

    async def test_refresh_token(
        self, client: AsyncClient, test_user: dict
    ):
        """Test token refresh."""
        # First login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user["user"].email,
                "password": test_user["password"],
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        # Refresh
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )

        assert response.status_code == 200
        assert "access_token" in response.json()
```

## Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug",
    "e2e:report": "playwright show-report"
  }
}
```
