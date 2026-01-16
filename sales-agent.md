---
name: sales-agent
description: Autonomous sales agent for outbound prospecting, qualification, and pipeline management
version: 1.0.0
category: agents
tags: [sales, outbound, sdr, qualification, crm, prospecting]
---

# Sales Agent

Autonomous agent for outbound sales prospecting, lead qualification, and pipeline management.

## Agent Configuration

```json
{
  "agent_id": "sales-agent-v1",
  "name": "Sales Agent",
  "type": "AutonomousAgent",
  "version": "1.0.0",
  "description": "Handles outbound prospecting, lead qualification, and sales automation",
  "capabilities": {
    "lead_research": true,
    "outbound_sequencing": true,
    "lead_qualification": true,
    "meeting_scheduling": true,
    "proposal_generation": true,
    "pipeline_management": true,
    "competitor_analysis": true,
    "objection_handling": true,
    "follow_up_automation": true
  },
  "integrations": ["salesforce", "hubspot", "outreach", "salesloft", "apollo", "linkedin"],
  "memory": {
    "type": "persistent",
    "retention": "lead_lifetime",
    "context": ["interactions", "company_research", "pain_points", "competitors"]
  },
  "guardrails": {
    "daily_limits": {
      "emails": 200,
      "linkedin_messages": 50,
      "calls": 100
    },
    "require_approval": ["pricing_negotiation", "custom_terms", "enterprise_deals"],
    "blacklist": ["do_not_contact", "competitor_employees", "unsubscribed"]
  }
}
```

## System Prompt

```
You are an expert B2B sales development representative. Your mission is to generate qualified pipeline through personalized, value-driven outreach.

CORE PRINCIPLES:
1. Research First - Know the prospect before reaching out
2. Value Over Features - Lead with outcomes, not product specs
3. Personalization - Every touch should feel custom
4. Persistence - Strategic follow-up, not spam
5. Qualification - Quality over quantity

OUTREACH GUIDELINES:
- First email: <150 words, one clear CTA
- Follow-ups: Provide new value each time
- Subject lines: Specific, curiosity-driven, no clickbait
- Always reference something specific about them/their company
- Ask questions, don't just pitch

QUALIFICATION FRAMEWORK (BANT+):
- Budget: Do they have budget or can they create it?
- Authority: Decision maker or champion?
- Need: Do they have the problem we solve?
- Timeline: When do they need a solution?
- Fit: Are they in our ICP? Right size/industry?

LEAD SCORING:
- Hot (80-100): Active pain, budget, timeline <3 months
- Warm (50-79): Interest shown, evaluating options
- Cool (20-49): Early research, long timeline
- Cold (<20): No engagement or poor fit

CALL FRAMEWORK:
1. Pattern Interrupt - Break their autopilot
2. Permission - "Did I catch you at a bad time?"
3. Relevance - Why you, why now
4. Discovery - Questions to understand their world
5. Qualification - Determine fit and urgency
6. Next Steps - Clear, time-bound commitment

OBJECTION HANDLING:
- "Not interested" → Acknowledge, ask what prompted
- "We use competitor" → Understand satisfaction, offer comparison
- "No budget" → Quantify cost of status quo
- "Bad timing" → Agree on better time to reconnect
- "Send info" → Get commitment to review + follow-up

PROHIBITED:
- Lying or exaggerating capabilities
- Disparaging competitors directly
- Making unauthorized promises
- Contacting unsubscribed leads
- Aggressive or pushy tactics
- Generic mass outreach
```

## Tool Definitions

```typescript
const salesTools = [
  {
    name: "research_company",
    description: "Research a company for outreach preparation",
    parameters: {
      type: "object",
      properties: {
        company_name: { type: "string" },
        domain: { type: "string" },
        research_depth: {
          type: "string",
          enum: ["quick", "standard", "deep"]
        },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "company_info",
              "recent_news",
              "tech_stack",
              "funding",
              "hiring",
              "competitors",
              "pain_indicators"
            ]
          }
        }
      },
      required: ["company_name"]
    }
  },
  {
    name: "research_prospect",
    description: "Research an individual prospect",
    parameters: {
      type: "object",
      properties: {
        email: { type: "string" },
        linkedin_url: { type: "string" },
        name: { type: "string" },
        company: { type: "string" },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "background",
              "recent_activity",
              "mutual_connections",
              "content_shared",
              "job_changes"
            ]
          }
        }
      }
    }
  },
  {
    name: "generate_outreach",
    description: "Generate personalized outreach message",
    parameters: {
      type: "object",
      properties: {
        prospect_id: { type: "string" },
        channel: {
          type: "string",
          enum: ["email", "linkedin", "phone_script", "video"]
        },
        sequence_step: { type: "number" },
        angle: {
          type: "string",
          enum: [
            "pain_point",
            "trigger_event",
            "mutual_connection",
            "content_reference",
            "competitor_displacement",
            "success_story"
          ]
        },
        tone: {
          type: "string",
          enum: ["professional", "casual", "provocative", "consultative"]
        }
      },
      required: ["prospect_id", "channel"]
    }
  },
  {
    name: "send_outreach",
    description: "Send outreach through specified channel",
    parameters: {
      type: "object",
      properties: {
        prospect_id: { type: "string" },
        channel: {
          type: "string",
          enum: ["email", "linkedin", "sms"]
        },
        message: { type: "string" },
        subject: { type: "string" },
        schedule: { type: "string", description: "ISO datetime" },
        sequence_id: { type: "string" },
        step: { type: "number" }
      },
      required: ["prospect_id", "channel", "message"]
    }
  },
  {
    name: "qualify_lead",
    description: "Score and qualify a lead based on interactions",
    parameters: {
      type: "object",
      properties: {
        lead_id: { type: "string" },
        qualification_data: {
          type: "object",
          properties: {
            budget: { type: "string" },
            authority: { type: "string" },
            need: { type: "string" },
            timeline: { type: "string" },
            fit_score: { type: "number" }
          }
        },
        notes: { type: "string" },
        next_action: {
          type: "string",
          enum: ["nurture", "schedule_demo", "send_proposal", "disqualify", "escalate_ae"]
        }
      },
      required: ["lead_id", "qualification_data"]
    }
  },
  {
    name: "schedule_meeting",
    description: "Schedule a meeting with prospect",
    parameters: {
      type: "object",
      properties: {
        prospect_id: { type: "string" },
        meeting_type: {
          type: "string",
          enum: ["discovery", "demo", "technical", "proposal", "negotiation"]
        },
        duration_minutes: { type: "number" },
        attendees: { type: "array", items: { type: "string" } },
        proposed_times: { type: "array", items: { type: "string" } },
        booking_link: { type: "string" }
      },
      required: ["prospect_id", "meeting_type"]
    }
  },
  {
    name: "update_crm",
    description: "Update CRM with lead/opportunity data",
    parameters: {
      type: "object",
      properties: {
        record_type: {
          type: "string",
          enum: ["lead", "contact", "opportunity", "activity"]
        },
        record_id: { type: "string" },
        updates: { type: "object" },
        log_activity: {
          type: "object",
          properties: {
            type: { type: "string" },
            subject: { type: "string" },
            notes: { type: "string" }
          }
        }
      },
      required: ["record_type", "record_id", "updates"]
    }
  },
  {
    name: "create_sequence",
    description: "Create a multi-touch outreach sequence",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        target_persona: { type: "string" },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "number" },
              channel: { type: "string" },
              template_type: { type: "string" }
            }
          }
        },
        exit_criteria: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["name", "steps"]
    }
  },
  {
    name: "handle_reply",
    description: "Process and respond to prospect reply",
    parameters: {
      type: "object",
      properties: {
        message_id: { type: "string" },
        reply_type: {
          type: "string",
          enum: [
            "interested",
            "objection",
            "question",
            "not_now",
            "unsubscribe",
            "referral",
            "meeting_request"
          ]
        },
        response: { type: "string" },
        update_status: { type: "string" },
        schedule_follow_up: { type: "string" }
      },
      required: ["message_id", "reply_type"]
    }
  },
  {
    name: "generate_proposal",
    description: "Generate a sales proposal",
    parameters: {
      type: "object",
      properties: {
        opportunity_id: { type: "string" },
        template: { type: "string" },
        pricing_tier: { type: "string" },
        custom_sections: { type: "array", items: { type: "string" } },
        valid_until: { type: "string" }
      },
      required: ["opportunity_id"]
    }
  },
  {
    name: "analyze_pipeline",
    description: "Analyze pipeline health and forecast",
    parameters: {
      type: "object",
      properties: {
        time_period: { type: "string" },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "forecast",
              "stuck_deals",
              "at_risk",
              "trending_up",
              "conversion_rates",
              "velocity"
            ]
          }
        }
      }
    }
  }
];
```

## Outreach Templates & Sequences

### Cold Email Sequence

```yaml
sequence: cold_outreach_decision_maker
target_persona: VP/Director at Mid-Market SaaS
duration: 21_days
touches: 8

steps:
  - day: 0
    channel: email
    type: initial_outreach
    template: |
      Subject: {{pain_point}} at {{company}}?

      Hi {{first_name}},

      {{personalization_hook}}

      I noticed {{company}} is {{trigger_event}}. Companies in similar situations often struggle with {{pain_point}}.

      We helped {{similar_company}} {{specific_result}} in {{timeframe}}.

      Worth a 15-minute call to see if we could do the same for you?

      {{signature}}

  - day: 3
    channel: linkedin
    type: connection_request
    template: |
      Hi {{first_name}} - I reached out via email about {{pain_point}}. Would love to connect and share some insights relevant to {{company}}'s {{initiative}}.

  - day: 5
    channel: email
    type: value_add
    template: |
      Subject: Re: {{pain_point}} at {{company}}?

      {{first_name}},

      Quick follow-up with something that might be useful.

      I put together this {{resource_type}} on {{topic}}: {{link}}

      Thought of you given {{relevance_reason}}.

      Still happy to chat if helpful.

      {{signature}}

  - day: 8
    channel: phone
    type: call_attempt
    script: |
      Hi {{first_name}}, this is {{my_name}} from {{my_company}}.

      I sent you an email about {{pain_point}} - did you get a chance to see it?

      [If yes] Great, what did you think?
      [If no] No worries. Quick reason for the call...

      We help companies like {{company}} {{value_prop}}. {{similar_company}} saw {{result}}.

      Would you be open to a 15-minute call to see if there's a fit?

  - day: 10
    channel: email
    type: case_study
    template: |
      Subject: How {{similar_company}} solved {{pain_point}}

      {{first_name}},

      Thought you'd find this relevant.

      {{similar_company}} faced {{similar_challenge}}. Within {{timeframe}}, they {{achieved_result}}.

      Here's the full story: {{case_study_link}}

      Happy to walk through how this could apply to {{company}}.

      {{signature}}

  - day: 14
    channel: linkedin
    type: engagement
    action: comment_on_post_or_share_content

  - day: 17
    channel: email
    type: breakup_warning
    template: |
      Subject: Should I close your file?

      {{first_name}},

      I've reached out a few times about helping {{company}} with {{pain_point}}.

      I don't want to be a pest - if the timing isn't right or this isn't relevant, just let me know and I'll close your file.

      But if {{pain_point}} is still on your radar, I'm happy to chat whenever works.

      {{signature}}

  - day: 21
    channel: email
    type: breakup
    template: |
      Subject: Closing the loop

      {{first_name}},

      I'll assume the timing isn't right and stop reaching out.

      If {{pain_point}} becomes a priority, you know where to find me.

      Wishing you and the {{company}} team all the best.

      {{signature}}

exit_criteria:
  - positive_reply
  - meeting_booked
  - explicit_unsubscribe
  - hard_bounce
```

### Reply Handling Playbooks

```typescript
const replyPlaybooks = {
  interested: {
    response_template: `Great to hear from you, {{first_name}}!

{{acknowledge_their_interest}}

I'd love to learn more about {{their_situation}} and share how we've helped similar companies.

Here's my calendar: {{booking_link}}

What works best for you?`,
    actions: [
      { tool: "update_crm", status: "engaged" },
      { tool: "schedule_meeting", type: "discovery" }
    ]
  },

  objection_competitor: {
    response_template: `Thanks for the reply, {{first_name}}.

Totally understand - {{competitor}} is solid.

Just curious, what made you go with them? And are there any gaps you've noticed?

We've actually helped several companies who switched from {{competitor}} - happy to share what typically drives that decision if helpful.`,
    actions: [
      { tool: "update_crm", add_note: "Using competitor: {{competitor}}" },
      { tool: "schedule_follow_up", days: 30 }
    ]
  },

  objection_no_budget: {
    response_template: `Appreciate the transparency, {{first_name}}.

Budget constraints are real. Quick question though - what's {{pain_point}} costing you today in terms of {{quantifiable_impact}}?

Sometimes the math changes when you look at it that way.

Either way, happy to stay in touch and reconnect when timing is better. When does your new budget cycle start?`,
    actions: [
      { tool: "update_crm", status: "nurture" },
      { tool: "schedule_follow_up", type: "budget_cycle" }
    ]
  },

  objection_bad_timing: {
    response_template: `Totally get it, {{first_name}} - timing is everything.

When would be a better time to reconnect? I'll set a reminder and reach back out then.

In the meantime, I'll send over some resources on {{relevant_topic}} that might be useful when you're ready.`,
    actions: [
      { tool: "update_crm", status: "future_opportunity" },
      { tool: "schedule_follow_up", datetime: "{{their_suggested_time}}" }
    ]
  },

  meeting_request: {
    response_template: `Perfect, {{first_name}}! Looking forward to it.

Here's my calendar with available times: {{booking_link}}

Pick whatever works best for you, and I'll send over a calendar invite with a Zoom link.

Before we meet, anything specific you'd like me to prepare?`,
    actions: [
      { tool: "update_crm", status: "meeting_requested" },
      { tool: "schedule_meeting", send_booking_link: true }
    ]
  },

  referral: {
    response_template: `Really appreciate the intro, {{first_name}}!

I'll reach out to {{referral_name}} and mention you connected us.

Thanks for thinking of us - let me know if there's ever anything I can do to return the favor.`,
    actions: [
      { tool: "create_lead", source: "referral", referred_by: "{{original_prospect}}" },
      { tool: "generate_outreach", angle: "referral" }
    ]
  },

  unsubscribe: {
    response_template: `Understood, {{first_name}}. I've removed you from our outreach.

If anything changes in the future, feel free to reach out.

All the best!`,
    actions: [
      { tool: "update_crm", status: "do_not_contact" },
      { tool: "remove_from_sequences" }
    ]
  }
};
```

## Integration Examples

### Outreach.io Integration

```typescript
import Outreach from 'outreach-sdk';
import Anthropic from '@anthropic-ai/sdk';

const outreach = new Outreach({ apiKey: process.env.OUTREACH_API_KEY });
const anthropic = new Anthropic();

class SalesAgent {
  async processLeadList(leads: Lead[]) {
    for (const lead of leads) {
      // Research the company
      const companyResearch = await this.researchCompany(lead.company);

      // Research the prospect
      const prospectResearch = await this.researchProspect(lead);

      // Generate personalized outreach
      const outreach = await this.generateOutreach(lead, {
        companyResearch,
        prospectResearch
      });

      // Add to sequence
      await this.addToSequence(lead, outreach);
    }
  }

  async generateOutreach(lead: Lead, research: any) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SALES_AGENT_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Generate a personalized cold email for:

Prospect: ${lead.name}, ${lead.title} at ${lead.company}
Email: ${lead.email}

Company Research:
${JSON.stringify(research.companyResearch, null, 2)}

Prospect Research:
${JSON.stringify(research.prospectResearch, null, 2)}

Our Value Prop: ${process.env.VALUE_PROPOSITION}
Target Pain Point: ${this.identifyPainPoint(research)}

Write a short (<150 words), personalized email with:
1. Specific personalization hook
2. Relevant pain point
3. Clear value proposition
4. Single CTA`
      }]
    });

    return {
      subject: this.extractSubject(response),
      body: response.content[0].text
    };
  }

  async addToSequence(lead: Lead, message: OutreachMessage) {
    // Create prospect in Outreach
    const prospect = await outreach.prospects.create({
      attributes: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        title: lead.title,
        company: lead.company
      }
    });

    // Add to sequence with personalized first step
    await outreach.sequenceStates.create({
      relationships: {
        prospect: { data: { type: 'prospect', id: prospect.id } },
        sequence: { data: { type: 'sequence', id: process.env.SEQUENCE_ID } }
      },
      attributes: {
        mailboxId: process.env.MAILBOX_ID
      }
    });

    // Override first email with personalized content
    await outreach.mailings.update(prospect.pendingMailingId, {
      attributes: {
        subject: message.subject,
        bodyHtml: message.body
      }
    });
  }

  async handleReply(event: OutreachWebhookEvent) {
    const { prospect, mailing, replyText } = event;

    // Classify reply
    const classification = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Classify this sales email reply:

Original outreach: ${mailing.body}

Reply: ${replyText}

Classify as one of:
- interested
- objection_competitor
- objection_no_budget
- objection_bad_timing
- meeting_request
- referral
- unsubscribe
- question

Return JSON: { "type": "...", "sentiment": "positive/neutral/negative", "key_points": [...] }`
      }]
    });

    const result = JSON.parse(classification.content[0].text);

    // Execute playbook
    await this.executeReplyPlaybook(prospect, result, replyText);
  }
}
```

### Apollo.io + HubSpot Integration

```typescript
import Apollo from 'apollo-sdk';
import HubSpot from '@hubspot/api-client';

const apollo = new Apollo({ apiKey: process.env.APOLLO_API_KEY });
const hubspot = new HubSpot.Client({ accessToken: process.env.HUBSPOT_TOKEN });

class LeadEnrichmentAgent {
  async enrichAndScore(domain: string) {
    // Get company data from Apollo
    const company = await apollo.organizations.search({
      domain: domain
    });

    // Get contacts
    const contacts = await apollo.people.search({
      organization_domains: [domain],
      titles: ['VP', 'Director', 'Head', 'Manager'],
      departments: ['Engineering', 'Product', 'Operations']
    });

    // Score leads
    const scoredContacts = await Promise.all(
      contacts.map(async (contact) => {
        const score = await this.scoreContact(contact, company);
        return { ...contact, score };
      })
    );

    // Sync to HubSpot
    for (const contact of scoredContacts.filter(c => c.score >= 50)) {
      await hubspot.crm.contacts.basicApi.create({
        properties: {
          email: contact.email,
          firstname: contact.first_name,
          lastname: contact.last_name,
          jobtitle: contact.title,
          company: company.name,
          lead_score: contact.score.toString(),
          lead_source: 'apollo_enrichment'
        }
      });
    }

    return scoredContacts;
  }

  async scoreContact(contact: any, company: any) {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Score this lead 0-100 for ${process.env.ICP_DESCRIPTION}:

Title: ${contact.title}
Seniority: ${contact.seniority}
Department: ${contact.department}
Company Size: ${company.estimated_num_employees}
Industry: ${company.industry}
Tech Stack: ${company.technologies?.join(', ')}
Recent Funding: ${company.latest_funding_stage}

Return just a number 0-100.`
      }]
    });

    return parseInt(response.content[0].text);
  }
}
```

## Pipeline Analytics

```typescript
interface PipelineMetrics {
  period: string;
  activities: {
    emails_sent: number;
    emails_opened: number;
    emails_replied: number;
    calls_made: number;
    calls_connected: number;
    meetings_booked: number;
    meetings_held: number;
  };
  conversion_rates: {
    email_open_rate: number;
    email_reply_rate: number;
    call_connect_rate: number;
    meeting_show_rate: number;
    sql_rate: number;
  };
  pipeline: {
    new_leads: number;
    qualified_leads: number;
    opportunities_created: number;
    pipeline_value: number;
    forecast: number;
  };
  velocity: {
    avg_days_to_meeting: number;
    avg_days_to_opportunity: number;
    avg_deal_cycle: number;
  };
  top_performers: Array<{
    sequence: string;
    reply_rate: number;
    meeting_rate: number;
  }>;
}
```

## Deployment Checklist

- [ ] Configure CRM integration (Salesforce/HubSpot)
- [ ] Set up email sending (Outreach/SalesLoft/Apollo)
- [ ] Configure LinkedIn automation (if applicable)
- [ ] Import ICP and personas
- [ ] Create outreach sequences
- [ ] Set up reply detection webhooks
- [ ] Configure lead scoring rules
- [ ] Set up meeting scheduling (Calendly/HubSpot)
- [ ] Create proposal templates
- [ ] Configure daily activity limits
- [ ] Set up do-not-contact list sync
- [ ] Configure analytics tracking
- [ ] Test with sample leads
- [ ] Train on company value props
