# Custom Analytics Platform

Production-ready custom analytics implementation for building your own analytics system.

## Overview

Build a fully custom analytics platform with event collection, data processing, storage, and visualization. This template provides a complete foundation for tracking user behavior without third-party dependencies.

## Quick Start

```bash
npm install uuid @clickhouse/client redis bull
```

## TypeScript Implementation

### Event Collection Service

```typescript
// src/services/analytics/collector.ts
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { Queue } from 'bull';

interface AnalyticsEvent {
  id: string;
  type: 'pageview' | 'event' | 'identify' | 'screen';
  timestamp: Date;
  userId?: string;
  anonymousId: string;
  sessionId: string;
  properties: Record<string, any>;
  context: EventContext;
}

interface EventContext {
  page?: {
    path: string;
    referrer?: string;
    title?: string;
    url: string;
    search?: string;
  };
  device?: {
    type: 'mobile' | 'tablet' | 'desktop';
    manufacturer?: string;
    model?: string;
  };
  browser?: {
    name: string;
    version: string;
  };
  os?: {
    name: string;
    version: string;
  };
  screen?: {
    width: number;
    height: number;
    density: number;
  };
  locale?: string;
  timezone?: string;
  ip?: string;
  userAgent?: string;
  campaign?: {
    name?: string;
    source?: string;
    medium?: string;
    term?: string;
    content?: string;
  };
}

interface PageviewEvent {
  path: string;
  title?: string;
  referrer?: string;
}

interface TrackEvent {
  name: string;
  properties?: Record<string, any>;
}

interface IdentifyTraits {
  email?: string;
  name?: string;
  [key: string]: any;
}

class AnalyticsCollector {
  private redis: Redis;
  private eventQueue: Queue<AnalyticsEvent>;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  constructor(redisUrl: string, queueName = 'analytics-events') {
    this.redis = new Redis(redisUrl);
    this.eventQueue = new Queue<AnalyticsEvent>(queueName, redisUrl);
  }

  // Generate or retrieve anonymous ID
  async getAnonymousId(providedId?: string): Promise<string> {
    if (providedId) return providedId;
    return uuidv4();
  }

  // Get or create session ID
  async getSessionId(anonymousId: string): Promise<string> {
    const sessionKey = `session:${anonymousId}`;
    let sessionId = await this.redis.get(sessionKey);

    if (!sessionId) {
      sessionId = uuidv4();
    }

    // Extend session
    await this.redis.setex(sessionKey, this.sessionTimeout / 1000, sessionId);

    return sessionId;
  }

  // Create base event
  private async createEvent(
    type: AnalyticsEvent['type'],
    anonymousId: string,
    userId?: string,
    properties: Record<string, any> = {},
    context: Partial<EventContext> = {}
  ): Promise<AnalyticsEvent> {
    const sessionId = await this.getSessionId(anonymousId);

    return {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      userId,
      anonymousId,
      sessionId,
      properties,
      context: context as EventContext,
    };
  }

  // Track page view
  async pageview(
    anonymousId: string,
    page: PageviewEvent,
    context?: Partial<EventContext>,
    userId?: string
  ): Promise<string> {
    const event = await this.createEvent(
      'pageview',
      anonymousId,
      userId,
      {
        path: page.path,
        title: page.title,
        referrer: page.referrer,
      },
      {
        ...context,
        page: {
          path: page.path,
          referrer: page.referrer,
          title: page.title,
          url: context?.page?.url || page.path,
        },
      }
    );

    await this.enqueue(event);
    return event.id;
  }

  // Track custom event
  async track(
    anonymousId: string,
    event: TrackEvent,
    context?: Partial<EventContext>,
    userId?: string
  ): Promise<string> {
    const analyticsEvent = await this.createEvent(
      'event',
      anonymousId,
      userId,
      {
        name: event.name,
        ...event.properties,
      },
      context
    );

    await this.enqueue(analyticsEvent);
    return analyticsEvent.id;
  }

  // Identify user
  async identify(
    anonymousId: string,
    userId: string,
    traits: IdentifyTraits,
    context?: Partial<EventContext>
  ): Promise<string> {
    // Link anonymous ID to user ID
    await this.redis.set(`identity:${anonymousId}`, userId);
    await this.redis.sadd(`user:${userId}:anonymous`, anonymousId);

    // Store user traits
    await this.redis.hset(
      `user:${userId}:traits`,
      Object.entries(traits).flat()
    );

    const event = await this.createEvent(
      'identify',
      anonymousId,
      userId,
      traits,
      context
    );

    await this.enqueue(event);
    return event.id;
  }

  // Enqueue event for processing
  private async enqueue(event: AnalyticsEvent): Promise<void> {
    await this.eventQueue.add(event, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    // Real-time counter updates
    const date = event.timestamp.toISOString().split('T')[0];
    const hour = event.timestamp.getHours();

    if (event.type === 'pageview') {
      await this.redis.incr(`stats:pageviews:${date}`);
      await this.redis.incr(`stats:pageviews:${date}:${hour}`);
      await this.redis.pfadd(`stats:visitors:${date}`, event.anonymousId);
    } else if (event.type === 'event') {
      await this.redis.incr(`stats:events:${date}:${event.properties.name}`);
    }
  }

  // Get realtime stats
  async getRealtimeStats(): Promise<{
    activeUsers: number;
    pageviewsLast5Min: number;
  }> {
    const now = Date.now();
    const fiveMinAgo = now - 5 * 60 * 1000;

    // Count unique sessions in last 5 minutes
    const sessions = await this.redis.keys('session:*');
    let activeUsers = 0;

    for (const key of sessions) {
      const ttl = await this.redis.pttl(key);
      if (ttl > this.sessionTimeout - 5 * 60 * 1000) {
        activeUsers++;
      }
    }

    // This is a simplified approach - in production, use time-series data
    const date = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    const pageviewsLast5Min = parseInt(
      await this.redis.get(`stats:pageviews:${date}:${hour}`) || '0',
      10
    );

    return { activeUsers, pageviewsLast5Min };
  }

  // Get daily stats
  async getDailyStats(date: string): Promise<{
    pageviews: number;
    visitors: number;
    events: Record<string, number>;
  }> {
    const pageviews = parseInt(
      await this.redis.get(`stats:pageviews:${date}`) || '0',
      10
    );

    const visitors = await this.redis.pfcount(`stats:visitors:${date}`);

    // Get event counts
    const eventKeys = await this.redis.keys(`stats:events:${date}:*`);
    const events: Record<string, number> = {};

    for (const key of eventKeys) {
      const eventName = key.split(':').pop()!;
      events[eventName] = parseInt(await this.redis.get(key) || '0', 10);
    }

    return { pageviews, visitors, events };
  }
}

export const analyticsCollector = new AnalyticsCollector(
  process.env.REDIS_URL || 'redis://localhost:6379'
);
```

### Event Processing Service

```typescript
// src/services/analytics/processor.ts
import { Queue, Worker, Job } from 'bull';
import { ClickHouseClient, createClient } from '@clickhouse/client';

interface AnalyticsEvent {
  id: string;
  type: string;
  timestamp: Date;
  userId?: string;
  anonymousId: string;
  sessionId: string;
  properties: Record<string, any>;
  context: Record<string, any>;
}

interface ProcessedEvent {
  event_id: string;
  event_type: string;
  event_name: string;
  timestamp: string;
  user_id: string;
  anonymous_id: string;
  session_id: string;
  page_path: string;
  page_title: string;
  page_referrer: string;
  device_type: string;
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
  country: string;
  city: string;
  screen_width: number;
  screen_height: number;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  properties: string; // JSON string
}

class AnalyticsProcessor {
  private clickhouse: ClickHouseClient;
  private worker: Worker<AnalyticsEvent> | null = null;

  constructor(clickhouseUrl: string) {
    this.clickhouse = createClient({
      host: clickhouseUrl,
    });
  }

  // Initialize database schema
  async initializeSchema(): Promise<void> {
    // Create events table
    await this.clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS analytics_events (
          event_id String,
          event_type LowCardinality(String),
          event_name LowCardinality(String),
          timestamp DateTime64(3),
          date Date MATERIALIZED toDate(timestamp),
          hour UInt8 MATERIALIZED toHour(timestamp),
          user_id String,
          anonymous_id String,
          session_id String,
          page_path String,
          page_title String,
          page_referrer String,
          device_type LowCardinality(String),
          browser_name LowCardinality(String),
          browser_version String,
          os_name LowCardinality(String),
          os_version String,
          country LowCardinality(String),
          city String,
          screen_width UInt16,
          screen_height UInt16,
          utm_source LowCardinality(String),
          utm_medium LowCardinality(String),
          utm_campaign LowCardinality(String),
          properties String
        )
        ENGINE = MergeTree()
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (timestamp, event_type, anonymous_id)
        TTL timestamp + INTERVAL 1 YEAR
      `,
    });

    // Create sessions table
    await this.clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS analytics_sessions (
          session_id String,
          anonymous_id String,
          user_id String,
          started_at DateTime64(3),
          ended_at DateTime64(3),
          duration_seconds UInt32,
          page_count UInt16,
          event_count UInt16,
          entry_page String,
          exit_page String,
          device_type LowCardinality(String),
          browser_name LowCardinality(String),
          country LowCardinality(String),
          utm_source LowCardinality(String),
          utm_campaign LowCardinality(String),
          is_bounce UInt8
        )
        ENGINE = ReplacingMergeTree(ended_at)
        PARTITION BY toYYYYMM(started_at)
        ORDER BY (started_at, session_id)
      `,
    });

    // Create daily aggregates materialized view
    await this.clickhouse.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_stats
        ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(date)
        ORDER BY (date, event_type)
        AS SELECT
          toDate(timestamp) AS date,
          event_type,
          count() AS event_count,
          uniqExact(anonymous_id) AS unique_visitors,
          uniqExact(session_id) AS sessions
        FROM analytics_events
        GROUP BY date, event_type
      `,
    });
  }

  // Process single event
  private transformEvent(event: AnalyticsEvent): ProcessedEvent {
    const context = event.context || {};
    const campaign = context.campaign || {};

    return {
      event_id: event.id,
      event_type: event.type,
      event_name: event.properties?.name || '',
      timestamp: event.timestamp.toISOString(),
      user_id: event.userId || '',
      anonymous_id: event.anonymousId,
      session_id: event.sessionId,
      page_path: context.page?.path || '',
      page_title: context.page?.title || '',
      page_referrer: context.page?.referrer || '',
      device_type: context.device?.type || '',
      browser_name: context.browser?.name || '',
      browser_version: context.browser?.version || '',
      os_name: context.os?.name || '',
      os_version: context.os?.version || '',
      country: '', // Would come from IP geolocation
      city: '',
      screen_width: context.screen?.width || 0,
      screen_height: context.screen?.height || 0,
      utm_source: campaign.source || '',
      utm_medium: campaign.medium || '',
      utm_campaign: campaign.name || '',
      properties: JSON.stringify(event.properties),
    };
  }

  // Insert event into ClickHouse
  private async insertEvent(event: ProcessedEvent): Promise<void> {
    await this.clickhouse.insert({
      table: 'analytics_events',
      values: [event],
      format: 'JSONEachRow',
    });
  }

  // Start processing worker
  startWorker(redisUrl: string, queueName = 'analytics-events'): void {
    this.worker = new Worker<AnalyticsEvent>(
      queueName,
      async (job: Job<AnalyticsEvent>) => {
        const processed = this.transformEvent(job.data);
        await this.insertEvent(processed);
      },
      {
        connection: { url: redisUrl },
        concurrency: 10,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`Processed event ${job.data.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Failed to process event ${job?.data.id}:`, err);
    });
  }

  // Stop worker
  async stopWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}

export const analyticsProcessor = new AnalyticsProcessor(
  process.env.CLICKHOUSE_URL || 'http://localhost:8123'
);
```

### Query Service

```typescript
// src/services/analytics/query.ts
import { createClient, ClickHouseClient } from '@clickhouse/client';

interface TimeRange {
  start: Date;
  end: Date;
}

interface MetricResult {
  value: number;
  change?: number;
}

interface TimeseriesPoint {
  date: string;
  value: number;
}

interface BreakdownItem {
  dimension: string;
  value: number;
  percentage: number;
}

class AnalyticsQueryService {
  private clickhouse: ClickHouseClient;

  constructor(clickhouseUrl: string) {
    this.clickhouse = createClient({ host: clickhouseUrl });
  }

  // Get aggregate metrics
  async getMetrics(
    timeRange: TimeRange,
    metrics: string[]
  ): Promise<Record<string, MetricResult>> {
    const results: Record<string, MetricResult> = {};

    // Calculate previous period for comparison
    const duration = timeRange.end.getTime() - timeRange.start.getTime();
    const prevStart = new Date(timeRange.start.getTime() - duration);
    const prevEnd = new Date(timeRange.end.getTime() - duration);

    for (const metric of metrics) {
      switch (metric) {
        case 'pageviews':
          results.pageviews = await this.getPageviews(timeRange, { start: prevStart, end: prevEnd });
          break;
        case 'visitors':
          results.visitors = await this.getUniqueVisitors(timeRange, { start: prevStart, end: prevEnd });
          break;
        case 'sessions':
          results.sessions = await this.getSessions(timeRange, { start: prevStart, end: prevEnd });
          break;
        case 'bounce_rate':
          results.bounce_rate = await this.getBounceRate(timeRange, { start: prevStart, end: prevEnd });
          break;
        case 'avg_duration':
          results.avg_duration = await this.getAvgSessionDuration(timeRange, { start: prevStart, end: prevEnd });
          break;
      }
    }

    return results;
  }

  // Get pageviews
  private async getPageviews(
    current: TimeRange,
    previous: TimeRange
  ): Promise<MetricResult> {
    const [currentResult] = await this.clickhouse.query({
      query: `
        SELECT count() as value
        FROM analytics_events
        WHERE event_type = 'pageview'
          AND timestamp >= {start:DateTime64}
          AND timestamp < {end:DateTime64}
      `,
      query_params: {
        start: current.start.toISOString(),
        end: current.end.toISOString(),
      },
      format: 'JSONEachRow',
    }).then(r => r.json<{ value: number }[]>());

    const [prevResult] = await this.clickhouse.query({
      query: `
        SELECT count() as value
        FROM analytics_events
        WHERE event_type = 'pageview'
          AND timestamp >= {start:DateTime64}
          AND timestamp < {end:DateTime64}
      `,
      query_params: {
        start: previous.start.toISOString(),
        end: previous.end.toISOString(),
      },
      format: 'JSONEachRow',
    }).then(r => r.json<{ value: number }[]>());

    const change = prevResult.value > 0
      ? ((currentResult.value - prevResult.value) / prevResult.value) * 100
      : 0;

    return { value: currentResult.value, change };
  }

  // Get unique visitors
  private async getUniqueVisitors(
    current: TimeRange,
    previous: TimeRange
  ): Promise<MetricResult> {
    const [currentResult] = await this.clickhouse.query({
      query: `
        SELECT uniqExact(anonymous_id) as value
        FROM analytics_events
        WHERE timestamp >= {start:DateTime64}
          AND timestamp < {end:DateTime64}
      `,
      query_params: {
        start: current.start.toISOString(),
        end: current.end.toISOString(),
      },
      format: 'JSONEachRow',
    }).then(r => r.json<{ value: number }[]>());

    const [prevResult] = await this.clickhouse.query({
      query: `
        SELECT uniqExact(anonymous_id) as value
        FROM analytics_events
        WHERE timestamp >= {start:DateTime64}
          AND timestamp < {end:DateTime64}
      `,
      query_params: {
        start: previous.start.toISOString(),
        end: previous.end.toISOString(),
      },
      format: 'JSONEachRow',
    }).then(r => r.json<{ value: number }[]>());

    const change = prevResult.value > 0
      ? ((currentResult.value - prevResult.value) / prevResult.value) * 100
      : 0;

    return { value: currentResult.value, change };
  }

  // Get timeseries data
  async getTimeseries(
    timeRange: TimeRange,
    metric: string,
    interval: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeseriesPoint[]> {
    const dateFormat = interval === 'hour'
      ? 'toStartOfHour(timestamp)'
      : interval === 'day'
        ? 'toDate(timestamp)'
        : interval === 'week'
          ? 'toStartOfWeek(timestamp)'
          : 'toStartOfMonth(timestamp)';

    let valueExpr = 'count()';
    if (metric === 'visitors') {
      valueExpr = 'uniqExact(anonymous_id)';
    } else if (metric === 'sessions') {
      valueExpr = 'uniqExact(session_id)';
    }

    const results = await this.clickhouse.query({
      query: `
        SELECT
          ${dateFormat} as date,
          ${valueExpr} as value
        FROM analytics_events
        WHERE timestamp >= {start:DateTime64}
          AND timestamp < {end:DateTime64}
        GROUP BY date
        ORDER BY date
      `,
      query_params: {
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
      },
      format: 'JSONEachRow',
    }).then(r => r.json<TimeseriesPoint[]>());

    return results;
  }

  // Get breakdown by dimension
  async getBreakdown(
    timeRange: TimeRange,
    dimension: string,
    metric: string = 'pageviews',
    limit: number = 10
  ): Promise<BreakdownItem[]> {
    const dimensionColumn = this.getDimensionColumn(dimension);

    let valueExpr = 'count()';
    if (metric === 'visitors') {
      valueExpr = 'uniqExact(anonymous_id)';
    } else if (metric === 'sessions') {
      valueExpr = 'uniqExact(session_id)';
    }

    const results = await this.clickhouse.query({
      query: `
        SELECT
          ${dimensionColumn} as dimension,
          ${valueExpr} as value
        FROM analytics_events
        WHERE timestamp >= {start:DateTime64}
          AND timestamp < {end:DateTime64}
          AND ${dimensionColumn} != ''
        GROUP BY dimension
        ORDER BY value DESC
        LIMIT {limit:UInt32}
      `,
      query_params: {
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
        limit,
      },
      format: 'JSONEachRow',
    }).then(r => r.json<{ dimension: string; value: number }[]>());

    // Calculate percentages
    const total = results.reduce((sum, item) => sum + item.value, 0);

    return results.map(item => ({
      dimension: item.dimension,
      value: item.value,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }));
  }

  private getDimensionColumn(dimension: string): string {
    const mapping: Record<string, string> = {
      page: 'page_path',
      referrer: 'page_referrer',
      device: 'device_type',
      browser: 'browser_name',
      os: 'os_name',
      country: 'country',
      utm_source: 'utm_source',
      utm_medium: 'utm_medium',
      utm_campaign: 'utm_campaign',
    };
    return mapping[dimension] || dimension;
  }

  // Placeholder methods for metrics
  private async getSessions(current: TimeRange, previous: TimeRange): Promise<MetricResult> {
    return { value: 0 };
  }

  private async getBounceRate(current: TimeRange, previous: TimeRange): Promise<MetricResult> {
    return { value: 0 };
  }

  private async getAvgSessionDuration(current: TimeRange, previous: TimeRange): Promise<MetricResult> {
    return { value: 0 };
  }
}

export const analyticsQuery = new AnalyticsQueryService(
  process.env.CLICKHOUSE_URL || 'http://localhost:8123'
);
```

## Express.js API Routes

```typescript
// src/routes/analytics.ts
import { Router, Request, Response } from 'express';
import { analyticsCollector } from '../services/analytics/collector';
import { analyticsQuery } from '../services/analytics/query';

const router = Router();

// Collect pageview
router.post('/pageview', async (req: Request, res: Response) => {
  try {
    const { anonymousId, userId, page, context } = req.body;

    if (!anonymousId || !page?.path) {
      return res.status(400).json({ error: 'anonymousId and page.path required' });
    }

    const eventContext = {
      ...context,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    const eventId = await analyticsCollector.pageview(
      anonymousId,
      page,
      eventContext,
      userId
    );

    res.json({ eventId });
  } catch (error) {
    console.error('Pageview error:', error);
    res.status(500).json({ error: 'Failed to track pageview' });
  }
});

// Collect event
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { anonymousId, userId, event, context } = req.body;

    if (!anonymousId || !event?.name) {
      return res.status(400).json({ error: 'anonymousId and event.name required' });
    }

    const eventContext = {
      ...context,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    const eventId = await analyticsCollector.track(
      anonymousId,
      event,
      eventContext,
      userId
    );

    res.json({ eventId });
  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Identify user
router.post('/identify', async (req: Request, res: Response) => {
  try {
    const { anonymousId, userId, traits, context } = req.body;

    if (!anonymousId || !userId) {
      return res.status(400).json({ error: 'anonymousId and userId required' });
    }

    const eventId = await analyticsCollector.identify(
      anonymousId,
      userId,
      traits || {},
      context
    );

    res.json({ eventId });
  } catch (error) {
    console.error('Identify error:', error);
    res.status(500).json({ error: 'Failed to identify user' });
  }
});

// Get realtime stats
router.get('/realtime', async (req: Request, res: Response) => {
  try {
    const stats = await analyticsCollector.getRealtimeStats();
    res.json(stats);
  } catch (error) {
    console.error('Realtime error:', error);
    res.status(500).json({ error: 'Failed to get realtime stats' });
  }
});

// Get metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { start, end, metrics } = req.query;

    const timeRange = {
      start: new Date(start as string || Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(end as string || Date.now()),
    };

    const requestedMetrics = metrics
      ? (metrics as string).split(',')
      : ['pageviews', 'visitors', 'sessions'];

    const results = await analyticsQuery.getMetrics(timeRange, requestedMetrics);

    res.json({ timeRange, metrics: results });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Get timeseries
router.get('/timeseries', async (req: Request, res: Response) => {
  try {
    const { start, end, metric, interval } = req.query;

    const timeRange = {
      start: new Date(start as string || Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(end as string || Date.now()),
    };

    const data = await analyticsQuery.getTimeseries(
      timeRange,
      metric as string || 'pageviews',
      interval as 'hour' | 'day' | 'week' | 'month' || 'day'
    );

    res.json({ timeRange, data });
  } catch (error) {
    console.error('Timeseries error:', error);
    res.status(500).json({ error: 'Failed to get timeseries' });
  }
});

// Get breakdown
router.get('/breakdown', async (req: Request, res: Response) => {
  try {
    const { start, end, dimension, metric, limit } = req.query;

    if (!dimension) {
      return res.status(400).json({ error: 'dimension is required' });
    }

    const timeRange = {
      start: new Date(start as string || Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(end as string || Date.now()),
    };

    const data = await analyticsQuery.getBreakdown(
      timeRange,
      dimension as string,
      metric as string || 'pageviews',
      limit ? parseInt(limit as string, 10) : 10
    );

    res.json({ timeRange, dimension, data });
  } catch (error) {
    console.error('Breakdown error:', error);
    res.status(500).json({ error: 'Failed to get breakdown' });
  }
});

export default router;
```

## React Integration

```typescript
// src/hooks/useAnalytics.tsx
import React, { createContext, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface AnalyticsContextValue {
  track: (eventName: string, properties?: Record<string, any>) => void;
  pageview: (path: string, title?: string) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  apiEndpoint: string;
}

export function AnalyticsProvider({ children, apiEndpoint }: AnalyticsProviderProps) {
  const anonymousId = useRef<string>('');
  const userId = useRef<string | undefined>();

  useEffect(() => {
    // Get or create anonymous ID
    let storedId = localStorage.getItem('analytics_anonymous_id');
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('analytics_anonymous_id', storedId);
    }
    anonymousId.current = storedId;

    // Check for stored user ID
    const storedUserId = localStorage.getItem('analytics_user_id');
    if (storedUserId) {
      userId.current = storedUserId;
    }
  }, []);

  const getContext = useCallback(() => ({
    page: {
      path: window.location.pathname,
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
      search: window.location.search,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      density: window.devicePixelRatio,
    },
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
  }), []);

  const track = useCallback(async (eventName: string, properties?: Record<string, any>) => {
    try {
      await fetch(`${apiEndpoint}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymousId: anonymousId.current,
          userId: userId.current,
          event: { name: eventName, properties },
          context: getContext(),
        }),
      });
    } catch (error) {
      console.error('Analytics track error:', error);
    }
  }, [apiEndpoint, getContext]);

  const pageview = useCallback(async (path: string, title?: string) => {
    try {
      await fetch(`${apiEndpoint}/pageview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymousId: anonymousId.current,
          userId: userId.current,
          page: { path, title: title || document.title, referrer: document.referrer },
          context: getContext(),
        }),
      });
    } catch (error) {
      console.error('Analytics pageview error:', error);
    }
  }, [apiEndpoint, getContext]);

  const identify = useCallback(async (newUserId: string, traits?: Record<string, any>) => {
    userId.current = newUserId;
    localStorage.setItem('analytics_user_id', newUserId);

    try {
      await fetch(`${apiEndpoint}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymousId: anonymousId.current,
          userId: newUserId,
          traits,
          context: getContext(),
        }),
      });
    } catch (error) {
      console.error('Analytics identify error:', error);
    }
  }, [apiEndpoint, getContext]);

  return (
    <AnalyticsContext.Provider value={{ track, pageview, identify }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

// Page tracking hook
export function usePageTracking() {
  const { pageview } = useAnalytics();

  useEffect(() => {
    pageview(window.location.pathname);
  }, [pageview]);
}
```

## CLAUDE.md Integration

```markdown
## Custom Analytics

### Commands
- `analytics:track <event> [properties]` - Track event
- `analytics:pageview <path>` - Track pageview
- `analytics:metrics [period]` - Get metrics
- `analytics:breakdown <dimension>` - Get breakdown

### Key Files
- `src/services/analytics/collector.ts` - Event collection
- `src/services/analytics/processor.ts` - Event processing
- `src/services/analytics/query.ts` - Analytics queries
- `src/hooks/useAnalytics.tsx` - React integration

### Architecture
- Redis for real-time counters and session management
- Bull queue for async event processing
- ClickHouse for analytics storage and queries
```

## AI Suggestions

1. **Data Warehouse**: Export data to Snowflake/BigQuery for advanced analysis
2. **Session Stitching**: Implement cross-device session linking
3. **Funnels**: Build funnel analysis for conversion tracking
4. **Cohort Analysis**: Create cohort tracking for retention
5. **Real-time Dashboard**: Build WebSocket-powered real-time dashboard
6. **Data Sampling**: Implement sampling for high-volume sites
7. **Privacy**: Add consent management and data retention policies
8. **Geolocation**: Integrate IP geolocation service
9. **Bot Detection**: Filter bot traffic from analytics
10. **Anomaly Detection**: Add alerting for traffic anomalies
