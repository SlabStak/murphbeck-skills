# Privacy Policy Generator Template

Dynamic privacy policy generation with customization for jurisdiction, industry, and data practices.

## Overview

This template provides a flexible privacy policy generator that adapts to your business model, data practices, and regulatory requirements including GDPR, CCPA, and other privacy laws.

## Quick Start

```bash
npm install handlebars date-fns
npm install -D typescript @types/node
```

## Privacy Policy Framework

```typescript
// src/privacy/policy-generator.ts
import Handlebars from 'handlebars';

// Company information
export interface CompanyInfo {
  name: string;
  legalName?: string;
  address: string;
  country: string;
  email: string;
  phone?: string;
  website: string;
  dpo?: {
    name: string;
    email: string;
  };
}

// Data collection practices
export interface DataPractices {
  collectsPersonalData: boolean;
  dataTypes: DataType[];
  collectionMethods: CollectionMethod[];
  purposes: ProcessingPurpose[];
  retentionPeriods: RetentionPeriod[];
  thirdPartySharing: ThirdPartySharing[];
  internationalTransfers: boolean;
  transferMechanisms?: string[];
  automatedDecisionMaking: boolean;
  cookies: CookiePractices;
  childrenData: boolean;
  minAge?: number;
}

export type DataType =
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'payment'
  | 'location'
  | 'device_info'
  | 'usage_data'
  | 'cookies'
  | 'social_media'
  | 'employment'
  | 'health'
  | 'biometric'
  | 'genetic'
  | 'preferences'
  | 'communications';

export type CollectionMethod = 'direct' | 'automatic' | 'third_party' | 'public_sources';

export interface ProcessingPurpose {
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  description: string;
}

export interface RetentionPeriod {
  dataType: string;
  period: string;
  criteria: string;
}

export interface ThirdPartySharing {
  category: string;
  purpose: string;
  types: string[];
}

export interface CookiePractices {
  uses: boolean;
  types: ('essential' | 'functional' | 'analytics' | 'advertising')[];
  thirdPartyCookies: boolean;
  cookiePolicy?: string;
}

// Jurisdiction configuration
export interface JurisdictionConfig {
  jurisdiction: 'global' | 'eu' | 'us' | 'california' | 'uk' | 'australia' | 'canada';
  includeGDPR: boolean;
  includeCCPA: boolean;
  includeUKGDPR: boolean;
  includeAPP: boolean;
  includePIPEDA: boolean;
  customRegulations?: string[];
}

// Policy configuration
export interface PolicyConfig {
  company: CompanyInfo;
  practices: DataPractices;
  jurisdiction: JurisdictionConfig;
  effectiveDate: Date;
  version: string;
  language: 'en' | 'es' | 'fr' | 'de';
}

// Data type descriptions
const DATA_TYPE_DESCRIPTIONS: Record<DataType, string> = {
  name: 'Full name, first name, last name, or similar identifiers',
  email: 'Email addresses for communication and account identification',
  phone: 'Phone numbers including mobile and landline',
  address: 'Physical addresses including street, city, state, and postal code',
  payment: 'Payment information including credit card numbers and billing addresses',
  location: 'Geographic location data from your device or IP address',
  device_info: 'Device identifiers, browser type, operating system, and hardware information',
  usage_data: 'Information about how you use our services, including pages visited and features used',
  cookies: 'Cookies and similar tracking technologies',
  social_media: 'Information from connected social media accounts',
  employment: 'Employment history, job title, and professional information',
  health: 'Health and medical information',
  biometric: 'Biometric data such as fingerprints or facial recognition',
  genetic: 'Genetic information',
  preferences: 'Your preferences, interests, and settings',
  communications: 'Communications with us including support tickets and emails',
};

// Privacy Policy Generator
export class PrivacyPolicyGenerator {
  private template: Handlebars.TemplateDelegate;

  constructor() {
    this.registerHelpers();
    this.template = Handlebars.compile(POLICY_TEMPLATE);
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    Handlebars.registerHelper('dataTypeDescription', (type: DataType) => {
      return DATA_TYPE_DESCRIPTIONS[type] || type;
    });

    Handlebars.registerHelper('legalBasisExplanation', (basis: string) => {
      const explanations: Record<string, string> = {
        consent: 'We process this data because you have given us your consent',
        contract: 'We process this data because it is necessary to perform our contract with you',
        legal_obligation: 'We process this data to comply with our legal obligations',
        vital_interests: 'We process this data to protect vital interests',
        public_task: 'We process this data for public interest tasks',
        legitimate_interests: 'We process this data based on our legitimate business interests',
      };
      return explanations[basis] || basis;
    });

    Handlebars.registerHelper('if_includes', function (this: any, array: any[], value: any, options: any) {
      if (array && array.includes(value)) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
  }

  generate(config: PolicyConfig): string {
    return this.template({
      ...config,
      dataTypeDescriptions: DATA_TYPE_DESCRIPTIONS,
    });
  }

  // Generate policy sections separately
  generateSection(config: PolicyConfig, section: string): string {
    const sections: Record<string, () => string> = {
      introduction: () => this.generateIntroduction(config),
      dataCollection: () => this.generateDataCollection(config),
      dataUse: () => this.generateDataUse(config),
      dataSharing: () => this.generateDataSharing(config),
      cookies: () => this.generateCookies(config),
      rights: () => this.generateRights(config),
      security: () => this.generateSecurity(config),
      retention: () => this.generateRetention(config),
      children: () => this.generateChildren(config),
      international: () => this.generateInternational(config),
      changes: () => this.generateChanges(config),
      contact: () => this.generateContact(config),
    };

    return sections[section]?.() || '';
  }

  private generateIntroduction(config: PolicyConfig): string {
    return `
# Privacy Policy

**Effective Date:** ${config.effectiveDate.toLocaleDateString()}
**Version:** ${config.version}

${config.company.name} ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website ${config.company.website} and use our services.

Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.
    `.trim();
  }

  private generateDataCollection(config: PolicyConfig): string {
    const types = config.practices.dataTypes
      .map((t) => `- **${t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ')}**: ${DATA_TYPE_DESCRIPTIONS[t]}`)
      .join('\n');

    return `
## Information We Collect

We collect information in the following ways:

### Information You Provide
When you register, make a purchase, or contact us, you may provide:
${types}

### Information Collected Automatically
When you access our services, we automatically collect:
- Log data and usage information
- Device and browser information
- IP address and location data
- Cookies and tracking technologies
    `.trim();
  }

  private generateDataUse(config: PolicyConfig): string {
    const purposes = config.practices.purposes
      .map((p) => `- **${p.purpose}**: ${p.description}`)
      .join('\n');

    return `
## How We Use Your Information

We use the information we collect for the following purposes:

${purposes}

### Legal Basis for Processing (GDPR)
${config.jurisdiction.includeGDPR ? `
For users in the European Economic Area, we process your data based on:
${config.practices.purposes.map((p) => `- ${p.purpose}: ${p.legalBasis}`).join('\n')}
` : 'See our jurisdiction-specific disclosures below.'}
    `.trim();
  }

  private generateDataSharing(config: PolicyConfig): string {
    const sharing = config.practices.thirdPartySharing
      .map((s) => `- **${s.category}**: ${s.purpose}`)
      .join('\n');

    return `
## Sharing Your Information

We may share your information with:

${sharing}

We do not sell your personal information.
    `.trim();
  }

  private generateCookies(config: PolicyConfig): string {
    if (!config.practices.cookies.uses) {
      return `## Cookies\n\nWe do not use cookies on our website.`;
    }

    return `
## Cookies and Tracking Technologies

We use cookies and similar tracking technologies to:
${config.practices.cookies.types.map((t) => `- ${t.charAt(0).toUpperCase() + t.slice(1)} cookies`).join('\n')}

${config.practices.cookies.thirdPartyCookies ? 'We also allow third-party cookies for analytics and advertising purposes.' : ''}

${config.practices.cookies.cookiePolicy ? `For more details, see our [Cookie Policy](${config.practices.cookies.cookiePolicy}).` : ''}

You can control cookies through your browser settings.
    `.trim();
  }

  private generateRights(config: PolicyConfig): string {
    let rights = `
## Your Privacy Rights

You have the following rights regarding your personal information:

- **Access**: Request a copy of your personal data
- **Correction**: Request correction of inaccurate data
- **Deletion**: Request deletion of your data
- **Portability**: Receive your data in a portable format
- **Objection**: Object to certain processing activities
- **Restriction**: Request restriction of processing
    `;

    if (config.jurisdiction.includeGDPR) {
      rights += `

### For EU/EEA Residents (GDPR)
You have additional rights under GDPR including the right to lodge a complaint with a supervisory authority.
      `;
    }

    if (config.jurisdiction.includeCCPA) {
      rights += `

### For California Residents (CCPA)
You have the right to:
- Know what personal information is collected
- Know if personal information is sold or disclosed
- Say no to the sale of personal information
- Access your personal information
- Request deletion of your information
- Equal service and price
      `;
    }

    return rights.trim();
  }

  private generateSecurity(config: PolicyConfig): string {
    return `
## Data Security

We implement appropriate technical and organizational measures to protect your personal information, including:

- Encryption of data in transit and at rest
- Access controls and authentication
- Regular security assessments
- Employee training on data protection

However, no method of transmission over the Internet is 100% secure.
    `.trim();
  }

  private generateRetention(config: PolicyConfig): string {
    const periods = config.practices.retentionPeriods
      .map((r) => `- **${r.dataType}**: ${r.period} (${r.criteria})`)
      .join('\n');

    return `
## Data Retention

We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy:

${periods}

After the retention period, data is securely deleted or anonymized.
    `.trim();
  }

  private generateChildren(config: PolicyConfig): string {
    if (!config.practices.childrenData) {
      return `
## Children's Privacy

Our services are not directed to individuals under ${config.practices.minAge || 13} years of age. We do not knowingly collect personal information from children. If we learn we have collected information from a child, we will delete it promptly.
      `.trim();
    }

    return `
## Children's Privacy

We may collect information from children under ${config.practices.minAge || 13} with verified parental consent in compliance with COPPA and applicable laws.
    `.trim();
  }

  private generateInternational(config: PolicyConfig): string {
    if (!config.practices.internationalTransfers) {
      return '';
    }

    return `
## International Data Transfers

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place:

${config.practices.transferMechanisms?.map((m) => `- ${m}`).join('\n') || '- Standard Contractual Clauses\n- Adequacy decisions'}
    `.trim();
  }

  private generateChanges(config: PolicyConfig): string {
    return `
## Changes to This Policy

We may update this privacy policy from time to time. We will notify you of any changes by:

- Posting the new policy on this page
- Updating the "Effective Date" at the top
- Sending you an email notification for material changes

We encourage you to review this policy periodically.
    `.trim();
  }

  private generateContact(config: PolicyConfig): string {
    return `
## Contact Us

If you have questions about this privacy policy or our practices, please contact us:

**${config.company.name}**
${config.company.address}
Email: ${config.company.email}
${config.company.phone ? `Phone: ${config.company.phone}` : ''}
${config.company.dpo ? `\nData Protection Officer: ${config.company.dpo.name}\nEmail: ${config.company.dpo.email}` : ''}
    `.trim();
  }
}

// Full policy template
const POLICY_TEMPLATE = `
# Privacy Policy

**Effective Date:** {{formatDate effectiveDate}}
**Version:** {{version}}

{{company.name}} ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website {{company.website}} and use our services.

---

## Table of Contents
1. [Information We Collect](#information-we-collect)
2. [How We Use Your Information](#how-we-use-your-information)
3. [Sharing Your Information](#sharing-your-information)
4. [Cookies and Tracking](#cookies-and-tracking)
5. [Your Rights](#your-rights)
6. [Data Security](#data-security)
7. [Data Retention](#data-retention)
8. [International Transfers](#international-transfers)
9. [Children's Privacy](#childrens-privacy)
10. [Changes to This Policy](#changes-to-this-policy)
11. [Contact Us](#contact-us)

---

## Information We Collect

### Information You Provide
{{#each practices.dataTypes}}
- **{{this}}**: {{dataTypeDescription this}}
{{/each}}

### Information Collected Automatically
We automatically collect certain information when you access our services, including device information, log data, and usage patterns.

---

## How We Use Your Information

{{#each practices.purposes}}
### {{purpose}}
{{description}}

**Legal Basis:** {{legalBasisExplanation legalBasis}}

{{/each}}

---

## Sharing Your Information

{{#each practices.thirdPartySharing}}
### {{category}}
{{purpose}}
{{/each}}

We do not sell your personal information.

---

## Cookies and Tracking

{{#if practices.cookies.uses}}
We use the following types of cookies:
{{#each practices.cookies.types}}
- {{this}} cookies
{{/each}}
{{else}}
We do not use cookies on our website.
{{/if}}

---

## Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion
- Data portability
- Object to processing
- Restrict processing

{{#if jurisdiction.includeGDPR}}
### GDPR Rights (EU/EEA Residents)
You have additional rights under GDPR including the right to lodge a complaint with a supervisory authority.
{{/if}}

{{#if jurisdiction.includeCCPA}}
### CCPA Rights (California Residents)
You have the right to know, delete, opt-out of sale, and non-discrimination.
{{/if}}

---

## Data Security

We implement appropriate technical and organizational security measures to protect your data.

---

## Data Retention

{{#each practices.retentionPeriods}}
- **{{dataType}}**: {{period}} ({{criteria}})
{{/each}}

---

{{#if practices.internationalTransfers}}
## International Transfers

Your data may be transferred internationally. We use appropriate safeguards including:
{{#each practices.transferMechanisms}}
- {{this}}
{{/each}}
{{/if}}

---

## Children's Privacy

{{#if practices.childrenData}}
We may collect data from children with parental consent.
{{else}}
Our services are not intended for children under {{practices.minAge}}.
{{/if}}

---

## Changes to This Policy

We may update this policy periodically. Check the effective date for the latest version.

---

## Contact Us

**{{company.name}}**
{{company.address}}
Email: {{company.email}}
{{#if company.phone}}Phone: {{company.phone}}{{/if}}
{{#if company.dpo}}
Data Protection Officer: {{company.dpo.name}}
DPO Email: {{company.dpo.email}}
{{/if}}
`.trim();
```

## Usage Example

```typescript
import { PrivacyPolicyGenerator, PolicyConfig } from './privacy/policy-generator';

const generator = new PrivacyPolicyGenerator();

const config: PolicyConfig = {
  company: {
    name: 'Example Corp',
    legalName: 'Example Corporation Inc.',
    address: '123 Main St, San Francisco, CA 94102',
    country: 'United States',
    email: 'privacy@example.com',
    phone: '1-800-555-1234',
    website: 'https://example.com',
    dpo: {
      name: 'Jane Smith',
      email: 'dpo@example.com',
    },
  },
  practices: {
    collectsPersonalData: true,
    dataTypes: ['name', 'email', 'phone', 'usage_data', 'cookies', 'device_info'],
    collectionMethods: ['direct', 'automatic'],
    purposes: [
      {
        purpose: 'Service Delivery',
        legalBasis: 'contract',
        description: 'To provide and maintain our services',
      },
      {
        purpose: 'Analytics',
        legalBasis: 'legitimate_interests',
        description: 'To analyze and improve our services',
      },
      {
        purpose: 'Marketing',
        legalBasis: 'consent',
        description: 'To send promotional communications',
      },
    ],
    retentionPeriods: [
      { dataType: 'Account data', period: 'Duration of account + 3 years', criteria: 'Legal requirements' },
      { dataType: 'Usage logs', period: '90 days', criteria: 'Operational needs' },
    ],
    thirdPartySharing: [
      { category: 'Service Providers', purpose: 'To help operate our services', types: ['hosting', 'analytics'] },
      { category: 'Legal Requirements', purpose: 'When required by law', types: ['government', 'courts'] },
    ],
    internationalTransfers: true,
    transferMechanisms: ['Standard Contractual Clauses', 'Privacy Shield certification'],
    automatedDecisionMaking: false,
    cookies: {
      uses: true,
      types: ['essential', 'functional', 'analytics'],
      thirdPartyCookies: true,
      cookiePolicy: '/cookie-policy',
    },
    childrenData: false,
    minAge: 13,
  },
  jurisdiction: {
    jurisdiction: 'global',
    includeGDPR: true,
    includeCCPA: true,
    includeUKGDPR: true,
    includeAPP: false,
    includePIPEDA: false,
  },
  effectiveDate: new Date(),
  version: '1.0',
  language: 'en',
};

const policy = generator.generate(config);
console.log(policy);
```

## CLAUDE.md Integration

```markdown
## Privacy Policy Generation

This project includes a privacy policy generator.

### Usage
```typescript
import { PrivacyPolicyGenerator } from './privacy/policy-generator';
const generator = new PrivacyPolicyGenerator();
const policy = generator.generate(config);
```

### Configuration
- Company information
- Data practices and types
- Jurisdiction requirements
- Retention periods

### Output Formats
- Markdown
- HTML (with styling)
- PDF (via external tool)
```

## AI Suggestions

1. **Add multi-language support** - Generate policies in multiple languages
2. **Implement version control** - Track policy changes over time
3. **Add consent integration** - Link to consent management
4. **Create policy comparison** - Compare versions
5. **Add regulatory updates** - Auto-update for new regulations
6. **Implement accessibility** - WCAG-compliant output
7. **Add policy testing** - Validate completeness
8. **Create API integration** - Dynamic policy serving
9. **Add analytics tracking** - Policy view metrics
10. **Implement digital signatures** - Signed policy versions
