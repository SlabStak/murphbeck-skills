# Terms of Service Generator Template

Dynamic terms of service generation with customization for service type, jurisdiction, and business model.

## Overview

This template provides a flexible terms of service generator that creates legally-informed agreements adapted to your business model, service type, and regulatory requirements.

## Quick Start

```bash
npm install handlebars date-fns
npm install -D typescript @types/node
```

## Terms of Service Framework

```typescript
// src/legal/tos-generator.ts
import Handlebars from 'handlebars';

// Company information
export interface CompanyInfo {
  name: string;
  legalName: string;
  jurisdiction: string;
  address: string;
  email: string;
  website: string;
}

// Service configuration
export interface ServiceConfig {
  type: 'saas' | 'marketplace' | 'ecommerce' | 'social' | 'api' | 'mobile_app';
  name: string;
  description: string;
  freeTier: boolean;
  paidPlans: boolean;
  trialPeriod?: number;
  subscriptionBased: boolean;
  userContent: boolean;
  apiAccess: boolean;
}

// User types
export interface UserConfig {
  requiresAccount: boolean;
  minimumAge: number;
  businessUsers: boolean;
  verificationRequired: boolean;
  allowedCountries?: string[];
  restrictedCountries?: string[];
}

// Payment configuration
export interface PaymentConfig {
  acceptsPayments: boolean;
  currencies: string[];
  paymentMethods: ('credit_card' | 'paypal' | 'bank_transfer' | 'crypto')[];
  recurringBilling: boolean;
  refundPolicy: 'no_refunds' | '7_days' | '14_days' | '30_days' | 'prorated' | 'custom';
  customRefundPolicy?: string;
  autoRenewal: boolean;
  priceChangeNotice: number; // days
}

// Content policy
export interface ContentPolicy {
  userGeneratedContent: boolean;
  contentModeration: boolean;
  dmcaCompliance: boolean;
  prohibitedContent: string[];
  contentLicense: 'all_rights' | 'limited_license' | 'creative_commons';
  contentOwnership: 'user_owns' | 'platform_owns' | 'shared';
}

// Liability configuration
export interface LiabilityConfig {
  warrantyDisclaimer: boolean;
  limitationOfLiability: boolean;
  liabilityCapType: 'fees_paid' | 'fixed_amount' | 'unlimited';
  liabilityCapAmount?: number;
  indemnification: boolean;
  forceMajeure: boolean;
}

// Dispute resolution
export interface DisputeConfig {
  method: 'arbitration' | 'litigation' | 'mediation_first';
  jurisdiction: string;
  governingLaw: string;
  classActionWaiver: boolean;
  smallClaimsException: boolean;
  arbitrationProvider?: string;
}

// Terms configuration
export interface TermsConfig {
  company: CompanyInfo;
  service: ServiceConfig;
  users: UserConfig;
  payments?: PaymentConfig;
  content: ContentPolicy;
  liability: LiabilityConfig;
  disputes: DisputeConfig;
  effectiveDate: Date;
  version: string;
}

// Terms of Service Generator
export class TermsOfServiceGenerator {
  private template: Handlebars.TemplateDelegate;

  constructor() {
    this.registerHelpers();
    this.template = Handlebars.compile(TOS_TEMPLATE);
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    Handlebars.registerHelper('upper', (str: string) => str.toUpperCase());

    Handlebars.registerHelper('if_eq', function (this: any, a: any, b: any, options: any) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('if_includes', function (this: any, arr: any[], val: any, options: any) {
      return arr && arr.includes(val) ? options.fn(this) : options.inverse(this);
    });
  }

  generate(config: TermsConfig): string {
    return this.template(config);
  }

  // Generate individual sections
  generateSection(config: TermsConfig, section: string): string {
    const sections: Record<string, (c: TermsConfig) => string> = {
      acceptance: this.generateAcceptance,
      eligibility: this.generateEligibility,
      accounts: this.generateAccounts,
      services: this.generateServices,
      payments: this.generatePayments,
      content: this.generateContent,
      prohibited: this.generateProhibited,
      intellectualProperty: this.generateIP,
      privacy: this.generatePrivacy,
      disclaimer: this.generateDisclaimer,
      limitation: this.generateLimitation,
      indemnification: this.generateIndemnification,
      termination: this.generateTermination,
      disputes: this.generateDisputes,
      changes: this.generateChanges,
      miscellaneous: this.generateMiscellaneous,
      contact: this.generateContact,
    };

    return sections[section]?.(config) || '';
  }

  private generateAcceptance(config: TermsConfig): string {
    return `
## 1. Acceptance of Terms

By accessing or using ${config.service.name} (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.

These Terms constitute a legally binding agreement between you and ${config.company.legalName} ("Company," "we," "us," or "our").

We may update these Terms from time to time. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
    `.trim();
  }

  private generateEligibility(config: TermsConfig): string {
    let section = `
## 2. Eligibility

To use the Service, you must:
- Be at least ${config.users.minimumAge} years of age
- Have the legal capacity to enter into binding agreements
    `;

    if (config.users.businessUsers) {
      section += `- If using on behalf of an organization, have authority to bind that organization\n`;
    }

    if (config.users.restrictedCountries?.length) {
      section += `\nThe Service is not available in: ${config.users.restrictedCountries.join(', ')}\n`;
    }

    return section.trim();
  }

  private generateAccounts(config: TermsConfig): string {
    if (!config.users.requiresAccount) {
      return '';
    }

    return `
## 3. User Accounts

### 3.1 Account Creation
To access certain features, you must create an account. You agree to:
- Provide accurate and complete information
- Keep your login credentials confidential
- Notify us immediately of unauthorized access
- Be responsible for all activity under your account

### 3.2 Account Security
You are solely responsible for maintaining the confidentiality of your account credentials. We are not liable for any loss or damage from unauthorized access to your account.

${config.users.verificationRequired ? `### 3.3 Verification
We may require verification of your identity or eligibility to use certain features.` : ''}
    `.trim();
  }

  private generateServices(config: TermsConfig): string {
    let section = `
## 4. The Service

### 4.1 Description
${config.service.description}

### 4.2 Service Availability
We strive to provide reliable service but do not guarantee uninterrupted access. We may modify, suspend, or discontinue any part of the Service at any time.
    `;

    if (config.service.freeTier) {
      section += `
### 4.3 Free Tier
We offer a free tier with limited features. We reserve the right to modify or discontinue free features at any time.
      `;
    }

    if (config.service.apiAccess) {
      section += `
### 4.4 API Access
API access is subject to additional terms including rate limits and usage restrictions. API access may be revoked for misuse.
      `;
    }

    return section.trim();
  }

  private generatePayments(config: TermsConfig): string {
    if (!config.payments?.acceptsPayments) {
      return '';
    }

    let section = `
## 5. Payments and Billing

### 5.1 Fees
Certain features require payment. Current pricing is available on our website. All fees are in ${config.payments.currencies[0]} unless otherwise specified.

### 5.2 Payment Methods
We accept: ${config.payments.paymentMethods.join(', ')}

### 5.3 Billing
${config.payments.recurringBilling ? 'Subscriptions are billed on a recurring basis until cancelled.' : 'Payments are due at the time of purchase.'}
    `;

    if (config.payments.autoRenewal) {
      section += `
### 5.4 Auto-Renewal
Your subscription will automatically renew unless you cancel before the renewal date. You authorize us to charge your payment method for renewal fees.
      `;
    }

    section += `
### 5.${config.payments.autoRenewal ? '5' : '4'} Refunds
${this.getRefundPolicy(config.payments)}

### 5.${config.payments.autoRenewal ? '6' : '5'} Price Changes
We may change our prices with ${config.payments.priceChangeNotice} days' notice. Price changes will not affect current billing periods.
    `;

    return section.trim();
  }

  private getRefundPolicy(payments: PaymentConfig): string {
    const policies: Record<string, string> = {
      no_refunds: 'All sales are final. No refunds will be provided.',
      '7_days': 'You may request a full refund within 7 days of purchase.',
      '14_days': 'You may request a full refund within 14 days of purchase.',
      '30_days': 'You may request a full refund within 30 days of purchase.',
      prorated: 'Cancelled subscriptions receive a prorated refund for unused time.',
      custom: payments.customRefundPolicy || 'See our refund policy.',
    };
    return policies[payments.refundPolicy];
  }

  private generateContent(config: TermsConfig): string {
    if (!config.content.userGeneratedContent) {
      return '';
    }

    let section = `
## 6. User Content

### 6.1 Your Content
You may submit content to the Service ("User Content"). You are solely responsible for your User Content.

### 6.2 Ownership
${this.getOwnershipText(config.content)}

### 6.3 License Grant
By submitting User Content, you grant us ${this.getLicenseText(config.content)}

### 6.4 Content Standards
Your User Content must not:
${config.content.prohibitedContent.map((p) => `- ${p}`).join('\n')}

### 6.5 Content Removal
We reserve the right to remove any User Content that violates these Terms.
    `;

    if (config.content.dmcaCompliance) {
      section += `
### 6.6 DMCA Compliance
We respect intellectual property rights. To report copyright infringement, contact our designated agent at ${config.company.email}.
      `;
    }

    return section.trim();
  }

  private getOwnershipText(content: ContentPolicy): string {
    const texts: Record<string, string> = {
      user_owns: 'You retain all ownership rights to your User Content.',
      platform_owns: 'By submitting User Content, you transfer all rights to us.',
      shared: 'You retain ownership but grant us certain rights as described below.',
    };
    return texts[content.contentOwnership];
  }

  private getLicenseText(content: ContentPolicy): string {
    const texts: Record<string, string> = {
      all_rights: 'a perpetual, irrevocable, worldwide, royalty-free license to use, reproduce, modify, and distribute your User Content.',
      limited_license: 'a non-exclusive license to display and distribute your User Content in connection with the Service.',
      creative_commons: 'a Creative Commons license as specified in your content settings.',
    };
    return texts[content.contentLicense];
  }

  private generateProhibited(config: TermsConfig): string {
    return `
## 7. Prohibited Conduct

You agree not to:
- Violate any applicable laws or regulations
- Infringe on intellectual property rights
- Transmit malware or harmful code
- Attempt to gain unauthorized access to systems
- Harass, abuse, or harm others
- Use the Service for illegal purposes
- Interfere with the Service's operation
- Create multiple accounts to circumvent restrictions
- Resell or redistribute the Service without authorization
- Scrape or collect data without permission
    `.trim();
  }

  private generateIP(config: TermsConfig): string {
    return `
## 8. Intellectual Property

### 8.1 Our Property
The Service, including all content, features, and functionality, is owned by ${config.company.name} and protected by intellectual property laws.

### 8.2 Trademarks
Our trademarks and trade dress may not be used without prior written permission.

### 8.3 Feedback
Any feedback you provide may be used by us without obligation to you.
    `.trim();
  }

  private generatePrivacy(config: TermsConfig): string {
    return `
## 9. Privacy

Your use of the Service is subject to our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy at ${config.company.website}/privacy.
    `.trim();
  }

  private generateDisclaimer(config: TermsConfig): string {
    if (!config.liability.warrantyDisclaimer) {
      return '';
    }

    return `
## 10. Disclaimer of Warranties

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. YOUR USE OF THE SERVICE IS AT YOUR OWN RISK.
    `.trim();
  }

  private generateLimitation(config: TermsConfig): string {
    if (!config.liability.limitationOfLiability) {
      return '';
    }

    let capText = '';
    switch (config.liability.liabilityCapType) {
      case 'fees_paid':
        capText = 'the total fees paid by you to us in the twelve months preceding the claim';
        break;
      case 'fixed_amount':
        capText = `$${config.liability.liabilityCapAmount}`;
        break;
      case 'unlimited':
        capText = 'actual damages';
        break;
    }

    return `
## 11. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${config.company.name.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL.

OUR TOTAL LIABILITY SHALL NOT EXCEED ${capText.toUpperCase()}.

SOME JURISDICTIONS DO NOT ALLOW THESE LIMITATIONS, SO THEY MAY NOT APPLY TO YOU.
    `.trim();
  }

  private generateIndemnification(config: TermsConfig): string {
    if (!config.liability.indemnification) {
      return '';
    }

    return `
## 12. Indemnification

You agree to indemnify, defend, and hold harmless ${config.company.name}, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:
- Your use of the Service
- Your violation of these Terms
- Your violation of any third-party rights
- Your User Content
    `.trim();
  }

  private generateTermination(config: TermsConfig): string {
    return `
## 13. Termination

### 13.1 By You
You may terminate your account at any time by following the instructions in the Service.

### 13.2 By Us
We may suspend or terminate your access immediately if you violate these Terms or for any other reason with or without notice.

### 13.3 Effect of Termination
Upon termination:
- Your right to use the Service ceases immediately
- We may delete your data in accordance with our data retention policy
- Provisions that should survive (such as limitations of liability) will continue
    `.trim();
  }

  private generateDisputes(config: TermsConfig): string {
    let section = `
## 14. Dispute Resolution

### 14.1 Governing Law
These Terms are governed by the laws of ${config.disputes.governingLaw}.
    `;

    if (config.disputes.method === 'arbitration') {
      section += `
### 14.2 Arbitration
Any disputes shall be resolved through binding arbitration${config.disputes.arbitrationProvider ? ` administered by ${config.disputes.arbitrationProvider}` : ''} in ${config.disputes.jurisdiction}.

${config.disputes.classActionWaiver ? 'YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS.' : ''}
${config.disputes.smallClaimsException ? 'Either party may bring claims in small claims court.' : ''}
      `;
    } else if (config.disputes.method === 'litigation') {
      section += `
### 14.2 Jurisdiction
Any disputes shall be resolved in the courts of ${config.disputes.jurisdiction}. You consent to personal jurisdiction in these courts.
      `;
    } else {
      section += `
### 14.2 Mediation
Before filing any legal claim, you agree to first attempt resolution through mediation.
      `;
    }

    return section.trim();
  }

  private generateChanges(config: TermsConfig): string {
    return `
## 15. Changes to Terms

We may modify these Terms at any time. Material changes will be communicated through the Service or via email. Your continued use after changes constitutes acceptance.
    `.trim();
  }

  private generateMiscellaneous(config: TermsConfig): string {
    let section = `
## 16. Miscellaneous

### 16.1 Entire Agreement
These Terms constitute the entire agreement between you and us regarding the Service.

### 16.2 Severability
If any provision is found unenforceable, the remaining provisions remain in effect.

### 16.3 Waiver
Failure to enforce any right does not waive that right.

### 16.4 Assignment
You may not assign these Terms. We may assign them freely.
    `;

    if (config.liability.forceMajeure) {
      section += `
### 16.5 Force Majeure
We are not liable for delays or failures due to circumstances beyond our reasonable control.
      `;
    }

    return section.trim();
  }

  private generateContact(config: TermsConfig): string {
    return `
## 17. Contact Information

For questions about these Terms, contact us at:

**${config.company.name}**
${config.company.address}
Email: ${config.company.email}
Website: ${config.company.website}
    `.trim();
  }
}

// Full TOS template
const TOS_TEMPLATE = `
# Terms of Service

**Effective Date:** {{formatDate effectiveDate}}
**Version:** {{version}}

---

## 1. Acceptance of Terms

By accessing or using {{service.name}} (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.

---

## 2. Eligibility

You must be at least {{users.minimumAge}} years old to use this Service.

---

{{#if users.requiresAccount}}
## 3. User Accounts

You are responsible for maintaining account security and all activity under your account.
{{/if}}

---

## 4. The Service

{{service.description}}

---

{{#if payments.acceptsPayments}}
## 5. Payments

Fees are charged as described on our pricing page. {{#if payments.recurringBilling}}Subscriptions renew automatically.{{/if}}
{{/if}}

---

{{#if content.userGeneratedContent}}
## 6. User Content

You retain ownership of your content but grant us a license to use it in connection with the Service.
{{/if}}

---

## 7. Prohibited Conduct

You agree not to misuse the Service or violate applicable laws.

---

## 8. Intellectual Property

The Service and its content are owned by {{company.name}}.

---

## 9. Privacy

Your use is subject to our Privacy Policy.

---

{{#if liability.warrantyDisclaimer}}
## 10. Disclaimer

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES.
{{/if}}

---

{{#if liability.limitationOfLiability}}
## 11. Limitation of Liability

Our liability is limited as permitted by law.
{{/if}}

---

## 12. Termination

Either party may terminate the relationship as described herein.

---

## 13. Dispute Resolution

Disputes are governed by {{disputes.governingLaw}} law.

---

## 14. Contact

{{company.name}}
{{company.email}}
`.trim();
```

## Usage Example

```typescript
import { TermsOfServiceGenerator, TermsConfig } from './legal/tos-generator';

const generator = new TermsOfServiceGenerator();

const config: TermsConfig = {
  company: {
    name: 'Example SaaS',
    legalName: 'Example SaaS Inc.',
    jurisdiction: 'Delaware, USA',
    address: '123 Tech Street, San Francisco, CA',
    email: 'legal@example.com',
    website: 'https://example.com',
  },
  service: {
    type: 'saas',
    name: 'Example Platform',
    description: 'A cloud-based productivity platform',
    freeTier: true,
    paidPlans: true,
    trialPeriod: 14,
    subscriptionBased: true,
    userContent: true,
    apiAccess: true,
  },
  users: {
    requiresAccount: true,
    minimumAge: 16,
    businessUsers: true,
    verificationRequired: false,
  },
  payments: {
    acceptsPayments: true,
    currencies: ['USD', 'EUR'],
    paymentMethods: ['credit_card', 'paypal'],
    recurringBilling: true,
    refundPolicy: '30_days',
    autoRenewal: true,
    priceChangeNotice: 30,
  },
  content: {
    userGeneratedContent: true,
    contentModeration: true,
    dmcaCompliance: true,
    prohibitedContent: ['Illegal content', 'Harassment', 'Spam', 'Malware'],
    contentLicense: 'limited_license',
    contentOwnership: 'user_owns',
  },
  liability: {
    warrantyDisclaimer: true,
    limitationOfLiability: true,
    liabilityCapType: 'fees_paid',
    indemnification: true,
    forceMajeure: true,
  },
  disputes: {
    method: 'arbitration',
    jurisdiction: 'San Francisco, California',
    governingLaw: 'California',
    classActionWaiver: true,
    smallClaimsException: true,
    arbitrationProvider: 'JAMS',
  },
  effectiveDate: new Date(),
  version: '1.0',
};

const terms = generator.generate(config);
console.log(terms);
```

## CLAUDE.md Integration

```markdown
## Terms of Service Generation

Generate customized Terms of Service documents.

### Usage
```typescript
const generator = new TermsOfServiceGenerator();
const terms = generator.generate(config);
```

### Service Types
- SaaS, Marketplace, E-commerce
- Social, API, Mobile App

### Customization
- Payment and billing terms
- User content policies
- Dispute resolution
- Liability limitations
```

## AI Suggestions

1. **Add jurisdiction-specific clauses** - Auto-include required disclosures
2. **Implement clause library** - Reusable legal clauses
3. **Add comparison tool** - Compare TOS versions
4. **Create readability scoring** - Plain language assessment
5. **Add legal review workflow** - Attorney approval process
6. **Implement clause highlighting** - Important terms emphasis
7. **Add translation support** - Multi-language generation
8. **Create amendment tracking** - Change history
9. **Add user acceptance tracking** - Consent records
10. **Implement A/B testing** - Test clause variations
