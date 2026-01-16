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

### Code-Focused Agents

| Agent | Purpose |
|-------|---------|
| [Code Review Agent](./code-review-agent.md) | Automated code reviews |
| [Test Generator Agent](./test-generator-agent.md) | Generate test suites |
| [Documentation Agent](./documentation-agent.md) | Generate docs |
| [Refactor Agent](./refactor-agent.md) | Code refactoring |
| [Security Agent](./security-agent.md) | Security audits |
| [Deployment Agent](./deployment-agent.md) | CI/CD automation |

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
| 1.0.0 | Jan 2026 | Initial release with 6 business agents |
| 0.9.0 | Dec 2025 | Added code-focused agents |

---

*Murphbeck AI Agents - Autonomous Intelligence for Business Operations*
