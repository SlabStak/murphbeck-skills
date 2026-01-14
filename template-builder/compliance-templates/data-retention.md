# Data Retention Template

Automated data retention and deletion policies with scheduling, compliance tracking, and audit trails.

## Overview

This template provides a complete data retention management system for implementing and enforcing data lifecycle policies in compliance with GDPR, CCPA, and other privacy regulations.

## Quick Start

```bash
npm install uuid date-fns node-cron
npm install -D typescript @types/node
```

## Data Retention Framework

```typescript
// src/retention/framework.ts
import { v4 as uuidv4 } from 'uuid';
import { addDays, addMonths, addYears, isBefore } from 'date-fns';

// Retention period units
export type RetentionUnit = 'days' | 'months' | 'years' | 'indefinite';

// Data classification
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'pii' | 'sensitive';

// Retention policy
export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  dataType: string;
  classification: DataClassification;
  retentionPeriod: number;
  retentionUnit: RetentionUnit;
  legalBasis: string;
  regulatoryRequirement?: string;
  deletionMethod: 'soft_delete' | 'hard_delete' | 'anonymize' | 'archive';
  archiveLocation?: string;
  reviewRequired: boolean;
  exceptions: RetentionException[];
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

// Retention exception
export interface RetentionException {
  id: string;
  policyId: string;
  reason: string;
  exceptionType: 'legal_hold' | 'investigation' | 'litigation' | 'regulatory' | 'business';
  startDate: Date;
  endDate?: Date;
  affectedRecords: string[];
  approvedBy: string;
  active: boolean;
}

// Data record for retention tracking
export interface DataRecord {
  id: string;
  policyId: string;
  recordType: string;
  recordId: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'held' | 'deleted' | 'archived';
  metadata: Record<string, any>;
  deletedAt?: Date;
  deletedBy?: string;
  holdId?: string;
}

// Deletion job
export interface DeletionJob {
  id: string;
  policyId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  recordCount: number;
  deletedCount: number;
  failedCount: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  executedBy: string;
}

// Audit log entry
export interface RetentionAuditLog {
  id: string;
  action: 'policy_created' | 'policy_updated' | 'record_deleted' | 'record_archived' | 'hold_applied' | 'hold_released' | 'job_executed';
  policyId?: string;
  recordId?: string;
  jobId?: string;
  userId: string;
  timestamp: Date;
  details: Record<string, any>;
}

// Data Retention Service
export class DataRetentionService {
  private policies: Map<string, RetentionPolicy> = new Map();
  private records: Map<string, DataRecord> = new Map();
  private exceptions: Map<string, RetentionException> = new Map();
  private jobs: Map<string, DeletionJob> = new Map();
  private auditLog: RetentionAuditLog[] = [];
  private deletionHandler?: (record: DataRecord, method: string) => Promise<boolean>;

  // Set deletion handler
  setDeletionHandler(handler: (record: DataRecord, method: string) => Promise<boolean>): void {
    this.deletionHandler = handler;
  }

  // Create retention policy
  createPolicy(params: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt' | 'exceptions'>): RetentionPolicy {
    const policy: RetentionPolicy = {
      id: uuidv4(),
      ...params,
      exceptions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policies.set(policy.id, policy);
    this.log('policy_created', { policyId: policy.id, name: policy.name }, 'system');

    return policy;
  }

  // Update retention policy
  updatePolicy(policyId: string, updates: Partial<RetentionPolicy>): RetentionPolicy {
    const policy = this.policies.get(policyId);
    if (!policy) throw new Error('Policy not found');

    const updatedPolicy = {
      ...policy,
      ...updates,
      id: policy.id,
      createdAt: policy.createdAt,
      updatedAt: new Date(),
    };

    this.policies.set(policyId, updatedPolicy);
    this.log('policy_updated', { policyId, updates }, 'system');

    return updatedPolicy;
  }

  // Get all policies
  getPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }

  // Register data record
  registerRecord(params: {
    policyId: string;
    recordType: string;
    recordId: string;
    createdAt?: Date;
    metadata?: Record<string, any>;
  }): DataRecord {
    const policy = this.policies.get(params.policyId);
    if (!policy) throw new Error('Policy not found');

    const createdAt = params.createdAt || new Date();
    const expiresAt = this.calculateExpiry(createdAt, policy.retentionPeriod, policy.retentionUnit);

    const record: DataRecord = {
      id: uuidv4(),
      policyId: params.policyId,
      recordType: params.recordType,
      recordId: params.recordId,
      createdAt,
      expiresAt,
      status: 'active',
      metadata: params.metadata || {},
    };

    this.records.set(record.id, record);
    return record;
  }

  // Calculate expiry date
  private calculateExpiry(startDate: Date, period: number, unit: RetentionUnit): Date {
    switch (unit) {
      case 'days':
        return addDays(startDate, period);
      case 'months':
        return addMonths(startDate, period);
      case 'years':
        return addYears(startDate, period);
      case 'indefinite':
        return addYears(startDate, 100); // Far future date
      default:
        return addYears(startDate, 1);
    }
  }

  // Get expired records
  getExpiredRecords(policyId?: string): DataRecord[] {
    const now = new Date();
    return Array.from(this.records.values()).filter((record) => {
      if (record.status !== 'active') return false;
      if (record.holdId) return false;
      if (policyId && record.policyId !== policyId) return false;
      return isBefore(record.expiresAt, now);
    });
  }

  // Apply legal hold
  applyHold(params: {
    policyId: string;
    reason: string;
    exceptionType: RetentionException['exceptionType'];
    recordIds: string[];
    approvedBy: string;
    endDate?: Date;
  }): RetentionException {
    const exception: RetentionException = {
      id: uuidv4(),
      policyId: params.policyId,
      reason: params.reason,
      exceptionType: params.exceptionType,
      startDate: new Date(),
      endDate: params.endDate,
      affectedRecords: params.recordIds,
      approvedBy: params.approvedBy,
      active: true,
    };

    this.exceptions.set(exception.id, exception);

    // Update affected records
    for (const recordId of params.recordIds) {
      const record = this.records.get(recordId);
      if (record) {
        record.status = 'held';
        record.holdId = exception.id;
      }
    }

    this.log('hold_applied', {
      exceptionId: exception.id,
      recordCount: params.recordIds.length,
      reason: params.reason,
    }, params.approvedBy);

    return exception;
  }

  // Release legal hold
  releaseHold(exceptionId: string, releasedBy: string): void {
    const exception = this.exceptions.get(exceptionId);
    if (!exception) throw new Error('Exception not found');

    exception.active = false;
    exception.endDate = new Date();

    // Update affected records
    for (const recordId of exception.affectedRecords) {
      const record = this.records.get(recordId);
      if (record && record.holdId === exceptionId) {
        record.status = 'active';
        record.holdId = undefined;
      }
    }

    this.log('hold_released', { exceptionId, recordCount: exception.affectedRecords.length }, releasedBy);
  }

  // Execute deletion job
  async executeDeletionJob(policyId: string, executedBy: string): Promise<DeletionJob> {
    const policy = this.policies.get(policyId);
    if (!policy) throw new Error('Policy not found');

    const expiredRecords = this.getExpiredRecords(policyId);

    const job: DeletionJob = {
      id: uuidv4(),
      policyId,
      status: 'running',
      recordCount: expiredRecords.length,
      deletedCount: 0,
      failedCount: 0,
      startedAt: new Date(),
      executedBy,
    };

    this.jobs.set(job.id, job);

    try {
      for (const record of expiredRecords) {
        try {
          const success = await this.deleteRecord(record, policy.deletionMethod);
          if (success) {
            job.deletedCount++;
          } else {
            job.failedCount++;
          }
        } catch (error) {
          job.failedCount++;
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.log('job_executed', {
      jobId: job.id,
      deleted: job.deletedCount,
      failed: job.failedCount,
    }, executedBy);

    return job;
  }

  // Delete or archive a record
  private async deleteRecord(record: DataRecord, method: string): Promise<boolean> {
    if (this.deletionHandler) {
      const success = await this.deletionHandler(record, method);
      if (success) {
        record.status = method === 'archive' ? 'archived' : 'deleted';
        record.deletedAt = new Date();
        this.log('record_deleted', { recordId: record.id, method }, 'system');
      }
      return success;
    }

    // Default behavior - just update status
    record.status = method === 'archive' ? 'archived' : 'deleted';
    record.deletedAt = new Date();
    this.log('record_deleted', { recordId: record.id, method }, 'system');
    return true;
  }

  // Get retention summary
  getRetentionSummary(): object {
    const records = Array.from(this.records.values());
    const now = new Date();

    return {
      totalPolicies: this.policies.size,
      activePolicies: Array.from(this.policies.values()).filter((p) => p.active).length,
      totalRecords: records.length,
      activeRecords: records.filter((r) => r.status === 'active').length,
      expiredRecords: records.filter((r) => r.status === 'active' && isBefore(r.expiresAt, now)).length,
      heldRecords: records.filter((r) => r.status === 'held').length,
      deletedRecords: records.filter((r) => r.status === 'deleted').length,
      archivedRecords: records.filter((r) => r.status === 'archived').length,
      activeHolds: Array.from(this.exceptions.values()).filter((e) => e.active).length,
      totalJobs: this.jobs.size,
      pendingJobs: Array.from(this.jobs.values()).filter((j) => j.status === 'pending').length,
    };
  }

  // Log action
  private log(action: RetentionAuditLog['action'], details: Record<string, any>, userId: string): void {
    const entry: RetentionAuditLog = {
      id: uuidv4(),
      action,
      userId,
      timestamp: new Date(),
      details,
      policyId: details.policyId,
      recordId: details.recordId,
      jobId: details.jobId,
    };
    this.auditLog.push(entry);
  }

  // Get audit log
  getAuditLog(filters?: {
    policyId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): RetentionAuditLog[] {
    return this.auditLog.filter((entry) => {
      if (filters?.policyId && entry.policyId !== filters.policyId) return false;
      if (filters?.action && entry.action !== filters.action) return false;
      if (filters?.startDate && entry.timestamp < filters.startDate) return false;
      if (filters?.endDate && entry.timestamp > filters.endDate) return false;
      return true;
    });
  }
}
```

## Scheduled Deletion

```typescript
// src/retention/scheduler.ts
import cron from 'node-cron';
import { DataRetentionService } from './framework';

export interface SchedulerConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  dryRun: boolean;
  notifyOnComplete: boolean;
  notifyEmail?: string;
}

export class RetentionScheduler {
  private service: DataRetentionService;
  private config: SchedulerConfig;
  private task: cron.ScheduledTask | null = null;

  constructor(service: DataRetentionService, config: SchedulerConfig) {
    this.service = service;
    this.config = config;
  }

  // Start scheduler
  start(): void {
    if (!this.config.enabled) return;

    this.task = cron.schedule(this.config.schedule, async () => {
      await this.runRetentionProcess();
    });

    console.log(`Retention scheduler started with schedule: ${this.config.schedule}`);
  }

  // Stop scheduler
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('Retention scheduler stopped');
    }
  }

  // Run retention process manually
  async runRetentionProcess(): Promise<object> {
    console.log('Starting retention process...');

    const results = {
      startedAt: new Date(),
      completedAt: null as Date | null,
      policiesProcessed: 0,
      totalDeleted: 0,
      totalFailed: 0,
      errors: [] as string[],
    };

    const policies = this.service.getPolicies().filter((p) => p.active);

    for (const policy of policies) {
      try {
        if (this.config.dryRun) {
          const expired = this.service.getExpiredRecords(policy.id);
          console.log(`[DRY RUN] Policy ${policy.name}: ${expired.length} records would be deleted`);
          results.totalDeleted += expired.length;
        } else {
          const job = await this.service.executeDeletionJob(policy.id, 'scheduler');
          results.totalDeleted += job.deletedCount;
          results.totalFailed += job.failedCount;
        }
        results.policiesProcessed++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Policy ${policy.name}: ${message}`);
      }
    }

    results.completedAt = new Date();

    if (this.config.notifyOnComplete) {
      await this.sendNotification(results);
    }

    console.log('Retention process completed:', results);
    return results;
  }

  private async sendNotification(results: object): Promise<void> {
    // Implement email notification
    console.log('Sending notification:', results);
  }
}
```

## Retention Policy Templates

```typescript
// src/retention/templates.ts
import { RetentionPolicy, DataClassification } from './framework';

// Common retention policies
export const COMMON_POLICIES: Partial<RetentionPolicy>[] = [
  {
    name: 'User Account Data',
    description: 'Personal information associated with user accounts',
    dataType: 'user_account',
    classification: 'pii',
    retentionPeriod: 3,
    retentionUnit: 'years',
    legalBasis: 'Contractual necessity and legitimate interests',
    deletionMethod: 'anonymize',
    reviewRequired: true,
  },
  {
    name: 'Transaction Records',
    description: 'Financial transaction and payment records',
    dataType: 'transactions',
    classification: 'confidential',
    retentionPeriod: 7,
    retentionUnit: 'years',
    legalBasis: 'Legal obligation - tax and accounting requirements',
    regulatoryRequirement: 'SOX, Tax regulations',
    deletionMethod: 'archive',
    archiveLocation: 'cold-storage',
    reviewRequired: true,
  },
  {
    name: 'Access Logs',
    description: 'System access and security logs',
    dataType: 'access_logs',
    classification: 'internal',
    retentionPeriod: 1,
    retentionUnit: 'years',
    legalBasis: 'Security and legitimate interests',
    deletionMethod: 'hard_delete',
    reviewRequired: false,
  },
  {
    name: 'Analytics Data',
    description: 'Anonymized usage analytics',
    dataType: 'analytics',
    classification: 'internal',
    retentionPeriod: 2,
    retentionUnit: 'years',
    legalBasis: 'Consent or legitimate interests',
    deletionMethod: 'hard_delete',
    reviewRequired: false,
  },
  {
    name: 'Support Tickets',
    description: 'Customer support communications',
    dataType: 'support_tickets',
    classification: 'confidential',
    retentionPeriod: 3,
    retentionUnit: 'years',
    legalBasis: 'Contractual necessity',
    deletionMethod: 'anonymize',
    reviewRequired: false,
  },
  {
    name: 'Marketing Consents',
    description: 'Marketing consent records',
    dataType: 'marketing_consents',
    classification: 'pii',
    retentionPeriod: 5,
    retentionUnit: 'years',
    legalBasis: 'Legal obligation - consent records',
    regulatoryRequirement: 'GDPR Article 7',
    deletionMethod: 'hard_delete',
    reviewRequired: true,
  },
  {
    name: 'Session Data',
    description: 'User session and temporary data',
    dataType: 'sessions',
    classification: 'internal',
    retentionPeriod: 30,
    retentionUnit: 'days',
    legalBasis: 'Legitimate interests',
    deletionMethod: 'hard_delete',
    reviewRequired: false,
  },
  {
    name: 'Employee Records',
    description: 'HR and employee data',
    dataType: 'employee_records',
    classification: 'restricted',
    retentionPeriod: 7,
    retentionUnit: 'years',
    legalBasis: 'Legal obligation and contractual necessity',
    regulatoryRequirement: 'Employment law requirements',
    deletionMethod: 'archive',
    reviewRequired: true,
  },
];

// GDPR-specific retention periods
export const GDPR_RETENTION = {
  consent_records: { period: 5, unit: 'years' as const, basis: 'GDPR Article 7(1)' },
  dsar_records: { period: 3, unit: 'years' as const, basis: 'GDPR accountability' },
  breach_notifications: { period: 5, unit: 'years' as const, basis: 'GDPR Article 33-34' },
  dpia_records: { period: 3, unit: 'years' as const, basis: 'GDPR Article 35' },
  processing_records: { period: 6, unit: 'years' as const, basis: 'GDPR Article 30' },
};

// Industry-specific requirements
export const INDUSTRY_REQUIREMENTS = {
  healthcare: {
    medical_records: { period: 6, unit: 'years' as const, regulation: 'HIPAA' },
    billing_records: { period: 7, unit: 'years' as const, regulation: 'HIPAA/Tax' },
  },
  financial: {
    transaction_records: { period: 7, unit: 'years' as const, regulation: 'SOX/SEC' },
    kyc_documents: { period: 5, unit: 'years' as const, regulation: 'AML/KYC' },
    audit_trails: { period: 7, unit: 'years' as const, regulation: 'SOX' },
  },
  education: {
    student_records: { period: 5, unit: 'years' as const, regulation: 'FERPA' },
    transcripts: { period: 'indefinite' as const, regulation: 'FERPA' },
  },
};
```

## Usage Example

```typescript
import { DataRetentionService } from './retention/framework';
import { RetentionScheduler } from './retention/scheduler';
import { COMMON_POLICIES } from './retention/templates';

// Initialize service
const retentionService = new DataRetentionService();

// Create policies from templates
for (const template of COMMON_POLICIES) {
  retentionService.createPolicy({
    ...template,
    active: true,
  } as any);
}

// Set up deletion handler
retentionService.setDeletionHandler(async (record, method) => {
  console.log(`Deleting record ${record.recordId} using method ${method}`);
  // Implement actual deletion logic
  return true;
});

// Register some records
const userPolicy = retentionService.getPolicies().find((p) => p.dataType === 'user_account');
if (userPolicy) {
  retentionService.registerRecord({
    policyId: userPolicy.id,
    recordType: 'user',
    recordId: 'user-123',
    metadata: { email: 'user@example.com' },
  });
}

// Set up scheduled retention
const scheduler = new RetentionScheduler(retentionService, {
  enabled: true,
  schedule: '0 2 * * *', // Daily at 2 AM
  dryRun: false,
  notifyOnComplete: true,
  notifyEmail: 'admin@example.com',
});

scheduler.start();

// Get retention summary
console.log(retentionService.getRetentionSummary());
```

## CLAUDE.md Integration

```markdown
## Data Retention

Automated data retention and deletion management.

### Policies
- User data: 3 years, anonymize
- Transactions: 7 years, archive
- Logs: 1 year, delete
- Analytics: 2 years, delete

### Commands
- `npm run retention:summary` - View retention status
- `npm run retention:dry-run` - Preview deletions
- `npm run retention:execute` - Run deletion jobs

### Legal Holds
Apply holds to prevent deletion during investigations.
```

## AI Suggestions

1. **Add data discovery** - Scan for unclassified data
2. **Implement data lineage** - Track data origins
3. **Add retention analytics** - Dashboard and reports
4. **Create policy wizard** - Guided policy creation
5. **Add compliance mapping** - Map to regulations
6. **Implement cascading deletions** - Related data handling
7. **Add deletion verification** - Confirm complete removal
8. **Create retention certificates** - Proof of deletion
9. **Add exception workflows** - Approval processes
10. **Implement data minimization** - Proactive data reduction
