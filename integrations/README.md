# Integration Skills

A collection of AI-powered skills for integrating with popular business platforms. Configure CRM systems, accounting software, and automate cross-platform workflows.

## Included Integrations

| Integration | Description | Use Cases |
|-------------|-------------|-----------|
| `hubspot-crm.md` | HubSpot CRM configuration and automation | Contacts, deals, sequences, workflows |
| `salesforce.md` | Salesforce administration and development | Leads, opportunities, Flows, Apex |
| `quickbooks.md` | QuickBooks accounting and bookkeeping | Invoicing, expenses, reports |

## Quick Start

### Installation

Copy skills to your Claude commands directory:

```bash
cp *.md ~/.claude/commands/
```

### Usage

```bash
/hubspot-crm
/salesforce
/quickbooks
```

## Integration Details

### HubSpot CRM

Complete HubSpot configuration and automation toolkit.

**Features:**
- Contact and company management
- Deal pipeline configuration
- Email sequences (outreach, re-engagement)
- Lead scoring workflows
- API integration patterns
- Reports and dashboards

**Common Operations:**
```bash
/hubspot-crm --action setup-pipeline --name "Sales Pipeline"
/hubspot-crm --action create-sequence --type "outreach"
/hubspot-crm --action build-workflow --trigger "lead score change"
```

---

### Salesforce

Enterprise Salesforce administration and development.

**Features:**
- Object schema configuration
- Flow Builder automation
- Apex triggers and classes
- SOQL query patterns
- Report builder
- Integration architecture

**Common Operations:**
```bash
/salesforce --action configure-object --object Lead
/salesforce --action create-flow --type "lead assignment"
/salesforce --action write-apex --trigger "validation"
```

---

### QuickBooks

Accounting automation and financial management.

**Features:**
- Chart of accounts setup
- Invoice templates and automation
- Expense categorization rules
- Financial reports (P&L, Cash Flow, AR Aging)
- Bank reconciliation workflows
- API integration

**Common Operations:**
```bash
/quickbooks --action setup-chart-of-accounts
/quickbooks --action create-invoice --customer "Acme"
/quickbooks --action generate-report --type "profit-loss"
```

## Cross-Platform Workflows

### CRM to Accounting Sync

```yaml
workflow: "Deal Won to Invoice"
trigger: "HubSpot Deal Stage = Closed Won"
actions:
  1. Get deal details from HubSpot
  2. Find or create customer in QuickBooks
  3. Create invoice with deal products
  4. Send invoice to customer
  5. Update HubSpot deal with invoice number
```

### Lead Sync Between CRMs

```yaml
workflow: "Lead Sync"
trigger: "New lead in either system"
actions:
  1. Detect source system
  2. Check for duplicate in target
  3. Create or update lead
  4. Sync custom fields
  5. Log sync activity
```

### Expense to CRM Activity

```yaml
workflow: "Client Expense Tracking"
trigger: "QuickBooks expense with client tag"
actions:
  1. Match expense to HubSpot/Salesforce account
  2. Create activity record
  3. Update account spend total
  4. Notify account owner if threshold exceeded
```

## API Authentication

### OAuth 2.0 Flow (All Platforms)

```python
# Common OAuth pattern
oauth_config = {
    "hubspot": {
        "auth_url": "https://app.hubspot.com/oauth/authorize",
        "token_url": "https://api.hubapi.com/oauth/v1/token",
        "scopes": ["contacts", "content", "automation"]
    },
    "salesforce": {
        "auth_url": "https://login.salesforce.com/services/oauth2/authorize",
        "token_url": "https://login.salesforce.com/services/oauth2/token",
        "scopes": ["api", "refresh_token"]
    },
    "quickbooks": {
        "auth_url": "https://appcenter.intuit.com/connect/oauth2",
        "token_url": "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
        "scopes": ["com.intuit.quickbooks.accounting"]
    }
}
```

## Data Mapping Standards

### Contact/Customer Fields

| Standard Field | HubSpot | Salesforce | QuickBooks |
|----------------|---------|------------|------------|
| Email | email | Email | PrimaryEmailAddr.Address |
| First Name | firstname | FirstName | GivenName |
| Last Name | lastname | LastName | FamilyName |
| Company | company | Company | CompanyName |
| Phone | phone | Phone | PrimaryPhone.FreeFormNumber |

### Deal/Opportunity/Invoice

| Concept | HubSpot | Salesforce | QuickBooks |
|---------|---------|------------|------------|
| Record | Deal | Opportunity | Invoice |
| Amount | amount | Amount | TotalAmt |
| Stage | dealstage | StageName | N/A |
| Owner | hubspot_owner_id | OwnerId | N/A |

## Error Handling

### Common API Errors

| Error | HubSpot | Salesforce | QuickBooks |
|-------|---------|------------|------------|
| Rate Limit | 429 - Retry-After header | 503 - Wait and retry | 429 - Throttled |
| Auth Expired | 401 - Refresh token | 401 - Refresh token | 401 - Refresh token |
| Not Found | 404 | INVALID_ID_FIELD | 404 |
| Validation | 400 - validationResults | FIELD_CUSTOM_VALIDATION | 400 - Fault |

### Retry Strategy

```python
retry_config = {
    "max_retries": 3,
    "backoff_factor": 2,
    "retry_on": [429, 500, 502, 503, 504],
    "timeout": 30
}
```

## Webhook Security

### Verification Methods

| Platform | Method |
|----------|--------|
| HubSpot | X-HubSpot-Signature header with SHA-256 |
| Salesforce | Outbound Message certificate validation |
| QuickBooks | intuit-signature header with HMAC-SHA256 |

## Best Practices

### Data Hygiene
- Deduplicate records before sync
- Validate email addresses
- Standardize phone number formats
- Normalize company names

### Sync Strategy
- Use webhooks for real-time updates
- Batch historical syncs
- Implement idempotent operations
- Log all sync activities

### Error Recovery
- Queue failed operations
- Implement dead letter handling
- Alert on repeated failures
- Provide manual resolution tools

## Support

- Issues: Create a GitHub issue
- Updates: Check for new versions quarterly
- Requests: Submit integration requests

## License

MIT - Free for personal and commercial use.

---

*Part of the Murphbeck AI Skills Library*
