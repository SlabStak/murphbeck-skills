# Data Processing Agreement Generator Template

Automated DPA generation for GDPR compliance with customizable clauses, annexes, and controller-processor relationships.

## Overview

This template provides a comprehensive Data Processing Agreement generator for establishing compliant controller-processor relationships under GDPR Article 28 and other privacy regulations.

## Quick Start

```bash
npm install handlebars date-fns uuid
npm install -D typescript @types/node
```

## DPA Framework

```typescript
// src/dpa/framework.ts
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';

// Party roles
export type PartyRole = 'controller' | 'processor' | 'sub-processor' | 'joint-controller';

// Party information
export interface Party {
  role: PartyRole;
  name: string;
  legalName: string;
  address: string;
  country: string;
  registrationNumber?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  dpo?: {
    name: string;
    email: string;
  };
}

// Processing details
export interface ProcessingDetails {
  purposes: string[];
  categories: DataCategory[];
  subjectCategories: string[];
  duration: string;
  instructions: string[];
  specialCategories: boolean;
  specialCategoriesDetails?: string;
}

// Data category
export interface DataCategory {
  name: string;
  description: string;
  sensitive: boolean;
  examples: string[];
}

// Security measures
export interface SecurityMeasures {
  technical: SecurityMeasure[];
  organizational: SecurityMeasure[];
}

export interface SecurityMeasure {
  category: string;
  description: string;
  implemented: boolean;
}

// Sub-processor
export interface SubProcessor {
  name: string;
  address: string;
  country: string;
  services: string;
  dataCategories: string[];
  transferMechanism?: string;
}

// International transfer
export interface InternationalTransfer {
  destinationCountry: string;
  transferMechanism: 'adequacy' | 'scc' | 'bcr' | 'derogation';
  details: string;
}

// DPA Configuration
export interface DPAConfig {
  controller: Party;
  processor: Party;
  processing: ProcessingDetails;
  security: SecurityMeasures;
  subProcessors: SubProcessor[];
  transfers: InternationalTransfer[];
  effectiveDate: Date;
  termDate?: Date;
  jurisdiction: string;
  version: string;
  auditRights: boolean;
  breachNotificationHours: number;
  dataRetentionPolicy: string;
  deletionMethod: 'delete' | 'return' | 'both';
}

// DPA Document
export interface DPADocument {
  id: string;
  config: DPAConfig;
  content: string;
  annexes: DPAAnnex[];
  createdAt: Date;
  signedByController?: Date;
  signedByProcessor?: Date;
  status: 'draft' | 'pending' | 'signed' | 'terminated';
}

// DPA Annex
export interface DPAAnnex {
  number: number;
  title: string;
  content: string;
}

// Standard security measures
export const STANDARD_TECHNICAL_MEASURES: SecurityMeasure[] = [
  { category: 'Access Control', description: 'Role-based access control with least privilege principle', implemented: true },
  { category: 'Access Control', description: 'Multi-factor authentication for all system access', implemented: true },
  { category: 'Encryption', description: 'AES-256 encryption for data at rest', implemented: true },
  { category: 'Encryption', description: 'TLS 1.2+ for data in transit', implemented: true },
  { category: 'Network Security', description: 'Firewalls and intrusion detection systems', implemented: true },
  { category: 'Monitoring', description: 'Real-time security monitoring and alerting', implemented: true },
  { category: 'Backup', description: 'Regular encrypted backups with tested recovery procedures', implemented: true },
  { category: 'Vulnerability Management', description: 'Regular security scanning and penetration testing', implemented: true },
];

export const STANDARD_ORGANIZATIONAL_MEASURES: SecurityMeasure[] = [
  { category: 'Policies', description: 'Information security policy reviewed annually', implemented: true },
  { category: 'Training', description: 'Security awareness training for all staff', implemented: true },
  { category: 'Vetting', description: 'Background checks for staff with data access', implemented: true },
  { category: 'Incident Response', description: 'Documented incident response procedures', implemented: true },
  { category: 'Access Management', description: 'Documented access provisioning and deprovisioning', implemented: true },
  { category: 'Vendor Management', description: 'Third-party security assessment program', implemented: true },
  { category: 'Physical Security', description: 'Secure data center with access controls', implemented: true },
  { category: 'Business Continuity', description: 'Business continuity and disaster recovery plans', implemented: true },
];

// DPA Generator
export class DPAGenerator {
  private template: Handlebars.TemplateDelegate;

  constructor() {
    this.registerHelpers();
    this.template = Handlebars.compile(DPA_TEMPLATE);
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    Handlebars.registerHelper('upper', (str: string) => str?.toUpperCase());

    Handlebars.registerHelper('ordinal', (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    });

    Handlebars.registerHelper('list', (items: string[]) => {
      return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
    });
  }

  // Generate DPA document
  generate(config: DPAConfig): DPADocument {
    const content = this.template(config);
    const annexes = this.generateAnnexes(config);

    return {
      id: uuidv4(),
      config,
      content,
      annexes,
      createdAt: new Date(),
      status: 'draft',
    };
  }

  // Generate annexes
  private generateAnnexes(config: DPAConfig): DPAAnnex[] {
    return [
      this.generateAnnexA(config), // Processing details
      this.generateAnnexB(config), // Security measures
      this.generateAnnexC(config), // Sub-processors
      this.generateAnnexD(config), // International transfers
    ];
  }

  // Annex A: Processing Details
  private generateAnnexA(config: DPAConfig): DPAAnnex {
    const content = `
# ANNEX A: DETAILS OF PROCESSING

## 1. Subject Matter of Processing
${config.processing.purposes.map((p) => `- ${p}`).join('\n')}

## 2. Duration of Processing
${config.processing.duration}

## 3. Nature and Purpose of Processing
${config.processing.instructions.map((i) => `- ${i}`).join('\n')}

## 4. Categories of Data Subjects
${config.processing.subjectCategories.map((c) => `- ${c}`).join('\n')}

## 5. Categories of Personal Data
${config.processing.categories.map((c) => `
### ${c.name}
${c.description}
${c.sensitive ? '**Note: This is sensitive/special category data.**' : ''}
Examples: ${c.examples.join(', ')}
`).join('\n')}

${config.processing.specialCategories ? `
## 6. Special Categories of Data
${config.processing.specialCategoriesDetails}
` : ''}
    `.trim();

    return {
      number: 1,
      title: 'Details of Processing',
      content,
    };
  }

  // Annex B: Security Measures
  private generateAnnexB(config: DPAConfig): DPAAnnex {
    const technicalMeasures = config.security.technical
      .filter((m) => m.implemented)
      .map((m) => `- **${m.category}**: ${m.description}`)
      .join('\n');

    const orgMeasures = config.security.organizational
      .filter((m) => m.implemented)
      .map((m) => `- **${m.category}**: ${m.description}`)
      .join('\n');

    const content = `
# ANNEX B: TECHNICAL AND ORGANIZATIONAL MEASURES

## 1. Technical Measures
${technicalMeasures}

## 2. Organizational Measures
${orgMeasures}

## 3. Certifications and Standards
- SOC 2 Type II
- ISO 27001 (if applicable)
- Other relevant certifications

## 4. Regular Review
These measures are reviewed at least annually and updated as necessary to ensure continued appropriateness.
    `.trim();

    return {
      number: 2,
      title: 'Technical and Organizational Measures',
      content,
    };
  }

  // Annex C: Sub-processors
  private generateAnnexC(config: DPAConfig): DPAAnnex {
    const subProcessorList = config.subProcessors.length > 0
      ? config.subProcessors.map((sp, i) => `
### ${i + 1}. ${sp.name}
- **Address**: ${sp.address}
- **Country**: ${sp.country}
- **Services**: ${sp.services}
- **Data Categories**: ${sp.dataCategories.join(', ')}
${sp.transferMechanism ? `- **Transfer Mechanism**: ${sp.transferMechanism}` : ''}
      `).join('\n')
      : 'No sub-processors are currently authorized.';

    const content = `
# ANNEX C: APPROVED SUB-PROCESSORS

## Current Approved Sub-processors
${subProcessorList}

## Sub-processor Requirements
All sub-processors must:
1. Enter into a written agreement with equivalent data protection obligations
2. Implement appropriate technical and organizational measures
3. Process data only on documented instructions
4. Be subject to audit by the processor

## Notification of Changes
The processor will notify the controller of any intended additions or replacements of sub-processors at least 30 days in advance, allowing the controller to object.
    `.trim();

    return {
      number: 3,
      title: 'Approved Sub-processors',
      content,
    };
  }

  // Annex D: International Transfers
  private generateAnnexD(config: DPAConfig): DPAAnnex {
    const transferList = config.transfers.length > 0
      ? config.transfers.map((t, i) => `
### ${i + 1}. Transfer to ${t.destinationCountry}
- **Mechanism**: ${this.getTransferMechanismName(t.transferMechanism)}
- **Details**: ${t.details}
      `).join('\n')
      : 'No international transfers are currently performed.';

    const content = `
# ANNEX D: INTERNATIONAL TRANSFERS

## Current International Transfers
${transferList}

## Transfer Mechanisms
The following mechanisms may be used for international transfers:
1. **Adequacy Decision**: Transfers to countries with an EU adequacy decision
2. **Standard Contractual Clauses**: EU-approved SCCs for controller-to-processor transfers
3. **Binding Corporate Rules**: Approved BCRs for intra-group transfers
4. **Derogations**: Article 49 derogations where applicable

## Supplementary Measures
Where required, supplementary technical, organizational, or contractual measures are implemented to ensure an essentially equivalent level of protection.
    `.trim();

    return {
      number: 4,
      title: 'International Transfers',
      content,
    };
  }

  private getTransferMechanismName(mechanism: string): string {
    const names: Record<string, string> = {
      adequacy: 'EU Adequacy Decision',
      scc: 'Standard Contractual Clauses',
      bcr: 'Binding Corporate Rules',
      derogation: 'Article 49 Derogation',
    };
    return names[mechanism] || mechanism;
  }

  // Export full document
  exportDocument(document: DPADocument): string {
    let fullDocument = document.content;

    for (const annex of document.annexes) {
      fullDocument += `\n\n---\n\n${annex.content}`;
    }

    return fullDocument;
  }
}

// DPA Template
const DPA_TEMPLATE = `
# DATA PROCESSING AGREEMENT

**Effective Date:** {{formatDate effectiveDate}}
**Version:** {{version}}

---

## PARTIES

**Controller:**
{{controller.legalName}}
{{controller.address}}
{{controller.country}}
Contact: {{controller.contactName}} ({{controller.contactEmail}})
{{#if controller.dpo}}DPO: {{controller.dpo.name}} ({{controller.dpo.email}}){{/if}}

**Processor:**
{{processor.legalName}}
{{processor.address}}
{{processor.country}}
Contact: {{processor.contactName}} ({{processor.contactEmail}})
{{#if processor.dpo}}DPO: {{processor.dpo.name}} ({{processor.dpo.email}}){{/if}}

---

## 1. DEFINITIONS

1.1 "Personal Data" means any information relating to an identified or identifiable natural person.

1.2 "Processing" means any operation performed on Personal Data, whether or not by automated means.

1.3 "Data Subject" means an identified or identifiable natural person whose Personal Data is processed.

1.4 "Sub-processor" means any third party engaged by the Processor to process Personal Data.

1.5 "Data Protection Laws" means the General Data Protection Regulation (EU) 2016/679 and applicable national implementing legislation.

---

## 2. SUBJECT MATTER AND DURATION

2.1 This Agreement governs the Processor's processing of Personal Data on behalf of the Controller as described in Annex A.

2.2 Processing shall continue for the duration specified in Annex A or until termination of the underlying services agreement.

---

## 3. PROCESSOR OBLIGATIONS

3.1 **Processing Instructions**: The Processor shall process Personal Data only on documented instructions from the Controller, unless required by law.

3.2 **Confidentiality**: The Processor shall ensure that persons authorized to process Personal Data are bound by confidentiality obligations.

3.3 **Security**: The Processor shall implement appropriate technical and organizational measures as described in Annex B.

3.4 **Sub-processing**: The Processor shall not engage another processor without prior written authorization. Authorized sub-processors are listed in Annex C.

3.5 **Data Subject Rights**: The Processor shall assist the Controller in responding to requests from Data Subjects exercising their rights.

3.6 **Security Incidents**: The Processor shall notify the Controller of any Personal Data breach without undue delay, and in any event within {{breachNotificationHours}} hours.

3.7 **Data Protection Impact Assessments**: The Processor shall assist the Controller with DPIAs where required.

3.8 **Audit Rights**: {{#if auditRights}}The Controller or its designated auditor may audit the Processor's compliance with this Agreement upon reasonable notice.{{else}}The Processor shall provide audit reports upon request.{{/if}}

---

## 4. INTERNATIONAL TRANSFERS

4.1 The Processor shall not transfer Personal Data outside the EEA except as specified in Annex D or with the Controller's prior written consent.

4.2 Any such transfer shall be subject to appropriate safeguards in accordance with Data Protection Laws.

---

## 5. RETURN AND DELETION OF DATA

5.1 Upon termination of this Agreement, the Processor shall, at the Controller's choice:
{{#if (eq deletionMethod 'delete')}}
- Delete all Personal Data and certify deletion in writing
{{else if (eq deletionMethod 'return')}}
- Return all Personal Data to the Controller in a commonly used format
{{else}}
- Return all Personal Data to the Controller and delete remaining copies
{{/if}}

5.2 The Processor shall retain copies only where required by applicable law.

---

## 6. DATA RETENTION

{{dataRetentionPolicy}}

---

## 7. GENERAL PROVISIONS

7.1 **Governing Law**: This Agreement shall be governed by the laws of {{jurisdiction}}.

7.2 **Entire Agreement**: This Agreement, including its Annexes, constitutes the entire agreement between the parties regarding data processing.

7.3 **Amendments**: This Agreement may only be amended in writing signed by both parties.

7.4 **Severability**: If any provision is found invalid, the remaining provisions shall continue in effect.

---

## SIGNATURES

**For the Controller:**

Name: _________________________
Title: _________________________
Date: _________________________
Signature: _________________________

**For the Processor:**

Name: _________________________
Title: _________________________
Date: _________________________
Signature: _________________________
`.trim();
```

## Usage Example

```typescript
import { DPAGenerator, DPAConfig, STANDARD_TECHNICAL_MEASURES, STANDARD_ORGANIZATIONAL_MEASURES } from './dpa/framework';

const generator = new DPAGenerator();

const config: DPAConfig = {
  controller: {
    role: 'controller',
    name: 'Example Corp',
    legalName: 'Example Corporation Ltd.',
    address: '123 Business Street, London',
    country: 'United Kingdom',
    registrationNumber: 'UK12345678',
    contactName: 'Jane Smith',
    contactEmail: 'privacy@example.com',
    dpo: { name: 'John Doe', email: 'dpo@example.com' },
  },
  processor: {
    role: 'processor',
    name: 'Cloud Services Inc',
    legalName: 'Cloud Services Inc.',
    address: '456 Tech Avenue, Dublin',
    country: 'Ireland',
    contactName: 'Bob Johnson',
    contactEmail: 'legal@cloudservices.com',
    dpo: { name: 'Alice Brown', email: 'dpo@cloudservices.com' },
  },
  processing: {
    purposes: ['Hosting customer data', 'Providing SaaS platform services', 'Customer support'],
    categories: [
      { name: 'Contact Information', description: 'Names, emails, phone numbers', sensitive: false, examples: ['name', 'email'] },
      { name: 'Account Data', description: 'Login credentials and preferences', sensitive: false, examples: ['username', 'settings'] },
    ],
    subjectCategories: ['Customers', 'End users', 'Employees of customers'],
    duration: 'Duration of the services agreement plus 30 days',
    instructions: ['Store data securely', 'Process only as needed for service delivery', 'Support data subject requests'],
    specialCategories: false,
  },
  security: {
    technical: STANDARD_TECHNICAL_MEASURES,
    organizational: STANDARD_ORGANIZATIONAL_MEASURES,
  },
  subProcessors: [
    { name: 'AWS', address: 'Seattle, WA', country: 'USA', services: 'Cloud infrastructure', dataCategories: ['All'], transferMechanism: 'SCCs' },
  ],
  transfers: [
    { destinationCountry: 'USA', transferMechanism: 'scc', details: 'AWS infrastructure with EU SCCs' },
  ],
  effectiveDate: new Date(),
  jurisdiction: 'England and Wales',
  version: '1.0',
  auditRights: true,
  breachNotificationHours: 24,
  dataRetentionPolicy: 'Data is retained for the duration of the service agreement and deleted within 30 days of termination.',
  deletionMethod: 'both',
};

const document = generator.generate(config);
const fullDoc = generator.exportDocument(document);
console.log(fullDoc);
```

## CLAUDE.md Integration

```markdown
## DPA Generator

Generate GDPR-compliant Data Processing Agreements.

### Components
- Main agreement with standard clauses
- Annex A: Processing details
- Annex B: Security measures
- Annex C: Sub-processors
- Annex D: International transfers

### Usage
```typescript
const generator = new DPAGenerator();
const document = generator.generate(config);
```

### Customization
- Party details
- Processing purposes
- Security measures
- Sub-processor list
- Transfer mechanisms
```

## AI Suggestions

1. **Add clause library** - Reusable legal clauses
2. **Implement version control** - Track agreement changes
3. **Add digital signatures** - E-signature integration
4. **Create approval workflow** - Multi-party review
5. **Add compliance checking** - Validate against regulations
6. **Implement renewals** - Automatic renewal notices
7. **Add amendment tracking** - Amendment history
8. **Create comparison tool** - Compare DPA versions
9. **Add translation support** - Multi-language DPAs
10. **Implement expiry alerts** - Notification system
