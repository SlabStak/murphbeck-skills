---
name: quickbooks
description: QuickBooks integration - invoicing, expenses, reports, and accounting automation
version: 1.0.0
category: integration
tags: [accounting, quickbooks, invoicing, expenses, bookkeeping]
---

# QUICKBOOKS.EXE - QuickBooks Accounting Integration

You are **QUICKBOOKS.EXE** - the QuickBooks accounting specialist that helps users manage invoicing, expenses, financial reports, and accounting automation.

## System Prompt

```
You are an expert in QuickBooks Online configuration, bookkeeping best practices, and accounting automation. You help users optimize their QuickBooks setup for accurate financial management.

EXPERTISE AREAS:
- Chart of accounts setup
- Invoice and estimate creation
- Expense tracking and categorization
- Bank reconciliation
- Financial reporting
- Sales tax management
- Payroll integration
- API integration

ACCOUNTING PRINCIPLES:
- Accurate categorization
- Timely reconciliation
- Proper documentation
- Consistent methods
- Separation of duties
- Audit trail maintenance
```

## Chart of Accounts

### Recommended Account Structure

```yaml
chart_of_accounts:
  assets:
    current_assets:
      - name: "Checking Account"
        type: "Bank"
        detail_type: "Checking"
        number: "1000"

      - name: "Savings Account"
        type: "Bank"
        detail_type: "Savings"
        number: "1010"

      - name: "Accounts Receivable"
        type: "Accounts Receivable"
        detail_type: "Accounts Receivable (A/R)"
        number: "1200"

      - name: "Inventory Asset"
        type: "Other Current Assets"
        detail_type: "Inventory"
        number: "1300"

      - name: "Prepaid Expenses"
        type: "Other Current Assets"
        detail_type: "Prepaid Expenses"
        number: "1400"

    fixed_assets:
      - name: "Computer Equipment"
        type: "Fixed Assets"
        detail_type: "Furniture & Fixtures"
        number: "1500"

      - name: "Accumulated Depreciation"
        type: "Fixed Assets"
        detail_type: "Accumulated Depreciation"
        number: "1550"

  liabilities:
    current_liabilities:
      - name: "Accounts Payable"
        type: "Accounts Payable"
        detail_type: "Accounts Payable (A/P)"
        number: "2000"

      - name: "Credit Card - Business"
        type: "Credit Card"
        detail_type: "Credit Card"
        number: "2100"

      - name: "Sales Tax Payable"
        type: "Other Current Liabilities"
        detail_type: "Sales Tax Payable"
        number: "2200"

      - name: "Payroll Liabilities"
        type: "Other Current Liabilities"
        detail_type: "Payroll Tax Payable"
        number: "2300"

    long_term_liabilities:
      - name: "Business Loan"
        type: "Long Term Liabilities"
        detail_type: "Notes Payable"
        number: "2500"

  equity:
    - name: "Owner's Equity"
      type: "Equity"
      detail_type: "Owner's Equity"
      number: "3000"

    - name: "Owner's Draw"
      type: "Equity"
      detail_type: "Owner's Draw"
      number: "3100"

    - name: "Retained Earnings"
      type: "Equity"
      detail_type: "Retained Earnings"
      number: "3200"

  income:
    - name: "Sales - Products"
      type: "Income"
      detail_type: "Sales of Product Income"
      number: "4000"

    - name: "Sales - Services"
      type: "Income"
      detail_type: "Service/Fee Income"
      number: "4100"

    - name: "Consulting Revenue"
      type: "Income"
      detail_type: "Service/Fee Income"
      number: "4200"

    - name: "Recurring Revenue"
      type: "Income"
      detail_type: "Service/Fee Income"
      number: "4300"

    - name: "Other Income"
      type: "Other Income"
      detail_type: "Other Miscellaneous Income"
      number: "4900"

  expenses:
    cost_of_goods_sold:
      - name: "Cost of Goods Sold"
        type: "Cost of Goods Sold"
        detail_type: "Supplies & Materials - COGS"
        number: "5000"

      - name: "Contractor Costs"
        type: "Cost of Goods Sold"
        detail_type: "Cost of Labor - COS"
        number: "5100"

    operating_expenses:
      - name: "Advertising & Marketing"
        type: "Expenses"
        detail_type: "Advertising/Promotional"
        number: "6000"

      - name: "Bank Fees"
        type: "Expenses"
        detail_type: "Bank Charges"
        number: "6050"

      - name: "Insurance"
        type: "Expenses"
        detail_type: "Insurance"
        number: "6100"

      - name: "Interest Expense"
        type: "Expenses"
        detail_type: "Interest Paid"
        number: "6150"

      - name: "Office Supplies"
        type: "Expenses"
        detail_type: "Office/General Administrative Expenses"
        number: "6200"

      - name: "Professional Services"
        type: "Expenses"
        detail_type: "Legal & Professional Fees"
        number: "6250"

      - name: "Rent or Lease"
        type: "Expenses"
        detail_type: "Rent or Lease of Buildings"
        number: "6300"

      - name: "Software & Subscriptions"
        type: "Expenses"
        detail_type: "Office/General Administrative Expenses"
        number: "6350"

      - name: "Travel"
        type: "Expenses"
        detail_type: "Travel"
        number: "6400"

      - name: "Meals & Entertainment"
        type: "Expenses"
        detail_type: "Entertainment"
        number: "6450"

      - name: "Utilities"
        type: "Expenses"
        detail_type: "Utilities"
        number: "6500"

      - name: "Payroll Expenses"
        type: "Expenses"
        detail_type: "Payroll Expenses"
        number: "6600"

      - name: "Payroll Taxes"
        type: "Expenses"
        detail_type: "Taxes Paid"
        number: "6650"

      - name: "Depreciation"
        type: "Expenses"
        detail_type: "Depreciation"
        number: "6700"

      - name: "Miscellaneous"
        type: "Expenses"
        detail_type: "Other Miscellaneous Service Cost"
        number: "6900"
```

## Invoice Templates

### Standard Invoice Template

```markdown
## INVOICE CONFIGURATION

### Company Settings
- Company Name: [Your Company]
- Logo: [Upload]
- Address: [Full address]
- Email: [invoices@company.com]
- Phone: [Number]
- Website: [URL]

### Invoice Preferences
- Default Terms: Net 30
- Default Message: "Thank you for your business!"
- Late Fee: 1.5% monthly on overdue balances
- Invoice Number Format: INV-[YYYY]-[0001]

### Line Item Defaults
- Sales Tax: [Rate]%
- Discount Line: Enabled
- Service Date: Required

---

## INVOICE TEMPLATE

**[COMPANY NAME]**
[Address Line 1]
[City, State ZIP]
[Phone] | [Email]

---

**INVOICE**

| | |
|---|---|
| **Invoice #:** | INV-2024-0001 |
| **Date:** | [Date] |
| **Due Date:** | [Date + Terms] |
| **Terms:** | Net 30 |

---

**BILL TO:**
[Customer Name]
[Company Name]
[Address]
[City, State ZIP]
[Email]

---

| # | Description | Qty | Rate | Amount |
|---|-------------|-----|------|--------|
| 1 | [Product/Service] | [X] | $[X.XX] | $[X.XX] |
| 2 | [Product/Service] | [X] | $[X.XX] | $[X.XX] |
| 3 | [Product/Service] | [X] | $[X.XX] | $[X.XX] |

---

| | |
|---|---|
| **Subtotal:** | $[X.XX] |
| **Discount (X%):** | -$[X.XX] |
| **Tax (X%):** | $[X.XX] |
| **TOTAL DUE:** | **$[X.XX]** |

---

**Payment Methods:**
- ACH/Bank Transfer: [Routing] / [Account]
- Credit Card: [Payment Link]
- Check: Payable to [Company Name]

**Notes:**
[Custom message or terms]

---

*Thank you for your business!*
```

### Recurring Invoice Setup

```yaml
recurring_invoice:
  customer: "[Customer Name]"
  template: "Standard Invoice"

  schedule:
    type: "Monthly"
    start_date: "2024-01-01"
    end_date: null  # Ongoing
    day_of_month: 1

  settings:
    auto_send: true
    days_before_due: 30
    reminder_emails:
      - days_before: 7
      - days_before: 1
      - days_after: 1
      - days_after: 7

  line_items:
    - description: "Monthly Retainer - [Service]"
      quantity: 1
      rate: 5000.00
      account: "Sales - Services"

    - description: "Software License"
      quantity: 1
      rate: 99.00
      account: "Recurring Revenue"

  email_template:
    subject: "Invoice from [Company] - {{invoice_number}}"
    body: |
      Hi {{customer_name}},

      Please find attached your invoice for {{invoice_date}}.

      Amount Due: {{total}}
      Due Date: {{due_date}}

      You can pay online here: {{payment_link}}

      Thank you for your continued business!

      Best regards,
      [Company Name]
```

## Expense Management

### Expense Categories & Rules

```yaml
expense_rules:
  # Auto-categorization rules
  auto_categorize:
    - vendor_contains: "AWS"
      category: "Software & Subscriptions"
      class: "Technology"

    - vendor_contains: "Google"
      category: "Advertising & Marketing"
      class: "Marketing"

    - vendor_contains: "Uber"
      category: "Travel"
      tax_category: "Travel"

    - vendor_contains: "Delta"
      category: "Travel"
      tax_category: "Travel"

    - vendor_contains: "Marriott"
      category: "Travel"
      tax_category: "Lodging"

    - vendor_contains: "Office Depot"
      category: "Office Supplies"

    - vendor_contains: "Staples"
      category: "Office Supplies"

    - vendor_contains: "Electric"
      category: "Utilities"

  # Approval workflows
  approval_rules:
    - amount_over: 500
      requires_approval: true
      approvers: ["manager"]

    - amount_over: 5000
      requires_approval: true
      approvers: ["finance_director", "ceo"]

    - category: "Meals & Entertainment"
      requires_approval: true
      requires_documentation: true
      documentation_fields:
        - "Business Purpose"
        - "Attendees"

  # Receipt requirements
  receipt_required:
    - amount_over: 25
    - categories: ["Travel", "Meals & Entertainment"]
```

### Expense Report Template

```markdown
## EXPENSE REPORT

**Employee:** [Name]
**Department:** [Department]
**Period:** [Start Date] - [End Date]
**Submitted:** [Date]

---

### Expenses

| Date | Vendor | Description | Category | Amount | Receipt |
|------|--------|-------------|----------|--------|---------|
| [Date] | [Vendor] | [Description] | [Category] | $[X.XX] | ☐ |
| [Date] | [Vendor] | [Description] | [Category] | $[X.XX] | ☐ |
| [Date] | [Vendor] | [Description] | [Category] | $[X.XX] | ☐ |

---

### Summary by Category

| Category | Amount |
|----------|--------|
| Travel | $[X.XX] |
| Meals & Entertainment | $[X.XX] |
| Office Supplies | $[X.XX] |
| **TOTAL** | **$[X.XX]** |

---

### Approvals

| Approver | Status | Date |
|----------|--------|------|
| [Manager] | ☐ Pending | |
| [Finance] | ☐ Pending | |

---

**Employee Certification:**
I certify that these expenses were incurred for legitimate business purposes.

Signature: _______________ Date: _______________

**Manager Approval:**
Approved: ☐ Yes ☐ No

Signature: _______________ Date: _______________
```

## Financial Reports

### Profit & Loss Report

```markdown
## PROFIT & LOSS STATEMENT
**[Company Name]**
**Period: [Start Date] to [End Date]**

---

### INCOME

| Account | Amount |
|---------|--------|
| Sales - Products | $[X,XXX.XX] |
| Sales - Services | $[X,XXX.XX] |
| Consulting Revenue | $[X,XXX.XX] |
| Recurring Revenue | $[X,XXX.XX] |
| Other Income | $[X,XXX.XX] |
| **TOTAL INCOME** | **$[XX,XXX.XX]** |

---

### COST OF GOODS SOLD

| Account | Amount |
|---------|--------|
| Cost of Goods Sold | $[X,XXX.XX] |
| Contractor Costs | $[X,XXX.XX] |
| **TOTAL COGS** | **$[X,XXX.XX]** |

---

### GROSS PROFIT | **$[XX,XXX.XX]** |
**Gross Margin** | **XX.X%** |

---

### OPERATING EXPENSES

| Account | Amount |
|---------|--------|
| Advertising & Marketing | $[X,XXX.XX] |
| Bank Fees | $[XXX.XX] |
| Insurance | $[X,XXX.XX] |
| Office Supplies | $[XXX.XX] |
| Professional Services | $[X,XXX.XX] |
| Rent or Lease | $[X,XXX.XX] |
| Software & Subscriptions | $[X,XXX.XX] |
| Travel | $[X,XXX.XX] |
| Utilities | $[XXX.XX] |
| Payroll Expenses | $[XX,XXX.XX] |
| Payroll Taxes | $[X,XXX.XX] |
| Depreciation | $[XXX.XX] |
| Miscellaneous | $[XXX.XX] |
| **TOTAL EXPENSES** | **$[XX,XXX.XX]** |

---

### NET OPERATING INCOME | **$[XX,XXX.XX]** |

---

### Other Income/Expense

| Account | Amount |
|---------|--------|
| Interest Income | $[XXX.XX] |
| Interest Expense | -$[XXX.XX] |
| **NET OTHER** | **$[XXX.XX]** |

---

### **NET INCOME** | **$[XX,XXX.XX]** |
```

### Cash Flow Statement

```markdown
## STATEMENT OF CASH FLOWS
**[Company Name]**
**Period: [Start Date] to [End Date]**

---

### OPERATING ACTIVITIES

| Item | Amount |
|------|--------|
| Net Income | $[XX,XXX.XX] |
| **Adjustments:** | |
| Depreciation | $[X,XXX.XX] |
| Accounts Receivable (Increase) | -$[X,XXX.XX] |
| Inventory (Increase) | -$[X,XXX.XX] |
| Accounts Payable Increase | $[X,XXX.XX] |
| **Net Cash from Operations** | **$[XX,XXX.XX]** |

---

### INVESTING ACTIVITIES

| Item | Amount |
|------|--------|
| Purchase of Equipment | -$[X,XXX.XX] |
| **Net Cash from Investing** | **-$[X,XXX.XX]** |

---

### FINANCING ACTIVITIES

| Item | Amount |
|------|--------|
| Owner Draws | -$[X,XXX.XX] |
| Loan Proceeds | $[XX,XXX.XX] |
| Loan Payments | -$[X,XXX.XX] |
| **Net Cash from Financing** | **$[X,XXX.XX]** |

---

### **NET CHANGE IN CASH** | **$[XX,XXX.XX]** |

| | |
|---|---|
| Beginning Cash | $[XX,XXX.XX] |
| Ending Cash | $[XX,XXX.XX] |
```

### AR Aging Report

```markdown
## ACCOUNTS RECEIVABLE AGING SUMMARY
**As of [Date]**

---

| Customer | Current | 1-30 | 31-60 | 61-90 | 90+ | Total |
|----------|---------|------|-------|-------|-----|-------|
| [Customer A] | $X,XXX | $XXX | $0 | $0 | $0 | $X,XXX |
| [Customer B] | $X,XXX | $0 | $XXX | $0 | $0 | $X,XXX |
| [Customer C] | $0 | $0 | $0 | $XXX | $X,XXX | $X,XXX |
| **TOTAL** | **$XX,XXX** | **$X,XXX** | **$XXX** | **$XXX** | **$X,XXX** | **$XX,XXX** |

---

### Aging Summary

| Bucket | Amount | % of Total |
|--------|--------|------------|
| Current | $XX,XXX | XX% |
| 1-30 Days | $X,XXX | X% |
| 31-60 Days | $XXX | X% |
| 61-90 Days | $XXX | X% |
| Over 90 Days | $X,XXX | X% |
| **Total Outstanding** | **$XX,XXX** | **100%** |

---

### Collection Notes

| Customer | Amount Over 60 | Last Contact | Next Action |
|----------|----------------|--------------|-------------|
| [Customer C] | $X,XXX | [Date] | [Action needed] |
```

## API Integration

### QuickBooks API Examples

```python
# QuickBooks Online API Integration

from intuitlib.client import AuthClient
from quickbooks import QuickBooks
from quickbooks.objects.customer import Customer
from quickbooks.objects.invoice import Invoice
from quickbooks.objects.item import Item

# Authentication
auth_client = AuthClient(
    client_id='your_client_id',
    client_secret='your_client_secret',
    environment='sandbox',  # or 'production'
    redirect_uri='https://your-app.com/callback'
)

# Initialize client
client = QuickBooks(
    auth_client=auth_client,
    refresh_token='your_refresh_token',
    company_id='your_company_id'
)

# Create Customer
def create_customer(display_name, email, phone=None):
    customer = Customer()
    customer.DisplayName = display_name
    customer.PrimaryEmailAddr = {"Address": email}
    if phone:
        customer.PrimaryPhone = {"FreeFormNumber": phone}

    customer.save(qb=client)
    return customer

# Create Invoice
def create_invoice(customer_id, line_items, due_date=None):
    invoice = Invoice()
    invoice.CustomerRef = {"value": customer_id}

    if due_date:
        invoice.DueDate = due_date

    lines = []
    for item in line_items:
        line = {
            "DetailType": "SalesItemLineDetail",
            "Amount": item['amount'],
            "SalesItemLineDetail": {
                "ItemRef": {"value": item['item_id']},
                "Qty": item.get('qty', 1),
                "UnitPrice": item['unit_price']
            },
            "Description": item.get('description', '')
        }
        lines.append(line)

    invoice.Line = lines
    invoice.save(qb=client)
    return invoice

# Get Invoices
def get_invoices(customer_id=None, status=None):
    query = "SELECT * FROM Invoice"
    conditions = []

    if customer_id:
        conditions.append(f"CustomerRef = '{customer_id}'")
    if status:
        conditions.append(f"Balance {'>' if status == 'unpaid' else '='} '0'")

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    invoices = Invoice.query(query, qb=client)
    return invoices

# Create Expense
def create_expense(vendor_id, account_id, amount, description, date=None):
    from quickbooks.objects.purchase import Purchase

    expense = Purchase()
    expense.PaymentType = "Cash"
    expense.AccountRef = {"value": account_id}
    expense.EntityRef = {"value": vendor_id, "type": "Vendor"}
    expense.TxnDate = date or datetime.now().strftime("%Y-%m-%d")

    expense.Line = [{
        "DetailType": "AccountBasedExpenseLineDetail",
        "Amount": amount,
        "AccountBasedExpenseLineDetail": {
            "AccountRef": {"value": account_id}
        },
        "Description": description
    }]

    expense.save(qb=client)
    return expense

# Get Profit and Loss Report
def get_profit_loss(start_date, end_date):
    from quickbooks.objects.report import Report

    report = Report.get(
        report_type='ProfitAndLoss',
        qb=client,
        params={
            'start_date': start_date,
            'end_date': end_date,
            'accounting_method': 'Accrual'
        }
    )
    return report

# Sync transactions to external system
def sync_invoices_to_external(since_date):
    query = f"SELECT * FROM Invoice WHERE MetaData.LastUpdatedTime > '{since_date}'"
    invoices = Invoice.query(query, qb=client)

    synced = []
    for invoice in invoices:
        payload = {
            'qb_id': invoice.Id,
            'customer_name': invoice.CustomerRef.name,
            'total': float(invoice.TotalAmt),
            'balance': float(invoice.Balance),
            'due_date': invoice.DueDate,
            'status': 'paid' if float(invoice.Balance) == 0 else 'unpaid'
        }
        # Send to external system
        synced.append(payload)

    return synced
```

### Webhook Configuration

```json
{
  "webhooks": [
    {
      "name": "Invoice Created",
      "entity": "Invoice",
      "operation": "Create",
      "endpoint": "https://your-app.com/webhooks/qb/invoice-created"
    },
    {
      "name": "Payment Received",
      "entity": "Payment",
      "operation": "Create",
      "endpoint": "https://your-app.com/webhooks/qb/payment-received"
    },
    {
      "name": "Customer Updated",
      "entity": "Customer",
      "operation": "Update",
      "endpoint": "https://your-app.com/webhooks/qb/customer-updated"
    }
  ],
  "verification": {
    "verifier_token": "your_verifier_token"
  }
}
```

## Automation Workflows

### Invoice Automation

```yaml
workflow: "Invoice Automation"

triggers:
  - event: "project_completed"
    source: "project_management_tool"

  - event: "milestone_reached"
    source: "project_management_tool"

  - event: "subscription_renewal"
    source: "billing_system"

actions:
  - name: "Create Invoice"
    steps:
      - get_customer_from_project
      - calculate_billable_amount
      - create_invoice_in_qb
      - send_invoice_email

  - name: "Send Reminders"
    schedule: "daily at 9am"
    conditions:
      - invoice_due_in_days: 7
      - invoice_not_paid: true
    actions:
      - send_reminder_email
      - create_follow_up_task

  - name: "Mark Overdue"
    schedule: "daily at 9am"
    conditions:
      - invoice_past_due: true
      - invoice_not_paid: true
    actions:
      - update_invoice_status: "overdue"
      - send_overdue_notice
      - notify_sales_rep
```

### Bank Reconciliation Workflow

```yaml
workflow: "Bank Reconciliation"

schedule: "daily at 6am"

steps:
  - name: "Import Transactions"
    source: "bank_feed"
    actions:
      - fetch_new_transactions
      - categorize_transactions
      - match_to_existing_records

  - name: "Auto-Match Rules"
    rules:
      - match_by_amount_and_date
      - match_by_vendor_name
      - match_by_check_number

  - name: "Review Required"
    conditions:
      - unmatched_transactions_exist: true
    actions:
      - create_reconciliation_report
      - notify_bookkeeper
      - flag_for_review

  - name: "Complete Reconciliation"
    conditions:
      - all_transactions_matched: true
      - balance_difference: 0
    actions:
      - mark_period_reconciled
      - generate_reconciliation_report
```

## Best Practices Checklist

```markdown
## QUICKBOOKS HEALTH CHECK

### Chart of Accounts
☐ Accounts properly organized
☐ Sub-accounts used appropriately
☐ Inactive accounts marked
☐ Account numbers assigned
☐ Opening balances entered correctly

### Invoicing
☐ Invoice template customized
☐ Payment terms set
☐ Late fee policy configured
☐ Online payments enabled
☐ Automatic reminders set up

### Expenses
☐ Bank feeds connected
☐ Auto-categorization rules set
☐ Receipt capture enabled
☐ Expense approval workflow active
☐ Vendor records complete

### Reconciliation
☐ Bank accounts reconciled monthly
☐ Credit cards reconciled monthly
☐ Discrepancies investigated
☐ Beginning balances verified

### Reporting
☐ Key reports favorited
☐ Custom reports created
☐ Report scheduling set up
☐ Dashboard configured

### Tax Compliance
☐ Sales tax rates configured
☐ Tax categories assigned
☐ 1099 vendor tracking enabled
☐ Year-end close completed

### Security
☐ User roles properly assigned
☐ Audit log reviewed regularly
☐ Two-factor authentication enabled
☐ Third-party app permissions reviewed
```

## API Parameters

```python
model = "claude-sonnet-4-20250514"
max_tokens = 8192
temperature = 0.3
```

## Usage

```
/quickbooks

# Specific operations:
/quickbooks --action setup-chart-of-accounts --industry "professional services"
/quickbooks --action create-invoice --customer "Acme Corp" --amount 5000
/quickbooks --action generate-report --type "profit-loss" --period "this quarter"
/quickbooks --action reconcile --account "checking"
/quickbooks --action api-integration --operation "sync invoices"
```

## Resources

- [QuickBooks Developer Portal](https://developer.intuit.com/)
- [QuickBooks API Documentation](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account)
- [QuickBooks Community](https://quickbooks.intuit.com/community/)
