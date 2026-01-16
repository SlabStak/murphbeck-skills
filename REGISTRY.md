# Murphbeck Skills Library - Master Registry

**Version:** 2.0.0
**Last Updated:** January 2026
**Total Assets:** 448+ skills, 5 templates, 3 industry packs, 3 integrations, 2 MCP servers

---

## Quick Navigation

- [Project Templates](#project-templates)
- [Industry Skill Packs](#industry-skill-packs)
- [Integration Skills](#integration-skills)
- [MCP Servers](#mcp-servers)
- [Core Skills by Category](#core-skills-by-category)
- [Agents](#agents)

---

## Project Templates

Production-ready starter templates for common project types.

| Template | Location | Stack | Use Case |
|----------|----------|-------|----------|
| **Next.js SaaS Starter** | `templates/nextjs-saas-starter/` | Next.js 14, Clerk, Stripe, Prisma, Tailwind | SaaS applications, subscription businesses |
| **Shopify App Starter** | `templates/shopify-app-starter/` | Remix, Prisma, Polaris, Shopify API | E-commerce apps, Shopify integrations |
| **AI Agent Starter** | `templates/ai-agent-starter/` | TypeScript, Anthropic SDK, Tool Framework | Custom AI agents, chatbots |
| **n8n Workflow Pack** | `templates/n8n-workflow-pack/` | n8n JSON workflows | Automation, integrations |
| **MCP Servers** | `templates/mcp-servers/` | TypeScript, MCP SDK | Claude extensions |

### Next.js SaaS Starter

```
templates/nextjs-saas-starter/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Clerk auth pages
│   │   ├── (dashboard)/     # Protected app pages
│   │   ├── (marketing)/     # Public pages
│   │   └── api/             # API routes
│   ├── components/          # UI components (shadcn/ui)
│   ├── lib/                 # Utilities (Stripe, DB, Email)
│   └── config/              # Site & pricing config
├── prisma/schema.prisma     # Database schema
└── package.json
```

**Features:**
- Clerk authentication (OAuth, magic link)
- Stripe subscriptions & usage billing
- Prisma + PostgreSQL
- PostHog analytics
- Resend email
- Dark mode
- API key management

### Shopify App Starter

```
templates/shopify-app-starter/
├── app/
│   ├── routes/
│   │   ├── app._index.tsx   # Dashboard
│   │   ├── app.products.tsx # Product management
│   │   ├── app.billing.tsx  # Subscription
│   │   └── webhooks.tsx     # Webhook handlers
│   ├── services/            # Billing & sync logic
│   └── shopify.server.ts    # Shopify client
├── prisma/schema.prisma
└── shopify.app.toml
```

**Features:**
- Shopify OAuth flow
- Polaris UI components
- GraphQL Admin API
- Billing API integration
- Webhook handling
- Session management

### AI Agent Starter

```
templates/ai-agent-starter/
├── src/
│   ├── agent/
│   │   ├── index.ts         # Main agent loop
│   │   ├── types.ts         # Type definitions
│   │   └── prompts.ts       # System prompts
│   ├── tools/               # Tool implementations
│   ├── memory/              # Conversation memory
│   └── api/server.ts        # HTTP API
└── examples/chat.ts
```

**Features:**
- ReAct-style reasoning
- Tool use framework
- Conversation memory
- Streaming support
- HTTP API endpoint
- Extensible tool system

### n8n Workflow Pack

```
templates/n8n-workflow-pack/workflows/
├── lead-capture-to-crm.json      # Form → CRM integration
├── ai-email-responder.json       # AI-powered email replies
├── social-media-scheduler.json   # Multi-platform posting
├── webhook-router.json           # API request routing
├── ai-content-generator.json     # Blog/social content
├── order-notification.json       # E-commerce alerts
├── error-monitoring.json         # Error aggregation
└── data-sync.json                # Cross-system sync
```

---

## Industry Skill Packs

Domain-specific skills with templates, workflows, and terminology.

### Real Estate Pack

**Location:** `industry-packs/real-estate/`

| Skill | Description | Templates |
|-------|-------------|-----------|
| `property-listing.md` | MLS-optimized listing descriptions | Residential, Commercial, Land, Multi-family |
| `cma-report.md` | Comparative Market Analysis | Full CMA, Quick analysis |
| `client-communication.md` | Buyer/seller correspondence | Onboarding, Updates, Offers |
| `open-house.md` | Open house marketing | Flyers, Emails, Follow-ups |
| `lead-nurturing.md` | Lead conversion sequences | Drip campaigns, Scoring |
| `market-analysis.md` | Market trend reports | Monthly, Quarterly, Investment |

### Healthcare Pack

**Location:** `industry-packs/healthcare/`

| Skill | Description | Templates |
|-------|-------------|-----------|
| `patient-communication.md` | HIPAA-compliant messaging | Appointment, Results, Follow-up |
| `clinical-documentation.md` | Medical documentation | SOAP notes, H&P, Discharge |
| `patient-education.md` | Health education materials | Conditions, Procedures, Medications |
| `practice-management.md` | Operations management | Staff communication, Policies |

### Legal Pack

**Location:** `industry-packs/legal/`

| Skill | Description | Templates |
|-------|-------------|-----------|
| `contract-drafting.md` | Contract generation | NDA, Service, Employment, Licensing |
| `legal-correspondence.md` | Professional letters | Engagement, Demand, C&D, Opinion |
| `client-intake.md` | Matter onboarding | Intake forms, Conflict check |
| `document-summary.md` | Document analysis | Contract, Deposition, Pleading |
| `legal-research.md` | Research memos | Predictive memo, Case brief |

---

## Integration Skills

Connect Claude to external platforms and services.

| Integration | Location | Capabilities |
|-------------|----------|--------------|
| **HubSpot CRM** | `integrations/hubspot-crm.md` | Contacts, Deals, Email sequences, Workflows |
| **Salesforce** | `integrations/salesforce.md` | Leads, Opportunities, Flows, Apex triggers |
| **QuickBooks** | `integrations/quickbooks.md` | Invoices, Expenses, Reports, Chart of accounts |

### Cross-Platform Workflows

Example: Lead → Quote → Invoice
```
HubSpot (Lead) → Salesforce (Opportunity) → QuickBooks (Invoice)
```

---

## MCP Servers

Model Context Protocol servers for extending Claude's capabilities.

### Database Server

**Location:** `templates/mcp-servers/database-server/`

| Tool | Description |
|------|-------------|
| `query` | Execute SELECT queries |
| `insert` | Insert records |
| `update` | Update records |
| `delete` | Delete records |
| `list_tables` | List database tables |
| `describe_table` | Get table schema |

**Supported Databases:** PostgreSQL, MySQL, SQLite

### API Gateway Server

**Location:** `templates/mcp-servers/api-gateway-server/`

| Tool | Description |
|------|-------------|
| `http_request` | Make HTTP requests (GET, POST, PUT, PATCH, DELETE) |
| `list_endpoints` | List configured API endpoints |
| `configure_endpoint` | Add/modify API configurations |

**Authentication:** Bearer, API Key, Basic

---

## Core Skills by Category

### Build & Deploy (12 skills)

| Skill | Invocation | Purpose |
|-------|------------|---------|
| `build.md` | `/build` | Run production build |
| `blueprint.md` | `/blueprint` | Design system architecture |
| `ci-cd.md` | `/ci-cd` | Create CI/CD pipelines |
| `deploy-vercel.md` | `/deploy-vercel` | Deploy to Vercel |
| `docker-compose.md` | `/docker-compose` | Containerize applications |
| `master-builder.md` | `/master-builder` | Full project scaffold |
| `new-component.md` | `/new-component` | Create React components |
| `new-page.md` | `/new-page` | Create Next.js pages |
| `prototype-spec.md` | `/prototype-spec` | Write prototype specs |
| `skillforge.md` | `/skillforge` | Create new skills |
| `template-builder.md` | `/template-builder` | Generate project templates |
| `wireframe.md` | `/wireframe` | Design wireframes |

### Code Quality (10 skills)

| Skill | Invocation | Purpose |
|-------|------------|---------|
| `code-review.md` | `/code-review` | Review code changes |
| `debug.md` | `/debug` | Debug issues |
| `explain.md` | `/explain` | Explain code |
| `fix-errors.md` | `/fix-errors` | Fix build errors |
| `python-debug.md` | `/python-debug` | Debug Python code |
| `python-optimize.md` | `/python-optimize` | Optimize Python |
| `qa-test.md` | `/qa-test` | Quality assurance |
| `refactor.md` | `/refactor` | Refactor code |
| `test-gen.md` | `/test-gen` | Generate tests |
| `vibecode-fixer.md` | `/vibecode-fixer` | Fix Base44 code |

### AI & Automation (15 skills)

| Skill | Invocation | Purpose |
|-------|------------|---------|
| `automate.md` | `/automate` | Workflow automation |
| `dataset-curator.md` | `/dataset-curator` | Curate training data |
| `fine-tune.md` | `/fine-tune` | Fine-tune models |
| `lora-trainer.md` | `/lora-trainer` | Train LoRA adapters |
| `n8n-ai.md` | `/n8n-ai` | AI nodes in n8n |
| `n8n-api.md` | `/n8n-api` | API integrations |
| `n8n-debug.md` | `/n8n-debug` | Debug workflows |
| `n8n-transform.md` | `/n8n-transform` | Data transformation |
| `n8n-triggers.md` | `/n8n-triggers` | Workflow triggers |
| `n8n-workflow.md` | `/n8n-workflow` | Build workflows |
| `new-agent.md` | `/new-agent` | Create agents |
| `orchestrate.md` | `/orchestrate` | Multi-agent orchestration |
| `prompt-engineer.md` | `/prompt-engineer` | Craft prompts |
| `prompt-eval.md` | `/prompt-eval` | Evaluate prompts |
| `rag-systems.md` | `/rag-systems` | RAG architecture |

### Social Media (10 skills)

| Skill | Invocation | Purpose |
|-------|------------|---------|
| `social-approve.md` | `/social-approve` | Content approval |
| `social-calendar.md` | `/social-calendar` | Content calendar |
| `social-create.md` | `/social-create` | Create posts |
| `social-engage.md` | `/social-engage` | Community management |
| `social-ideate.md` | `/social-ideate` | Content ideas |
| `social-media-master.md` | `/social-media-master` | Full social management |
| `social-onboard.md` | `/social-onboard` | Brand onboarding |
| `social-publish.md` | `/social-publish` | Schedule/publish posts |
| `social-report.md` | `/social-report` | Analytics reports |
| `design-os.md` | `/design-os` | Social graphics |

### AdScail Campaign (9 skills)

| Skill | Invocation | Purpose |
|-------|------------|---------|
| `adscail-b2b-enterprise.md` | `/adscail-b2b-enterprise` | B2B campaigns |
| `adscail-brand-awareness.md` | `/adscail-brand-awareness` | Awareness campaigns |
| `adscail-campaign-builder.md` | `/adscail-campaign-builder` | Campaign creation |
| `adscail-funnel.md` | `/adscail-funnel` | Funnel strategy |
| `adscail-regulated-industries.md` | `/adscail-regulated-industries` | Compliant ads |
| `adscail-targeting.md` | `/adscail-targeting` | Audience targeting |
| `adscail-technical-products.md` | `/adscail-technical-products` | Tech product ads |
| `adscail-video-script.md` | `/adscail-video-script` | Video scripts |
| `ad-style-analyzer.md` | `/ad-style-analyzer` | Ad analysis |

### Finance & Pricing (14 skills)

| Skill | Invocation | Purpose |
|-------|------------|---------|
| `billing.md` | `/billing` | Billing operations |
| `cash.md` | `/cash` | Cash flow check |
| `cost-attribution.md` | `/cost-attribution` | Cost allocation |
| `cost-optimize.md` | `/cost-optimize` | Reduce costs |
| `cost-routing.md` | `/cost-routing` | Budget routing |
| `economic-control.md` | `/economic-control` | Value optimization |
| `finance.md` | `/finance` | Financial analysis |
| `finops.md` | `/finops` | Cloud FinOps |
| `payments.md` | `/payments` | Payment systems |
| `pricing-calc.md` | `/pricing-calc` | Pricing calculator |
| `pricing-science.md` | `/pricing-science` | Price elasticity |
| `pricing-strategy.md` | `/pricing-strategy` | Pricing strategy |
| `revenue-optimize.md` | `/revenue-optimize` | Revenue growth |
| `valuation.md` | `/valuation` | Company valuation |

### Sales & CRM (15 skills)

| Skill | Invocation | Purpose |
|-------|------------|---------|
| `account-growth.md` | `/account-growth` | Expand accounts |
| `channel-enable.md` | `/channel-enable` | Partner enablement |
| `customer-success.md` | `/customer-success` | Customer retention |
| `enterprise-sales.md` | `/enterprise-sales` | Enterprise deals |
| `renewals-churn.md` | `/renewals-churn` | Churn prevention |
| `sales-automation.md` | `/sales-automation` | Automate sales |
| `sales-ops.md` | `/sales-ops` | CRM operations |
| `wake-closestack.md` | `/wake-closestack` | Close deals |
| `wake-enterprise.md` | `/wake-enterprise` | Enterprise mode |
| `wake-followup.md` | `/wake-followup` | Follow-ups |
| `wake-lshsales.md` | `/wake-lshsales` | Core sales OS |
| `wake-merch-engineer.md` | `/wake-merch-engineer` | Custom merch |
| `wake-quoteforge.md` | `/wake-quoteforge` | Generate quotes |
| `wake-reach.md` | `/wake-reach` | Expansion |
| `wake-sdrforge.md` | `/wake-sdrforge` | Outbound SDR |

### Launch Agents (35 skills)

Launch-specific agents for specialized tasks.

```
/launch-aegis    /launch-brand    /launch-core     /launch-echo
/launch-flipboard /launch-forge   /launch-gate     /launch-gradex
/launch-hatch    /launch-kit      /launch-lumen    /launch-murphbeck
/launch-offer    /launch-pitch    /launch-pulse    /launch-royaltyrunner
/launch-scanbot  /launch-scout    /launch-script   /launch-sense
/launch-slab     /launch-spark    /launch-stack    /launch-store
/launch-trigger  /launch-vaultx   /launch-vulcan   /launch-vybe
```

### Project Skills (13 skills)

Project-specific configurations and workflows.

```
/project                    # Switch projects
/projects                   # List all projects
/project-asherai            /project-claude-1
/project-flightbreaker      /project-flightbreaker-live
/project-mekell-os          /project-murph-terminal
/project-murphbeck-marketplace    /project-murphbecktech
/project-promptwarrior      /project-shopifyappbuilder
/project-storescorer
```

### AI Governance (25 skills)

| Skill | Purpose |
|-------|---------|
| `ai-ethics.md` | Responsible AI |
| `ai-evolution.md` | AI roadmap |
| `ai-governance.md` | AI safety |
| `alignment-check.md` | Policy validation |
| `bounded-reasoning.md` | Deliberation OS |
| `compliance-audit.md` | AI compliance |
| `control-tower.md` | System oversight |
| `explainability.md` | Decision traces |
| `extended-thinking.md` | Deep reasoning |
| `fallback-governance.md` | Graceful degradation |
| `llm-observability.md` | LLM monitoring |
| `model-benchmark.md` | Model evaluation |
| `model-governance.md` | Model oversight |
| `model-strategy.md` | Model selection |
| `prompt-libraries.md` | Prompt versioning |
| `red-team.md` | Adversarial testing |
| `responsible-ai-ops.md` | Ethical operations |

### Industry OS (7 skills)

| Skill | Industry |
|-------|----------|
| `defense-ai-os.md` | Defense/National Security |
| `education-ai-os.md` | Education/EdTech |
| `finance-ai-os.md` | Financial Services |
| `gov-ai-os.md` | Government/Public Sector |
| `healthcare-ai-os.md` | Healthcare/Life Sciences |
| `sovereign-ai.md` | Regulated AI |
| `government.md` | Civic Tech |

---

## Agents

Specialized agent configurations in `agents/` directory.

| Agent | Purpose |
|-------|---------|
| `build-validator` | Validate builds and deployments |
| `code-architect` | Design system architecture |
| `doc-writer` | Generate documentation |
| `security-auditor` | Security analysis |
| `test-runner` | Execute test suites |
| `dependency-analyst` | Analyze dependencies |

---

## Installation

### Quick Start

```bash
# Clone the repository
git clone https://github.com/murphbeck/skills-library.git

# Or copy skills to Claude Code
cp -r skills/*.md ~/.claude/commands/
```

### Template Installation

```bash
# Next.js SaaS
npx degit murphbeck/skills-library/templates/nextjs-saas-starter my-saas-app

# Shopify App
npx degit murphbeck/skills-library/templates/shopify-app-starter my-shopify-app

# AI Agent
npx degit murphbeck/skills-library/templates/ai-agent-starter my-agent
```

### MCP Server Setup

```bash
cd templates/mcp-servers/database-server
npm install && npm run build

# Add to Claude Code settings
```

---

## Creating Custom Skills

### Skill Format

```markdown
---
name: my-skill
description: What this skill does
version: 1.0.0
category: category-name
tags: [tag1, tag2]
---

# Skill Title

## Overview
Brief description

## Templates/Outputs
What this skill produces

## Instructions
How to use
```

### Register in HEY.EXE

Add trigger patterns to `/hey.md`:

```javascript
my_skill: {
  triggers: [
    /my skill/i,
    /do the thing/i
  ]
}
```

---

## Support

- **Documentation:** `/Volumes/LaCie/ai/skills/README.md`
- **Skills List:** `/Volumes/LaCie/ai/skills/SKILLS-COMPREHENSIVE-LIST.md`
- **MCP Guide:** `/Volumes/LaCie/ai/skills/MCP-COMPREHENSIVE-GUIDE.md`

---

## Statistics

| Category | Count |
|----------|-------|
| Core Skills | 448+ |
| Project Templates | 5 |
| Industry Packs | 3 (17 skills) |
| Integrations | 3 |
| MCP Servers | 2 |
| n8n Workflows | 8 |
| Agents | 6 |
| **Total Assets** | **480+** |

---

*Murphbeck Skills Library - Production AI for Production Teams*
