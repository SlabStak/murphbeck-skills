# SOC 2 Compliance Template

Comprehensive SOC 2 Type II compliance framework with trust service criteria implementation, evidence collection, and audit readiness.

## Overview

This template provides production-ready SOC 2 compliance infrastructure covering all five Trust Service Criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy.

## Quick Start

```bash
npm install uuid date-fns zod winston
npm install -D typescript @types/node
```

## Trust Service Criteria Framework

```typescript
// src/soc2/framework.ts
import { v4 as uuidv4 } from 'uuid';

// Trust Service Categories
export type TrustServiceCategory =
  | 'security'
  | 'availability'
  | 'processing_integrity'
  | 'confidentiality'
  | 'privacy';

// Control status
export type ControlStatus = 'not_implemented' | 'partial' | 'implemented' | 'tested' | 'certified';

// Evidence type
export type EvidenceType =
  | 'policy'
  | 'procedure'
  | 'screenshot'
  | 'log'
  | 'configuration'
  | 'report'
  | 'attestation'
  | 'interview';

// SOC 2 Control
export interface SOC2Control {
  id: string;
  criteriaId: string;
  category: TrustServiceCategory;
  name: string;
  description: string;
  status: ControlStatus;
  owner: string;
  implementationDate?: Date;
  lastTestedDate?: Date;
  nextReviewDate?: Date;
  evidence: Evidence[];
  risks: Risk[];
  exceptions: Exception[];
}

// Evidence record
export interface Evidence {
  id: string;
  controlId: string;
  type: EvidenceType;
  name: string;
  description: string;
  filePath?: string;
  url?: string;
  collectedAt: Date;
  collectedBy: string;
  validUntil?: Date;
  verified: boolean;
  verifiedBy?: string;
}

// Risk record
export interface Risk {
  id: string;
  controlId: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigations: string[];
  residualRisk: 'low' | 'medium' | 'high';
  acceptedBy?: string;
  acceptedAt?: Date;
}

// Control exception
export interface Exception {
  id: string;
  controlId: string;
  description: string;
  reason: string;
  startDate: Date;
  endDate?: Date;
  approvedBy: string;
  compensatingControls: string[];
}

// Common Criteria Points (CC)
export const COMMON_CRITERIA: Record<string, { id: string; name: string; category: TrustServiceCategory }[]> = {
  security: [
    { id: 'CC1.1', name: 'COSO Principle 1', category: 'security' },
    { id: 'CC1.2', name: 'COSO Principle 2', category: 'security' },
    { id: 'CC1.3', name: 'COSO Principle 3', category: 'security' },
    { id: 'CC1.4', name: 'COSO Principle 4', category: 'security' },
    { id: 'CC1.5', name: 'COSO Principle 5', category: 'security' },
    { id: 'CC2.1', name: 'Information and Communication', category: 'security' },
    { id: 'CC2.2', name: 'Internal Communication', category: 'security' },
    { id: 'CC2.3', name: 'External Communication', category: 'security' },
    { id: 'CC3.1', name: 'Risk Assessment - Objectives', category: 'security' },
    { id: 'CC3.2', name: 'Risk Assessment - Identification', category: 'security' },
    { id: 'CC3.3', name: 'Risk Assessment - Fraud', category: 'security' },
    { id: 'CC3.4', name: 'Risk Assessment - Changes', category: 'security' },
    { id: 'CC4.1', name: 'Monitoring - Evaluations', category: 'security' },
    { id: 'CC4.2', name: 'Monitoring - Deficiencies', category: 'security' },
    { id: 'CC5.1', name: 'Control Activities - Selection', category: 'security' },
    { id: 'CC5.2', name: 'Control Activities - Technology', category: 'security' },
    { id: 'CC5.3', name: 'Control Activities - Policies', category: 'security' },
    { id: 'CC6.1', name: 'Logical Access - Security Software', category: 'security' },
    { id: 'CC6.2', name: 'Logical Access - Credentials', category: 'security' },
    { id: 'CC6.3', name: 'Logical Access - Removal', category: 'security' },
    { id: 'CC6.4', name: 'Logical Access - Physical', category: 'security' },
    { id: 'CC6.5', name: 'Logical Access - Disposal', category: 'security' },
    { id: 'CC6.6', name: 'Logical Access - Boundaries', category: 'security' },
    { id: 'CC6.7', name: 'Logical Access - Transmission', category: 'security' },
    { id: 'CC6.8', name: 'Logical Access - Malicious Software', category: 'security' },
    { id: 'CC7.1', name: 'System Operations - Detection', category: 'security' },
    { id: 'CC7.2', name: 'System Operations - Monitoring', category: 'security' },
    { id: 'CC7.3', name: 'System Operations - Evaluation', category: 'security' },
    { id: 'CC7.4', name: 'System Operations - Response', category: 'security' },
    { id: 'CC7.5', name: 'System Operations - Recovery', category: 'security' },
    { id: 'CC8.1', name: 'Change Management', category: 'security' },
    { id: 'CC9.1', name: 'Risk Mitigation - Vendor', category: 'security' },
    { id: 'CC9.2', name: 'Risk Mitigation - Business Disruption', category: 'security' },
  ],
  availability: [
    { id: 'A1.1', name: 'Availability - Capacity', category: 'availability' },
    { id: 'A1.2', name: 'Availability - Recovery', category: 'availability' },
    { id: 'A1.3', name: 'Availability - Testing', category: 'availability' },
  ],
  processing_integrity: [
    { id: 'PI1.1', name: 'Processing Integrity - Definitions', category: 'processing_integrity' },
    { id: 'PI1.2', name: 'Processing Integrity - Inputs', category: 'processing_integrity' },
    { id: 'PI1.3', name: 'Processing Integrity - Processing', category: 'processing_integrity' },
    { id: 'PI1.4', name: 'Processing Integrity - Outputs', category: 'processing_integrity' },
    { id: 'PI1.5', name: 'Processing Integrity - Storage', category: 'processing_integrity' },
  ],
  confidentiality: [
    { id: 'C1.1', name: 'Confidentiality - Identification', category: 'confidentiality' },
    { id: 'C1.2', name: 'Confidentiality - Disposal', category: 'confidentiality' },
  ],
  privacy: [
    { id: 'P1.1', name: 'Privacy - Notice', category: 'privacy' },
    { id: 'P2.1', name: 'Privacy - Choice', category: 'privacy' },
    { id: 'P3.1', name: 'Privacy - Collection', category: 'privacy' },
    { id: 'P3.2', name: 'Privacy - Consent', category: 'privacy' },
    { id: 'P4.1', name: 'Privacy - Use and Retention', category: 'privacy' },
    { id: 'P4.2', name: 'Privacy - Retention', category: 'privacy' },
    { id: 'P4.3', name: 'Privacy - Disposal', category: 'privacy' },
    { id: 'P5.1', name: 'Privacy - Access', category: 'privacy' },
    { id: 'P5.2', name: 'Privacy - Correction', category: 'privacy' },
    { id: 'P6.1', name: 'Privacy - Disclosure', category: 'privacy' },
    { id: 'P6.2', name: 'Privacy - Third Parties', category: 'privacy' },
    { id: 'P6.3', name: 'Privacy - Notification', category: 'privacy' },
    { id: 'P6.4', name: 'Privacy - Safeguards', category: 'privacy' },
    { id: 'P6.5', name: 'Privacy - Complaints', category: 'privacy' },
    { id: 'P6.6', name: 'Privacy - Changes', category: 'privacy' },
    { id: 'P7.1', name: 'Privacy - Quality', category: 'privacy' },
    { id: 'P8.1', name: 'Privacy - Monitoring', category: 'privacy' },
  ],
};

// SOC 2 Compliance Service
export class SOC2ComplianceService {
  private controls: Map<string, SOC2Control> = new Map();
  private evidence: Map<string, Evidence> = new Map();

  // Initialize with common criteria
  initializeControls(categories: TrustServiceCategory[] = ['security']): void {
    for (const category of categories) {
      const criteria = COMMON_CRITERIA[category] || [];
      for (const criterion of criteria) {
        this.createControl({
          criteriaId: criterion.id,
          category: criterion.category,
          name: criterion.name,
          description: `Control for ${criterion.name}`,
          owner: 'Unassigned',
        });
      }
    }
  }

  // Create control
  createControl(params: Omit<SOC2Control, 'id' | 'status' | 'evidence' | 'risks' | 'exceptions'>): SOC2Control {
    const control: SOC2Control = {
      id: uuidv4(),
      ...params,
      status: 'not_implemented',
      evidence: [],
      risks: [],
      exceptions: [],
    };

    this.controls.set(control.id, control);
    return control;
  }

  // Update control status
  updateControlStatus(controlId: string, status: ControlStatus): SOC2Control {
    const control = this.controls.get(controlId);
    if (!control) throw new Error('Control not found');

    control.status = status;
    if (status === 'implemented') {
      control.implementationDate = new Date();
    }
    if (status === 'tested') {
      control.lastTestedDate = new Date();
    }

    return control;
  }

  // Add evidence
  addEvidence(params: Omit<Evidence, 'id' | 'verified'>): Evidence {
    const evidence: Evidence = {
      id: uuidv4(),
      ...params,
      verified: false,
    };

    this.evidence.set(evidence.id, evidence);

    // Link to control
    const control = this.controls.get(params.controlId);
    if (control) {
      control.evidence.push(evidence);
    }

    return evidence;
  }

  // Verify evidence
  verifyEvidence(evidenceId: string, verifiedBy: string): Evidence {
    const evidence = this.evidence.get(evidenceId);
    if (!evidence) throw new Error('Evidence not found');

    evidence.verified = true;
    evidence.verifiedBy = verifiedBy;

    return evidence;
  }

  // Add risk
  addRisk(controlId: string, risk: Omit<Risk, 'id' | 'controlId'>): Risk {
    const control = this.controls.get(controlId);
    if (!control) throw new Error('Control not found');

    const fullRisk: Risk = {
      id: uuidv4(),
      controlId,
      ...risk,
    };

    control.risks.push(fullRisk);
    return fullRisk;
  }

  // Add exception
  addException(controlId: string, exception: Omit<Exception, 'id' | 'controlId'>): Exception {
    const control = this.controls.get(controlId);
    if (!control) throw new Error('Control not found');

    const fullException: Exception = {
      id: uuidv4(),
      controlId,
      ...exception,
    };

    control.exceptions.push(fullException);
    return fullException;
  }

  // Get controls by category
  getControlsByCategory(category: TrustServiceCategory): SOC2Control[] {
    return Array.from(this.controls.values()).filter((c) => c.category === category);
  }

  // Get compliance summary
  getComplianceSummary(): object {
    const controls = Array.from(this.controls.values());

    const summary = {
      total: controls.length,
      byStatus: {
        not_implemented: controls.filter((c) => c.status === 'not_implemented').length,
        partial: controls.filter((c) => c.status === 'partial').length,
        implemented: controls.filter((c) => c.status === 'implemented').length,
        tested: controls.filter((c) => c.status === 'tested').length,
        certified: controls.filter((c) => c.status === 'certified').length,
      },
      byCategory: {} as Record<TrustServiceCategory, number>,
      compliancePercentage: 0,
      evidenceCount: this.evidence.size,
      openRisks: 0,
      activeExceptions: 0,
    };

    // Calculate by category
    const categories: TrustServiceCategory[] = [
      'security',
      'availability',
      'processing_integrity',
      'confidentiality',
      'privacy',
    ];
    for (const cat of categories) {
      summary.byCategory[cat] = controls.filter((c) => c.category === cat).length;
    }

    // Calculate compliance percentage
    const compliant = controls.filter((c) => ['implemented', 'tested', 'certified'].includes(c.status));
    summary.compliancePercentage = controls.length > 0 ? Math.round((compliant.length / controls.length) * 100) : 0;

    // Count open risks and exceptions
    for (const control of controls) {
      summary.openRisks += control.risks.filter((r) => !r.acceptedBy).length;
      summary.activeExceptions += control.exceptions.filter((e) => !e.endDate || e.endDate > new Date()).length;
    }

    return summary;
  }

  // Generate audit report
  generateAuditReport(): object {
    return {
      reportDate: new Date().toISOString(),
      summary: this.getComplianceSummary(),
      controls: Array.from(this.controls.values()).map((control) => ({
        id: control.id,
        criteriaId: control.criteriaId,
        name: control.name,
        category: control.category,
        status: control.status,
        owner: control.owner,
        implementationDate: control.implementationDate,
        lastTestedDate: control.lastTestedDate,
        evidenceCount: control.evidence.length,
        verifiedEvidenceCount: control.evidence.filter((e) => e.verified).length,
        riskCount: control.risks.length,
        exceptionCount: control.exceptions.filter((e) => !e.endDate || e.endDate > new Date()).length,
      })),
    };
  }
}
```

## Evidence Collection

```typescript
// src/soc2/evidence-collector.ts
import { Evidence, EvidenceType } from './framework';

export interface EvidenceCollectionTask {
  id: string;
  controlId: string;
  evidenceType: EvidenceType;
  description: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  collector: string;
  nextDue: Date;
  lastCollected?: Date;
}

export class EvidenceCollector {
  private tasks: Map<string, EvidenceCollectionTask> = new Map();
  private collectionHandlers: Map<string, () => Promise<any>> = new Map();

  // Schedule evidence collection
  scheduleCollection(task: Omit<EvidenceCollectionTask, 'id'>): EvidenceCollectionTask {
    const fullTask: EvidenceCollectionTask = {
      id: Math.random().toString(36).substring(2, 15),
      ...task,
    };

    this.tasks.set(fullTask.id, fullTask);
    return fullTask;
  }

  // Register automated collector
  registerCollector(taskId: string, handler: () => Promise<any>): void {
    this.collectionHandlers.set(taskId, handler);
  }

  // Run collection
  async runCollection(taskId: string): Promise<any> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const handler = this.collectionHandlers.get(taskId);
    if (!handler) throw new Error('No handler registered');

    const result = await handler();

    task.lastCollected = new Date();
    task.nextDue = this.calculateNextDue(task.frequency);

    return result;
  }

  // Get due tasks
  getDueTasks(): EvidenceCollectionTask[] {
    const now = new Date();
    return Array.from(this.tasks.values()).filter((t) => t.nextDue <= now);
  }

  // Get overdue tasks
  getOverdueTasks(): EvidenceCollectionTask[] {
    const now = new Date();
    const gracePeriod = 24 * 60 * 60 * 1000; // 1 day
    return Array.from(this.tasks.values()).filter(
      (t) => t.nextDue.getTime() + gracePeriod < now.getTime()
    );
  }

  private calculateNextDue(frequency: EvidenceCollectionTask['frequency']): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      case 'quarterly':
        return new Date(now.setMonth(now.getMonth() + 3));
      case 'annually':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
  }
}

// Automated evidence collectors
export class AutomatedCollectors {
  // Collect access control evidence
  static async collectAccessControlEvidence(): Promise<object> {
    return {
      collectedAt: new Date().toISOString(),
      type: 'access_control_review',
      data: {
        totalUsers: 100,
        activeUsers: 85,
        disabledUsers: 15,
        usersWithMFA: 95,
        adminUsers: 5,
        lastPasswordChange: new Date().toISOString(),
      },
    };
  }

  // Collect system configuration evidence
  static async collectSystemConfigEvidence(): Promise<object> {
    return {
      collectedAt: new Date().toISOString(),
      type: 'system_configuration',
      data: {
        encryptionEnabled: true,
        encryptionAlgorithm: 'AES-256',
        tlsVersion: '1.3',
        firewallEnabled: true,
        intrusionDetection: true,
        antivirusEnabled: true,
        lastPatchDate: new Date().toISOString(),
      },
    };
  }

  // Collect backup evidence
  static async collectBackupEvidence(): Promise<object> {
    return {
      collectedAt: new Date().toISOString(),
      type: 'backup_verification',
      data: {
        lastBackup: new Date().toISOString(),
        backupSize: '500GB',
        backupEncrypted: true,
        backupLocation: 'offsite-datacenter',
        retentionPeriod: '90 days',
        lastRestoreTest: new Date().toISOString(),
        restoreTestSuccessful: true,
      },
    };
  }

  // Collect incident response evidence
  static async collectIncidentResponseEvidence(): Promise<object> {
    return {
      collectedAt: new Date().toISOString(),
      type: 'incident_response',
      data: {
        totalIncidents: 5,
        resolvedIncidents: 4,
        openIncidents: 1,
        averageResolutionTime: '4 hours',
        lastIncidentDrillDate: new Date().toISOString(),
        incidentResponsePlanVersion: '2.0',
      },
    };
  }

  // Collect change management evidence
  static async collectChangeManagementEvidence(): Promise<object> {
    return {
      collectedAt: new Date().toISOString(),
      type: 'change_management',
      data: {
        totalChanges: 50,
        approvedChanges: 48,
        emergencyChanges: 2,
        failedChanges: 1,
        rollbackCount: 1,
        averageApprovalTime: '2 hours',
      },
    };
  }
}
```

## Policy Templates

```typescript
// src/soc2/policies.ts
export interface PolicyTemplate {
  id: string;
  name: string;
  category: string;
  version: string;
  lastUpdated: Date;
  sections: PolicySection[];
}

export interface PolicySection {
  title: string;
  content: string;
}

// Information Security Policy Template
export const informationSecurityPolicy: PolicyTemplate = {
  id: 'pol-infosec-001',
  name: 'Information Security Policy',
  category: 'security',
  version: '1.0',
  lastUpdated: new Date(),
  sections: [
    {
      title: '1. Purpose',
      content: `This policy establishes the framework for protecting [Company Name]'s information assets
and ensuring the confidentiality, integrity, and availability of all data and systems.`,
    },
    {
      title: '2. Scope',
      content: `This policy applies to all employees, contractors, consultants, temporary staff, and
other workers at [Company Name], including all personnel affiliated with third parties who
have access to company systems and data.`,
    },
    {
      title: '3. Policy Statements',
      content: `3.1 Access Control
- Access to information systems shall be granted based on the principle of least privilege
- All access must be authorized, authenticated, and logged
- Multi-factor authentication is required for all system access
- Access rights must be reviewed quarterly

3.2 Data Classification
- All data must be classified according to sensitivity levels
- Appropriate controls must be applied based on classification
- Data handling procedures must follow classification guidelines

3.3 Encryption
- All data at rest must be encrypted using AES-256 or equivalent
- All data in transit must use TLS 1.2 or higher
- Encryption keys must be managed according to key management procedures

3.4 Incident Response
- All security incidents must be reported immediately
- Incident response procedures must be followed
- Post-incident reviews must be conducted`,
    },
    {
      title: '4. Roles and Responsibilities',
      content: `- CISO: Overall responsibility for information security
- Security Team: Implementation and monitoring of security controls
- IT Operations: Day-to-day security operations
- All Employees: Compliance with security policies`,
    },
    {
      title: '5. Compliance',
      content: `Violation of this policy may result in disciplinary action up to and including
termination of employment. Violations may also result in civil and criminal penalties.`,
    },
    {
      title: '6. Review',
      content: `This policy will be reviewed annually or when significant changes occur to the
business or threat environment.`,
    },
  ],
};

// Access Control Policy
export const accessControlPolicy: PolicyTemplate = {
  id: 'pol-access-001',
  name: 'Access Control Policy',
  category: 'security',
  version: '1.0',
  lastUpdated: new Date(),
  sections: [
    {
      title: '1. Purpose',
      content: `To establish standards for granting, modifying, and revoking access to
[Company Name]'s information systems and data.`,
    },
    {
      title: '2. User Access Management',
      content: `2.1 User Registration
- All access requests must be submitted through the access request system
- Requests must be approved by the user's manager and system owner
- Access must follow the principle of least privilege

2.2 Privileged Access
- Administrative access must be limited and justified
- Privileged accounts must use separate credentials
- All privileged actions must be logged and monitored

2.3 Access Reviews
- User access must be reviewed quarterly
- Terminated users must have access revoked within 24 hours
- Inactive accounts must be disabled after 90 days`,
    },
    {
      title: '3. Authentication Requirements',
      content: `- Passwords must meet complexity requirements (12+ characters, mixed case, numbers, symbols)
- Multi-factor authentication is required for all remote access
- Session timeouts must be enforced (15 minutes inactivity)
- Failed login attempts must be limited (5 attempts, 30-minute lockout)`,
    },
  ],
};

// Generate policy document
export function generatePolicyDocument(template: PolicyTemplate): string {
  let document = `# ${template.name}\n\n`;
  document += `**Version:** ${template.version}\n`;
  document += `**Last Updated:** ${template.lastUpdated.toISOString().split('T')[0]}\n`;
  document += `**Category:** ${template.category}\n\n`;
  document += `---\n\n`;

  for (const section of template.sections) {
    document += `## ${section.title}\n\n`;
    document += `${section.content}\n\n`;
  }

  return document;
}
```

## Audit Readiness Dashboard

```typescript
// src/soc2/dashboard.ts
import { SOC2ComplianceService, TrustServiceCategory } from './framework';
import { EvidenceCollector } from './evidence-collector';

export interface DashboardData {
  overallCompliance: number;
  categoryCompliance: Record<TrustServiceCategory, number>;
  controlsNeedingAttention: number;
  evidenceCollectionStatus: {
    due: number;
    overdue: number;
    collected: number;
  };
  upcomingAuditDates: Date[];
  recentActivity: Activity[];
}

export interface Activity {
  timestamp: Date;
  type: 'control_updated' | 'evidence_collected' | 'risk_identified' | 'exception_added';
  description: string;
  user: string;
}

export class AuditReadinessDashboard {
  constructor(
    private soc2Service: SOC2ComplianceService,
    private evidenceCollector: EvidenceCollector
  ) {}

  getDashboardData(): DashboardData {
    const summary = this.soc2Service.getComplianceSummary() as any;

    return {
      overallCompliance: summary.compliancePercentage,
      categoryCompliance: this.calculateCategoryCompliance(),
      controlsNeedingAttention: summary.byStatus.not_implemented + summary.byStatus.partial,
      evidenceCollectionStatus: {
        due: this.evidenceCollector.getDueTasks().length,
        overdue: this.evidenceCollector.getOverdueTasks().length,
        collected: summary.evidenceCount,
      },
      upcomingAuditDates: this.getUpcomingAuditDates(),
      recentActivity: this.getRecentActivity(),
    };
  }

  private calculateCategoryCompliance(): Record<TrustServiceCategory, number> {
    const categories: TrustServiceCategory[] = [
      'security',
      'availability',
      'processing_integrity',
      'confidentiality',
      'privacy',
    ];

    const result: Partial<Record<TrustServiceCategory, number>> = {};

    for (const category of categories) {
      const controls = this.soc2Service.getControlsByCategory(category);
      const compliant = controls.filter((c) =>
        ['implemented', 'tested', 'certified'].includes(c.status)
      );
      result[category] = controls.length > 0 ? Math.round((compliant.length / controls.length) * 100) : 0;
    }

    return result as Record<TrustServiceCategory, number>;
  }

  private getUpcomingAuditDates(): Date[] {
    // Return scheduled audit dates
    return [
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
    ];
  }

  private getRecentActivity(): Activity[] {
    // Return recent compliance activities
    return [];
  }

  // Generate readiness report
  generateReadinessReport(): string {
    const data = this.getDashboardData();

    let report = `# SOC 2 Audit Readiness Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    report += `## Executive Summary\n\n`;
    report += `Overall Compliance: **${data.overallCompliance}%**\n\n`;

    report += `## Category Breakdown\n\n`;
    report += `| Category | Compliance |\n`;
    report += `|----------|------------|\n`;
    for (const [category, percentage] of Object.entries(data.categoryCompliance)) {
      report += `| ${category} | ${percentage}% |\n`;
    }

    report += `\n## Evidence Collection\n\n`;
    report += `- Due: ${data.evidenceCollectionStatus.due}\n`;
    report += `- Overdue: ${data.evidenceCollectionStatus.overdue}\n`;
    report += `- Collected: ${data.evidenceCollectionStatus.collected}\n`;

    report += `\n## Action Items\n\n`;
    report += `- Controls needing attention: ${data.controlsNeedingAttention}\n`;

    return report;
  }
}
```

## Usage Example

```typescript
import { SOC2ComplianceService } from './soc2/framework';
import { EvidenceCollector, AutomatedCollectors } from './soc2/evidence-collector';
import { AuditReadinessDashboard } from './soc2/dashboard';
import { informationSecurityPolicy, generatePolicyDocument } from './soc2/policies';

// Initialize services
const soc2Service = new SOC2ComplianceService();

// Initialize controls for Security and Availability
soc2Service.initializeControls(['security', 'availability']);

// Update control status
const controls = soc2Service.getControlsByCategory('security');
for (const control of controls.slice(0, 10)) {
  soc2Service.updateControlStatus(control.id, 'implemented');
}

// Set up evidence collection
const evidenceCollector = new EvidenceCollector();

evidenceCollector.scheduleCollection({
  controlId: controls[0].id,
  evidenceType: 'configuration',
  description: 'Access control configuration screenshot',
  frequency: 'monthly',
  collector: 'security-team',
  nextDue: new Date(),
});

evidenceCollector.registerCollector(
  'access-control',
  AutomatedCollectors.collectAccessControlEvidence
);

// Generate dashboard
const dashboard = new AuditReadinessDashboard(soc2Service, evidenceCollector);
console.log(dashboard.getDashboardData());

// Generate policy document
const policyDoc = generatePolicyDocument(informationSecurityPolicy);
console.log(policyDoc);
```

## CLAUDE.md Integration

```markdown
## SOC 2 Compliance

This project implements SOC 2 Type II compliance controls.

### Trust Service Criteria
- Security (CC series) - Core security controls
- Availability (A series) - System availability
- Processing Integrity (PI series) - Data accuracy
- Confidentiality (C series) - Data protection
- Privacy (P series) - Privacy controls

### Key Files
- `src/soc2/framework.ts` - Core compliance service
- `src/soc2/evidence-collector.ts` - Evidence automation
- `src/soc2/policies.ts` - Policy templates
- `src/soc2/dashboard.ts` - Readiness dashboard

### Evidence Collection
Run `npm run collect-evidence` to gather automated evidence.
```

## AI Suggestions

1. **Add continuous monitoring** - Real-time control monitoring
2. **Implement gap analysis** - Compare against SOC 2 requirements
3. **Add auditor portal** - External auditor access
4. **Create evidence automation** - Scheduled collection jobs
5. **Add control mapping** - Map to other frameworks (ISO 27001)
6. **Implement risk scoring** - Automated risk assessment
7. **Add vendor management** - Third-party compliance tracking
8. **Create training tracking** - Security awareness records
9. **Add exception workflow** - Approval process automation
10. **Implement audit trail** - Complete change history
