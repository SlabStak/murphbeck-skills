# Performance Profiling Template

## Overview
Comprehensive performance profiling setup with Node.js profiling, React profiling, memory analysis, and performance monitoring.

## Quick Start
```bash
# Node.js profiling
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Chrome DevTools profiling
node --inspect app.js
# Open chrome://inspect
```

## Node.js Profiling

### CPU Profiling with v8-profiler

```typescript
// src/lib/profiler.ts
import v8Profiler from 'v8-profiler-next';
import fs from 'fs';
import path from 'path';

v8Profiler.setGenerateType(1);

export class Profiler {
  private profileId: string;
  private outputDir: string;

  constructor(outputDir = './profiles') {
    this.profileId = `profile-${Date.now()}`;
    this.outputDir = outputDir;
    fs.mkdirSync(outputDir, { recursive: true });
  }

  startCPUProfile(title?: string): void {
    const profileTitle = title || this.profileId;
    v8Profiler.startProfiling(profileTitle, true);
    console.log(`CPU profiling started: ${profileTitle}`);
  }

  stopCPUProfile(title?: string): string {
    const profileTitle = title || this.profileId;
    const profile = v8Profiler.stopProfiling(profileTitle);

    const outputPath = path.join(
      this.outputDir,
      `${profileTitle}.cpuprofile`
    );

    return new Promise((resolve, reject) => {
      profile
        .export()
        .pipe(fs.createWriteStream(outputPath))
        .on('finish', () => {
          profile.delete();
          console.log(`CPU profile saved: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', reject);
    });
  }

  takeHeapSnapshot(): Promise<string> {
    const snapshotId = `heap-${Date.now()}`;
    const snapshot = v8Profiler.takeSnapshot(snapshotId);

    const outputPath = path.join(this.outputDir, `${snapshotId}.heapsnapshot`);

    return new Promise((resolve, reject) => {
      snapshot
        .export()
        .pipe(fs.createWriteStream(outputPath))
        .on('finish', () => {
          snapshot.delete();
          console.log(`Heap snapshot saved: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', reject);
    });
  }

  // Profile a specific function
  async profileFunction<T>(
    name: string,
    fn: () => T | Promise<T>
  ): Promise<{ result: T; profilePath: string }> {
    this.startCPUProfile(name);
    const result = await fn();
    const profilePath = await this.stopCPUProfile(name);
    return { result, profilePath };
  }

  // Get memory usage
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  // Log memory usage
  logMemoryUsage(label?: string): void {
    const usage = this.getMemoryUsage();
    const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

    console.log(`Memory Usage${label ? ` (${label})` : ''}:`);
    console.log(`  Heap Used: ${formatMB(usage.heapUsed)} MB`);
    console.log(`  Heap Total: ${formatMB(usage.heapTotal)} MB`);
    console.log(`  External: ${formatMB(usage.external)} MB`);
    console.log(`  RSS: ${formatMB(usage.rss)} MB`);
  }
}

// Singleton instance
export const profiler = new Profiler();

// Express middleware for request profiling
export function profileRequest() {
  return (req: Request, res: Response, next: NextFunction) => {
    const profileId = `${req.method}-${req.path}-${Date.now()}`;

    if (process.env.PROFILE_REQUESTS === 'true') {
      profiler.startCPUProfile(profileId);

      res.on('finish', () => {
        profiler.stopCPUProfile(profileId);
      });
    }

    next();
  };
}
```

### Memory Leak Detection

```typescript
// src/lib/memory-monitor.ts
import { EventEmitter } from 'events';

interface MemoryStats {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

interface MemoryLeak {
  type: 'heap' | 'rss' | 'external';
  increase: number;
  duration: number;
  averageGrowthRate: number;
}

export class MemoryMonitor extends EventEmitter {
  private history: MemoryStats[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private maxHistorySize: number;
  private checkIntervalMs: number;
  private leakThresholdMB: number;

  constructor(options: {
    maxHistorySize?: number;
    checkIntervalMs?: number;
    leakThresholdMB?: number;
  } = {}) {
    super();
    this.maxHistorySize = options.maxHistorySize || 100;
    this.checkIntervalMs = options.checkIntervalMs || 30000;
    this.leakThresholdMB = options.leakThresholdMB || 50;
  }

  start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.recordMemory();
      this.checkForLeaks();
    }, this.checkIntervalMs);

    console.log('Memory monitoring started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Memory monitoring stopped');
    }
  }

  private recordMemory(): void {
    const usage = process.memoryUsage();

    const stats: MemoryStats = {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    };

    this.history.push(stats);

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    this.emit('memory', stats);
  }

  private checkForLeaks(): void {
    if (this.history.length < 10) return;

    const recent = this.history.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const duration = (last.timestamp - first.timestamp) / 1000;

    const metrics: Array<{ type: MemoryLeak['type']; key: keyof MemoryStats }> = [
      { type: 'heap', key: 'heapUsed' },
      { type: 'rss', key: 'rss' },
      { type: 'external', key: 'external' }
    ];

    for (const { type, key } of metrics) {
      const increase = (last[key] - first[key]) / 1024 / 1024;
      const averageGrowthRate = increase / duration;

      if (increase > this.leakThresholdMB) {
        const leak: MemoryLeak = {
          type,
          increase,
          duration,
          averageGrowthRate
        };

        this.emit('leak', leak);
        console.warn(`Potential memory leak detected: ${type}`, leak);
      }
    }
  }

  getHistory(): MemoryStats[] {
    return [...this.history];
  }

  getCurrentUsage(): MemoryStats {
    const usage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    };
  }

  formatUsage(usage: MemoryStats): string {
    const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);
    return `Heap: ${formatMB(usage.heapUsed)}/${formatMB(usage.heapTotal)} MB | RSS: ${formatMB(usage.rss)} MB`;
  }
}

export const memoryMonitor = new MemoryMonitor();
```

## React Profiling

### React Profiler Component

```typescript
// src/components/Profiler.tsx
'use client';

import React, { Profiler as ReactProfiler, ProfilerOnRenderCallback } from 'react';

interface ProfilerProps {
  id: string;
  children: React.ReactNode;
  onRender?: ProfilerOnRenderCallback;
  logToConsole?: boolean;
  logThresholdMs?: number;
}

// Store render data for analysis
const renderData: Map<string, RenderInfo[]> = new Map();

interface RenderInfo {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

export function ProfilerWrapper({
  id,
  children,
  onRender,
  logToConsole = process.env.NODE_ENV === 'development',
  logThresholdMs = 16 // Log renders slower than one frame
}: ProfilerProps) {
  const handleRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    const info: RenderInfo = {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime
    };

    // Store data
    if (!renderData.has(id)) {
      renderData.set(id, []);
    }
    renderData.get(id)!.push(info);

    // Log slow renders
    if (logToConsole && actualDuration > logThresholdMs) {
      console.warn(
        `[Profiler] Slow render: ${id}`,
        `${phase} took ${actualDuration.toFixed(2)}ms`,
        `(baseline: ${baseDuration.toFixed(2)}ms)`
      );
    }

    // Call custom handler
    onRender?.(id, phase, actualDuration, baseDuration, startTime, commitTime);
  };

  return (
    <ReactProfiler id={id} onRender={handleRender}>
      {children}
    </ReactProfiler>
  );
}

// Get profiling statistics
export function getProfilingStats(id?: string): Record<string, unknown> {
  const stats: Record<string, unknown> = {};

  const processData = (componentId: string, data: RenderInfo[]) => {
    const durations = data.map(d => d.actualDuration);
    const mountRenders = data.filter(d => d.phase === 'mount');
    const updateRenders = data.filter(d => d.phase === 'update');

    return {
      totalRenders: data.length,
      mountRenders: mountRenders.length,
      updateRenders: updateRenders.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      totalTime: durations.reduce((a, b) => a + b, 0)
    };
  };

  if (id) {
    const data = renderData.get(id);
    if (data) {
      stats[id] = processData(id, data);
    }
  } else {
    renderData.forEach((data, componentId) => {
      stats[componentId] = processData(componentId, data);
    });
  }

  return stats;
}

// Clear profiling data
export function clearProfilingData(id?: string): void {
  if (id) {
    renderData.delete(id);
  } else {
    renderData.clear();
  }
}
```

### Performance Hook

```typescript
// src/hooks/usePerformance.ts
import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderDuration: number;
  averageRenderDuration: number;
  totalRenderTime: number;
  firstRenderTime: number;
}

export function usePerformance(componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderDuration: 0,
    averageRenderDuration: 0,
    totalRenderTime: 0,
    firstRenderTime: 0
  });

  const renderStartRef = useRef<number>(0);

  // Mark render start
  renderStartRef.current = performance.now();

  useEffect(() => {
    const renderEnd = performance.now();
    const duration = renderEnd - renderStartRef.current;

    const metrics = metricsRef.current;
    metrics.renderCount++;
    metrics.lastRenderDuration = duration;
    metrics.totalRenderTime += duration;
    metrics.averageRenderDuration = metrics.totalRenderTime / metrics.renderCount;

    if (metrics.renderCount === 1) {
      metrics.firstRenderTime = duration;
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[Performance] ${componentName}:`,
        `render #${metrics.renderCount}`,
        `took ${duration.toFixed(2)}ms`,
        `(avg: ${metrics.averageRenderDuration.toFixed(2)}ms)`
      );
    }
  });

  const getMetrics = useCallback(() => ({ ...metricsRef.current }), []);

  const measureCallback = useCallback(
    <T extends (...args: any[]) => any>(name: string, fn: T): T => {
      return ((...args) => {
        const start = performance.now();
        const result = fn(...args);

        if (result instanceof Promise) {
          return result.finally(() => {
            const duration = performance.now() - start;
            console.debug(
              `[Performance] ${componentName}.${name}: ${duration.toFixed(2)}ms`
            );
          });
        }

        const duration = performance.now() - start;
        console.debug(
          `[Performance] ${componentName}.${name}: ${duration.toFixed(2)}ms`
        );
        return result;
      }) as T;
    },
    [componentName]
  );

  return { getMetrics, measureCallback };
}
```

## Web Vitals Monitoring

### src/lib/web-vitals.ts
```typescript
// src/lib/web-vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

type VitalName = 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';

interface VitalReport {
  name: VitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Thresholds for rating
const thresholds: Record<VitalName, [number, number]> = {
  CLS: [0.1, 0.25],
  FID: [100, 300],
  FCP: [1800, 3000],
  LCP: [2500, 4000],
  TTFB: [800, 1800],
  INP: [200, 500]
};

function getRating(name: VitalName, value: number): VitalReport['rating'] {
  const [good, poor] = thresholds[name];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

// Store vitals for later analysis
const vitalsStore: VitalReport[] = [];

function handleVital(metric: Metric): void {
  const report: VitalReport = {
    name: metric.name as VitalName,
    value: metric.value,
    rating: getRating(metric.name as VitalName, metric.value),
    delta: metric.delta,
    id: metric.id
  };

  vitalsStore.push(report);

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    const color =
      report.rating === 'good'
        ? '\x1b[32m'
        : report.rating === 'needs-improvement'
          ? '\x1b[33m'
          : '\x1b[31m';
    console.log(
      `${color}[Web Vital] ${report.name}: ${report.value.toFixed(2)} (${report.rating})\x1b[0m`
    );
  }

  // Send to analytics
  sendToAnalytics(report);
}

function sendToAnalytics(report: VitalReport): void {
  // Send to your analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', report.name, {
      event_category: 'Web Vitals',
      event_label: report.id,
      value: Math.round(report.name === 'CLS' ? report.value * 1000 : report.value),
      non_interaction: true
    });
  }

  // Or send to custom endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_URL) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
      method: 'POST',
      body: JSON.stringify(report),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true
    }).catch(() => {});
  }
}

// Initialize web vitals monitoring
export function initWebVitals(): void {
  onCLS(handleVital);
  onFID(handleVital);
  onFCP(handleVital);
  onLCP(handleVital);
  onTTFB(handleVital);
  onINP(handleVital);
}

// Get current vitals
export function getVitals(): VitalReport[] {
  return [...vitalsStore];
}

// Get summary
export function getVitalsSummary(): Record<VitalName, VitalReport | null> {
  const summary: Record<VitalName, VitalReport | null> = {
    CLS: null,
    FID: null,
    FCP: null,
    LCP: null,
    TTFB: null,
    INP: null
  };

  vitalsStore.forEach(report => {
    summary[report.name] = report;
  });

  return summary;
}
```

## Performance Dashboard

### src/components/PerformanceDashboard.tsx
```typescript
// src/components/PerformanceDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getVitals, getVitalsSummary } from '@/lib/web-vitals';
import { getProfilingStats } from './Profiler';

export function PerformanceDashboard() {
  const [vitals, setVitals] = useState(getVitalsSummary());
  const [profilingStats, setProfilingStats] = useState<Record<string, unknown>>({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(getVitalsSummary());
      setProfilingStats(getProfilingStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-500';
      case 'needs-improvement':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        {isOpen ? '✕ Close' : '📊 Performance'}
      </button>

      {isOpen && (
        <div className="absolute bottom-12 left-0 bg-gray-900 text-white p-4 rounded-lg shadow-xl w-80 max-h-96 overflow-auto">
          <h3 className="font-bold text-lg mb-4">Web Vitals</h3>

          <div className="space-y-2 mb-4">
            {Object.entries(vitals).map(([name, data]) => (
              <div key={name} className="flex justify-between">
                <span className="text-gray-400">{name}:</span>
                {data ? (
                  <span className={getRatingColor(data.rating)}>
                    {data.value.toFixed(2)}
                    {name === 'CLS' ? '' : 'ms'}
                  </span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>
            ))}
          </div>

          <h3 className="font-bold text-lg mb-2 mt-4">Component Renders</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(profilingStats).map(([id, stats]: [string, any]) => (
              <div key={id} className="bg-gray-800 p-2 rounded">
                <div className="font-medium">{id}</div>
                <div className="text-gray-400">
                  Renders: {stats.totalRenders} |
                  Avg: {stats.averageDuration.toFixed(2)}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## CLAUDE.md Integration

```markdown
## Profiling

### Quick Commands
```bash
# Node.js CPU profiling
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Memory profiling
node --inspect app.js
# Open chrome://inspect

# Heap snapshot
process.heapUsage()
```

### React Profiling
- Wrap components with <ProfilerWrapper>
- Use usePerformance hook for metrics
- Check getProfilingStats() for data

### Web Vitals
- LCP < 2.5s (good)
- FID < 100ms (good)
- CLS < 0.1 (good)

### Performance Dashboard
- Available in development mode
- Bottom-left corner toggle
- Real-time metrics display
```

## AI Suggestions

1. **Automated profiling** - Profile during CI/CD
2. **Regression detection** - Track performance changes
3. **Memory analysis** - Identify leak patterns
4. **Flame graphs** - Visual profiling
5. **Bundle analysis** - Optimize bundle size
6. **Render optimization** - Identify wasted renders
7. **Database profiling** - Query performance
8. **Network profiling** - API latency
9. **Custom metrics** - Business-specific KPIs
10. **Alerting** - Performance degradation alerts
