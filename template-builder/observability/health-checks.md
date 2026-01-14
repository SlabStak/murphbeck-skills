# Health Checks Template

## Overview
Comprehensive health check system with liveness, readiness, and startup probes. Includes dependency checks, degraded state handling, and Kubernetes-compatible endpoints.

## Installation

```bash
npm install @godaddy/terminus express
npm install --save-dev @types/express
```

## Environment Variables

```env
# Health Check Configuration
HEALTH_CHECK_PORT=8080
HEALTH_CHECK_PATH=/health
READINESS_PATH=/ready
LIVENESS_PATH=/live
STARTUP_PATH=/startup

# Timeouts
HEALTH_CHECK_TIMEOUT=5000
DB_HEALTH_TIMEOUT=3000
REDIS_HEALTH_TIMEOUT=2000
EXTERNAL_API_TIMEOUT=5000

# Thresholds
MEMORY_THRESHOLD_MB=512
CPU_THRESHOLD_PERCENT=90
```

## Project Structure

```
lib/
├── health/
│   ├── index.ts
│   ├── server.ts
│   ├── types.ts
│   ├── checks/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── external-api.ts
│   │   ├── memory.ts
│   │   ├── disk.ts
│   │   └── custom.ts
│   ├── probes/
│   │   ├── liveness.ts
│   │   ├── readiness.ts
│   │   └── startup.ts
│   └── handlers/
│       ├── nextjs.ts
│       └── express.ts
```

## Type Definitions

```typescript
// lib/health/types.ts

export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  duration?: number;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  status: HealthStatus;
  timestamp: Date;
  uptime: number;
  version: string;
  checks: HealthCheckResult[];
  memory?: MemoryInfo;
}

export interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  critical?: boolean;
  timeout?: number;
}

export interface HealthConfig {
  livenessChecks: HealthCheck[];
  readinessChecks: HealthCheck[];
  startupChecks: HealthCheck[];
  timeout: number;
  gracefulShutdownTimeout: number;
  onShutdown?: () => Promise<void>;
  onSignal?: () => Promise<void>;
}

export interface ProbeConfig {
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
}
```

## Core Health Check System

```typescript
// lib/health/index.ts

import { HealthCheck, HealthCheckResult, HealthResponse, HealthStatus } from './types';

const startTime = Date.now();

export async function runHealthChecks(
  checks: HealthCheck[],
  timeout: number = 5000
): Promise<HealthResponse> {
  const results = await Promise.all(
    checks.map((check) => runSingleCheck(check, timeout))
  );

  const overallStatus = determineOverallStatus(results, checks);

  return {
    status: overallStatus,
    timestamp: new Date(),
    uptime: (Date.now() - startTime) / 1000,
    version: process.env.npm_package_version || '0.0.0',
    checks: results,
    memory: getMemoryInfo(),
  };
}

async function runSingleCheck(
  check: HealthCheck,
  timeout: number
): Promise<HealthCheckResult> {
  const start = Date.now();
  const checkTimeout = check.timeout || timeout;

  try {
    const result = await Promise.race([
      check.check(),
      new Promise<HealthCheckResult>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Health check timed out after ${checkTimeout}ms`)),
          checkTimeout
        )
      ),
    ]);

    return {
      ...result,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: check.name,
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  }
}

function determineOverallStatus(
  results: HealthCheckResult[],
  checks: HealthCheck[]
): HealthStatus {
  const criticalChecks = checks.filter((c) => c.critical !== false);
  const criticalResults = results.filter((r) =>
    criticalChecks.some((c) => c.name === r.name)
  );

  // If any critical check is unhealthy, overall is unhealthy
  if (criticalResults.some((r) => r.status === 'unhealthy')) {
    return 'unhealthy';
  }

  // If any check is degraded or any non-critical is unhealthy, overall is degraded
  if (
    results.some((r) => r.status === 'degraded') ||
    results.some(
      (r) =>
        r.status === 'unhealthy' &&
        !criticalChecks.some((c) => c.name === r.name)
    )
  ) {
    return 'degraded';
  }

  return 'healthy';
}

function getMemoryInfo() {
  const memUsage = process.memoryUsage();
  return {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
    rss: Math.round(memUsage.rss / 1024 / 1024),
  };
}

// Quick check for liveness (just verify process is running)
export function livenessCheck(): HealthCheckResult {
  return {
    name: 'liveness',
    status: 'healthy',
    timestamp: new Date(),
  };
}
```

## Database Health Check

```typescript
// lib/health/checks/database.ts

import { HealthCheck, HealthCheckResult } from '../types';

export function createDatabaseCheck(
  db: any,
  name: string = 'database'
): HealthCheck {
  return {
    name,
    critical: true,
    timeout: parseInt(process.env.DB_HEALTH_TIMEOUT || '3000', 10),
    check: async (): Promise<HealthCheckResult> => {
      try {
        const start = Date.now();

        // For Prisma
        if (db.$queryRaw) {
          await db.$queryRaw`SELECT 1`;
        }
        // For pg Pool
        else if (db.query) {
          await db.query('SELECT 1');
        }
        // For generic connection
        else if (db.ping) {
          await db.ping();
        }

        const latency = Date.now() - start;

        return {
          name,
          status: latency > 1000 ? 'degraded' : 'healthy',
          message: `Connected (${latency}ms)`,
          timestamp: new Date(),
          details: { latency },
        };
      } catch (error) {
        return {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Connection failed',
          timestamp: new Date(),
        };
      }
    },
  };
}

// PostgreSQL specific check with pool stats
export function createPostgresCheck(pool: any): HealthCheck {
  return {
    name: 'postgres',
    critical: true,
    check: async (): Promise<HealthCheckResult> => {
      try {
        const start = Date.now();
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        const latency = Date.now() - start;

        const poolStats = {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        };

        // Check pool health
        const status =
          pool.waitingCount > 10
            ? 'degraded'
            : latency > 1000
            ? 'degraded'
            : 'healthy';

        return {
          name: 'postgres',
          status,
          message: `Pool: ${pool.idleCount}/${pool.totalCount} idle, ${pool.waitingCount} waiting`,
          timestamp: new Date(),
          details: { latency, ...poolStats },
        };
      } catch (error) {
        return {
          name: 'postgres',
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Connection failed',
          timestamp: new Date(),
        };
      }
    },
  };
}
```

## Redis Health Check

```typescript
// lib/health/checks/redis.ts

import { HealthCheck, HealthCheckResult } from '../types';

export function createRedisCheck(
  redis: any,
  name: string = 'redis'
): HealthCheck {
  return {
    name,
    critical: false, // Redis often optional
    timeout: parseInt(process.env.REDIS_HEALTH_TIMEOUT || '2000', 10),
    check: async (): Promise<HealthCheckResult> => {
      try {
        const start = Date.now();
        const result = await redis.ping();
        const latency = Date.now() - start;

        if (result !== 'PONG') {
          return {
            name,
            status: 'unhealthy',
            message: `Unexpected response: ${result}`,
            timestamp: new Date(),
          };
        }

        // Get Redis info
        let info: Record<string, unknown> = {};
        try {
          const infoStr = await redis.info('memory');
          const lines = infoStr.split('\r\n');
          for (const line of lines) {
            const [key, value] = line.split(':');
            if (key && value) {
              info[key] = value;
            }
          }
        } catch {
          // Info command might not be available
        }

        return {
          name,
          status: latency > 500 ? 'degraded' : 'healthy',
          message: `Connected (${latency}ms)`,
          timestamp: new Date(),
          details: { latency, ...info },
        };
      } catch (error) {
        return {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Connection failed',
          timestamp: new Date(),
        };
      }
    },
  };
}
```

## External API Health Check

```typescript
// lib/health/checks/external-api.ts

import { HealthCheck, HealthCheckResult } from '../types';

export interface ExternalAPIConfig {
  name: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  expectedStatus?: number;
  timeout?: number;
  critical?: boolean;
}

export function createExternalAPICheck(config: ExternalAPIConfig): HealthCheck {
  const {
    name,
    url,
    method = 'GET',
    headers = {},
    expectedStatus = 200,
    timeout = parseInt(process.env.EXTERNAL_API_TIMEOUT || '5000', 10),
    critical = false,
  } = config;

  return {
    name,
    critical,
    timeout,
    check: async (): Promise<HealthCheckResult> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const start = Date.now();
        const response = await fetch(url, {
          method,
          headers,
          signal: controller.signal,
        });
        const latency = Date.now() - start;

        clearTimeout(timeoutId);

        if (response.status !== expectedStatus) {
          return {
            name,
            status: 'unhealthy',
            message: `Expected ${expectedStatus}, got ${response.status}`,
            timestamp: new Date(),
            details: { latency, status: response.status },
          };
        }

        return {
          name,
          status: latency > 2000 ? 'degraded' : 'healthy',
          message: `OK (${latency}ms)`,
          timestamp: new Date(),
          details: { latency, status: response.status },
        };
      } catch (error) {
        clearTimeout(timeoutId);

        const message =
          error instanceof Error
            ? error.name === 'AbortError'
              ? 'Request timed out'
              : error.message
            : 'Request failed';

        return {
          name,
          status: 'unhealthy',
          message,
          timestamp: new Date(),
        };
      }
    },
  };
}
```

## Memory Health Check

```typescript
// lib/health/checks/memory.ts

import { HealthCheck, HealthCheckResult } from '../types';

export function createMemoryCheck(
  thresholdMB: number = parseInt(process.env.MEMORY_THRESHOLD_MB || '512', 10)
): HealthCheck {
  return {
    name: 'memory',
    critical: true,
    check: async (): Promise<HealthCheckResult> => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      const rssMB = memUsage.rss / 1024 / 1024;

      const usagePercent = (heapUsedMB / thresholdMB) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (heapUsedMB > thresholdMB) {
        status = 'unhealthy';
      } else if (usagePercent > 80) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return {
        name: 'memory',
        status,
        message: `Heap: ${heapUsedMB.toFixed(1)}MB / ${thresholdMB}MB (${usagePercent.toFixed(1)}%)`,
        timestamp: new Date(),
        details: {
          heapUsedMB: Math.round(heapUsedMB * 10) / 10,
          heapTotalMB: Math.round(heapTotalMB * 10) / 10,
          rssMB: Math.round(rssMB * 10) / 10,
          thresholdMB,
          usagePercent: Math.round(usagePercent * 10) / 10,
        },
      };
    },
  };
}
```

## Disk Health Check

```typescript
// lib/health/checks/disk.ts

import { HealthCheck, HealthCheckResult } from '../types';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';

export function createDiskCheck(
  path: string = '/',
  thresholdPercent: number = 90
): HealthCheck {
  return {
    name: 'disk',
    critical: false,
    check: async (): Promise<HealthCheckResult> => {
      try {
        // Try to write a temp file to verify disk is writable
        const testFile = `${path === '/' ? '/tmp' : path}/.health_check_${Date.now()}`;
        await fs.writeFile(testFile, 'health check');
        await fs.unlink(testFile);

        // Get disk usage (Unix-like systems)
        let usagePercent = 0;
        let availableGB = 0;
        let totalGB = 0;

        try {
          const output = execSync(`df -P ${path} | tail -1`).toString();
          const parts = output.split(/\s+/);
          if (parts.length >= 5) {
            totalGB = parseInt(parts[1], 10) / 1024 / 1024;
            availableGB = parseInt(parts[3], 10) / 1024 / 1024;
            usagePercent = parseInt(parts[4].replace('%', ''), 10);
          }
        } catch {
          // df might not be available
        }

        let status: 'healthy' | 'degraded' | 'unhealthy';
        if (usagePercent >= thresholdPercent) {
          status = 'unhealthy';
        } else if (usagePercent >= thresholdPercent - 10) {
          status = 'degraded';
        } else {
          status = 'healthy';
        }

        return {
          name: 'disk',
          status,
          message: usagePercent > 0
            ? `${usagePercent}% used, ${availableGB.toFixed(1)}GB available`
            : 'Disk writable',
          timestamp: new Date(),
          details: {
            usagePercent,
            availableGB: Math.round(availableGB * 10) / 10,
            totalGB: Math.round(totalGB * 10) / 10,
            path,
          },
        };
      } catch (error) {
        return {
          name: 'disk',
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Disk check failed',
          timestamp: new Date(),
        };
      }
    },
  };
}
```

## Next.js Health Endpoints

```typescript
// app/api/health/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { runHealthChecks } from '@/lib/health';
import { createDatabaseCheck } from '@/lib/health/checks/database';
import { createRedisCheck } from '@/lib/health/checks/redis';
import { createMemoryCheck } from '@/lib/health/checks/memory';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';

const healthChecks = [
  createDatabaseCheck(prisma),
  createRedisCheck(redis),
  createMemoryCheck(),
];

export async function GET(req: NextRequest) {
  const response = await runHealthChecks(healthChecks);

  const statusCode =
    response.status === 'healthy'
      ? 200
      : response.status === 'degraded'
      ? 200
      : 503;

  return NextResponse.json(response, { status: statusCode });
}

// app/api/health/live/route.ts
import { NextResponse } from 'next/server';
import { livenessCheck } from '@/lib/health';

export async function GET() {
  const result = livenessCheck();
  return NextResponse.json(result);
}

// app/api/health/ready/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runHealthChecks } from '@/lib/health';
import { createDatabaseCheck } from '@/lib/health/checks/database';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const response = await runHealthChecks([createDatabaseCheck(prisma)]);

  return NextResponse.json(response, {
    status: response.status === 'healthy' ? 200 : 503,
  });
}
```

## Express Health Server

```typescript
// lib/health/server.ts

import express, { Request, Response } from 'express';
import { createTerminus } from '@godaddy/terminus';
import http from 'http';
import { runHealthChecks, livenessCheck } from './index';
import { HealthCheck, HealthConfig } from './types';

export function createHealthServer(config: HealthConfig) {
  const app = express();
  const server = http.createServer(app);

  // Liveness probe - simple ping
  app.get('/live', (req: Request, res: Response) => {
    const result = livenessCheck();
    res.status(200).json(result);
  });

  // Readiness probe - full dependency check
  app.get('/ready', async (req: Request, res: Response) => {
    const response = await runHealthChecks(
      config.readinessChecks,
      config.timeout
    );

    const statusCode = response.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  });

  // Full health check
  app.get('/health', async (req: Request, res: Response) => {
    const checks = [
      ...config.livenessChecks,
      ...config.readinessChecks,
    ];

    const response = await runHealthChecks(checks, config.timeout);

    const statusCode =
      response.status === 'healthy'
        ? 200
        : response.status === 'degraded'
        ? 200
        : 503;

    res.status(statusCode).json(response);
  });

  // Graceful shutdown with Terminus
  createTerminus(server, {
    healthChecks: {
      '/healthz': async () => {
        const response = await runHealthChecks(
          config.readinessChecks,
          config.timeout
        );
        if (response.status === 'unhealthy') {
          throw new Error('Health check failed');
        }
      },
    },
    timeout: config.gracefulShutdownTimeout,
    signals: ['SIGTERM', 'SIGINT'],
    onSignal: async () => {
      console.log('Received shutdown signal');
      await config.onSignal?.();
    },
    onShutdown: async () => {
      console.log('Cleanup complete, shutting down');
      await config.onShutdown?.();
    },
    beforeShutdown: async () => {
      // Wait for load balancer to drain connections
      await new Promise((resolve) => setTimeout(resolve, 5000));
    },
  });

  return {
    app,
    server,
    start: (port: number = 8080) => {
      server.listen(port, () => {
        console.log(`Health server listening on port ${port}`);
      });
    },
  };
}
```

## Kubernetes Deployment

```yaml
# kubernetes/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: my-app
          livenessProbe:
            httpGet:
              path: /api/health/live
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 5
            successThreshold: 1
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /api/health/live
              port: 3000
            initialDelaySeconds: 0
            periodSeconds: 5
            timeoutSeconds: 5
            failureThreshold: 30
```

## Usage Examples

```typescript
// Setup health checks

import { createHealthServer } from '@/lib/health/server';
import { createDatabaseCheck } from '@/lib/health/checks/database';
import { createRedisCheck } from '@/lib/health/checks/redis';
import { createExternalAPICheck } from '@/lib/health/checks/external-api';
import { createMemoryCheck } from '@/lib/health/checks/memory';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';

const healthServer = createHealthServer({
  livenessChecks: [
    // Simple checks for liveness
    createMemoryCheck(1024),
  ],
  readinessChecks: [
    // Full dependency checks for readiness
    createDatabaseCheck(prisma),
    createRedisCheck(redis),
    createExternalAPICheck({
      name: 'stripe',
      url: 'https://api.stripe.com/v1/health',
      critical: false,
    }),
  ],
  startupChecks: [
    createDatabaseCheck(prisma),
  ],
  timeout: 5000,
  gracefulShutdownTimeout: 30000,
  onShutdown: async () => {
    await prisma.$disconnect();
    await redis.quit();
  },
});

healthServer.start(8080);
```

## CLAUDE.md Integration

```markdown
## Health Check Guidelines

### Endpoints
- `/api/health/live` - Liveness probe (is process running?)
- `/api/health/ready` - Readiness probe (can handle traffic?)
- `/api/health` - Full health check with all dependencies

### Adding Checks
- Use factory functions: `createDatabaseCheck`, `createRedisCheck`, etc.
- Mark critical checks with `critical: true`
- Set appropriate timeouts per check

### Response Codes
- 200: healthy or degraded (can handle traffic)
- 503: unhealthy (cannot handle traffic)

### Best Practices
- Keep liveness checks simple (no external deps)
- Use readiness for dependency availability
- Set appropriate timeouts and thresholds
```

## AI Suggestions

1. **Implement cascading health** - Check downstream service health and propagate status
2. **Add health check caching** - Cache results to prevent thundering herd
3. **Implement health dashboards** - Real-time health status visualization
4. **Add health history** - Track health status changes over time
5. **Implement circuit breaker integration** - Use health to control circuit breakers
6. **Add predictive health** - Predict failures from resource trends
7. **Implement health-based routing** - Route traffic away from degraded instances
8. **Add custom check DSL** - Define health checks in configuration
9. **Implement multi-region health** - Aggregate health across regions
10. **Add synthetic health checks** - Run actual transactions as health probes
