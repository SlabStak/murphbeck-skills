# Tax Calculation Template

A comprehensive tax calculation system supporting sales tax, VAT, GST with multiple provider integrations (TaxJar, Avalara, Stripe Tax).

## Installation

```bash
npm install taxjar avalara-sdk zod
```

## Environment Variables

```env
# TaxJar
TAXJAR_API_KEY=...
TAXJAR_SANDBOX=true

# Avalara (AvaTax)
AVALARA_ACCOUNT_ID=...
AVALARA_LICENSE_KEY=...
AVALARA_COMPANY_CODE=DEFAULT
AVALARA_ENVIRONMENT=sandbox

# Stripe Tax
STRIPE_SECRET_KEY=sk_test_...

# Default Settings
DEFAULT_TAX_PROVIDER=taxjar
TAX_ENABLED=true
TAX_INCLUDED_IN_PRICE=false
```

## Project Structure

```
lib/
├── tax/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions
│   ├── calculator.ts         # Tax calculation logic
│   ├── providers/
│   │   ├── base.ts           # Base provider interface
│   │   ├── taxjar.ts         # TaxJar integration
│   │   ├── avalara.ts        # Avalara AvaTax
│   │   ├── stripe.ts         # Stripe Tax
│   │   └── manual.ts         # Manual tax rates
│   ├── nexus.ts              # Nexus management
│   ├── exemptions.ts         # Tax exemptions
│   ├── rates.ts              # Tax rate lookup
│   └── reporting.ts          # Tax reporting
components/
├── tax/
│   ├── TaxSummary.tsx        # Tax breakdown display
│   ├── TaxExemptForm.tsx     # Tax exemption form
│   ├── NexusSettings.tsx     # Nexus configuration
│   └── TaxReport.tsx         # Tax reporting
app/
├── api/
│   └── tax/
│       ├── calculate/
│       │   └── route.ts      # Calculate tax
│       ├── validate/
│       │   └── route.ts      # Validate tax ID
│       └── rates/
│           └── route.ts      # Get tax rates
```

## Type Definitions

```typescript
// lib/tax/types.ts
export type TaxProvider = 'taxjar' | 'avalara' | 'stripe' | 'manual';

export type TaxType = 'sales_tax' | 'vat' | 'gst' | 'hst' | 'pst' | 'qst';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface TaxLineItem {
  id: string;
  productId?: string;
  sku?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxCode?: string;
  isTaxable?: boolean;
  discount?: number;
}

export interface TaxCalculationRequest {
  fromAddress: Address;
  toAddress: Address;
  lineItems: TaxLineItem[];
  shippingAmount?: number;
  customerId?: string;
  customerTaxExempt?: boolean;
  exemptionCertificate?: string;
  currency?: string;
  transactionDate?: Date;
  transactionId?: string;
  documentType?: 'order' | 'invoice' | 'return';
}

export interface TaxBreakdown {
  jurisdiction: string;
  jurisdictionType: 'country' | 'state' | 'county' | 'city' | 'district';
  taxType: TaxType;
  taxName: string;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
}

export interface TaxCalculationResult {
  success: boolean;
  transactionId?: string;
  fromAddress: Address;
  toAddress: Address;
  totalTaxableAmount: number;
  totalExemptAmount: number;
  totalTax: number;
  shippingTax: number;
  breakdown: TaxBreakdown[];
  lineItems: TaxLineItemResult[];
  currency: string;
  provider: TaxProvider;
  calculatedAt: Date;
  error?: string;
}

export interface TaxLineItemResult extends TaxLineItem {
  taxableAmount: number;
  exemptAmount: number;
  taxAmount: number;
  taxRate: number;
  taxBreakdown: TaxBreakdown[];
}

export interface TaxRate {
  country: string;
  state?: string;
  county?: string;
  city?: string;
  postalCode?: string;
  combinedRate: number;
  stateRate: number;
  countyRate: number;
  cityRate: number;
  specialRate: number;
  freightTaxable: boolean;
}

export interface NexusLocation {
  id: string;
  country: string;
  state?: string;
  address?: Address;
  effectiveDate: Date;
  endDate?: Date;
  registrationNumber?: string;
  filingFrequency?: 'monthly' | 'quarterly' | 'annually';
}

export interface TaxExemption {
  id: string;
  customerId: string;
  certificateNumber: string;
  certificateType: 'resale' | 'government' | 'nonprofit' | 'other';
  issuingState: string;
  states: string[];
  validFrom: Date;
  validUntil?: Date;
  documentUrl?: string;
  verified: boolean;
}

export interface TaxValidationResult {
  valid: boolean;
  taxId: string;
  taxIdType: 'vat' | 'ein' | 'gst' | 'abn';
  country: string;
  companyName?: string;
  address?: string;
  validatedAt: Date;
}
```

## Base Tax Provider

```typescript
// lib/tax/providers/base.ts
import type {
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxRate,
  TaxValidationResult,
  Address,
  TaxProvider,
} from '../types';

export abstract class BaseTaxProvider {
  abstract readonly name: TaxProvider;

  abstract calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult>;

  abstract getTaxRate(address: Address): Promise<TaxRate>;

  abstract validateTaxId(taxId: string, country?: string): Promise<TaxValidationResult>;

  abstract commitTransaction(transactionId: string): Promise<boolean>;

  abstract voidTransaction(transactionId: string): Promise<boolean>;

  abstract refundTransaction(
    transactionId: string,
    amount?: number
  ): Promise<TaxCalculationResult>;

  protected formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  protected roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
```

## TaxJar Provider

```typescript
// lib/tax/providers/taxjar.ts
import TaxJar from 'taxjar';
import { BaseTaxProvider } from './base';
import type {
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxRate,
  TaxValidationResult,
  Address,
  TaxBreakdown,
  TaxLineItemResult,
} from '../types';

export class TaxJarProvider extends BaseTaxProvider {
  readonly name = 'taxjar' as const;
  private client: TaxJar;

  constructor(apiKey?: string) {
    super();
    this.client = new TaxJar({
      apiKey: apiKey || process.env.TAXJAR_API_KEY!,
      apiUrl: process.env.TAXJAR_SANDBOX === 'true'
        ? TaxJar.SANDBOX_API_URL
        : TaxJar.DEFAULT_API_URL,
    });
  }

  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    try {
      const lineItems = request.lineItems.map((item, index) => ({
        id: item.id || String(index),
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount || 0,
        product_tax_code: item.taxCode || '',
      }));

      const taxParams: TaxJar.TaxParams = {
        from_country: request.fromAddress.country,
        from_zip: request.fromAddress.postalCode,
        from_state: request.fromAddress.state,
        from_city: request.fromAddress.city,
        from_street: request.fromAddress.line1,
        to_country: request.toAddress.country,
        to_zip: request.toAddress.postalCode,
        to_state: request.toAddress.state,
        to_city: request.toAddress.city,
        to_street: request.toAddress.line1,
        shipping: request.shippingAmount || 0,
        line_items: lineItems,
      };

      if (request.customerId) {
        taxParams.customer_id = request.customerId;
      }

      if (request.exemptionCertificate) {
        taxParams.exemption_type = 'other';
      }

      const response = await this.client.taxForOrder(taxParams);
      const { tax } = response;

      // Build breakdown
      const breakdown: TaxBreakdown[] = [];

      if (tax.breakdown) {
        if (tax.breakdown.state_taxable_amount > 0) {
          breakdown.push({
            jurisdiction: request.toAddress.state,
            jurisdictionType: 'state',
            taxType: 'sales_tax',
            taxName: 'State Tax',
            taxableAmount: tax.breakdown.state_taxable_amount,
            taxRate: tax.breakdown.state_tax_rate,
            taxAmount: tax.breakdown.state_tax_collectable,
          });
        }

        if (tax.breakdown.county_taxable_amount > 0) {
          breakdown.push({
            jurisdiction: 'County',
            jurisdictionType: 'county',
            taxType: 'sales_tax',
            taxName: 'County Tax',
            taxableAmount: tax.breakdown.county_taxable_amount,
            taxRate: tax.breakdown.county_tax_rate,
            taxAmount: tax.breakdown.county_tax_collectable,
          });
        }

        if (tax.breakdown.city_taxable_amount > 0) {
          breakdown.push({
            jurisdiction: request.toAddress.city,
            jurisdictionType: 'city',
            taxType: 'sales_tax',
            taxName: 'City Tax',
            taxableAmount: tax.breakdown.city_taxable_amount,
            taxRate: tax.breakdown.city_tax_rate,
            taxAmount: tax.breakdown.city_tax_collectable,
          });
        }

        if (tax.breakdown.special_district_taxable_amount > 0) {
          breakdown.push({
            jurisdiction: 'Special District',
            jurisdictionType: 'district',
            taxType: 'sales_tax',
            taxName: 'Special Tax',
            taxableAmount: tax.breakdown.special_district_taxable_amount,
            taxRate: tax.breakdown.special_tax_rate,
            taxAmount: tax.breakdown.special_district_tax_collectable,
          });
        }
      }

      // Build line item results
      const lineItemResults: TaxLineItemResult[] = request.lineItems.map((item, index) => {
        const lineBreakdown = tax.breakdown?.line_items?.[index];
        return {
          ...item,
          taxableAmount: lineBreakdown?.taxable_amount || item.amount,
          exemptAmount: 0,
          taxAmount: lineBreakdown?.tax_collectable || 0,
          taxRate: tax.rate,
          taxBreakdown: [],
        };
      });

      return {
        success: true,
        fromAddress: request.fromAddress,
        toAddress: request.toAddress,
        totalTaxableAmount: tax.taxable_amount,
        totalExemptAmount: tax.exempt_amount || 0,
        totalTax: this.roundToTwoDecimals(tax.amount_to_collect),
        shippingTax: tax.freight_taxable ? (request.shippingAmount || 0) * tax.rate : 0,
        breakdown,
        lineItems: lineItemResults,
        currency: 'USD',
        provider: this.name,
        calculatedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        fromAddress: request.fromAddress,
        toAddress: request.toAddress,
        totalTaxableAmount: 0,
        totalExemptAmount: 0,
        totalTax: 0,
        shippingTax: 0,
        breakdown: [],
        lineItems: [],
        currency: 'USD',
        provider: this.name,
        calculatedAt: new Date(),
        error: this.formatError(error),
      };
    }
  }

  async getTaxRate(address: Address): Promise<TaxRate> {
    try {
      const response = await this.client.ratesForLocation(address.postalCode, {
        country: address.country,
        state: address.state,
        city: address.city,
        street: address.line1,
      });

      return {
        country: response.rate.country,
        state: response.rate.state,
        county: response.rate.county,
        city: response.rate.city,
        postalCode: address.postalCode,
        combinedRate: response.rate.combined_rate,
        stateRate: response.rate.state_rate,
        countyRate: response.rate.county_rate,
        cityRate: response.rate.city_rate,
        specialRate: response.rate.combined_district_rate,
        freightTaxable: response.rate.freight_taxable,
      };
    } catch (error) {
      throw new Error(`Failed to get tax rate: ${this.formatError(error)}`);
    }
  }

  async validateTaxId(taxId: string, country: string = 'EU'): Promise<TaxValidationResult> {
    try {
      const response = await this.client.validate({
        vat: taxId,
      });

      return {
        valid: response.validation.valid,
        taxId,
        taxIdType: 'vat',
        country,
        companyName: response.validation.name || undefined,
        address: response.validation.address || undefined,
        validatedAt: new Date(),
      };
    } catch (error) {
      return {
        valid: false,
        taxId,
        taxIdType: 'vat',
        country,
        validatedAt: new Date(),
      };
    }
  }

  async commitTransaction(transactionId: string): Promise<boolean> {
    // TaxJar auto-commits, this is a no-op
    return true;
  }

  async voidTransaction(transactionId: string): Promise<boolean> {
    try {
      await this.client.deleteOrder(transactionId);
      return true;
    } catch (error) {
      console.error('Failed to void transaction:', error);
      return false;
    }
  }

  async refundTransaction(
    transactionId: string,
    amount?: number
  ): Promise<TaxCalculationResult> {
    try {
      const response = await this.client.createRefund({
        transaction_id: `${transactionId}-refund`,
        transaction_reference_id: transactionId,
        transaction_date: new Date().toISOString().split('T')[0],
        amount: amount || 0,
      });

      return {
        success: true,
        transactionId: response.refund.transaction_id,
        fromAddress: {} as Address,
        toAddress: {} as Address,
        totalTaxableAmount: response.refund.amount,
        totalExemptAmount: 0,
        totalTax: response.refund.sales_tax,
        shippingTax: 0,
        breakdown: [],
        lineItems: [],
        currency: 'USD',
        provider: this.name,
        calculatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to create refund: ${this.formatError(error)}`);
    }
  }

  // TaxJar-specific methods
  async createOrder(
    request: TaxCalculationRequest,
    orderId: string
  ): Promise<void> {
    const lineItems = request.lineItems.map((item, index) => ({
      id: item.id || String(index),
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount: item.discount || 0,
      product_tax_code: item.taxCode || '',
      sales_tax: 0, // Will be calculated
    }));

    await this.client.createOrder({
      transaction_id: orderId,
      transaction_date: new Date().toISOString().split('T')[0],
      from_country: request.fromAddress.country,
      from_zip: request.fromAddress.postalCode,
      from_state: request.fromAddress.state,
      from_city: request.fromAddress.city,
      from_street: request.fromAddress.line1,
      to_country: request.toAddress.country,
      to_zip: request.toAddress.postalCode,
      to_state: request.toAddress.state,
      to_city: request.toAddress.city,
      to_street: request.toAddress.line1,
      shipping: request.shippingAmount || 0,
      line_items: lineItems,
      amount: request.lineItems.reduce((sum, item) => sum + item.amount, 0),
      sales_tax: 0, // Will be filled after calculation
    });
  }

  async getNexusRegions(): Promise<{ country: string; state: string }[]> {
    try {
      const response = await this.client.nexusRegions();
      return response.regions.map((region: any) => ({
        country: region.country_code,
        state: region.region_code,
      }));
    } catch (error) {
      throw new Error(`Failed to get nexus regions: ${this.formatError(error)}`);
    }
  }
}
```

## Avalara Provider

```typescript
// lib/tax/providers/avalara.ts
import Avatax from 'avatax';
import { BaseTaxProvider } from './base';
import type {
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxRate,
  TaxValidationResult,
  Address,
  TaxBreakdown,
  TaxLineItemResult,
} from '../types';

export class AvalaraProvider extends BaseTaxProvider {
  readonly name = 'avalara' as const;
  private client: Avatax;
  private companyCode: string;

  constructor(config?: {
    accountId?: string;
    licenseKey?: string;
    companyCode?: string;
    environment?: 'sandbox' | 'production';
  }) {
    super();

    const environment = config?.environment ||
      (process.env.AVALARA_ENVIRONMENT === 'production' ? 'production' : 'sandbox');

    this.client = new Avatax({
      appName: 'YourApp',
      appVersion: '1.0',
      environment,
      machineName: 'localhost',
    }).withSecurity({
      username: config?.accountId || process.env.AVALARA_ACCOUNT_ID!,
      password: config?.licenseKey || process.env.AVALARA_LICENSE_KEY!,
    });

    this.companyCode = config?.companyCode || process.env.AVALARA_COMPANY_CODE || 'DEFAULT';
  }

  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    try {
      const transaction = await this.client.createTransaction({
        model: {
          type: this.getDocumentType(request.documentType),
          companyCode: this.companyCode,
          date: request.transactionDate || new Date(),
          customerCode: request.customerId || 'GUEST',
          purchaseOrderNo: request.transactionId,
          addresses: {
            shipFrom: {
              line1: request.fromAddress.line1,
              line2: request.fromAddress.line2,
              city: request.fromAddress.city,
              region: request.fromAddress.state,
              postalCode: request.fromAddress.postalCode,
              country: request.fromAddress.country,
            },
            shipTo: {
              line1: request.toAddress.line1,
              line2: request.toAddress.line2,
              city: request.toAddress.city,
              region: request.toAddress.state,
              postalCode: request.toAddress.postalCode,
              country: request.toAddress.country,
            },
          },
          lines: request.lineItems.map((item, index) => ({
            number: String(index + 1),
            quantity: item.quantity,
            amount: item.amount,
            taxCode: item.taxCode || 'P0000000',
            itemCode: item.sku || item.productId,
            description: item.description,
            discountAmount: item.discount || 0,
          })),
          commit: false,
          currencyCode: request.currency || 'USD',
          exemptionNo: request.exemptionCertificate,
        },
      });

      // Add shipping as a line if present
      if (request.shippingAmount && request.shippingAmount > 0) {
        // Shipping would be added as a separate line
      }

      // Build breakdown from transaction details
      const breakdown: TaxBreakdown[] = [];
      const jurisdictionTaxes = new Map<string, TaxBreakdown>();

      transaction.lines?.forEach((line: any) => {
        line.details?.forEach((detail: any) => {
          const key = `${detail.jurisdictionType}-${detail.jurisCode}`;
          const existing = jurisdictionTaxes.get(key);

          if (existing) {
            existing.taxableAmount += detail.taxableAmount;
            existing.taxAmount += detail.tax;
          } else {
            jurisdictionTaxes.set(key, {
              jurisdiction: detail.jurisName,
              jurisdictionType: detail.jurisdictionType.toLowerCase(),
              taxType: 'sales_tax',
              taxName: detail.taxName,
              taxableAmount: detail.taxableAmount,
              taxRate: detail.rate,
              taxAmount: detail.tax,
            });
          }
        });
      });

      breakdown.push(...jurisdictionTaxes.values());

      // Build line item results
      const lineItemResults: TaxLineItemResult[] = request.lineItems.map((item, index) => {
        const transactionLine = transaction.lines?.[index];
        return {
          ...item,
          taxableAmount: transactionLine?.taxableAmount || item.amount,
          exemptAmount: transactionLine?.exemptAmount || 0,
          taxAmount: transactionLine?.tax || 0,
          taxRate: transactionLine?.taxCalculated ? transactionLine.tax / item.amount : 0,
          taxBreakdown: [],
        };
      });

      return {
        success: true,
        transactionId: String(transaction.id),
        fromAddress: request.fromAddress,
        toAddress: request.toAddress,
        totalTaxableAmount: transaction.totalTaxable || 0,
        totalExemptAmount: transaction.totalExempt || 0,
        totalTax: this.roundToTwoDecimals(transaction.totalTax || 0),
        shippingTax: 0, // Would need to extract from lines
        breakdown,
        lineItems: lineItemResults,
        currency: request.currency || 'USD',
        provider: this.name,
        calculatedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        fromAddress: request.fromAddress,
        toAddress: request.toAddress,
        totalTaxableAmount: 0,
        totalExemptAmount: 0,
        totalTax: 0,
        shippingTax: 0,
        breakdown: [],
        lineItems: [],
        currency: request.currency || 'USD',
        provider: this.name,
        calculatedAt: new Date(),
        error: this.formatError(error),
      };
    }
  }

  async getTaxRate(address: Address): Promise<TaxRate> {
    try {
      const result = await this.client.taxRatesByAddress({
        line1: address.line1,
        city: address.city,
        region: address.state,
        postalCode: address.postalCode,
        country: address.country,
      });

      return {
        country: address.country,
        state: address.state,
        postalCode: address.postalCode,
        combinedRate: result.totalRate || 0,
        stateRate: result.rates?.find((r: any) => r.type === 'State')?.rate || 0,
        countyRate: result.rates?.find((r: any) => r.type === 'County')?.rate || 0,
        cityRate: result.rates?.find((r: any) => r.type === 'City')?.rate || 0,
        specialRate: result.rates?.find((r: any) => r.type === 'Special')?.rate || 0,
        freightTaxable: true, // Would need to check by jurisdiction
      };
    } catch (error) {
      throw new Error(`Failed to get tax rate: ${this.formatError(error)}`);
    }
  }

  async validateTaxId(taxId: string, country: string = 'US'): Promise<TaxValidationResult> {
    // Avalara doesn't have direct VAT validation, would use VIES for EU
    return {
      valid: false,
      taxId,
      taxIdType: country === 'US' ? 'ein' : 'vat',
      country,
      validatedAt: new Date(),
    };
  }

  async commitTransaction(transactionId: string): Promise<boolean> {
    try {
      await this.client.commitTransaction({
        companyCode: this.companyCode,
        transactionCode: transactionId,
        model: { commit: true },
      });
      return true;
    } catch (error) {
      console.error('Failed to commit transaction:', error);
      return false;
    }
  }

  async voidTransaction(transactionId: string): Promise<boolean> {
    try {
      await this.client.voidTransaction({
        companyCode: this.companyCode,
        transactionCode: transactionId,
        model: { code: 'DocVoided' },
      });
      return true;
    } catch (error) {
      console.error('Failed to void transaction:', error);
      return false;
    }
  }

  async refundTransaction(
    transactionId: string,
    amount?: number
  ): Promise<TaxCalculationResult> {
    try {
      const refund = await this.client.refundTransaction({
        companyCode: this.companyCode,
        transactionCode: transactionId,
        model: {
          refundTransactionCode: `${transactionId}-REFUND`,
          refundDate: new Date(),
          refundType: amount ? 'Partial' : 'Full',
          refundPercentage: amount ? undefined : 100,
        },
      });

      return {
        success: true,
        transactionId: String(refund.id),
        fromAddress: {} as Address,
        toAddress: {} as Address,
        totalTaxableAmount: Math.abs(refund.totalTaxable || 0),
        totalExemptAmount: 0,
        totalTax: Math.abs(refund.totalTax || 0),
        shippingTax: 0,
        breakdown: [],
        lineItems: [],
        currency: 'USD',
        provider: this.name,
        calculatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to create refund: ${this.formatError(error)}`);
    }
  }

  private getDocumentType(type?: string): string {
    switch (type) {
      case 'invoice':
        return 'SalesInvoice';
      case 'return':
        return 'ReturnInvoice';
      default:
        return 'SalesOrder';
    }
  }
}
```

## Manual Tax Rates Provider

```typescript
// lib/tax/providers/manual.ts
import { BaseTaxProvider } from './base';
import type {
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxRate,
  TaxValidationResult,
  Address,
  TaxBreakdown,
  TaxLineItemResult,
} from '../types';

interface ManualTaxRate {
  country: string;
  state?: string;
  rate: number;
  taxName: string;
  taxType: 'sales_tax' | 'vat' | 'gst';
  shippingTaxable: boolean;
}

export class ManualTaxProvider extends BaseTaxProvider {
  readonly name = 'manual' as const;
  private taxRates: ManualTaxRate[];

  constructor(rates?: ManualTaxRate[]) {
    super();
    this.taxRates = rates || this.getDefaultRates();
  }

  private getDefaultRates(): ManualTaxRate[] {
    return [
      // US States
      { country: 'US', state: 'CA', rate: 0.0725, taxName: 'CA Sales Tax', taxType: 'sales_tax', shippingTaxable: true },
      { country: 'US', state: 'NY', rate: 0.08, taxName: 'NY Sales Tax', taxType: 'sales_tax', shippingTaxable: true },
      { country: 'US', state: 'TX', rate: 0.0625, taxName: 'TX Sales Tax', taxType: 'sales_tax', shippingTaxable: false },
      { country: 'US', state: 'FL', rate: 0.06, taxName: 'FL Sales Tax', taxType: 'sales_tax', shippingTaxable: false },
      { country: 'US', state: 'WA', rate: 0.065, taxName: 'WA Sales Tax', taxType: 'sales_tax', shippingTaxable: true },
      // No sales tax states
      { country: 'US', state: 'OR', rate: 0, taxName: 'No Tax', taxType: 'sales_tax', shippingTaxable: false },
      { country: 'US', state: 'MT', rate: 0, taxName: 'No Tax', taxType: 'sales_tax', shippingTaxable: false },
      { country: 'US', state: 'NH', rate: 0, taxName: 'No Tax', taxType: 'sales_tax', shippingTaxable: false },
      { country: 'US', state: 'DE', rate: 0, taxName: 'No Tax', taxType: 'sales_tax', shippingTaxable: false },
      // EU VAT
      { country: 'DE', rate: 0.19, taxName: 'German VAT', taxType: 'vat', shippingTaxable: true },
      { country: 'FR', rate: 0.20, taxName: 'French VAT', taxType: 'vat', shippingTaxable: true },
      { country: 'GB', rate: 0.20, taxName: 'UK VAT', taxType: 'vat', shippingTaxable: true },
      { country: 'IT', rate: 0.22, taxName: 'Italian VAT', taxType: 'vat', shippingTaxable: true },
      { country: 'ES', rate: 0.21, taxName: 'Spanish VAT', taxType: 'vat', shippingTaxable: true },
      // Others
      { country: 'CA', rate: 0.05, taxName: 'GST', taxType: 'gst', shippingTaxable: true },
      { country: 'AU', rate: 0.10, taxName: 'GST', taxType: 'gst', shippingTaxable: true },
    ];
  }

  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    // Check for exemption
    if (request.customerTaxExempt) {
      return this.createEmptyResult(request);
    }

    // Find applicable tax rate
    const taxRate = this.findTaxRate(request.toAddress);

    if (!taxRate || taxRate.rate === 0) {
      return this.createEmptyResult(request);
    }

    // Calculate line items
    const lineItemResults: TaxLineItemResult[] = request.lineItems.map((item) => {
      const isTaxable = item.isTaxable !== false;
      const taxableAmount = isTaxable ? item.amount : 0;
      const taxAmount = isTaxable ? this.roundToTwoDecimals(item.amount * taxRate.rate) : 0;

      return {
        ...item,
        taxableAmount,
        exemptAmount: isTaxable ? 0 : item.amount,
        taxAmount,
        taxRate: isTaxable ? taxRate.rate : 0,
        taxBreakdown: isTaxable
          ? [
              {
                jurisdiction: taxRate.state || taxRate.country,
                jurisdictionType: taxRate.state ? 'state' : 'country',
                taxType: taxRate.taxType,
                taxName: taxRate.taxName,
                taxableAmount,
                taxRate: taxRate.rate,
                taxAmount,
              },
            ]
          : [],
      };
    });

    // Calculate totals
    const totalTaxableAmount = lineItemResults.reduce(
      (sum, item) => sum + item.taxableAmount,
      0
    );
    const totalExemptAmount = lineItemResults.reduce(
      (sum, item) => sum + item.exemptAmount,
      0
    );
    const itemsTax = lineItemResults.reduce(
      (sum, item) => sum + item.taxAmount,
      0
    );

    // Calculate shipping tax
    const shippingTax = taxRate.shippingTaxable && request.shippingAmount
      ? this.roundToTwoDecimals(request.shippingAmount * taxRate.rate)
      : 0;

    const totalTax = this.roundToTwoDecimals(itemsTax + shippingTax);

    // Build breakdown
    const breakdown: TaxBreakdown[] = [
      {
        jurisdiction: taxRate.state || taxRate.country,
        jurisdictionType: taxRate.state ? 'state' : 'country',
        taxType: taxRate.taxType,
        taxName: taxRate.taxName,
        taxableAmount: totalTaxableAmount + (taxRate.shippingTaxable ? (request.shippingAmount || 0) : 0),
        taxRate: taxRate.rate,
        taxAmount: totalTax,
      },
    ];

    return {
      success: true,
      fromAddress: request.fromAddress,
      toAddress: request.toAddress,
      totalTaxableAmount,
      totalExemptAmount,
      totalTax,
      shippingTax,
      breakdown,
      lineItems: lineItemResults,
      currency: request.currency || 'USD',
      provider: this.name,
      calculatedAt: new Date(),
    };
  }

  async getTaxRate(address: Address): Promise<TaxRate> {
    const rate = this.findTaxRate(address);

    return {
      country: address.country,
      state: address.state,
      postalCode: address.postalCode,
      combinedRate: rate?.rate || 0,
      stateRate: rate?.rate || 0,
      countyRate: 0,
      cityRate: 0,
      specialRate: 0,
      freightTaxable: rate?.shippingTaxable || false,
    };
  }

  async validateTaxId(taxId: string, country: string = 'US'): Promise<TaxValidationResult> {
    // Basic format validation only
    const formats: Record<string, RegExp> = {
      US: /^\d{2}-\d{7}$/, // EIN
      GB: /^GB\d{9}$|^GB\d{12}$/, // UK VAT
      DE: /^DE\d{9}$/, // German VAT
      FR: /^FR[A-Z0-9]{2}\d{9}$/, // French VAT
    };

    const pattern = formats[country];
    const valid = pattern ? pattern.test(taxId) : true;

    return {
      valid,
      taxId,
      taxIdType: country === 'US' ? 'ein' : 'vat',
      country,
      validatedAt: new Date(),
    };
  }

  async commitTransaction(transactionId: string): Promise<boolean> {
    // Manual provider doesn't track transactions
    return true;
  }

  async voidTransaction(transactionId: string): Promise<boolean> {
    return true;
  }

  async refundTransaction(
    transactionId: string,
    amount?: number
  ): Promise<TaxCalculationResult> {
    return this.createEmptyResult({} as TaxCalculationRequest);
  }

  private findTaxRate(address: Address): ManualTaxRate | undefined {
    // First try to match country + state
    let rate = this.taxRates.find(
      (r) =>
        r.country === address.country &&
        r.state === address.state
    );

    // Fall back to country only
    if (!rate) {
      rate = this.taxRates.find(
        (r) => r.country === address.country && !r.state
      );
    }

    return rate;
  }

  private createEmptyResult(request: TaxCalculationRequest): TaxCalculationResult {
    return {
      success: true,
      fromAddress: request.fromAddress,
      toAddress: request.toAddress,
      totalTaxableAmount: 0,
      totalExemptAmount: 0,
      totalTax: 0,
      shippingTax: 0,
      breakdown: [],
      lineItems: request.lineItems?.map((item) => ({
        ...item,
        taxableAmount: 0,
        exemptAmount: item.amount,
        taxAmount: 0,
        taxRate: 0,
        taxBreakdown: [],
      })) || [],
      currency: request.currency || 'USD',
      provider: this.name,
      calculatedAt: new Date(),
    };
  }

  // Manual provider methods
  addTaxRate(rate: ManualTaxRate): void {
    this.taxRates.push(rate);
  }

  removeTaxRate(country: string, state?: string): void {
    this.taxRates = this.taxRates.filter(
      (r) => !(r.country === country && r.state === state)
    );
  }

  getAllRates(): ManualTaxRate[] {
    return [...this.taxRates];
  }
}
```

## Tax Calculator Service

```typescript
// lib/tax/calculator.ts
import { TaxJarProvider } from './providers/taxjar';
import { AvalaraProvider } from './providers/avalara';
import { ManualTaxProvider } from './providers/manual';
import { BaseTaxProvider } from './providers/base';
import type {
  TaxProvider,
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxRate,
  Address,
} from './types';

type ProviderConfig = {
  taxjar?: { apiKey?: string };
  avalara?: {
    accountId?: string;
    licenseKey?: string;
    companyCode?: string;
    environment?: 'sandbox' | 'production';
  };
  manual?: { rates?: any[] };
};

export class TaxCalculator {
  private providers: Map<TaxProvider, BaseTaxProvider>;
  private defaultProvider: TaxProvider;
  private cacheEnabled: boolean;
  private cache: Map<string, { result: TaxCalculationResult; expiry: number }>;

  constructor(config?: {
    defaultProvider?: TaxProvider;
    providers?: ProviderConfig;
    enableCache?: boolean;
    cacheTtlMs?: number;
  }) {
    this.providers = new Map();
    this.defaultProvider = config?.defaultProvider ||
      (process.env.DEFAULT_TAX_PROVIDER as TaxProvider) || 'manual';
    this.cacheEnabled = config?.enableCache ?? true;
    this.cache = new Map();

    // Initialize providers
    this.initializeProviders(config?.providers);
  }

  private initializeProviders(config?: ProviderConfig): void {
    // TaxJar
    if (process.env.TAXJAR_API_KEY || config?.taxjar?.apiKey) {
      this.providers.set('taxjar', new TaxJarProvider(config?.taxjar?.apiKey));
    }

    // Avalara
    if (process.env.AVALARA_ACCOUNT_ID || config?.avalara?.accountId) {
      this.providers.set('avalara', new AvalaraProvider(config?.avalara));
    }

    // Manual (always available)
    this.providers.set('manual', new ManualTaxProvider(config?.manual?.rates));
  }

  async calculateTax(
    request: TaxCalculationRequest,
    provider?: TaxProvider
  ): Promise<TaxCalculationResult> {
    const providerName = provider || this.defaultProvider;
    const taxProvider = this.providers.get(providerName);

    if (!taxProvider) {
      throw new Error(`Tax provider "${providerName}" not configured`);
    }

    // Check cache
    if (this.cacheEnabled) {
      const cacheKey = this.getCacheKey(request, providerName);
      const cached = this.cache.get(cacheKey);

      if (cached && cached.expiry > Date.now()) {
        return cached.result;
      }
    }

    // Calculate tax
    const result = await taxProvider.calculateTax(request);

    // Cache result
    if (this.cacheEnabled && result.success) {
      const cacheKey = this.getCacheKey(request, providerName);
      this.cache.set(cacheKey, {
        result,
        expiry: Date.now() + 5 * 60 * 1000, // 5 minutes
      });
    }

    return result;
  }

  async getTaxRate(
    address: Address,
    provider?: TaxProvider
  ): Promise<TaxRate> {
    const providerName = provider || this.defaultProvider;
    const taxProvider = this.providers.get(providerName);

    if (!taxProvider) {
      throw new Error(`Tax provider "${providerName}" not configured`);
    }

    return taxProvider.getTaxRate(address);
  }

  async validateTaxId(
    taxId: string,
    country?: string,
    provider?: TaxProvider
  ): Promise<boolean> {
    const providerName = provider || this.defaultProvider;
    const taxProvider = this.providers.get(providerName);

    if (!taxProvider) {
      return false;
    }

    const result = await taxProvider.validateTaxId(taxId, country);
    return result.valid;
  }

  async commitTransaction(
    transactionId: string,
    provider?: TaxProvider
  ): Promise<boolean> {
    const providerName = provider || this.defaultProvider;
    const taxProvider = this.providers.get(providerName);

    if (!taxProvider) {
      return false;
    }

    return taxProvider.commitTransaction(transactionId);
  }

  async voidTransaction(
    transactionId: string,
    provider?: TaxProvider
  ): Promise<boolean> {
    const providerName = provider || this.defaultProvider;
    const taxProvider = this.providers.get(providerName);

    if (!taxProvider) {
      return false;
    }

    return taxProvider.voidTransaction(transactionId);
  }

  getProvider(name: TaxProvider): BaseTaxProvider | undefined {
    return this.providers.get(name);
  }

  getAvailableProviders(): TaxProvider[] {
    return Array.from(this.providers.keys());
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getCacheKey(request: TaxCalculationRequest, provider: TaxProvider): string {
    const key = {
      provider,
      from: `${request.fromAddress.postalCode}-${request.fromAddress.country}`,
      to: `${request.toAddress.postalCode}-${request.toAddress.country}`,
      items: request.lineItems.map((i) => `${i.id}:${i.amount}`).join(','),
      shipping: request.shippingAmount,
      exempt: request.customerTaxExempt,
    };
    return JSON.stringify(key);
  }
}

// Singleton instance
export const taxCalculator = new TaxCalculator();
```

## Nexus Management

```typescript
// lib/tax/nexus.ts
import type { NexusLocation, Address } from './types';

export class NexusManager {
  private nexusLocations: NexusLocation[];

  constructor(locations?: NexusLocation[]) {
    this.nexusLocations = locations || [];
  }

  addNexus(location: NexusLocation): void {
    this.nexusLocations.push(location);
  }

  removeNexus(id: string): void {
    this.nexusLocations = this.nexusLocations.filter((n) => n.id !== id);
  }

  hasNexus(address: Address): boolean {
    const now = new Date();

    return this.nexusLocations.some((nexus) => {
      // Check if nexus is active
      if (nexus.effectiveDate > now) return false;
      if (nexus.endDate && nexus.endDate < now) return false;

      // Check country match
      if (nexus.country !== address.country) return false;

      // If nexus has state, check state match (for US)
      if (nexus.state && nexus.state !== address.state) return false;

      return true;
    });
  }

  getNexusForAddress(address: Address): NexusLocation | undefined {
    const now = new Date();

    return this.nexusLocations.find((nexus) => {
      if (nexus.effectiveDate > now) return false;
      if (nexus.endDate && nexus.endDate < now) return false;
      if (nexus.country !== address.country) return false;
      if (nexus.state && nexus.state !== address.state) return false;
      return true;
    });
  }

  getActiveNexusLocations(): NexusLocation[] {
    const now = new Date();

    return this.nexusLocations.filter((nexus) => {
      if (nexus.effectiveDate > now) return false;
      if (nexus.endDate && nexus.endDate < now) return false;
      return true;
    });
  }

  getUpcomingNexusChanges(days: number = 30): NexusLocation[] {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.nexusLocations.filter((nexus) => {
      return (
        (nexus.effectiveDate > now && nexus.effectiveDate <= future) ||
        (nexus.endDate && nexus.endDate > now && nexus.endDate <= future)
      );
    });
  }

  getAllNexusLocations(): NexusLocation[] {
    return [...this.nexusLocations];
  }
}

// US Economic Nexus Thresholds (simplified)
export const US_ECONOMIC_NEXUS_THRESHOLDS: Record<
  string,
  { salesThreshold: number; transactionThreshold: number }
> = {
  CA: { salesThreshold: 500000, transactionThreshold: 0 },
  NY: { salesThreshold: 500000, transactionThreshold: 100 },
  TX: { salesThreshold: 500000, transactionThreshold: 0 },
  FL: { salesThreshold: 100000, transactionThreshold: 0 },
  WA: { salesThreshold: 100000, transactionThreshold: 0 },
  PA: { salesThreshold: 100000, transactionThreshold: 0 },
  // ... more states
};

export function checkEconomicNexus(
  state: string,
  totalSales: number,
  transactionCount: number
): boolean {
  const threshold = US_ECONOMIC_NEXUS_THRESHOLDS[state];

  if (!threshold) return false;

  if (threshold.salesThreshold > 0 && totalSales >= threshold.salesThreshold) {
    return true;
  }

  if (
    threshold.transactionThreshold > 0 &&
    transactionCount >= threshold.transactionThreshold
  ) {
    return true;
  }

  return false;
}
```

## React Components

```tsx
// components/tax/TaxSummary.tsx
'use client';

import type { TaxCalculationResult, TaxBreakdown } from '@/lib/tax/types';

interface TaxSummaryProps {
  result: TaxCalculationResult;
  showBreakdown?: boolean;
  currency?: string;
}

export function TaxSummary({
  result,
  showBreakdown = true,
  currency = 'USD',
}: TaxSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatRate = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-600">
          Tax calculation failed: {result.error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Estimated Tax</span>
          <span className="text-lg font-semibold">
            {formatCurrency(result.totalTax)}
          </span>
        </div>

        {result.shippingTax > 0 && (
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-gray-500">Includes shipping tax</span>
            <span>{formatCurrency(result.shippingTax)}</span>
          </div>
        )}
      </div>

      {/* Breakdown */}
      {showBreakdown && result.breakdown.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2">
            <h4 className="text-sm font-medium text-gray-700">Tax Breakdown</h4>
          </div>
          <div className="divide-y">
            {result.breakdown.map((tax, index) => (
              <TaxBreakdownRow key={index} tax={tax} formatCurrency={formatCurrency} formatRate={formatRate} />
            ))}
          </div>
        </div>
      )}

      {/* Provider Info */}
      <div className="text-xs text-gray-400 flex items-center justify-between">
        <span>Calculated by {result.provider}</span>
        <span>
          {new Date(result.calculatedAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function TaxBreakdownRow({
  tax,
  formatCurrency,
  formatRate,
}: {
  tax: TaxBreakdown;
  formatCurrency: (amount: number) => string;
  formatRate: (rate: number) => string;
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{tax.taxName}</p>
        <p className="text-xs text-gray-500">
          {tax.jurisdiction} • {formatRate(tax.taxRate)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{formatCurrency(tax.taxAmount)}</p>
        <p className="text-xs text-gray-500">
          on {formatCurrency(tax.taxableAmount)}
        </p>
      </div>
    </div>
  );
}
```

```tsx
// components/tax/TaxExemptForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TaxExemption } from '@/lib/tax/types';

const exemptionSchema = z.object({
  certificateNumber: z.string().min(1, 'Certificate number required'),
  certificateType: z.enum(['resale', 'government', 'nonprofit', 'other']),
  issuingState: z.string().min(2, 'Issuing state required'),
  states: z.array(z.string()).min(1, 'Select at least one state'),
  validFrom: z.string(),
  validUntil: z.string().optional(),
});

type ExemptionFormData = z.infer<typeof exemptionSchema>;

interface TaxExemptFormProps {
  onSubmit: (data: ExemptionFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<TaxExemption>;
}

const CERTIFICATE_TYPES = [
  { value: 'resale', label: 'Resale Certificate' },
  { value: 'government', label: 'Government Entity' },
  { value: 'nonprofit', label: 'Nonprofit Organization' },
  { value: 'other', label: 'Other Exemption' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export function TaxExemptForm({
  onSubmit,
  onCancel,
  initialData,
}: TaxExemptFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExemptionFormData>({
    resolver: zodResolver(exemptionSchema),
    defaultValues: {
      certificateNumber: initialData?.certificateNumber || '',
      certificateType: initialData?.certificateType || 'resale',
      issuingState: initialData?.issuingState || '',
      states: initialData?.states || [],
      validFrom: initialData?.validFrom
        ? new Date(initialData.validFrom).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      validUntil: initialData?.validUntil
        ? new Date(initialData.validUntil).toISOString().split('T')[0]
        : '',
    },
  });

  const selectedStates = watch('states');

  const toggleState = (state: string) => {
    const current = selectedStates || [];
    const updated = current.includes(state)
      ? current.filter((s) => s !== state)
      : [...current, state];
    setValue('states', updated);
  };

  const selectAllStates = () => {
    setValue('states', [...US_STATES]);
  };

  const clearAllStates = () => {
    setValue('states', []);
  };

  const handleFormSubmit = async (data: ExemptionFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Certificate Type
        </label>
        <select
          {...register('certificateType')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {CERTIFICATE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Certificate Number
        </label>
        <input
          {...register('certificateNumber')}
          type="text"
          placeholder="Enter certificate number"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.certificateNumber && (
          <p className="mt-1 text-sm text-red-600">
            {errors.certificateNumber.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Issuing State
        </label>
        <select
          {...register('issuingState')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select state...</option>
          {US_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {errors.issuingState && (
          <p className="mt-1 text-sm text-red-600">
            {errors.issuingState.message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Exempt States
          </label>
          <div className="space-x-2">
            <button
              type="button"
              onClick={selectAllStates}
              className="text-xs text-blue-600 hover:underline"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAllStates}
              className="text-xs text-gray-600 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="grid grid-cols-10 gap-1 max-h-40 overflow-y-auto p-2 border rounded-md">
          {US_STATES.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => toggleState(state)}
              className={`
                px-2 py-1 text-xs rounded
                ${
                  selectedStates?.includes(state)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }
              `}
            >
              {state}
            </button>
          ))}
        </div>
        {errors.states && (
          <p className="mt-1 text-sm text-red-600">{errors.states.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Valid From
          </label>
          <input
            {...register('validFrom')}
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Valid Until (optional)
          </label>
          <input
            {...register('validUntil')}
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Exemption'}
        </button>
      </div>
    </form>
  );
}
```

## API Routes

```typescript
// app/api/tax/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { taxCalculator } from '@/lib/tax/calculator';
import type { TaxCalculationRequest } from '@/lib/tax/types';

export async function POST(request: NextRequest) {
  try {
    const body: TaxCalculationRequest = await request.json();
    const provider = request.nextUrl.searchParams.get('provider') as any;

    const result = await taxCalculator.calculateTax(body, provider);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tax calculation error:', error);
    return NextResponse.json(
      { success: false, error: 'Tax calculation failed' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/tax/rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { taxCalculator } from '@/lib/tax/calculator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const address = {
      line1: searchParams.get('line1') || '',
      city: searchParams.get('city') || '',
      state: searchParams.get('state') || '',
      postalCode: searchParams.get('postalCode') || '',
      country: searchParams.get('country') || 'US',
    };

    const provider = searchParams.get('provider') as any;
    const rate = await taxCalculator.getTaxRate(address, provider);

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Tax rate lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to get tax rate' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/tax/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { taxCalculator } from '@/lib/tax/calculator';

export async function POST(request: NextRequest) {
  try {
    const { taxId, country } = await request.json();

    const isValid = await taxCalculator.validateTaxId(taxId, country);

    return NextResponse.json({ valid: isValid, taxId, country });
  } catch (error) {
    console.error('Tax ID validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
```

## Server Actions

```typescript
// app/actions/tax.ts
'use server';

import { taxCalculator } from '@/lib/tax/calculator';
import type { TaxCalculationRequest, TaxCalculationResult } from '@/lib/tax/types';

export async function calculateTax(
  request: TaxCalculationRequest
): Promise<TaxCalculationResult> {
  return taxCalculator.calculateTax(request);
}

export async function getTaxRate(
  postalCode: string,
  state: string,
  country: string = 'US'
) {
  return taxCalculator.getTaxRate({
    line1: '',
    city: '',
    state,
    postalCode,
    country,
  });
}

export async function validateTaxExemption(
  certificateNumber: string,
  state: string
): Promise<boolean> {
  // Validate against your database
  // This is a placeholder implementation
  return true;
}

export async function commitTaxTransaction(transactionId: string): Promise<boolean> {
  return taxCalculator.commitTransaction(transactionId);
}

export async function voidTaxTransaction(transactionId: string): Promise<boolean> {
  return taxCalculator.voidTransaction(transactionId);
}
```

## CLAUDE.md Integration

```markdown
## Tax Calculation System

### Commands
- `npm run dev` - Start development server
- `npm run test` - Run tests

### Key Files
- `lib/tax/calculator.ts` - Main tax calculation service
- `lib/tax/providers/` - Tax provider integrations
- `lib/tax/nexus.ts` - Nexus management
- `lib/tax/exemptions.ts` - Tax exemption handling

### Providers
- **TaxJar** - US sales tax calculation
- **Avalara** - Enterprise tax compliance
- **Manual** - Configurable static rates

### Configuration
Set `DEFAULT_TAX_PROVIDER` in env to change provider:
- `taxjar` - TaxJar API
- `avalara` - Avalara AvaTax
- `manual` - Manual rates

### API Routes
- POST `/api/tax/calculate` - Calculate tax for order
- GET `/api/tax/rates` - Get tax rate for address
- POST `/api/tax/validate` - Validate tax ID (VAT/EIN)

### Tax Calculation Flow
1. Check customer exemption status
2. Determine nexus for destination
3. Calculate tax using provider
4. Return breakdown by jurisdiction
```

## AI Suggestions

1. **Product Tax Codes** - Map products to tax categories (food, clothing, digital goods) for accurate tax rates
2. **Marketplace Facilitator** - Handle marketplace facilitator rules where platform collects/remits tax
3. **Tax Calendar** - Track filing deadlines and generate filing reminders by jurisdiction
4. **SST Integration** - Integrate with Streamlined Sales Tax for simplified multi-state compliance
5. **Tax Reports** - Generate state-by-state tax liability reports for filing
6. **Economic Nexus Tracker** - Monitor sales thresholds by state to detect new nexus obligations
7. **B2B Tax Handling** - Support reverse charge for B2B EU transactions
8. **Digital Goods Rules** - Handle varying digital goods taxation rules by state/country
9. **Exemption Certificate Storage** - Secure storage and validation of customer exemption certificates
10. **Real-time Rate Updates** - Subscribe to tax rate change notifications from providers
