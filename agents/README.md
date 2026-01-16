# Murphbeck AI Agents

Production-ready autonomous agents for business automation.

## Agent Catalog

| Agent | Purpose | Key Integrations | Status |
|-------|---------|------------------|--------|
| [Voice Agent](./voice-agent.md) | Phone calls, IVR, voice assistants | Twilio, VAPI, Bland | Production |
| [Email Agent](./email-agent.md) | Inbox management, auto-responses | Gmail, Outlook, SendGrid | Production |
| [Support Agent](./support-agent.md) | Ticket resolution, customer service | Zendesk, Intercom, Freshdesk | Production |
| [Sales Agent](./sales-agent.md) | Outbound, qualification, pipeline | Salesforce, HubSpot, Outreach | Production |
| [Research Agent](./web-research-agent.md) | Web research, competitive intel | Serper, Firecrawl, NewsAPI | Production |
| [Data Agent](./data-agent.md) | ETL, transformation, analytics | PostgreSQL, Snowflake, Airflow | Production |

### Code-Focused Agents (v2.0.0)

| Agent | Purpose | Key Capabilities | Status |
|-------|---------|------------------|--------|
| [Code Review Agent](./code-review-agent.md) | Deep code analysis & review | Multi-language, security scan, performance analysis | Production |
| [Test Generator Agent](./test-generator-agent.md) | Comprehensive test suites | Unit, integration, E2E, coverage analysis | Production |
| [Documentation Agent](./documentation-agent.md) | Auto-generate docs | JSDoc, API docs, architecture diagrams | Production |
| [Refactor Agent](./refactor-agent.md) | Intelligent refactoring | Pattern detection, DRY enforcement, complexity reduction | Production |
| [Security Agent](./security-agent.md) | OWASP Top 10 audits | Vulnerability scan, secret detection, compliance | Production |
| [Deployment Agent](./deployment-agent.md) | Zero-downtime deploys | Multi-platform, blue-green, canary, rollback | Production |

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT FRAMEWORK                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   TRIGGER   │───▶│   AGENT     │───▶│   ACTION    │         │
│  │  (Event)    │    │   (LLM)     │    │  (Tools)    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│        │                  │                  │                  │
│        │                  │                  │                  │
│        ▼                  ▼                  ▼                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                       MEMORY                             │   │
│  │  • Conversation History    • Entity State               │   │
│  │  • Tool Results            • User Preferences           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     GUARDRAILS                           │   │
│  │  • Rate Limits     • Approval Gates    • Audit Logs     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Choose an Agent

Select based on your use case:

| Use Case | Agent |
|----------|-------|
| Handle phone calls | Voice Agent |
| Manage email inbox | Email Agent |
| Customer support tickets | Support Agent |
| Sales prospecting | Sales Agent |
| Research & analysis | Research Agent |
| Data pipelines | Data Agent |

### 2. Configure Integrations

Each agent requires specific integrations:

```typescript
// Example: Support Agent with Zendesk
const supportAgent = new SupportAgent({
  llm: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514'
  },
  integrations: {
    zendesk: {
      subdomain: process.env.ZENDESK_SUBDOMAIN,
      email: process.env.ZENDESK_EMAIL,
      token: process.env.ZENDESK_TOKEN
    }
  },
  guardrails: {
    autoResolve: ['password_reset', 'status_inquiry'],
    requireApproval: ['refund_request', 'account_closure']
  }
});
```

### 3. Define Triggers

Set up event triggers:

```typescript
// Webhook trigger
app.post('/webhook/zendesk', async (req, res) => {
  const ticket = req.body;
  await supportAgent.processTicket(ticket);
  res.json({ success: true });
});

// Scheduled trigger
cron.schedule('*/5 * * * *', async () => {
  await emailAgent.processInbox();
});

// Event trigger
eventBus.on('new_lead', async (lead) => {
  await salesAgent.qualifyLead(lead);
});
```

### 4. Monitor & Iterate

Track agent performance:

```typescript
const metrics = await agent.getMetrics({
  period: 'last_7_days',
  include: ['resolutions', 'escalations', 'satisfaction']
});
```

---

## Agent Capabilities Matrix

| Capability | Voice | Email | Support | Sales | Research | Data |
|------------|:-----:|:-----:|:-------:|:-----:|:--------:|:----:|
| Inbound handling | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Outbound actions | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Auto-response | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Scheduling | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| CRM integration | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-channel | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Human escalation | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Code-Focused Agents (v2.0.0)

Production-ready agents for software development automation.

### Code Agent Capabilities Matrix

| Capability | Review | Test Gen | Docs | Refactor | Security | Deploy |
|------------|:------:|:--------:|:----:|:--------:|:--------:|:------:|
| Multi-language | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AST analysis | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Git integration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CI/CD integration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto-fix | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Reporting | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Quick Start: Code Review

```typescript
import { CodeReviewAgent } from '@murphbeck/agents';

const reviewer = new CodeReviewAgent({
  llm: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  config: {
    review_depth: 'comprehensive',
    focus_areas: ['security', 'performance', 'maintainability'],
    auto_approve_threshold: 0.95
  }
});

// Review a PR
const review = await reviewer.reviewPullRequest({
  repo: 'owner/repo',
  pr_number: 123
});

console.log(review.summary);
// → "Found 3 issues: 1 critical (SQL injection), 2 suggestions"
```

### Quick Start: Security Audit

```typescript
import { SecurityAgent } from '@murphbeck/agents';

const securityAgent = new SecurityAgent({
  llm: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  config: {
    scan_types: ['owasp_top10', 'secrets', 'dependencies'],
    compliance_frameworks: ['soc2', 'pci_dss'],
    fail_on_severity: 'high'
  }
});

// Audit codebase
const audit = await securityAgent.auditCodebase({
  path: './src',
  include_dependencies: true
});

console.log(audit.cvss_score);  // → 7.2
console.log(audit.findings);    // → [{type: 'A03:2021', severity: 'high', ...}]
```

### Quick Start: Deployment

```typescript
import { DeploymentAgent } from '@murphbeck/agents';

const deployer = new DeploymentAgent({
  llm: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  config: {
    platform: 'kubernetes',
    strategy: 'canary',
    canary_percentage: 10,
    auto_rollback: true
  }
});

// Deploy with canary
const deployment = await deployer.deploy({
  image: 'myapp:v2.0.0',
  namespace: 'production',
  health_check: '/api/health'
});

console.log(deployment.status);  // → "canary_healthy"
await deployer.promoteCanary();  // → full rollout
```

### CI/CD Integration

```yaml
# .github/workflows/code-agents.yml
name: Code Quality Pipeline

on: [push, pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Code Review
        uses: murphbeck/code-review-action@v2
        with:
          anthropic_key: ${{ secrets.ANTHROPIC_API_KEY }}
          review_depth: comprehensive
          fail_on: critical

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Security Audit
        uses: murphbeck/security-agent-action@v2
        with:
          anthropic_key: ${{ secrets.ANTHROPIC_API_KEY }}
          scan_secrets: true
          scan_dependencies: true
          compliance: soc2,owasp

  test-gen:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - name: Generate Missing Tests
        uses: murphbeck/test-gen-action@v2
        with:
          anthropic_key: ${{ secrets.ANTHROPIC_API_KEY }}
          coverage_threshold: 80
          frameworks: jest,pytest

  deploy:
    needs: [review, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        uses: murphbeck/deploy-agent-action@v2
        with:
          anthropic_key: ${{ secrets.ANTHROPIC_API_KEY }}
          platform: vercel
          strategy: blue-green
          auto_rollback: true
```

### Code Agent Protocols

Each code agent follows a structured protocol:

| Agent | Protocol Steps |
|-------|----------------|
| Code Review | Reconnaissance → Static Analysis → Pattern Detection → Issue Classification → Report Generation |
| Test Generator | Code Analysis → Coverage Mapping → Test Strategy → Test Generation → Validation |
| Documentation | Code Parsing → Structure Analysis → Content Generation → Format Output → Link Validation |
| Refactor | Pattern Detection → Impact Analysis → Transform Planning → Safe Refactoring → Verification |
| Security | Reconnaissance → Vulnerability Analysis → Risk Assessment → Remediation → Reporting |
| Deployment | Pre-flight Checks → Strategy Selection → Execute Deploy → Health Verification → Post-Deploy |

---

## Common Patterns

### Agent Loop

```typescript
async function agentLoop(input: AgentInput): Promise<AgentOutput> {
  // 1. Load context
  const context = await loadContext(input);

  // 2. Generate response
  const response = await llm.complete({
    system: AGENT_SYSTEM_PROMPT,
    messages: context.messages,
    tools: AGENT_TOOLS
  });

  // 3. Execute tools
  if (response.toolCalls) {
    for (const call of response.toolCalls) {
      const result = await executeTool(call);
      context.messages.push({ role: 'tool', content: result });
    }
    // Continue loop if needed
    return agentLoop({ ...input, context });
  }

  // 4. Return final response
  return {
    response: response.content,
    actions: context.actions,
    metadata: context.metadata
  };
}
```

### Guardrails Pattern

```typescript
class AgentGuardrails {
  async checkBeforeAction(action: Action): Promise<GuardrailResult> {
    // Rate limiting
    if (await this.isRateLimited(action)) {
      return { allowed: false, reason: 'rate_limited' };
    }

    // Approval gates
    if (this.requiresApproval(action)) {
      return { allowed: false, reason: 'requires_approval', action };
    }

    // Content filtering
    if (await this.containsProhibited(action)) {
      return { allowed: false, reason: 'prohibited_content' };
    }

    return { allowed: true };
  }
}
```

### Memory Pattern

```typescript
class AgentMemory {
  async getContext(entityId: string): Promise<Context> {
    return {
      shortTerm: await this.getConversationHistory(entityId, 10),
      longTerm: await this.getEntityProfile(entityId),
      working: await this.getPendingActions(entityId)
    };
  }

  async saveInteraction(interaction: Interaction): Promise<void> {
    await this.db.insert('interactions', interaction);
    await this.updateEntityProfile(interaction);
    await this.indexForRetrieval(interaction);
  }
}
```

---

## Deployment Options

### Self-Hosted

```yaml
# docker-compose.yml
services:
  agent:
    image: murphbeck/agent-runtime
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./agents:/app/agents
    ports:
      - "3000:3000"

  redis:
    image: redis:alpine

  postgres:
    image: postgres:15
```

### Serverless

```typescript
// AWS Lambda handler
export const handler = async (event: APIGatewayEvent) => {
  const agent = new SupportAgent(config);
  const result = await agent.handleEvent(event.body);
  return { statusCode: 200, body: JSON.stringify(result) };
};
```

### Managed Platforms

- **n8n**: Use custom nodes for agent execution
- **Zapier**: Webhook triggers → Agent → Actions
- **Make**: Scenario-based agent orchestration

---

## Security Considerations

### Authentication & Authorization
- Use service accounts with minimal permissions
- Rotate API keys regularly
- Implement proper OAuth flows for integrations

### Data Protection
- Never log sensitive data (PII, credentials)
- Encrypt data at rest and in transit
- Implement data retention policies

### Audit Logging
```typescript
interface AuditLog {
  timestamp: Date;
  agent_id: string;
  action: string;
  input: object;  // sanitized
  output: object; // sanitized
  user_id?: string;
  ip_address?: string;
  success: boolean;
  error?: string;
}
```

---

## Monitoring & Observability

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Response Time | Time to first response | <5s |
| Resolution Rate | % resolved without escalation | >80% |
| Error Rate | % failed executions | <1% |
| Customer Satisfaction | CSAT/NPS scores | >4.0/50 |
| Tool Success Rate | % successful tool calls | >95% |

### Dashboards

```typescript
// Grafana dashboard config
const dashboard = {
  panels: [
    { title: 'Requests/min', query: 'rate(agent_requests_total[5m])' },
    { title: 'Latency P95', query: 'histogram_quantile(0.95, agent_latency_bucket)' },
    { title: 'Error Rate', query: 'rate(agent_errors_total[5m])' },
    { title: 'Active Sessions', query: 'agent_active_sessions' }
  ]
};
```

---

## Resources

- [Agent Skills Guide](../skillforge.md)
- [MCP Server Integration](../templates/mcp-servers/)
- [n8n Workflow Examples](../templates/n8n-workflow-pack/)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Jan 2026 | **Code Agents v2.0.0** - Comprehensive upgrades to all 6 code-focused agents |
| 1.0.0 | Jan 2026 | Initial release with 6 business agents |
| 0.9.0 | Dec 2025 | Added code-focused agents (v1) |

### v2.0.0 Code Agents Changelog

| Agent | Key Improvements |
|-------|------------------|
| Code Review | Multi-language AST analysis, SOLID/DRY detection, auto-fix suggestions |
| Test Generator | Coverage analysis, multiple frameworks, boundary testing |
| Documentation | JSDoc/TSDoc, API docs, mermaid diagrams |
| Refactor | Safe transforms, complexity metrics, breaking change detection |
| Security | OWASP Top 10 2021, CVSS scoring, 20+ secret patterns, compliance frameworks |
| Deployment | Multi-platform (Vercel, K8s, ECS, Railway), blue-green/canary, auto-rollback |

---

*Murphbeck AI Agents - Autonomous Intelligence for Business Operations*
