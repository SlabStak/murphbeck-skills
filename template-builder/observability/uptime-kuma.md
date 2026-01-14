# Uptime Kuma Template

## Overview
Self-hosted uptime monitoring solution with status pages, notifications, and comprehensive monitoring capabilities.

## Installation

### Docker Deployment
```bash
# Quick start
docker run -d \
  --name uptime-kuma \
  -p 3001:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:1

# Docker Compose
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma-data:/app/data
    environment:
      - UPTIME_KUMA_DISABLE_FRAME_SAMEORIGIN=true
    healthcheck:
      test: ["CMD", "node", "/app/extra/healthcheck.js"]
      interval: 60s
      timeout: 30s
      retries: 5
      start_period: 180s

volumes:
  uptime-kuma-data:
    driver: local
EOF

docker-compose up -d
```

### Kubernetes Deployment
```yaml
# uptime-kuma-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: uptime-kuma
  labels:
    app: uptime-kuma
spec:
  replicas: 1
  selector:
    matchLabels:
      app: uptime-kuma
  template:
    metadata:
      labels:
        app: uptime-kuma
    spec:
      containers:
        - name: uptime-kuma
          image: louislam/uptime-kuma:1
          ports:
            - containerPort: 3001
          volumeMounts:
            - name: data
              mountPath: /app/data
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /
              port: 3001
            initialDelaySeconds: 180
            periodSeconds: 60
          readinessProbe:
            httpGet:
              path: /
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 10
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: uptime-kuma-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: uptime-kuma
spec:
  selector:
    app: uptime-kuma
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: uptime-kuma-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: uptime-kuma
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - status.example.com
      secretName: uptime-kuma-tls
  rules:
    - host: status.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: uptime-kuma
                port:
                  number: 3001
```

## Environment Variables

```bash
# Server Configuration
UPTIME_KUMA_PORT=3001
UPTIME_KUMA_HOST=0.0.0.0
UPTIME_KUMA_SSL_KEY=/path/to/ssl.key
UPTIME_KUMA_SSL_CERT=/path/to/ssl.cert

# Security
UPTIME_KUMA_DISABLE_FRAME_SAMEORIGIN=false
UPTIME_KUMA_CLOUDFLARED_TOKEN=your_cloudflare_token

# Database (SQLite by default)
DATA_DIR=/app/data

# Proxy
HTTP_PROXY=http://proxy:8080
HTTPS_PROXY=http://proxy:8080
NO_PROXY=localhost,127.0.0.1
```

## API Integration

### Node.js API Client
```typescript
// lib/uptime-kuma-client.ts
import WebSocket from 'ws';
import { EventEmitter } from 'events';

interface Monitor {
  id?: number;
  name: string;
  type: MonitorType;
  url?: string;
  hostname?: string;
  port?: number;
  interval: number;
  retryInterval: number;
  maxretries: number;
  accepted_statuscodes?: string[];
  ignoreTls?: boolean;
  notificationIDList?: number[];
  tags?: { name: string; value: string }[];
}

type MonitorType =
  | 'http' | 'https' | 'keyword' | 'port'
  | 'ping' | 'dns' | 'docker' | 'push'
  | 'steam' | 'gamedig' | 'mqtt' | 'sqlserver'
  | 'postgres' | 'mysql' | 'mongodb' | 'radius'
  | 'redis' | 'grpc-keyword' | 'json-query';

interface UptimeKumaConfig {
  url: string;
  username: string;
  password: string;
}

interface Heartbeat {
  monitorID: number;
  status: number;
  time: string;
  msg: string;
  ping: number;
}

class UptimeKumaClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: UptimeKumaConfig;
  private token: string | null = null;
  private monitors: Map<number, Monitor> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval: NodeJS.Timer | null = null;

  constructor(config: UptimeKumaConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.url.replace('http', 'ws') + '/socket.io/?EIO=4&transport=websocket';

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log('Connected to Uptime Kuma');
        this.reconnectAttempts = 0;
      });

      this.ws.on('message', async (data: Buffer) => {
        const message = data.toString();
        await this.handleMessage(message, resolve, reject);
      });

      this.ws.on('close', () => {
        this.handleDisconnect();
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  }

  private async handleMessage(
    message: string,
    resolve?: () => void,
    reject?: (error: Error) => void
  ): Promise<void> {
    // Socket.IO protocol parsing
    if (message.startsWith('0')) {
      // Connection established, send auth
      this.send('40');
      return;
    }

    if (message.startsWith('40')) {
      // Ready for authentication
      await this.login();
      return;
    }

    if (message.startsWith('42')) {
      const jsonStart = message.indexOf('[');
      if (jsonStart === -1) return;

      try {
        const payload = JSON.parse(message.slice(jsonStart));
        const [event, ...args] = payload;

        switch (event) {
          case 'loginSuccess':
            this.token = args[0]?.token;
            this.emit('authenticated');
            resolve?.();
            break;

          case 'monitorList':
            this.monitors.clear();
            for (const monitor of Object.values(args[0] as Record<string, Monitor>)) {
              if (monitor.id) {
                this.monitors.set(monitor.id, monitor);
              }
            }
            this.emit('monitors', Array.from(this.monitors.values()));
            break;

          case 'heartbeat':
            const heartbeat = args[0] as Heartbeat;
            this.emit('heartbeat', heartbeat);
            break;

          case 'heartbeatList':
            const monitorId = args[0];
            const heartbeats = args[1] as Heartbeat[];
            this.emit('heartbeatList', { monitorId, heartbeats });
            break;

          case 'avgPing':
            this.emit('avgPing', args[0]);
            break;

          case 'uptime':
            this.emit('uptime', args[0]);
            break;

          case 'info':
            this.emit('info', args[0]);
            break;

          default:
            this.emit(event, ...args);
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    }

    // Heartbeat response
    if (message === '3') {
      // Pong received
    }
  }

  private async login(): Promise<void> {
    this.send('42', ['login', {
      username: this.config.username,
      password: this.config.password,
      token: ''
    }]);
  }

  private send(prefix: string, data?: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = data ? prefix + JSON.stringify(data) : prefix;
    this.ws.send(message);
  }

  private handleDisconnect(): void {
    console.log('Disconnected from Uptime Kuma');

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      this.emit('maxReconnectAttemptsReached');
    }
  }

  // Monitor Management
  async addMonitor(monitor: Monitor): Promise<number> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; msg?: string; monitorID?: number }) => {
        if (result.ok && result.monitorID) {
          resolve(result.monitorID);
        } else {
          reject(new Error(result.msg || 'Failed to add monitor'));
        }
      };

      this.send('42', ['add', monitor, callback]);
    });
  }

  async editMonitor(monitor: Monitor): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; msg?: string }) => {
        if (result.ok) {
          resolve();
        } else {
          reject(new Error(result.msg || 'Failed to edit monitor'));
        }
      };

      this.send('42', ['editMonitor', monitor, callback]);
    });
  }

  async deleteMonitor(monitorId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; msg?: string }) => {
        if (result.ok) {
          resolve();
        } else {
          reject(new Error(result.msg || 'Failed to delete monitor'));
        }
      };

      this.send('42', ['deleteMonitor', monitorId, callback]);
    });
  }

  async pauseMonitor(monitorId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; msg?: string }) => {
        if (result.ok) {
          resolve();
        } else {
          reject(new Error(result.msg || 'Failed to pause monitor'));
        }
      };

      this.send('42', ['pauseMonitor', monitorId, callback]);
    });
  }

  async resumeMonitor(monitorId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; msg?: string }) => {
        if (result.ok) {
          resolve();
        } else {
          reject(new Error(result.msg || 'Failed to resume monitor'));
        }
      };

      this.send('42', ['resumeMonitor', monitorId, callback]);
    });
  }

  // Status Pages
  async getStatusPages(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; statusPages?: any[]; msg?: string }) => {
        if (result.ok) {
          resolve(result.statusPages || []);
        } else {
          reject(new Error(result.msg || 'Failed to get status pages'));
        }
      };

      this.send('42', ['getStatusPageList', callback]);
    });
  }

  async addStatusPage(title: string, slug: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; msg?: string }) => {
        if (result.ok) {
          resolve();
        } else {
          reject(new Error(result.msg || 'Failed to add status page'));
        }
      };

      this.send('42', ['addStatusPage', title, slug, callback]);
    });
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; notifications?: any[]; msg?: string }) => {
        if (result.ok) {
          resolve(result.notifications || []);
        } else {
          reject(new Error(result.msg || 'Failed to get notifications'));
        }
      };

      this.send('42', ['getNotificationList', callback]);
    });
  }

  async testNotification(notification: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; msg: string }) => {
        if (result.ok) {
          resolve(result.msg);
        } else {
          reject(new Error(result.msg));
        }
      };

      this.send('42', ['testNotification', notification, callback]);
    });
  }

  // Maintenance
  async getMaintenances(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; maintenances?: any[]; msg?: string }) => {
        if (result.ok) {
          resolve(result.maintenances || []);
        } else {
          reject(new Error(result.msg || 'Failed to get maintenances'));
        }
      };

      this.send('42', ['getMaintenanceList', callback]);
    });
  }

  // Tags
  async getTags(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const callback = (result: { ok: boolean; tags?: any[]; msg?: string }) => {
        if (result.ok) {
          resolve(result.tags || []);
        } else {
          reject(new Error(result.msg || 'Failed to get tags'));
        }
      };

      this.send('42', ['getTags', callback]);
    });
  }

  getMonitors(): Monitor[] {
    return Array.from(this.monitors.values());
  }

  getMonitor(id: number): Monitor | undefined {
    return this.monitors.get(id);
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export { UptimeKumaClient, Monitor, MonitorType, Heartbeat };
```

### Monitor Factory
```typescript
// lib/monitor-factory.ts
import { Monitor, MonitorType } from './uptime-kuma-client';

interface MonitorDefaults {
  interval: number;
  retryInterval: number;
  maxretries: number;
}

const defaultSettings: MonitorDefaults = {
  interval: 60,
  retryInterval: 60,
  maxretries: 3
};

export function createHttpMonitor(
  name: string,
  url: string,
  options: Partial<Monitor> = {}
): Monitor {
  return {
    type: 'http',
    name,
    url,
    method: 'GET',
    accepted_statuscodes: ['200-299'],
    ...defaultSettings,
    ...options
  };
}

export function createKeywordMonitor(
  name: string,
  url: string,
  keyword: string,
  options: Partial<Monitor> = {}
): Monitor {
  return {
    type: 'keyword',
    name,
    url,
    keyword,
    ...defaultSettings,
    ...options
  };
}

export function createPortMonitor(
  name: string,
  hostname: string,
  port: number,
  options: Partial<Monitor> = {}
): Monitor {
  return {
    type: 'port',
    name,
    hostname,
    port,
    ...defaultSettings,
    ...options
  };
}

export function createPingMonitor(
  name: string,
  hostname: string,
  options: Partial<Monitor> = {}
): Monitor {
  return {
    type: 'ping',
    name,
    hostname,
    ...defaultSettings,
    ...options
  };
}

export function createDnsMonitor(
  name: string,
  hostname: string,
  options: Partial<Monitor> = {}
): Monitor {
  return {
    type: 'dns',
    name,
    hostname,
    dns_resolve_server: '1.1.1.1',
    dns_resolve_type: 'A',
    ...defaultSettings,
    ...options
  };
}

export function createDatabaseMonitor(
  name: string,
  type: 'mysql' | 'postgres' | 'mongodb' | 'redis' | 'sqlserver',
  connectionString: string,
  options: Partial<Monitor> = {}
): Monitor {
  return {
    type,
    name,
    databaseConnectionString: connectionString,
    ...defaultSettings,
    ...options
  };
}

export function createDockerMonitor(
  name: string,
  dockerContainer: string,
  dockerHost: string = '/var/run/docker.sock',
  options: Partial<Monitor> = {}
): Monitor {
  return {
    type: 'docker',
    name,
    docker_container: dockerContainer,
    docker_host: dockerHost,
    ...defaultSettings,
    ...options
  };
}

export function createPushMonitor(
  name: string,
  options: Partial<Monitor> = {}
): Monitor {
  return {
    type: 'push',
    name,
    ...defaultSettings,
    interval: 180, // Push monitors typically have longer intervals
    ...options
  };
}

export function createJsonQueryMonitor(
  name: string,
  url: string,
  jsonPath: string,
  expectedValue: string,
  options: Partial<Monitor> = {}
): Monitor {
  return {
    type: 'json-query',
    name,
    url,
    jsonPath,
    expectedValue,
    ...defaultSettings,
    ...options
  };
}

export function createGrpcMonitor(
  name: string,
  url: string,
  grpcServiceName: string,
  options: Partial<Monitor> = {}
): Monitor {
  return {
    type: 'grpc-keyword',
    name,
    url,
    grpcServiceName,
    grpcEnableTls: true,
    ...defaultSettings,
    ...options
  };
}
```

### Bulk Monitor Configuration
```typescript
// lib/monitor-config.ts
import { UptimeKumaClient, Monitor } from './uptime-kuma-client';
import * as factory from './monitor-factory';

interface ServiceDefinition {
  name: string;
  type: 'http' | 'port' | 'database' | 'docker';
  config: Record<string, any>;
  tags?: string[];
  notifications?: string[];
}

interface MonitorConfig {
  services: ServiceDefinition[];
  defaults: {
    interval: number;
    retryInterval: number;
    notifications: string[];
  };
}

async function loadMonitorsFromConfig(
  client: UptimeKumaClient,
  config: MonitorConfig
): Promise<Map<string, number>> {
  const monitorIds = new Map<string, number>();

  // Get existing notifications
  const notifications = await client.getNotifications();
  const notificationMap = new Map(
    notifications.map(n => [n.name, n.id])
  );

  // Get existing tags
  const tags = await client.getTags();
  const tagMap = new Map(tags.map(t => [t.name, t.id]));

  for (const service of config.services) {
    let monitor: Monitor;

    switch (service.type) {
      case 'http':
        monitor = factory.createHttpMonitor(
          service.name,
          service.config.url,
          {
            interval: service.config.interval || config.defaults.interval,
            retryInterval: service.config.retryInterval || config.defaults.retryInterval
          }
        );
        break;

      case 'port':
        monitor = factory.createPortMonitor(
          service.name,
          service.config.hostname,
          service.config.port,
          {
            interval: service.config.interval || config.defaults.interval
          }
        );
        break;

      case 'database':
        monitor = factory.createDatabaseMonitor(
          service.name,
          service.config.dbType,
          service.config.connectionString
        );
        break;

      case 'docker':
        monitor = factory.createDockerMonitor(
          service.name,
          service.config.container,
          service.config.host
        );
        break;

      default:
        console.warn(`Unknown service type: ${service.type}`);
        continue;
    }

    // Add notification IDs
    const serviceNotifications = service.notifications || config.defaults.notifications;
    monitor.notificationIDList = serviceNotifications
      .map(name => notificationMap.get(name))
      .filter((id): id is number => id !== undefined);

    // Add tags
    if (service.tags) {
      monitor.tags = service.tags.map(tagName => ({
        name: tagName,
        value: ''
      }));
    }

    try {
      const monitorId = await client.addMonitor(monitor);
      monitorIds.set(service.name, monitorId);
      console.log(`Created monitor: ${service.name} (ID: ${monitorId})`);
    } catch (error) {
      console.error(`Failed to create monitor ${service.name}:`, error);
    }
  }

  return monitorIds;
}

// Example configuration file
const exampleConfig: MonitorConfig = {
  defaults: {
    interval: 60,
    retryInterval: 30,
    notifications: ['Slack', 'Email']
  },
  services: [
    {
      name: 'API Gateway',
      type: 'http',
      config: {
        url: 'https://api.example.com/health',
        interval: 30
      },
      tags: ['production', 'critical']
    },
    {
      name: 'Database Primary',
      type: 'database',
      config: {
        dbType: 'postgres',
        connectionString: 'postgresql://user:pass@db.example.com:5432/main'
      },
      tags: ['production', 'database']
    },
    {
      name: 'Redis Cache',
      type: 'port',
      config: {
        hostname: 'redis.example.com',
        port: 6379
      },
      tags: ['production', 'cache']
    }
  ]
};

export { loadMonitorsFromConfig, MonitorConfig, ServiceDefinition };
```

## Status Page Integration

### Embed Status Page
```html
<!-- Public status page embed -->
<!DOCTYPE html>
<html>
<head>
  <title>Service Status</title>
  <style>
    .status-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .status-embed {
      width: 100%;
      height: 600px;
      border: none;
      border-radius: 8px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 500;
      font-size: 14px;
    }

    .status-badge.operational {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge.degraded {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.outage {
      background: #fee2e2;
      color: #991b1b;
    }
  </style>
</head>
<body>
  <div class="status-container">
    <h1>System Status</h1>
    <iframe
      class="status-embed"
      src="https://status.example.com/status/main"
      title="Service Status"
    ></iframe>
  </div>
</body>
</html>
```

### Status Badge API
```typescript
// api/status-badge.ts
import { UptimeKumaClient } from '../lib/uptime-kuma-client';

interface BadgeResponse {
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  uptime: number;
  monitors: {
    name: string;
    status: number;
    uptime: number;
  }[];
}

async function getStatusBadge(
  client: UptimeKumaClient,
  monitorIds?: number[]
): Promise<BadgeResponse> {
  const monitors = client.getMonitors();
  const filteredMonitors = monitorIds
    ? monitors.filter(m => m.id && monitorIds.includes(m.id))
    : monitors;

  // This would need heartbeat data from the client
  // Simplified example
  let totalUptime = 0;
  let downCount = 0;
  const monitorStatuses: BadgeResponse['monitors'] = [];

  for (const monitor of filteredMonitors) {
    // In real implementation, get actual status from heartbeats
    const status = 1; // 1 = up, 0 = down
    const uptime = 99.9;

    monitorStatuses.push({
      name: monitor.name,
      status,
      uptime
    });

    totalUptime += uptime;
    if (status === 0) downCount++;
  }

  const avgUptime = filteredMonitors.length > 0
    ? totalUptime / filteredMonitors.length
    : 100;

  let overallStatus: BadgeResponse['status'] = 'operational';
  if (downCount > 0) {
    overallStatus = downCount === filteredMonitors.length ? 'outage' : 'degraded';
  }

  return {
    status: overallStatus,
    uptime: avgUptime,
    monitors: monitorStatuses
  };
}

// Express endpoint
import express from 'express';
const router = express.Router();

router.get('/badge', async (req, res) => {
  try {
    const client = req.app.get('uptimeKumaClient');
    const monitorIds = req.query.monitors
      ? (req.query.monitors as string).split(',').map(Number)
      : undefined;

    const badge = await getStatusBadge(client, monitorIds);
    res.json(badge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// SVG Badge endpoint
router.get('/badge.svg', async (req, res) => {
  try {
    const client = req.app.get('uptimeKumaClient');
    const badge = await getStatusBadge(client);

    const colors = {
      operational: '#22c55e',
      degraded: '#f59e0b',
      outage: '#ef4444',
      unknown: '#6b7280'
    };

    const labels = {
      operational: 'operational',
      degraded: 'degraded',
      outage: 'outage',
      unknown: 'unknown'
    };

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
        <rect width="60" height="20" fill="#555"/>
        <rect x="60" width="60" height="20" fill="${colors[badge.status]}"/>
        <text x="30" y="14" fill="#fff" text-anchor="middle" font-family="sans-serif" font-size="11">status</text>
        <text x="90" y="14" fill="#fff" text-anchor="middle" font-family="sans-serif" font-size="11">${labels[badge.status]}</text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(svg);
  } catch (error) {
    res.status(500).send('Error generating badge');
  }
});

export default router;
```

## Notification Integrations

### Webhook Notification Handler
```typescript
// lib/notification-handlers.ts
import axios from 'axios';

interface HeartbeatData {
  monitorID: number;
  status: 0 | 1;
  time: string;
  msg: string;
  ping: number;
  important: boolean;
  duration: number;
}

interface NotificationPayload {
  heartbeat: HeartbeatData;
  monitor: {
    id: number;
    name: string;
    url?: string;
    type: string;
    tags: { name: string; value: string }[];
  };
}

// Slack notification
async function sendSlackNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<void> {
  const isUp = payload.heartbeat.status === 1;

  const message = {
    attachments: [
      {
        color: isUp ? '#22c55e' : '#ef4444',
        title: `${payload.monitor.name} is ${isUp ? 'UP' : 'DOWN'}`,
        fields: [
          {
            title: 'Status',
            value: isUp ? ':white_check_mark: Operational' : ':x: Down',
            short: true
          },
          {
            title: 'Response Time',
            value: `${payload.heartbeat.ping}ms`,
            short: true
          },
          {
            title: 'Message',
            value: payload.heartbeat.msg,
            short: false
          },
          {
            title: 'Duration',
            value: formatDuration(payload.heartbeat.duration),
            short: true
          }
        ],
        footer: 'Uptime Kuma',
        ts: Math.floor(new Date(payload.heartbeat.time).getTime() / 1000)
      }
    ]
  };

  await axios.post(webhookUrl, message);
}

// Discord notification
async function sendDiscordNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<void> {
  const isUp = payload.heartbeat.status === 1;

  const embed = {
    embeds: [
      {
        title: `${payload.monitor.name} is ${isUp ? 'UP' : 'DOWN'}`,
        color: isUp ? 0x22c55e : 0xef4444,
        fields: [
          {
            name: 'Status',
            value: isUp ? 'Operational' : 'Down',
            inline: true
          },
          {
            name: 'Response Time',
            value: `${payload.heartbeat.ping}ms`,
            inline: true
          },
          {
            name: 'Message',
            value: payload.heartbeat.msg || 'N/A',
            inline: false
          }
        ],
        timestamp: payload.heartbeat.time,
        footer: {
          text: 'Uptime Kuma'
        }
      }
    ]
  };

  await axios.post(webhookUrl, embed);
}

// Microsoft Teams notification
async function sendTeamsNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<void> {
  const isUp = payload.heartbeat.status === 1;

  const card = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: isUp ? '22c55e' : 'ef4444',
    summary: `${payload.monitor.name} is ${isUp ? 'UP' : 'DOWN'}`,
    sections: [
      {
        activityTitle: `${payload.monitor.name} Status Alert`,
        facts: [
          { name: 'Status', value: isUp ? 'Operational' : 'Down' },
          { name: 'Response Time', value: `${payload.heartbeat.ping}ms` },
          { name: 'Message', value: payload.heartbeat.msg || 'N/A' },
          { name: 'Time', value: payload.heartbeat.time }
        ],
        markdown: true
      }
    ]
  };

  await axios.post(webhookUrl, card);
}

// PagerDuty notification
async function sendPagerDutyNotification(
  routingKey: string,
  payload: NotificationPayload
): Promise<void> {
  const isUp = payload.heartbeat.status === 1;

  const event = {
    routing_key: routingKey,
    event_action: isUp ? 'resolve' : 'trigger',
    dedup_key: `uptime-kuma-${payload.monitor.id}`,
    payload: {
      summary: `${payload.monitor.name} is ${isUp ? 'UP' : 'DOWN'}`,
      severity: isUp ? 'info' : 'critical',
      source: 'Uptime Kuma',
      timestamp: payload.heartbeat.time,
      custom_details: {
        monitor_id: payload.monitor.id,
        monitor_name: payload.monitor.name,
        response_time: payload.heartbeat.ping,
        message: payload.heartbeat.msg
      }
    }
  };

  await axios.post('https://events.pagerduty.com/v2/enqueue', event);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export {
  sendSlackNotification,
  sendDiscordNotification,
  sendTeamsNotification,
  sendPagerDutyNotification,
  NotificationPayload
};
```

## Push Monitor Integration

### Push Monitor Client
```typescript
// lib/push-client.ts
import axios from 'axios';

interface PushMonitorConfig {
  pushUrl: string;
  interval: number;
}

interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical?: boolean;
}

class PushMonitorClient {
  private config: PushMonitorConfig;
  private healthChecks: HealthCheck[] = [];
  private intervalId: NodeJS.Timer | null = null;

  constructor(config: PushMonitorConfig) {
    this.config = config;
  }

  addHealthCheck(check: HealthCheck): void {
    this.healthChecks.push(check);
  }

  async runHealthChecks(): Promise<{
    healthy: boolean;
    results: { name: string; healthy: boolean; error?: string }[];
  }> {
    const results = await Promise.all(
      this.healthChecks.map(async (check) => {
        try {
          const healthy = await check.check();
          return { name: check.name, healthy };
        } catch (error) {
          return {
            name: check.name,
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const criticalFailures = results.filter((r, i) =>
      !r.healthy && this.healthChecks[i].critical
    );

    return {
      healthy: criticalFailures.length === 0,
      results
    };
  }

  async push(status?: 'up' | 'down', msg?: string, ping?: number): Promise<void> {
    const url = new URL(this.config.pushUrl);

    if (status) url.searchParams.set('status', status);
    if (msg) url.searchParams.set('msg', msg);
    if (ping) url.searchParams.set('ping', ping.toString());

    await axios.get(url.toString(), { timeout: 10000 });
  }

  async start(): Promise<void> {
    // Initial push
    await this.runAndPush();

    // Schedule regular pushes
    this.intervalId = setInterval(
      () => this.runAndPush(),
      this.config.interval * 1000
    );
  }

  private async runAndPush(): Promise<void> {
    const startTime = Date.now();

    try {
      const { healthy, results } = await this.runHealthChecks();
      const ping = Date.now() - startTime;

      const failedChecks = results.filter(r => !r.healthy);
      const msg = failedChecks.length > 0
        ? `Failed: ${failedChecks.map(r => r.name).join(', ')}`
        : 'All checks passed';

      await this.push(healthy ? 'up' : 'down', msg, ping);
    } catch (error) {
      console.error('Failed to push health status:', error);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Usage example
async function setupPushMonitor(): Promise<PushMonitorClient> {
  const client = new PushMonitorClient({
    pushUrl: 'https://uptime.example.com/api/push/your-push-token',
    interval: 60
  });

  // Database check
  client.addHealthCheck({
    name: 'database',
    critical: true,
    check: async () => {
      // Check database connection
      return true;
    }
  });

  // Redis check
  client.addHealthCheck({
    name: 'redis',
    critical: true,
    check: async () => {
      // Check Redis connection
      return true;
    }
  });

  // External API check
  client.addHealthCheck({
    name: 'payment-gateway',
    critical: false,
    check: async () => {
      const response = await axios.get('https://api.stripe.com/health', {
        timeout: 5000
      });
      return response.status === 200;
    }
  });

  await client.start();
  return client;
}

export { PushMonitorClient, HealthCheck, setupPushMonitor };
```

## Maintenance Windows

### Maintenance Scheduler
```typescript
// lib/maintenance-scheduler.ts
import { UptimeKumaClient } from './uptime-kuma-client';
import cron from 'node-cron';

interface MaintenanceWindow {
  title: string;
  description?: string;
  monitors: number[];
  schedule: {
    type: 'once' | 'recurring';
    startDate?: Date;
    endDate?: Date;
    cronExpression?: string;
    duration: number; // minutes
    timezone?: string;
  };
}

class MaintenanceScheduler {
  private client: UptimeKumaClient;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(client: UptimeKumaClient) {
    this.client = client;
  }

  async scheduleOnce(window: MaintenanceWindow): Promise<void> {
    if (!window.schedule.startDate || !window.schedule.endDate) {
      throw new Error('Start and end dates required for one-time maintenance');
    }

    // Create maintenance in Uptime Kuma
    // Note: This would use the actual API method
    console.log(`Scheduled one-time maintenance: ${window.title}`);
    console.log(`From: ${window.schedule.startDate} To: ${window.schedule.endDate}`);
  }

  scheduleRecurring(id: string, window: MaintenanceWindow): void {
    if (!window.schedule.cronExpression) {
      throw new Error('Cron expression required for recurring maintenance');
    }

    const job = cron.schedule(window.schedule.cronExpression, async () => {
      console.log(`Starting scheduled maintenance: ${window.title}`);

      // Pause monitors
      for (const monitorId of window.monitors) {
        await this.client.pauseMonitor(monitorId);
      }

      // Schedule resume
      setTimeout(async () => {
        for (const monitorId of window.monitors) {
          await this.client.resumeMonitor(monitorId);
        }
        console.log(`Maintenance ended: ${window.title}`);
      }, window.schedule.duration * 60 * 1000);
    }, {
      timezone: window.schedule.timezone || 'UTC'
    });

    this.scheduledJobs.set(id, job);
  }

  cancelScheduled(id: string): boolean {
    const job = this.scheduledJobs.get(id);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(id);
      return true;
    }
    return false;
  }

  listScheduled(): string[] {
    return Array.from(this.scheduledJobs.keys());
  }
}

export { MaintenanceScheduler, MaintenanceWindow };
```

## Testing

### Integration Tests
```typescript
// __tests__/uptime-kuma.test.ts
import { UptimeKumaClient, Monitor } from '../lib/uptime-kuma-client';
import * as factory from '../lib/monitor-factory';

describe('UptimeKumaClient', () => {
  let client: UptimeKumaClient;

  beforeAll(async () => {
    client = new UptimeKumaClient({
      url: process.env.UPTIME_KUMA_URL || 'http://localhost:3001',
      username: process.env.UPTIME_KUMA_USERNAME || 'admin',
      password: process.env.UPTIME_KUMA_PASSWORD || 'password'
    });

    await client.connect();
  });

  afterAll(() => {
    client.disconnect();
  });

  describe('Monitor Management', () => {
    let createdMonitorId: number;

    it('should create an HTTP monitor', async () => {
      const monitor = factory.createHttpMonitor(
        'Test Monitor',
        'https://httpbin.org/get'
      );

      createdMonitorId = await client.addMonitor(monitor);
      expect(createdMonitorId).toBeGreaterThan(0);
    });

    it('should list monitors including the new one', async () => {
      const monitors = client.getMonitors();
      const found = monitors.find(m => m.id === createdMonitorId);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Monitor');
    });

    it('should pause and resume monitor', async () => {
      await client.pauseMonitor(createdMonitorId);
      // Would verify status change

      await client.resumeMonitor(createdMonitorId);
      // Would verify status change
    });

    it('should delete monitor', async () => {
      await client.deleteMonitor(createdMonitorId);

      const monitors = client.getMonitors();
      const found = monitors.find(m => m.id === createdMonitorId);
      expect(found).toBeUndefined();
    });
  });

  describe('Monitor Factory', () => {
    it('should create HTTP monitor with defaults', () => {
      const monitor = factory.createHttpMonitor('API', 'https://api.example.com');

      expect(monitor.type).toBe('http');
      expect(monitor.interval).toBe(60);
      expect(monitor.maxretries).toBe(3);
    });

    it('should create keyword monitor', () => {
      const monitor = factory.createKeywordMonitor(
        'Homepage',
        'https://example.com',
        'Welcome'
      );

      expect(monitor.type).toBe('keyword');
      expect(monitor.keyword).toBe('Welcome');
    });

    it('should create database monitor', () => {
      const monitor = factory.createDatabaseMonitor(
        'Postgres',
        'postgres',
        'postgresql://localhost:5432/db'
      );

      expect(monitor.type).toBe('postgres');
    });
  });
});

describe('Push Monitor', () => {
  it('should run health checks', async () => {
    const { PushMonitorClient } = await import('../lib/push-client');

    const client = new PushMonitorClient({
      pushUrl: 'https://uptime.example.com/api/push/test',
      interval: 60
    });

    client.addHealthCheck({
      name: 'always-pass',
      check: async () => true
    });

    client.addHealthCheck({
      name: 'always-fail',
      check: async () => false
    });

    const result = await client.runHealthChecks();

    expect(result.results).toHaveLength(2);
    expect(result.results[0].healthy).toBe(true);
    expect(result.results[1].healthy).toBe(false);
  });
});
```

## CLAUDE.md Integration

```markdown
# Uptime Kuma Integration

## Monitor Management Commands

### Add HTTP Monitor
```bash
# Add a new HTTP monitor via API
curl -X POST http://localhost:3001/api/monitors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Health",
    "type": "http",
    "url": "https://api.example.com/health",
    "interval": 60
  }'
```

### List Monitors
```bash
# Get all monitors
curl http://localhost:3001/api/monitors
```

## Status Page URLs
- Main status page: https://status.example.com
- API status: https://status.example.com/api
- Badge SVG: https://status.example.com/badge.svg

## Push Monitor Endpoints
- Production: https://uptime.example.com/api/push/prod-token
- Staging: https://uptime.example.com/api/push/staging-token

## Maintenance Windows
- Weekly maintenance: Sundays 02:00-04:00 UTC
- Emergency maintenance: Contact ops team

## Notification Channels
- Slack: #alerts-uptime
- PagerDuty: Production Critical service
- Email: ops@example.com
```

## AI Suggestions

1. **Multi-Region Monitoring** - Deploy Uptime Kuma instances in multiple regions with centralized aggregation for global latency visibility
2. **Synthetic Transactions** - Implement multi-step synthetic transaction monitors that simulate user journeys
3. **Certificate Monitoring** - Add SSL certificate expiration monitors with advance warning notifications
4. **Dependency Mapping** - Create automatic service dependency maps based on monitor relationships
5. **Incident Correlation** - Implement AI-powered incident correlation across multiple failing monitors
6. **SLA Reporting** - Generate automated SLA compliance reports with historical uptime data
7. **Capacity Prediction** - Use response time trends to predict capacity issues before they cause outages
8. **Smart Alerting** - Implement alert fatigue reduction with intelligent alert grouping and deduplication
9. **Integration Testing** - Add post-deployment smoke test monitors that automatically verify new releases
10. **Cost Optimization** - Monitor cloud resource health alongside cost metrics to identify over-provisioned services
