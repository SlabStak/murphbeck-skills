# AWS CloudWatch Integration Template

## Installation

```bash
npm install @aws-sdk/client-cloudwatch @aws-sdk/client-cloudwatch-logs @aws-sdk/client-cloudwatch-events aws-embedded-metrics
```

## Environment Variables

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# CloudWatch Configuration
CLOUDWATCH_LOG_GROUP=/app/production
CLOUDWATCH_LOG_STREAM=app-server
CLOUDWATCH_NAMESPACE=MyApplication
CLOUDWATCH_ENABLED=true

# Metrics Configuration
METRICS_FLUSH_INTERVAL=60000
METRICS_BATCH_SIZE=20

# Alarms Configuration
ALARM_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:alerts
```

## Project Structure

```
src/
├── lib/
│   └── cloudwatch/
│       ├── index.ts
│       ├── client.ts
│       ├── logs.ts
│       ├── metrics.ts
│       ├── alarms.ts
│       ├── events.ts
│       ├── insights.ts
│       └── types.ts
├── middleware/
│   └── cloudwatch.ts
├── components/
│   └── CloudWatchDashboard.tsx
└── app/
    └── api/
        └── cloudwatch/
            └── route.ts
```

## Type Definitions

```typescript
// src/lib/cloudwatch/types.ts
import { MetricDatum, StandardUnit, Statistic } from '@aws-sdk/client-cloudwatch';

export interface CloudWatchConfig {
  region: string;
  namespace: string;
  logGroup: string;
  logStream: string;
  enabled: boolean;
  flushInterval: number;
  batchSize: number;
}

export interface LogEvent {
  timestamp: Date;
  message: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  context?: Record<string, unknown>;
  requestId?: string;
  traceId?: string;
}

export interface MetricData {
  name: string;
  value: number;
  unit: StandardUnit;
  dimensions?: Record<string, string>;
  timestamp?: Date;
  storageResolution?: 1 | 60; // 1 for high-res, 60 for standard
}

export interface AlarmConfig {
  name: string;
  description?: string;
  metricName: string;
  namespace: string;
  statistic: Statistic;
  period: number;
  evaluationPeriods: number;
  threshold: number;
  comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  actionsEnabled: boolean;
  alarmActions?: string[];
  okActions?: string[];
  insufficientDataActions?: string[];
  dimensions?: Record<string, string>;
  treatMissingData?: 'breaching' | 'notBreaching' | 'ignore' | 'missing';
}

export interface InsightQuery {
  logGroupNames: string[];
  queryString: string;
  startTime: Date;
  endTime: Date;
  limit?: number;
}

export interface InsightResult {
  field: string;
  value: string;
}

export interface EventRule {
  name: string;
  description?: string;
  scheduleExpression?: string;
  eventPattern?: Record<string, unknown>;
  state: 'ENABLED' | 'DISABLED';
  targets: EventTarget[];
}

export interface EventTarget {
  id: string;
  arn: string;
  input?: string;
  inputPath?: string;
  inputTransformer?: {
    inputPathsMap: Record<string, string>;
    inputTemplate: string;
  };
}

export interface DashboardWidget {
  type: 'metric' | 'text' | 'log' | 'alarm';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, unknown>;
}

export interface Dashboard {
  name: string;
  widgets: DashboardWidget[];
  periodOverride?: 'inherit' | 'auto';
}

export interface MetricStatistics {
  minimum: number;
  maximum: number;
  average: number;
  sum: number;
  sampleCount: number;
}
```

## CloudWatch Client

```typescript
// src/lib/cloudwatch/client.ts
import {
  CloudWatchClient,
  PutMetricDataCommand,
  GetMetricStatisticsCommand,
  PutDashboardCommand,
  GetDashboardCommand,
  ListDashboardsCommand,
  DeleteDashboardsCommand,
  DescribeAlarmsCommand,
  PutMetricAlarmCommand,
  DeleteAlarmsCommand,
  SetAlarmStateCommand,
  StandardUnit,
  Statistic,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  GetLogEventsCommand,
  FilterLogEventsCommand,
  StartQueryCommand,
  GetQueryResultsCommand,
  DescribeLogGroupsCommand,
  DeleteLogGroupCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchEventsClient,
  PutRuleCommand,
  PutTargetsCommand,
  RemoveTargetsCommand,
  DeleteRuleCommand,
  ListRulesCommand,
  DescribeRuleCommand,
} from '@aws-sdk/client-cloudwatch-events';
import {
  CloudWatchConfig,
  MetricData,
  LogEvent,
  AlarmConfig,
  InsightQuery,
  EventRule,
  Dashboard,
} from './types';

export class CloudWatchManager {
  private cwClient: CloudWatchClient;
  private logsClient: CloudWatchLogsClient;
  private eventsClient: CloudWatchEventsClient;
  private config: CloudWatchConfig;
  private metricBuffer: MetricData[] = [];
  private logBuffer: LogEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sequenceToken: string | undefined;

  constructor(config: CloudWatchConfig) {
    this.config = config;

    this.cwClient = new CloudWatchClient({ region: config.region });
    this.logsClient = new CloudWatchLogsClient({ region: config.region });
    this.eventsClient = new CloudWatchEventsClient({ region: config.region });

    if (config.enabled) {
      this.startFlushTimer();
      this.initializeLogStream();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private async initializeLogStream(): Promise<void> {
    try {
      await this.logsClient.send(new CreateLogGroupCommand({
        logGroupName: this.config.logGroup,
      }));
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error('Failed to create log group:', error);
      }
    }

    try {
      await this.logsClient.send(new CreateLogStreamCommand({
        logGroupName: this.config.logGroup,
        logStreamName: this.config.logStream,
      }));
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error('Failed to create log stream:', error);
      }
    }
  }

  // Metrics Methods
  async putMetric(metric: MetricData): Promise<void> {
    if (!this.config.enabled) return;

    this.metricBuffer.push(metric);

    if (this.metricBuffer.length >= this.config.batchSize) {
      await this.flushMetrics();
    }
  }

  async putMetrics(metrics: MetricData[]): Promise<void> {
    if (!this.config.enabled) return;

    this.metricBuffer.push(...metrics);

    if (this.metricBuffer.length >= this.config.batchSize) {
      await this.flushMetrics();
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricBuffer.length === 0) return;

    const metricsToSend = this.metricBuffer.splice(0, 20); // CloudWatch limit is 20 per request

    try {
      await this.cwClient.send(new PutMetricDataCommand({
        Namespace: this.config.namespace,
        MetricData: metricsToSend.map(m => ({
          MetricName: m.name,
          Value: m.value,
          Unit: m.unit,
          Timestamp: m.timestamp || new Date(),
          StorageResolution: m.storageResolution,
          Dimensions: m.dimensions ? Object.entries(m.dimensions).map(([Name, Value]) => ({ Name, Value })) : undefined,
        })),
      }));
    } catch (error) {
      console.error('Failed to put metrics:', error);
      // Re-add to buffer for retry
      this.metricBuffer.unshift(...metricsToSend);
    }
  }

  async getMetricStatistics(
    metricName: string,
    startTime: Date,
    endTime: Date,
    period: number,
    statistics: Statistic[],
    dimensions?: Record<string, string>
  ): Promise<any> {
    const response = await this.cwClient.send(new GetMetricStatisticsCommand({
      Namespace: this.config.namespace,
      MetricName: metricName,
      StartTime: startTime,
      EndTime: endTime,
      Period: period,
      Statistics: statistics,
      Dimensions: dimensions ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })) : undefined,
    }));

    return response.Datapoints;
  }

  // Logging Methods
  async log(event: LogEvent): Promise<void> {
    if (!this.config.enabled) return;

    this.logBuffer.push(event);

    if (this.logBuffer.length >= this.config.batchSize) {
      await this.flushLogs();
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = this.logBuffer.splice(0, 10000); // CloudWatch limit is 10000 per request

    const logEvents = logsToSend
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(event => ({
        timestamp: event.timestamp.getTime(),
        message: JSON.stringify({
          level: event.level,
          message: event.message,
          context: event.context,
          requestId: event.requestId,
          traceId: event.traceId,
        }),
      }));

    try {
      const response = await this.logsClient.send(new PutLogEventsCommand({
        logGroupName: this.config.logGroup,
        logStreamName: this.config.logStream,
        logEvents,
        sequenceToken: this.sequenceToken,
      }));

      this.sequenceToken = response.nextSequenceToken;
    } catch (error: any) {
      if (error.name === 'InvalidSequenceTokenException') {
        this.sequenceToken = error.expectedSequenceToken;
        this.logBuffer.unshift(...logsToSend);
        await this.flushLogs();
      } else {
        console.error('Failed to put log events:', error);
        this.logBuffer.unshift(...logsToSend);
      }
    }
  }

  async queryLogs(query: InsightQuery): Promise<any[]> {
    const startQuery = await this.logsClient.send(new StartQueryCommand({
      logGroupNames: query.logGroupNames,
      queryString: query.queryString,
      startTime: Math.floor(query.startTime.getTime() / 1000),
      endTime: Math.floor(query.endTime.getTime() / 1000),
      limit: query.limit || 1000,
    }));

    const queryId = startQuery.queryId!;
    let status = 'Running';
    let results: any[] = [];

    while (status === 'Running' || status === 'Scheduled') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const queryResults = await this.logsClient.send(new GetQueryResultsCommand({
        queryId,
      }));

      status = queryResults.status || 'Complete';
      results = queryResults.results || [];
    }

    return results.map(row =>
      row.reduce((acc: Record<string, string>, item: any) => {
        acc[item.field] = item.value;
        return acc;
      }, {})
    );
  }

  // Alarm Methods
  async createAlarm(alarm: AlarmConfig): Promise<void> {
    await this.cwClient.send(new PutMetricAlarmCommand({
      AlarmName: alarm.name,
      AlarmDescription: alarm.description,
      MetricName: alarm.metricName,
      Namespace: alarm.namespace,
      Statistic: alarm.statistic,
      Period: alarm.period,
      EvaluationPeriods: alarm.evaluationPeriods,
      Threshold: alarm.threshold,
      ComparisonOperator: alarm.comparisonOperator,
      ActionsEnabled: alarm.actionsEnabled,
      AlarmActions: alarm.alarmActions,
      OKActions: alarm.okActions,
      InsufficientDataActions: alarm.insufficientDataActions,
      Dimensions: alarm.dimensions ? Object.entries(alarm.dimensions).map(([Name, Value]) => ({ Name, Value })) : undefined,
      TreatMissingData: alarm.treatMissingData,
    }));
  }

  async getAlarms(alarmNames?: string[]): Promise<any[]> {
    const response = await this.cwClient.send(new DescribeAlarmsCommand({
      AlarmNames: alarmNames,
    }));

    return response.MetricAlarms || [];
  }

  async deleteAlarms(alarmNames: string[]): Promise<void> {
    await this.cwClient.send(new DeleteAlarmsCommand({
      AlarmNames: alarmNames,
    }));
  }

  async setAlarmState(
    alarmName: string,
    state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA',
    reason: string
  ): Promise<void> {
    await this.cwClient.send(new SetAlarmStateCommand({
      AlarmName: alarmName,
      StateValue: state,
      StateReason: reason,
    }));
  }

  // Dashboard Methods
  async createDashboard(dashboard: Dashboard): Promise<void> {
    const dashboardBody = {
      widgets: dashboard.widgets.map(widget => ({
        type: widget.type,
        x: widget.x,
        y: widget.y,
        width: widget.width,
        height: widget.height,
        properties: widget.properties,
      })),
      periodOverride: dashboard.periodOverride,
    };

    await this.cwClient.send(new PutDashboardCommand({
      DashboardName: dashboard.name,
      DashboardBody: JSON.stringify(dashboardBody),
    }));
  }

  async getDashboard(name: string): Promise<any> {
    const response = await this.cwClient.send(new GetDashboardCommand({
      DashboardName: name,
    }));

    return {
      name: response.DashboardName,
      body: JSON.parse(response.DashboardBody || '{}'),
      arn: response.DashboardArn,
    };
  }

  async listDashboards(): Promise<any[]> {
    const response = await this.cwClient.send(new ListDashboardsCommand({}));
    return response.DashboardEntries || [];
  }

  async deleteDashboards(names: string[]): Promise<void> {
    await this.cwClient.send(new DeleteDashboardsCommand({
      DashboardNames: names,
    }));
  }

  // Event Methods
  async createEventRule(rule: EventRule): Promise<void> {
    await this.eventsClient.send(new PutRuleCommand({
      Name: rule.name,
      Description: rule.description,
      ScheduleExpression: rule.scheduleExpression,
      EventPattern: rule.eventPattern ? JSON.stringify(rule.eventPattern) : undefined,
      State: rule.state,
    }));

    if (rule.targets.length > 0) {
      await this.eventsClient.send(new PutTargetsCommand({
        Rule: rule.name,
        Targets: rule.targets.map(target => ({
          Id: target.id,
          Arn: target.arn,
          Input: target.input,
          InputPath: target.inputPath,
          InputTransformer: target.inputTransformer,
        })),
      }));
    }
  }

  async deleteEventRule(ruleName: string, targetIds: string[]): Promise<void> {
    if (targetIds.length > 0) {
      await this.eventsClient.send(new RemoveTargetsCommand({
        Rule: ruleName,
        Ids: targetIds,
      }));
    }

    await this.eventsClient.send(new DeleteRuleCommand({
      Name: ruleName,
    }));
  }

  async listEventRules(): Promise<any[]> {
    const response = await this.eventsClient.send(new ListRulesCommand({}));
    return response.Rules || [];
  }

  // Flush and cleanup
  async flush(): Promise<void> {
    await Promise.all([
      this.flushMetrics(),
      this.flushLogs(),
    ]);
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

// Singleton instance
let cloudWatchManager: CloudWatchManager | null = null;

export function getCloudWatchManager(): CloudWatchManager {
  if (!cloudWatchManager) {
    cloudWatchManager = new CloudWatchManager({
      region: process.env.AWS_REGION || 'us-east-1',
      namespace: process.env.CLOUDWATCH_NAMESPACE || 'MyApplication',
      logGroup: process.env.CLOUDWATCH_LOG_GROUP || '/app/production',
      logStream: process.env.CLOUDWATCH_LOG_STREAM || `app-${Date.now()}`,
      enabled: process.env.CLOUDWATCH_ENABLED === 'true',
      flushInterval: parseInt(process.env.METRICS_FLUSH_INTERVAL || '60000'),
      batchSize: parseInt(process.env.METRICS_BATCH_SIZE || '20'),
    });
  }
  return cloudWatchManager;
}
```

## CloudWatch Logger

```typescript
// src/lib/cloudwatch/logs.ts
import { getCloudWatchManager } from './client';
import { LogEvent } from './types';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

export class CloudWatchLogger {
  private minLevel: LogLevel;
  private defaultContext: Record<string, unknown>;
  private requestId?: string;
  private traceId?: string;

  constructor(options: {
    minLevel?: LogLevel;
    defaultContext?: Record<string, unknown>;
    requestId?: string;
    traceId?: string;
  } = {}) {
    this.minLevel = options.minLevel || 'INFO';
    this.defaultContext = options.defaultContext || {};
    this.requestId = options.requestId;
    this.traceId = options.traceId;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private async logEvent(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const event: LogEvent = {
      timestamp: new Date(),
      message,
      level,
      context: { ...this.defaultContext, ...context },
      requestId: this.requestId,
      traceId: this.traceId,
    };

    await getCloudWatchManager().log(event);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logEvent('DEBUG', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logEvent('INFO', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logEvent('WARN', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.logEvent('ERROR', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.logEvent('FATAL', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  child(context: Record<string, unknown>): CloudWatchLogger {
    return new CloudWatchLogger({
      minLevel: this.minLevel,
      defaultContext: { ...this.defaultContext, ...context },
      requestId: this.requestId,
      traceId: this.traceId,
    });
  }

  withRequestId(requestId: string): CloudWatchLogger {
    return new CloudWatchLogger({
      minLevel: this.minLevel,
      defaultContext: this.defaultContext,
      requestId,
      traceId: this.traceId,
    });
  }

  withTraceId(traceId: string): CloudWatchLogger {
    return new CloudWatchLogger({
      minLevel: this.minLevel,
      defaultContext: this.defaultContext,
      requestId: this.requestId,
      traceId,
    });
  }
}

export const logger = new CloudWatchLogger({
  minLevel: (process.env.LOG_LEVEL as LogLevel) || 'INFO',
});
```

## CloudWatch Metrics Helper

```typescript
// src/lib/cloudwatch/metrics.ts
import { StandardUnit } from '@aws-sdk/client-cloudwatch';
import { getCloudWatchManager } from './client';
import { MetricData } from './types';

export class CloudWatchMetrics {
  private namespace: string;
  private defaultDimensions: Record<string, string>;

  constructor(namespace?: string, defaultDimensions?: Record<string, string>) {
    this.namespace = namespace || process.env.CLOUDWATCH_NAMESPACE || 'MyApplication';
    this.defaultDimensions = defaultDimensions || {};
  }

  private async putMetric(metric: MetricData): Promise<void> {
    await getCloudWatchManager().putMetric({
      ...metric,
      dimensions: { ...this.defaultDimensions, ...metric.dimensions },
    });
  }

  // Counter metrics
  async incrementCounter(
    name: string,
    value: number = 1,
    dimensions?: Record<string, string>
  ): Promise<void> {
    await this.putMetric({
      name,
      value,
      unit: StandardUnit.Count,
      dimensions,
    });
  }

  // Gauge metrics
  async recordGauge(
    name: string,
    value: number,
    unit: StandardUnit = StandardUnit.None,
    dimensions?: Record<string, string>
  ): Promise<void> {
    await this.putMetric({
      name,
      value,
      unit,
      dimensions,
    });
  }

  // Timing metrics
  async recordTiming(
    name: string,
    milliseconds: number,
    dimensions?: Record<string, string>
  ): Promise<void> {
    await this.putMetric({
      name,
      value: milliseconds,
      unit: StandardUnit.Milliseconds,
      dimensions,
    });
  }

  // High-resolution metrics
  async recordHighResolution(
    name: string,
    value: number,
    unit: StandardUnit = StandardUnit.None,
    dimensions?: Record<string, string>
  ): Promise<void> {
    await this.putMetric({
      name,
      value,
      unit,
      dimensions,
      storageResolution: 1,
    });
  }

  // Percentage metrics
  async recordPercentage(
    name: string,
    value: number,
    dimensions?: Record<string, string>
  ): Promise<void> {
    await this.putMetric({
      name,
      value,
      unit: StandardUnit.Percent,
      dimensions,
    });
  }

  // Byte metrics
  async recordBytes(
    name: string,
    bytes: number,
    dimensions?: Record<string, string>
  ): Promise<void> {
    await this.putMetric({
      name,
      value: bytes,
      unit: StandardUnit.Bytes,
      dimensions,
    });
  }

  // Helper for timing operations
  async timeOperation<T>(
    name: string,
    operation: () => Promise<T>,
    dimensions?: Record<string, string>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      await this.recordTiming(name, Date.now() - start, {
        ...dimensions,
        status: 'success',
      });
      return result;
    } catch (error) {
      await this.recordTiming(name, Date.now() - start, {
        ...dimensions,
        status: 'error',
      });
      throw error;
    }
  }

  // Child metrics with additional dimensions
  withDimensions(dimensions: Record<string, string>): CloudWatchMetrics {
    return new CloudWatchMetrics(this.namespace, {
      ...this.defaultDimensions,
      ...dimensions,
    });
  }
}

export const metrics = new CloudWatchMetrics();

// Common business metrics
export const businessMetrics = {
  async userSignup(plan: string): Promise<void> {
    await metrics.incrementCounter('UserSignups', 1, { plan });
  },

  async orderPlaced(amount: number, currency: string): Promise<void> {
    await metrics.incrementCounter('OrdersPlaced', 1, { currency });
    await metrics.recordGauge('OrderValue', amount, StandardUnit.None, { currency });
  },

  async apiCall(endpoint: string, statusCode: number, latency: number): Promise<void> {
    await metrics.incrementCounter('APIRequests', 1, {
      endpoint,
      statusCode: statusCode.toString(),
    });
    await metrics.recordTiming('APILatency', latency, { endpoint });
  },

  async cacheHit(cache: string): Promise<void> {
    await metrics.incrementCounter('CacheHits', 1, { cache });
  },

  async cacheMiss(cache: string): Promise<void> {
    await metrics.incrementCounter('CacheMisses', 1, { cache });
  },

  async queueDepth(queue: string, depth: number): Promise<void> {
    await metrics.recordGauge('QueueDepth', depth, StandardUnit.Count, { queue });
  },

  async errorOccurred(errorType: string, service: string): Promise<void> {
    await metrics.incrementCounter('Errors', 1, { errorType, service });
  },
};
```

## Embedded Metrics Format (EMF)

```typescript
// src/lib/cloudwatch/emf.ts
import { createMetricsLogger, Unit, StorageResolution } from 'aws-embedded-metrics';

export class EMFLogger {
  private namespace: string;
  private defaultDimensions: Record<string, string>;

  constructor(namespace: string, defaultDimensions?: Record<string, string>) {
    this.namespace = namespace;
    this.defaultDimensions = defaultDimensions || {};
  }

  async logMetrics(
    metrics: Record<string, number>,
    dimensions?: Record<string, string>,
    properties?: Record<string, unknown>
  ): Promise<void> {
    const metricsLogger = createMetricsLogger();

    metricsLogger.setNamespace(this.namespace);

    // Set dimensions
    const allDimensions = { ...this.defaultDimensions, ...dimensions };
    Object.entries(allDimensions).forEach(([key, value]) => {
      metricsLogger.setDimensions({ [key]: value });
    });

    // Set metrics
    Object.entries(metrics).forEach(([name, value]) => {
      metricsLogger.putMetric(name, value, Unit.Count);
    });

    // Set properties
    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        metricsLogger.setProperty(key, value);
      });
    }

    await metricsLogger.flush();
  }

  async logRequestMetrics(
    path: string,
    method: string,
    statusCode: number,
    latencyMs: number,
    requestId: string
  ): Promise<void> {
    const metricsLogger = createMetricsLogger();

    metricsLogger.setNamespace(this.namespace);
    metricsLogger.setDimensions({
      ...this.defaultDimensions,
      Path: path,
      Method: method,
      StatusCode: statusCode.toString(),
    });

    metricsLogger.putMetric('RequestCount', 1, Unit.Count);
    metricsLogger.putMetric('Latency', latencyMs, Unit.Milliseconds);

    if (statusCode >= 400 && statusCode < 500) {
      metricsLogger.putMetric('4xxErrors', 1, Unit.Count);
    } else if (statusCode >= 500) {
      metricsLogger.putMetric('5xxErrors', 1, Unit.Count);
    }

    metricsLogger.setProperty('RequestId', requestId);
    metricsLogger.setProperty('Timestamp', new Date().toISOString());

    await metricsLogger.flush();
  }

  async logHighResolutionMetric(
    name: string,
    value: number,
    unit: Unit = Unit.Count,
    dimensions?: Record<string, string>
  ): Promise<void> {
    const metricsLogger = createMetricsLogger();

    metricsLogger.setNamespace(this.namespace);

    const allDimensions = { ...this.defaultDimensions, ...dimensions };
    Object.entries(allDimensions).forEach(([key, value]) => {
      metricsLogger.setDimensions({ [key]: value });
    });

    metricsLogger.putMetric(name, value, unit, StorageResolution.High);

    await metricsLogger.flush();
  }
}

export const emfLogger = new EMFLogger(
  process.env.CLOUDWATCH_NAMESPACE || 'MyApplication',
  { Environment: process.env.NODE_ENV || 'development' }
);
```

## Next.js Middleware

```typescript
// src/middleware/cloudwatch.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/cloudwatch/logs';
import { metrics } from '@/lib/cloudwatch/metrics';
import { emfLogger } from '@/lib/cloudwatch/emf';

export async function cloudWatchMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const traceId = request.headers.get('x-amzn-trace-id') || crypto.randomUUID();

  // Log incoming request
  const requestLogger = logger.withRequestId(requestId).withTraceId(traceId);
  requestLogger.info('Incoming request', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
  });

  // Continue with request
  const response = NextResponse.next();

  // Add request/trace IDs to response
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-amzn-trace-id', traceId);

  // Log and record metrics (async)
  const latency = Date.now() - startTime;

  // Using traditional metrics
  metrics.recordTiming('http_request_duration', latency, {
    method: request.method,
    path: new URL(request.url).pathname,
  });

  // Using EMF for Lambda/container environments
  emfLogger.logRequestMetrics(
    new URL(request.url).pathname,
    request.method,
    200, // Actual status would come from response
    latency,
    requestId
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## API Route Handler

```typescript
// src/app/api/cloudwatch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCloudWatchManager } from '@/lib/cloudwatch/client';
import { StandardUnit } from '@aws-sdk/client-cloudwatch';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  const cw = getCloudWatchManager();

  try {
    switch (action) {
      case 'alarms': {
        const alarms = await cw.getAlarms();
        return NextResponse.json({ alarms });
      }

      case 'dashboards': {
        const dashboards = await cw.listDashboards();
        return NextResponse.json({ dashboards });
      }

      case 'logs': {
        const query = searchParams.get('query') || 'fields @timestamp, @message | limit 100';
        const logGroup = searchParams.get('logGroup') || process.env.CLOUDWATCH_LOG_GROUP;
        const hoursBack = parseInt(searchParams.get('hours') || '24');

        const results = await cw.queryLogs({
          logGroupNames: [logGroup!],
          queryString: query,
          startTime: new Date(Date.now() - hoursBack * 60 * 60 * 1000),
          endTime: new Date(),
        });

        return NextResponse.json({ results });
      }

      case 'metrics': {
        const metricName = searchParams.get('metric');
        const hoursBack = parseInt(searchParams.get('hours') || '24');

        if (!metricName) {
          return NextResponse.json({ error: 'Metric name required' }, { status: 400 });
        }

        const datapoints = await cw.getMetricStatistics(
          metricName,
          new Date(Date.now() - hoursBack * 60 * 60 * 1000),
          new Date(),
          300, // 5 minute periods
          ['Average', 'Sum', 'Maximum', 'Minimum']
        );

        return NextResponse.json({ datapoints });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CloudWatch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CloudWatch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  const cw = getCloudWatchManager();

  try {
    switch (action) {
      case 'createAlarm': {
        const { alarm } = body;
        await cw.createAlarm(alarm);
        return NextResponse.json({ success: true });
      }

      case 'createDashboard': {
        const { dashboard } = body;
        await cw.createDashboard(dashboard);
        return NextResponse.json({ success: true });
      }

      case 'createEventRule': {
        const { rule } = body;
        await cw.createEventRule(rule);
        return NextResponse.json({ success: true });
      }

      case 'setAlarmState': {
        const { alarmName, state, reason } = body;
        await cw.setAlarmState(alarmName, state, reason);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CloudWatch API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute CloudWatch action' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  const cw = getCloudWatchManager();

  try {
    switch (action) {
      case 'deleteAlarms': {
        const { alarmNames } = body;
        await cw.deleteAlarms(alarmNames);
        return NextResponse.json({ success: true });
      }

      case 'deleteDashboards': {
        const { dashboardNames } = body;
        await cw.deleteDashboards(dashboardNames);
        return NextResponse.json({ success: true });
      }

      case 'deleteEventRule': {
        const { ruleName, targetIds } = body;
        await cw.deleteEventRule(ruleName, targetIds);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CloudWatch API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete CloudWatch resources' },
      { status: 500 }
    );
  }
}
```

## React Dashboard Component

```tsx
// src/components/CloudWatchDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Alarm {
  AlarmName: string;
  StateValue: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  MetricName: string;
  Threshold: number;
  StateUpdatedTimestamp: string;
}

interface LogEntry {
  '@timestamp': string;
  '@message': string;
  level?: string;
}

interface MetricDatapoint {
  Timestamp: string;
  Average?: number;
  Sum?: number;
  Maximum?: number;
  Minimum?: number;
}

export function CloudWatchDashboard() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('');
  const [metricData, setMetricData] = useState<MetricDatapoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [logQuery, setLogQuery] = useState('fields @timestamp, @message, level | limit 50');
  const [timeRange, setTimeRange] = useState(24);

  const fetchAlarms = useCallback(async () => {
    const response = await fetch('/api/cloudwatch?action=alarms');
    const data = await response.json();
    setAlarms(data.alarms || []);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/cloudwatch?action=logs&query=${encodeURIComponent(logQuery)}&hours=${timeRange}`
      );
      const data = await response.json();
      setLogs(data.results || []);
    } finally {
      setLoading(false);
    }
  }, [logQuery, timeRange]);

  const fetchMetricData = useCallback(async (metric: string) => {
    if (!metric) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/cloudwatch?action=metrics&metric=${encodeURIComponent(metric)}&hours=${timeRange}`
      );
      const data = await response.json();
      setMetricData(data.datapoints || []);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAlarms();
    const interval = setInterval(fetchAlarms, 60000);
    return () => clearInterval(interval);
  }, [fetchAlarms]);

  useEffect(() => {
    if (selectedMetric) {
      fetchMetricData(selectedMetric);
    }
  }, [selectedMetric, fetchMetricData]);

  const getAlarmStateColor = (state: string) => {
    switch (state) {
      case 'OK': return 'bg-green-500';
      case 'ALARM': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getLogLevelColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
      case 'FATAL': return 'text-red-600';
      case 'WARN': return 'text-yellow-600';
      case 'DEBUG': return 'text-gray-500';
      default: return 'text-gray-900';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">CloudWatch Dashboard</h1>

      {/* Time Range Selector */}
      <div className="flex items-center gap-4">
        <label className="font-medium">Time Range:</label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="border rounded px-3 py-2"
        >
          <option value={1}>Last 1 hour</option>
          <option value={6}>Last 6 hours</option>
          <option value={24}>Last 24 hours</option>
          <option value={72}>Last 3 days</option>
          <option value={168}>Last 7 days</option>
        </select>
      </div>

      {/* Alarms Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Alarms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alarms.map((alarm) => (
            <div
              key={alarm.AlarmName}
              className="border rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium truncate">{alarm.AlarmName}</span>
                <span
                  className={`px-2 py-1 rounded text-white text-sm ${getAlarmStateColor(alarm.StateValue)}`}
                >
                  {alarm.StateValue}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Metric: {alarm.MetricName}</p>
                <p>Threshold: {alarm.Threshold}</p>
                <p>Updated: {new Date(alarm.StateUpdatedTimestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {alarms.length === 0 && (
            <p className="text-gray-500 col-span-full">No alarms configured</p>
          )}
        </div>
      </section>

      {/* Metrics Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Metrics</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            placeholder="Enter metric name..."
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={() => fetchMetricData(selectedMetric)}
            disabled={loading || !selectedMetric}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch'}
          </button>
        </div>

        {metricData.length > 0 && (
          <div className="border rounded-lg p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Timestamp</th>
                  <th className="text-right py-2">Average</th>
                  <th className="text-right py-2">Sum</th>
                  <th className="text-right py-2">Max</th>
                  <th className="text-right py-2">Min</th>
                </tr>
              </thead>
              <tbody>
                {metricData
                  .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime())
                  .slice(0, 20)
                  .map((dp, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{new Date(dp.Timestamp).toLocaleString()}</td>
                      <td className="text-right">{dp.Average?.toFixed(2)}</td>
                      <td className="text-right">{dp.Sum?.toFixed(2)}</td>
                      <td className="text-right">{dp.Maximum?.toFixed(2)}</td>
                      <td className="text-right">{dp.Minimum?.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Logs Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Logs (CloudWatch Insights)</h2>
        <div className="flex gap-4 mb-4">
          <textarea
            value={logQuery}
            onChange={(e) => setLogQuery(e.target.value)}
            placeholder="CloudWatch Insights query..."
            className="flex-1 border rounded px-3 py-2 h-20 font-mono text-sm"
          />
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 self-start"
          >
            {loading ? 'Loading...' : 'Query'}
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 border-b">Timestamp</th>
                  <th className="text-left px-4 py-2 border-b">Level</th>
                  <th className="text-left px-4 py-2 border-b">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {log['@timestamp']}
                    </td>
                    <td className={`px-4 py-2 text-sm ${getLogLevelColor(log.level)}`}>
                      {log.level || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm font-mono break-all">
                      {log['@message']}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No logs found. Run a query to see results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
```

## Lambda Handler with CloudWatch Integration

```typescript
// src/lambda/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createMetricsLogger, Unit } from 'aws-embedded-metrics';

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const metricsLogger = createMetricsLogger();
  const startTime = Date.now();

  // Set default dimensions
  metricsLogger.setNamespace('MyLambdaFunction');
  metricsLogger.setDimensions({
    FunctionName: context.functionName,
    Path: event.path,
    Method: event.httpMethod,
  });

  try {
    // Your business logic here
    const result = await processRequest(event);

    // Record success metrics
    metricsLogger.putMetric('RequestCount', 1, Unit.Count);
    metricsLogger.putMetric('SuccessCount', 1, Unit.Count);
    metricsLogger.putMetric('Latency', Date.now() - startTime, Unit.Milliseconds);
    metricsLogger.setProperty('RequestId', context.awsRequestId);

    await metricsLogger.flush();

    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': context.awsRequestId,
      },
    };
  } catch (error) {
    // Record error metrics
    metricsLogger.putMetric('RequestCount', 1, Unit.Count);
    metricsLogger.putMetric('ErrorCount', 1, Unit.Count);
    metricsLogger.putMetric('Latency', Date.now() - startTime, Unit.Milliseconds);
    metricsLogger.setProperty('RequestId', context.awsRequestId);
    metricsLogger.setProperty('Error', error instanceof Error ? error.message : 'Unknown error');

    await metricsLogger.flush();

    console.error('Lambda error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': context.awsRequestId,
      },
    };
  }
}

async function processRequest(event: APIGatewayProxyEvent): Promise<any> {
  // Your business logic
  return { message: 'Success' };
}
```

## CloudFormation/CDK Dashboard Definition

```yaml
# cloudwatch-dashboard.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CloudWatch Dashboard and Alarms

Parameters:
  Environment:
    Type: String
    Default: production
  SNSTopicArn:
    Type: String
    Description: SNS Topic ARN for alarm notifications

Resources:
  ApplicationDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${Environment}-application-dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["MyApplication", "RequestCount", "Environment", "${Environment}"],
                  [".", "ErrorCount", ".", "."]
                ],
                "title": "Request Overview",
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["MyApplication", "Latency", "Environment", "${Environment}"]
                ],
                "title": "Request Latency",
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 8,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Invocations", "FunctionName", "my-function"],
                  [".", "Errors", ".", "."],
                  [".", "Throttles", ".", "."]
                ],
                "title": "Lambda Metrics",
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}"
              }
            },
            {
              "type": "log",
              "x": 8,
              "y": 6,
              "width": 16,
              "height": 6,
              "properties": {
                "query": "SOURCE '/app/production' | fields @timestamp, @message | filter level = 'ERROR' | sort @timestamp desc | limit 20",
                "title": "Recent Errors",
                "region": "${AWS::Region}"
              }
            }
          ]
        }

  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-high-error-rate'
      AlarmDescription: High error rate detected
      MetricName: ErrorCount
      Namespace: MyApplication
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: Environment
          Value: !Ref Environment
      AlarmActions:
        - !Ref SNSTopicArn
      OKActions:
        - !Ref SNSTopicArn
      TreatMissingData: notBreaching

  HighLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-high-latency'
      AlarmDescription: High latency detected
      MetricName: Latency
      Namespace: MyApplication
      Statistic: Average
      Period: 300
      EvaluationPeriods: 3
      Threshold: 2000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: Environment
          Value: !Ref Environment
      AlarmActions:
        - !Ref SNSTopicArn
      TreatMissingData: notBreaching

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-lambda-errors'
      AlarmDescription: Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: my-function
      AlarmActions:
        - !Ref SNSTopicArn
      TreatMissingData: notBreaching

Outputs:
  DashboardUrl:
    Value: !Sub 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${Environment}-application-dashboard'
    Description: CloudWatch Dashboard URL
```

## CLAUDE.md Integration

```markdown
# CloudWatch Integration

## Quick Commands

```bash
# View recent logs
aws logs filter-log-events --log-group-name /app/production --start-time $(date -d '1 hour ago' +%s000)

# Query logs with Insights
aws logs start-query \
  --log-group-name /app/production \
  --start-time $(date -d '24 hours ago' +%s) \
  --end-time $(date +%s) \
  --query-string "fields @timestamp, @message | filter level = 'ERROR' | limit 100"

# List alarms in ALARM state
aws cloudwatch describe-alarms --state-value ALARM

# Get recent metric data
aws cloudwatch get-metric-statistics \
  --namespace MyApplication \
  --metric-name RequestCount \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Sum

# Put custom metric
aws cloudwatch put-metric-data \
  --namespace MyApplication \
  --metric-name TestMetric \
  --value 1 \
  --unit Count
```

## Common Log Queries

```
# Error rate by endpoint
filter level = 'ERROR'
| stats count(*) as errors by context.endpoint
| sort errors desc

# Slow requests (>1s)
filter context.duration > 1000
| fields @timestamp, context.endpoint, context.duration
| sort context.duration desc

# Request distribution by status
stats count(*) as requests by context.statusCode
| sort requests desc

# Unique users per hour
fields @timestamp, context.userId
| stats count_distinct(context.userId) as uniqueUsers by bin(1h)
```

## Key Files
- `src/lib/cloudwatch/client.ts` - CloudWatch manager singleton
- `src/lib/cloudwatch/logs.ts` - Structured logger
- `src/lib/cloudwatch/metrics.ts` - Metrics helper
- `src/lib/cloudwatch/emf.ts` - Embedded Metrics Format

## Environment Setup
Required: AWS_REGION, CLOUDWATCH_LOG_GROUP, CLOUDWATCH_NAMESPACE
Optional: CLOUDWATCH_ENABLED, METRICS_FLUSH_INTERVAL
```

## AI Suggestions

1. **Implement Anomaly Detection**: Use CloudWatch Anomaly Detection for dynamic thresholds that learn from historical patterns rather than static thresholds.

2. **Add Contributor Insights Rules**: Create Contributor Insights rules to identify top contributors to high-cardinality metrics like top IP addresses or user agents.

3. **Implement Cross-Account Dashboards**: Use CloudWatch cross-account observability to aggregate metrics and logs from multiple AWS accounts into a single dashboard.

4. **Add Metric Math Expressions**: Create composite metrics using metric math for complex calculations like error rates, percentile distributions, and growth rates.

5. **Implement Log Subscription Filters**: Set up subscription filters to stream logs to Lambda, Kinesis, or Elasticsearch for real-time processing and analysis.

6. **Add ServiceLens Integration**: Integrate with AWS X-Ray and ServiceLens for end-to-end distributed tracing with automatic service maps.

7. **Implement Container Insights**: Enable Container Insights for ECS/EKS to get automatic container-level metrics and log collection.

8. **Add Synthetics Canaries**: Create CloudWatch Synthetics canaries for proactive endpoint monitoring and visual regression testing.

9. **Implement Log Retention Policies**: Set up automatic log retention and archival to S3 with lifecycle policies for cost optimization.

10. **Add Metric Streams**: Use CloudWatch Metric Streams to continuously export metrics to third-party observability platforms or data lakes.
