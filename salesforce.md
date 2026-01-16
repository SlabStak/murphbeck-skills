---
name: salesforce
description: Salesforce CRM integration - leads, opportunities, accounts, campaigns, and automation
version: 1.0.0
category: integration
tags: [crm, salesforce, sales, marketing, automation]
---

# SALESFORCE.EXE - Salesforce CRM Integration Specialist

You are **SALESFORCE.EXE** - the Salesforce CRM specialist that helps users manage leads, opportunities, accounts, campaigns, and automation within the Salesforce ecosystem.

## System Prompt

```
You are an expert Salesforce administrator and developer. You help users configure, customize, and integrate Salesforce to optimize their sales and marketing operations.

EXPERTISE AREAS:
- Lead and opportunity management
- Account and contact hierarchies
- Sales Cloud configuration
- Marketing Cloud integration
- Flow automation (Flow Builder)
- Apex triggers and classes
- SOQL queries
- Lightning components
- Reports and dashboards
- AppExchange integrations

BEST PRACTICES:
- Governor limits awareness
- Bulkification patterns
- Proper record type usage
- Field-level security
- Sharing rules and permissions
- Data validation rules
```

## Object Configuration

### Lead Object Schema

```json
{
  "object": "Lead",
  "standard_fields": [
    "FirstName",
    "LastName",
    "Email",
    "Phone",
    "Company",
    "Title",
    "Industry",
    "LeadSource",
    "Status",
    "Rating",
    "NumberOfEmployees",
    "AnnualRevenue",
    "Street",
    "City",
    "State",
    "PostalCode",
    "Country",
    "Description"
  ],
  "custom_fields_recommended": [
    {
      "api_name": "Lead_Score__c",
      "label": "Lead Score",
      "type": "Number",
      "length": 3,
      "decimal_places": 0,
      "description": "Calculated engagement score"
    },
    {
      "api_name": "Lead_Grade__c",
      "label": "Lead Grade",
      "type": "Picklist",
      "values": ["A", "B", "C", "D"],
      "description": "Demographic/firmographic fit"
    },
    {
      "api_name": "MQL_Date__c",
      "label": "MQL Date",
      "type": "Date",
      "description": "Date lead became marketing qualified"
    },
    {
      "api_name": "SQL_Date__c",
      "label": "SQL Date",
      "type": "Date",
      "description": "Date lead became sales qualified"
    },
    {
      "api_name": "Buying_Timeline__c",
      "label": "Buying Timeline",
      "type": "Picklist",
      "values": ["Immediate", "1-3 Months", "3-6 Months", "6-12 Months", "12+ Months"],
      "description": "Expected purchase timeframe"
    },
    {
      "api_name": "Budget_Range__c",
      "label": "Budget Range",
      "type": "Picklist",
      "values": ["Under $10K", "$10K-$50K", "$50K-$100K", "$100K-$500K", "$500K+"],
      "description": "Estimated budget"
    },
    {
      "api_name": "UTM_Source__c",
      "label": "UTM Source",
      "type": "Text",
      "length": 255,
      "description": "Marketing campaign source"
    },
    {
      "api_name": "UTM_Medium__c",
      "label": "UTM Medium",
      "type": "Text",
      "length": 255,
      "description": "Marketing campaign medium"
    },
    {
      "api_name": "UTM_Campaign__c",
      "label": "UTM Campaign",
      "type": "Text",
      "length": 255,
      "description": "Marketing campaign name"
    }
  ],
  "lead_status_values": [
    {"value": "New", "default": true},
    {"value": "Working"},
    {"value": "Nurturing"},
    {"value": "Qualified"},
    {"value": "Unqualified"},
    {"value": "Converted"}
  ]
}
```

### Opportunity Object Schema

```json
{
  "object": "Opportunity",
  "standard_fields": [
    "Name",
    "AccountId",
    "Amount",
    "CloseDate",
    "StageName",
    "Probability",
    "Type",
    "LeadSource",
    "NextStep",
    "Description",
    "OwnerId"
  ],
  "custom_fields_recommended": [
    {
      "api_name": "Competitor__c",
      "label": "Primary Competitor",
      "type": "Picklist",
      "values": ["Competitor A", "Competitor B", "Competitor C", "None", "Unknown"]
    },
    {
      "api_name": "Loss_Reason__c",
      "label": "Closed Lost Reason",
      "type": "Picklist",
      "values": ["Price", "Features", "Competition", "Timeline", "Budget", "No Decision", "Other"]
    },
    {
      "api_name": "MRR__c",
      "label": "Monthly Recurring Revenue",
      "type": "Currency"
    },
    {
      "api_name": "ARR__c",
      "label": "Annual Recurring Revenue",
      "type": "Currency",
      "formula": "MRR__c * 12"
    },
    {
      "api_name": "Contract_Length_Months__c",
      "label": "Contract Length (Months)",
      "type": "Number"
    },
    {
      "api_name": "Decision_Criteria__c",
      "label": "Decision Criteria",
      "type": "Long Text Area"
    },
    {
      "api_name": "Champion__c",
      "label": "Champion Contact",
      "type": "Lookup",
      "related_to": "Contact"
    },
    {
      "api_name": "Economic_Buyer__c",
      "label": "Economic Buyer",
      "type": "Lookup",
      "related_to": "Contact"
    }
  ],
  "sales_process_stages": [
    {"stage": "Prospecting", "probability": 10, "forecast_category": "Pipeline"},
    {"stage": "Qualification", "probability": 20, "forecast_category": "Pipeline"},
    {"stage": "Needs Analysis", "probability": 30, "forecast_category": "Pipeline"},
    {"stage": "Value Proposition", "probability": 50, "forecast_category": "Best Case"},
    {"stage": "Proposal/Quote", "probability": 70, "forecast_category": "Best Case"},
    {"stage": "Negotiation", "probability": 80, "forecast_category": "Commit"},
    {"stage": "Closed Won", "probability": 100, "forecast_category": "Closed", "closed": true, "won": true},
    {"stage": "Closed Lost", "probability": 0, "forecast_category": "Omitted", "closed": true, "won": false}
  ]
}
```

## Flow Automation

### Lead Assignment Flow

```yaml
flow_name: "Lead Assignment Flow"
flow_type: "Record-Triggered Flow"
object: "Lead"
trigger: "A record is created"

entry_conditions:
  - field: "Status"
    operator: "Equals"
    value: "New"

elements:
  # Get Assignment Rules
  - type: "Get Records"
    name: "Get_Territory_Rules"
    object: "Territory_Assignment_Rule__c"
    filter_conditions:
      - field: "Active__c"
        operator: "Equals"
        value: true
    store_output: "territoryRules"

  # Decision: Route by Industry
  - type: "Decision"
    name: "Route_By_Industry"
    outcomes:
      - name: "Technology"
        condition: "{!$Record.Industry} = 'Technology'"
      - name: "Healthcare"
        condition: "{!$Record.Industry} = 'Healthcare'"
      - name: "Financial_Services"
        condition: "{!$Record.Industry} = 'Financial Services'"
      - name: "Default"
        is_default: true

  # Assignment Actions
  - type: "Update Records"
    name: "Assign_Tech_Owner"
    record_to_update: "{!$Record}"
    field_values:
      - field: "OwnerId"
        value: "{!techTeamQueue}"
    connected_from: "Technology"

  - type: "Update Records"
    name: "Assign_Healthcare_Owner"
    record_to_update: "{!$Record}"
    field_values:
      - field: "OwnerId"
        value: "{!healthcareTeamQueue}"
    connected_from: "Healthcare"

  # Create Task
  - type: "Create Records"
    name: "Create_Follow_Up_Task"
    object: "Task"
    field_values:
      - field: "Subject"
        value: "Follow up with new lead: {!$Record.Company}"
      - field: "WhoId"
        value: "{!$Record.Id}"
      - field: "OwnerId"
        value: "{!$Record.OwnerId}"
      - field: "ActivityDate"
        value: "{!$Flow.CurrentDate}"
      - field: "Priority"
        value: "High"
```

### Opportunity Stage Change Flow

```yaml
flow_name: "Opportunity Stage Change Automation"
flow_type: "Record-Triggered Flow"
object: "Opportunity"
trigger: "A record is updated"
condition_requirements: "All Conditions Are Met"
entry_conditions:
  - field: "StageName"
    operator: "Is Changed"
    value: true

elements:
  # Decision: Which Stage?
  - type: "Decision"
    name: "Stage_Router"
    outcomes:
      - name: "Moved_to_Proposal"
        condition: "{!$Record.StageName} = 'Proposal/Quote'"
      - name: "Closed_Won"
        condition: "{!$Record.StageName} = 'Closed Won'"
      - name: "Closed_Lost"
        condition: "{!$Record.StageName} = 'Closed Lost'"

  # Proposal Stage Actions
  - type: "Action"
    name: "Send_Proposal_Notification"
    action_type: "emailAlert"
    action_name: "Proposal_Stage_Notification"
    connected_from: "Moved_to_Proposal"

  - type: "Create Records"
    name: "Create_Contract_Task"
    object: "Task"
    field_values:
      - field: "Subject"
        value: "Prepare contract for {!$Record.Name}"
      - field: "WhatId"
        value: "{!$Record.Id}"
      - field: "OwnerId"
        value: "{!$Record.OwnerId}"
      - field: "ActivityDate"
        value: "{!$Flow.CurrentDate + 3}"
    connected_from: "Moved_to_Proposal"

  # Closed Won Actions
  - type: "Action"
    name: "Send_Won_Notification"
    action_type: "emailAlert"
    action_name: "Opportunity_Won_Notification"
    connected_from: "Closed_Won"

  - type: "Create Records"
    name: "Create_Onboarding_Task"
    object: "Task"
    field_values:
      - field: "Subject"
        value: "Onboard new customer: {!$Record.Account.Name}"
      - field: "WhatId"
        value: "{!$Record.Id}"
      - field: "OwnerId"
        value: "{!customerSuccessQueue}"
      - field: "ActivityDate"
        value: "{!$Flow.CurrentDate + 1}"
      - field: "Priority"
        value: "High"
    connected_from: "Closed_Won"

  # Update Account to Customer
  - type: "Update Records"
    name: "Update_Account_Type"
    object: "Account"
    filter_conditions:
      - field: "Id"
        operator: "Equals"
        value: "{!$Record.AccountId}"
    field_values:
      - field: "Type"
        value: "Customer"
    connected_from: "Closed_Won"

  # Closed Lost Actions
  - type: "Decision"
    name: "Check_Loss_Reason"
    condition: "{!$Record.Loss_Reason__c} = null"
    connected_from: "Closed_Lost"

  - type: "Screen"
    name: "Capture_Loss_Reason"
    fields:
      - type: "Picklist"
        api_name: "lossReason"
        label: "Why did we lose this deal?"
        required: true
        data_source: "Loss_Reason__c"
```

### Lead Scoring Flow (Scheduled)

```yaml
flow_name: "Lead Scoring Calculation"
flow_type: "Schedule-Triggered Flow"
schedule:
  frequency: "Daily"
  start_time: "02:00"

start_element: "Get_Leads"

elements:
  - type: "Get Records"
    name: "Get_Leads"
    object: "Lead"
    filter_conditions:
      - field: "IsConverted"
        operator: "Equals"
        value: false
      - field: "Status"
        operator: "Not Equal To"
        value: "Unqualified"
    store_output: "leadsToScore"

  - type: "Loop"
    name: "Loop_Through_Leads"
    collection: "{!leadsToScore}"

  # Calculate Score
  - type: "Assignment"
    name: "Calculate_Score"
    assignments:
      - variable: "leadScore"
        operator: "Assign"
        value: 0

  # Email Engagement Score
  - type: "Decision"
    name: "Check_Email_Engagement"
    outcomes:
      - name: "High_Engagement"
        condition: "{!Loop_Through_Leads.Email_Opens__c} > 5"
        next: "Add_Email_Score_High"
      - name: "Medium_Engagement"
        condition: "{!Loop_Through_Leads.Email_Opens__c} > 2"
        next: "Add_Email_Score_Medium"

  - type: "Assignment"
    name: "Add_Email_Score_High"
    assignments:
      - variable: "leadScore"
        operator: "Add"
        value: 20

  - type: "Assignment"
    name: "Add_Email_Score_Medium"
    assignments:
      - variable: "leadScore"
        operator: "Add"
        value: 10

  # Website Activity Score
  - type: "Decision"
    name: "Check_Website_Activity"
    outcomes:
      - name: "Visited_Pricing"
        condition: "{!Loop_Through_Leads.Visited_Pricing_Page__c} = true"
        next: "Add_Pricing_Score"

  - type: "Assignment"
    name: "Add_Pricing_Score"
    assignments:
      - variable: "leadScore"
        operator: "Add"
        value: 25

  # Title/Role Score
  - type: "Decision"
    name: "Check_Title"
    outcomes:
      - name: "Executive"
        condition: "CONTAINS({!Loop_Through_Leads.Title}, 'VP') OR CONTAINS({!Loop_Through_Leads.Title}, 'Director') OR CONTAINS({!Loop_Through_Leads.Title}, 'CEO')"
        next: "Add_Title_Score"

  - type: "Assignment"
    name: "Add_Title_Score"
    assignments:
      - variable: "leadScore"
        operator: "Add"
        value: 15

  # Update Lead
  - type: "Update Records"
    name: "Update_Lead_Score"
    record_to_update: "{!Loop_Through_Leads}"
    field_values:
      - field: "Lead_Score__c"
        value: "{!leadScore}"
```

## SOQL Queries

### Common Query Patterns

```sql
-- Get all open opportunities by stage
SELECT Id, Name, Amount, StageName, CloseDate, Account.Name, Owner.Name
FROM Opportunity
WHERE IsClosed = false
AND CloseDate = THIS_FISCAL_QUARTER
ORDER BY CloseDate ASC

-- Get leads created this month by source
SELECT LeadSource, COUNT(Id) leadCount, AVG(Lead_Score__c) avgScore
FROM Lead
WHERE CreatedDate = THIS_MONTH
AND IsConverted = false
GROUP BY LeadSource
ORDER BY COUNT(Id) DESC

-- Get account hierarchy with contacts
SELECT Id, Name, Type, Industry,
       (SELECT Id, Name, Email, Title FROM Contacts),
       (SELECT Id, Name, Amount, StageName FROM Opportunities WHERE IsClosed = false)
FROM Account
WHERE Type = 'Customer'

-- Get opportunities with related contacts and activities
SELECT Id, Name, Amount, StageName, CloseDate,
       Account.Name, Account.Industry,
       (SELECT Id, Subject, Status FROM Tasks WHERE IsClosed = false),
       (SELECT ContactId, Contact.Name, Role FROM OpportunityContactRoles)
FROM Opportunity
WHERE StageName = 'Negotiation'

-- Pipeline report by owner
SELECT OwnerId, Owner.Name, StageName,
       SUM(Amount) totalAmount, COUNT(Id) dealCount
FROM Opportunity
WHERE IsClosed = false
AND CloseDate = THIS_FISCAL_QUARTER
GROUP BY OwnerId, Owner.Name, StageName
ORDER BY Owner.Name, StageName

-- Conversion metrics
SELECT Status, COUNT(Id) statusCount,
       AVG(CALENDAR_MONTH(CreatedDate)) avgMonth
FROM Lead
WHERE CreatedDate = THIS_YEAR
GROUP BY Status

-- High-value accounts without recent activity
SELECT Id, Name, AnnualRevenue, LastActivityDate, OwnerId
FROM Account
WHERE Type = 'Customer'
AND AnnualRevenue > 1000000
AND (LastActivityDate < LAST_N_DAYS:90 OR LastActivityDate = null)

-- Forecast report
SELECT ForecastCategory, SUM(Amount) totalAmount, COUNT(Id) oppCount
FROM Opportunity
WHERE CloseDate = THIS_FISCAL_QUARTER
AND IsClosed = false
GROUP BY ForecastCategory
```

## Apex Code Examples

### Lead Scoring Trigger

```java
// LeadScoringTrigger.trigger
trigger LeadScoringTrigger on Lead (before insert, before update) {
    LeadScoringHandler.calculateScores(Trigger.new);
}

// LeadScoringHandler.cls
public class LeadScoringHandler {

    public static void calculateScores(List<Lead> leads) {
        for (Lead lead : leads) {
            Integer score = 0;

            // Title/Role scoring
            if (lead.Title != null) {
                String title = lead.Title.toLowerCase();
                if (title.contains('ceo') || title.contains('cfo') || title.contains('cto')) {
                    score += 25;
                } else if (title.contains('vp') || title.contains('vice president')) {
                    score += 20;
                } else if (title.contains('director')) {
                    score += 15;
                } else if (title.contains('manager')) {
                    score += 10;
                }
            }

            // Company size scoring
            if (lead.NumberOfEmployees != null) {
                if (lead.NumberOfEmployees >= 1000) {
                    score += 20;
                } else if (lead.NumberOfEmployees >= 250) {
                    score += 15;
                } else if (lead.NumberOfEmployees >= 50) {
                    score += 10;
                }
            }

            // Annual revenue scoring
            if (lead.AnnualRevenue != null) {
                if (lead.AnnualRevenue >= 100000000) {
                    score += 25;
                } else if (lead.AnnualRevenue >= 10000000) {
                    score += 20;
                } else if (lead.AnnualRevenue >= 1000000) {
                    score += 15;
                }
            }

            // Industry scoring
            Set<String> targetIndustries = new Set<String>{
                'Technology', 'Financial Services', 'Healthcare'
            };
            if (targetIndustries.contains(lead.Industry)) {
                score += 15;
            }

            lead.Lead_Score__c = score;

            // Auto-qualify if score threshold met
            if (score >= 50 && lead.Status == 'New') {
                lead.Status = 'Working';
            }
        }
    }
}
```

### Opportunity Stage Validation

```java
// OpportunityValidationTrigger.trigger
trigger OpportunityValidationTrigger on Opportunity (before update) {
    OpportunityValidationHandler.validateStageProgression(Trigger.new, Trigger.oldMap);
}

// OpportunityValidationHandler.cls
public class OpportunityValidationHandler {

    private static Map<String, Set<String>> requiredFieldsByStage = new Map<String, Set<String>>{
        'Qualification' => new Set<String>{'Description'},
        'Needs Analysis' => new Set<String>{'Decision_Criteria__c'},
        'Proposal/Quote' => new Set<String>{'Amount'},
        'Negotiation' => new Set<String>{'Champion__c'},
        'Closed Won' => new Set<String>{'Amount', 'Contract_Length_Months__c'},
        'Closed Lost' => new Set<String>{'Loss_Reason__c'}
    };

    public static void validateStageProgression(List<Opportunity> newOpps, Map<Id, Opportunity> oldMap) {
        for (Opportunity opp : newOpps) {
            Opportunity oldOpp = oldMap.get(opp.Id);

            // Only validate if stage changed
            if (opp.StageName != oldOpp.StageName) {
                Set<String> requiredFields = requiredFieldsByStage.get(opp.StageName);

                if (requiredFields != null) {
                    for (String fieldName : requiredFields) {
                        Object fieldValue = opp.get(fieldName);
                        if (fieldValue == null || (fieldValue instanceof String && String.isBlank((String)fieldValue))) {
                            opp.addError('Field ' + fieldName + ' is required for stage ' + opp.StageName);
                        }
                    }
                }

                // Validate loss reason on Closed Lost
                if (opp.StageName == 'Closed Lost' && String.isBlank(opp.Loss_Reason__c)) {
                    opp.addError('Please provide a reason for losing this opportunity.');
                }
            }
        }
    }
}
```

### API Integration Class

```java
// SalesforceAPIService.cls
public class SalesforceAPIService {

    private static final String ENDPOINT = 'https://your-external-api.com';

    // Sync lead to external system
    @future(callout=true)
    public static void syncLeadToExternal(Id leadId) {
        Lead lead = [
            SELECT Id, FirstName, LastName, Email, Company, Phone,
                   Lead_Score__c, Status, Industry
            FROM Lead
            WHERE Id = :leadId
        ];

        Map<String, Object> payload = new Map<String, Object>{
            'email' => lead.Email,
            'firstName' => lead.FirstName,
            'lastName' => lead.LastName,
            'company' => lead.Company,
            'phone' => lead.Phone,
            'score' => lead.Lead_Score__c,
            'status' => lead.Status,
            'industry' => lead.Industry,
            'salesforceId' => lead.Id
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint(ENDPOINT + '/api/leads');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Authorization', 'Bearer ' + getAPIToken());
        req.setBody(JSON.serialize(payload));

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() != 200 && res.getStatusCode() != 201) {
            System.debug('Error syncing lead: ' + res.getBody());
        }
    }

    // Batch sync opportunities
    public static void batchSyncOpportunities(List<Id> oppIds) {
        List<Opportunity> opps = [
            SELECT Id, Name, Amount, StageName, CloseDate,
                   Account.Name, Account.External_Id__c
            FROM Opportunity
            WHERE Id IN :oppIds
        ];

        List<Map<String, Object>> payloads = new List<Map<String, Object>>();

        for (Opportunity opp : opps) {
            payloads.add(new Map<String, Object>{
                'salesforceId' => opp.Id,
                'name' => opp.Name,
                'amount' => opp.Amount,
                'stage' => opp.StageName,
                'closeDate' => opp.CloseDate,
                'accountName' => opp.Account.Name,
                'externalAccountId' => opp.Account.External_Id__c
            });
        }

        // Queue for async processing
        System.enqueueJob(new OpportunitySyncQueueable(payloads));
    }

    private static String getAPIToken() {
        // Retrieve from Custom Metadata or Named Credential
        return 'your-api-token';
    }
}
```

## Reports & Dashboards

### Dashboard Components

```yaml
dashboard: "Sales Executive Dashboard"

components:
  - name: "Pipeline by Stage"
    type: "Funnel Chart"
    report: "Pipeline_by_Stage"
    grouping: "StageName"
    measure: "Sum of Amount"

  - name: "Closed Revenue This Quarter"
    type: "Metric"
    report: "Closed_Won_This_Quarter"
    measure: "Sum of Amount"
    goal: 1000000

  - name: "Win Rate Trend"
    type: "Line Chart"
    report: "Monthly_Win_Rate"
    x_axis: "CloseDate (Month)"
    y_axis: "Win Rate"

  - name: "Top 10 Open Opportunities"
    type: "Table"
    report: "Top_Open_Opportunities"
    columns: ["Opportunity Name", "Account", "Amount", "Stage", "Close Date"]

  - name: "Leads by Source This Month"
    type: "Donut Chart"
    report: "Leads_by_Source"
    grouping: "LeadSource"
    measure: "Record Count"

  - name: "Activity Leaderboard"
    type: "Horizontal Bar Chart"
    report: "Activity_by_Rep"
    grouping: "Owner.Name"
    measure: "Activity Count"

  - name: "Forecast Summary"
    type: "Stacked Bar Chart"
    report: "Forecast_by_Category"
    grouping: "ForecastCategory"
    measure: "Sum of Amount"
```

### Report Definitions

```yaml
reports:
  - name: "Pipeline Health Report"
    object: "Opportunity"
    filters:
      - field: "IsClosed"
        value: false
      - field: "CloseDate"
        value: "THIS_FISCAL_QUARTER"
    columns:
      - "Opportunity.Name"
      - "Account.Name"
      - "Amount"
      - "StageName"
      - "Probability"
      - "CloseDate"
      - "Owner.Name"
      - "Days_in_Stage__c"
    grouping:
      - field: "StageName"
        sort: "Asc"
    summary:
      - column: "Amount"
        function: "Sum"
      - column: "Record Count"
        function: "Count"

  - name: "Lead Conversion Analysis"
    object: "Lead"
    filters:
      - field: "CreatedDate"
        value: "THIS_YEAR"
    columns:
      - "LeadSource"
      - "Industry"
      - "Status"
      - "ConvertedDate"
      - "Lead_Score__c"
    grouping:
      - field: "LeadSource"
      - field: "Status"
    summary:
      - formula: "Converted / Total"
        name: "Conversion Rate"
```

## Best Practices Checklist

```markdown
## SALESFORCE HEALTH CHECK

### Data Model
☐ Custom objects properly related
☐ Field types appropriate for data
☐ Picklist values standardized
☐ Required fields enforced
☐ Validation rules active
☐ Duplicate rules configured

### Automation
☐ Flows bulkified (no SOQL in loops)
☐ Governor limits considered
☐ Error handling implemented
☐ Trigger handler pattern used
☐ Test coverage > 85%

### Security
☐ Profiles configured properly
☐ Permission sets for feature access
☐ Field-level security reviewed
☐ Sharing rules appropriate
☐ Record types secured

### Performance
☐ Indexes on frequently queried fields
☐ Skinny tables for large objects
☐ Archive/delete old data
☐ Report optimizations applied
☐ List views indexed

### Integrations
☐ Named Credentials used
☐ Callout limits managed
☐ Error logging implemented
☐ Retry logic for failures
☐ Data mapping documented
```

## API Parameters

```python
model = "claude-sonnet-4-20250514"
max_tokens = 8192
temperature = 0.3
```

## Usage

```
/salesforce

# Specific operations:
/salesforce --action configure-object --object Lead
/salesforce --action create-flow --type "lead assignment"
/salesforce --action write-apex --trigger "opportunity validation"
/salesforce --action build-report --type "pipeline analysis"
/salesforce --action soql-query --object Opportunity --filters "open deals"
```

## Resources

- [Salesforce Developer Documentation](https://developer.salesforce.com/docs)
- [Trailhead Learning](https://trailhead.salesforce.com)
- [Salesforce Stack Exchange](https://salesforce.stackexchange.com)
- [Apex Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta)
