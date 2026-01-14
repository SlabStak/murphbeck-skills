# Performance Testing Templates

Production-ready performance testing with k6, Artillery, and Locust for load testing APIs.

## Overview

- **k6 Load Testing**: JavaScript-based performance testing
- **Artillery**: YAML-defined load scenarios
- **Locust**: Python load testing framework
- **Metrics & Analysis**: Performance metrics collection

## Quick Start

```bash
# k6
brew install k6
k6 run load-test.js

# Artillery
npm install -g artillery
artillery run scenario.yml

# Locust
pip install locust
locust -f locustfile.py
```

## k6 Load Testing

```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  scenarios: {
    // Smoke test
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },
    // Load test
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up
        { duration: '5m', target: 50 },   // Steady state
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'load' },
      startTime: '1m', // Start after smoke
    },
    // Stress test
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'stress' },
      startTime: '10m',
    },
    // Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 500 },  // Spike
        { duration: '30s', target: 10 },
      ],
      tags: { test_type: 'spike' },
      startTime: '25m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],
    api_latency: ['p(95)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Shared setup - runs once
export function setup() {
  // Login and get auth token
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: 'testpassword123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const token = loginRes.json('token');

  return { token };
}

// Main test function
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  group('User API', () => {
    // List users
    group('GET /api/users', () => {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/api/users?page=1&limit=20`, { headers });
      apiLatency.add(Date.now() - start);
      requestCount.add(1);

      const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
        'has users array': (r) => Array.isArray(r.json('data')),
      });

      errorRate.add(!success);
    });

    // Get single user
    group('GET /api/users/:id', () => {
      const userId = 'user-1';
      const res = http.get(`${BASE_URL}/api/users/${userId}`, { headers });
      requestCount.add(1);

      const success = check(res, {
        'status is 200 or 404': (r) => [200, 404].includes(r.status),
        'response time < 300ms': (r) => r.timings.duration < 300,
      });

      errorRate.add(!success);
    });

    sleep(1);
  });

  group('Order API', () => {
    // Create order
    group('POST /api/orders', () => {
      const orderData = {
        items: [
          { productId: 'prod-1', quantity: 1 },
          { productId: 'prod-2', quantity: 2 },
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          zip: '12345',
        },
      };

      const start = Date.now();
      const res = http.post(
        `${BASE_URL}/api/orders`,
        JSON.stringify(orderData),
        { headers }
      );
      apiLatency.add(Date.now() - start);
      requestCount.add(1);

      const success = check(res, {
        'status is 201': (r) => r.status === 201,
        'response time < 1000ms': (r) => r.timings.duration < 1000,
        'has order id': (r) => r.json('id') !== undefined,
      });

      errorRate.add(!success);
    });

    sleep(2);
  });
}

// Teardown - runs once
export function teardown(data) {
  // Cleanup if needed
  console.log(`Test completed. Token: ${data.token.substring(0, 10)}...`);
}

// Handle test summary
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  // Custom summary formatting
  return `
    ==================== Summary ====================
    Total Requests: ${data.metrics.requests.values.count}
    Success Rate: ${(1 - data.metrics.errors.values.rate) * 100}%
    P95 Latency: ${data.metrics.api_latency.values['p(95)']}ms
    ================================================
  `;
}
```

```javascript
// tests/performance/api-scenarios.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Load test data from CSV
const testUsers = new SharedArray('users', function () {
  return papaparse.parse(open('./test-data/users.csv'), { header: true }).data;
});

export const options = {
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 100,           // 100 requests per second
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
};

export default function () {
  // Pick random user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  // Simulate user session
  const session = {
    login: () => {
      return http.post('/api/auth/login', JSON.stringify({
        email: user.email,
        password: user.password,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    },

    browseProducts: (token) => {
      return http.get('/api/products?page=1&limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    viewProduct: (token, productId) => {
      return http.get(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    addToCart: (token, productId) => {
      return http.post('/api/cart/items', JSON.stringify({
        productId,
        quantity: 1,
      }), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    },
  };

  // Execute session
  const loginRes = session.login();
  check(loginRes, { 'login successful': (r) => r.status === 200 });

  if (loginRes.status === 200) {
    const token = loginRes.json('token');

    sleep(Math.random() * 2);

    const productsRes = session.browseProducts(token);
    check(productsRes, { 'products loaded': (r) => r.status === 200 });

    if (productsRes.status === 200) {
      const products = productsRes.json('data');
      if (products.length > 0) {
        const product = products[Math.floor(Math.random() * products.length)];

        sleep(Math.random() * 3);

        session.viewProduct(token, product.id);
        session.addToCart(token, product.id);
      }
    }
  }

  sleep(1);
}
```

## Artillery Load Testing

```yaml
# tests/performance/artillery/load-test.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load"
    - duration: 60
      arrivalRate: 50
      name: "Peak load"
    - duration: 60
      arrivalRate: 5
      name: "Cool down"

  defaults:
    headers:
      Content-Type: "application/json"

  variables:
    baseUrl: "{{ $processEnvironment.BASE_URL }}"

  plugins:
    expect: {}
    metrics-by-endpoint: {}

  ensure:
    p99: 1000
    maxErrorRate: 1

  payload:
    path: "./test-data/users.csv"
    fields:
      - "email"
      - "password"

scenarios:
  - name: "User Journey"
    weight: 70
    flow:
      # Login
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.token"
              as: "authToken"
          expect:
            - statusCode: 200

      - think: 2

      # Browse products
      - get:
          url: "/api/products?page=1&limit=20"
          headers:
            Authorization: "Bearer {{ authToken }}"
          capture:
            - json: "$.data[0].id"
              as: "productId"
          expect:
            - statusCode: 200
            - contentType: "application/json"

      - think: 3

      # View product detail
      - get:
          url: "/api/products/{{ productId }}"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200

      - think: 2

      # Add to cart
      - post:
          url: "/api/cart/items"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            productId: "{{ productId }}"
            quantity: 1
          expect:
            - statusCode: 201

  - name: "API Health Check"
    weight: 30
    flow:
      - get:
          url: "/health"
          expect:
            - statusCode: 200
            - hasProperty: "status"
```

```yaml
# tests/performance/artillery/stress-test.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 120
      arrivalRate: 100
    - duration: 120
      arrivalRate: 200
    - duration: 60
      arrivalRate: 10

  ensure:
    p99: 2000

scenarios:
  - name: "High Load Scenario"
    flow:
      - loop:
          - get:
              url: "/api/products"
          - think: 1
        count: 5
```

## Locust (Python)

```python
# tests/performance/locustfile.py
"""Locust load testing configuration."""
from locust import HttpUser, task, between, events
import random
import json
import logging


class WebsiteUser(HttpUser):
    """Simulated user behavior."""

    wait_time = between(1, 5)
    host = "http://localhost:3000"

    def on_start(self):
        """Login on start."""
        response = self.client.post("/api/auth/login", json={
            "email": f"user{random.randint(1, 1000)}@example.com",
            "password": "testpassword123",
        })

        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}

    @task(10)
    def browse_products(self):
        """Browse product listing."""
        with self.client.get(
            "/api/products",
            headers=self.headers,
            params={"page": random.randint(1, 10), "limit": 20},
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if len(data.get("data", [])) > 0:
                    response.success()
                else:
                    response.failure("Empty product list")
            else:
                response.failure(f"Status code: {response.status_code}")

    @task(5)
    def view_product(self):
        """View single product."""
        product_id = f"prod-{random.randint(1, 100)}"
        self.client.get(
            f"/api/products/{product_id}",
            headers=self.headers,
            name="/api/products/[id]",
        )

    @task(3)
    def search_products(self):
        """Search for products."""
        queries = ["laptop", "phone", "headphones", "keyboard", "monitor"]
        query = random.choice(queries)

        self.client.get(
            "/api/products/search",
            headers=self.headers,
            params={"q": query},
        )

    @task(2)
    def add_to_cart(self):
        """Add item to cart."""
        self.client.post(
            "/api/cart/items",
            headers=self.headers,
            json={
                "productId": f"prod-{random.randint(1, 100)}",
                "quantity": random.randint(1, 3),
            },
        )

    @task(1)
    def checkout(self):
        """Complete checkout."""
        with self.client.post(
            "/api/orders",
            headers=self.headers,
            json={
                "items": [
                    {"productId": "prod-1", "quantity": 1},
                ],
                "shippingAddress": {
                    "street": "123 Test St",
                    "city": "Test City",
                    "zip": "12345",
                },
            },
            catch_response=True,
        ) as response:
            if response.status_code == 201:
                response.success()
            elif response.status_code == 400:
                response.failure("Validation error")
            else:
                response.failure(f"Unexpected: {response.status_code}")


class AdminUser(HttpUser):
    """Admin user behavior."""

    wait_time = between(2, 10)
    weight = 1  # Lower weight than regular users

    def on_start(self):
        """Admin login."""
        response = self.client.post("/api/auth/login", json={
            "email": "admin@example.com",
            "password": "adminpassword123",
        })
        self.token = response.json().get("token", "")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task
    def view_analytics(self):
        """View analytics dashboard."""
        self.client.get("/api/admin/analytics", headers=self.headers)

    @task
    def list_users(self):
        """List all users."""
        self.client.get(
            "/api/admin/users",
            headers=self.headers,
            params={"page": 1, "limit": 50},
        )


# Event hooks
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts."""
    logging.info("Load test starting...")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops."""
    logging.info("Load test completed.")
    logging.info(f"Total requests: {environment.stats.total.num_requests}")
    logging.info(f"Failure rate: {environment.stats.total.fail_ratio * 100:.2f}%")


@events.request.add_listener
def on_request(request_type, name, response_time, response_length, **kwargs):
    """Called on each request."""
    if response_time > 1000:
        logging.warning(f"Slow request: {name} took {response_time}ms")
```

## CLAUDE.md Integration

```markdown
# Performance Testing

## Commands
- `k6 run load-test.js` - Run k6 tests
- `artillery run scenario.yml` - Run Artillery
- `locust -f locustfile.py` - Run Locust

## Test Types
- Smoke: Verify system works
- Load: Normal expected load
- Stress: Beyond normal capacity
- Spike: Sudden traffic bursts

## Key Metrics
- Response time (p50, p95, p99)
- Throughput (req/sec)
- Error rate
- Resource utilization
```

## AI Suggestions

1. **Baseline establishment** - Establish performance baselines
2. **Regression detection** - Detect performance regressions in CI
3. **Distributed testing** - Run tests from multiple locations
4. **Real user monitoring** - Compare synthetic vs real performance
5. **Database load testing** - Test database under load
6. **WebSocket testing** - Test WebSocket connections
7. **GraphQL performance** - Test GraphQL query complexity
8. **Caching validation** - Verify cache hit rates under load
9. **Auto-scaling tests** - Test auto-scaling behavior
10. **Cost analysis** - Calculate infrastructure costs under load
