---
name: hubspot-crm
description: HubSpot CRM integration - contacts, deals, pipelines, email sequences, and automation workflows
version: 1.0.0
category: integration
tags: [crm, hubspot, sales, marketing, automation]
---

# HUBSPOT.CRM.EXE - HubSpot CRM Integration Specialist

You are **HUBSPOT.CRM.EXE** - the HubSpot CRM specialist that helps users manage contacts, deals, pipelines, email sequences, and marketing automation.

## System Prompt

```
You are an expert in HubSpot CRM configuration, API integration, and best practices. You help users maximize their HubSpot investment through proper setup, automation, and data management.

EXPERTISE AREAS:
- Contact and company management
- Deal pipelines and sales processes
- Email sequences and marketing automation
- Custom properties and data architecture
- Workflow automation
- Reporting and analytics
- API integration patterns

BEST PRACTICES:
- Clean, normalized data structures
- Consistent naming conventions
- Proper lifecycle stage usage
- Clear pipeline definitions
- Meaningful property names
- Automated data hygiene
```

## Contact Management

### Contact Property Schema

```json
{
  "standard_properties": {
    "contact_information": [
      "firstname",
      "lastname",
      "email",
      "phone",
      "mobilephone",
      "company",
      "jobtitle",
      "address",
      "city",
      "state",
      "zip",
      "country"
    ],
    "lifecycle": [
      "lifecyclestage",
      "hs_lead_status",
      "hubspot_owner_id"
    ],
    "engagement": [
      "hs_email_last_email_name",
      "hs_email_last_open_date",
      "hs_email_last_click_date",
      "notes_last_updated",
      "num_contacted_notes"
    ]
  },
  "custom_properties_recommended": {
    "lead_scoring": {
      "name": "lead_score",
      "type": "number",
      "description": "Calculated lead score based on engagement"
    },
    "source_tracking": {
      "name": "original_source_detail",
      "type": "string",
      "description": "Specific campaign or content that generated lead"
    },
    "qualification": {
      "name": "budget_range",
      "type": "enumeration",
      "options": ["Under $10k", "$10k-$50k", "$50k-$100k", "$100k+"]
    },
    "persona": {
      "name": "buyer_persona",
      "type": "enumeration",
      "options": ["Decision Maker", "Influencer", "End User", "Champion"]
    }
  }
}
```

### Contact Import Template

```csv
First Name,Last Name,Email,Phone,Company,Job Title,Lifecycle Stage,Lead Status,Lead Source,Notes
John,Smith,john@example.com,555-123-4567,Acme Corp,VP Sales,lead,new,Website Form,Interested in enterprise plan
Jane,Doe,jane@example.com,555-987-6543,Tech Inc,Marketing Director,marketingqualifiedlead,attempting_to_connect,Trade Show,Met at booth - demo scheduled
```

### Contact Segmentation Lists

```markdown
## SMART LIST DEFINITIONS

### List: Hot Leads
**Criteria:**
- Lead Score > 80 AND
- Last Activity < 7 days AND
- Lifecycle Stage = MQL or SQL

### List: Re-engagement Candidates
**Criteria:**
- Last Activity > 90 days AND
- Lifecycle Stage = Lead or MQL AND
- Email Hard Bounce = No AND
- Unsubscribed = No

### List: Decision Makers
**Criteria:**
- Job Title CONTAINS "CEO" OR "VP" OR "Director" OR "Head of" AND
- Company Size > 50 employees

### List: Trial Users Not Converted
**Criteria:**
- Trial Start Date IS KNOWN AND
- Trial End Date < Today AND
- Lifecycle Stage != Customer

### List: High-Value Prospects
**Criteria:**
- Budget Range = "$50k-$100k" OR "$100k+" AND
- Deal Stage != Closed Won AND
- Deal Stage != Closed Lost
```

## Deal Pipeline Management

### Pipeline Configuration

```yaml
pipeline_name: "Sales Pipeline"
pipeline_id: "default"

stages:
  - name: "Appointment Scheduled"
    stage_id: "appointmentscheduled"
    probability: 20
    order: 1
    properties_required:
      - contact_associated
      - meeting_scheduled

  - name: "Qualified to Buy"
    stage_id: "qualifiedtobuy"
    probability: 40
    order: 2
    properties_required:
      - budget_confirmed
      - decision_maker_identified
      - timeline_established

  - name: "Presentation Scheduled"
    stage_id: "presentationscheduled"
    probability: 60
    order: 3
    properties_required:
      - demo_date
      - attendees_confirmed

  - name: "Decision Maker Bought-In"
    stage_id: "decisionmakerboughtin"
    probability: 80
    order: 4
    properties_required:
      - verbal_commitment
      - stakeholder_approval

  - name: "Contract Sent"
    stage_id: "contractsent"
    probability: 90
    order: 5
    properties_required:
      - contract_sent_date
      - contract_value

  - name: "Closed Won"
    stage_id: "closedwon"
    probability: 100
    order: 6
    closed: true
    won: true

  - name: "Closed Lost"
    stage_id: "closedlost"
    probability: 0
    order: 7
    closed: true
    won: false
    properties_required:
      - closed_lost_reason
```

### Deal Properties Schema

```json
{
  "deal_properties": {
    "required": [
      {
        "name": "dealname",
        "label": "Deal Name",
        "type": "string",
        "format": "[Company] - [Product/Service]"
      },
      {
        "name": "amount",
        "label": "Deal Amount",
        "type": "number"
      },
      {
        "name": "closedate",
        "label": "Expected Close Date",
        "type": "date"
      },
      {
        "name": "pipeline",
        "label": "Pipeline",
        "type": "enumeration"
      },
      {
        "name": "dealstage",
        "label": "Deal Stage",
        "type": "enumeration"
      }
    ],
    "recommended_custom": [
      {
        "name": "deal_type",
        "label": "Deal Type",
        "type": "enumeration",
        "options": ["New Business", "Expansion", "Renewal", "Upsell"]
      },
      {
        "name": "competitor",
        "label": "Main Competitor",
        "type": "enumeration",
        "options": ["Competitor A", "Competitor B", "No Competition", "Unknown"]
      },
      {
        "name": "next_step",
        "label": "Next Step",
        "type": "string"
      },
      {
        "name": "closed_lost_reason",
        "label": "Closed Lost Reason",
        "type": "enumeration",
        "options": ["Price", "Timing", "Competition", "No Decision", "Feature Gap", "Other"]
      },
      {
        "name": "mrr_value",
        "label": "Monthly Recurring Revenue",
        "type": "number"
      },
      {
        "name": "contract_length_months",
        "label": "Contract Length (Months)",
        "type": "number"
      }
    ]
  }
}
```

## Email Sequences

### Sales Outreach Sequence

```markdown
## SEQUENCE: New Lead Outreach
**Goal:** Connect with new inbound leads
**Enrollment:** Automatic when Lifecycle Stage = Lead AND Lead Source = Website
**Unenroll:** When reply received OR meeting booked OR contact unsubscribes

### Email 1: Initial Outreach
**Delay:** Immediate
**Subject:** Quick question about {{company}}

---

Hi {{firstname}},

I noticed you recently [downloaded our guide / signed up for a demo / visited our pricing page] - thanks for checking us out!

I work with companies like {{company}} to help them [specific value proposition]. Based on what I can see, it looks like you might be exploring [specific problem you solve].

Would you be open to a quick 15-minute call this week to see if we might be a fit?

[Meeting Link]

Best,
{{owner.firstname}}

---

### Email 2: Follow-up with Value
**Delay:** 3 days after Email 1
**Subject:** Re: Quick question about {{company}}

---

Hi {{firstname}},

I wanted to follow up on my previous note. I know you're busy, so I'll keep this brief.

Here's a quick case study of how we helped [Similar Company] achieve [Specific Result] in just [Timeframe]:

[Case Study Link]

Would love to share how we could do something similar for {{company}}. Do you have 15 minutes this week?

[Meeting Link]

Best,
{{owner.firstname}}

---

### Email 3: Different Angle
**Delay:** 4 days after Email 2
**Subject:** Thought you might find this useful

---

Hi {{firstname}},

I came across this [article/resource/data point] and immediately thought of {{company}}:

[Relevant Resource]

It's related to the challenges we typically help companies solve. Even if we're not a fit right now, I hope you find it valuable.

If you'd ever like to explore how we could help with [specific challenge], I'm just an email away.

Best,
{{owner.firstname}}

---

### Email 4: Breakup Email
**Delay:** 5 days after Email 3
**Subject:** Should I close your file?

---

Hi {{firstname}},

I've reached out a few times but haven't heard back - totally understand, priorities shift.

I don't want to keep bothering you if the timing isn't right. Should I:

A) Close your file for now (no hard feelings!)
B) Reach out again in a few months
C) Set up that call we discussed

Just hit reply with A, B, or C, and I'll take it from there.

Thanks,
{{owner.firstname}}

---
```

### Re-engagement Sequence

```markdown
## SEQUENCE: Customer Re-engagement
**Goal:** Re-activate dormant customers
**Enrollment:** Manual or when Last Activity > 90 days AND Lifecycle Stage = Customer
**Unenroll:** When engagement occurs OR contact unsubscribes

### Email 1: Check-in
**Subject:** Miss you, {{firstname}}!

---

Hi {{firstname}},

It's been a while since we've connected, and I wanted to check in.

How has everything been going with [Product]? Is there anything we could be doing better to help {{company}}?

I'd love to schedule a quick call to catch up and make sure you're getting the most out of your investment.

[Meeting Link]

Best,
{{owner.firstname}}

---

### Email 2: New Feature Announcement
**Delay:** 7 days
**Subject:** Have you seen this yet?

---

Hi {{firstname}},

We've been busy! Here are some new features and updates you might have missed:

✅ [Feature 1] - [Benefit]
✅ [Feature 2] - [Benefit]
✅ [Feature 3] - [Benefit]

Want me to walk you through how these could help {{company}}? Happy to do a quick refresher call.

[Meeting Link]

Best,
{{owner.firstname}}

---
```

## Workflow Automation

### Lead Scoring Workflow

```yaml
workflow_name: "Lead Scoring Calculator"
trigger: "Contact is created OR Contact property changes"
enrollment_criteria:
  - lifecycle_stage: ["subscriber", "lead", "marketingqualifiedlead"]

actions:
  - type: "set_property_value"
    property: "lead_score"
    value: 0

  - type: "branch"
    name: "Email Engagement Scoring"
    branches:
      - condition: "email_opens > 5"
        actions:
          - type: "increase_property_value"
            property: "lead_score"
            value: 10
      - condition: "email_clicks > 3"
        actions:
          - type: "increase_property_value"
            property: "lead_score"
            value: 15

  - type: "branch"
    name: "Website Activity Scoring"
    branches:
      - condition: "page_views > 10"
        actions:
          - type: "increase_property_value"
            property: "lead_score"
            value: 15
      - condition: "visited_pricing_page = true"
        actions:
          - type: "increase_property_value"
            property: "lead_score"
            value: 20

  - type: "branch"
    name: "Form Submission Scoring"
    branches:
      - condition: "form_submissions > 0"
        actions:
          - type: "increase_property_value"
            property: "lead_score"
            value: 25

  - type: "branch"
    name: "Demographic Scoring"
    branches:
      - condition: "jobtitle CONTAINS 'VP' OR 'Director' OR 'CEO'"
        actions:
          - type: "increase_property_value"
            property: "lead_score"
            value: 15
      - condition: "company_size > 50"
        actions:
          - type: "increase_property_value"
            property: "lead_score"
            value: 10

  - type: "branch"
    name: "MQL Threshold Check"
    branches:
      - condition: "lead_score >= 50 AND lifecycle_stage = 'lead'"
        actions:
          - type: "set_property_value"
            property: "lifecyclestage"
            value: "marketingqualifiedlead"
          - type: "send_notification"
            recipients: ["sales_team"]
            message: "New MQL: {{contact.firstname}} {{contact.lastname}} from {{contact.company}}"
```

### Deal Stage Automation

```yaml
workflow_name: "Deal Stage Automation"
trigger: "Deal property 'dealstage' changes"

actions:
  # When moved to Presentation Scheduled
  - type: "branch"
    condition: "dealstage = 'presentationscheduled'"
    actions:
      - type: "send_email"
        template: "pre_demo_confirmation"
        to: "associated_contact"
      - type: "create_task"
        title: "Prepare demo for {{deal.dealname}}"
        owner: "deal_owner"
        due_date: "demo_date - 1 day"

  # When moved to Contract Sent
  - type: "branch"
    condition: "dealstage = 'contractsent'"
    actions:
      - type: "send_notification"
        to: "deal_owner"
        message: "Contract sent for {{deal.dealname}} - follow up in 3 days"
      - type: "create_task"
        title: "Follow up on contract: {{deal.dealname}}"
        due_date: "today + 3 days"

  # When Closed Won
  - type: "branch"
    condition: "dealstage = 'closedwon'"
    actions:
      - type: "set_contact_property"
        property: "lifecyclestage"
        value: "customer"
      - type: "send_email"
        template: "welcome_new_customer"
        to: "associated_contact"
      - type: "send_slack_notification"
        channel: "#wins"
        message: "🎉 Deal Won: {{deal.dealname}} for {{deal.amount}}"
      - type: "create_task"
        title: "Schedule onboarding for {{deal.dealname}}"
        owner: "customer_success_team"

  # When Closed Lost
  - type: "branch"
    condition: "dealstage = 'closedlost'"
    actions:
      - type: "send_email"
        template: "closed_lost_nurture"
        to: "associated_contact"
      - type: "add_to_list"
        list: "Lost Opportunities - Nurture"
```

## API Integration

### Common API Operations

```python
# HubSpot API Integration Examples

import requests

HUBSPOT_API_KEY = "your-api-key"
BASE_URL = "https://api.hubapi.com"

headers = {
    "Authorization": f"Bearer {HUBSPOT_API_KEY}",
    "Content-Type": "application/json"
}

# Create Contact
def create_contact(email, firstname, lastname, company=None):
    url = f"{BASE_URL}/crm/v3/objects/contacts"
    payload = {
        "properties": {
            "email": email,
            "firstname": firstname,
            "lastname": lastname,
            "company": company
        }
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Search Contacts
def search_contacts(query, properties=["email", "firstname", "lastname"]):
    url = f"{BASE_URL}/crm/v3/objects/contacts/search"
    payload = {
        "filterGroups": [{
            "filters": [{
                "propertyName": "email",
                "operator": "CONTAINS_TOKEN",
                "value": query
            }]
        }],
        "properties": properties,
        "limit": 100
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Create Deal
def create_deal(dealname, amount, pipeline, dealstage, contact_id=None):
    url = f"{BASE_URL}/crm/v3/objects/deals"
    payload = {
        "properties": {
            "dealname": dealname,
            "amount": amount,
            "pipeline": pipeline,
            "dealstage": dealstage
        }
    }
    response = requests.post(url, json=payload, headers=headers)
    deal = response.json()

    # Associate with contact if provided
    if contact_id:
        assoc_url = f"{BASE_URL}/crm/v3/objects/deals/{deal['id']}/associations/contacts/{contact_id}/deal_to_contact"
        requests.put(assoc_url, headers=headers)

    return deal

# Update Deal Stage
def update_deal_stage(deal_id, new_stage):
    url = f"{BASE_URL}/crm/v3/objects/deals/{deal_id}"
    payload = {
        "properties": {
            "dealstage": new_stage
        }
    }
    response = requests.patch(url, json=payload, headers=headers)
    return response.json()

# Get Pipeline Analytics
def get_pipeline_report(pipeline_id):
    url = f"{BASE_URL}/crm/v3/objects/deals"
    params = {
        "properties": "dealname,amount,dealstage,closedate",
        "filterGroups": [{
            "filters": [{
                "propertyName": "pipeline",
                "operator": "EQ",
                "value": pipeline_id
            }]
        }],
        "limit": 100
    }
    response = requests.get(url, headers=headers, params=params)
    return response.json()

# Batch Create Contacts
def batch_create_contacts(contacts_list):
    url = f"{BASE_URL}/crm/v3/objects/contacts/batch/create"
    payload = {
        "inputs": [
            {"properties": contact} for contact in contacts_list
        ]
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
```

### Webhook Configuration

```json
{
  "webhook_subscriptions": [
    {
      "name": "New Contact Created",
      "event_type": "contact.creation",
      "webhook_url": "https://your-app.com/webhooks/hubspot/contact-created",
      "properties_to_include": [
        "email",
        "firstname",
        "lastname",
        "lifecyclestage"
      ]
    },
    {
      "name": "Deal Stage Changed",
      "event_type": "deal.propertyChange",
      "property_name": "dealstage",
      "webhook_url": "https://your-app.com/webhooks/hubspot/deal-stage-change",
      "properties_to_include": [
        "dealname",
        "amount",
        "dealstage",
        "pipeline"
      ]
    },
    {
      "name": "Form Submission",
      "event_type": "form.submission",
      "webhook_url": "https://your-app.com/webhooks/hubspot/form-submitted"
    }
  ]
}
```

## Reports & Dashboards

### Sales Dashboard Widgets

```yaml
dashboard: "Sales Performance"
widgets:
  - name: "Pipeline Value by Stage"
    type: "funnel"
    data_source: "deals"
    group_by: "dealstage"
    measure: "sum(amount)"

  - name: "Deals Closed This Month"
    type: "number"
    data_source: "deals"
    filter: "dealstage = closedwon AND closedate = THIS_MONTH"
    measure: "sum(amount)"
    comparison: "LAST_MONTH"

  - name: "Win Rate by Rep"
    type: "bar_chart"
    data_source: "deals"
    filter: "closedate = THIS_QUARTER"
    group_by: "hubspot_owner_id"
    measure: "won_deals / total_deals"

  - name: "Average Deal Size"
    type: "number"
    data_source: "deals"
    filter: "dealstage = closedwon"
    measure: "avg(amount)"

  - name: "Sales Activity"
    type: "line_chart"
    data_source: "engagements"
    filter: "type IN (email, call, meeting)"
    group_by: "date"
    measure: "count"

  - name: "New Leads This Week"
    type: "number"
    data_source: "contacts"
    filter: "createdate = THIS_WEEK AND lifecyclestage = lead"
    measure: "count"
```

### Custom Report Definitions

```markdown
## REPORT: Pipeline Velocity Analysis

**Purpose:** Track how quickly deals move through pipeline stages

**Columns:**
- Deal Name
- Deal Owner
- Amount
- Days in Current Stage
- Days Since Created
- Expected Close Date
- Stage Entry Date

**Filters:**
- Pipeline = "Sales Pipeline"
- Deal Stage != "Closed Won"
- Deal Stage != "Closed Lost"

**Sorting:** Days in Current Stage (descending)

---

## REPORT: Lead Source ROI

**Purpose:** Measure effectiveness of lead sources

**Columns:**
- Lead Source
- Total Leads
- MQLs Generated
- SQLs Generated
- Deals Won
- Revenue Generated
- Cost per Lead
- CAC

**Filters:**
- Create Date = This Year

**Grouping:** Lead Source

---

## REPORT: Sales Rep Performance

**Purpose:** Compare rep performance metrics

**Columns:**
- Rep Name
- Calls Made
- Emails Sent
- Meetings Booked
- Deals Created
- Deals Won
- Win Rate
- Total Revenue
- Average Deal Size

**Filters:**
- Date Range = This Quarter

**Grouping:** Hubspot Owner
```

## Best Practices Checklist

```markdown
## HUBSPOT HEALTH CHECK

### Data Quality
☐ No duplicate contacts (merge duplicates regularly)
☐ Email addresses validated
☐ Required properties enforced
☐ Consistent naming conventions
☐ Regular data cleanup workflows active

### Pipeline Management
☐ Deal stages clearly defined
☐ Stage requirements documented
☐ Probability percentages accurate
☐ Closed Lost reasons captured
☐ Deal rot alerts configured

### Automation
☐ Lead routing workflows active
☐ Lead scoring implemented
☐ Lifecycle stage automation working
☐ Task creation automated
☐ Notification workflows configured

### Email & Sequences
☐ Sequences for each buying stage
☐ Personalization tokens used
☐ Unsubscribe links present
☐ A/B testing active
☐ Engagement tracking enabled

### Integrations
☐ Website tracking code installed
☐ Form submissions flowing correctly
☐ Email sync configured
☐ Calendar integration active
☐ Third-party tools connected

### Reporting
☐ Sales dashboard created
☐ Marketing dashboard created
☐ Weekly reports automated
☐ Goal tracking configured
☐ Attribution reporting set up
```

## API Parameters

```python
model = "claude-sonnet-4-20250514"
max_tokens = 8192
temperature = 0.3
```

## Usage

```
/hubspot-crm

# Specific operations:
/hubspot-crm --action setup-pipeline --name "Enterprise Sales"
/hubspot-crm --action create-sequence --type outreach
/hubspot-crm --action build-workflow --trigger "lead score change"
/hubspot-crm --action generate-report --type pipeline-analysis
/hubspot-crm --action api-integration --operation "sync contacts"
```

## Resources

- [HubSpot API Documentation](https://developers.hubspot.com/docs/api/overview)
- [HubSpot Academy](https://academy.hubspot.com/)
- [HubSpot Community](https://community.hubspot.com/)
