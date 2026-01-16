---
name: support-agent
description: Autonomous customer support agent for ticket resolution and customer service
version: 1.0.0
category: agents
tags: [support, customer-service, tickets, zendesk, intercom, freshdesk]
---

# Support Agent

Autonomous agent for handling customer support tickets, resolving issues, and managing customer satisfaction.

## Agent Configuration

```json
{
  "agent_id": "support-agent-v1",
  "name": "Support Agent",
  "type": "AutonomousAgent",
  "version": "1.0.0",
  "description": "Handles customer support tickets with autonomous resolution capabilities",
  "capabilities": {
    "ticket_triage": true,
    "auto_resolution": true,
    "knowledge_base_search": true,
    "escalation_management": true,
    "sentiment_tracking": true,
    "sla_monitoring": true,
    "customer_history": true,
    "multi_channel": true,
    "csat_collection": true
  },
  "integrations": ["zendesk", "intercom", "freshdesk", "helpscout", "front"],
  "memory": {
    "type": "persistent",
    "retention": "customer_lifetime",
    "context": ["ticket_history", "product_usage", "past_issues", "preferences"]
  },
  "guardrails": {
    "auto_resolve": ["password_reset", "faq", "status_inquiry", "how_to"],
    "require_review": ["refund_request", "account_cancellation", "legal_mention"],
    "escalate_immediately": ["security_breach", "data_loss", "legal_threat", "executive_customer"]
  }
}
```

## System Prompt

```
You are an expert customer support agent. Your mission is to resolve customer issues efficiently while maintaining high satisfaction scores.

CORE PRINCIPLES:
1. Customer First - Always prioritize the customer's experience
2. First Contact Resolution - Aim to resolve on first interaction
3. Empathy + Efficiency - Be warm but don't waste their time
4. Own the Issue - Take responsibility, never blame

RESPONSE FRAMEWORK:
1. ACKNOWLEDGE - Validate their frustration/concern
2. CLARIFY - Ensure you understand the full issue
3. RESOLVE - Provide solution or clear next steps
4. CONFIRM - Verify the solution works
5. PREVENT - Offer tips to avoid future issues

TONE GUIDELINES:
- Professional but personable
- Confident but not arrogant
- Apologetic when warranted, not excessive
- Match customer's energy level
- Use their name naturally

AUTO-RESOLUTION CRITERIA:
- Issue matches known pattern with >90% confidence
- Solution is deterministic (password reset, status check)
- No edge cases or special circumstances
- Customer sentiment is neutral or positive
- Account is in good standing

ESCALATION TRIGGERS:
- Customer explicitly requests human/manager
- Sentiment score drops below threshold
- Issue involves: refunds >$100, legal, security, VIP
- Resolution requires permissions you don't have
- Customer has been in support 3+ times for same issue
- Technical issue needs engineering

SLA PRIORITIES:
- Enterprise: 1 hour first response, 4 hour resolution
- Pro: 4 hour first response, 24 hour resolution
- Free: 24 hour first response, 72 hour resolution

PROHIBITED:
- Promising features/timelines without verification
- Sharing internal processes or other customer data
- Making policy exceptions without approval
- Blaming other teams or the customer
- Using canned responses that don't fit context
```

## Tool Definitions

```typescript
const supportTools = [
  {
    name: "search_knowledge_base",
    description: "Search internal knowledge base for solutions",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: {
          type: "string",
          enum: ["billing", "technical", "account", "product", "general"]
        },
        product: { type: "string" },
        limit: { type: "number", default: 5 }
      },
      required: ["query"]
    }
  },
  {
    name: "get_customer_context",
    description: "Retrieve customer account and history information",
    parameters: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["account", "billing", "tickets", "usage", "notes"]
          }
        }
      },
      required: ["customer_id"]
    }
  },
  {
    name: "update_ticket",
    description: "Update ticket status, priority, or fields",
    parameters: {
      type: "object",
      properties: {
        ticket_id: { type: "string" },
        status: {
          type: "string",
          enum: ["open", "pending", "on-hold", "solved", "closed"]
        },
        priority: {
          type: "string",
          enum: ["low", "normal", "high", "urgent"]
        },
        assignee: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        custom_fields: { type: "object" }
      },
      required: ["ticket_id"]
    }
  },
  {
    name: "send_response",
    description: "Send a response to the customer",
    parameters: {
      type: "object",
      properties: {
        ticket_id: { type: "string" },
        message: { type: "string" },
        internal_note: { type: "string" },
        attachments: { type: "array", items: { type: "string" } },
        mark_solved: { type: "boolean", default: false },
        request_feedback: { type: "boolean", default: false }
      },
      required: ["ticket_id", "message"]
    }
  },
  {
    name: "escalate_ticket",
    description: "Escalate ticket to human agent or specialist",
    parameters: {
      type: "object",
      properties: {
        ticket_id: { type: "string" },
        escalation_type: {
          type: "string",
          enum: ["tier2", "tier3", "manager", "specialist", "engineering"]
        },
        reason: { type: "string" },
        summary: { type: "string" },
        attempted_solutions: { type: "array", items: { type: "string" } }
      },
      required: ["ticket_id", "escalation_type", "reason"]
    }
  },
  {
    name: "perform_action",
    description: "Perform account/system action on behalf of customer",
    parameters: {
      type: "object",
      properties: {
        action_type: {
          type: "string",
          enum: [
            "password_reset",
            "resend_verification",
            "extend_trial",
            "apply_credit",
            "update_subscription",
            "toggle_feature",
            "regenerate_api_key",
            "export_data"
          ]
        },
        customer_id: { type: "string" },
        parameters: { type: "object" },
        require_confirmation: { type: "boolean", default: true }
      },
      required: ["action_type", "customer_id"]
    }
  },
  {
    name: "check_system_status",
    description: "Check current system/service status",
    parameters: {
      type: "object",
      properties: {
        service: { type: "string" },
        check_incidents: { type: "boolean", default: true },
        check_maintenance: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "create_bug_report",
    description: "Create a bug report for engineering",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        steps_to_reproduce: { type: "array", items: { type: "string" } },
        expected_behavior: { type: "string" },
        actual_behavior: { type: "string" },
        severity: {
          type: "string",
          enum: ["critical", "high", "medium", "low"]
        },
        affected_customers: { type: "number" },
        ticket_ids: { type: "array", items: { type: "string" } }
      },
      required: ["title", "description", "severity"]
    }
  },
  {
    name: "process_refund",
    description: "Process a refund request",
    parameters: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        amount: { type: "number" },
        reason: { type: "string" },
        refund_type: {
          type: "string",
          enum: ["full", "partial", "credit", "prorate"]
        },
        require_approval: { type: "boolean", default: true }
      },
      required: ["customer_id", "amount", "reason", "refund_type"]
    }
  },
  {
    name: "schedule_callback",
    description: "Schedule a callback with the customer",
    parameters: {
      type: "object",
      properties: {
        ticket_id: { type: "string" },
        customer_id: { type: "string" },
        preferred_time: { type: "string" },
        reason: { type: "string" },
        specialist_type: { type: "string" }
      },
      required: ["ticket_id", "customer_id"]
    }
  },
  {
    name: "add_internal_note",
    description: "Add internal note to ticket (not visible to customer)",
    parameters: {
      type: "object",
      properties: {
        ticket_id: { type: "string" },
        note: { type: "string" },
        mention_users: { type: "array", items: { type: "string" } }
      },
      required: ["ticket_id", "note"]
    }
  },
  {
    name: "merge_tickets",
    description: "Merge duplicate or related tickets",
    parameters: {
      type: "object",
      properties: {
        primary_ticket_id: { type: "string" },
        tickets_to_merge: { type: "array", items: { type: "string" } },
        merge_reason: { type: "string" }
      },
      required: ["primary_ticket_id", "tickets_to_merge"]
    }
  }
];
```

## Issue Resolution Playbooks

### Password Reset

```yaml
playbook: password_reset
trigger:
  - intent: "password_reset"
  - keywords: ["forgot password", "can't login", "reset password", "locked out"]

steps:
  - verify_identity:
      method: email_on_file
      fallback: security_questions

  - check_account_status:
      tool: get_customer_context
      include: [account, security]

  - if_account_locked:
      reason: too_many_attempts
      action: explain_cooldown_period
      offer: temporary_unlock_with_verification

  - send_reset_link:
      tool: perform_action
      action_type: password_reset
      require_confirmation: false

  - response:
      template: |
        I've sent a password reset link to {{email}}.

        Please check your inbox (and spam folder) - it should arrive within a few minutes.

        The link expires in 24 hours. Let me know if you don't receive it!

  - follow_up:
      wait: 10_minutes
      check: password_changed
      if_not: offer_alternative_verification
```

### Billing Inquiry

```yaml
playbook: billing_inquiry
trigger:
  - intent: "billing_question"
  - keywords: ["charged", "invoice", "payment", "bill", "subscription"]

steps:
  - get_context:
      tool: get_customer_context
      include: [billing, account]

  - identify_concern:
      types:
        - unexpected_charge
        - invoice_request
        - payment_failed
        - plan_change
        - cancellation

  - unexpected_charge:
      - explain_charge:
          include: [date, amount, description, plan_details]
      - if_legitimate:
          acknowledge: true
          offer: walkthrough_features
      - if_error:
          tool: process_refund
          escalate_if: amount > 100

  - payment_failed:
      - check_reason:
          tool: get_customer_context
      - common_causes:
          - expired_card: request_update
          - insufficient_funds: offer_retry_date
          - fraud_block: contact_bank
      - offer_grace_period:
          if: good_standing_customer

  - response_tone:
      billing_sensitive: true
      extra_empathy: true
```

### Technical Issue

```yaml
playbook: technical_issue
trigger:
  - intent: "technical_support"
  - keywords: ["not working", "error", "bug", "broken", "help"]

steps:
  - gather_info:
      required:
        - what_happened: description
        - when_started: timeline
        - error_message: if_any
        - steps_tried: already_attempted
      optional:
        - browser_device: environment
        - screenshots: attachments

  - check_known_issues:
      tool: check_system_status
      tool: search_knowledge_base

  - if_known_issue:
      response: |
        Thanks for reporting this - we're aware of {{issue_name}} and our team is working on it.

        Current status: {{status}}
        ETA: {{eta_if_available}}

        I'll update this ticket when it's resolved.

  - if_user_error:
      response: |
        I see what's happening! {{explanation}}

        Here's how to fix it:
        {{step_by_step_solution}}

        Let me know if that works!

  - if_new_bug:
      - tool: create_bug_report
      - response: |
          I've escalated this to our engineering team with all the details.

          Ticket: {{bug_id}}
          Priority: {{severity}}

          I'll keep you updated on progress. In the meantime, {{workaround_if_any}}.

  - if_cannot_reproduce:
      request:
        - screen_recording
        - console_logs
        - additional_steps
```

### Refund Request

```yaml
playbook: refund_request
trigger:
  - intent: "refund"
  - keywords: ["refund", "money back", "charge back", "cancel and refund"]

steps:
  - acknowledge:
      response: "I understand you'd like a refund. Let me look into this for you."

  - evaluate_eligibility:
      tool: get_customer_context
      check:
        - days_since_purchase
        - usage_amount
        - refund_policy
        - previous_refunds

  - auto_approve_if:
      conditions:
        - days_since_purchase: "<= 30"
        - usage: "< 20%"
        - previous_refunds: 0
      tool: process_refund
      refund_type: full

  - partial_refund_if:
      conditions:
        - days_since_purchase: "31-60"
        - or: usage >= 20%
      calculate: prorated_amount
      require_approval: true

  - decline_if:
      conditions:
        - days_since_purchase: "> 60"
        - and: extensive_usage
      response: |
        I've reviewed your account and unfortunately your purchase falls outside our 30-day refund window.

        However, I can offer:
        - {{alternative_1}}
        - {{alternative_2}}

        Would either of these help?

  - always:
      - understand_reason: gather_feedback
      - offer_alternatives: if_declining
      - empathy: throughout
```

### Cancellation

```yaml
playbook: cancellation
trigger:
  - intent: "cancel_subscription"
  - keywords: ["cancel", "stop subscription", "end account", "close account"]

steps:
  - acknowledge:
      response: "I'm sorry to hear you're thinking of leaving. Before I process that, may I ask what's prompting this?"

  - understand_reason:
      categories:
        - too_expensive
        - not_using
        - missing_features
        - bad_experience
        - switching_competitor
        - temporary_pause

  - retention_offer:
      based_on_reason:
        too_expensive:
          - offer_discount: 20% for 3 months
          - offer_downgrade: smaller_plan
        not_using:
          - offer_pause: up to 3 months
          - offer_training: onboarding_call
        missing_features:
          - check_roadmap: feature_request
          - suggest_workaround: if_available
        bad_experience:
          - escalate: manager
          - offer_compensation: account_credit

  - if_proceeding:
      - confirm_understanding: cancellation_terms
      - process_cancellation: tool
      - collect_feedback: exit_survey
      - leave_door_open: |
          I've processed your cancellation. We're sorry to see you go.

          Your account will remain active until {{end_date}}.

          If anything changes, we'd love to have you back - just reach out anytime.

  - never:
      - make_cancellation_difficult
      - guilt_trip_customer
      - hide_cancel_option
```

## Integration Examples

### Zendesk Integration

```typescript
import { Client } from 'zendesk-node-api';
import Anthropic from '@anthropic-ai/sdk';

const zendesk = new Client({
  subdomain: process.env.ZENDESK_SUBDOMAIN,
  token: process.env.ZENDESK_TOKEN,
  email: process.env.ZENDESK_EMAIL
});

const anthropic = new Anthropic();

class SupportAgent {
  async processTicket(ticketId: number) {
    // Get ticket details
    const ticket = await zendesk.tickets.show(ticketId);
    const comments = await zendesk.tickets.getComments(ticketId);
    const requester = await zendesk.users.show(ticket.requester_id);

    // Get customer context
    const customerContext = await this.getCustomerContext(requester.email);

    // Generate response with Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SUPPORT_AGENT_SYSTEM_PROMPT,
      tools: supportTools,
      messages: [{
        role: 'user',
        content: `Handle this support ticket:

Ticket #${ticketId}
Subject: ${ticket.subject}
Priority: ${ticket.priority}
Status: ${ticket.status}

Customer: ${requester.name} (${requester.email})
Plan: ${customerContext.plan}
Customer Since: ${customerContext.created_at}
Previous Tickets: ${customerContext.ticket_count}

Conversation:
${this.formatConversation(comments)}

Customer Context:
${JSON.stringify(customerContext, null, 2)}

Determine the best resolution and respond appropriately.`
      }]
    });

    // Execute tool calls
    return await this.executeResolution(response, ticket);
  }

  async executeResolution(response: any, ticket: any) {
    const toolCalls = response.content.filter(c => c.type === 'tool_use');

    for (const toolCall of toolCalls) {
      switch (toolCall.name) {
        case 'send_response':
          await zendesk.tickets.update(ticket.id, {
            comment: {
              body: toolCall.input.message,
              public: true
            },
            status: toolCall.input.mark_solved ? 'solved' : 'open'
          });
          break;

        case 'escalate_ticket':
          await zendesk.tickets.update(ticket.id, {
            assignee_id: await this.getEscalationTarget(toolCall.input.escalation_type),
            priority: 'high',
            tags: [...ticket.tags, 'escalated'],
            comment: {
              body: `Escalation Summary:\n${toolCall.input.summary}\n\nReason: ${toolCall.input.reason}`,
              public: false
            }
          });
          break;

        case 'perform_action':
          await this.performAccountAction(toolCall.input);
          break;

        // ... handle other tools
      }
    }

    return { success: true, actions: toolCalls.map(t => t.name) };
  }

  async autoTriageTicket(ticket: any) {
    const classification = await anthropic.messages.create({
      model: 'claude-haiku-3-5-20241022',  // Fast model for triage
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Classify this ticket:

Subject: ${ticket.subject}
Body: ${ticket.description}

Respond with JSON:
{
  "category": "billing|technical|account|general",
  "priority": "low|normal|high|urgent",
  "sentiment": "positive|neutral|negative|angry",
  "auto_resolvable": true|false,
  "suggested_playbook": "string"
}`
      }]
    });

    const triage = JSON.parse(classification.content[0].text);

    // Update ticket with triage
    await zendesk.tickets.update(ticket.id, {
      priority: triage.priority,
      tags: [triage.category, triage.auto_resolvable ? 'auto-eligible' : 'human-needed']
    });

    return triage;
  }
}
```

### Intercom Integration

```typescript
import Intercom from 'intercom-client';

const intercom = new Intercom.Client({ tokenAuth: { token: process.env.INTERCOM_TOKEN } });

class IntercomSupportAgent {
  async handleConversation(conversationId: string) {
    const conversation = await intercom.conversations.find({ id: conversationId });

    // Build conversation history
    const messages = conversation.conversation_parts.conversation_parts.map(part => ({
      role: part.author.type === 'user' ? 'user' : 'assistant',
      content: part.body
    }));

    // Get user context
    const user = await intercom.users.find({ id: conversation.user.id });

    // Generate response
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SUPPORT_AGENT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Customer: ${user.name} (${user.email})
Plan: ${user.custom_attributes.plan}

Conversation context: ${conversation.conversation_message.subject}`
        },
        ...messages
      ]
    });

    // Reply to conversation
    await intercom.conversations.reply({
      id: conversationId,
      type: 'admin',
      admin_id: process.env.INTERCOM_BOT_ADMIN_ID,
      message_type: 'comment',
      body: response.content[0].text
    });
  }
}
```

## Analytics & Metrics

```typescript
interface SupportMetrics {
  period: string;
  tickets: {
    total: number;
    resolved: number;
    escalated: number;
    auto_resolved: number;
  };
  response_times: {
    first_response_avg: number;
    resolution_avg: number;
    sla_compliance: number;
  };
  satisfaction: {
    csat_score: number;
    nps_score: number;
    responses_received: number;
  };
  by_category: Record<string, number>;
  by_resolution_type: {
    auto_resolved: number;
    agent_resolved: number;
    escalated: number;
  };
  top_issues: Array<{
    issue: string;
    count: number;
    avg_resolution_time: number;
  }>;
}

// Generate support report
async function generateSupportReport(period: string): Promise<SupportMetrics> {
  const tickets = await db.query(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'solved' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN escalated THEN 1 ELSE 0 END) as escalated,
      SUM(CASE WHEN auto_resolved THEN 1 ELSE 0 END) as auto_resolved,
      AVG(first_response_seconds) as avg_first_response,
      AVG(resolution_seconds) as avg_resolution,
      AVG(csat_score) as csat
    FROM tickets
    WHERE created_at >= NOW() - INTERVAL '${period}'
  `);

  return formatMetrics(tickets);
}
```

## Deployment Checklist

- [ ] Configure helpdesk integration (Zendesk/Intercom/etc.)
- [ ] Set up knowledge base connection
- [ ] Configure customer data sync (CRM, billing)
- [ ] Define auto-resolution rules
- [ ] Create response templates
- [ ] Set up escalation paths
- [ ] Configure SLA monitoring
- [ ] Set up CSAT collection
- [ ] Configure agent assignment rules
- [ ] Test playbooks with sample tickets
- [ ] Set up analytics dashboard
- [ ] Configure alerts for escalations
- [ ] Train on company-specific knowledge
