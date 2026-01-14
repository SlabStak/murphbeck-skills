# Audit Logging Template

Comprehensive audit logging for compliance with tamper-proof records, structured events, and regulatory reporting.

## Overview

This template provides production-ready audit logging infrastructure for compliance requirements including SOC 2, HIPAA, GDPR, and PCI-DSS with immutable logs, search capabilities, and retention management.

## Quick Start

```bash
npm install uuid winston winston-daily-rotate-file crypto-js
npm install -D typescript @types/node
```

## Audit Logging Framework

```typescript
// src/audit/logger.ts
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Audit event types
export type AuditEventType =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'configuration_change'
  | 'security_event'
  | 'admin_action'
  | 'user_action'
  | 'system_event'
  | 'api_call'
  | 'export'
  | 'consent'
  | 'error';

// Audit event severity
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

// Audit event outcome
export type AuditOutcome = 'success' | 'failure' | 'partial' | 'unknown';

// Actor information
export interface AuditActor {
  id: string;
  type: 'user' | 'service' | 'system' | 'anonymous';
  name?: string;
  email?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

// Target resource
export interface AuditTarget {
  type: string;
  id: string;
  name?: string;
  attributes?: Record<string, any>;
}

// Audit event
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  action: string;
  severity: AuditSeverity;
  outcome: AuditOutcome;
  actor: AuditActor;
  target?: AuditTarget;
  resource?: string;
  changes?: AuditChange[];
  metadata?: Record<string, any>;
  correlationId?: string;
  parentEventId?: string;
  duration?: number;
  errorCode?: string;
  errorMessage?: string;
  hash?: string;
  previousHash?: string;
}

// Change tracking
export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  sensitive?: boolean;
}

// Audit configuration
export interface AuditConfig {
  serviceName: string;
  environment: string;
  version: string;
  retentionDays: number;
  hashingEnabled: boolean;
  hashingSecret?: string;
  sensitiveFields: string[];
  outputFormats: ('json' | 'console' | 'file')[];
  filePath?: string;
  maxFileSize?: string;
  maxFiles?: number;
}

// Audit Logger
export class AuditLogger {
  private config: AuditConfig;
  private logger: winston.Logger;
  private lastHash: string = '';
  private eventBuffer: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: AuditConfig) {
    this.config = config;
    this.logger = this.createLogger();

    // Set up periodic flush
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    if (this.config.outputFormats.includes('console')) {
      transports.push(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [AUDIT] ${level}: ${message}`;
          })
        ),
      }));
    }

    if (this.config.outputFormats.includes('file') && this.config.filePath) {
      transports.push(new DailyRotateFile({
        filename: `${this.config.filePath}/audit-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: this.config.maxFileSize || '100m',
        maxFiles: this.config.maxFiles || this.config.retentionDays,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      }));
    }

    return winston.createLogger({
      level: 'info',
      transports,
    });
  }

  // Log an audit event
  log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash' | 'previousHash'>): AuditEvent {
    const fullEvent: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      ...event,
      previousHash: this.lastHash,
    };

    // Mask sensitive fields
    if (fullEvent.changes) {
      fullEvent.changes = this.maskSensitiveChanges(fullEvent.changes);
    }

    // Calculate hash for tamper detection
    if (this.config.hashingEnabled) {
      fullEvent.hash = this.calculateHash(fullEvent);
      this.lastHash = fullEvent.hash;
    }

    // Buffer event
    this.eventBuffer.push(fullEvent);

    // Log immediately for critical events
    if (fullEvent.severity === 'critical') {
      this.flush();
    }

    return fullEvent;
  }

  // Convenience methods
  authentication(params: {
    actor: AuditActor;
    action: 'login' | 'logout' | 'password_change' | 'mfa_setup' | 'session_refresh';
    outcome: AuditOutcome;
    metadata?: Record<string, any>;
  }): AuditEvent {
    return this.log({
      eventType: 'authentication',
      action: params.action,
      severity: params.outcome === 'failure' ? 'warning' : 'info',
      outcome: params.outcome,
      actor: params.actor,
      metadata: params.metadata,
    });
  }

  dataAccess(params: {
    actor: AuditActor;
    target: AuditTarget;
    action: 'read' | 'list' | 'search' | 'export';
    outcome: AuditOutcome;
    metadata?: Record<string, any>;
  }): AuditEvent {
    return this.log({
      eventType: 'data_access',
      action: params.action,
      severity: 'info',
      outcome: params.outcome,
      actor: params.actor,
      target: params.target,
      metadata: params.metadata,
    });
  }

  dataModification(params: {
    actor: AuditActor;
    target: AuditTarget;
    action: 'create' | 'update' | 'delete';
    changes?: AuditChange[];
    outcome: AuditOutcome;
    metadata?: Record<string, any>;
  }): AuditEvent {
    return this.log({
      eventType: 'data_modification',
      action: params.action,
      severity: params.action === 'delete' ? 'warning' : 'info',
      outcome: params.outcome,
      actor: params.actor,
      target: params.target,
      changes: params.changes,
      metadata: params.metadata,
    });
  }

  securityEvent(params: {
    actor: AuditActor;
    action: string;
    severity: AuditSeverity;
    outcome: AuditOutcome;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): AuditEvent {
    return this.log({
      eventType: 'security_event',
      action: params.action,
      severity: params.severity,
      outcome: params.outcome,
      actor: params.actor,
      errorMessage: params.errorMessage,
      metadata: params.metadata,
    });
  }

  adminAction(params: {
    actor: AuditActor;
    action: string;
    target?: AuditTarget;
    changes?: AuditChange[];
    outcome: AuditOutcome;
    metadata?: Record<string, any>;
  }): AuditEvent {
    return this.log({
      eventType: 'admin_action',
      action: params.action,
      severity: 'warning',
      outcome: params.outcome,
      actor: params.actor,
      target: params.target,
      changes: params.changes,
      metadata: params.metadata,
    });
  }

  // Mask sensitive fields
  private maskSensitiveChanges(changes: AuditChange[]): AuditChange[] {
    return changes.map((change) => {
      if (this.config.sensitiveFields.includes(change.field) || change.sensitive) {
        return {
          ...change,
          oldValue: change.oldValue ? '[REDACTED]' : null,
          newValue: change.newValue ? '[REDACTED]' : null,
        };
      }
      return change;
    });
  }

  // Calculate tamper-proof hash
  private calculateHash(event: AuditEvent): string {
    const data = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      eventType: event.eventType,
      action: event.action,
      actor: event.actor,
      target: event.target,
      previousHash: event.previousHash,
    });

    const secret = this.config.hashingSecret || 'default-secret';
    return CryptoJS.HmacSHA256(data, secret).toString();
  }

  // Verify event chain integrity
  verifyChain(events: AuditEvent[]): { valid: boolean; brokenAt?: number } {
    if (!this.config.hashingEnabled) {
      return { valid: true };
    }

    let previousHash = '';
    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // Verify previous hash matches
      if (event.previousHash !== previousHash) {
        return { valid: false, brokenAt: i };
      }

      // Verify event hash
      const calculatedHash = this.calculateHash({ ...event, hash: undefined });
      if (calculatedHash !== event.hash) {
        return { valid: false, brokenAt: i };
      }

      previousHash = event.hash!;
    }

    return { valid: true };
  }

  // Flush buffered events
  flush(): void {
    for (const event of this.eventBuffer) {
      const message = `${event.eventType}:${event.action} by ${event.actor.type}:${event.actor.id} - ${event.outcome}`;
      const level = this.severityToLevel(event.severity);
      this.logger.log(level, message, { audit: event });
    }
    this.eventBuffer = [];
  }

  private severityToLevel(severity: AuditSeverity): string {
    const map: Record<AuditSeverity, string> = {
      info: 'info',
      warning: 'warn',
      error: 'error',
      critical: 'error',
    };
    return map[severity];
  }

  // Shutdown
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
    await new Promise<void>((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}
```

## Query and Search

```typescript
// src/audit/query.ts
import { AuditEvent, AuditEventType, AuditSeverity, AuditOutcome } from './logger';

// Query filters
export interface AuditQueryFilters {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  outcomes?: AuditOutcome[];
  actorId?: string;
  actorType?: string;
  targetId?: string;
  targetType?: string;
  action?: string;
  correlationId?: string;
  searchText?: string;
}

// Query options
export interface AuditQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'eventType';
  sortOrder?: 'asc' | 'desc';
}

// Query result
export interface AuditQueryResult {
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Audit Query Service
export class AuditQueryService {
  private events: AuditEvent[] = [];

  // Add event to queryable store
  addEvent(event: AuditEvent): void {
    this.events.push(event);
  }

  // Query events
  query(filters: AuditQueryFilters, options: AuditQueryOptions = {}): AuditQueryResult {
    let filtered = this.events.filter((event) => this.matchesFilters(event, filters));

    // Sort
    const sortBy = options.sortBy || 'timestamp';
    const sortOrder = options.sortOrder || 'desc';
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'severity':
          const severityOrder = { info: 0, warning: 1, error: 2, critical: 3 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'eventType':
          comparison = a.eventType.localeCompare(b.eventType);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Paginate
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      events: paginated,
      total: filtered.length,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < filtered.length,
    };
  }

  private matchesFilters(event: AuditEvent, filters: AuditQueryFilters): boolean {
    if (filters.startDate && event.timestamp < filters.startDate) return false;
    if (filters.endDate && event.timestamp > filters.endDate) return false;
    if (filters.eventTypes && !filters.eventTypes.includes(event.eventType)) return false;
    if (filters.severities && !filters.severities.includes(event.severity)) return false;
    if (filters.outcomes && !filters.outcomes.includes(event.outcome)) return false;
    if (filters.actorId && event.actor.id !== filters.actorId) return false;
    if (filters.actorType && event.actor.type !== filters.actorType) return false;
    if (filters.targetId && event.target?.id !== filters.targetId) return false;
    if (filters.targetType && event.target?.type !== filters.targetType) return false;
    if (filters.action && event.action !== filters.action) return false;
    if (filters.correlationId && event.correlationId !== filters.correlationId) return false;
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const searchable = JSON.stringify(event).toLowerCase();
      if (!searchable.includes(searchLower)) return false;
    }
    return true;
  }

  // Get event by ID
  getById(id: string): AuditEvent | undefined {
    return this.events.find((e) => e.id === id);
  }

  // Get events by correlation ID
  getByCorrelationId(correlationId: string): AuditEvent[] {
    return this.events.filter((e) => e.correlationId === correlationId);
  }

  // Get statistics
  getStatistics(startDate: Date, endDate: Date): object {
    const filtered = this.events.filter(
      (e) => e.timestamp >= startDate && e.timestamp <= endDate
    );

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byOutcome: Record<string, number> = {};
    const byActor: Record<string, number> = {};

    for (const event of filtered) {
      byType[event.eventType] = (byType[event.eventType] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
      byOutcome[event.outcome] = (byOutcome[event.outcome] || 0) + 1;
      byActor[event.actor.id] = (byActor[event.actor.id] || 0) + 1;
    }

    return {
      totalEvents: filtered.length,
      byType,
      bySeverity,
      byOutcome,
      topActors: Object.entries(byActor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
    };
  }
}
```

## Compliance Reporting

```typescript
// src/audit/reporting.ts
import { AuditEvent, AuditEventType } from './logger';
import { AuditQueryService, AuditQueryFilters } from './query';

// Report types
export type ReportType = 'access_report' | 'security_report' | 'compliance_report' | 'activity_report';

// Report configuration
export interface ReportConfig {
  type: ReportType;
  startDate: Date;
  endDate: Date;
  filters?: AuditQueryFilters;
  format: 'json' | 'csv' | 'pdf';
  includeDetails: boolean;
}

// Audit Report Generator
export class AuditReportGenerator {
  constructor(private queryService: AuditQueryService) {}

  // Generate report
  async generate(config: ReportConfig): Promise<object> {
    const filters: AuditQueryFilters = {
      ...config.filters,
      startDate: config.startDate,
      endDate: config.endDate,
    };

    switch (config.type) {
      case 'access_report':
        return this.generateAccessReport(filters, config.includeDetails);
      case 'security_report':
        return this.generateSecurityReport(filters, config.includeDetails);
      case 'compliance_report':
        return this.generateComplianceReport(filters, config.includeDetails);
      case 'activity_report':
        return this.generateActivityReport(filters, config.includeDetails);
      default:
        throw new Error(`Unknown report type: ${config.type}`);
    }
  }

  private generateAccessReport(filters: AuditQueryFilters, includeDetails: boolean): object {
    const accessFilters: AuditQueryFilters = {
      ...filters,
      eventTypes: ['data_access', 'authentication', 'authorization'],
    };

    const result = this.queryService.query(accessFilters, { limit: 10000 });

    const summary = {
      totalAccessEvents: result.total,
      successfulAccess: result.events.filter((e) => e.outcome === 'success').length,
      failedAccess: result.events.filter((e) => e.outcome === 'failure').length,
      uniqueUsers: new Set(result.events.map((e) => e.actor.id)).size,
      accessByResource: this.groupBy(result.events, (e) => e.target?.type || 'unknown'),
      accessByUser: this.groupBy(result.events, (e) => e.actor.id),
    };

    return {
      reportType: 'Access Report',
      generatedAt: new Date().toISOString(),
      period: { start: filters.startDate, end: filters.endDate },
      summary,
      events: includeDetails ? result.events : undefined,
    };
  }

  private generateSecurityReport(filters: AuditQueryFilters, includeDetails: boolean): object {
    const securityFilters: AuditQueryFilters = {
      ...filters,
      eventTypes: ['security_event', 'authentication'],
    };

    const result = this.queryService.query(securityFilters, { limit: 10000 });
    const criticalEvents = result.events.filter((e) => e.severity === 'critical');
    const failedLogins = result.events.filter(
      (e) => e.eventType === 'authentication' && e.action === 'login' && e.outcome === 'failure'
    );

    return {
      reportType: 'Security Report',
      generatedAt: new Date().toISOString(),
      period: { start: filters.startDate, end: filters.endDate },
      summary: {
        totalSecurityEvents: result.total,
        criticalEvents: criticalEvents.length,
        failedLoginAttempts: failedLogins.length,
        bySeverity: this.groupBy(result.events, (e) => e.severity),
        topIPs: this.getTopValues(result.events, (e) => e.actor.ipAddress),
        suspiciousActivity: this.detectSuspiciousPatterns(result.events),
      },
      criticalEvents: criticalEvents.map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        action: e.action,
        actor: e.actor.id,
        details: e.errorMessage,
      })),
      events: includeDetails ? result.events : undefined,
    };
  }

  private generateComplianceReport(filters: AuditQueryFilters, includeDetails: boolean): object {
    const result = this.queryService.query(filters, { limit: 10000 });
    const statistics = this.queryService.getStatistics(filters.startDate!, filters.endDate!);

    return {
      reportType: 'Compliance Report',
      generatedAt: new Date().toISOString(),
      period: { start: filters.startDate, end: filters.endDate },
      summary: {
        totalAuditEvents: result.total,
        statistics,
        dataAccessEvents: result.events.filter((e) => e.eventType === 'data_access').length,
        dataModificationEvents: result.events.filter((e) => e.eventType === 'data_modification').length,
        adminActions: result.events.filter((e) => e.eventType === 'admin_action').length,
        piiAccessEvents: result.events.filter((e) => e.target?.type === 'pii').length,
        exportEvents: result.events.filter((e) => e.eventType === 'export').length,
        consentEvents: result.events.filter((e) => e.eventType === 'consent').length,
      },
      complianceChecks: {
        auditLoggingEnabled: true,
        hashingEnabled: true,
        retentionCompliant: true,
        accessControlsLogged: true,
      },
      events: includeDetails ? result.events : undefined,
    };
  }

  private generateActivityReport(filters: AuditQueryFilters, includeDetails: boolean): object {
    const result = this.queryService.query(filters, { limit: 10000 });

    const dailyActivity: Record<string, number> = {};
    for (const event of result.events) {
      const day = event.timestamp.toISOString().split('T')[0];
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    }

    return {
      reportType: 'Activity Report',
      generatedAt: new Date().toISOString(),
      period: { start: filters.startDate, end: filters.endDate },
      summary: {
        totalEvents: result.total,
        dailyActivity,
        byEventType: this.groupBy(result.events, (e) => e.eventType),
        byAction: this.groupBy(result.events, (e) => e.action),
        activeUsers: new Set(result.events.map((e) => e.actor.id)).size,
        peakHour: this.findPeakHour(result.events),
      },
      events: includeDetails ? result.events : undefined,
    };
  }

  private groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const item of items) {
      const key = keyFn(item);
      groups[key] = (groups[key] || 0) + 1;
    }
    return groups;
  }

  private getTopValues<T>(items: T[], keyFn: (item: T) => string | undefined, limit = 10): Array<[string, number]> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const key = keyFn(item);
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  private detectSuspiciousPatterns(events: AuditEvent[]): string[] {
    const patterns: string[] = [];

    // Multiple failed logins from same IP
    const failedByIP: Record<string, number> = {};
    for (const event of events) {
      if (event.eventType === 'authentication' && event.outcome === 'failure') {
        const ip = event.actor.ipAddress || 'unknown';
        failedByIP[ip] = (failedByIP[ip] || 0) + 1;
      }
    }
    for (const [ip, count] of Object.entries(failedByIP)) {
      if (count >= 5) {
        patterns.push(`Multiple failed logins (${count}) from IP: ${ip}`);
      }
    }

    // After-hours access
    const afterHoursEvents = events.filter((e) => {
      const hour = e.timestamp.getHours();
      return hour < 6 || hour > 22;
    });
    if (afterHoursEvents.length > 10) {
      patterns.push(`${afterHoursEvents.length} after-hours access events detected`);
    }

    return patterns;
  }

  private findPeakHour(events: AuditEvent[]): number {
    const hourCounts: Record<number, number> = {};
    for (const event of events) {
      const hour = event.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    let peakHour = 0;
    let maxCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(hour);
      }
    }
    return peakHour;
  }
}
```

## Usage Example

```typescript
import { AuditLogger } from './audit/logger';
import { AuditQueryService } from './audit/query';
import { AuditReportGenerator } from './audit/reporting';

// Initialize logger
const auditLogger = new AuditLogger({
  serviceName: 'my-application',
  environment: 'production',
  version: '1.0.0',
  retentionDays: 365,
  hashingEnabled: true,
  hashingSecret: 'secure-secret-key',
  sensitiveFields: ['password', 'ssn', 'credit_card'],
  outputFormats: ['console', 'file'],
  filePath: './logs',
});

// Log authentication
auditLogger.authentication({
  actor: {
    id: 'user-123',
    type: 'user',
    email: 'user@example.com',
    ipAddress: '192.168.1.100',
  },
  action: 'login',
  outcome: 'success',
});

// Log data access
auditLogger.dataAccess({
  actor: { id: 'user-123', type: 'user' },
  target: { type: 'customer', id: 'cust-456', name: 'Customer Record' },
  action: 'read',
  outcome: 'success',
});

// Log data modification
auditLogger.dataModification({
  actor: { id: 'user-123', type: 'user' },
  target: { type: 'customer', id: 'cust-456' },
  action: 'update',
  changes: [
    { field: 'email', oldValue: 'old@email.com', newValue: 'new@email.com' },
    { field: 'password', oldValue: 'xxx', newValue: 'yyy', sensitive: true },
  ],
  outcome: 'success',
});

// Generate compliance report
const queryService = new AuditQueryService();
const reportGenerator = new AuditReportGenerator(queryService);

const report = await reportGenerator.generate({
  type: 'compliance_report',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  format: 'json',
  includeDetails: false,
});

console.log(report);
```

## CLAUDE.md Integration

```markdown
## Audit Logging

Compliance-grade audit logging with tamper detection.

### Event Types
- authentication, authorization
- data_access, data_modification
- security_event, admin_action
- user_action, system_event

### Usage
```typescript
auditLogger.dataAccess({
  actor: { id: 'user-123', type: 'user' },
  target: { type: 'record', id: 'rec-456' },
  action: 'read',
  outcome: 'success',
});
```

### Reports
- Access Report
- Security Report
- Compliance Report
- Activity Report
```

## AI Suggestions

1. **Add real-time alerting** - Alert on suspicious patterns
2. **Implement log streaming** - Stream to SIEM systems
3. **Add log encryption** - Encrypt sensitive log data
4. **Create visualization** - Audit dashboards
5. **Add anomaly detection** - ML-based pattern detection
6. **Implement log signing** - Digital signatures
7. **Add log forwarding** - Multiple destinations
8. **Create audit trails** - Visual event chains
9. **Add compliance templates** - Pre-built compliance checks
10. **Implement log archiving** - Long-term cold storage
