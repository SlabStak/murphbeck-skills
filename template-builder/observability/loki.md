# Grafana Loki Template

Log aggregation system for cloud-native environments with label-based indexing and LogQL query language.

## Overview

Grafana Loki is a horizontally scalable, highly available log aggregation system inspired by Prometheus. It indexes log metadata (labels) rather than log content, making it cost-effective and efficient for large-scale deployments.

## Installation

### Docker Compose Setup

```yaml
# docker-compose.yml
version: "3.8"

services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    healthcheck:
      test: ["CMD-SHELL", "wget --spider http://localhost:3100/ready || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - ./promtail-config.yaml:/etc/promtail/config.yaml
      - /var/log:/var/log:ro
      - /var/run/docker.sock:/var/run/docker.sock
    command: -config.file=/etc/promtail/config.yaml
    depends_on:
      - loki

  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-datasources.yaml:/etc/grafana/provisioning/datasources/datasources.yaml
    depends_on:
      - loki

volumes:
  loki-data:
  grafana-data:
```

### Loki Configuration

```yaml
# loki-config.yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096
  log_level: info

common:
  instance_addr: 127.0.0.1
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  max_cache_freshness_per_query: 10m
  split_queries_by_interval: 15m
  ingestion_rate_mb: 10
  ingestion_burst_size_mb: 20
  per_stream_rate_limit: 5MB
  per_stream_rate_limit_burst: 15MB

analytics:
  reporting_enabled: false
```

### Promtail Configuration

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push
    tenant_id: default

scrape_configs:
  # Docker container logs
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        target_label: container
        regex: '/(.+)'
      - source_labels: ['__meta_docker_container_log_stream']
        target_label: stream
      - source_labels: ['__meta_docker_container_label_com_docker_compose_service']
        target_label: service
      - source_labels: ['__meta_docker_container_label_com_docker_compose_project']
        target_label: project
    pipeline_stages:
      - json:
          expressions:
            level: level
            msg: msg
            timestamp: timestamp
      - labels:
          level:
      - timestamp:
          source: timestamp
          format: RFC3339

  # Application logs from files
  - job_name: app_logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: app
          __path__: /var/log/app/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            service: service
            message: message
            request_id: request_id
      - labels:
          level:
          service:
      - output:
          source: message

  # Kubernetes pods (if running in k8s)
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: ['__meta_kubernetes_namespace']
        target_label: namespace
      - source_labels: ['__meta_kubernetes_pod_name']
        target_label: pod
      - source_labels: ['__meta_kubernetes_pod_container_name']
        target_label: container
      - source_labels: ['__meta_kubernetes_pod_label_app']
        target_label: app
```

### Grafana Datasource

```yaml
# grafana-datasources.yaml
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    isDefault: true
    jsonData:
      maxLines: 1000
      derivedFields:
        - datasourceUid: tempo
          matcherRegex: "trace_id=(\\w+)"
          name: TraceID
          url: "$${__value.raw}"
```

## Application Integration

### Node.js with Pino

```typescript
// lib/loki-transport.ts
import pino from 'pino';
import build from 'pino-abstract-transport';

interface LokiTransportOptions {
  host: string;
  labels?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
  timeout?: number;
}

interface LokiStream {
  stream: Record<string, string>;
  values: [string, string][];
}

interface LokiPayload {
  streams: LokiStream[];
}

export default async function (options: LokiTransportOptions) {
  const {
    host,
    labels = {},
    batchSize = 100,
    flushInterval = 5000,
    timeout = 5000,
  } = options;

  const defaultLabels = {
    app: process.env.SERVICE_NAME || 'app',
    environment: process.env.NODE_ENV || 'development',
    ...labels,
  };

  let buffer: { labels: Record<string, string>; timestamp: string; line: string }[] = [];
  let flushTimer: NodeJS.Timeout | null = null;

  const flush = async () => {
    if (buffer.length === 0) return;

    const streams = new Map<string, [string, string][]>();

    for (const entry of buffer) {
      const labelKey = JSON.stringify(entry.labels);
      if (!streams.has(labelKey)) {
        streams.set(labelKey, []);
      }
      streams.get(labelKey)!.push([entry.timestamp, entry.line]);
    }

    const payload: LokiPayload = {
      streams: Array.from(streams.entries()).map(([labelKey, values]) => ({
        stream: JSON.parse(labelKey),
        values,
      })),
    };

    buffer = [];

    try {
      const response = await fetch(`${host}/loki/api/v1/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        console.error(`Loki push failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to push logs to Loki:', error);
    }
  };

  const scheduleFlush = () => {
    if (flushTimer) return;
    flushTimer = setTimeout(async () => {
      flushTimer = null;
      await flush();
    }, flushInterval);
  };

  return build(
    async function (source) {
      for await (const obj of source) {
        const { level, time, msg, ...rest } = obj;

        const levelName = pino.levels.labels[level] || 'info';

        const labels = {
          ...defaultLabels,
          level: levelName,
        };

        // Extract known labels from log
        if (rest.service) {
          labels.service = rest.service;
          delete rest.service;
        }

        const timestamp = (BigInt(time) * 1000000n).toString(); // Convert to nanoseconds

        const line = JSON.stringify({
          level: levelName,
          message: msg,
          ...rest,
        });

        buffer.push({ labels, timestamp, line });

        if (buffer.length >= batchSize) {
          await flush();
        } else {
          scheduleFlush();
        }
      }

      // Final flush
      await flush();
    },
    {
      async close() {
        if (flushTimer) {
          clearTimeout(flushTimer);
        }
        await flush();
      },
    }
  );
}
```

### Logger Setup

```typescript
// lib/logger.ts
import pino from 'pino';

const transports = pino.transport({
  targets: [
    // Console output
    {
      target: 'pino-pretty',
      level: 'debug',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    },
    // Loki output
    {
      target: './loki-transport',
      level: 'info',
      options: {
        host: process.env.LOKI_URL || 'http://localhost:3100',
        labels: {
          app: process.env.SERVICE_NAME || 'my-app',
          environment: process.env.NODE_ENV || 'development',
        },
        batchSize: 50,
        flushInterval: 3000,
      },
    },
  ],
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      service: process.env.SERVICE_NAME || 'my-app',
      version: process.env.APP_VERSION || '1.0.0',
    },
  },
  transports
);

export default logger;
```

### Python with Loki

```python
# lib/loki_handler.py
import json
import time
import logging
import threading
from typing import Dict, List, Any, Optional
from queue import Queue
import requests

class LokiHandler(logging.Handler):
    """
    Python logging handler that sends logs to Grafana Loki.
    """

    def __init__(
        self,
        url: str,
        labels: Optional[Dict[str, str]] = None,
        batch_size: int = 100,
        flush_interval: float = 5.0,
        timeout: float = 5.0,
    ):
        super().__init__()
        self.url = url.rstrip('/') + '/loki/api/v1/push'
        self.labels = labels or {}
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.timeout = timeout

        self._queue: Queue = Queue()
        self._stop_event = threading.Event()
        self._flush_thread = threading.Thread(target=self._flush_loop, daemon=True)
        self._flush_thread.start()

    def emit(self, record: logging.LogRecord) -> None:
        """Add log record to queue."""
        try:
            # Build labels
            labels = {
                **self.labels,
                'level': record.levelname.lower(),
                'logger': record.name,
            }

            # Extract custom labels from record
            if hasattr(record, 'labels'):
                labels.update(record.labels)

            # Build log line
            log_data = {
                'message': record.getMessage(),
                'level': record.levelname.lower(),
                'logger': record.name,
                'filename': record.filename,
                'lineno': record.lineno,
                'funcName': record.funcName,
            }

            # Add exception info
            if record.exc_info:
                log_data['exception'] = self.formatException(record.exc_info)

            # Add extra fields
            for key, value in record.__dict__.items():
                if key not in (
                    'name', 'msg', 'args', 'created', 'filename',
                    'funcName', 'levelname', 'levelno', 'lineno',
                    'module', 'msecs', 'pathname', 'process',
                    'processName', 'relativeCreated', 'stack_info',
                    'exc_info', 'exc_text', 'labels', 'message',
                    'thread', 'threadName',
                ):
                    log_data[key] = value

            # Timestamp in nanoseconds
            timestamp = str(int(record.created * 1e9))

            self._queue.put({
                'labels': labels,
                'timestamp': timestamp,
                'line': json.dumps(log_data),
            })

        except Exception as e:
            self.handleError(record)

    def _flush_loop(self) -> None:
        """Background thread that flushes logs periodically."""
        buffer: List[Dict[str, Any]] = []
        last_flush = time.time()

        while not self._stop_event.is_set():
            try:
                # Collect from queue with timeout
                while True:
                    try:
                        entry = self._queue.get(timeout=0.1)
                        buffer.append(entry)

                        if len(buffer) >= self.batch_size:
                            self._flush(buffer)
                            buffer = []
                            last_flush = time.time()

                    except:
                        break

                # Time-based flush
                if buffer and (time.time() - last_flush) >= self.flush_interval:
                    self._flush(buffer)
                    buffer = []
                    last_flush = time.time()

            except Exception as e:
                print(f"Loki flush error: {e}")

        # Final flush
        if buffer:
            self._flush(buffer)

    def _flush(self, buffer: List[Dict[str, Any]]) -> None:
        """Send logs to Loki."""
        if not buffer:
            return

        # Group by labels
        streams: Dict[str, List[tuple]] = {}
        for entry in buffer:
            label_key = json.dumps(entry['labels'], sort_keys=True)
            if label_key not in streams:
                streams[label_key] = []
            streams[label_key].append((entry['timestamp'], entry['line']))

        # Build payload
        payload = {
            'streams': [
                {
                    'stream': json.loads(label_key),
                    'values': values,
                }
                for label_key, values in streams.items()
            ]
        }

        try:
            response = requests.post(
                self.url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=self.timeout,
            )
            response.raise_for_status()
        except Exception as e:
            print(f"Failed to push to Loki: {e}")

    def close(self) -> None:
        """Stop the flush thread and flush remaining logs."""
        self._stop_event.set()
        self._flush_thread.join(timeout=10)
        super().close()


# Usage
def setup_loki_logging():
    """Configure logging with Loki handler."""
    import os

    # Create Loki handler
    loki_handler = LokiHandler(
        url=os.getenv('LOKI_URL', 'http://localhost:3100'),
        labels={
            'app': os.getenv('SERVICE_NAME', 'my-app'),
            'environment': os.getenv('ENVIRONMENT', 'development'),
        },
        batch_size=50,
        flush_interval=3.0,
    )
    loki_handler.setLevel(logging.INFO)

    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(loki_handler)
    root_logger.addHandler(console_handler)

    return root_logger
```

## LogQL Queries

### Basic Queries

```logql
# Simple log stream selection
{app="my-app"}

# Filter by level
{app="my-app", level="error"}

# Multiple label matchers
{app="my-app", environment="production", service="api"}

# Regex label matcher
{app=~"my-app|other-app"}

# Exclude labels
{app="my-app"} != "healthcheck"
```

### Log Line Filters

```logql
# Contains text
{app="my-app"} |= "error"

# Does not contain
{app="my-app"} != "debug"

# Regex filter
{app="my-app"} |~ "user_id=\\d+"

# Case insensitive
{app="my-app"} |~ "(?i)error"
```

### JSON Parsing

```logql
# Parse JSON and filter
{app="my-app"} | json | level="error"

# Extract specific fields
{app="my-app"} | json | line_format "{{.message}}"

# Filter on parsed fields
{app="my-app"} | json | status_code >= 500

# Extract nested JSON
{app="my-app"} | json | json request_body="request.body"
```

### Metric Queries

```logql
# Count logs over time
count_over_time({app="my-app"}[5m])

# Error rate
sum(rate({app="my-app", level="error"}[5m])) by (service)

# Log throughput
sum(rate({app="my-app"}[1m])) by (level)

# Percentiles from extracted duration
quantile_over_time(0.99, {app="my-app"} | json | unwrap duration_ms [5m]) by (endpoint)

# Top endpoints by error count
topk(10, sum(count_over_time({app="my-app", level="error"}[1h])) by (endpoint))
```

### Advanced Queries

```logql
# Average response time by endpoint
avg_over_time(
  {app="my-app"}
  | json
  | unwrap response_time_ms [5m]
) by (endpoint)

# Error rate percentage
sum(rate({app="my-app", level="error"}[5m])) /
sum(rate({app="my-app"}[5m])) * 100

# Logs with high latency
{app="my-app"}
| json
| duration_ms > 1000
| line_format "{{.method}} {{.path}} - {{.duration_ms}}ms"

# Group errors by type
sum by (error_type) (
  count_over_time(
    {app="my-app", level="error"}
    | json
    [1h]
  )
)
```

## Grafana Dashboard

### Dashboard JSON

```json
{
  "dashboard": {
    "title": "Application Logs",
    "panels": [
      {
        "title": "Log Volume",
        "type": "timeseries",
        "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "sum(rate({app=\"$app\"}[$__interval])) by (level)",
            "legendFormat": "{{level}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "gridPos": { "x": 12, "y": 0, "w": 6, "h": 4 },
        "targets": [
          {
            "expr": "sum(rate({app=\"$app\", level=\"error\"}[5m])) / sum(rate({app=\"$app\"}[5m])) * 100"
          }
        ],
        "options": {
          "reduceOptions": {
            "calcs": ["lastNotNull"]
          }
        },
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 1 },
                { "color": "red", "value": 5 }
              ]
            }
          }
        }
      },
      {
        "title": "Recent Errors",
        "type": "logs",
        "gridPos": { "x": 0, "y": 8, "w": 24, "h": 10 },
        "targets": [
          {
            "expr": "{app=\"$app\", level=\"error\"}"
          }
        ],
        "options": {
          "showTime": true,
          "showLabels": true,
          "wrapLogMessage": true,
          "enableLogDetails": true
        }
      },
      {
        "title": "Log Stream",
        "type": "logs",
        "gridPos": { "x": 0, "y": 18, "w": 24, "h": 12 },
        "targets": [
          {
            "expr": "{app=\"$app\"} |= \"$search\""
          }
        ]
      }
    ],
    "templating": {
      "list": [
        {
          "name": "app",
          "type": "query",
          "query": "label_values(app)",
          "datasource": "Loki"
        },
        {
          "name": "search",
          "type": "textbox",
          "label": "Search"
        }
      ]
    }
  }
}
```

## Alerting Rules

### Loki Ruler Configuration

```yaml
# loki-rules.yaml
groups:
  - name: application_alerts
    interval: 1m
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate({app="my-app", level="error"}[5m])) /
          sum(rate({app="my-app"}[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | printf \"%.2f\" }}% for app {{ $labels.app }}"

      - alert: NoLogs
        expr: |
          absent_over_time({app="my-app"}[15m])
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "No logs received"
          description: "No logs from {{ $labels.app }} for 15 minutes"

      - alert: SlowRequests
        expr: |
          quantile_over_time(0.95,
            {app="my-app"}
            | json
            | unwrap duration_ms [5m]
          ) > 2000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow request latency"
          description: "95th percentile latency is {{ $value }}ms"
```

## Testing

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Loki Integration', () => {
  const LOKI_URL = process.env.LOKI_URL || 'http://localhost:3100';

  it('should be ready', async () => {
    const response = await fetch(`${LOKI_URL}/ready`);
    expect(response.ok).toBe(true);
  });

  it('should push logs', async () => {
    const payload = {
      streams: [
        {
          stream: { app: 'test', level: 'info' },
          values: [[`${Date.now() * 1000000}`, JSON.stringify({ message: 'test' })]],
        },
      ],
    };

    const response = await fetch(`${LOKI_URL}/loki/api/v1/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(204);
  });

  it('should query logs', async () => {
    const query = encodeURIComponent('{app="test"}');
    const response = await fetch(
      `${LOKI_URL}/loki/api/v1/query_range?query=${query}&limit=10`
    );

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('success');
  });
});
```

## CLAUDE.md Integration

```markdown
## Log Aggregation with Loki

This project uses Grafana Loki for log aggregation.

### Architecture
- Application logs are sent to Loki via push API
- Promtail collects container/file logs
- Grafana provides log visualization and querying

### Log Format
Logs should be JSON formatted with consistent fields:
- `level`: Log level (debug, info, warn, error)
- `message`: Human-readable message
- `service`: Service name
- `request_id`: Request correlation ID

### LogQL Quick Reference
```logql
# Basic query
{app="my-app"}

# Filter by level
{app="my-app", level="error"}

# Text search
{app="my-app"} |= "error"

# JSON parsing
{app="my-app"} | json | status_code >= 500

# Metrics
sum(rate({app="my-app"}[5m])) by (level)
```

### Best Practices
1. Use consistent labels across services
2. Include request_id for correlation
3. Keep log lines under 10KB
4. Use structured JSON logging
```

## AI Suggestions

1. **Multi-Tenant Setup**: Configure Loki for multi-tenant log isolation
2. **Log Retention Policies**: Implement tiered retention with compaction
3. **Index Optimization**: Tune chunk and index settings for query performance
4. **High Availability**: Deploy Loki in distributed mode for production
5. **Cross-Service Correlation**: Implement trace ID propagation for distributed tracing
6. **Alert Integration**: Connect Loki alerts to PagerDuty/OpsGenie
7. **Log Parsing Pipelines**: Create standardized Promtail pipelines for common formats
8. **Dashboard Templates**: Build reusable Grafana dashboards for common patterns
9. **Cost Optimization**: Implement log sampling and filtering for high-volume services
10. **Backup Strategy**: Configure S3/GCS backend for log durability
