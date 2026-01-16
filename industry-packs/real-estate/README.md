# Real Estate Industry Skill Pack

A comprehensive collection of AI-powered skills for real estate professionals. Generate listings, analyze markets, communicate with clients, and close more deals.

## Included Skills

| Skill | Description | Use Case |
|-------|-------------|----------|
| `property-listing.md` | Generate MLS-optimized property descriptions | New listings, social media posts, marketing |
| `cma-report.md` | Create Comparative Market Analysis reports | Pricing properties, winning listings |
| `client-communication.md` | Professional client email templates | Buyer/seller communication at all stages |
| `open-house.md` | Open house planning and execution | Events, lead capture, follow-up |
| `lead-nurturing.md` | Automated drip campaigns | Convert prospects to clients |
| `market-analysis.md` | Market reports and investment analysis | Client education, investor relations |

## Quick Start

### Installation

Copy skills to your Claude commands directory:

```bash
cp *.md ~/.claude/commands/
```

### Usage

Invoke any skill by name:

```bash
/property-listing
/cma-report
/real-estate-client-comms
/open-house-planner
/re-lead-nurturing
/re-market-analysis
```

## Skill Details

### Property Listing Generator

Creates compelling, Fair Housing compliant listing descriptions.

**Output Types:**
- MLS Full Description (750-1000 chars)
- MLS Short Description (250-300 chars)
- Social Media (Instagram/Facebook)
- Broker Remarks
- Email Marketing

**Example:**
```
/property-listing
Address: 123 Main St, Austin, TX
Price: $550,000
Beds: 4 | Baths: 3 | SqFt: 2,400
Features: Pool, updated kitchen, home office
Output: mls_full
Tone: luxury
```

---

### CMA Report Generator

Creates professional Comparative Market Analysis reports.

**Includes:**
- Comparable sales analysis
- Adjustment calculations
- Market condition analysis
- Pricing recommendations
- Client-ready formatting

**Output Formats:**
- Full Report (detailed with appendix)
- Executive Summary (1-page overview)
- Pricing Only (quick recommendation)

---

### Client Communication Templates

Pre-built templates for every transaction stage.

**Buyer Communications:**
- Initial consultation follow-up
- Showing feedback request
- Offer submitted notification
- Under contract timeline
- Closing preparation

**Seller Communications:**
- Listing appointment follow-up
- Weekly market updates
- Price reduction discussion
- Offer received notification

**Transaction:**
- Milestone notifications
- Inspection results
- Appraisal updates
- Closing countdown

---

### Open House Planner

Complete open house planning and execution system.

**Includes:**
- 2-week marketing timeline
- Day-of execution checklist
- Visitor engagement scripts
- Lead capture templates
- Post-event follow-up sequence
- ROI tracking template

---

### Lead Nurturing System

Automated drip campaigns by lead type.

**Campaign Types:**
- New Buyer Lead (90-day, 12 emails)
- New Seller Lead (60-day, 8 emails)
- Open House Follow-up (14-day, 5 emails)
- Past Client (ongoing monthly)

**Features:**
- Lead scoring matrix
- Behavior triggers
- Text message templates
- Automation rules

---

### Market Analysis Reports

Professional market reports for different audiences.

**Report Types:**
- Monthly Market Update (client-facing)
- Investor Analysis (cap rates, yields)
- Neighborhood Comparison
- Weekly Market Brief
- Quarterly Economic Context

## Best Practices

### Fair Housing Compliance

All listing skills follow Fair Housing Act guidelines:
- No mention of protected classes
- Inclusive, welcoming language
- Focus on property features only

### Personalization

Replace placeholder text with:
- Actual client names
- Real property details
- Accurate market data
- Local information

### Integration Suggestions

| Skill | Integrates With |
|-------|-----------------|
| Property Listing | MLS systems, social media schedulers |
| CMA Report | Cloud CMA, RPR, Realist |
| Client Comms | Email platforms (Mailchimp, Follow Up Boss) |
| Open House | Sign-in apps (Spacio, Open Home Pro) |
| Lead Nurturing | CRM systems (Follow Up Boss, KvCore) |
| Market Analysis | MLS data, Census data |

## Customization

Each skill supports customization:

```bash
# Add your branding
/property-listing --brokerage "ABC Realty" --agent "John Smith"

# Adjust tone
/client-communication --tone formal
/property-listing --tone luxury

# Specify format
/cma-report --format executive_summary
/market-analysis --type investor_report
```

## Support

- Issues: Create a GitHub issue
- Updates: Check for new versions monthly
- Requests: Submit feature requests

## License

MIT - Free for personal and commercial use.

---

*Part of the Murphbeck AI Skills Library*
