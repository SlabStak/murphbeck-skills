# Mocking Templates

Production-ready mocking patterns with Jest, MSW, and Python unittest.mock.

## Overview

- **Jest Mocking**: Module and function mocks
- **MSW (Mock Service Worker)**: API mocking for tests
- **Python Mocking**: unittest.mock and pytest-mock
- **Test Doubles**: Stubs, spies, and fakes

## Quick Start

```bash
# MSW
npm install -D msw

# Python
pip install pytest-mock responses
```

## Jest Mocking

```typescript
// tests/mocks/user-service.mock.ts
import { UserService } from '../../src/services/user-service';

export const createMockUserService = (): jest.Mocked<UserService> => ({
  getUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  listUsers: jest.fn(),
});

// Auto-mock the entire module
jest.mock('../../src/services/user-service', () => ({
  UserService: jest.fn().mockImplementation(() => createMockUserService()),
}));
```

```typescript
// tests/unit/order-service.test.ts
import { OrderService } from '../../src/services/order-service';
import { UserService } from '../../src/services/user-service';
import { PaymentService } from '../../src/services/payment-service';
import { EmailService } from '../../src/services/email-service';

// Mock dependencies
jest.mock('../../src/services/user-service');
jest.mock('../../src/services/payment-service');
jest.mock('../../src/services/email-service');

describe('OrderService', () => {
  let orderService: OrderService;
  let mockUserService: jest.Mocked<UserService>;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Get mocked instances
    mockUserService = new UserService() as jest.Mocked<UserService>;
    mockPaymentService = new PaymentService() as jest.Mocked<PaymentService>;
    mockEmailService = new EmailService() as jest.Mocked<EmailService>;

    orderService = new OrderService(
      mockUserService,
      mockPaymentService,
      mockEmailService
    );
  });

  describe('createOrder', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test' };
    const mockOrder = { id: 'order-1', userId: 'user-1', total: 100 };

    it('creates order successfully', async () => {
      // Arrange
      mockUserService.getUser.mockResolvedValue(mockUser);
      mockPaymentService.charge.mockResolvedValue({ success: true, transactionId: 'tx-1' });
      mockEmailService.sendOrderConfirmation.mockResolvedValue(undefined);

      // Act
      const result = await orderService.createOrder('user-1', [
        { productId: 'prod-1', quantity: 2, price: 50 },
      ]);

      // Assert
      expect(result).toMatchObject({
        userId: 'user-1',
        status: 'confirmed',
      });

      expect(mockUserService.getUser).toHaveBeenCalledWith('user-1');
      expect(mockPaymentService.charge).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 100 })
      );
      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(Object)
      );
    });

    it('fails when user not found', async () => {
      mockUserService.getUser.mockResolvedValue(null);

      await expect(
        orderService.createOrder('invalid-user', [])
      ).rejects.toThrow('User not found');

      expect(mockPaymentService.charge).not.toHaveBeenCalled();
    });

    it('fails when payment fails', async () => {
      mockUserService.getUser.mockResolvedValue(mockUser);
      mockPaymentService.charge.mockResolvedValue({ success: false, error: 'Declined' });

      await expect(
        orderService.createOrder('user-1', [{ productId: 'prod-1', quantity: 1, price: 100 }])
      ).rejects.toThrow('Payment failed');

      expect(mockEmailService.sendOrderConfirmation).not.toHaveBeenCalled();
    });

    it('continues if email fails', async () => {
      mockUserService.getUser.mockResolvedValue(mockUser);
      mockPaymentService.charge.mockResolvedValue({ success: true, transactionId: 'tx-1' });
      mockEmailService.sendOrderConfirmation.mockRejectedValue(new Error('SMTP error'));

      // Should not throw
      const result = await orderService.createOrder('user-1', [
        { productId: 'prod-1', quantity: 1, price: 100 },
      ]);

      expect(result.status).toBe('confirmed');
    });
  });
});
```

```typescript
// tests/mocks/fetch.mock.ts
// Mock global fetch

export const mockFetch = (responses: Record<string, any>) => {
  global.fetch = jest.fn((url: string) => {
    const response = responses[url];

    if (!response) {
      return Promise.reject(new Error(`No mock for ${url}`));
    }

    return Promise.resolve({
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(JSON.stringify(response.data)),
    } as Response);
  });

  return global.fetch as jest.Mock;
};

// Usage
describe('API Client', () => {
  beforeEach(() => {
    mockFetch({
      'https://api.example.com/users': {
        data: [{ id: 1, name: 'Test User' }],
      },
      'https://api.example.com/users/1': {
        data: { id: 1, name: 'Test User' },
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches users', async () => {
    const response = await fetch('https://api.example.com/users');
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Test User');
  });
});
```

## MSW (Mock Service Worker)

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET /api/users
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;

    return HttpResponse.json({
      data: [
        { id: '1', name: 'User 1', email: 'user1@example.com' },
        { id: '2', name: 'User 2', email: 'user2@example.com' },
      ],
      pagination: { page, limit, total: 2 },
    });
  }),

  // GET /api/users/:id
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;

    if (id === 'not-found') {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      id,
      name: 'Test User',
      email: 'test@example.com',
    });
  }),

  // POST /api/users
  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as any;

    if (!body.email || !body.name) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        id: 'new-user-id',
        ...body,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // PATCH /api/users/:id
  http.patch('/api/users/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;

    return HttpResponse.json({
      id,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  // DELETE /api/users/:id
  http.delete('/api/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Simulated network error
  http.get('/api/error', () => {
    return HttpResponse.error();
  }),

  // Simulated delay
  http.get('/api/slow', async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return HttpResponse.json({ message: 'Slow response' });
  }),
];
```

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// tests/setup.ts
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```typescript
// tests/integration/user-api.msw.test.ts
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { apiClient } from '../../src/api-client';

describe('User API with MSW', () => {
  it('fetches users', async () => {
    const users = await apiClient.getUsers();

    expect(users.data).toHaveLength(2);
    expect(users.data[0].name).toBe('User 1');
  });

  it('handles user not found', async () => {
    await expect(apiClient.getUser('not-found')).rejects.toThrow('User not found');
  });

  it('creates user', async () => {
    const user = await apiClient.createUser({
      email: 'new@example.com',
      name: 'New User',
    });

    expect(user.id).toBe('new-user-id');
    expect(user.email).toBe('new@example.com');
  });

  it('handles server error', async () => {
    // Override handler for this test
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    await expect(apiClient.getUsers()).rejects.toThrow('Server error');
  });

  it('handles network failure', async () => {
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.error();
      })
    );

    await expect(apiClient.getUsers()).rejects.toThrow(/network/i);
  });
});
```

## Python Mocking

```python
# tests/conftest.py
"""Pytest mocking configuration."""
import pytest
from unittest.mock import MagicMock, AsyncMock, patch


@pytest.fixture
def mock_user_repository():
    """Mock user repository."""
    mock = MagicMock()
    mock.find_by_id = MagicMock(return_value=None)
    mock.find_by_email = MagicMock(return_value=None)
    mock.create = MagicMock()
    mock.update = MagicMock()
    mock.delete = MagicMock()
    return mock


@pytest.fixture
def mock_email_service():
    """Mock email service."""
    mock = MagicMock()
    mock.send = MagicMock(return_value=True)
    mock.send_async = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def mock_external_api(mocker):
    """Mock external API calls."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"data": "test"}

    return mocker.patch(
        "requests.get",
        return_value=mock_response,
    )
```

```python
# tests/unit/test_order_service.py
"""Order service unit tests with mocking."""
import pytest
from unittest.mock import MagicMock, AsyncMock, patch, call
from datetime import datetime
from decimal import Decimal

from services.order_service import OrderService
from models.order import Order, OrderItem
from exceptions import PaymentError, UserNotFoundError


class TestOrderService:
    """Tests for OrderService."""

    @pytest.fixture
    def order_service(
        self,
        mock_user_repository,
        mock_email_service,
    ):
        """Create order service with mocked dependencies."""
        mock_payment_service = MagicMock()
        mock_order_repository = MagicMock()

        return OrderService(
            user_repo=mock_user_repository,
            order_repo=mock_order_repository,
            payment_service=mock_payment_service,
            email_service=mock_email_service,
        )

    @pytest.fixture
    def sample_user(self):
        """Sample user for tests."""
        return {
            "id": "user-1",
            "email": "test@example.com",
            "name": "Test User",
        }

    def test_create_order_success(
        self,
        order_service,
        mock_user_repository,
        mock_email_service,
        sample_user,
    ):
        """Test successful order creation."""
        # Arrange
        mock_user_repository.find_by_id.return_value = sample_user
        order_service.payment_service.charge.return_value = {
            "success": True,
            "transaction_id": "tx-123",
        }
        order_service.order_repo.create.return_value = Order(
            id="order-1",
            user_id="user-1",
            status="confirmed",
        )

        items = [
            {"product_id": "prod-1", "quantity": 2, "price": Decimal("50.00")},
        ]

        # Act
        order = order_service.create_order("user-1", items)

        # Assert
        assert order.status == "confirmed"
        mock_user_repository.find_by_id.assert_called_once_with("user-1")
        order_service.payment_service.charge.assert_called_once()
        mock_email_service.send.assert_called_once()

    def test_create_order_user_not_found(
        self,
        order_service,
        mock_user_repository,
    ):
        """Test order creation with non-existent user."""
        mock_user_repository.find_by_id.return_value = None

        with pytest.raises(UserNotFoundError):
            order_service.create_order("invalid-user", [])

        order_service.payment_service.charge.assert_not_called()

    def test_create_order_payment_failed(
        self,
        order_service,
        mock_user_repository,
        mock_email_service,
        sample_user,
    ):
        """Test order creation with payment failure."""
        mock_user_repository.find_by_id.return_value = sample_user
        order_service.payment_service.charge.return_value = {
            "success": False,
            "error": "Card declined",
        }

        items = [{"product_id": "prod-1", "quantity": 1, "price": Decimal("100.00")}]

        with pytest.raises(PaymentError, match="Card declined"):
            order_service.create_order("user-1", items)

        mock_email_service.send.assert_not_called()

    def test_create_order_email_failure_continues(
        self,
        order_service,
        mock_user_repository,
        mock_email_service,
        sample_user,
    ):
        """Test order continues if email fails."""
        mock_user_repository.find_by_id.return_value = sample_user
        order_service.payment_service.charge.return_value = {
            "success": True,
            "transaction_id": "tx-123",
        }
        order_service.order_repo.create.return_value = Order(
            id="order-1",
            user_id="user-1",
            status="confirmed",
        )
        mock_email_service.send.side_effect = Exception("SMTP error")

        items = [{"product_id": "prod-1", "quantity": 1, "price": Decimal("100.00")}]

        # Should not raise
        order = order_service.create_order("user-1", items)
        assert order.status == "confirmed"


class TestOrderServiceWithPatch:
    """Tests using patch decorator."""

    @patch("services.order_service.PaymentService")
    @patch("services.order_service.EmailService")
    def test_with_patch_decorator(
        self,
        mock_email_cls,
        mock_payment_cls,
    ):
        """Test using patch decorator."""
        mock_payment_cls.return_value.charge.return_value = {"success": True}
        mock_email_cls.return_value.send.return_value = True

        # Test implementation...

    def test_with_context_manager(self):
        """Test using patch as context manager."""
        with patch("services.order_service.datetime") as mock_datetime:
            mock_datetime.now.return_value = datetime(2024, 1, 15, 12, 0, 0)

            # Test implementation that uses datetime.now()


class TestAsyncMocking:
    """Tests for async mocking."""

    @pytest.fixture
    def async_order_service(self):
        """Create async order service."""
        from services.async_order_service import AsyncOrderService

        return AsyncOrderService(
            user_repo=AsyncMock(),
            order_repo=AsyncMock(),
            payment_service=AsyncMock(),
            email_service=AsyncMock(),
        )

    @pytest.mark.asyncio
    async def test_async_create_order(self, async_order_service):
        """Test async order creation."""
        async_order_service.user_repo.find_by_id.return_value = {
            "id": "user-1",
            "email": "test@example.com",
        }
        async_order_service.payment_service.charge.return_value = {"success": True}
        async_order_service.order_repo.create.return_value = Order(
            id="order-1",
            user_id="user-1",
            status="confirmed",
        )

        order = await async_order_service.create_order("user-1", [])

        assert order.status == "confirmed"
        async_order_service.user_repo.find_by_id.assert_awaited_once_with("user-1")
```

## CLAUDE.md Integration

```markdown
# Mocking Integration

## Commands
- `npm test` - Run tests with mocks
- `pytest --cov` - Run Python tests

## Mocking Patterns
- Mock external dependencies
- Use MSW for API mocking
- Spy on function calls
- Verify mock interactions

## Best Practices
- Don't mock what you don't own
- Keep mocks simple
- Verify important interactions
- Reset mocks between tests
```

## AI Suggestions

1. **Auto-generate mocks** - Generate mocks from TypeScript interfaces
2. **Mock factories** - Create reusable mock factories
3. **Snapshot mocks** - Record and replay API responses
4. **Time mocking** - Comprehensive date/time mocking
5. **File system mocks** - Mock fs operations
6. **Database mocks** - In-memory database alternatives
7. **Event mocking** - Mock event emitters
8. **Stream mocking** - Mock readable/writable streams
9. **WebSocket mocking** - Mock WebSocket connections
10. **Third-party mocks** - Pre-built mocks for common libraries
