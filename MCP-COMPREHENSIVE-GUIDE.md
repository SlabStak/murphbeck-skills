# COMPREHENSIVE MCP & AI TOOLS GUIDE

A complete reference for Model Context Protocol servers, AI agent frameworks, and integrations to supercharge your AI development workflow.

---

## QUICK SETUP COMMANDS

```bash
# View current MCP servers
claude mcp list

# Add an HTTP MCP server
claude mcp add --transport http <name> <url>

# Add with authentication
claude mcp add --transport http <name> <url> --header "Authorization: Bearer <token>"

# Add stdio server (local)
claude mcp add <name> -- npx <package-name>

# Remove a server
claude mcp remove <name> -s local
```

---

## ESSENTIAL MCP SERVERS BY CATEGORY

### 1. PAYMENTS & COMMERCE

| Server | URL/Package | Purpose | Install |
|--------|-------------|---------|---------|
| **Stripe** | `https://mcp.stripe.com` | Payments, subscriptions, invoices | `claude mcp add --transport http stripe https://mcp.stripe.com` |
| **Shopify** | `@anthropic/shopify-mcp` | Store management, products, orders | `claude mcp add shopify -- npx @anthropic/shopify-mcp` |

### 2. DATABASES

| Server | Package | Purpose | Install |
|--------|---------|---------|---------|
| **Supabase** | `@supabase/mcp` | PostgreSQL, auth, edge functions | `claude mcp add supabase -- npx @supabase/mcp` |
| **PostgreSQL** | `@modelcontextprotocol/server-postgres` | Direct Postgres queries | `claude mcp add postgres -- npx @modelcontextprotocol/server-postgres` |
| **MongoDB** | `mongodb-mcp-server` | MongoDB queries, aggregations | `claude mcp add mongodb -- npx mongodb-mcp-server` |
| **SQLite** | `@modelcontextprotocol/server-sqlite` | Local SQLite databases | `claude mcp add sqlite -- npx @modelcontextprotocol/server-sqlite` |
| **Redis** | `redis-mcp` | Redis cache operations | `claude mcp add redis -- npx redis-mcp` |

### 3. DEVELOPMENT TOOLS

| Server | URL/Package | Purpose | Install |
|--------|-------------|---------|---------|
| **GitHub** | `@modelcontextprotocol/server-github` | Repos, PRs, issues, actions | `claude mcp add github -- npx @modelcontextprotocol/server-github` |
| **Linear** | `https://mcp.linear.app` | Project management, issues | `claude mcp add --transport http linear https://mcp.linear.app` |
| **Jira** | `@atlassian/atlassian-mcp-server` | Issues, sprints, workflows | `claude mcp add --transport http jira https://mcp.atlassian.com` |
| **Sentry** | `https://mcp.sentry.dev` | Error tracking, debugging | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` |
| **GitLab** | `gitlab-mcp-server` | GitLab repositories | `claude mcp add gitlab -- npx gitlab-mcp-server` |

### 4. CLOUD & INFRASTRUCTURE

| Server | Package | Purpose | Install |
|--------|---------|---------|---------|
| **AWS** | `@aws/mcp` | AWS services management | `claude mcp add aws -- npx @aws/mcp` |
| **Azure** | `@azure/mcp-server` | Azure resources | `claude mcp add azure -- npx @azure/mcp-server` |
| **Cloudflare** | `@cloudflare/mcp-server-cloudflare` | Workers, KV, R2, D1 | `claude mcp add cloudflare -- npx @cloudflare/mcp-server-cloudflare` |
| **Terraform** | `@hashicorp/terraform-mcp-server` | Infrastructure as Code | `claude mcp add terraform -- npx @hashicorp/terraform-mcp-server` |
| **Docker** | `docker-mcp` | Container management | `claude mcp add docker -- npx docker-mcp` |
| **Kubernetes** | `kubernetes-mcp` | K8s cluster management | `claude mcp add k8s -- npx kubernetes-mcp` |

### 5. PRODUCTIVITY & COLLABORATION

| Server | URL/Package | Purpose | Install |
|--------|-------------|---------|---------|
| **Notion** | `https://mcp.notion.com` | Pages, databases, workspaces | `claude mcp add --transport http notion https://mcp.notion.com` |
| **Slack** | `@anthropic/slack-mcp` | Messages, channels, search | `claude mcp add slack -- npx @anthropic/slack-mcp` |
| **Google Workspace** | `google-workspace-mcp` | Gmail, Drive, Docs, Sheets | `claude mcp add google -- npx google-workspace-mcp` |
| **Confluence** | `@atlassian/atlassian-mcp-server` | Documentation, wikis | Via Atlassian MCP |
| **Asana** | `asana-mcp` | Task management | `claude mcp add asana -- npx asana-mcp` |
| **Todoist** | `todoist-mcp` | Personal tasks | `claude mcp add todoist -- npx todoist-mcp` |

### 6. WEB SCRAPING & BROWSER AUTOMATION

| Server | Package | Purpose | Install |
|--------|---------|---------|---------|
| **Firecrawl** | `firecrawl-mcp` | Web scraping, crawling | `claude mcp add firecrawl -- npx -y firecrawl-mcp` |
| **Puppeteer** | `@anthropic/puppeteer-mcp` | Browser automation | `claude mcp add puppeteer -- npx @anthropic/puppeteer-mcp` |
| **Playwright** | `@anthropic/playwright-mcp` | Cross-browser automation | `claude mcp add playwright -- npx @anthropic/playwright-mcp` |
| **Browserbase** | `browserbase-mcp` | Cloud browser automation | `claude mcp add browserbase -- npx browserbase-mcp` |

### 7. AI & ML TOOLS

| Server | Package | Purpose | Install |
|--------|---------|---------|---------|
| **Replicate** | `replicate-mcp` | ML model APIs | `claude mcp add replicate -- npx replicate-mcp` |
| **Hugging Face** | `huggingface-mcp` | Models, datasets | `claude mcp add hf -- npx huggingface-mcp` |
| **OpenAI** | `openai-mcp` | GPT, DALL-E, Whisper | `claude mcp add openai -- npx openai-mcp` |
| **Midjourney** | `midjourney-mcp` | Image generation | `claude mcp add midjourney -- npx midjourney-mcp` |
| **ElevenLabs** | `elevenlabs-mcp` | Text-to-speech | `claude mcp add elevenlabs -- npx elevenlabs-mcp` |

### 8. ANALYTICS & MONITORING

| Server | Package | Purpose | Install |
|--------|---------|---------|---------|
| **Datadog** | `datadog-mcp` | Monitoring, APM | `claude mcp add datadog -- npx datadog-mcp` |
| **Amplitude** | `amplitude-mcp` | Product analytics | `claude mcp add amplitude -- npx amplitude-mcp` |
| **Mixpanel** | `mixpanel-mcp` | Event analytics | `claude mcp add mixpanel -- npx mixpanel-mcp` |
| **PostHog** | `posthog-mcp` | Product analytics | `claude mcp add posthog -- npx posthog-mcp` |

### 9. CRM & MARKETING

| Server | Package | Purpose | Install |
|--------|---------|---------|---------|
| **HubSpot** | `hubspot-mcp` | CRM, marketing | `claude mcp add hubspot -- npx hubspot-mcp` |
| **Salesforce** | `salesforce-mcp` | CRM, sales | `claude mcp add salesforce -- npx salesforce-mcp` |
| **Mailchimp** | `mailchimp-mcp` | Email marketing | `claude mcp add mailchimp -- npx mailchimp-mcp` |
| **SendGrid** | `sendgrid-mcp` | Transactional email | `claude mcp add sendgrid -- npx sendgrid-mcp` |

### 10. FILE & STORAGE

| Server | Package | Purpose | Install |
|--------|---------|---------|---------|
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | Local file operations | `claude mcp add fs -- npx @modelcontextprotocol/server-filesystem /path` |
| **S3** | `s3-mcp` | AWS S3 storage | `claude mcp add s3 -- npx s3-mcp` |
| **Google Drive** | `gdrive-mcp` | Google Drive files | `claude mcp add gdrive -- npx gdrive-mcp` |
| **Dropbox** | `dropbox-mcp` | Dropbox files | `claude mcp add dropbox -- npx dropbox-mcp` |

### 11. COMMUNICATION

| Server | Package | Purpose | Install |
|--------|---------|---------|---------|
| **Discord** | `discord-mcp` | Discord bot operations | `claude mcp add discord -- npx discord-mcp` |
| **Telegram** | `telegram-mcp` | Telegram bot | `claude mcp add telegram -- npx telegram-mcp` |
| **Twilio** | `twilio-mcp` | SMS, voice, video | `claude mcp add twilio -- npx twilio-mcp` |

### 12. SEARCH & KNOWLEDGE

| Server | Package | Purpose | Install |
|--------|---------|---------|---------|
| **Exa** | `exa-mcp` | AI-optimized search | `claude mcp add exa -- npx exa-mcp` |
| **Algolia** | `algolia-mcp` | Search indices | `claude mcp add algolia -- npx algolia-mcp` |
| **Pinecone** | `pinecone-mcp` | Vector database | `claude mcp add pinecone -- npx pinecone-mcp` |
| **Weaviate** | `weaviate-mcp` | Vector search | `claude mcp add weaviate -- npx weaviate-mcp` |

---

## OFFICIAL REFERENCE SERVERS

These are maintained by Anthropic and the MCP steering group:

| Server | Purpose |
|--------|---------|
| **Everything** | Reference/test server |
| **Fetch** | Web content fetching |
| **Filesystem** | Secure file operations |
| **Git** | Repository tools |
| **Memory** | Persistent memory via knowledge graph |
| **Sequential Thinking** | Dynamic problem-solving |
| **Postgres** | Database queries |
| **Puppeteer** | Browser automation |
| **Brave Search** | Web search |

---

## AI AGENT FRAMEWORKS

### Production-Ready Frameworks

| Framework | Best For | Language | Install |
|-----------|----------|----------|---------|
| **LangChain** | General orchestration | Python/JS | `pip install langchain` |
| **LangGraph** | Complex workflows | Python | `pip install langgraph` |
| **CrewAI** | Multi-agent teams | Python | `pip install crewai` |
| **AutoGen** | Async conversations | Python | `pip install autogen` |
| **LlamaIndex** | RAG applications | Python | `pip install llama-index` |
| **OpenAI Agents** | Simple agents | Python | `pip install openai` |
| **Semantic Kernel** | Enterprise .NET | C#/Python | `pip install semantic-kernel` |
| **DSPy** | Prompt optimization | Python | `pip install dspy` |

### When to Use What

```
Single Agent + Tools      → LangChain, OpenAI Agents
Complex Workflows         → LangGraph
Multi-Agent Teams         → CrewAI, AutoGen
RAG Applications          → LlamaIndex
Enterprise .NET           → Semantic Kernel
Prompt Engineering        → DSPy
```

---

## SKILLS TO ADD (Based on MCP Gaps)

### Database Skills (Create These)
- [ ] `supabase-mcp.md` - Supabase MCP integration
- [ ] `postgres-mcp.md` - PostgreSQL MCP setup
- [ ] `mongodb-mcp.md` - MongoDB MCP integration
- [ ] `redis-mcp.md` - Redis caching MCP

### Cloud Skills (Create These)
- [ ] `aws-mcp.md` - AWS MCP integration
- [ ] `azure-mcp.md` - Azure MCP setup
- [ ] `terraform-mcp.md` - Terraform IaC MCP
- [ ] `cloudflare-mcp.md` - Cloudflare Workers/KV/R2

### DevTools Skills (Create These)
- [ ] `github-mcp.md` - GitHub MCP integration
- [ ] `linear-mcp.md` - Linear project management MCP
- [ ] `jira-mcp.md` - Jira/Atlassian MCP
- [ ] `sentry-mcp.md` - Sentry error tracking MCP

### Productivity Skills (Create These)
- [ ] `notion-mcp.md` - Notion workspace MCP
- [ ] `slack-mcp.md` - Slack messaging MCP
- [ ] `google-workspace-mcp.md` - Gmail/Drive/Docs MCP

### Browser Automation Skills (Create These)
- [ ] `firecrawl-mcp.md` - Web scraping MCP
- [ ] `puppeteer-mcp.md` - Browser automation MCP
- [ ] `playwright-mcp.md` - Cross-browser MCP

### AI/ML Skills (Create These)
- [ ] `replicate-mcp.md` - ML models MCP
- [ ] `huggingface-mcp.md` - HF models/datasets
- [ ] `midjourney-mcp.md` - Image generation MCP

### Agent Framework Skills (Create These)
- [ ] `langchain-agents.md` - LangChain agent patterns
- [ ] `langgraph.md` - LangGraph workflows
- [ ] `crewai.md` - CrewAI multi-agent teams
- [ ] `autogen.md` - AutoGen conversations
- [ ] `llamaindex.md` - LlamaIndex RAG

---

## MCP DISCOVERY RESOURCES

### Official Directories
- [MCP Registry](https://github.com/modelcontextprotocol/servers) - Official servers
- [mcpservers.org](https://mcpservers.org/) - Curated directory
- [mcp.so](https://mcp.so/) - Community servers
- [smithery.ai](https://smithery.ai/) - MCP marketplace

### Awesome Lists (GitHub)
- [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) - 7000+ servers
- [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) - Curated list
- [appcypher/awesome-mcp-servers](https://github.com/appcypher/awesome-mcp-servers) - Production-ready
- [microsoft/mcp](https://github.com/microsoft/mcp) - Microsoft's catalog

### Company MCP Pages
- [Stripe MCP](https://docs.stripe.com/mcp)
- [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [Notion MCP](https://developers.notion.com/docs/mcp)
- [Cloudflare MCP](https://developers.cloudflare.com/mcp/)
- [Linear MCP](https://linear.app/docs/mcp)
- [Sentry MCP](https://docs.sentry.io/mcp/)

---

## RECOMMENDED SETUP

### Essential MCP Stack for Developers

```bash
# 1. Payments
claude mcp add --transport http stripe https://mcp.stripe.com

# 2. Database
claude mcp add supabase -- npx @supabase/mcp

# 3. Version Control
claude mcp add github -- npx @modelcontextprotocol/server-github

# 4. Project Management
claude mcp add --transport http linear https://mcp.linear.app

# 5. Error Tracking
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# 6. Web Scraping
claude mcp add firecrawl -- npx -y firecrawl-mcp

# 7. Cloud (choose one)
claude mcp add cloudflare -- npx @cloudflare/mcp-server-cloudflare

# 8. Documentation
claude mcp add --transport http notion https://mcp.notion.com
```

### Verify Setup

```bash
# List all configured servers
claude mcp list

# Check specific server
claude mcp get stripe
```

---

## SECURITY BEST PRACTICES

1. **Use Test/Dev Keys** - Never use production keys in development
2. **Restrict Permissions** - Use restricted API keys with minimal scopes
3. **Read-Only When Possible** - Enable read-only mode for sensitive data
4. **Audit Logging** - Monitor all AI-initiated operations
5. **Separate Environments** - Don't connect AI to production databases
6. **OAuth Over API Keys** - Prefer OAuth for better security

---

## NEXT STEPS

1. Run `claude mcp list` to see current servers
2. Add essential servers from the list above
3. Create missing skills for MCP integrations
4. Test each integration with simple queries
5. Build workflows combining multiple MCPs

---

*Last Updated: January 2026*
*Total MCP Servers Available: 7000+*
*Sources: mcpservers.org, GitHub awesome lists, official documentation*
