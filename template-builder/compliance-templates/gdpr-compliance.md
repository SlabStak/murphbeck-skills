# GDPR Compliance Template

Comprehensive GDPR compliance implementation with data subject rights, consent management, and privacy controls.

## Overview

This template provides production-ready GDPR compliance infrastructure including consent management, data subject access requests (DSAR), right to erasure, data portability, and privacy-by-design patterns.

## Quick Start

```bash
npm install uuid crypto-js date-fns zod
npm install -D typescript @types/node
```

## Core Compliance Framework

```typescript
// src/gdpr/framework.ts
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Legal basis for processing
export type LegalBasis =
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interests';

// Data category classification
export type DataCategory =
  | 'personal'
  | 'sensitive'
  | 'biometric'
  | 'genetic'
  | 'health'
  | 'political'
  | 'religious'
  | 'trade_union'
  | 'sexual_orientation'
  | 'criminal';

// Processing purpose
export interface ProcessingPurpose {
  id: string;
  name: string;
  description: string;
  legalBasis: LegalBasis;
  dataCategories: DataCategory[];
  retentionPeriod: number; // days
  thirdPartySharing: boolean;
  crossBorderTransfer: boolean;
  automatedDecisionMaking: boolean;
}

// Consent record
export interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  purposeId: string;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  withdrawnAt?: Date;
  version: number;
}

// Data subject request
export interface DataSubjectRequest {
  id: string;
  dataSubjectId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'denied';
  submittedAt: Date;
  dueDate: Date;
  completedAt?: Date;
  notes?: string;
  responseData?: any;
}

// Personal data inventory item
export interface DataInventoryItem {
  id: string;
  dataSubjectId: string;
  category: DataCategory;
  fieldName: string;
  value: any;
  source: string;
  collectedAt: Date;
  lastUpdated: Date;
  purposes: string[];
  encrypted: boolean;
}

// GDPR compliance service
export class GDPRComplianceService {
  private purposes: Map<string, ProcessingPurpose> = new Map();
  private consents: Map<string, ConsentRecord[]> = new Map();
  private requests: Map<string, DataSubjectRequest> = new Map();
  private inventory: Map<string, DataInventoryItem[]> = new Map();

  // Register a processing purpose
  registerPurpose(purpose: Omit<ProcessingPurpose, 'id'>): ProcessingPurpose {
    const id = uuidv4();
    const fullPurpose = { ...purpose, id };
    this.purposes.set(id, fullPurpose);
    return fullPurpose;
  }

  // Get all purposes
  getPurposes(): ProcessingPurpose[] {
    return Array.from(this.purposes.values());
  }

  // Record consent
  recordConsent(params: {
    dataSubjectId: string;
    purposeId: string;
    granted: boolean;
    ipAddress?: string;
    userAgent?: string;
  }): ConsentRecord {
    const record: ConsentRecord = {
      id: uuidv4(),
      dataSubjectId: params.dataSubjectId,
      purposeId: params.purposeId,
      granted: params.granted,
      timestamp: new Date(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      version: 1,
    };

    const existing = this.consents.get(params.dataSubjectId) || [];

    // Increment version if updating existing consent
    const previousConsent = existing.find(c => c.purposeId === params.purposeId && !c.withdrawnAt);
    if (previousConsent) {
      record.version = previousConsent.version + 1;
    }

    existing.push(record);
    this.consents.set(params.dataSubjectId, existing);

    return record;
  }

  // Withdraw consent
  withdrawConsent(dataSubjectId: string, purposeId: string): ConsentRecord | null {
    const records = this.consents.get(dataSubjectId) || [];
    const activeConsent = records.find(
      (c) => c.purposeId === purposeId && c.granted && !c.withdrawnAt
    );

    if (activeConsent) {
      activeConsent.withdrawnAt = new Date();
      return activeConsent;
    }

    return null;
  }

  // Check if consent is valid
  hasValidConsent(dataSubjectId: string, purposeId: string): boolean {
    const records = this.consents.get(dataSubjectId) || [];
    return records.some(
      (c) => c.purposeId === purposeId && c.granted && !c.withdrawnAt
    );
  }

  // Get consent history
  getConsentHistory(dataSubjectId: string): ConsentRecord[] {
    return this.consents.get(dataSubjectId) || [];
  }

  // Submit data subject request
  submitRequest(params: {
    dataSubjectId: string;
    type: DataSubjectRequest['type'];
  }): DataSubjectRequest {
    const request: DataSubjectRequest = {
      id: uuidv4(),
      dataSubjectId: params.dataSubjectId,
      type: params.type,
      status: 'pending',
      submittedAt: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    this.requests.set(request.id, request);
    return request;
  }

  // Process data subject request
  async processRequest(
    requestId: string,
    processor: (request: DataSubjectRequest) => Promise<any>
  ): Promise<DataSubjectRequest> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    request.status = 'in_progress';

    try {
      request.responseData = await processor(request);
      request.status = 'completed';
      request.completedAt = new Date();
    } catch (error) {
      request.status = 'denied';
      request.notes = error instanceof Error ? error.message : 'Processing failed';
    }

    return request;
  }

  // Add data to inventory
  addToInventory(item: Omit<DataInventoryItem, 'id'>): DataInventoryItem {
    const fullItem: DataInventoryItem = { ...item, id: uuidv4() };
    const existing = this.inventory.get(item.dataSubjectId) || [];
    existing.push(fullItem);
    this.inventory.set(item.dataSubjectId, existing);
    return fullItem;
  }

  // Get data inventory for subject
  getDataInventory(dataSubjectId: string): DataInventoryItem[] {
    return this.inventory.get(dataSubjectId) || [];
  }

  // Delete data for subject (Right to Erasure)
  eraseData(dataSubjectId: string, purposeIds?: string[]): number {
    const items = this.inventory.get(dataSubjectId) || [];
    let deleted = 0;

    if (purposeIds) {
      const remaining = items.filter((item) => {
        const shouldDelete = item.purposes.some((p) => purposeIds.includes(p));
        if (shouldDelete) deleted++;
        return !shouldDelete;
      });
      this.inventory.set(dataSubjectId, remaining);
    } else {
      deleted = items.length;
      this.inventory.delete(dataSubjectId);
      this.consents.delete(dataSubjectId);
    }

    return deleted;
  }

  // Export data (Right to Portability)
  exportData(dataSubjectId: string): object {
    const inventory = this.getDataInventory(dataSubjectId);
    const consents = this.getConsentHistory(dataSubjectId);

    return {
      exportedAt: new Date().toISOString(),
      dataSubjectId,
      personalData: inventory.map((item) => ({
        category: item.category,
        field: item.fieldName,
        value: item.value,
        collectedAt: item.collectedAt,
        purposes: item.purposes,
      })),
      consentHistory: consents.map((c) => ({
        purpose: this.purposes.get(c.purposeId)?.name,
        granted: c.granted,
        timestamp: c.timestamp,
        withdrawn: c.withdrawnAt,
      })),
    };
  }
}
```

## Consent Management UI

```typescript
// src/gdpr/consent-manager.ts
export interface ConsentUIConfig {
  purposes: Array<{
    id: string;
    name: string;
    description: string;
    required: boolean;
  }>;
  privacyPolicyUrl: string;
  cookiePolicyUrl: string;
  brandName: string;
}

export class ConsentManager {
  private gdprService: GDPRComplianceService;
  private config: ConsentUIConfig;

  constructor(gdprService: GDPRComplianceService, config: ConsentUIConfig) {
    this.gdprService = gdprService;
    this.config = config;
  }

  // Generate consent banner HTML
  generateConsentBanner(): string {
    const purposeCheckboxes = this.config.purposes
      .map(
        (p) => `
        <div class="consent-purpose">
          <label>
            <input
              type="checkbox"
              name="consent_${p.id}"
              ${p.required ? 'checked disabled' : ''}
            />
            <strong>${p.name}</strong>
            ${p.required ? '<span class="required">(Required)</span>' : ''}
          </label>
          <p>${p.description}</p>
        </div>
      `
      )
      .join('');

    return `
      <div id="consent-banner" class="consent-banner">
        <div class="consent-content">
          <h2>Privacy Settings</h2>
          <p>
            We use cookies and similar technologies to provide our services.
            Please review and customize your privacy settings below.
          </p>

          <div class="consent-purposes">
            ${purposeCheckboxes}
          </div>

          <div class="consent-links">
            <a href="${this.config.privacyPolicyUrl}">Privacy Policy</a>
            <a href="${this.config.cookiePolicyUrl}">Cookie Policy</a>
          </div>

          <div class="consent-actions">
            <button id="consent-reject-all" class="btn-secondary">Reject All</button>
            <button id="consent-accept-selected" class="btn-primary">Accept Selected</button>
            <button id="consent-accept-all" class="btn-primary">Accept All</button>
          </div>
        </div>
      </div>
    `;
  }

  // Generate consent banner JavaScript
  generateConsentScript(): string {
    return `
      (function() {
        const banner = document.getElementById('consent-banner');
        const purposes = ${JSON.stringify(this.config.purposes)};

        function getConsents() {
          const consents = {};
          purposes.forEach(p => {
            const checkbox = document.querySelector(\`input[name="consent_\${p.id}"]\`);
            consents[p.id] = checkbox?.checked || false;
          });
          return consents;
        }

        function saveConsents(consents) {
          fetch('/api/consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consents, timestamp: new Date().toISOString() })
          }).then(() => {
            banner.style.display = 'none';
            document.cookie = 'consent_recorded=true; max-age=31536000; path=/';
          });
        }

        document.getElementById('consent-accept-all')?.addEventListener('click', () => {
          const consents = {};
          purposes.forEach(p => consents[p.id] = true);
          saveConsents(consents);
        });

        document.getElementById('consent-reject-all')?.addEventListener('click', () => {
          const consents = {};
          purposes.forEach(p => consents[p.id] = p.required);
          saveConsents(consents);
        });

        document.getElementById('consent-accept-selected')?.addEventListener('click', () => {
          saveConsents(getConsents());
        });

        // Check if consent already recorded
        if (document.cookie.includes('consent_recorded=true')) {
          banner.style.display = 'none';
        }
      })();
    `;
  }

  // Generate consent banner CSS
  generateConsentStyles(): string {
    return `
      .consent-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
        padding: 24px;
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .consent-content {
        max-width: 800px;
        margin: 0 auto;
      }

      .consent-content h2 {
        margin: 0 0 12px 0;
        font-size: 20px;
      }

      .consent-purposes {
        margin: 20px 0;
        max-height: 200px;
        overflow-y: auto;
      }

      .consent-purpose {
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        margin-bottom: 8px;
      }

      .consent-purpose label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .consent-purpose p {
        margin: 8px 0 0 24px;
        font-size: 14px;
        color: #666;
      }

      .required {
        font-size: 12px;
        color: #888;
      }

      .consent-links {
        margin: 16px 0;
      }

      .consent-links a {
        margin-right: 16px;
        color: #0066cc;
      }

      .consent-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .btn-primary, .btn-secondary {
        padding: 10px 20px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 14px;
      }

      .btn-primary {
        background: #0066cc;
        color: white;
      }

      .btn-secondary {
        background: #f0f0f0;
        color: #333;
      }
    `;
  }
}
```

## Data Subject Access Request (DSAR) Workflow

```typescript
// src/gdpr/dsar.ts
import { GDPRComplianceService, DataSubjectRequest } from './framework';

export interface DSARConfig {
  identityVerification: 'email' | 'id_document' | 'two_factor';
  responseFormat: 'json' | 'pdf' | 'both';
  notifyOnCompletion: boolean;
}

export class DSARWorkflow {
  private gdprService: GDPRComplianceService;
  private config: DSARConfig;

  constructor(gdprService: GDPRComplianceService, config: DSARConfig) {
    this.gdprService = gdprService;
    this.config = config;
  }

  // Initiate DSAR
  async initiate(params: {
    email: string;
    requestType: DataSubjectRequest['type'];
    details?: string;
  }): Promise<{ requestId: string; verificationRequired: boolean }> {
    // Create verification token
    const verificationToken = this.generateVerificationToken();

    // Send verification email
    await this.sendVerificationEmail(params.email, verificationToken);

    return {
      requestId: verificationToken,
      verificationRequired: true,
    };
  }

  // Verify identity and create request
  async verify(params: {
    token: string;
    verificationData: any;
  }): Promise<DataSubjectRequest> {
    // Verify identity based on config
    const verified = await this.verifyIdentity(params.verificationData);

    if (!verified) {
      throw new Error('Identity verification failed');
    }

    // Create the actual request
    const request = this.gdprService.submitRequest({
      dataSubjectId: params.token, // In production, map to actual user ID
      type: 'access', // Would come from initial request
    });

    return request;
  }

  // Process access request
  async processAccessRequest(requestId: string): Promise<object> {
    return this.gdprService.processRequest(requestId, async (request) => {
      // Gather all data
      const data = this.gdprService.exportData(request.dataSubjectId);

      // Format response
      if (this.config.responseFormat === 'pdf') {
        return this.generatePDFReport(data);
      }

      return data;
    });
  }

  // Process erasure request
  async processErasureRequest(requestId: string): Promise<object> {
    return this.gdprService.processRequest(requestId, async (request) => {
      // Check for legal holds or obligations
      const canErase = await this.checkErasureEligibility(request.dataSubjectId);

      if (!canErase.eligible) {
        throw new Error(`Cannot erase: ${canErase.reason}`);
      }

      // Perform erasure
      const deletedCount = this.gdprService.eraseData(request.dataSubjectId);

      return {
        erased: true,
        itemsDeleted: deletedCount,
        timestamp: new Date().toISOString(),
      };
    });
  }

  // Process portability request
  async processPortabilityRequest(requestId: string): Promise<object> {
    return this.gdprService.processRequest(requestId, async (request) => {
      const data = this.gdprService.exportData(request.dataSubjectId);

      // Format as machine-readable
      return {
        format: 'application/json',
        data,
        generatedAt: new Date().toISOString(),
      };
    });
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    // Implement email sending
    console.log(`Verification email sent to ${email} with token ${token}`);
  }

  private async verifyIdentity(data: any): Promise<boolean> {
    // Implement identity verification
    return true;
  }

  private async checkErasureEligibility(dataSubjectId: string): Promise<{ eligible: boolean; reason?: string }> {
    // Check for legal holds, active contracts, etc.
    return { eligible: true };
  }

  private generatePDFReport(data: object): Buffer {
    // Generate PDF report
    return Buffer.from(JSON.stringify(data));
  }
}
```

## Data Protection Impact Assessment (DPIA)

```typescript
// src/gdpr/dpia.ts
export interface DPIAQuestion {
  id: string;
  category: string;
  question: string;
  riskLevel: 'low' | 'medium' | 'high';
  guidance: string;
}

export interface DPIAResponse {
  questionId: string;
  answer: 'yes' | 'no' | 'partial' | 'not_applicable';
  notes?: string;
  mitigations?: string[];
}

export interface DPIAAssessment {
  id: string;
  projectName: string;
  assessor: string;
  createdAt: Date;
  completedAt?: Date;
  responses: DPIAResponse[];
  overallRisk: 'low' | 'medium' | 'high' | 'very_high';
  approved: boolean;
  approvedBy?: string;
}

// Standard DPIA questions
export const DPIA_QUESTIONS: DPIAQuestion[] = [
  {
    id: 'scope_1',
    category: 'Scope',
    question: 'Does the processing involve large-scale profiling or automated decision-making?',
    riskLevel: 'high',
    guidance: 'Large-scale automated processing that affects individuals requires thorough assessment.',
  },
  {
    id: 'scope_2',
    category: 'Scope',
    question: 'Does the processing involve sensitive personal data (health, biometric, genetic)?',
    riskLevel: 'high',
    guidance: 'Special category data requires enhanced protection measures.',
  },
  {
    id: 'scope_3',
    category: 'Scope',
    question: 'Does the processing involve vulnerable data subjects (children, employees)?',
    riskLevel: 'high',
    guidance: 'Processing data of vulnerable individuals requires additional safeguards.',
  },
  {
    id: 'legal_1',
    category: 'Legal Basis',
    question: 'Have you identified a valid legal basis for the processing?',
    riskLevel: 'high',
    guidance: 'All processing must have a lawful basis under Article 6 GDPR.',
  },
  {
    id: 'legal_2',
    category: 'Legal Basis',
    question: 'If relying on consent, is it freely given, specific, informed, and unambiguous?',
    riskLevel: 'medium',
    guidance: 'Consent must meet all GDPR requirements to be valid.',
  },
  {
    id: 'security_1',
    category: 'Security',
    question: 'Are appropriate technical measures in place (encryption, access controls)?',
    riskLevel: 'high',
    guidance: 'Technical measures must be appropriate to the risk level.',
  },
  {
    id: 'security_2',
    category: 'Security',
    question: 'Are appropriate organizational measures in place (policies, training)?',
    riskLevel: 'medium',
    guidance: 'Staff must be trained and policies must be documented.',
  },
  {
    id: 'rights_1',
    category: 'Data Subject Rights',
    question: 'Can data subjects easily exercise their rights (access, erasure, portability)?',
    riskLevel: 'medium',
    guidance: 'Processes must be in place to handle data subject requests.',
  },
  {
    id: 'transfer_1',
    category: 'Data Transfers',
    question: 'Does the processing involve transfers outside the EEA?',
    riskLevel: 'high',
    guidance: 'International transfers require appropriate safeguards.',
  },
  {
    id: 'retention_1',
    category: 'Retention',
    question: 'Is there a defined retention period with automatic deletion?',
    riskLevel: 'medium',
    guidance: 'Data should not be kept longer than necessary.',
  },
];

export class DPIAService {
  private assessments: Map<string, DPIAAssessment> = new Map();

  // Create new DPIA
  createAssessment(projectName: string, assessor: string): DPIAAssessment {
    const assessment: DPIAAssessment = {
      id: Math.random().toString(36).substring(2, 15),
      projectName,
      assessor,
      createdAt: new Date(),
      responses: [],
      overallRisk: 'low',
      approved: false,
    };

    this.assessments.set(assessment.id, assessment);
    return assessment;
  }

  // Get questions
  getQuestions(): DPIAQuestion[] {
    return DPIA_QUESTIONS;
  }

  // Submit response
  submitResponse(assessmentId: string, response: DPIAResponse): void {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    const existingIndex = assessment.responses.findIndex(
      (r) => r.questionId === response.questionId
    );

    if (existingIndex >= 0) {
      assessment.responses[existingIndex] = response;
    } else {
      assessment.responses.push(response);
    }

    // Recalculate risk
    assessment.overallRisk = this.calculateOverallRisk(assessment);
  }

  // Calculate overall risk
  private calculateOverallRisk(assessment: DPIAAssessment): DPIAAssessment['overallRisk'] {
    let highRiskCount = 0;
    let mediumRiskCount = 0;

    for (const response of assessment.responses) {
      if (response.answer === 'no' || response.answer === 'partial') {
        const question = DPIA_QUESTIONS.find((q) => q.id === response.questionId);
        if (question?.riskLevel === 'high') highRiskCount++;
        if (question?.riskLevel === 'medium') mediumRiskCount++;
      }
    }

    if (highRiskCount >= 3) return 'very_high';
    if (highRiskCount >= 1) return 'high';
    if (mediumRiskCount >= 3) return 'medium';
    return 'low';
  }

  // Complete assessment
  completeAssessment(assessmentId: string): DPIAAssessment {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    assessment.completedAt = new Date();
    return assessment;
  }

  // Approve assessment
  approveAssessment(assessmentId: string, approver: string): DPIAAssessment {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    if (!assessment.completedAt) {
      throw new Error('Assessment must be completed before approval');
    }

    assessment.approved = true;
    assessment.approvedBy = approver;
    return assessment;
  }

  // Generate report
  generateReport(assessmentId: string): object {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    return {
      title: `Data Protection Impact Assessment: ${assessment.projectName}`,
      generatedAt: new Date().toISOString(),
      assessor: assessment.assessor,
      status: assessment.approved ? 'Approved' : 'Pending Approval',
      overallRisk: assessment.overallRisk,
      sections: this.groupResponsesByCategory(assessment),
      recommendations: this.generateRecommendations(assessment),
    };
  }

  private groupResponsesByCategory(assessment: DPIAAssessment): object {
    const grouped: Record<string, any[]> = {};

    for (const response of assessment.responses) {
      const question = DPIA_QUESTIONS.find((q) => q.id === response.questionId);
      if (!question) continue;

      if (!grouped[question.category]) {
        grouped[question.category] = [];
      }

      grouped[question.category].push({
        question: question.question,
        answer: response.answer,
        riskLevel: question.riskLevel,
        notes: response.notes,
        mitigations: response.mitigations,
      });
    }

    return grouped;
  }

  private generateRecommendations(assessment: DPIAAssessment): string[] {
    const recommendations: string[] = [];

    for (const response of assessment.responses) {
      if (response.answer === 'no') {
        const question = DPIA_QUESTIONS.find((q) => q.id === response.questionId);
        if (question) {
          recommendations.push(`Address: ${question.question} - ${question.guidance}`);
        }
      }
    }

    return recommendations;
  }
}
```

## Usage Example

```typescript
import { GDPRComplianceService } from './gdpr/framework';
import { ConsentManager } from './gdpr/consent-manager';
import { DSARWorkflow } from './gdpr/dsar';
import { DPIAService } from './gdpr/dpia';

// Initialize services
const gdprService = new GDPRComplianceService();

// Register processing purposes
gdprService.registerPurpose({
  name: 'Essential Services',
  description: 'Processing necessary to provide our core services',
  legalBasis: 'contract',
  dataCategories: ['personal'],
  retentionPeriod: 365,
  thirdPartySharing: false,
  crossBorderTransfer: false,
  automatedDecisionMaking: false,
});

gdprService.registerPurpose({
  name: 'Analytics',
  description: 'Processing to improve our services through analytics',
  legalBasis: 'consent',
  dataCategories: ['personal'],
  retentionPeriod: 90,
  thirdPartySharing: true,
  crossBorderTransfer: true,
  automatedDecisionMaking: false,
});

// Handle consent
const consent = gdprService.recordConsent({
  dataSubjectId: 'user-123',
  purposeId: 'analytics-purpose-id',
  granted: true,
  ipAddress: '192.168.1.1',
});

// Handle DSAR
const dsarWorkflow = new DSARWorkflow(gdprService, {
  identityVerification: 'email',
  responseFormat: 'json',
  notifyOnCompletion: true,
});

// Export user data
const exportedData = gdprService.exportData('user-123');
console.log('Exported data:', exportedData);
```

## CLAUDE.md Integration

```markdown
## GDPR Compliance

This project implements GDPR compliance controls.

### Consent Management
- Record consent with `gdprService.recordConsent()`
- Check consent with `hasValidConsent()`
- Withdraw consent with `withdrawConsent()`

### Data Subject Rights
- Access: Export all data for a user
- Erasure: Delete all user data
- Portability: Export in machine-readable format

### DPIA
- Run DPIA for new processing activities
- Document risk assessments
- Get approval before processing

### Key Files
- `src/gdpr/framework.ts` - Core compliance service
- `src/gdpr/consent-manager.ts` - Consent UI
- `src/gdpr/dsar.ts` - Request workflows
- `src/gdpr/dpia.ts` - Impact assessments
```

## AI Suggestions

1. **Add consent versioning** - Track consent changes over time
2. **Implement data lineage** - Track data flow through systems
3. **Add breach notification** - Automated breach reporting
4. **Create consent receipts** - Blockchain-based proof
5. **Add privacy dashboards** - User-facing privacy controls
6. **Implement data minimization** - Automatic field masking
7. **Add cross-border transfer checks** - SCCs and adequacy validation
8. **Create audit reports** - Compliance evidence generation
9. **Add automated retention** - Scheduled data deletion
10. **Implement privacy metrics** - Compliance KPIs and reporting
