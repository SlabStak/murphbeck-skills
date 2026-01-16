---
name: email-agent
description: Autonomous email agent for triage, responses, and inbox management
version: 1.0.0
category: agents
tags: [email, automation, inbox, gmail, outlook, support]
---

# Email Agent

Autonomous agent for handling email triage, drafting responses, and managing inbox workflows.

## Agent Configuration

```json
{
  "agent_id": "email-agent-v1",
  "name": "Email Agent",
  "type": "AutonomousAgent",
  "version": "1.0.0",
  "description": "Handles email triage, response drafting, and inbox automation",
  "capabilities": {
    "email_classification": true,
    "auto_response": true,
    "draft_generation": true,
    "thread_summarization": true,
    "priority_scoring": true,
    "sentiment_analysis": true,
    "attachment_handling": true,
    "calendar_integration": true,
    "crm_sync": true
  },
  "integrations": ["gmail", "outlook", "sendgrid", "postmark", "resend"],
  "memory": {
    "type": "persistent",
    "retention": "90_days",
    "context": ["sender_history", "thread_context", "user_preferences"]
  },
  "guardrails": {
    "require_approval": ["external_first_contact", "sensitive_topics", "financial_commitments"],
    "auto_approve": ["known_contacts", "routine_responses", "internal_emails"]
  }
}
```

## System Prompt

```
You are an autonomous email agent managing inbox communications. Your goal is to maximize email efficiency while maintaining professional quality.

CORE RESPONSIBILITIES:
1. Triage incoming emails by priority and category
2. Draft appropriate responses matching sender context
3. Identify action items and deadlines
4. Escalate urgent or sensitive matters
5. Maintain consistent brand voice

CLASSIFICATION RULES:
- Priority 1 (Urgent): Time-sensitive, revenue impact, executive, legal
- Priority 2 (High): Customer issues, partner requests, important internal
- Priority 3 (Normal): Routine business, follow-ups, general inquiries
- Priority 4 (Low): Newsletters, promotions, FYI emails
- Priority 5 (Archive): Auto-notifications, receipts, no action needed

RESPONSE GUIDELINES:
1. Match the tone and formality of the sender
2. Be concise but complete - answer all questions
3. Include clear next steps or calls to action
4. For complex issues, acknowledge and set expectations
5. Never make commitments without verification
6. Respect confidentiality boundaries

AUTO-RESPONSE CRITERIA:
- Meeting confirmations/declines
- Out-of-office acknowledgments
- Receipt confirmations
- FAQ responses to known patterns
- Follow-up reminders

ESCALATION TRIGGERS:
- Legal threats or compliance issues
- Customer churn risk signals
- Executive or board communications
- Media/press inquiries
- Security incidents
- Complaints escalating in severity

PROHIBITED ACTIONS:
- Sending without approval on first contact to new external parties
- Making financial commitments
- Sharing confidential information
- Responding to obvious phishing
- Unsubscribing from business-critical lists
```

## Tool Definitions

```typescript
const emailTools = [
  {
    name: "classify_email",
    description: "Classify an email by priority, category, and required action",
    parameters: {
      type: "object",
      properties: {
        email_id: { type: "string" },
        priority: {
          type: "number",
          enum: [1, 2, 3, 4, 5],
          description: "1=Urgent, 5=Archive"
        },
        category: {
          type: "string",
          enum: [
            "support_request",
            "sales_inquiry",
            "partnership",
            "billing",
            "feedback",
            "meeting_request",
            "internal",
            "newsletter",
            "spam",
            "other"
          ]
        },
        sentiment: {
          type: "string",
          enum: ["positive", "neutral", "negative", "urgent"]
        },
        action_required: {
          type: "string",
          enum: ["respond", "forward", "schedule", "archive", "escalate", "none"]
        },
        due_date: {
          type: "string",
          description: "ISO date if deadline mentioned"
        }
      },
      required: ["email_id", "priority", "category", "action_required"]
    }
  },
  {
    name: "draft_response",
    description: "Draft a response to an email",
    parameters: {
      type: "object",
      properties: {
        email_id: { type: "string" },
        response_type: {
          type: "string",
          enum: ["reply", "reply_all", "forward"]
        },
        tone: {
          type: "string",
          enum: ["formal", "professional", "friendly", "apologetic", "firm"]
        },
        body: { type: "string" },
        include_signature: { type: "boolean", default: true },
        cc: { type: "array", items: { type: "string" } },
        bcc: { type: "array", items: { type: "string" } },
        schedule_send: { type: "string", description: "ISO datetime" }
      },
      required: ["email_id", "response_type", "body"]
    }
  },
  {
    name: "send_email",
    description: "Send a new email or approved draft",
    parameters: {
      type: "object",
      properties: {
        to: { type: "array", items: { type: "string" } },
        cc: { type: "array", items: { type: "string" } },
        bcc: { type: "array", items: { type: "string" } },
        subject: { type: "string" },
        body: { type: "string" },
        html_body: { type: "string" },
        attachments: { type: "array", items: { type: "string" } },
        reply_to: { type: "string" },
        draft_id: { type: "string", description: "Send existing draft" }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "summarize_thread",
    description: "Summarize an email thread",
    parameters: {
      type: "object",
      properties: {
        thread_id: { type: "string" },
        format: {
          type: "string",
          enum: ["brief", "detailed", "action_items", "timeline"]
        }
      },
      required: ["thread_id"]
    }
  },
  {
    name: "extract_action_items",
    description: "Extract action items from email content",
    parameters: {
      type: "object",
      properties: {
        email_id: { type: "string" },
        assign_to: { type: "string" },
        create_tasks: { type: "boolean", default: false }
      },
      required: ["email_id"]
    }
  },
  {
    name: "search_emails",
    description: "Search emails by criteria",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        from: { type: "string" },
        to: { type: "string" },
        subject: { type: "string" },
        date_from: { type: "string" },
        date_to: { type: "string" },
        has_attachment: { type: "boolean" },
        label: { type: "string" },
        limit: { type: "number", default: 20 }
      }
    }
  },
  {
    name: "apply_label",
    description: "Apply labels/folders to emails",
    parameters: {
      type: "object",
      properties: {
        email_ids: { type: "array", items: { type: "string" } },
        labels: { type: "array", items: { type: "string" } },
        remove_labels: { type: "array", items: { type: "string" } }
      },
      required: ["email_ids", "labels"]
    }
  },
  {
    name: "schedule_meeting",
    description: "Schedule a meeting from email context",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        attendees: { type: "array", items: { type: "string" } },
        proposed_times: {
          type: "array",
          items: { type: "string" },
          description: "ISO datetime options"
        },
        duration_minutes: { type: "number" },
        location: { type: "string" },
        description: { type: "string" },
        send_invite: { type: "boolean", default: true }
      },
      required: ["title", "attendees", "proposed_times", "duration_minutes"]
    }
  },
  {
    name: "create_follow_up",
    description: "Create a follow-up reminder",
    parameters: {
      type: "object",
      properties: {
        email_id: { type: "string" },
        follow_up_date: { type: "string" },
        action: {
          type: "string",
          enum: ["remind", "send_bump", "escalate"]
        },
        note: { type: "string" }
      },
      required: ["email_id", "follow_up_date", "action"]
    }
  },
  {
    name: "sync_to_crm",
    description: "Sync email interaction to CRM",
    parameters: {
      type: "object",
      properties: {
        email_id: { type: "string" },
        crm_record_type: {
          type: "string",
          enum: ["contact", "lead", "opportunity", "account"]
        },
        crm_record_id: { type: "string" },
        log_type: {
          type: "string",
          enum: ["email", "note", "activity"]
        }
      },
      required: ["email_id", "crm_record_type"]
    }
  },
  {
    name: "unsubscribe",
    description: "Unsubscribe from mailing list",
    parameters: {
      type: "object",
      properties: {
        email_id: { type: "string" },
        block_sender: { type: "boolean", default: false }
      },
      required: ["email_id"]
    }
  }
];
```

## Email Templates

### Response Templates

```typescript
const emailTemplates = {
  // Acknowledge receipt
  acknowledgment: {
    subject: "Re: {{original_subject}}",
    body: `Hi {{sender_first_name}},

Thank you for reaching out. I've received your email and will review it shortly.

{{#if timeline}}
I'll get back to you by {{timeline}}.
{{else}}
I'll get back to you within 24 hours.
{{/if}}

Best regards,
{{signature}}`
  },

  // Meeting request response
  meeting_accept: {
    subject: "Re: {{original_subject}}",
    body: `Hi {{sender_first_name}},

That time works for me. I've sent a calendar invite for {{meeting_time}}.

{{#if agenda}}
For the agenda, I'm thinking we cover:
{{agenda}}

Let me know if you'd like to add anything.
{{/if}}

Looking forward to it!

{{signature}}`
  },

  meeting_decline: {
    subject: "Re: {{original_subject}}",
    body: `Hi {{sender_first_name}},

Unfortunately, I'm not available at that time. Would any of these work instead?

{{#each alternative_times}}
- {{this}}
{{/each}}

Let me know what works best for you.

{{signature}}`
  },

  // Follow-up bump
  follow_up: {
    subject: "Re: {{original_subject}}",
    body: `Hi {{sender_first_name}},

I wanted to follow up on my previous email regarding {{topic}}.

{{#if action_needed}}
When you have a chance, could you {{action_needed}}?
{{else}}
Let me know if you have any questions or need any additional information.
{{/if}}

Thanks!

{{signature}}`
  },

  // Support response
  support_response: {
    subject: "Re: {{original_subject}}",
    body: `Hi {{sender_first_name}},

Thank you for contacting us about {{issue_summary}}.

{{resolution}}

{{#if additional_steps}}
Next steps:
{{#each additional_steps}}
{{@index}}. {{this}}
{{/each}}
{{/if}}

If you have any other questions, please don't hesitate to reach out.

{{signature}}`
  },

  // Out of office
  out_of_office: {
    subject: "Out of Office: {{original_subject}}",
    body: `Thank you for your email. I'm currently out of the office {{#if return_date}}until {{return_date}}{{else}}with limited access to email{{/if}}.

{{#if urgent_contact}}
For urgent matters, please contact {{urgent_contact}}.
{{/if}}

I'll respond to your email when I return.

{{signature}}`
  }
};
```

## Workflow Automation

### Inbox Processing Pipeline

```yaml
workflow: inbox_processing
trigger: new_email_received
schedule: every_5_minutes

steps:
  - fetch_new_emails:
      provider: gmail
      query: "is:unread -category:promotions -category:social"

  - for_each_email:
      parallel: true
      max_concurrent: 10

      steps:
        - classify:
            tool: classify_email
            store: classification

        - route_by_priority:
            switch: classification.priority
            cases:
              1:  # Urgent
                - notify_user:
                    channel: slack
                    message: "🚨 Urgent email from {{sender}}: {{subject}}"
                - apply_label:
                    labels: ["urgent", "needs-response"]

              2:  # High
                - apply_label:
                    labels: ["high-priority"]
                - check_auto_response:
                    condition: classification.category in ["meeting_request", "support_request"]
                    then: draft_response

              3:  # Normal
                - apply_label:
                    labels: [classification.category]

              4:  # Low
                - apply_label:
                    labels: ["low-priority"]
                - archive:
                    if: classification.category == "newsletter"

              5:  # Archive
                - archive: true
                - mark_read: true

        - extract_actions:
            tool: extract_action_items
            if: classification.action_required != "none"

        - sync_crm:
            tool: sync_to_crm
            if: sender.is_contact or sender.is_lead
```

### Auto-Response Rules

```typescript
interface AutoResponseRule {
  name: string;
  conditions: {
    from_pattern?: string;
    subject_pattern?: string;
    body_contains?: string[];
    category?: string;
    sender_type?: 'known' | 'unknown' | 'internal' | 'external';
    time_of_day?: { start: string; end: string };
    day_of_week?: number[];
  };
  action: {
    type: 'respond' | 'forward' | 'label' | 'archive' | 'escalate';
    template?: string;
    variables?: Record<string, string>;
    delay_minutes?: number;
    require_approval?: boolean;
  };
}

const autoResponseRules: AutoResponseRule[] = [
  {
    name: "Meeting Confirmation",
    conditions: {
      subject_pattern: "(calendar|meeting|invite|scheduled)",
      category: "meeting_request",
      sender_type: "known"
    },
    action: {
      type: "respond",
      template: "meeting_accept",
      require_approval: false
    }
  },
  {
    name: "Support Ticket Created",
    conditions: {
      from_pattern: "@(zendesk|freshdesk|intercom)\\.com$",
      subject_pattern: "ticket.*created"
    },
    action: {
      type: "label",
      variables: { labels: ["support", "auto-processed"] }
    }
  },
  {
    name: "Newsletter Archive",
    conditions: {
      category: "newsletter",
      body_contains: ["unsubscribe", "email preferences"]
    },
    action: {
      type: "archive"
    }
  },
  {
    name: "Executive Escalation",
    conditions: {
      from_pattern: "(ceo|cfo|cto|board)@",
      sender_type: "internal"
    },
    action: {
      type: "escalate",
      variables: { notify: "slack", channel: "#exec-inbox" }
    }
  },
  {
    name: "After Hours Response",
    conditions: {
      time_of_day: { start: "18:00", end: "09:00" },
      day_of_week: [0, 6],  // Weekend
      sender_type: "external"
    },
    action: {
      type: "respond",
      template: "acknowledgment",
      variables: { timeline: "next business day" },
      require_approval: true
    }
  }
];
```

## Integration Examples

### Gmail Integration

```typescript
import { google } from 'googleapis';
import Anthropic from '@anthropic-ai/sdk';

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
const anthropic = new Anthropic();

class EmailAgent {
  async processInbox() {
    // Fetch unread emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread -category:promotions',
      maxResults: 50
    });

    for (const message of response.data.messages || []) {
      await this.processEmail(message.id);
    }
  }

  async processEmail(messageId: string) {
    // Get full email content
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const parsed = this.parseEmail(email.data);

    // Classify with Claude
    const classification = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: EMAIL_AGENT_SYSTEM_PROMPT,
      tools: emailTools,
      messages: [{
        role: 'user',
        content: `Classify this email and determine the appropriate action:

From: ${parsed.from}
Subject: ${parsed.subject}
Date: ${parsed.date}

${parsed.body}

Previous context with this sender:
${await this.getSenderHistory(parsed.from)}`
      }]
    });

    // Execute tool calls
    await this.executeToolCalls(classification, email.data);
  }

  async generateResponse(email: ParsedEmail, context: string) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: EMAIL_AGENT_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Draft a response to this email:

${JSON.stringify(email, null, 2)}

Context: ${context}

Match the sender's tone and be concise but complete.`
      }]
    });

    return response.content[0].text;
  }

  async sendDraft(draft: EmailDraft) {
    const message = this.createMimeMessage(draft);

    if (draft.requiresApproval) {
      // Save as draft for review
      await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: { raw: message }
        }
      });
      return { status: 'draft_created', needsApproval: true };
    }

    // Send immediately
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: message }
    });
    return { status: 'sent' };
  }
}
```

### Outlook/Microsoft Graph Integration

```typescript
import { Client } from '@microsoft/microsoft-graph-client';

const graphClient = Client.initWithMiddleware({ authProvider });

class OutlookEmailAgent {
  async processInbox() {
    const messages = await graphClient
      .api('/me/mailFolders/inbox/messages')
      .filter('isRead eq false')
      .top(50)
      .select('id,subject,from,receivedDateTime,body,hasAttachments')
      .get();

    for (const message of messages.value) {
      await this.processMessage(message);
    }
  }

  async sendReply(messageId: string, body: string) {
    await graphClient
      .api(`/me/messages/${messageId}/reply`)
      .post({
        message: {
          body: {
            contentType: 'HTML',
            content: body
          }
        }
      });
  }

  async createDraft(draft: EmailDraft) {
    return await graphClient
      .api('/me/messages')
      .post({
        subject: draft.subject,
        body: {
          contentType: 'HTML',
          content: draft.body
        },
        toRecipients: draft.to.map(email => ({
          emailAddress: { address: email }
        }))
      });
  }

  async moveToFolder(messageId: string, folderId: string) {
    await graphClient
      .api(`/me/messages/${messageId}/move`)
      .post({ destinationId: folderId });
  }
}
```

## Analytics & Reporting

```typescript
interface EmailMetrics {
  period: 'daily' | 'weekly' | 'monthly';
  total_received: number;
  total_sent: number;
  auto_responded: number;
  manually_handled: number;
  average_response_time_hours: number;
  by_category: Record<string, number>;
  by_priority: Record<number, number>;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  top_senders: Array<{ email: string; count: number }>;
  busiest_hours: Array<{ hour: number; count: number }>;
}

async function generateEmailReport(period: string): Promise<EmailMetrics> {
  // Query email analytics from database
  const metrics = await db.query(`
    SELECT
      COUNT(*) as total,
      category,
      priority,
      sentiment,
      auto_responded,
      response_time_seconds
    FROM email_logs
    WHERE created_at >= NOW() - INTERVAL '${period}'
    GROUP BY category, priority, sentiment, auto_responded
  `);

  return aggregateMetrics(metrics);
}
```

## Deployment Checklist

- [ ] Configure OAuth for email provider (Gmail/Outlook)
- [ ] Set up webhook for real-time notifications
- [ ] Create email labels/folders structure
- [ ] Configure auto-response rules
- [ ] Set up approval workflow for sensitive emails
- [ ] Configure CRM integration
- [ ] Set up calendar integration
- [ ] Create email templates
- [ ] Configure notification channels (Slack, etc.)
- [ ] Set up analytics tracking
- [ ] Test with sample emails
- [ ] Configure rate limiting
- [ ] Set up error alerting
