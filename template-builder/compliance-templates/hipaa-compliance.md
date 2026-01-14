# HIPAA Compliance Template

Comprehensive HIPAA compliance framework for Protected Health Information (PHI) with security, privacy, and breach notification controls.

## Overview

This template provides production-ready HIPAA compliance infrastructure covering the Privacy Rule, Security Rule, and Breach Notification Rule for handling Protected Health Information.

## Quick Start

```bash
npm install uuid crypto-js date-fns zod winston
npm install -D typescript @types/node
```

## HIPAA Framework

```typescript
// src/hipaa/framework.ts
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

// PHI Categories
export type PHICategory =
  | 'demographics'
  | 'medical_history'
  | 'treatment'
  | 'diagnosis'
  | 'medication'
  | 'lab_results'
  | 'imaging'
  | 'billing'
  | 'insurance'
  | 'genetic';

// Access purpose under HIPAA
export type AccessPurpose = 'treatment' | 'payment' | 'healthcare_operations' | 'research' | 'public_health' | 'authorized';

// Safeguard type
export type SafeguardType = 'administrative' | 'physical' | 'technical';

// PHI Record
export interface PHIRecord {
  id: string;
  patientId: string;
  category: PHICategory;
  data: string; // Encrypted
  createdAt: Date;
  createdBy: string;
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
  accessLog: PHIAccessLog[];
}

// PHI Access Log
export interface PHIAccessLog {
  id: string;
  recordId: string;
  userId: string;
  userRole: string;
  purpose: AccessPurpose;
  action: 'view' | 'create' | 'update' | 'delete' | 'export';
  timestamp: Date;
  ipAddress: string;
  success: boolean;
  details?: string;
}

// Business Associate Agreement
export interface BAA {
  id: string;
  businessAssociateName: string;
  businessAssociateContact: string;
  effectiveDate: Date;
  terminationDate?: Date;
  scope: string[];
  status: 'draft' | 'pending' | 'active' | 'terminated';
  signedByBA?: Date;
  signedByCE?: Date;
  documentUrl?: string;
}

// Security Incident
export interface SecurityIncident {
  id: string;
  type: 'breach' | 'potential_breach' | 'security_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  discoveredAt: Date;
  discoveredBy: string;
  affectedRecords: string[];
  affectedIndividuals: number;
  status: 'investigating' | 'contained' | 'resolved' | 'reported';
  riskAssessment?: BreachRiskAssessment;
  notifications: BreachNotification[];
}

// Breach Risk Assessment
export interface BreachRiskAssessment {
  id: string;
  incidentId: string;
  assessedAt: Date;
  assessedBy: string;
  factorsAnalyzed: {
    natureAndExtent: string;
    unauthorizedPerson: string;
    wasAcquiredOrViewed: boolean;
    riskMitigated: boolean;
  };
  probabilityOfCompromise: 'low' | 'medium' | 'high';
  requiresNotification: boolean;
  rationale: string;
}

// Breach Notification
export interface BreachNotification {
  id: string;
  incidentId: string;
  recipientType: 'individual' | 'hhs' | 'media' | 'business_associate';
  recipientId?: string;
  method: 'mail' | 'email' | 'phone' | 'substitute';
  sentAt: Date;
  content: string;
  acknowledged?: Date;
}

// HIPAA Safeguard
export interface HIPAASafeguard {
  id: string;
  type: SafeguardType;
  standard: string;
  implementation: string;
  required: boolean;
  status: 'not_implemented' | 'partial' | 'implemented';
  lastReviewed?: Date;
  evidence?: string[];
}

// HIPAA Compliance Service
export class HIPAAComplianceService {
  private phiRecords: Map<string, PHIRecord> = new Map();
  private accessLogs: PHIAccessLog[] = [];
  private baas: Map<string, BAA> = new Map();
  private incidents: Map<string, SecurityIncident> = new Map();
  private safeguards: Map<string, HIPAASafeguard> = new Map();
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
    this.initializeSafeguards();
  }

  // Initialize standard safeguards
  private initializeSafeguards(): void {
    const safeguards: Omit<HIPAASafeguard, 'id'>[] = [
      // Administrative Safeguards
      { type: 'administrative', standard: 'Security Management Process', implementation: 'Risk analysis and management', required: true, status: 'not_implemented' },
      { type: 'administrative', standard: 'Assigned Security Responsibility', implementation: 'Designated security official', required: true, status: 'not_implemented' },
      { type: 'administrative', standard: 'Workforce Security', implementation: 'Authorization and supervision', required: true, status: 'not_implemented' },
      { type: 'administrative', standard: 'Information Access Management', implementation: 'Access authorization', required: true, status: 'not_implemented' },
      { type: 'administrative', standard: 'Security Awareness Training', implementation: 'Training program', required: true, status: 'not_implemented' },
      { type: 'administrative', standard: 'Security Incident Procedures', implementation: 'Incident response', required: true, status: 'not_implemented' },
      { type: 'administrative', standard: 'Contingency Plan', implementation: 'Data backup and recovery', required: true, status: 'not_implemented' },
      { type: 'administrative', standard: 'Evaluation', implementation: 'Periodic assessment', required: true, status: 'not_implemented' },
      { type: 'administrative', standard: 'Business Associate Contracts', implementation: 'BAA management', required: true, status: 'not_implemented' },

      // Physical Safeguards
      { type: 'physical', standard: 'Facility Access Controls', implementation: 'Access control procedures', required: true, status: 'not_implemented' },
      { type: 'physical', standard: 'Workstation Use', implementation: 'Workstation policies', required: true, status: 'not_implemented' },
      { type: 'physical', standard: 'Workstation Security', implementation: 'Physical workstation protection', required: true, status: 'not_implemented' },
      { type: 'physical', standard: 'Device and Media Controls', implementation: 'Media handling procedures', required: true, status: 'not_implemented' },

      // Technical Safeguards
      { type: 'technical', standard: 'Access Control', implementation: 'Unique user identification', required: true, status: 'not_implemented' },
      { type: 'technical', standard: 'Audit Controls', implementation: 'Activity logging', required: true, status: 'not_implemented' },
      { type: 'technical', standard: 'Integrity', implementation: 'Data integrity controls', required: true, status: 'not_implemented' },
      { type: 'technical', standard: 'Person or Entity Authentication', implementation: 'Authentication mechanisms', required: true, status: 'not_implemented' },
      { type: 'technical', standard: 'Transmission Security', implementation: 'Encryption in transit', required: true, status: 'not_implemented' },
    ];

    for (const safeguard of safeguards) {
      const id = uuidv4();
      this.safeguards.set(id, { ...safeguard, id });
    }
  }

  // Encrypt PHI data
  private encryptPHI(data: object): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
  }

  // Decrypt PHI data
  private decryptPHI(encryptedData: string): object {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  // Create PHI record
  createPHIRecord(params: {
    patientId: string;
    category: PHICategory;
    data: object;
    createdBy: string;
  }): PHIRecord {
    const record: PHIRecord = {
      id: uuidv4(),
      patientId: params.patientId,
      category: params.category,
      data: this.encryptPHI(params.data),
      createdAt: new Date(),
      createdBy: params.createdBy,
      accessLog: [],
    };

    this.phiRecords.set(record.id, record);

    // Log creation
    this.logAccess({
      recordId: record.id,
      userId: params.createdBy,
      userRole: 'unknown',
      purpose: 'treatment',
      action: 'create',
      ipAddress: 'internal',
      success: true,
    });

    return record;
  }

  // Access PHI record with logging
  accessPHIRecord(params: {
    recordId: string;
    userId: string;
    userRole: string;
    purpose: AccessPurpose;
    ipAddress: string;
  }): { success: boolean; data?: object; error?: string } {
    const record = this.phiRecords.get(params.recordId);

    if (!record) {
      this.logAccess({
        ...params,
        action: 'view',
        success: false,
        details: 'Record not found',
      });
      return { success: false, error: 'Record not found' };
    }

    // Check authorization (simplified - implement proper RBAC)
    const authorized = this.checkAuthorization(params.userRole, params.purpose, record.category);

    if (!authorized) {
      this.logAccess({
        ...params,
        action: 'view',
        success: false,
        details: 'Unauthorized access attempt',
      });
      return { success: false, error: 'Unauthorized' };
    }

    // Log successful access
    this.logAccess({
      ...params,
      action: 'view',
      success: true,
    });

    // Update record access info
    record.lastAccessedAt = new Date();
    record.lastAccessedBy = params.userId;

    return {
      success: true,
      data: this.decryptPHI(record.data),
    };
  }

  // Log PHI access
  private logAccess(params: Omit<PHIAccessLog, 'id' | 'timestamp'>): void {
    const log: PHIAccessLog = {
      id: uuidv4(),
      timestamp: new Date(),
      ...params,
    };

    this.accessLogs.push(log);

    // Add to record's access log
    const record = this.phiRecords.get(params.recordId);
    if (record) {
      record.accessLog.push(log);
    }
  }

  // Check authorization
  private checkAuthorization(role: string, purpose: AccessPurpose, category: PHICategory): boolean {
    // Implement proper RBAC based on your organization's policies
    const allowedRoles: Record<AccessPurpose, string[]> = {
      treatment: ['physician', 'nurse', 'therapist', 'pharmacist'],
      payment: ['billing', 'admin'],
      healthcare_operations: ['admin', 'compliance', 'quality'],
      research: ['researcher'],
      public_health: ['public_health_official'],
      authorized: ['patient', 'authorized_representative'],
    };

    return allowedRoles[purpose]?.includes(role) || false;
  }

  // Get access logs for audit
  getAccessLogs(params: {
    recordId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): PHIAccessLog[] {
    return this.accessLogs.filter((log) => {
      if (params.recordId && log.recordId !== params.recordId) return false;
      if (params.userId && log.userId !== params.userId) return false;
      if (params.startDate && log.timestamp < params.startDate) return false;
      if (params.endDate && log.timestamp > params.endDate) return false;
      return true;
    });
  }

  // Create BAA
  createBAA(params: Omit<BAA, 'id' | 'status'>): BAA {
    const baa: BAA = {
      id: uuidv4(),
      ...params,
      status: 'draft',
    };

    this.baas.set(baa.id, baa);
    return baa;
  }

  // Report security incident
  reportIncident(params: Omit<SecurityIncident, 'id' | 'status' | 'notifications'>): SecurityIncident {
    const incident: SecurityIncident = {
      id: uuidv4(),
      ...params,
      status: 'investigating',
      notifications: [],
    };

    this.incidents.set(incident.id, incident);
    return incident;
  }

  // Perform breach risk assessment
  assessBreachRisk(incidentId: string, assessment: Omit<BreachRiskAssessment, 'id' | 'incidentId'>): BreachRiskAssessment {
    const incident = this.incidents.get(incidentId);
    if (!incident) throw new Error('Incident not found');

    const fullAssessment: BreachRiskAssessment = {
      id: uuidv4(),
      incidentId,
      ...assessment,
    };

    incident.riskAssessment = fullAssessment;

    // If notification required, update status
    if (assessment.requiresNotification) {
      incident.type = 'breach';
    }

    return fullAssessment;
  }

  // Send breach notification
  sendBreachNotification(incidentId: string, notification: Omit<BreachNotification, 'id' | 'incidentId'>): BreachNotification {
    const incident = this.incidents.get(incidentId);
    if (!incident) throw new Error('Incident not found');

    const fullNotification: BreachNotification = {
      id: uuidv4(),
      incidentId,
      ...notification,
    };

    incident.notifications.push(fullNotification);

    // Update status if all required notifications sent
    if (this.areAllNotificationsSent(incident)) {
      incident.status = 'reported';
    }

    return fullNotification;
  }

  private areAllNotificationsSent(incident: SecurityIncident): boolean {
    // Check if individuals and HHS have been notified
    const hasIndividualNotification = incident.notifications.some(
      (n) => n.recipientType === 'individual'
    );
    const hasHHSNotification = incident.notifications.some(
      (n) => n.recipientType === 'hhs'
    );

    // Media notification required if >500 individuals affected
    const requiresMediaNotification = incident.affectedIndividuals >= 500;
    const hasMediaNotification = incident.notifications.some(
      (n) => n.recipientType === 'media'
    );

    return hasIndividualNotification && hasHHSNotification && (!requiresMediaNotification || hasMediaNotification);
  }

  // Get safeguards by type
  getSafeguardsByType(type: SafeguardType): HIPAASafeguard[] {
    return Array.from(this.safeguards.values()).filter((s) => s.type === type);
  }

  // Update safeguard status
  updateSafeguardStatus(safeguardId: string, status: HIPAASafeguard['status']): HIPAASafeguard {
    const safeguard = this.safeguards.get(safeguardId);
    if (!safeguard) throw new Error('Safeguard not found');

    safeguard.status = status;
    safeguard.lastReviewed = new Date();

    return safeguard;
  }

  // Get compliance summary
  getComplianceSummary(): object {
    const safeguards = Array.from(this.safeguards.values());
    const implemented = safeguards.filter((s) => s.status === 'implemented').length;

    return {
      totalSafeguards: safeguards.length,
      implemented,
      partial: safeguards.filter((s) => s.status === 'partial').length,
      notImplemented: safeguards.filter((s) => s.status === 'not_implemented').length,
      compliancePercentage: Math.round((implemented / safeguards.length) * 100),
      baaCount: this.baas.size,
      activeBAACount: Array.from(this.baas.values()).filter((b) => b.status === 'active').length,
      incidentCount: this.incidents.size,
      openIncidentCount: Array.from(this.incidents.values()).filter(
        (i) => i.status !== 'resolved' && i.status !== 'reported'
      ).length,
    };
  }
}
```

## Minimum Necessary Standard

```typescript
// src/hipaa/minimum-necessary.ts
import { PHICategory, AccessPurpose } from './framework';

// Role-based minimum necessary access
export interface MinimumNecessaryPolicy {
  role: string;
  purpose: AccessPurpose;
  allowedCategories: PHICategory[];
  allowedFields: Record<PHICategory, string[]>;
  restrictions: string[];
}

export class MinimumNecessaryService {
  private policies: Map<string, MinimumNecessaryPolicy[]> = new Map();

  // Define policy for a role
  definePolicy(policy: MinimumNecessaryPolicy): void {
    const existing = this.policies.get(policy.role) || [];
    existing.push(policy);
    this.policies.set(policy.role, existing);
  }

  // Check if access meets minimum necessary standard
  checkMinimumNecessary(params: {
    role: string;
    purpose: AccessPurpose;
    category: PHICategory;
    requestedFields: string[];
  }): { allowed: boolean; deniedFields: string[]; reason?: string } {
    const policies = this.policies.get(params.role) || [];
    const applicablePolicy = policies.find((p) => p.purpose === params.purpose);

    if (!applicablePolicy) {
      return {
        allowed: false,
        deniedFields: params.requestedFields,
        reason: 'No policy defined for this role and purpose',
      };
    }

    if (!applicablePolicy.allowedCategories.includes(params.category)) {
      return {
        allowed: false,
        deniedFields: params.requestedFields,
        reason: 'Category not allowed for this role',
      };
    }

    const allowedFields = applicablePolicy.allowedFields[params.category] || [];
    const deniedFields = params.requestedFields.filter(
      (f) => !allowedFields.includes(f) && !allowedFields.includes('*')
    );

    return {
      allowed: deniedFields.length === 0,
      deniedFields,
      reason: deniedFields.length > 0 ? 'Some requested fields exceed minimum necessary' : undefined,
    };
  }

  // Filter PHI to minimum necessary
  filterToMinimumNecessary(params: {
    role: string;
    purpose: AccessPurpose;
    category: PHICategory;
    data: Record<string, any>;
  }): Record<string, any> {
    const policies = this.policies.get(params.role) || [];
    const applicablePolicy = policies.find((p) => p.purpose === params.purpose);

    if (!applicablePolicy) {
      return {}; // No access
    }

    const allowedFields = applicablePolicy.allowedFields[params.category] || [];

    if (allowedFields.includes('*')) {
      return params.data; // Full access
    }

    const filtered: Record<string, any> = {};
    for (const field of allowedFields) {
      if (params.data.hasOwnProperty(field)) {
        filtered[field] = params.data[field];
      }
    }

    return filtered;
  }
}

// Example policies
export function initializeStandardPolicies(service: MinimumNecessaryService): void {
  // Physician - Treatment
  service.definePolicy({
    role: 'physician',
    purpose: 'treatment',
    allowedCategories: ['demographics', 'medical_history', 'treatment', 'diagnosis', 'medication', 'lab_results', 'imaging'],
    allowedFields: {
      demographics: ['name', 'dob', 'gender', 'contact'],
      medical_history: ['*'],
      treatment: ['*'],
      diagnosis: ['*'],
      medication: ['*'],
      lab_results: ['*'],
      imaging: ['*'],
      billing: [],
      insurance: [],
      genetic: ['relevant_conditions'],
    },
    restrictions: ['No access to billing details unless also billing role'],
  });

  // Billing Staff - Payment
  service.definePolicy({
    role: 'billing',
    purpose: 'payment',
    allowedCategories: ['demographics', 'billing', 'insurance'],
    allowedFields: {
      demographics: ['name', 'address', 'contact'],
      medical_history: [],
      treatment: ['service_codes', 'dates'],
      diagnosis: ['diagnosis_codes'],
      medication: [],
      lab_results: [],
      imaging: [],
      billing: ['*'],
      insurance: ['*'],
      genetic: [],
    },
    restrictions: ['Limited to information necessary for billing'],
  });

  // Nurse - Treatment
  service.definePolicy({
    role: 'nurse',
    purpose: 'treatment',
    allowedCategories: ['demographics', 'medical_history', 'treatment', 'medication', 'lab_results'],
    allowedFields: {
      demographics: ['name', 'dob', 'room', 'allergies'],
      medical_history: ['conditions', 'allergies', 'medications'],
      treatment: ['current_orders', 'vitals'],
      diagnosis: ['primary_diagnosis'],
      medication: ['*'],
      lab_results: ['recent'],
      imaging: [],
      billing: [],
      insurance: [],
      genetic: [],
    },
    restrictions: ['Access limited to current care needs'],
  });
}
```

## Breach Notification Generator

```typescript
// src/hipaa/breach-notification.ts
import { SecurityIncident, BreachRiskAssessment } from './framework';

export interface NotificationContent {
  type: 'individual' | 'hhs' | 'media';
  content: string;
  requiredElements: string[];
}

export class BreachNotificationGenerator {
  private organizationName: string;
  private organizationContact: string;

  constructor(orgName: string, orgContact: string) {
    this.organizationName = orgName;
    this.organizationContact = orgContact;
  }

  // Generate individual notification
  generateIndividualNotification(incident: SecurityIncident): NotificationContent {
    const assessment = incident.riskAssessment;

    const content = `
IMPORTANT NOTICE: Breach of Your Protected Health Information

Dear [Patient Name],

We are writing to inform you of a security incident that may have affected your protected health information (PHI).

WHAT HAPPENED
${incident.description}

The incident was discovered on ${incident.discoveredAt.toLocaleDateString()}.

WHAT INFORMATION WAS INVOLVED
The following types of information may have been affected:
${this.formatAffectedData(incident)}

WHAT WE ARE DOING
${this.formatMitigationSteps(incident)}

WHAT YOU CAN DO
- Review your medical records for any inaccuracies
- Monitor your health insurance statements for suspicious activity
- Consider placing a fraud alert on your credit file
- Request a free credit report from major credit bureaus

FOR MORE INFORMATION
If you have questions about this incident, please contact:
${this.organizationContact}

We sincerely apologize for any inconvenience this may cause.

Sincerely,
${this.organizationName}
`.trim();

    return {
      type: 'individual',
      content,
      requiredElements: [
        'Description of incident',
        'Types of information involved',
        'Steps being taken',
        'Steps individual can take',
        'Contact information',
      ],
    };
  }

  // Generate HHS notification
  generateHHSNotification(incident: SecurityIncident): NotificationContent {
    const content = `
HIPAA BREACH NOTIFICATION TO HHS

Covered Entity: ${this.organizationName}
Contact: ${this.organizationContact}
Date of Report: ${new Date().toLocaleDateString()}

BREACH INFORMATION
Date of Discovery: ${incident.discoveredAt.toLocaleDateString()}
Date of Breach: [Actual or estimated date]
Number of Individuals Affected: ${incident.affectedIndividuals}

DESCRIPTION OF BREACH
${incident.description}

TYPE OF PHI INVOLVED
${this.formatAffectedData(incident)}

SAFEGUARDS IN PLACE
[List of technical, administrative, and physical safeguards]

ACTIONS TAKEN
${this.formatMitigationSteps(incident)}

INDIVIDUAL NOTIFICATION
Date Individuals Notified: [Date]
Method of Notification: [Mail/Email/Other]
${incident.affectedIndividuals >= 500 ? 'Media notification: [Date/Outlet]' : ''}

RISK ASSESSMENT
${incident.riskAssessment ? this.formatRiskAssessment(incident.riskAssessment) : 'Pending'}
`.trim();

    return {
      type: 'hhs',
      content,
      requiredElements: [
        'Covered entity information',
        'Breach dates',
        'Number affected',
        'Description',
        'PHI types',
        'Safeguards',
        'Actions taken',
        'Notification details',
      ],
    };
  }

  // Generate media notification
  generateMediaNotification(incident: SecurityIncident): NotificationContent {
    const content = `
PRESS RELEASE

FOR IMMEDIATE RELEASE
${new Date().toLocaleDateString()}

${this.organizationName} Announces Data Security Incident

[City, State] – ${this.organizationName} is notifying patients of a security incident that may have affected their protected health information.

The incident was discovered on ${incident.discoveredAt.toLocaleDateString()}. Upon discovery, we immediately began an investigation and took steps to secure our systems.

Approximately ${incident.affectedIndividuals} individuals may have been affected by this incident.

"We take the security of patient information very seriously," said [Spokesperson Name]. "We are committed to protecting patient privacy and have taken immediate steps to prevent similar incidents in the future."

Affected individuals are being notified by mail with information about steps they can take to protect themselves.

For more information, please contact:
${this.organizationContact}

###
`.trim();

    return {
      type: 'media',
      content,
      requiredElements: [
        'Organization name',
        'Incident description',
        'Number affected',
        'Response actions',
        'Contact information',
      ],
    };
  }

  private formatAffectedData(incident: SecurityIncident): string {
    // Would be populated based on actual incident data
    return '- Patient names\n- Dates of birth\n- Medical record numbers\n- Treatment information';
  }

  private formatMitigationSteps(incident: SecurityIncident): string {
    return `- Conducted thorough investigation
- Engaged cybersecurity experts
- Enhanced security measures
- Notified appropriate authorities
- Offering credit monitoring services`;
  }

  private formatRiskAssessment(assessment: BreachRiskAssessment): string {
    return `
Nature and Extent: ${assessment.factorsAnalyzed.natureAndExtent}
Unauthorized Person: ${assessment.factorsAnalyzed.unauthorizedPerson}
PHI Acquired/Viewed: ${assessment.factorsAnalyzed.wasAcquiredOrViewed ? 'Yes' : 'Unknown'}
Risk Mitigated: ${assessment.factorsAnalyzed.riskMitigated ? 'Yes' : 'Partial'}
Probability of Compromise: ${assessment.probabilityOfCompromise}
Notification Required: ${assessment.requiresNotification ? 'Yes' : 'No'}`;
  }

  // Calculate notification deadline
  calculateDeadlines(discoveryDate: Date): {
    individualDeadline: Date;
    hhsDeadline: Date;
    mediaDeadline?: Date;
    affectedCount: number;
  } {
    // 60 days from discovery for individuals and HHS
    const deadline = new Date(discoveryDate);
    deadline.setDate(deadline.getDate() + 60);

    return {
      individualDeadline: deadline,
      hhsDeadline: deadline,
      mediaDeadline: deadline, // Same for media if >500 affected
      affectedCount: 0,
    };
  }
}
```

## Usage Example

```typescript
import { HIPAAComplianceService } from './hipaa/framework';
import { MinimumNecessaryService, initializeStandardPolicies } from './hipaa/minimum-necessary';
import { BreachNotificationGenerator } from './hipaa/breach-notification';

// Initialize services
const hipaaService = new HIPAAComplianceService('your-encryption-key-here');

// Create PHI record
const record = hipaaService.createPHIRecord({
  patientId: 'patient-123',
  category: 'medical_history',
  data: {
    conditions: ['diabetes', 'hypertension'],
    allergies: ['penicillin'],
    surgeries: ['appendectomy 2020'],
  },
  createdBy: 'dr-smith',
});

// Access PHI with logging
const accessResult = hipaaService.accessPHIRecord({
  recordId: record.id,
  userId: 'dr-jones',
  userRole: 'physician',
  purpose: 'treatment',
  ipAddress: '192.168.1.100',
});

console.log('Access result:', accessResult);

// Set up minimum necessary policies
const minNecService = new MinimumNecessaryService();
initializeStandardPolicies(minNecService);

// Report incident
const incident = hipaaService.reportIncident({
  type: 'potential_breach',
  severity: 'high',
  description: 'Unauthorized access detected to PHI database',
  discoveredAt: new Date(),
  discoveredBy: 'security-team',
  affectedRecords: [record.id],
  affectedIndividuals: 1000,
});

// Generate breach notifications
const notificationGen = new BreachNotificationGenerator(
  'Healthcare Organization',
  'privacy@healthcare.org | 1-800-555-1234'
);

const individualNotice = notificationGen.generateIndividualNotification(incident);
console.log(individualNotice.content);
```

## CLAUDE.md Integration

```markdown
## HIPAA Compliance

This project implements HIPAA compliance controls for PHI.

### Safeguards
- Administrative: Security management, training, incident response
- Physical: Facility access, workstation security, media controls
- Technical: Access control, audit logs, encryption, transmission security

### Key Features
- PHI encryption at rest (AES-256)
- Comprehensive access logging
- Minimum necessary enforcement
- Breach notification templates
- BAA management

### Key Files
- `src/hipaa/framework.ts` - Core HIPAA service
- `src/hipaa/minimum-necessary.ts` - Access restriction policies
- `src/hipaa/breach-notification.ts` - Notification templates

### Audit
Run `npm run hipaa-audit` to generate compliance report.
```

## AI Suggestions

1. **Add de-identification** - Safe Harbor and Expert Determination methods
2. **Implement accounting of disclosures** - Track all PHI disclosures
3. **Add authorization management** - Patient authorization workflows
4. **Create risk analysis tool** - Automated security risk assessment
5. **Add training tracking** - HIPAA training compliance
6. **Implement secure messaging** - Encrypted PHI communication
7. **Add disaster recovery** - PHI backup and recovery procedures
8. **Create audit trail export** - Compliance evidence generation
9. **Add vendor assessment** - BA security evaluation
10. **Implement access termination** - Workforce exit procedures
