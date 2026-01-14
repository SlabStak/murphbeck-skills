# Refund Processing Template

A comprehensive refund management system supporting full/partial refunds, return merchandise authorization (RMA), and multi-provider integrations.

## Installation

```bash
npm install stripe zod nanoid date-fns
```

## Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
REFUND_AUTO_APPROVE_THRESHOLD=50
REFUND_POLICY_DAYS=30
```

## Project Structure

```
lib/
├── refunds/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions
│   ├── processor.ts          # Refund processing logic
│   ├── validator.ts          # Refund validation
│   ├── calculator.ts         # Refund amount calculation
│   ├── providers/
│   │   ├── stripe.ts         # Stripe refunds
│   │   └── paypal.ts         # PayPal refunds
│   ├── rma.ts                # Return merchandise auth
│   └── notifications.ts      # Email notifications
components/
├── refunds/
│   ├── RefundRequestForm.tsx # Customer refund request
│   ├── RefundDetails.tsx     # Refund details view
│   ├── RefundList.tsx        # Admin refund list
│   ├── RefundApproval.tsx    # Admin approval interface
│   ├── RefundTimeline.tsx    # Refund status timeline
│   └── ReturnLabel.tsx       # Return shipping label
app/
├── refunds/
│   ├── page.tsx              # Customer refund history
│   ├── request/
│   │   └── page.tsx          # Submit refund request
│   └── [id]/
│       └── page.tsx          # Refund details
├── admin/
│   └── refunds/
│       ├── page.tsx          # Admin refund dashboard
│       └── [id]/
│           └── page.tsx      # Admin refund review
├── api/
│   └── refunds/
│       ├── route.ts          # List/create refunds
│       ├── [id]/
│       │   ├── route.ts      # Get/update refund
│       │   ├── approve/
│       │   │   └── route.ts  # Approve refund
│       │   ├── reject/
│       │   │   └── route.ts  # Reject refund
│       │   └── process/
│       │       └── route.ts  # Process payment refund
│       └── webhook/
│           └── route.ts      # Payment provider webhooks
```

## Type Definitions

```typescript
// lib/refunds/types.ts
export type RefundStatus =
  | 'pending'          // Awaiting review
  | 'approved'         // Approved, awaiting return
  | 'return_received'  // Return received
  | 'processing'       // Processing payment refund
  | 'completed'        // Refund completed
  | 'rejected'         // Refund rejected
  | 'cancelled';       // Cancelled by customer

export type RefundType =
  | 'full'
  | 'partial'
  | 'exchange'
  | 'store_credit';

export type RefundReason =
  | 'defective'
  | 'not_as_described'
  | 'wrong_item'
  | 'changed_mind'
  | 'arrived_late'
  | 'never_arrived'
  | 'duplicate_order'
  | 'fraud'
  | 'other';

export type RefundMethod =
  | 'original_payment'
  | 'store_credit'
  | 'bank_transfer'
  | 'check';

export interface RefundLineItem {
  id: string;
  orderItemId: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  quantityRefunded: number;
  unitPrice: number;
  totalPrice: number;
  reason: RefundReason;
  reasonDetails?: string;
  condition?: 'unopened' | 'opened' | 'damaged';
  requiresReturn: boolean;
}

export interface RefundRequest {
  id: string;
  refundNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;

  // Type and status
  type: RefundType;
  status: RefundStatus;
  reason: RefundReason;
  reasonDetails?: string;

  // Items
  lineItems: RefundLineItem[];

  // Amounts
  subtotalRefund: number;
  taxRefund: number;
  shippingRefund: number;
  totalRefund: number;
  restockingFee?: number;
  adjustments?: RefundAdjustment[];

  // Refund method
  method: RefundMethod;
  storeCreditId?: string;
  storeCreditAmount?: number;

  // Payment provider
  paymentProvider: 'stripe' | 'paypal' | 'square' | 'other';
  paymentIntentId?: string;
  refundTransactionId?: string;

  // Return handling
  requiresReturn: boolean;
  rmaNumber?: string;
  returnTrackingNumber?: string;
  returnCarrier?: string;
  returnLabelUrl?: string;
  returnReceivedAt?: Date;

  // Review
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;

  // Timestamps
  requestedAt: Date;
  approvedAt?: Date;
  processedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;

  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundAdjustment {
  type: 'fee' | 'discount' | 'credit';
  description: string;
  amount: number;
}

export interface RefundPolicy {
  id: string;
  name: string;
  description?: string;
  daysToRequest: number;
  daysToReturn: number;
  requiresReturn: boolean;
  restockingFeePercent: number;
  refundShipping: boolean;
  excludedCategories?: string[];
  excludedProducts?: string[];
  requiresApproval: boolean;
  autoApproveThreshold?: number;
  isDefault: boolean;
}

export interface RMARequest {
  id: string;
  rmaNumber: string;
  refundId: string;
  customerId: string;
  status: 'issued' | 'shipped' | 'received' | 'inspected' | 'closed';
  items: RefundLineItem[];
  shippingLabel?: {
    carrier: string;
    trackingNumber: string;
    labelUrl: string;
    cost: number;
  };
  returnAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  inspectionNotes?: string;
  issuedAt: Date;
  shippedAt?: Date;
  receivedAt?: Date;
  inspectedAt?: Date;
  closedAt?: Date;
}

export interface RefundStats {
  totalRefunds: number;
  totalAmount: number;
  averageAmount: number;
  byStatus: Record<RefundStatus, number>;
  byReason: Record<RefundReason, number>;
  averageProcessingDays: number;
  refundRate: number;
}
```

## Refund Processor

```typescript
// lib/refunds/processor.ts
import Stripe from 'stripe';
import { nanoid } from 'nanoid';
import type {
  RefundRequest,
  RefundStatus,
  RefundLineItem,
  RefundPolicy,
  RMARequest,
} from './types';
import { calculateRefundAmount } from './calculator';
import { validateRefundRequest } from './validator';
import { sendRefundNotification } from './notifications';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

interface ProcessRefundOptions {
  refundId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, string>;
}

export class RefundProcessor {
  private defaultPolicy: RefundPolicy;

  constructor(policy?: RefundPolicy) {
    this.defaultPolicy = policy || {
      id: 'default',
      name: 'Standard Refund Policy',
      daysToRequest: 30,
      daysToReturn: 14,
      requiresReturn: true,
      restockingFeePercent: 0,
      refundShipping: false,
      requiresApproval: true,
      autoApproveThreshold: 50,
      isDefault: true,
    };
  }

  async createRefundRequest(
    input: {
      orderId: string;
      orderNumber: string;
      customerId: string;
      customerEmail: string;
      customerName: string;
      lineItems: Omit<RefundLineItem, 'id'>[];
      reason: RefundRequest['reason'];
      reasonDetails?: string;
      paymentProvider: RefundRequest['paymentProvider'];
      paymentIntentId?: string;
    },
    policy?: RefundPolicy
  ): Promise<RefundRequest> {
    const activePolicy = policy || this.defaultPolicy;

    // Calculate refund amount
    const calculation = calculateRefundAmount(
      input.lineItems.map((item, i) => ({ ...item, id: `item-${i}` })),
      {
        restockingFeePercent: activePolicy.restockingFeePercent,
        refundShipping: activePolicy.refundShipping,
      }
    );

    // Determine if auto-approve
    const autoApprove =
      !activePolicy.requiresApproval ||
      (activePolicy.autoApproveThreshold !== undefined &&
        calculation.totalRefund <= activePolicy.autoApproveThreshold);

    const refundRequest: RefundRequest = {
      id: nanoid(),
      refundNumber: this.generateRefundNumber(),
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      customerId: input.customerId,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      type: calculation.type,
      status: autoApprove ? 'approved' : 'pending',
      reason: input.reason,
      reasonDetails: input.reasonDetails,
      lineItems: input.lineItems.map((item, i) => ({
        ...item,
        id: nanoid(),
        quantityRefunded: 0,
        requiresReturn: activePolicy.requiresReturn && item.condition !== 'defective',
      })),
      subtotalRefund: calculation.subtotalRefund,
      taxRefund: calculation.taxRefund,
      shippingRefund: calculation.shippingRefund,
      totalRefund: calculation.totalRefund,
      restockingFee: calculation.restockingFee,
      method: 'original_payment',
      paymentProvider: input.paymentProvider,
      paymentIntentId: input.paymentIntentId,
      requiresReturn: activePolicy.requiresReturn,
      requestedAt: new Date(),
      approvedAt: autoApprove ? new Date() : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate RMA if requires return and auto-approved
    if (autoApprove && activePolicy.requiresReturn) {
      const rma = await this.generateRMA(refundRequest);
      refundRequest.rmaNumber = rma.rmaNumber;
      refundRequest.returnLabelUrl = rma.shippingLabel?.labelUrl;
    }

    // Send notification
    await sendRefundNotification(refundRequest, autoApprove ? 'approved' : 'requested');

    return refundRequest;
  }

  async approveRefund(
    refund: RefundRequest,
    reviewerId: string,
    notes?: string
  ): Promise<RefundRequest> {
    if (refund.status !== 'pending') {
      throw new Error(`Cannot approve refund with status: ${refund.status}`);
    }

    const updatedRefund: RefundRequest = {
      ...refund,
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate RMA if requires return
    if (refund.requiresReturn) {
      const rma = await this.generateRMA(updatedRefund);
      updatedRefund.rmaNumber = rma.rmaNumber;
      updatedRefund.returnLabelUrl = rma.shippingLabel?.labelUrl;
    }

    // Send notification
    await sendRefundNotification(updatedRefund, 'approved');

    return updatedRefund;
  }

  async rejectRefund(
    refund: RefundRequest,
    reviewerId: string,
    reason: string
  ): Promise<RefundRequest> {
    if (refund.status !== 'pending') {
      throw new Error(`Cannot reject refund with status: ${refund.status}`);
    }

    const updatedRefund: RefundRequest = {
      ...refund,
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: reason,
      updatedAt: new Date(),
    };

    // Send notification
    await sendRefundNotification(updatedRefund, 'rejected');

    return updatedRefund;
  }

  async processPaymentRefund(
    refund: RefundRequest,
    options?: Partial<ProcessRefundOptions>
  ): Promise<RefundRequest> {
    if (!['approved', 'return_received'].includes(refund.status)) {
      throw new Error(`Cannot process refund with status: ${refund.status}`);
    }

    const updatedRefund: RefundRequest = {
      ...refund,
      status: 'processing',
      updatedAt: new Date(),
    };

    try {
      let refundTransactionId: string;

      switch (refund.paymentProvider) {
        case 'stripe':
          refundTransactionId = await this.processStripeRefund(
            refund,
            options?.amount
          );
          break;
        case 'paypal':
          refundTransactionId = await this.processPayPalRefund(
            refund,
            options?.amount
          );
          break;
        default:
          throw new Error(`Unsupported payment provider: ${refund.paymentProvider}`);
      }

      updatedRefund.status = 'completed';
      updatedRefund.refundTransactionId = refundTransactionId;
      updatedRefund.processedAt = new Date();
      updatedRefund.completedAt = new Date();

      // Update line item quantities
      updatedRefund.lineItems = updatedRefund.lineItems.map((item) => ({
        ...item,
        quantityRefunded: item.quantity,
      }));

      // Send notification
      await sendRefundNotification(updatedRefund, 'completed');
    } catch (error) {
      updatedRefund.status = 'approved'; // Revert to approved
      throw error;
    }

    return updatedRefund;
  }

  async cancelRefund(
    refund: RefundRequest,
    reason?: string
  ): Promise<RefundRequest> {
    if (!['pending', 'approved'].includes(refund.status)) {
      throw new Error(`Cannot cancel refund with status: ${refund.status}`);
    }

    const updatedRefund: RefundRequest = {
      ...refund,
      status: 'cancelled',
      reviewNotes: reason,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    };

    // Send notification
    await sendRefundNotification(updatedRefund, 'cancelled');

    return updatedRefund;
  }

  async markReturnReceived(
    refund: RefundRequest,
    inspectionNotes?: string
  ): Promise<RefundRequest> {
    if (refund.status !== 'approved') {
      throw new Error(`Cannot mark return received with status: ${refund.status}`);
    }

    const updatedRefund: RefundRequest = {
      ...refund,
      status: 'return_received',
      returnReceivedAt: new Date(),
      reviewNotes: inspectionNotes
        ? `${refund.reviewNotes || ''}\nInspection: ${inspectionNotes}`.trim()
        : refund.reviewNotes,
      updatedAt: new Date(),
    };

    // Send notification
    await sendRefundNotification(updatedRefund, 'return_received');

    return updatedRefund;
  }

  private async processStripeRefund(
    refund: RefundRequest,
    amount?: number
  ): Promise<string> {
    if (!refund.paymentIntentId) {
      throw new Error('No payment intent ID for Stripe refund');
    }

    const stripeRefund = await stripe.refunds.create({
      payment_intent: refund.paymentIntentId,
      amount: amount ? Math.round(amount * 100) : Math.round(refund.totalRefund * 100),
      reason: this.mapReasonToStripe(refund.reason),
      metadata: {
        refundId: refund.id,
        refundNumber: refund.refundNumber,
        orderId: refund.orderId,
      },
    });

    return stripeRefund.id;
  }

  private async processPayPalRefund(
    refund: RefundRequest,
    amount?: number
  ): Promise<string> {
    // PayPal refund implementation
    // Would use PayPal SDK here
    throw new Error('PayPal refund not implemented');
  }

  private mapReasonToStripe(reason: RefundRequest['reason']): Stripe.RefundCreateParams.Reason {
    switch (reason) {
      case 'duplicate_order':
        return 'duplicate';
      case 'fraud':
        return 'fraudulent';
      default:
        return 'requested_by_customer';
    }
  }

  private async generateRMA(refund: RefundRequest): Promise<RMARequest> {
    const rma: RMARequest = {
      id: nanoid(),
      rmaNumber: this.generateRMANumber(),
      refundId: refund.id,
      customerId: refund.customerId,
      status: 'issued',
      items: refund.lineItems.filter((item) => item.requiresReturn),
      returnAddress: {
        name: 'Returns Department',
        line1: '123 Return Center',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'US',
      },
      issuedAt: new Date(),
    };

    // Generate return shipping label
    // Would integrate with shipping provider here
    rma.shippingLabel = {
      carrier: 'USPS',
      trackingNumber: `9400111899223033333333`,
      labelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/refunds/${refund.id}/label`,
      cost: 0, // Free return label
    };

    return rma;
  }

  private generateRefundNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = nanoid(4).toUpperCase();
    return `RFD-${timestamp}-${random}`;
  }

  private generateRMANumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = nanoid(4).toUpperCase();
    return `RMA-${timestamp}-${random}`;
  }
}

// Singleton instance
export const refundProcessor = new RefundProcessor();
```

## Refund Calculator

```typescript
// lib/refunds/calculator.ts
import type { RefundLineItem, RefundType, RefundAdjustment } from './types';

interface CalculationOptions {
  restockingFeePercent?: number;
  refundShipping?: boolean;
  shippingAmount?: number;
  taxRate?: number;
}

interface CalculationResult {
  type: RefundType;
  subtotalRefund: number;
  taxRefund: number;
  shippingRefund: number;
  restockingFee: number;
  adjustments: RefundAdjustment[];
  totalRefund: number;
  breakdown: {
    itemId: string;
    itemRefund: number;
    taxRefund: number;
    restockingFee: number;
  }[];
}

export function calculateRefundAmount(
  items: RefundLineItem[],
  options: CalculationOptions = {}
): CalculationResult {
  const {
    restockingFeePercent = 0,
    refundShipping = false,
    shippingAmount = 0,
    taxRate,
  } = options;

  // Calculate item-level refunds
  const breakdown = items.map((item) => {
    const itemTotal = item.unitPrice * item.quantity;
    const restockingFee =
      item.condition !== 'defective'
        ? itemTotal * (restockingFeePercent / 100)
        : 0;
    const itemRefund = itemTotal - restockingFee;

    // Calculate tax refund for this item
    const itemTaxRefund = taxRate ? itemRefund * taxRate : 0;

    return {
      itemId: item.id,
      itemRefund: roundToTwoDecimals(itemRefund),
      taxRefund: roundToTwoDecimals(itemTaxRefund),
      restockingFee: roundToTwoDecimals(restockingFee),
    };
  });

  // Calculate totals
  const subtotalRefund = breakdown.reduce((sum, item) => sum + item.itemRefund, 0);
  const taxRefund = breakdown.reduce((sum, item) => sum + item.taxRefund, 0);
  const totalRestockingFee = breakdown.reduce(
    (sum, item) => sum + item.restockingFee,
    0
  );
  const shippingRefund = refundShipping ? shippingAmount : 0;

  // Determine refund type
  const originalTotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const type: RefundType =
    subtotalRefund >= originalTotal * 0.99 ? 'full' : 'partial';

  const totalRefund = roundToTwoDecimals(
    subtotalRefund + taxRefund + shippingRefund
  );

  return {
    type,
    subtotalRefund: roundToTwoDecimals(subtotalRefund),
    taxRefund: roundToTwoDecimals(taxRefund),
    shippingRefund: roundToTwoDecimals(shippingRefund),
    restockingFee: roundToTwoDecimals(totalRestockingFee),
    adjustments: [],
    totalRefund,
    breakdown,
  };
}

export function applyAdjustment(
  currentTotal: number,
  adjustment: RefundAdjustment
): number {
  switch (adjustment.type) {
    case 'fee':
      return roundToTwoDecimals(currentTotal - Math.abs(adjustment.amount));
    case 'discount':
    case 'credit':
      return roundToTwoDecimals(currentTotal + Math.abs(adjustment.amount));
    default:
      return currentTotal;
  }
}

export function calculatePartialRefund(
  originalAmount: number,
  items: { quantity: number; originalQuantity: number; unitPrice: number }[]
): number {
  const refundAmount = items.reduce((sum, item) => {
    const refundQty = item.originalQuantity - item.quantity;
    return sum + refundQty * item.unitPrice;
  }, 0);

  return roundToTwoDecimals(refundAmount);
}

export function calculateProRataRefund(
  totalPaid: number,
  daysUsed: number,
  totalDays: number
): number {
  if (totalDays <= 0 || daysUsed >= totalDays) return 0;

  const unusedDays = totalDays - daysUsed;
  const refundAmount = (totalPaid / totalDays) * unusedDays;

  return roundToTwoDecimals(refundAmount);
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
```

## Refund Validator

```typescript
// lib/refunds/validator.ts
import { differenceInDays } from 'date-fns';
import type { RefundRequest, RefundLineItem, RefundPolicy, RefundReason } from './types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface OrderInfo {
  orderId: string;
  orderDate: Date;
  items: {
    id: string;
    productId: string;
    quantity: number;
    quantityRefunded: number;
    unitPrice: number;
    category?: string;
  }[];
  totalAmount: number;
  amountRefunded: number;
  status: string;
}

export function validateRefundRequest(
  items: Omit<RefundLineItem, 'id'>[],
  order: OrderInfo,
  policy: RefundPolicy
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check order status
  if (!['completed', 'delivered', 'shipped'].includes(order.status)) {
    errors.push(`Order status "${order.status}" is not eligible for refund`);
  }

  // Check refund window
  const daysSinceOrder = differenceInDays(new Date(), order.orderDate);
  if (daysSinceOrder > policy.daysToRequest) {
    errors.push(
      `Refund request period has expired (${policy.daysToRequest} days)`
    );
  } else if (daysSinceOrder > policy.daysToRequest - 7) {
    warnings.push(
      `Refund window closes in ${policy.daysToRequest - daysSinceOrder} days`
    );
  }

  // Validate each item
  for (const item of items) {
    const orderItem = order.items.find((oi) => oi.id === item.orderItemId);

    if (!orderItem) {
      errors.push(`Item "${item.productName}" not found in order`);
      continue;
    }

    // Check quantity
    const availableQty = orderItem.quantity - orderItem.quantityRefunded;
    if (item.quantity > availableQty) {
      errors.push(
        `Requested quantity (${item.quantity}) exceeds available quantity (${availableQty}) for "${item.productName}"`
      );
    }

    // Check excluded categories
    if (
      policy.excludedCategories &&
      orderItem.category &&
      policy.excludedCategories.includes(orderItem.category)
    ) {
      errors.push(`"${item.productName}" is in a non-refundable category`);
    }

    // Check excluded products
    if (
      policy.excludedProducts &&
      policy.excludedProducts.includes(orderItem.productId)
    ) {
      errors.push(`"${item.productName}" is not eligible for refund`);
    }

    // Validate condition for certain reasons
    if (item.reason === 'changed_mind' && item.condition === 'opened') {
      warnings.push(
        `Opened items may have reduced refund for "changed mind" returns`
      );
    }
  }

  // Check total refund amount
  const requestedAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const remainingRefundable = order.totalAmount - order.amountRefunded;

  if (requestedAmount > remainingRefundable) {
    errors.push(
      `Requested refund ($${requestedAmount.toFixed(2)}) exceeds refundable amount ($${remainingRefundable.toFixed(2)})`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateReason(
  reason: RefundReason,
  daysSinceDelivery: number
): { valid: boolean; message?: string } {
  switch (reason) {
    case 'never_arrived':
      if (daysSinceDelivery < 7) {
        return {
          valid: false,
          message: 'Please wait at least 7 days before reporting non-delivery',
        };
      }
      break;

    case 'arrived_late':
      if (daysSinceDelivery > 30) {
        return {
          valid: false,
          message: 'Late arrival claims must be made within 30 days',
        };
      }
      break;

    case 'changed_mind':
      if (daysSinceDelivery > 14) {
        return {
          valid: false,
          message: 'Changed mind returns must be requested within 14 days',
        };
      }
      break;
  }

  return { valid: true };
}

export function isAutoApprovable(
  refund: Partial<RefundRequest>,
  policy: RefundPolicy,
  customerTrustScore?: number
): boolean {
  // Check threshold
  if (
    policy.autoApproveThreshold !== undefined &&
    (refund.totalRefund || 0) > policy.autoApproveThreshold
  ) {
    return false;
  }

  // Check reason - some reasons always need review
  const alwaysReviewReasons: RefundReason[] = ['fraud', 'not_as_described', 'defective'];
  if (refund.reason && alwaysReviewReasons.includes(refund.reason)) {
    return false;
  }

  // Check customer trust score if available
  if (customerTrustScore !== undefined && customerTrustScore < 0.7) {
    return false;
  }

  // Check for high-value items
  const hasHighValueItem = refund.lineItems?.some(
    (item) => item.unitPrice * item.quantity > 200
  );
  if (hasHighValueItem) {
    return false;
  }

  return true;
}
```

## Notifications

```typescript
// lib/refunds/notifications.ts
import nodemailer from 'nodemailer';
import type { RefundRequest } from './types';

type NotificationType =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'return_received'
  | 'processing'
  | 'completed'
  | 'cancelled';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const templates: Record<NotificationType, { subject: string; body: (r: RefundRequest) => string }> = {
  requested: {
    subject: 'Refund Request Received',
    body: (r) => `
      <h2>We've Received Your Refund Request</h2>
      <p>Hi ${r.customerName},</p>
      <p>We've received your refund request for order <strong>${r.orderNumber}</strong>.</p>
      <p><strong>Refund Number:</strong> ${r.refundNumber}</p>
      <p><strong>Amount:</strong> $${r.totalRefund.toFixed(2)}</p>
      <p>Our team will review your request and get back to you within 2-3 business days.</p>
    `,
  },
  approved: {
    subject: 'Refund Request Approved',
    body: (r) => `
      <h2>Your Refund Has Been Approved</h2>
      <p>Hi ${r.customerName},</p>
      <p>Great news! Your refund request <strong>${r.refundNumber}</strong> has been approved.</p>
      <p><strong>Refund Amount:</strong> $${r.totalRefund.toFixed(2)}</p>
      ${r.requiresReturn ? `
        <p><strong>Next Steps:</strong></p>
        <p>Please return the item(s) using the prepaid shipping label below:</p>
        <p><a href="${r.returnLabelUrl}">Download Return Label</a></p>
        <p>Your RMA Number: <strong>${r.rmaNumber}</strong></p>
        <p>Please include this number on the outside of your package.</p>
      ` : `
        <p>Your refund will be processed within 3-5 business days.</p>
      `}
    `,
  },
  rejected: {
    subject: 'Refund Request Update',
    body: (r) => `
      <h2>Refund Request Update</h2>
      <p>Hi ${r.customerName},</p>
      <p>We've reviewed your refund request <strong>${r.refundNumber}</strong> for order ${r.orderNumber}.</p>
      <p>Unfortunately, we're unable to process this refund at this time.</p>
      ${r.reviewNotes ? `<p><strong>Reason:</strong> ${r.reviewNotes}</p>` : ''}
      <p>If you have questions, please contact our support team.</p>
    `,
  },
  return_received: {
    subject: 'Return Received - Processing Refund',
    body: (r) => `
      <h2>We've Received Your Return</h2>
      <p>Hi ${r.customerName},</p>
      <p>We've received your returned item(s) for refund <strong>${r.refundNumber}</strong>.</p>
      <p>Your refund of <strong>$${r.totalRefund.toFixed(2)}</strong> is now being processed.</p>
      <p>Please allow 3-5 business days for the refund to appear in your account.</p>
    `,
  },
  processing: {
    subject: 'Refund Being Processed',
    body: (r) => `
      <h2>Your Refund is Being Processed</h2>
      <p>Hi ${r.customerName},</p>
      <p>Your refund of <strong>$${r.totalRefund.toFixed(2)}</strong> is being processed.</p>
      <p>Refund Number: ${r.refundNumber}</p>
    `,
  },
  completed: {
    subject: 'Refund Complete',
    body: (r) => `
      <h2>Your Refund is Complete</h2>
      <p>Hi ${r.customerName},</p>
      <p>We've processed your refund of <strong>$${r.totalRefund.toFixed(2)}</strong>.</p>
      <p>The funds should appear in your account within 5-10 business days, depending on your bank.</p>
      <p>Refund Number: ${r.refundNumber}</p>
      <p>Transaction ID: ${r.refundTransactionId}</p>
      <p>Thank you for your patience.</p>
    `,
  },
  cancelled: {
    subject: 'Refund Request Cancelled',
    body: (r) => `
      <h2>Refund Request Cancelled</h2>
      <p>Hi ${r.customerName},</p>
      <p>Your refund request <strong>${r.refundNumber}</strong> has been cancelled.</p>
      ${r.reviewNotes ? `<p><strong>Reason:</strong> ${r.reviewNotes}</p>` : ''}
      <p>If you didn't request this cancellation, please contact support.</p>
    `,
  },
};

export async function sendRefundNotification(
  refund: RefundRequest,
  type: NotificationType
): Promise<void> {
  const template = templates[type];

  try {
    await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_USER}>`,
      to: refund.customerEmail,
      subject: `${template.subject} - ${refund.refundNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
            h2 { color: #1a1a1a; }
            a { color: #0066cc; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          ${template.body(refund)}
          <div class="footer">
            <p>Order Number: ${refund.orderNumber}</p>
            <p>If you have questions, please reply to this email or contact our support team.</p>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send refund notification:', error);
  }
}

// Admin notification for manual review
export async function notifyAdminNewRefund(refund: RefundRequest): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from: `"Refund System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[ACTION REQUIRED] New Refund Request - ${refund.refundNumber}`,
      html: `
        <h2>New Refund Request Requires Review</h2>
        <p><strong>Refund Number:</strong> ${refund.refundNumber}</p>
        <p><strong>Order:</strong> ${refund.orderNumber}</p>
        <p><strong>Customer:</strong> ${refund.customerName} (${refund.customerEmail})</p>
        <p><strong>Amount:</strong> $${refund.totalRefund.toFixed(2)}</p>
        <p><strong>Reason:</strong> ${refund.reason}</p>
        ${refund.reasonDetails ? `<p><strong>Details:</strong> ${refund.reasonDetails}</p>` : ''}
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/refunds/${refund.id}">Review Refund</a></p>
      `,
    });
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}
```

## React Components

```tsx
// components/refunds/RefundRequestForm.tsx
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RefundReason, RefundLineItem } from '@/lib/refunds/types';

const refundItemSchema = z.object({
  orderItemId: z.string(),
  productName: z.string(),
  quantity: z.number().min(1),
  maxQuantity: z.number(),
  unitPrice: z.number(),
  reason: z.enum([
    'defective',
    'not_as_described',
    'wrong_item',
    'changed_mind',
    'arrived_late',
    'never_arrived',
    'duplicate_order',
    'other',
  ]),
  reasonDetails: z.string().optional(),
  condition: z.enum(['unopened', 'opened', 'damaged']).optional(),
});

const refundFormSchema = z.object({
  items: z.array(refundItemSchema).min(1, 'Select at least one item'),
  additionalComments: z.string().optional(),
});

type RefundFormData = z.infer<typeof refundFormSchema>;

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  quantityRefunded: number;
  unitPrice: number;
  image?: string;
}

interface RefundRequestFormProps {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  onSubmit: (data: RefundFormData) => Promise<void>;
  onCancel?: () => void;
}

const REASON_OPTIONS: { value: RefundReason; label: string }[] = [
  { value: 'defective', label: 'Item is defective or damaged' },
  { value: 'not_as_described', label: 'Item not as described' },
  { value: 'wrong_item', label: 'Received wrong item' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'arrived_late', label: 'Item arrived late' },
  { value: 'never_arrived', label: 'Item never arrived' },
  { value: 'duplicate_order', label: 'Duplicate order' },
  { value: 'other', label: 'Other reason' },
];

export function RefundRequestForm({
  orderId,
  orderNumber,
  items,
  onSubmit,
  onCancel,
}: RefundRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const availableItems = items.filter(
    (item) => item.quantity - item.quantityRefunded > 0
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RefundFormData>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      items: [],
      additionalComments: '',
    },
  });

  const watchedItems = watch('items');

  const toggleItemSelection = (item: OrderItem) => {
    const newSelected = new Set(selectedItems);
    const maxQty = item.quantity - item.quantityRefunded;

    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
      setValue(
        'items',
        watchedItems.filter((i) => i.orderItemId !== item.id)
      );
    } else {
      newSelected.add(item.id);
      setValue('items', [
        ...watchedItems,
        {
          orderItemId: item.id,
          productName: item.productName,
          quantity: maxQty,
          maxQuantity: maxQty,
          unitPrice: item.unitPrice,
          reason: 'defective',
        },
      ]);
    }

    setSelectedItems(newSelected);
  };

  const updateItemField = (
    itemId: string,
    field: string,
    value: unknown
  ) => {
    setValue(
      'items',
      watchedItems.map((item) =>
        item.orderItemId === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateTotal = () => {
    return watchedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  };

  const handleFormSubmit = async (data: RefundFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          Order: <span className="font-medium">{orderNumber}</span>
        </p>
      </div>

      {/* Item Selection */}
      <div>
        <h3 className="text-lg font-medium mb-4">Select Items to Return</h3>

        {availableItems.length === 0 ? (
          <p className="text-gray-500">No items available for refund.</p>
        ) : (
          <div className="space-y-4">
            {availableItems.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const selectedItem = watchedItems.find(
                (i) => i.orderItemId === item.id
              );

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    isSelected ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item)}
                      className="mt-1 h-5 w-5 rounded border-gray-300"
                    />

                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}

                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-500">
                        ${item.unitPrice.toFixed(2)} x{' '}
                        {item.quantity - item.quantityRefunded} available
                      </p>
                    </div>
                  </div>

                  {isSelected && selectedItem && (
                    <div className="mt-4 pl-9 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Quantity
                          </label>
                          <select
                            value={selectedItem.quantity}
                            onChange={(e) =>
                              updateItemField(
                                item.id,
                                'quantity',
                                parseInt(e.target.value)
                              )
                            }
                            className="mt-1 block w-full rounded-md border-gray-300"
                          >
                            {Array.from(
                              { length: selectedItem.maxQuantity },
                              (_, i) => i + 1
                            ).map((qty) => (
                              <option key={qty} value={qty}>
                                {qty}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Condition
                          </label>
                          <select
                            value={selectedItem.condition || ''}
                            onChange={(e) =>
                              updateItemField(item.id, 'condition', e.target.value)
                            }
                            className="mt-1 block w-full rounded-md border-gray-300"
                          >
                            <option value="">Select...</option>
                            <option value="unopened">Unopened</option>
                            <option value="opened">Opened</option>
                            <option value="damaged">Damaged</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Reason for Return
                        </label>
                        <select
                          value={selectedItem.reason}
                          onChange={(e) =>
                            updateItemField(item.id, 'reason', e.target.value)
                          }
                          className="mt-1 block w-full rounded-md border-gray-300"
                        >
                          {REASON_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedItem.reason === 'other' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Please explain
                          </label>
                          <textarea
                            value={selectedItem.reasonDetails || ''}
                            onChange={(e) =>
                              updateItemField(
                                item.id,
                                'reasonDetails',
                                e.target.value
                              )
                            }
                            rows={2}
                            className="mt-1 block w-full rounded-md border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {errors.items && (
          <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
        )}
      </div>

      {/* Additional Comments */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Additional Comments (optional)
        </label>
        <textarea
          {...register('additionalComments')}
          rows={3}
          placeholder="Any additional information..."
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      {/* Summary */}
      {watchedItems.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Refund Summary</h4>
          <div className="space-y-1 text-sm">
            {watchedItems.map((item) => (
              <div key={item.orderItemId} className="flex justify-between">
                <span>
                  {item.productName} x {item.quantity}
                </span>
                <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-medium">
              <span>Estimated Refund</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Final refund amount may vary based on return inspection.
          </p>
        </div>
      )}

      {/* Actions */}
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
          disabled={isSubmitting || watchedItems.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Refund Request'}
        </button>
      </div>
    </form>
  );
}
```

```tsx
// components/refunds/RefundTimeline.tsx
'use client';

import { CheckIcon, ClockIcon, XIcon, TruckIcon, CreditCardIcon } from 'lucide-react';
import type { RefundRequest, RefundStatus } from '@/lib/refunds/types';
import { format } from 'date-fns';

interface RefundTimelineProps {
  refund: RefundRequest;
}

interface TimelineStep {
  status: RefundStatus;
  label: string;
  description?: string;
  timestamp?: Date;
  icon: React.ReactNode;
}

export function RefundTimeline({ refund }: RefundTimelineProps) {
  const getSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [
      {
        status: 'pending',
        label: 'Request Submitted',
        description: 'Refund request received',
        timestamp: refund.requestedAt,
        icon: <ClockIcon className="w-5 h-5" />,
      },
    ];

    if (refund.status === 'rejected') {
      steps.push({
        status: 'rejected',
        label: 'Request Rejected',
        description: refund.reviewNotes || 'Refund request was rejected',
        timestamp: refund.reviewedAt,
        icon: <XIcon className="w-5 h-5" />,
      });
      return steps;
    }

    if (refund.status === 'cancelled') {
      steps.push({
        status: 'cancelled',
        label: 'Request Cancelled',
        timestamp: refund.cancelledAt,
        icon: <XIcon className="w-5 h-5" />,
      });
      return steps;
    }

    steps.push({
      status: 'approved',
      label: 'Approved',
      description: refund.requiresReturn
        ? 'Please return the item(s)'
        : 'Processing refund',
      timestamp: refund.approvedAt,
      icon: <CheckIcon className="w-5 h-5" />,
    });

    if (refund.requiresReturn) {
      steps.push({
        status: 'return_received',
        label: 'Return Received',
        description: 'Item(s) received and inspected',
        timestamp: refund.returnReceivedAt,
        icon: <TruckIcon className="w-5 h-5" />,
      });
    }

    steps.push({
      status: 'completed',
      label: 'Refund Completed',
      description: `$${refund.totalRefund.toFixed(2)} refunded`,
      timestamp: refund.completedAt,
      icon: <CreditCardIcon className="w-5 h-5" />,
    });

    return steps;
  };

  const steps = getSteps();

  const getStepState = (
    step: TimelineStep,
    index: number
  ): 'completed' | 'current' | 'upcoming' | 'error' => {
    if (step.status === 'rejected' || step.status === 'cancelled') {
      return 'error';
    }

    const statusOrder: RefundStatus[] = [
      'pending',
      'approved',
      'return_received',
      'processing',
      'completed',
    ];

    const currentIndex = statusOrder.indexOf(refund.status);
    const stepIndex = statusOrder.indexOf(step.status);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {steps.map((step, index) => {
          const state = getStepState(step, index);
          const isLast = index === steps.length - 1;

          return (
            <li key={step.status}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className={`absolute left-4 top-4 -ml-px h-full w-0.5 ${
                      state === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}

                <div className="relative flex items-start space-x-3">
                  <div
                    className={`
                      relative flex h-8 w-8 items-center justify-center rounded-full
                      ${state === 'completed' ? 'bg-green-500 text-white' : ''}
                      ${state === 'current' ? 'bg-blue-500 text-white' : ''}
                      ${state === 'upcoming' ? 'bg-gray-200 text-gray-500' : ''}
                      ${state === 'error' ? 'bg-red-500 text-white' : ''}
                    `}
                  >
                    {step.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-medium ${
                          state === 'upcoming' ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.timestamp && (
                        <p className="text-xs text-gray-500">
                          {format(new Date(step.timestamp), 'MMM d, h:mm a')}
                        </p>
                      )}
                    </div>
                    {step.description && (
                      <p
                        className={`text-sm ${
                          state === 'upcoming' ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

## API Routes

```typescript
// app/api/refunds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { refundProcessor } from '@/lib/refunds/processor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    // TODO: Fetch refunds from database
    const refunds: any[] = [];

    return NextResponse.json({ refunds });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to list refunds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const refund = await refundProcessor.createRefundRequest({
      orderId: body.orderId,
      orderNumber: body.orderNumber,
      customerId: body.customerId,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      lineItems: body.items,
      reason: body.reason,
      reasonDetails: body.reasonDetails,
      paymentProvider: body.paymentProvider,
      paymentIntentId: body.paymentIntentId,
    });

    // TODO: Save refund to database

    return NextResponse.json(refund, { status: 201 });
  } catch (error) {
    console.error('Refund creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create refund request' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/refunds/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { refundProcessor } from '@/lib/refunds/processor';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { reviewerId, notes } = body;

    // TODO: Fetch refund from database
    const refund: any = {};

    const updatedRefund = await refundProcessor.approveRefund(
      refund,
      reviewerId,
      notes
    );

    // TODO: Update refund in database

    return NextResponse.json(updatedRefund);
  } catch (error) {
    console.error('Refund approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve refund' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/refunds/[id]/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { refundProcessor } from '@/lib/refunds/processor';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // TODO: Fetch refund from database
    const refund: any = {};

    const updatedRefund = await refundProcessor.processPaymentRefund(refund, {
      amount: body.amount,
    });

    // TODO: Update refund in database

    return NextResponse.json(updatedRefund);
  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
```

## CLAUDE.md Integration

```markdown
## Refund System

### Commands
- `npm run dev` - Start development server
- `npm run test` - Run tests

### Key Files
- `lib/refunds/processor.ts` - Main refund processing logic
- `lib/refunds/calculator.ts` - Refund amount calculations
- `lib/refunds/validator.ts` - Refund validation rules
- `lib/refunds/notifications.ts` - Email notifications

### Refund Workflow
1. Customer submits request → 2. Review (auto or manual) → 3. RMA issued (if return required) → 4. Return received → 5. Payment refund processed → 6. Complete

### Status Flow
`pending` → `approved` → `return_received` → `processing` → `completed`
Or: `pending` → `rejected` | `cancelled`

### API Routes
- GET/POST `/api/refunds` - List/create refunds
- POST `/api/refunds/[id]/approve` - Approve refund
- POST `/api/refunds/[id]/reject` - Reject refund
- POST `/api/refunds/[id]/process` - Process payment refund

### Configuration
- `REFUND_AUTO_APPROVE_THRESHOLD` - Auto-approve below this amount
- `REFUND_POLICY_DAYS` - Days to request refund
```

## AI Suggestions

1. **Fraud Detection** - Flag suspicious refund patterns (frequent returns, same items, velocity)
2. **Photo Upload** - Require customers to upload photos of defective/damaged items
3. **Store Credit Option** - Offer bonus for accepting store credit instead of refund
4. **Partial Refund Calculator** - Visual tool for calculating partial refunds
5. **Return Label Integration** - Integrate with EasyPost/Shippo for prepaid return labels
6. **Refund Analytics** - Dashboard showing refund rates, reasons, costs by category
7. **Customer Trust Score** - Build trust score based on return history for auto-approve
8. **Restocking Fee Rules** - Configurable restocking fees by category, condition, timeframe
9. **Exchange Workflow** - Support direct exchanges instead of refund + repurchase
10. **Batch Processing** - Process multiple refunds at once for efficiency
