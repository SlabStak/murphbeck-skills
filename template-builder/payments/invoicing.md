# Invoice Generation Template

A comprehensive invoicing system with PDF generation, email delivery, payment tracking, and recurring invoices.

## Installation

```bash
npm install @react-pdf/renderer date-fns zod nanoid nodemailer handlebars stripe
```

## Environment Variables

```env
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=invoices
AWS_REGION=us-east-1

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
COMPANY_NAME=Your Company
COMPANY_EMAIL=billing@yourcompany.com
```

## Project Structure

```
lib/
├── invoicing/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions
│   ├── generator.ts          # Invoice number generation
│   ├── calculator.ts         # Invoice calculations
│   ├── pdf.tsx               # PDF template
│   ├── email.ts              # Email delivery
│   ├── recurring.ts          # Recurring invoice logic
│   └── templates/
│       ├── default.tsx       # Default PDF template
│       └── minimal.tsx       # Minimal PDF template
components/
├── invoicing/
│   ├── InvoiceForm.tsx       # Create/edit invoice
│   ├── InvoicePreview.tsx    # Preview invoice
│   ├── InvoiceList.tsx       # Invoice list view
│   ├── InvoiceDetails.tsx    # Single invoice view
│   ├── LineItems.tsx         # Line item editor
│   ├── CustomerSelect.tsx    # Customer picker
│   └── PaymentStatus.tsx     # Status badge
app/
├── invoices/
│   ├── page.tsx              # Invoice list
│   ├── new/
│   │   └── page.tsx          # Create invoice
│   ├── [id]/
│   │   ├── page.tsx          # View invoice
│   │   ├── edit/
│   │   │   └── page.tsx      # Edit invoice
│   │   └── pay/
│   │       └── page.tsx      # Payment page
├── api/
│   └── invoices/
│       ├── route.ts          # List/create invoices
│       ├── [id]/
│       │   ├── route.ts      # Get/update/delete
│       │   ├── pdf/
│       │   │   └── route.ts  # Download PDF
│       │   ├── send/
│       │   │   └── route.ts  # Send email
│       │   └── duplicate/
│       │       └── route.ts  # Duplicate invoice
│       └── recurring/
│           └── process/
│               └── route.ts  # Process recurring
```

## Type Definitions

```typescript
// lib/invoicing/types.ts
export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod =
  | 'card'
  | 'bank_transfer'
  | 'check'
  | 'cash'
  | 'other';

export type RecurringFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  taxId?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  currency?: string;
  paymentTerms?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  amount: number;
  productId?: string;
  sku?: string;
  unit?: string;
}

export interface InvoiceTax {
  name: string;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;

  // Customer
  customerId: string;
  customer: Customer;

  // Company info
  companyName: string;
  companyLogo?: string;
  companyAddress: Address;
  companyEmail: string;
  companyPhone?: string;
  companyTaxId?: string;

  // Dates
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;

  // Items and amounts
  lineItems: LineItem[];
  subtotal: number;
  taxes: InvoiceTax[];
  taxTotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  discountAmount: number;
  shippingAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;

  // Currency
  currency: string;
  exchangeRate?: number;

  // Payment
  paymentTerms: number;
  paymentMethod?: PaymentMethod;
  paymentInstructions?: string;
  stripePaymentIntentId?: string;

  // Recurring
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringStartDate?: Date;
  recurringEndDate?: Date;
  recurringParentId?: string;

  // Additional
  notes?: string;
  terms?: string;
  footer?: string;
  attachments?: string[];

  // Tracking
  sentAt?: Date;
  viewedAt?: Date;
  remindersSent: number;
  lastReminderAt?: Date;

  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  showLogo: boolean;
  showPaymentInstructions: boolean;
  customCss?: string;
  headerHtml?: string;
  footerHtml?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  stripePaymentId?: string;
  paidAt: Date;
  createdAt: Date;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalRevenue: number;
  totalOutstanding: number;
  totalOverdue: number;
  averagePaymentDays: number;
  invoicesByStatus: Record<InvoiceStatus, number>;
}
```

## Invoice Number Generation

```typescript
// lib/invoicing/generator.ts
import { nanoid } from 'nanoid';

interface InvoiceNumberConfig {
  prefix?: string;
  suffix?: string;
  separator?: string;
  includeYear?: boolean;
  includeMonth?: boolean;
  sequenceLength?: number;
  format?: 'sequential' | 'random' | 'date-based';
}

const defaultConfig: InvoiceNumberConfig = {
  prefix: 'INV',
  separator: '-',
  includeYear: true,
  includeMonth: false,
  sequenceLength: 5,
  format: 'sequential',
};

export class InvoiceNumberGenerator {
  private config: InvoiceNumberConfig;
  private lastSequence: number = 0;

  constructor(config: Partial<InvoiceNumberConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async generate(getLastSequence?: () => Promise<number>): Promise<string> {
    const parts: string[] = [];
    const { prefix, suffix, separator, includeYear, includeMonth, format } = this.config;

    if (prefix) {
      parts.push(prefix);
    }

    const now = new Date();

    if (includeYear) {
      parts.push(now.getFullYear().toString());
    }

    if (includeMonth) {
      parts.push(String(now.getMonth() + 1).padStart(2, '0'));
    }

    switch (format) {
      case 'sequential': {
        const lastSeq = getLastSequence
          ? await getLastSequence()
          : this.lastSequence;
        const nextSeq = lastSeq + 1;
        this.lastSequence = nextSeq;
        parts.push(String(nextSeq).padStart(this.config.sequenceLength!, '0'));
        break;
      }
      case 'random': {
        parts.push(nanoid(8).toUpperCase());
        break;
      }
      case 'date-based': {
        const timestamp = now.getTime().toString(36).toUpperCase();
        parts.push(timestamp);
        break;
      }
    }

    if (suffix) {
      parts.push(suffix);
    }

    return parts.join(separator);
  }

  parse(invoiceNumber: string): {
    prefix?: string;
    year?: number;
    month?: number;
    sequence?: number;
  } {
    const { prefix, separator } = this.config;
    const parts = invoiceNumber.split(separator!);

    const result: {
      prefix?: string;
      year?: number;
      month?: number;
      sequence?: number;
    } = {};

    let index = 0;

    if (prefix && parts[index] === prefix) {
      result.prefix = parts[index];
      index++;
    }

    if (this.config.includeYear && parts[index]) {
      result.year = parseInt(parts[index], 10);
      index++;
    }

    if (this.config.includeMonth && parts[index]) {
      result.month = parseInt(parts[index], 10);
      index++;
    }

    if (parts[index]) {
      const seq = parseInt(parts[index], 10);
      if (!isNaN(seq)) {
        result.sequence = seq;
      }
    }

    return result;
  }
}

// Singleton instance
export const invoiceNumberGenerator = new InvoiceNumberGenerator();

// Helper function
export async function generateInvoiceNumber(
  config?: Partial<InvoiceNumberConfig>,
  getLastSequence?: () => Promise<number>
): Promise<string> {
  const generator = new InvoiceNumberGenerator(config);
  return generator.generate(getLastSequence);
}
```

## Invoice Calculator

```typescript
// lib/invoicing/calculator.ts
import type { LineItem, Invoice, InvoiceTax } from './types';

interface CalculationResult {
  subtotal: number;
  taxes: InvoiceTax[];
  taxTotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  amountDue: number;
}

export function calculateLineItem(item: Omit<LineItem, 'amount' | 'taxAmount'>): LineItem {
  let amount = item.quantity * item.unitPrice;

  // Apply discount
  if (item.discount) {
    if (item.discountType === 'percentage') {
      amount = amount * (1 - item.discount / 100);
    } else {
      amount = amount - item.discount;
    }
  }

  // Calculate tax
  let taxAmount = 0;
  if (item.taxRate) {
    taxAmount = amount * (item.taxRate / 100);
  }

  return {
    ...item,
    amount: Math.round(amount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
  };
}

export function calculateInvoice(
  lineItems: LineItem[],
  options: {
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    shippingAmount?: number;
    amountPaid?: number;
    taxRates?: { name: string; rate: number }[];
  } = {}
): CalculationResult {
  const {
    discount = 0,
    discountType = 'fixed',
    shippingAmount = 0,
    amountPaid = 0,
    taxRates = [],
  } = options;

  // Calculate subtotal
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  // Calculate discount
  let discountAmount = 0;
  if (discount > 0) {
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discount / 100);
    } else {
      discountAmount = discount;
    }
  }

  const subtotalAfterDiscount = subtotal - discountAmount;

  // Calculate taxes
  const taxes: InvoiceTax[] = [];
  let taxTotal = 0;

  // Option 1: Use line item taxes
  const lineItemTaxTotal = lineItems.reduce(
    (sum, item) => sum + (item.taxAmount || 0),
    0
  );

  if (lineItemTaxTotal > 0) {
    // Group taxes by rate
    const taxByRate = new Map<number, number>();
    lineItems.forEach((item) => {
      if (item.taxRate && item.taxAmount) {
        const current = taxByRate.get(item.taxRate) || 0;
        taxByRate.set(item.taxRate, current + item.taxAmount);
      }
    });

    taxByRate.forEach((amount, rate) => {
      taxes.push({
        name: `Tax (${rate}%)`,
        rate,
        amount: Math.round(amount * 100) / 100,
      });
      taxTotal += amount;
    });
  } else if (taxRates.length > 0) {
    // Option 2: Apply tax rates to subtotal
    taxRates.forEach(({ name, rate }) => {
      const amount = subtotalAfterDiscount * (rate / 100);
      taxes.push({
        name,
        rate,
        amount: Math.round(amount * 100) / 100,
      });
      taxTotal += amount;
    });
  }

  const total = subtotalAfterDiscount + taxTotal + shippingAmount;
  const amountDue = total - amountPaid;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxes,
    taxTotal: Math.round(taxTotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    shippingAmount: Math.round(shippingAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    amountDue: Math.round(amountDue * 100) / 100,
  };
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function calculateDueDate(
  issueDate: Date,
  paymentTerms: number
): Date {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + paymentTerms);
  return dueDate;
}

export function isOverdue(dueDate: Date, status: string): boolean {
  if (['paid', 'cancelled', 'refunded'].includes(status)) {
    return false;
  }
  return new Date() > dueDate;
}

export function getDaysOverdue(dueDate: Date): number {
  const now = new Date();
  const diff = now.getTime() - dueDate.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
```

## PDF Generation

```tsx
// lib/invoicing/pdf.tsx
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  renderToStream,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { Invoice } from './types';
import { formatCurrency } from './calculator';
import { format } from 'date-fns';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#666666',
  },
  value: {
    fontWeight: 600,
  },
  billingGrid: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 30,
  },
  billingColumn: {
    flex: 1,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontWeight: 600,
    color: '#333333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableCell: {
    color: '#333333',
  },
  descriptionCell: {
    flex: 3,
  },
  quantityCell: {
    flex: 1,
    textAlign: 'center',
  },
  priceCell: {
    flex: 1.5,
    textAlign: 'right',
  },
  amountCell: {
    flex: 1.5,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 250,
    paddingVertical: 6,
  },
  totalsLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    color: '#666666',
  },
  totalsValue: {
    width: 100,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 250,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#1a1a1a',
    marginTop: 4,
  },
  totalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    fontWeight: 700,
    fontSize: 12,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 700,
    fontSize: 12,
  },
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 250,
    paddingVertical: 8,
    backgroundColor: '#f0f7ff',
    marginTop: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  dueLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    fontWeight: 600,
    color: '#0066cc',
  },
  dueValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 600,
    color: '#0066cc',
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  notesTitle: {
    fontWeight: 600,
    marginBottom: 6,
  },
  notesText: {
    color: '#666666',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999999',
    fontSize: 9,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  paidBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  dueBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  overdueBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  showPaymentStatus?: boolean;
}

export function InvoicePDF({ invoice, showPaymentStatus = true }: InvoicePDFProps) {
  const getStatusStyle = () => {
    switch (invoice.status) {
      case 'paid':
        return styles.paidBadge;
      case 'overdue':
        return styles.overdueBadge;
      default:
        return styles.dueBadge;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {invoice.companyLogo && (
              <Image src={invoice.companyLogo} style={styles.logo} />
            )}
            <Text style={{ marginTop: 8, fontWeight: 600 }}>
              {invoice.companyName}
            </Text>
            <Text style={{ color: '#666666', marginTop: 4 }}>
              {invoice.companyAddress.line1}
            </Text>
            {invoice.companyAddress.line2 && (
              <Text style={{ color: '#666666' }}>
                {invoice.companyAddress.line2}
              </Text>
            )}
            <Text style={{ color: '#666666' }}>
              {invoice.companyAddress.city}, {invoice.companyAddress.state}{' '}
              {invoice.companyAddress.postalCode}
            </Text>
          </View>

          <View style={styles.companyInfo}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            {showPaymentStatus && (
              <View style={[styles.statusBadge, getStatusStyle(), { marginTop: 8 }]}>
                <Text>{invoice.status.toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Billing Info */}
        <View style={styles.billingGrid}>
          <View style={styles.billingColumn}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={{ fontWeight: 600, marginBottom: 4 }}>
              {invoice.customer.company || invoice.customer.name}
            </Text>
            {invoice.customer.company && (
              <Text>{invoice.customer.name}</Text>
            )}
            <Text style={{ color: '#666666', marginTop: 4 }}>
              {invoice.customer.email}
            </Text>
            {invoice.customer.billingAddress && (
              <>
                <Text style={{ color: '#666666', marginTop: 4 }}>
                  {invoice.customer.billingAddress.line1}
                </Text>
                <Text style={{ color: '#666666' }}>
                  {invoice.customer.billingAddress.city},{' '}
                  {invoice.customer.billingAddress.state}{' '}
                  {invoice.customer.billingAddress.postalCode}
                </Text>
              </>
            )}
          </View>

          <View style={styles.billingColumn}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Issue Date:</Text>
              <Text style={styles.value}>
                {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Due Date:</Text>
              <Text style={styles.value}>
                {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment Terms:</Text>
              <Text style={styles.value}>Net {invoice.paymentTerms}</Text>
            </View>
            {invoice.customer.taxId && (
              <View style={styles.row}>
                <Text style={styles.label}>Tax ID:</Text>
                <Text style={styles.value}>{invoice.customer.taxId}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.quantityCell]}>
              Qty
            </Text>
            <Text style={[styles.tableHeaderCell, styles.priceCell]}>
              Unit Price
            </Text>
            <Text style={[styles.tableHeaderCell, styles.amountCell]}>
              Amount
            </Text>
          </View>

          {invoice.lineItems.map((item, index) => (
            <View key={item.id || index} style={styles.tableRow}>
              <View style={styles.descriptionCell}>
                <Text style={styles.tableCell}>{item.description}</Text>
                {item.sku && (
                  <Text style={{ fontSize: 8, color: '#999999', marginTop: 2 }}>
                    SKU: {item.sku}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.quantityCell]}>
                {item.quantity}
                {item.unit && ` ${item.unit}`}
              </Text>
              <Text style={[styles.tableCell, styles.priceCell]}>
                {formatCurrency(item.unitPrice, invoice.currency)}
              </Text>
              <Text style={[styles.tableCell, styles.amountCell]}>
                {formatCurrency(item.amount, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.subtotal, invoice.currency)}
            </Text>
          </View>

          {invoice.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Discount
                {invoice.discountType === 'percentage' && ` (${invoice.discount}%)`}
              </Text>
              <Text style={[styles.totalsValue, { color: '#dc2626' }]}>
                -{formatCurrency(invoice.discountAmount, invoice.currency)}
              </Text>
            </View>
          )}

          {invoice.taxes.map((tax, index) => (
            <View key={index} style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{tax.name}</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(tax.amount, invoice.currency)}
              </Text>
            </View>
          ))}

          {invoice.shippingAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Shipping</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.shippingAmount, invoice.currency)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.total, invoice.currency)}
            </Text>
          </View>

          {invoice.amountPaid > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Amount Paid</Text>
              <Text style={[styles.totalsValue, { color: '#16a34a' }]}>
                -{formatCurrency(invoice.amountPaid, invoice.currency)}
              </Text>
            </View>
          )}

          {invoice.amountDue > 0 && (
            <View style={styles.dueRow}>
              <Text style={styles.dueLabel}>Amount Due</Text>
              <Text style={styles.dueValue}>
                {formatCurrency(invoice.amountDue, invoice.currency)}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Instructions */}
        {invoice.paymentInstructions && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Payment Instructions</Text>
            <Text style={styles.notesText}>{invoice.paymentInstructions}</Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {invoice.terms && (
          <View style={[styles.notes, { backgroundColor: '#fff' }]}>
            <Text style={styles.notesTitle}>Terms & Conditions</Text>
            <Text style={styles.notesText}>{invoice.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{invoice.footer || 'Thank you for your business!'}</Text>
          <Text style={{ marginTop: 4 }}>
            {invoice.companyEmail} | {invoice.companyPhone}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// Server-side PDF generation
export async function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  const buffer = await renderToBuffer(<InvoicePDF invoice={invoice} />);
  return buffer;
}

export async function streamInvoicePDF(invoice: Invoice): Promise<NodeJS.ReadableStream> {
  const stream = await renderToStream(<InvoicePDF invoice={invoice} />);
  return stream;
}
```

## Email Delivery

```typescript
// lib/invoicing/email.ts
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import type { Invoice } from './types';
import { generateInvoicePDF } from './pdf';
import { formatCurrency } from './calculator';
import { format } from 'date-fns';

interface EmailConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendInvoiceOptions {
  invoice: Invoice;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  message?: string;
  attachPdf?: boolean;
  paymentLink?: string;
}

const defaultEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { max-width: 150px; height: auto; }
    .invoice-box { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; }
    .value { font-weight: 600; }
    .total { font-size: 18px; color: #0066cc; }
    .button { display: inline-block; background: #0066cc; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{#if companyLogo}}
      <img src="{{companyLogo}}" alt="{{companyName}}" class="logo">
      {{else}}
      <h1>{{companyName}}</h1>
      {{/if}}
    </div>

    <p>Hi {{customerName}},</p>

    {{#if message}}
    <p>{{message}}</p>
    {{else}}
    <p>Please find your invoice attached. Here's a summary:</p>
    {{/if}}

    <div class="invoice-box">
      <div class="row">
        <span class="label">Invoice Number</span>
        <span class="value">{{invoiceNumber}}</span>
      </div>
      <div class="row">
        <span class="label">Issue Date</span>
        <span class="value">{{issueDate}}</span>
      </div>
      <div class="row">
        <span class="label">Due Date</span>
        <span class="value">{{dueDate}}</span>
      </div>
      <div class="row">
        <span class="label">Amount Due</span>
        <span class="value total">{{amountDue}}</span>
      </div>
    </div>

    {{#if paymentLink}}
    <div style="text-align: center;">
      <a href="{{paymentLink}}" class="button">Pay Now</a>
    </div>
    {{/if}}

    <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

    <p>Thank you for your business!</p>

    <div class="footer">
      <p>{{companyName}}</p>
      <p>{{companyEmail}}</p>
    </div>
  </div>
</body>
</html>
`;

const reminderEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .overdue { background: #f8d7da; border-color: #dc3545; }
    .button { display: inline-block; background: #dc3545; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Payment Reminder</h2>

    <p>Hi {{customerName}},</p>

    <div class="alert {{#if isOverdue}}overdue{{/if}}">
      <strong>Invoice {{invoiceNumber}}</strong> for <strong>{{amountDue}}</strong>
      {{#if isOverdue}}
      was due on {{dueDate}} and is now {{daysOverdue}} days overdue.
      {{else}}
      is due on {{dueDate}}.
      {{/if}}
    </div>

    <p>Please arrange payment at your earliest convenience to avoid any late fees.</p>

    {{#if paymentLink}}
    <p style="text-align: center;">
      <a href="{{paymentLink}}" class="button">Pay Now</a>
    </p>
    {{/if}}

    <p>If you've already sent payment, please disregard this reminder.</p>

    <p>Best regards,<br>{{companyName}}</p>
  </div>
</body>
</html>
`;

export class InvoiceEmailer {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, Handlebars.TemplateDelegate>;

  constructor(config?: EmailConfig) {
    const emailConfig = config || {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);
    this.templates = new Map();

    // Compile default templates
    this.templates.set('invoice', Handlebars.compile(defaultEmailTemplate));
    this.templates.set('reminder', Handlebars.compile(reminderEmailTemplate));
  }

  async sendInvoice(options: SendInvoiceOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const {
      invoice,
      to,
      cc,
      bcc,
      subject,
      message,
      attachPdf = true,
      paymentLink,
    } = options;

    try {
      const template = this.templates.get('invoice')!;

      const html = template({
        companyName: invoice.companyName,
        companyLogo: invoice.companyLogo,
        companyEmail: invoice.companyEmail,
        customerName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: format(new Date(invoice.issueDate), 'MMMM d, yyyy'),
        dueDate: format(new Date(invoice.dueDate), 'MMMM d, yyyy'),
        amountDue: formatCurrency(invoice.amountDue, invoice.currency),
        message,
        paymentLink,
      });

      const attachments = [];

      if (attachPdf) {
        const pdfBuffer = await generateInvoicePDF(invoice);
        attachments.push({
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
      }

      const result = await this.transporter.sendMail({
        from: `"${invoice.companyName}" <${invoice.companyEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
        subject: subject || `Invoice ${invoice.invoiceNumber} from ${invoice.companyName}`,
        html,
        attachments,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async sendReminder(
    invoice: Invoice,
    options: {
      to?: string;
      paymentLink?: string;
    } = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to = invoice.customer.email, paymentLink } = options;

    try {
      const template = this.templates.get('reminder')!;
      const dueDate = new Date(invoice.dueDate);
      const isOverdue = new Date() > dueDate;
      const daysOverdue = isOverdue
        ? Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const html = template({
        companyName: invoice.companyName,
        customerName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        dueDate: format(dueDate, 'MMMM d, yyyy'),
        amountDue: formatCurrency(invoice.amountDue, invoice.currency),
        isOverdue,
        daysOverdue,
        paymentLink,
      });

      const result = await this.transporter.sendMail({
        from: `"${invoice.companyName}" <${invoice.companyEmail}>`,
        to,
        subject: isOverdue
          ? `Overdue: Invoice ${invoice.invoiceNumber} - Payment Required`
          : `Reminder: Invoice ${invoice.invoiceNumber} Due Soon`,
        html,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send reminder email:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async sendPaymentConfirmation(
    invoice: Invoice,
    payment: { amount: number; date: Date }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const html = `
        <h2>Payment Received</h2>
        <p>Hi ${invoice.customer.name},</p>
        <p>Thank you for your payment of <strong>${formatCurrency(payment.amount, invoice.currency)}</strong>
        for invoice <strong>${invoice.invoiceNumber}</strong>.</p>
        ${invoice.amountDue > 0
          ? `<p>Remaining balance: ${formatCurrency(invoice.amountDue, invoice.currency)}</p>`
          : '<p>Your invoice has been paid in full.</p>'
        }
        <p>Thank you for your business!</p>
        <p>${invoice.companyName}</p>
      `;

      const result = await this.transporter.sendMail({
        from: `"${invoice.companyName}" <${invoice.companyEmail}>`,
        to: invoice.customer.email,
        subject: `Payment Received - Invoice ${invoice.invoiceNumber}`,
        html,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send payment confirmation:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Singleton instance
export const invoiceEmailer = new InvoiceEmailer();
```

## Recurring Invoices

```typescript
// lib/invoicing/recurring.ts
import { addWeeks, addMonths, addYears, isBefore, startOfDay } from 'date-fns';
import type { Invoice, RecurringFrequency } from './types';
import { generateInvoiceNumber } from './generator';
import { calculateDueDate } from './calculator';

interface RecurringConfig {
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
}

export function getNextRecurringDate(
  currentDate: Date,
  frequency: RecurringFrequency
): Date {
  switch (frequency) {
    case 'weekly':
      return addWeeks(currentDate, 1);
    case 'biweekly':
      return addWeeks(currentDate, 2);
    case 'monthly':
      return addMonths(currentDate, 1);
    case 'quarterly':
      return addMonths(currentDate, 3);
    case 'yearly':
      return addYears(currentDate, 1);
    default:
      return addMonths(currentDate, 1);
  }
}

export function shouldGenerateInvoice(
  lastGeneratedDate: Date | null,
  config: RecurringConfig,
  currentOccurrences: number
): boolean {
  const today = startOfDay(new Date());
  const startDate = startOfDay(new Date(config.startDate));

  // Check if we've passed the end date
  if (config.endDate && isBefore(config.endDate, today)) {
    return false;
  }

  // Check if we've reached max occurrences
  if (config.maxOccurrences && currentOccurrences >= config.maxOccurrences) {
    return false;
  }

  // If never generated, check if start date has passed
  if (!lastGeneratedDate) {
    return !isBefore(today, startDate);
  }

  // Check if next occurrence date has arrived
  const nextDate = getNextRecurringDate(lastGeneratedDate, config.frequency);
  return !isBefore(today, startOfDay(nextDate));
}

export async function generateRecurringInvoice(
  templateInvoice: Invoice,
  getLastSequence: () => Promise<number>
): Promise<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>> {
  const now = new Date();
  const invoiceNumber = await generateInvoiceNumber({}, getLastSequence);

  return {
    ...templateInvoice,
    invoiceNumber,
    status: 'draft',
    issueDate: now,
    dueDate: calculateDueDate(now, templateInvoice.paymentTerms),
    paidAt: undefined,
    sentAt: undefined,
    viewedAt: undefined,
    remindersSent: 0,
    lastReminderAt: undefined,
    amountPaid: 0,
    amountDue: templateInvoice.total,
    recurringParentId: templateInvoice.id,
    isRecurring: false, // Child invoices are not recurring
    stripePaymentIntentId: undefined,
  };
}

export function getRecurringDescription(frequency: RecurringFrequency): string {
  const descriptions: Record<RecurringFrequency, string> = {
    weekly: 'Every week',
    biweekly: 'Every 2 weeks',
    monthly: 'Every month',
    quarterly: 'Every 3 months',
    yearly: 'Every year',
  };
  return descriptions[frequency];
}

export function calculateRecurringDates(
  startDate: Date,
  frequency: RecurringFrequency,
  count: number
): Date[] {
  const dates: Date[] = [startDate];
  let currentDate = startDate;

  for (let i = 1; i < count; i++) {
    currentDate = getNextRecurringDate(currentDate, frequency);
    dates.push(currentDate);
  }

  return dates;
}
```

## React Components

```tsx
// components/invoicing/InvoiceForm.tsx
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { LineItems } from './LineItems';
import { CustomerSelect } from './CustomerSelect';
import type { Invoice, Customer, LineItem } from '@/lib/invoicing/types';
import { calculateInvoice, calculateLineItem } from '@/lib/invoicing/calculator';

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  issueDate: z.string(),
  dueDate: z.string(),
  paymentTerms: z.number().min(0),
  lineItems: z.array(z.object({
    description: z.string().min(1, 'Description required'),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    taxRate: z.number().optional(),
    discount: z.number().optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
  })).min(1, 'At least one item required'),
  discount: z.number().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  shippingAmount: z.number().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']).optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  customers: Customer[];
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onCancel?: () => void;
}

export function InvoiceForm({
  invoice,
  customers,
  onSubmit,
  onCancel,
}: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    invoice?.customer || null
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: invoice?.customerId || '',
      issueDate: invoice?.issueDate
        ? new Date(invoice.issueDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      dueDate: invoice?.dueDate
        ? new Date(invoice.dueDate).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: invoice?.paymentTerms || 30,
      lineItems: invoice?.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discount: item.discount,
        discountType: item.discountType,
      })) || [{ description: '', quantity: 1, unitPrice: 0 }],
      discount: invoice?.discount || 0,
      discountType: invoice?.discountType || 'fixed',
      shippingAmount: invoice?.shippingAmount || 0,
      notes: invoice?.notes || '',
      terms: invoice?.terms || '',
      isRecurring: invoice?.isRecurring || false,
      recurringFrequency: invoice?.recurringFrequency,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const watchedItems = watch('lineItems');
  const watchedDiscount = watch('discount');
  const watchedDiscountType = watch('discountType');
  const watchedShipping = watch('shippingAmount');
  const watchedRecurring = watch('isRecurring');

  // Calculate totals
  const calculatedItems = watchedItems.map((item) =>
    calculateLineItem({
      id: '',
      description: item.description,
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      taxRate: item.taxRate,
      discount: item.discount,
      discountType: item.discountType,
    })
  );

  const totals = calculateInvoice(calculatedItems, {
    discount: watchedDiscount,
    discountType: watchedDiscountType,
    shippingAmount: watchedShipping,
  });

  const handleFormSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Customer Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Customer</h3>
        <CustomerSelect
          customers={customers}
          selected={selectedCustomer}
          onSelect={(customer) => {
            setSelectedCustomer(customer);
            setValue('customerId', customer.id);
            if (customer.paymentTerms) {
              setValue('paymentTerms', customer.paymentTerms);
            }
          }}
          error={errors.customerId?.message}
        />
      </div>

      {/* Dates */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Invoice Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Issue Date
            </label>
            <input
              type="date"
              {...register('issueDate')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Terms (days)
            </label>
            <input
              type="number"
              {...register('paymentTerms', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Line Items</h3>
        <LineItems
          fields={fields}
          register={register}
          errors={errors}
          calculatedItems={calculatedItems}
          onAdd={() => append({ description: '', quantity: 1, unitPrice: 0 })}
          onRemove={remove}
        />
      </div>

      {/* Discount & Shipping */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Adjustments</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discount
            </label>
            <div className="mt-1 flex">
              <input
                type="number"
                step="0.01"
                {...register('discount', { valueAsNumber: true })}
                className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <select
                {...register('discountType')}
                className="rounded-r-md border-l-0 border-gray-300"
              >
                <option value="fixed">$</option>
                <option value="percentage">%</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Shipping
            </label>
            <input
              type="number"
              step="0.01"
              {...register('shippingAmount', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Recurring */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recurring Invoice</h3>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            {...register('isRecurring')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <label className="ml-2 text-sm text-gray-600">
            Make this a recurring invoice
          </label>
        </div>

        {watchedRecurring && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Frequency
            </label>
            <select
              {...register('recurringFrequency')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 Weeks</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}
      </div>

      {/* Notes & Terms */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Notes visible to customer..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Terms & Conditions
            </label>
            <textarea
              {...register('terms')}
              rows={3}
              placeholder="Payment terms, late fees, etc..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="space-y-2 text-right">
          <div className="flex justify-end">
            <span className="text-gray-600 w-32">Subtotal:</span>
            <span className="w-32 font-medium">${totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-end text-green-600">
              <span className="w-32">Discount:</span>
              <span className="w-32">-${totals.discountAmount.toFixed(2)}</span>
            </div>
          )}
          {totals.taxTotal > 0 && (
            <div className="flex justify-end">
              <span className="text-gray-600 w-32">Tax:</span>
              <span className="w-32">${totals.taxTotal.toFixed(2)}</span>
            </div>
          )}
          {totals.shippingAmount > 0 && (
            <div className="flex justify-end">
              <span className="text-gray-600 w-32">Shipping:</span>
              <span className="w-32">${totals.shippingAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-end border-t pt-2">
            <span className="w-32 font-semibold">Total:</span>
            <span className="w-32 font-semibold text-lg">
              ${totals.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}
```

```tsx
// components/invoicing/LineItems.tsx
'use client';

import { UseFormRegister, FieldErrors, UseFieldArrayReturn } from 'react-hook-form';
import { PlusIcon, TrashIcon } from 'lucide-react';
import type { LineItem } from '@/lib/invoicing/types';

interface LineItemsProps {
  fields: { id: string }[];
  register: UseFormRegister<any>;
  errors: FieldErrors;
  calculatedItems: LineItem[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function LineItems({
  fields,
  register,
  errors,
  calculatedItems,
  onAdd,
  onRemove,
}: LineItemsProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
        <div className="col-span-5">Description</div>
        <div className="col-span-2 text-center">Quantity</div>
        <div className="col-span-2 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-1"></div>
      </div>

      {/* Items */}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg"
        >
          <div className="md:col-span-5">
            <label className="md:hidden text-sm font-medium text-gray-500">
              Description
            </label>
            <input
              {...register(`lineItems.${index}.description`)}
              placeholder="Item description"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.lineItems?.[index]?.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.lineItems[index].description.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="md:hidden text-sm font-medium text-gray-500">
              Quantity
            </label>
            <input
              type="number"
              {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center"
            />
          </div>

          <div className="md:col-span-2">
            <label className="md:hidden text-sm font-medium text-gray-500">
              Unit Price
            </label>
            <input
              type="number"
              step="0.01"
              {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-right"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-end">
            <span className="font-medium">
              ${calculatedItems[index]?.amount.toFixed(2) || '0.00'}
            </span>
          </div>

          <div className="md:col-span-1 flex items-center justify-end">
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add Item Button */}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
      >
        <PlusIcon className="w-4 h-4" />
        Add Line Item
      </button>
    </div>
  );
}
```

```tsx
// components/invoicing/PaymentStatus.tsx
'use client';

import type { InvoiceStatus } from '@/lib/invoicing/types';

interface PaymentStatusProps {
  status: InvoiceStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800',
  },
  sent: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-800',
  },
  viewed: {
    label: 'Viewed',
    className: 'bg-purple-100 text-purple-800',
  },
  paid: {
    label: 'Paid',
    className: 'bg-green-100 text-green-800',
  },
  partial: {
    label: 'Partial',
    className: 'bg-yellow-100 text-yellow-800',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-800',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-500',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-orange-100 text-orange-800',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function PaymentStatus({ status, size = 'md' }: PaymentStatusProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${config.className}
        ${sizeClasses[size]}
      `}
    >
      {config.label}
    </span>
  );
}
```

## API Routes

```typescript
// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateInvoiceNumber } from '@/lib/invoicing/generator';
import { calculateInvoice, calculateLineItem, calculateDueDate } from '@/lib/invoicing/calculator';
import type { Invoice } from '@/lib/invoicing/types';

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // TODO: Replace with database query
    const invoices: Invoice[] = [];

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error('Failed to list invoices:', error);
    return NextResponse.json(
      { error: 'Failed to list invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      issueDate,
      dueDate,
      paymentTerms,
      lineItems,
      discount,
      discountType,
      shippingAmount,
      notes,
      terms,
      isRecurring,
      recurringFrequency,
    } = body;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate line items
    const calculatedItems = lineItems.map((item: any, index: number) =>
      calculateLineItem({
        id: nanoid(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discount: item.discount,
        discountType: item.discountType,
      })
    );

    // Calculate totals
    const totals = calculateInvoice(calculatedItems, {
      discount,
      discountType,
      shippingAmount,
    });

    const invoice: Invoice = {
      id: nanoid(),
      invoiceNumber,
      status: 'draft',
      customerId,
      customer: body.customer, // Should fetch from database
      companyName: process.env.COMPANY_NAME!,
      companyEmail: process.env.COMPANY_EMAIL!,
      companyAddress: {
        line1: '123 Business St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'US',
      },
      issueDate: new Date(issueDate),
      dueDate: dueDate ? new Date(dueDate) : calculateDueDate(new Date(issueDate), paymentTerms),
      paymentTerms,
      lineItems: calculatedItems,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      taxTotal: totals.taxTotal,
      discount,
      discountType,
      discountAmount: totals.discountAmount,
      shippingAmount: totals.shippingAmount,
      total: totals.total,
      amountPaid: 0,
      amountDue: totals.amountDue,
      currency: 'USD',
      notes,
      terms,
      isRecurring: isRecurring || false,
      recurringFrequency,
      remindersSent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // TODO: Save to database

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/invoices/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateInvoicePDF } from '@/lib/invoicing/pdf';
import type { Invoice } from '@/lib/invoicing/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Fetch invoice from database
    const invoice: Invoice = {} as Invoice;

    const pdfBuffer = await generateInvoicePDF(invoice);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/invoices/[id]/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { invoiceEmailer } from '@/lib/invoicing/email';
import type { Invoice } from '@/lib/invoicing/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { to, cc, subject, message } = body;

    // TODO: Fetch invoice from database
    const invoice: Invoice = {} as Invoice;

    const result = await invoiceEmailer.sendInvoice({
      invoice,
      to: to || invoice.customer.email,
      cc,
      subject,
      message,
      paymentLink: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/pay`,
    });

    if (result.success) {
      // Update invoice status to 'sent'
      // TODO: Update in database

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to send invoice:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    );
  }
}
```

## CLAUDE.md Integration

```markdown
## Invoicing System

### Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests

### Key Files
- `lib/invoicing/generator.ts` - Invoice number generation
- `lib/invoicing/calculator.ts` - Invoice calculations
- `lib/invoicing/pdf.tsx` - PDF generation with @react-pdf/renderer
- `lib/invoicing/email.ts` - Email delivery with nodemailer
- `lib/invoicing/recurring.ts` - Recurring invoice logic

### Invoice Workflow
1. Create draft → 2. Review/edit → 3. Send to customer → 4. Track payment → 5. Mark paid

### API Routes
- GET/POST `/api/invoices` - List/create invoices
- GET/PUT/DELETE `/api/invoices/[id]` - Manage invoice
- GET `/api/invoices/[id]/pdf` - Download PDF
- POST `/api/invoices/[id]/send` - Send email
- POST `/api/invoices/[id]/duplicate` - Duplicate invoice

### Invoice Number Format
Default: `INV-2026-00001` (prefix-year-sequence)
Configure in `lib/invoicing/generator.ts`

### PDF Customization
Edit templates in `lib/invoicing/templates/`
Register custom fonts in `pdf.tsx`
```

## AI Suggestions

1. **Batch Invoice Generation** - Generate multiple invoices at once from a CSV import or customer selection
2. **Payment Link Expiration** - Add expiration dates to payment links with countdown display
3. **Multi-Currency Support** - Add currency conversion with automatic exchange rate fetching
4. **Invoice Templates** - Create multiple customizable PDF templates with drag-and-drop editor
5. **Automatic Late Fees** - Calculate and apply late fees based on configurable rules and grace periods
6. **Customer Portal** - Self-service portal for customers to view invoices, make payments, and download PDFs
7. **Payment Plans** - Split invoices into installment payment plans with automatic scheduling
8. **Invoice Analytics Dashboard** - Revenue metrics, aging reports, and payment trend analysis
9. **Stripe Invoice Sync** - Two-way sync with Stripe Invoicing for unified billing management
10. **QuickBooks/Xero Integration** - Export invoices to accounting software with automatic reconciliation
