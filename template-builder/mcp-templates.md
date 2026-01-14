# MCP Server Templates

Model Context Protocol (MCP) servers extend Claude's capabilities with external integrations.

## Configuration Location

```
project-root/
└── .mcp.json            # MCP server configuration
```

## MCP Server Types

| Type | Description | Use Case |
|------|-------------|----------|
| `http` | Remote HTTP server | Cloud services (Slack, GitHub) |
| `stdio` | Local process | Database, file system |
| `sse` | Server-sent events | Real-time data streams |

## Anthropic Official Servers

### Slack Integration

```json
{
  "mcpServers": {
    "slack": {
      "type": "http",
      "url": "https://slack.mcp.anthropic.com/mcp"
    }
  }
}
```

**Capabilities:**
- Send messages to channels
- Read channel history
- Search messages
- Manage threads

### GitHub Integration

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://github.mcp.anthropic.com/mcp"
    }
  }
}
```

**Capabilities:**
- Create/read issues
- Create/review PRs
- Read repository files
- Manage branches

## Community MCP Servers

### PostgreSQL Database

```json
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

**Capabilities:**
- Execute SQL queries
- Inspect schema
- Run migrations

### SQLite Database

```json
{
  "mcpServers": {
    "sqlite": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "path/to/database.db"]
    }
  }
}
```

### File System Access

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
    }
  }
}
```

**Note:** Restricts access to specified paths only.

### Brave Search

```json
{
  "mcpServers": {
    "brave-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

### Puppeteer (Web Automation)

```json
{
  "mcpServers": {
    "puppeteer": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**Capabilities:**
- Navigate to URLs
- Take screenshots
- Click elements
- Fill forms
- Extract text

### Memory (Persistent Context)

```json
{
  "mcpServers": {
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Capabilities:**
- Store key-value pairs
- Persist across sessions
- Recall previous context

## Full Development Stack

### Web Development Setup

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://github.mcp.anthropic.com/mcp"
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    },
    "puppeteer": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

### Data Engineering Setup

```json
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    },
    "bigquery": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-bigquery"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "${GOOGLE_APPLICATION_CREDENTIALS}"
      }
    },
    "s3": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-s3"],
      "env": {
        "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
        "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}",
        "AWS_REGION": "${AWS_REGION}"
      }
    }
  }
}
```

### Team Communication Setup

```json
{
  "mcpServers": {
    "slack": {
      "type": "http",
      "url": "https://slack.mcp.anthropic.com/mcp"
    },
    "linear": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-linear"],
      "env": {
        "LINEAR_API_KEY": "${LINEAR_API_KEY}"
      }
    },
    "notion": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-notion"],
      "env": {
        "NOTION_API_KEY": "${NOTION_API_KEY}"
      }
    }
  }
}
```

## Custom MCP Server Template

### Basic Structure (TypeScript)

```typescript
// server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server(
  { name: 'my-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

// Define tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'my_tool',
      description: 'What this tool does',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string', description: 'Parameter description' }
        },
        required: ['param1']
      }
    }
  ]
}))

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'my_tool') {
    const { param1 } = request.params.arguments
    // Do something with param1
    return { content: [{ type: 'text', text: `Result: ${param1}` }] }
  }
  throw new Error(`Unknown tool: ${request.params.name}`)
})

// Start server
const transport = new StdioServerTransport()
await server.connect(transport)
```

### Package.json

```json
{
  "name": "@your-org/mcp-server-custom",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "mcp-server-custom": "./dist/server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
```

### Using Custom Server

```json
{
  "mcpServers": {
    "custom": {
      "type": "stdio",
      "command": "node",
      "args": ["./path/to/dist/server.js"]
    }
  }
}
```

## Environment Variables

### Using .env Files

MCP configs support environment variable expansion with `${VAR_NAME}` syntax:

```json
{
  "mcpServers": {
    "postgres": {
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

### Setting Variables

```bash
# .env file (don't commit!)
DATABASE_URL=postgres://user:pass@host:5432/db
SLACK_TOKEN=xoxb-your-token

# Or export in shell
export DATABASE_URL=postgres://...
```

## Security Best Practices

### Do
- Use environment variables for secrets
- Restrict file system access to specific paths
- Audit MCP server code before using
- Use official Anthropic servers when available
- Keep servers updated

### Don't
- Hardcode API keys in `.mcp.json`
- Give file system access to entire disk
- Use unvetted community servers in production
- Expose database credentials directly

## Debugging MCP Servers

### Check Server Status

```bash
# Test if server starts
npx @modelcontextprotocol/server-postgres 2>&1

# Check environment variables
echo $DATABASE_URL
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Server won't start | Missing env vars | Check `.env` file |
| Permission denied | Wrong file path | Check `args` paths |
| Connection refused | Service not running | Start dependent services |
| Unknown tool | Server not registered | Check `.mcp.json` syntax |

## MCP Server Directory

Official servers: https://github.com/modelcontextprotocol/servers

Popular community servers:
- `@anthropic/mcp-server-linear` - Linear issue tracking
- `@anthropic/mcp-server-notion` - Notion workspace
- `@anthropic/mcp-server-vercel` - Vercel deployments
- `@anthropic/mcp-server-stripe` - Stripe payments
