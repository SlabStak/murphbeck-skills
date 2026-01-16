# MCP Server Templates

Production-ready Model Context Protocol (MCP) server templates for extending Claude's capabilities.

## Available Servers

### 1. Database Server (`database-server/`)

Multi-database MCP server supporting PostgreSQL, MySQL, and SQLite.

**Tools:**
- `query` - Execute SELECT queries with parameterized inputs
- `insert` - Insert records with automatic escaping
- `update` - Update records with WHERE clause support
- `delete` - Delete records safely
- `list_tables` - List all tables in the database
- `describe_table` - Get table schema/structure

**Configuration:**
```bash
# Environment variables
DB_TYPE=postgresql          # postgresql | mysql | sqlite
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
DB_READ_ONLY=false          # Optional: restrict to SELECT only
DB_MAX_CONNECTIONS=10       # Optional: connection pool size
```

**Installation:**
```bash
cd database-server
npm install
npm run build
npm start
```

**Claude Code Configuration:**
```json
{
  "mcpServers": {
    "database": {
      "command": "node",
      "args": ["/path/to/database-server/dist/index.js"],
      "env": {
        "DB_TYPE": "postgresql",
        "DATABASE_URL": "postgres://user:pass@localhost:5432/mydb"
      }
    }
  }
}
```

---

### 2. API Gateway Server (`api-gateway-server/`)

HTTP request gateway for connecting Claude to external REST APIs.

**Tools:**
- `http_request` - Make GET, POST, PUT, PATCH, DELETE requests
- `list_endpoints` - List configured API endpoints
- `configure_endpoint` - Add new API endpoint configurations

**Features:**
- Multiple authentication types (Bearer, API Key, Basic)
- Domain allowlisting for security
- Automatic retry with exponential backoff
- Request timeout handling
- Query parameter and header support

**Configuration:**
```bash
# Environment variables
ALLOWED_DOMAINS=api.example.com,api.another.com  # Optional: restrict domains
DEFAULT_HEADERS='{"User-Agent": "MCP-Gateway"}'  # Optional: default headers
REQUEST_TIMEOUT=30000                             # Optional: timeout in ms
MAX_RETRIES=3                                     # Optional: retry count

# Pre-configured endpoints (JSON array)
API_ENDPOINTS='[
  {
    "name": "github",
    "baseUrl": "https://api.github.com",
    "authType": "bearer",
    "authValue": "ghp_xxxx"
  },
  {
    "name": "stripe",
    "baseUrl": "https://api.stripe.com/v1",
    "authType": "bearer",
    "authValue": "sk_test_xxxx"
  }
]'
```

**Installation:**
```bash
cd api-gateway-server
npm install
npm run build
npm start
```

**Claude Code Configuration:**
```json
{
  "mcpServers": {
    "api-gateway": {
      "command": "node",
      "args": ["/path/to/api-gateway-server/dist/index.js"],
      "env": {
        "ALLOWED_DOMAINS": "api.github.com,api.stripe.com",
        "API_ENDPOINTS": "[{\"name\":\"github\",\"baseUrl\":\"https://api.github.com\",\"authType\":\"bearer\",\"authValue\":\"ghp_xxxx\"}]"
      }
    }
  }
}
```

---

## Creating Your Own MCP Server

### Basic Structure

```
my-mcp-server/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

### Minimal Template

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Define tools
const TOOLS = [
  {
    name: "my_tool",
    description: "Description of what this tool does",
    inputSchema: {
      type: "object" as const,
      properties: {
        param1: { type: "string", description: "Parameter description" },
      },
      required: ["param1"],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "my_tool": {
      // Implement tool logic
      const result = `Processed: ${args?.param1}`;
      return {
        content: [{ type: "text", text: result }],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server started");
}

main().catch(console.error);
```

### Package.json Template

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "tsx": "^4.0.0"
  }
}
```

---

## Best Practices

### Security
- Always validate and sanitize inputs
- Use domain allowlisting for external requests
- Never expose sensitive credentials in error messages
- Implement proper authentication handling
- Consider read-only modes for database access

### Error Handling
- Return structured error responses
- Log errors to stderr (not stdout)
- Include actionable error messages
- Handle timeouts gracefully

### Performance
- Use connection pooling for databases
- Implement retry logic with backoff
- Set appropriate timeouts
- Cache where applicable

### Testing
```bash
# Test locally with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Code MCP Documentation](https://docs.anthropic.com/claude-code/mcp)

---

## License

MIT
