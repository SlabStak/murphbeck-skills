# n8n Workflow Pack

A collection of 8 production-ready n8n workflow templates for common automation scenarios.

## Included Workflows

| Workflow | Description | Trigger | Key Integrations |
|----------|-------------|---------|------------------|
| `lead-capture-to-crm.json` | Capture leads and add to CRM | Webhook | HubSpot, Slack, Email |
| `ai-email-responder.json` | AI-powered email classification and response | IMAP | OpenAI, Email, Slack |
| `ai-content-generator.json` | Generate blog, social, email, and ad content | Webhook | OpenAI |
| `social-media-scheduler.json` | Schedule posts across platforms | Cron | Airtable, Twitter, LinkedIn, Facebook |
| `webhook-router.json` | Route webhooks to multiple destinations | Webhook | HTTP, Slack |
| `order-notification.json` | Order confirmations and alerts | Webhook | Email, Slack |
| `error-monitoring.json` | Error alerting with severity routing | Webhook | Slack, PagerDuty, Google Sheets |
| `data-sync.json` | Bi-directional sync between systems | Cron | HubSpot, Airtable, Slack |

## Quick Start

### 1. Import a Workflow

```bash
# In n8n UI:
1. Go to Workflows → Import from File
2. Select the workflow JSON file
3. Configure credentials
4. Activate workflow
```

### 2. Configure Credentials

Each workflow requires specific credentials:

| Service | Credential Type |
|---------|-----------------|
| Email (IMAP/SMTP) | `imap`, `smtp` |
| HubSpot | `hubspotApi` |
| OpenAI | `openAiApi` |
| Slack | `slackApi` |
| Twitter | `twitterOAuth1Api` |
| LinkedIn | `linkedInOAuth2Api` |
| Airtable | `airtableApi` |
| Google Sheets | `googleSheetsOAuth2Api` |
| PagerDuty | HTTP with API key |

### 3. Environment Variables

Set these in your n8n environment:

```bash
# Webhook handlers (for webhook-router)
STRIPE_WEBHOOK_HANDLER=https://your-api.com/stripe
SHOPIFY_WEBHOOK_HANDLER=https://your-api.com/shopify
GITHUB_WEBHOOK_HANDLER=https://your-api.com/github
SLACK_WEBHOOK_HANDLER=https://your-api.com/slack

# PagerDuty (for error-monitoring)
PAGERDUTY_EVENTS_URL=https://events.pagerduty.com/v2/enqueue
PAGERDUTY_ROUTING_KEY=your-routing-key
```

---

## Workflow Details

### lead-capture-to-crm.json

Captures leads from web forms, validates data, checks for duplicates, and syncs to CRM.

```
Webhook → Validate → Check Duplicate → Create Contact → Welcome Email → Notify Slack
```

**Configuration:**
- Update HubSpot credentials
- Set your SMTP server
- Configure Slack channel

**Input Schema:**
```json
{
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "company": "Acme Inc",
  "phone": "+1234567890"
}
```

---

### ai-email-responder.json

Monitors inbox, classifies emails with AI, and generates contextual responses.

```
IMAP Trigger → Filter Auto-Emails → Classify (AI) → Route by Type → Generate Response → Send → Log
```

**Email Classification:**
- `INQUIRY` → Sales response
- `SUPPORT` → Technical support response
- `FEEDBACK` → Customer success response
- `SPAM` → Ignored

**Configuration:**
- Set IMAP credentials for inbox monitoring
- Configure OpenAI API key
- Set SMTP for sending responses

---

### ai-content-generator.json

Generates multiple content types based on topic input.

```
Webhook → Route by Type → Generate Content (AI) → Format Output → Respond
```

**Supported Content Types:**
- `blog` - Full blog post with SEO structure
- `social` - Platform-optimized social posts
- `email` - Email campaigns and newsletters
- `ad` - Ad copy with A/B variations

**Input Example:**
```json
{
  "type": "blog",
  "topic": "AI in customer service",
  "audience": "business owners",
  "tone": "professional",
  "word_count": 1200
}
```

---

### social-media-scheduler.json

Fetches scheduled content from Airtable and posts to multiple platforms.

```
Schedule (4hr) → Fetch Queue → Split Items → Route Platform → Post → Update Status → Notify
```

**Airtable Schema Required:**
| Field | Type |
|-------|------|
| Content | Long text |
| Twitter Text | Text (optional) |
| LinkedIn Text | Text (optional) |
| Platforms | Multiple select |
| Publish Date | Date/Time |
| Status | Single select |

---

### webhook-router.json

Generic webhook router that dispatches incoming webhooks to appropriate handlers.

```
Webhook → Parse → Route by Source → Handler → Response
```

**Routing Logic:**
- `x-webhook-source` header
- `body.type` field
- `body.event` field

**Supported Sources:**
- Stripe
- Shopify
- GitHub
- Slack
- Custom (fallback to Slack logging)

---

### order-notification.json

Sends beautiful order confirmation emails with team notifications.

```
Webhook → Process Order → Send Customer Email + Notify Slack → Check High Value → Alert Sales → Respond
```

**Features:**
- Formatted HTML email with order table
- Slack notification to #orders channel
- High-value order alerts (>$500) to sales team

**Input Schema:**
```json
{
  "order_id": "ORD-12345",
  "customer_email": "customer@example.com",
  "customer_name": "Jane Doe",
  "items": [
    { "name": "Product A", "quantity": 2, "price": 29.99 }
  ],
  "shipping_cost": 5.99,
  "tax": 4.80
}
```

---

### error-monitoring.json

Receives errors from applications, classifies severity, and routes alerts appropriately.

```
Webhook → Parse Error → Route by Severity → Alert (Slack/PagerDuty) → Log to Sheets
```

**Severity Levels:**
| Level | Pattern | Action |
|-------|---------|--------|
| Critical | database, fatal, timeout | Slack #critical + PagerDuty |
| High | auth, payment, null | Slack #errors |
| Medium | warning | Slack #errors |
| Low | info | Log only |

**Compatible Sources:**
- Sentry webhooks
- Custom error payloads
- Application logging

---

### data-sync.json

Bi-directional sync between HubSpot and Airtable with conflict resolution.

```
Schedule (1hr) → Fetch Both Sources → Merge & Dedupe → Route Updates → Update Systems → Summarize
```

**Sync Logic:**
- Matches contacts by email
- Most recent update wins
- Bidirectional updates
- Slack notification on completion

---

## Common Patterns

### Adding Error Handling

Wrap any node with error handling:

```javascript
// In a Code node after API calls
try {
  const result = $input.item.json;
  // Process result
  return result;
} catch (error) {
  // Log error and return fallback
  return {
    success: false,
    error: error.message
  };
}
```

### Rate Limiting

Add delays between API calls:

```javascript
// Wait node or Code node
await new Promise(r => setTimeout(r, 1000)); // 1 second delay
```

### Pagination

Handle large datasets:

```javascript
// Loop with offset
const pageSize = 100;
let offset = 0;
let allItems = [];

while (true) {
  const items = await fetchPage(offset, pageSize);
  if (items.length === 0) break;
  allItems = [...allItems, ...items];
  offset += pageSize;
}
```

## Best Practices

### Security
- Use n8n's credential management (never hardcode secrets)
- Add webhook authentication (`?token=secret` or headers)
- Rotate API keys quarterly

### Performance
- Use batch operations when possible
- Implement caching for frequently accessed data
- Set appropriate schedule intervals

### Monitoring
- Always add error notification nodes
- Log important events to external storage
- Set up workflow execution alerts

## Customization

### Changing Triggers

Replace trigger nodes to adapt workflows:

| Current | Alternative |
|---------|-------------|
| Webhook | Schedule, Manual, App Trigger |
| Schedule | Webhook, Email Trigger |
| IMAP | Gmail, Outlook Trigger |

### Adding Destinations

Extend workflows with additional outputs:
- Add more Slack channels for different teams
- Include SMS alerts via Twilio
- Push to multiple CRMs simultaneously

## Support

- [n8n Documentation](https://docs.n8n.io)
- [n8n Community](https://community.n8n.io)
- [n8n Workflow Templates](https://n8n.io/workflows)

## License

MIT
