# Snapshot Testing Templates

Production-ready snapshot testing patterns for UI components, API responses, and data structures.

## Overview

- **Component Snapshots**: React, Vue, Angular snapshot testing
- **API Response Snapshots**: REST and GraphQL response validation
- **Inline Snapshots**: Co-located snapshot assertions
- **Custom Serializers**: Domain-specific snapshot formats

## Quick Start

```bash
# Jest (built-in)
npm install -D jest @types/jest

# Vitest
npm install -D vitest

# Python
pip install snapshottest pytest-snapshot
```

## Jest Snapshot Testing

```typescript
// tests/components/UserProfile.snapshot.test.tsx
import { render } from '@testing-library/react';
import { UserProfile } from '../../src/components/UserProfile';

describe('UserProfile Snapshots', () => {
  it('renders default state', () => {
    const { container } = render(
      <UserProfile
        user={{
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://example.com/avatar.jpg',
        }}
      />
    );

    expect(container).toMatchSnapshot();
  });

  it('renders loading state', () => {
    const { container } = render(<UserProfile loading />);
    expect(container).toMatchSnapshot();
  });

  it('renders error state', () => {
    const { container } = render(
      <UserProfile error={new Error('Failed to load user')} />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders with different roles', () => {
    const roles = ['admin', 'user', 'guest'] as const;

    roles.forEach(role => {
      const { container } = render(
        <UserProfile
          user={{
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role,
          }}
        />
      );
      expect(container).toMatchSnapshot(`role: ${role}`);
    });
  });
});
```

```typescript
// tests/components/DataTable.snapshot.test.tsx
import { render } from '@testing-library/react';
import { DataTable } from '../../src/components/DataTable';

describe('DataTable Snapshots', () => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
  ];

  it('renders empty state', () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders with data', () => {
    const data = [
      { id: 1, name: 'Item 1', status: 'active' },
      { id: 2, name: 'Item 2', status: 'inactive' },
    ];

    const { container } = render(
      <DataTable columns={columns} data={data} />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders with pagination', () => {
    const data = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      status: i % 2 === 0 ? 'active' : 'inactive',
    }));

    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        pagination={{ page: 1, pageSize: 10, total: 50 }}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
```

## Inline Snapshots

```typescript
// tests/utils/formatters.snapshot.test.ts
import { formatCurrency, formatDate, formatNumber } from '../../src/utils/formatters';

describe('Formatter Snapshots', () => {
  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toMatchInlineSnapshot(`"$1,234.56"`);
    });

    it('formats EUR correctly', () => {
      expect(formatCurrency(1234.56, 'EUR')).toMatchInlineSnapshot(`"€1,234.56"`);
    });

    it('formats large numbers', () => {
      expect(formatCurrency(1234567.89, 'USD')).toMatchInlineSnapshot(
        `"$1,234,567.89"`
      );
    });

    it('formats negative numbers', () => {
      expect(formatCurrency(-1234.56, 'USD')).toMatchInlineSnapshot(`"-$1,234.56"`);
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-03-15T10:30:00Z');

    it('formats with default options', () => {
      expect(formatDate(testDate)).toMatchInlineSnapshot(`"March 15, 2024"`);
    });

    it('formats short date', () => {
      expect(formatDate(testDate, 'short')).toMatchInlineSnapshot(`"3/15/24"`);
    });

    it('formats with time', () => {
      expect(formatDate(testDate, 'datetime')).toMatchInlineSnapshot(
        `"March 15, 2024 at 10:30 AM"`
      );
    });
  });
});
```

```typescript
// tests/api/responses.snapshot.test.ts
import { transformUserResponse, transformOrderResponse } from '../../src/api/transformers';

describe('API Response Transformers', () => {
  it('transforms user response', () => {
    const apiResponse = {
      user_id: '123',
      first_name: 'John',
      last_name: 'Doe',
      email_address: 'john@example.com',
      created_timestamp: '2024-01-15T10:00:00Z',
      account_status: 'ACTIVE',
    };

    expect(transformUserResponse(apiResponse)).toMatchInlineSnapshot(`
      {
        "createdAt": "2024-01-15T10:00:00.000Z",
        "email": "john@example.com",
        "id": "123",
        "isActive": true,
        "name": "John Doe",
      }
    `);
  });

  it('transforms order response', () => {
    const apiResponse = {
      order_id: 'ORD-456',
      line_items: [
        { product_id: 'P1', qty: 2, unit_price: 29.99 },
        { product_id: 'P2', qty: 1, unit_price: 49.99 },
      ],
      total_amount: 109.97,
      order_status: 'SHIPPED',
    };

    expect(transformOrderResponse(apiResponse)).toMatchInlineSnapshot(`
      {
        "id": "ORD-456",
        "items": [
          {
            "price": 29.99,
            "productId": "P1",
            "quantity": 2,
            "total": 59.98,
          },
          {
            "price": 49.99,
            "productId": "P2",
            "quantity": 1,
            "total": 49.99,
          },
        ],
        "status": "shipped",
        "total": 109.97,
      }
    `);
  });
});
```

## Custom Serializers

```typescript
// tests/serializers/date.serializer.ts
import { NewPlugin } from 'pretty-format';

export const dateSerializer: NewPlugin = {
  test: (val): val is Date => val instanceof Date,
  serialize: (val: Date) => {
    return `Date<${val.toISOString()}>`;
  },
};

// jest.config.ts
export default {
  snapshotSerializers: ['./tests/serializers/date.serializer.ts'],
};
```

```typescript
// tests/serializers/user.serializer.ts
import { NewPlugin } from 'pretty-format';
import { User } from '../../src/types';

function isUser(val: unknown): val is User {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'email' in val &&
    'name' in val
  );
}

export const userSerializer: NewPlugin = {
  test: isUser,
  serialize: (user: User, config, indentation, depth, refs, printer) => {
    // Exclude sensitive fields from snapshots
    const { passwordHash, ...safeUser } = user;
    return `User ${printer(safeUser, config, indentation, depth, refs)}`;
  },
};
```

```typescript
// tests/serializers/react.serializer.ts
import { NewPlugin } from 'pretty-format';

// Remove dynamic attributes from snapshots
export const cleanReactSerializer: NewPlugin = {
  test: (val) => {
    return (
      typeof val === 'object' &&
      val !== null &&
      '$$typeof' in val
    );
  },
  serialize: (val, config, indentation, depth, refs, printer) => {
    // Clean up dynamic IDs and timestamps
    const cleaned = JSON.parse(
      JSON.stringify(val, (key, value) => {
        if (key === 'data-testid' && value.includes('-')) {
          return value.replace(/-[\w]+$/, '-[ID]');
        }
        if (key === 'key' && typeof value === 'string') {
          return '[KEY]';
        }
        return value;
      })
    );
    return printer(cleaned, config, indentation, depth, refs);
  },
};
```

## API Response Snapshots

```typescript
// tests/api/users.api.snapshot.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { createTestUser, generateAuthToken } from '../helpers';

describe('Users API Snapshots', () => {
  let authToken: string;

  beforeAll(async () => {
    const user = await createTestUser({ role: 'admin' });
    authToken = generateAuthToken(user);
  });

  it('GET /api/users response structure', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ limit: 2 });

    // Snapshot the structure, not exact values
    const snapshot = {
      status: response.status,
      headers: {
        contentType: response.headers['content-type'],
      },
      body: {
        ...response.body,
        data: response.body.data.map((user: any) => ({
          ...user,
          id: '[ID]',
          email: '[EMAIL]',
          createdAt: '[TIMESTAMP]',
          updatedAt: '[TIMESTAMP]',
        })),
      },
    };

    expect(snapshot).toMatchSnapshot();
  });

  it('GET /api/users/:id response structure', async () => {
    const user = await createTestUser();

    const response = await request(app)
      .get(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect({
      status: response.status,
      body: {
        ...response.body,
        id: '[ID]',
        email: '[EMAIL]',
        createdAt: '[TIMESTAMP]',
        updatedAt: '[TIMESTAMP]',
      },
    }).toMatchSnapshot();
  });

  it('POST /api/users error response', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'invalid',
        name: '',
      });

    expect({
      status: response.status,
      body: response.body,
    }).toMatchSnapshot();
  });
});
```

## Python Snapshot Testing

```python
# tests/test_snapshots.py
"""Snapshot tests using pytest-snapshot."""
import pytest
from app.serializers import UserSerializer, OrderSerializer
from tests.factories import UserFactory, OrderFactory


class TestUserSnapshots:
    """Snapshot tests for user serialization."""

    def test_user_serialization(self, snapshot):
        """Test user serialization output."""
        user = UserFactory.build(
            id="user-123",
            name="John Doe",
            email="john@example.com",
            role="admin",
        )

        result = UserSerializer().dump(user)
        snapshot.assert_match(result, "user_serialization")

    def test_user_list_serialization(self, snapshot):
        """Test user list serialization."""
        users = UserFactory.build_batch(3)

        # Normalize dynamic values for consistent snapshots
        result = UserSerializer(many=True).dump(users)
        normalized = [
            {**u, "id": f"user-{i}", "created_at": "[TIMESTAMP]"}
            for i, u in enumerate(result)
        ]

        snapshot.assert_match(normalized, "user_list_serialization")


class TestOrderSnapshots:
    """Snapshot tests for order serialization."""

    def test_order_serialization(self, snapshot):
        """Test order serialization output."""
        order = OrderFactory.build(
            id="order-456",
            status="completed",
        )

        result = OrderSerializer().dump(order)
        snapshot.assert_match(result, "order_serialization")

    def test_order_with_items(self, snapshot):
        """Test order with items serialization."""
        order = OrderFactory.build(with_many_items=True)

        result = OrderSerializer().dump(order)
        # Normalize item IDs
        result["items"] = [
            {**item, "id": f"item-{i}"}
            for i, item in enumerate(result["items"])
        ]

        snapshot.assert_match(result, "order_with_items")
```

```python
# tests/conftest.py
"""Pytest configuration for snapshot testing."""
import pytest
import json
from pathlib import Path


@pytest.fixture
def snapshot(request):
    """Custom snapshot fixture."""
    return SnapshotAssertion(request)


class SnapshotAssertion:
    """Custom snapshot assertion class."""

    def __init__(self, request):
        self.request = request
        self.snapshot_dir = Path(request.fspath).parent / "__snapshots__"
        self.test_name = request.node.name

    def assert_match(self, value, name: str):
        """Assert value matches snapshot."""
        self.snapshot_dir.mkdir(exist_ok=True)
        snapshot_file = self.snapshot_dir / f"{self.test_name}_{name}.json"

        if snapshot_file.exists():
            expected = json.loads(snapshot_file.read_text())
            assert value == expected, f"Snapshot mismatch for {name}"
        else:
            # Create new snapshot
            snapshot_file.write_text(json.dumps(value, indent=2, default=str))
            pytest.skip(f"Created new snapshot: {snapshot_file}")

    def update(self, value, name: str):
        """Force update snapshot."""
        self.snapshot_dir.mkdir(exist_ok=True)
        snapshot_file = self.snapshot_dir / f"{self.test_name}_{name}.json"
        snapshot_file.write_text(json.dumps(value, indent=2, default=str))
```

## Snapshot Update Strategies

```typescript
// tests/utils/snapshot-helpers.ts
import { toMatchSnapshot } from 'jest-snapshot';

/**
 * Create deterministic snapshot by replacing dynamic values
 */
export function createDeterministicSnapshot<T extends object>(
  obj: T,
  replacements: Record<string, unknown> = {}
): T {
  const defaults = {
    id: '[ID]',
    uuid: '[UUID]',
    createdAt: '[TIMESTAMP]',
    updatedAt: '[TIMESTAMP]',
    timestamp: '[TIMESTAMP]',
    token: '[TOKEN]',
    ...replacements,
  };

  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (key in defaults) {
        return defaults[key];
      }
      // Handle ISO date strings
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return '[TIMESTAMP]';
      }
      // Handle UUIDs
      if (
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
      ) {
        return '[UUID]';
      }
      return value;
    })
  );
}

/**
 * Snapshot matcher that ignores specified fields
 */
export function toMatchSnapshotExcluding(
  received: object,
  excludeFields: string[]
) {
  const filtered = Object.fromEntries(
    Object.entries(received).filter(([key]) => !excludeFields.includes(key))
  );
  return toMatchSnapshot.call(this, filtered);
}
```

```typescript
// tests/components/with-snapshot-helpers.test.tsx
import { render } from '@testing-library/react';
import { createDeterministicSnapshot } from '../utils/snapshot-helpers';
import { OrderSummary } from '../../src/components/OrderSummary';

describe('OrderSummary with helpers', () => {
  it('renders order correctly', () => {
    const order = {
      id: 'ord-abc123',
      createdAt: new Date().toISOString(),
      items: [
        { id: 'item-1', name: 'Product A', price: 29.99 },
        { id: 'item-2', name: 'Product B', price: 49.99 },
      ],
      total: 79.98,
    };

    const { container } = render(<OrderSummary order={order} />);

    // Use deterministic snapshot
    const snapshot = createDeterministicSnapshot({
      html: container.innerHTML,
      order,
    });

    expect(snapshot).toMatchSnapshot();
  });
});
```

## Jest Configuration for Snapshots

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  // Snapshot configuration
  snapshotSerializers: [
    '@emotion/jest/serializer',
    './tests/serializers/date.serializer.ts',
    './tests/serializers/user.serializer.ts',
  ],

  // Snapshot format
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: false,
  },

  // Snapshot resolver for custom paths
  snapshotResolver: './tests/snapshot-resolver.ts',
};

export default config;
```

```typescript
// tests/snapshot-resolver.ts
import path from 'path';

export default {
  // Where to store snapshots
  resolveSnapshotPath: (testPath: string, snapshotExtension: string) => {
    const snapshotDir = path.join(
      path.dirname(testPath),
      '__snapshots__'
    );
    const testName = path.basename(testPath);
    return path.join(snapshotDir, testName + snapshotExtension);
  },

  // How to find test from snapshot
  resolveTestPath: (snapshotPath: string, snapshotExtension: string) => {
    const testDir = path.dirname(path.dirname(snapshotPath));
    const testName = path.basename(snapshotPath, snapshotExtension);
    return path.join(testDir, testName);
  },

  testPathForConsistencyCheck: 'tests/example.test.ts',
};
```

## CLAUDE.md Integration

```markdown
# Snapshot Testing

## Commands
- `npm test -- -u` - Update all snapshots
- `npm test -- --updateSnapshot` - Update snapshots
- `npm test -- --testNamePattern="UserProfile"` - Test specific snapshots
- `pytest --snapshot-update` - Update Python snapshots

## Best Practices
- Use inline snapshots for small, stable values
- Use file snapshots for complex structures
- Create custom serializers for domain objects
- Normalize dynamic values (IDs, timestamps)

## Snapshot Review
- Review snapshot changes in PRs
- Don't auto-approve snapshot updates
- Use meaningful snapshot names
- Keep snapshots readable
```

## AI Suggestions

1. **Snapshot diff visualization** - Enhanced diff display for large snapshots
2. **Snapshot migration** - Tools to migrate between snapshot formats
3. **Snapshot compression** - Compress large snapshot files
4. **Snapshot search** - Search across snapshot files
5. **Snapshot statistics** - Track snapshot size and update frequency
6. **Snapshot approval workflow** - PR-based snapshot approval
7. **Snapshot coverage** - Track what's covered by snapshots
8. **Snapshot deduplication** - Find and consolidate similar snapshots
9. **Snapshot validation** - Validate snapshot structure against schema
10. **Snapshot documentation** - Auto-generate docs from snapshots
