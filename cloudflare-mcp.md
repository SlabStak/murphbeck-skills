# CLOUDFLARE.MCP.EXE - Cloudflare Model Context Protocol Specialist

You are **CLOUDFLARE.MCP.EXE** - the AI specialist for integrating Cloudflare services via the Model Context Protocol server.

---

## CORE MODULES

### MCPServer.MOD
- Server configuration
- API token setup
- Account/zone management
- Connection handling

### Workers.MOD
- Worker deployment
- Script management
- Bindings configuration
- Logs and metrics

### KVStorage.MOD
- KV namespace management
- Key-value operations
- Bulk operations
- Metadata handling

### R2Storage.MOD
- Bucket management
- Object operations
- Presigned URLs
- Multipart uploads

### D1Database.MOD
- Database management
- SQL execution
- Schema operations
- Backups

### DNS.MOD
- Zone management
- Record operations
- Proxy configuration
- SSL settings

### Pages.MOD
- Project management
- Deployments
- Build configuration
- Custom domains

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
CLOUDFLARE.MCP.EXE - Cloudflare Model Context Protocol Integration Engine
Production-ready MCP server management for Cloudflare services.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Union
from enum import Enum
from datetime import datetime
import json


# ============================================================
# ENUMS - Service Categories & Tool Types
# ============================================================

class MCPService(Enum):
    """Cloudflare MCP service categories."""
    WORKERS = "workers"
    KV = "kv"
    R2 = "r2"
    D1 = "d1"
    DNS = "dns"
    PAGES = "pages"
    QUEUES = "queues"
    DURABLE_OBJECTS = "durable_objects"
    AI = "ai"
    ANALYTICS = "analytics"

    @property
    def display_name(self) -> str:
        """Human-readable service name."""
        names = {
            "workers": "Cloudflare Workers",
            "kv": "Workers KV Storage",
            "r2": "R2 Object Storage",
            "d1": "D1 Database",
            "dns": "DNS Management",
            "pages": "Cloudflare Pages",
            "queues": "Cloudflare Queues",
            "durable_objects": "Durable Objects",
            "ai": "Workers AI",
            "analytics": "Analytics Engine"
        }
        return names.get(self.value, self.value.title())

    @property
    def required_permissions(self) -> List[str]:
        """API token permissions required for service."""
        permissions = {
            "workers": ["Workers Scripts:Edit", "Workers Routes:Edit"],
            "kv": ["Workers KV Storage:Edit"],
            "r2": ["Workers R2 Storage:Edit"],
            "d1": ["D1:Edit"],
            "dns": ["Zone:DNS:Edit"],
            "pages": ["Pages:Edit"],
            "queues": ["Queues:Edit"],
            "durable_objects": ["Workers Scripts:Edit", "Durable Objects:Edit"],
            "ai": ["Workers AI:Read"],
            "analytics": ["Analytics:Read"]
        }
        return permissions.get(self.value, [])

    @property
    def scope_level(self) -> str:
        """Whether service requires account or zone scope."""
        zone_scoped = ["dns"]
        return "zone" if self.value in zone_scoped else "account"

    @property
    def mcp_tool_prefix(self) -> str:
        """MCP tool name prefix for this service."""
        prefixes = {
            "workers": "worker",
            "kv": "kv",
            "r2": "r2",
            "d1": "d1",
            "dns": "dns",
            "pages": "pages",
            "queues": "queue",
            "durable_objects": "do",
            "ai": "ai",
            "analytics": "analytics"
        }
        return prefixes.get(self.value, self.value)


class MCPToolType(Enum):
    """Types of MCP tools."""
    LIST = "list"
    GET = "get"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    EXECUTE = "execute"
    DEPLOY = "deploy"
    QUERY = "query"

    @property
    def http_method(self) -> str:
        """Corresponding HTTP method."""
        methods = {
            "list": "GET",
            "get": "GET",
            "create": "POST",
            "update": "PUT",
            "delete": "DELETE",
            "execute": "POST",
            "deploy": "PUT",
            "query": "POST"
        }
        return methods.get(self.value, "GET")

    @property
    def is_destructive(self) -> bool:
        """Whether operation modifies data."""
        return self.value in ["create", "update", "delete", "execute", "deploy"]

    @property
    def requires_confirmation(self) -> bool:
        """Whether operation should require user confirmation."""
        return self.value == "delete"


class DNSRecordType(Enum):
    """DNS record types supported."""
    A = "A"
    AAAA = "AAAA"
    CNAME = "CNAME"
    TXT = "TXT"
    MX = "MX"
    NS = "NS"
    SRV = "SRV"
    CAA = "CAA"
    PTR = "PTR"

    @property
    def content_format(self) -> str:
        """Expected content format for record type."""
        formats = {
            "A": "IPv4 address (e.g., 192.0.2.1)",
            "AAAA": "IPv6 address (e.g., 2001:db8::1)",
            "CNAME": "Domain name (e.g., example.com)",
            "TXT": "Text string (e.g., verification code)",
            "MX": "Mail server hostname",
            "NS": "Nameserver hostname",
            "SRV": "_service._proto.name TTL IN SRV priority weight port target",
            "CAA": "CAA flags tag value",
            "PTR": "Reverse DNS hostname"
        }
        return formats.get(self.value, "Varies by record type")

    @property
    def supports_proxy(self) -> bool:
        """Whether record type can be proxied through Cloudflare."""
        return self.value in ["A", "AAAA", "CNAME"]

    @property
    def requires_priority(self) -> bool:
        """Whether record type needs priority field."""
        return self.value in ["MX", "SRV"]


class ConfigScope(Enum):
    """MCP configuration scope levels."""
    USER = "user"
    PROJECT = "project"
    GLOBAL = "global"

    @property
    def config_path(self) -> str:
        """Configuration file path pattern."""
        paths = {
            "user": "~/.claude/mcp.json",
            "project": "./.mcp/cloudflare.json",
            "global": "/etc/claude/mcp.json"
        }
        return paths.get(self.value, "~/.claude/mcp.json")

    @property
    def precedence(self) -> int:
        """Configuration precedence (higher = overrides lower)."""
        return {"global": 1, "user": 2, "project": 3}.get(self.value, 0)


class AuthMethod(Enum):
    """Cloudflare API authentication methods."""
    API_TOKEN = "api_token"
    API_KEY = "api_key"
    OAUTH = "oauth"

    @property
    def env_vars(self) -> List[str]:
        """Environment variables for this auth method."""
        vars_map = {
            "api_token": ["CLOUDFLARE_API_TOKEN"],
            "api_key": ["CLOUDFLARE_API_KEY", "CLOUDFLARE_EMAIL"],
            "oauth": ["CLOUDFLARE_OAUTH_TOKEN", "CLOUDFLARE_OAUTH_REFRESH"]
        }
        return vars_map.get(self.value, [])

    @property
    def is_recommended(self) -> bool:
        """Whether this is the recommended auth method."""
        return self.value == "api_token"

    @property
    def header_format(self) -> str:
        """HTTP authorization header format."""
        formats = {
            "api_token": "Authorization: Bearer <token>",
            "api_key": "X-Auth-Key: <key>, X-Auth-Email: <email>",
            "oauth": "Authorization: Bearer <oauth_token>"
        }
        return formats.get(self.value, "")


# ============================================================
# DATACLASSES - Configuration & Tool Definitions
# ============================================================

@dataclass
class MCPServerConfig:
    """MCP server configuration."""
    command: str = "npx"
    args: List[str] = field(default_factory=lambda: ["@cloudflare/mcp-server-cloudflare"])
    env: Dict[str, str] = field(default_factory=dict)
    account_id: Optional[str] = None
    zone_id: Optional[str] = None
    enabled_services: List[MCPService] = field(default_factory=list)

    @classmethod
    def minimal(cls, api_token: str, account_id: str) -> "MCPServerConfig":
        """Create minimal configuration with API token."""
        return cls(
            env={
                "CLOUDFLARE_API_TOKEN": api_token,
                "CLOUDFLARE_ACCOUNT_ID": account_id
            },
            account_id=account_id,
            enabled_services=[MCPService.WORKERS, MCPService.KV, MCPService.R2]
        )

    @classmethod
    def full_access(cls, api_token: str, account_id: str, zone_id: Optional[str] = None) -> "MCPServerConfig":
        """Create full-access configuration for all services."""
        env = {
            "CLOUDFLARE_API_TOKEN": api_token,
            "CLOUDFLARE_ACCOUNT_ID": account_id
        }
        if zone_id:
            env["CLOUDFLARE_ZONE_ID"] = zone_id

        return cls(
            env=env,
            account_id=account_id,
            zone_id=zone_id,
            enabled_services=list(MCPService)
        )

    @classmethod
    def dns_only(cls, api_token: str, zone_id: str) -> "MCPServerConfig":
        """Create DNS-only configuration."""
        return cls(
            env={
                "CLOUDFLARE_API_TOKEN": api_token,
                "CLOUDFLARE_ZONE_ID": zone_id
            },
            zone_id=zone_id,
            enabled_services=[MCPService.DNS]
        )

    def to_json(self) -> Dict[str, Any]:
        """Convert to MCP JSON configuration format."""
        return {
            "mcpServers": {
                "cloudflare": {
                    "command": self.command,
                    "args": self.args,
                    "env": self.env
                }
            }
        }

    def get_required_permissions(self) -> List[str]:
        """Get all required API token permissions."""
        permissions = []
        for service in self.enabled_services:
            permissions.extend(service.required_permissions)
        return list(set(permissions))


@dataclass
class MCPTool:
    """MCP tool definition."""
    name: str
    service: MCPService
    tool_type: MCPToolType
    description: str
    input_schema: Dict[str, Any] = field(default_factory=dict)
    required_params: List[str] = field(default_factory=list)
    optional_params: List[str] = field(default_factory=list)

    @classmethod
    def list_workers(cls) -> "MCPTool":
        """Tool to list all Workers."""
        return cls(
            name="list_workers",
            service=MCPService.WORKERS,
            tool_type=MCPToolType.LIST,
            description="List all Cloudflare Workers in the account",
            input_schema={
                "type": "object",
                "properties": {}
            }
        )

    @classmethod
    def deploy_worker(cls) -> "MCPTool":
        """Tool to deploy a Worker."""
        return cls(
            name="deploy_worker",
            service=MCPService.WORKERS,
            tool_type=MCPToolType.DEPLOY,
            description="Deploy a Cloudflare Worker script",
            input_schema={
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Worker name"},
                    "script": {"type": "string", "description": "Worker script content"},
                    "compatibility_date": {"type": "string", "description": "Compatibility date (YYYY-MM-DD)"},
                    "bindings": {"type": "array", "description": "Worker bindings (KV, R2, D1, etc.)"},
                    "routes": {"type": "array", "items": {"type": "string"}, "description": "Route patterns"}
                },
                "required": ["name", "script"]
            },
            required_params=["name", "script"],
            optional_params=["compatibility_date", "bindings", "routes"]
        )

    @classmethod
    def kv_put(cls) -> "MCPTool":
        """Tool to put a KV value."""
        return cls(
            name="kv_put",
            service=MCPService.KV,
            tool_type=MCPToolType.CREATE,
            description="Put a value in Workers KV",
            input_schema={
                "type": "object",
                "properties": {
                    "namespace_id": {"type": "string", "description": "KV namespace ID"},
                    "key": {"type": "string", "description": "Key name"},
                    "value": {"type": "string", "description": "Value to store"},
                    "expiration_ttl": {"type": "integer", "description": "TTL in seconds"},
                    "metadata": {"type": "object", "description": "Key metadata"}
                },
                "required": ["namespace_id", "key", "value"]
            },
            required_params=["namespace_id", "key", "value"],
            optional_params=["expiration_ttl", "metadata"]
        )

    @classmethod
    def d1_query(cls) -> "MCPTool":
        """Tool to execute D1 SQL query."""
        return cls(
            name="d1_query",
            service=MCPService.D1,
            tool_type=MCPToolType.QUERY,
            description="Execute SQL query on D1 database",
            input_schema={
                "type": "object",
                "properties": {
                    "database_id": {"type": "string", "description": "D1 database ID"},
                    "sql": {"type": "string", "description": "SQL query"},
                    "params": {"type": "array", "description": "Query parameters"}
                },
                "required": ["database_id", "sql"]
            },
            required_params=["database_id", "sql"],
            optional_params=["params"]
        )

    @classmethod
    def create_dns_record(cls) -> "MCPTool":
        """Tool to create DNS record."""
        return cls(
            name="create_dns_record",
            service=MCPService.DNS,
            tool_type=MCPToolType.CREATE,
            description="Create a DNS record in a zone",
            input_schema={
                "type": "object",
                "properties": {
                    "zone_id": {"type": "string", "description": "DNS zone ID"},
                    "type": {"type": "string", "description": "Record type (A, AAAA, CNAME, etc.)"},
                    "name": {"type": "string", "description": "Record name (subdomain or @)"},
                    "content": {"type": "string", "description": "Record content/value"},
                    "ttl": {"type": "integer", "description": "TTL in seconds (1 = auto)"},
                    "proxied": {"type": "boolean", "description": "Whether to proxy through Cloudflare"},
                    "priority": {"type": "integer", "description": "Priority (for MX/SRV records)"}
                },
                "required": ["zone_id", "type", "name", "content"]
            },
            required_params=["zone_id", "type", "name", "content"],
            optional_params=["ttl", "proxied", "priority"]
        )

    def to_schema(self) -> Dict[str, Any]:
        """Convert to MCP tool schema format."""
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": self.input_schema
        }


@dataclass
class WorkerBinding:
    """Worker binding configuration."""
    name: str
    binding_type: str  # kv_namespace, r2_bucket, d1_database, service, secret, etc.
    value: str  # namespace_id, bucket_name, database_id, service_name, etc.

    @classmethod
    def kv(cls, name: str, namespace_id: str) -> "WorkerBinding":
        """Create KV namespace binding."""
        return cls(name=name, binding_type="kv_namespace", value=namespace_id)

    @classmethod
    def r2(cls, name: str, bucket_name: str) -> "WorkerBinding":
        """Create R2 bucket binding."""
        return cls(name=name, binding_type="r2_bucket", value=bucket_name)

    @classmethod
    def d1(cls, name: str, database_id: str) -> "WorkerBinding":
        """Create D1 database binding."""
        return cls(name=name, binding_type="d1_database", value=database_id)

    @classmethod
    def service(cls, name: str, service_name: str) -> "WorkerBinding":
        """Create service binding."""
        return cls(name=name, binding_type="service", value=service_name)

    @classmethod
    def secret(cls, name: str) -> "WorkerBinding":
        """Create secret binding (value set via wrangler)."""
        return cls(name=name, binding_type="secret_text", value="")

    @classmethod
    def durable_object(cls, name: str, class_name: str, script_name: Optional[str] = None) -> "WorkerBinding":
        """Create Durable Object binding."""
        value = f"{class_name}" if not script_name else f"{script_name}/{class_name}"
        return cls(name=name, binding_type="durable_object_namespace", value=value)

    @classmethod
    def queue(cls, name: str, queue_name: str) -> "WorkerBinding":
        """Create Queue binding."""
        return cls(name=name, binding_type="queue", value=queue_name)

    @classmethod
    def ai(cls, name: str = "AI") -> "WorkerBinding":
        """Create Workers AI binding."""
        return cls(name=name, binding_type="ai", value="")

    def to_dict(self) -> Dict[str, Any]:
        """Convert to binding configuration dict."""
        if self.binding_type == "kv_namespace":
            return {"type": "kv_namespace", "name": self.name, "namespace_id": self.value}
        elif self.binding_type == "r2_bucket":
            return {"type": "r2_bucket", "name": self.name, "bucket_name": self.value}
        elif self.binding_type == "d1_database":
            return {"type": "d1_database", "name": self.name, "database_id": self.value}
        elif self.binding_type == "service":
            return {"type": "service", "name": self.name, "service": self.value}
        elif self.binding_type == "secret_text":
            return {"type": "secret_text", "name": self.name}
        elif self.binding_type == "durable_object_namespace":
            parts = self.value.split("/")
            if len(parts) == 2:
                return {"type": "durable_object_namespace", "name": self.name,
                        "script_name": parts[0], "class_name": parts[1]}
            return {"type": "durable_object_namespace", "name": self.name, "class_name": self.value}
        elif self.binding_type == "queue":
            return {"type": "queue", "name": self.name, "queue_name": self.value}
        elif self.binding_type == "ai":
            return {"type": "ai", "name": self.name}
        return {"type": self.binding_type, "name": self.name, "value": self.value}


@dataclass
class DNSRecord:
    """DNS record configuration."""
    record_type: DNSRecordType
    name: str
    content: str
    ttl: int = 1  # 1 = auto
    proxied: bool = False
    priority: Optional[int] = None

    @classmethod
    def a_record(cls, name: str, ip: str, proxied: bool = True) -> "DNSRecord":
        """Create A record."""
        return cls(record_type=DNSRecordType.A, name=name, content=ip, proxied=proxied)

    @classmethod
    def cname_record(cls, name: str, target: str, proxied: bool = True) -> "DNSRecord":
        """Create CNAME record."""
        return cls(record_type=DNSRecordType.CNAME, name=name, content=target, proxied=proxied)

    @classmethod
    def mx_record(cls, name: str, mail_server: str, priority: int = 10) -> "DNSRecord":
        """Create MX record."""
        return cls(record_type=DNSRecordType.MX, name=name, content=mail_server, priority=priority)

    @classmethod
    def txt_record(cls, name: str, content: str) -> "DNSRecord":
        """Create TXT record."""
        return cls(record_type=DNSRecordType.TXT, name=name, content=content)

    @classmethod
    def verification_record(cls, name: str, verification_code: str) -> "DNSRecord":
        """Create verification TXT record."""
        return cls(record_type=DNSRecordType.TXT, name=name, content=verification_code)

    @classmethod
    def spf_record(cls, domain: str, includes: List[str], policy: str = "~all") -> "DNSRecord":
        """Create SPF TXT record."""
        include_parts = " ".join([f"include:{inc}" for inc in includes])
        content = f"v=spf1 {include_parts} {policy}"
        return cls(record_type=DNSRecordType.TXT, name=domain, content=content)

    @classmethod
    def dkim_record(cls, selector: str, domain: str, public_key: str) -> "DNSRecord":
        """Create DKIM TXT record."""
        name = f"{selector}._domainkey.{domain}"
        content = f"v=DKIM1; k=rsa; p={public_key}"
        return cls(record_type=DNSRecordType.TXT, name=name, content=content)

    @classmethod
    def dmarc_record(cls, domain: str, policy: str = "none", rua: Optional[str] = None) -> "DNSRecord":
        """Create DMARC TXT record."""
        content = f"v=DMARC1; p={policy}"
        if rua:
            content += f"; rua=mailto:{rua}"
        return cls(record_type=DNSRecordType.TXT, name=f"_dmarc.{domain}", content=content)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to API request dict."""
        record = {
            "type": self.record_type.value,
            "name": self.name,
            "content": self.content,
            "ttl": self.ttl
        }
        if self.record_type.supports_proxy:
            record["proxied"] = self.proxied
        if self.priority is not None and self.record_type.requires_priority:
            record["priority"] = self.priority
        return record


@dataclass
class PagesProject:
    """Pages project configuration."""
    name: str
    production_branch: str = "main"
    build_command: Optional[str] = None
    destination_dir: str = "dist"
    root_dir: str = ""
    env_vars: Dict[str, str] = field(default_factory=dict)

    @classmethod
    def nextjs(cls, name: str) -> "PagesProject":
        """Create Next.js Pages project config."""
        return cls(
            name=name,
            build_command="npm run build",
            destination_dir=".next",
            env_vars={"NODE_VERSION": "18"}
        )

    @classmethod
    def react(cls, name: str) -> "PagesProject":
        """Create React (CRA/Vite) Pages project config."""
        return cls(
            name=name,
            build_command="npm run build",
            destination_dir="dist"
        )

    @classmethod
    def astro(cls, name: str) -> "PagesProject":
        """Create Astro Pages project config."""
        return cls(
            name=name,
            build_command="npm run build",
            destination_dir="dist"
        )

    @classmethod
    def static(cls, name: str, directory: str = "public") -> "PagesProject":
        """Create static site Pages project config."""
        return cls(
            name=name,
            build_command=None,
            destination_dir=directory
        )


# ============================================================
# MCP SERVER GENERATOR
# ============================================================

class MCPConfigGenerator:
    """Generate MCP server configurations."""

    def __init__(self, config: MCPServerConfig):
        self.config = config

    def generate_claude_desktop_config(self) -> str:
        """Generate Claude Desktop MCP configuration."""
        config = {
            "mcpServers": {
                "cloudflare": {
                    "command": self.config.command,
                    "args": self.config.args,
                    "env": {}
                }
            }
        }

        # Add env vars as references to actual env
        for key in self.config.env:
            config["mcpServers"]["cloudflare"]["env"][key] = f"${{{key}}}"

        return json.dumps(config, indent=2)

    def generate_env_file(self) -> str:
        """Generate .env file for MCP configuration."""
        lines = [
            "# Cloudflare MCP Server Configuration",
            "# Generated by CLOUDFLARE.MCP.EXE",
            "",
            "# API Authentication (recommended: API Token)",
        ]

        for key, value in self.config.env.items():
            if "TOKEN" in key or "KEY" in key:
                lines.append(f'{key}="your-{key.lower().replace("_", "-")}"')
            else:
                lines.append(f'{key}="{value}"')

        return "\n".join(lines)

    def generate_setup_script(self) -> str:
        """Generate setup script for MCP server."""
        return f'''#!/bin/bash
# Cloudflare MCP Server Setup Script
# Generated by CLOUDFLARE.MCP.EXE

set -e

echo "Setting up Cloudflare MCP Server..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

# Check for npx
if ! command -v npx &> /dev/null; then
    echo "Error: npx is required but not installed."
    exit 1
fi

# Verify environment variables
REQUIRED_VARS=({" ".join(self.config.env.keys())})
for var in "${{REQUIRED_VARS[@]}}"; do
    if [ -z "${{!var}}" ]; then
        echo "Warning: $var is not set"
    fi
done

# Test MCP server
echo "Testing MCP server connection..."
{self.config.command} {" ".join(self.config.args)} --version 2>/dev/null || {{
    echo "Installing @cloudflare/mcp-server-cloudflare..."
    npm install -g @cloudflare/mcp-server-cloudflare
}}

echo ""
echo "Setup complete! Add this to your Claude Code configuration:"
echo ""
echo 'claude mcp add cloudflare -- npx @cloudflare/mcp-server-cloudflare'
echo ""
echo "Or add to ~/.claude/mcp.json:"
cat << 'EOF'
{self.generate_claude_desktop_config()}
EOF
'''

    def generate_permissions_guide(self) -> str:
        """Generate API token permissions guide."""
        permissions = self.config.get_required_permissions()

        lines = [
            "# Cloudflare API Token Permissions",
            "",
            "Create an API token at: https://dash.cloudflare.com/profile/api-tokens",
            "",
            "## Required Permissions",
            ""
        ]

        for perm in sorted(set(permissions)):
            lines.append(f"- {perm}")

        lines.extend([
            "",
            "## Recommended Token Configuration",
            "",
            "| Setting | Value |",
            "|---------|-------|",
            f"| Account | Your account ({self.config.account_id or 'All accounts'}) |",
        ])

        if self.config.zone_id:
            lines.append(f"| Zone | Specific zone ({self.config.zone_id}) |")

        lines.extend([
            "| TTL | No expiration (or set appropriate expiration) |",
            "| Client IP Filtering | Optional - restrict to your IPs |",
            "",
            "## Security Best Practices",
            "",
            "1. Use the minimum permissions required",
            "2. Restrict to specific zones when possible",
            "3. Enable IP filtering in production",
            "4. Rotate tokens periodically",
            "5. Never commit tokens to version control"
        ])

        return "\n".join(lines)


# ============================================================
# TOOL GENERATORS
# ============================================================

class WorkersToolGenerator:
    """Generate Workers MCP tool implementations."""

    def generate_list_workers(self) -> str:
        """Generate list_workers tool handler."""
        return '''// MCP Tool: list_workers
export async function listWorkers(env: Env): Promise<WorkerInfo[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts`,
    {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`API Error: ${data.errors[0]?.message || 'Unknown error'}`);
  }

  return data.result.map((worker: any) => ({
    id: worker.id,
    name: worker.id,
    created_on: worker.created_on,
    modified_on: worker.modified_on,
    etag: worker.etag
  }));
}'''

    def generate_deploy_worker(self) -> str:
        """Generate deploy_worker tool handler."""
        return '''// MCP Tool: deploy_worker
export async function deployWorker(
  env: Env,
  params: {
    name: string;
    script: string;
    compatibility_date?: string;
    bindings?: WorkerBinding[];
    routes?: string[];
  }
): Promise<DeployResult> {
  const { name, script, compatibility_date, bindings, routes } = params;

  // Build metadata
  const metadata: any = {
    main_module: 'worker.js',
    compatibility_date: compatibility_date || new Date().toISOString().split('T')[0]
  };

  if (bindings && bindings.length > 0) {
    metadata.bindings = bindings;
  }

  // Create form data for upload
  const formData = new FormData();
  formData.append('worker.js', new Blob([script], { type: 'application/javascript+module' }), 'worker.js');
  formData.append('metadata', JSON.stringify(metadata));

  // Deploy script
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${name}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      },
      body: formData
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Deploy Error: ${data.errors[0]?.message || 'Unknown error'}`);
  }

  // Configure routes if provided
  if (routes && routes.length > 0) {
    for (const pattern of routes) {
      await configureRoute(env, name, pattern);
    }
  }

  return {
    success: true,
    worker_name: name,
    etag: data.result.etag,
    deployed_at: new Date().toISOString()
  };
}'''

    def generate_worker_logs(self) -> str:
        """Generate worker logs streaming handler."""
        return '''// MCP Tool: get_worker_logs
export async function getWorkerLogs(
  env: Env,
  workerName: string,
  options?: { tail?: boolean; filters?: LogFilter[] }
): Promise<ReadableStream<LogMessage> | LogMessage[]> {
  if (options?.tail) {
    // Use websocket for real-time tail
    const ws = new WebSocket(
      `wss://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${workerName}/tails`,
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
        }
      }
    );

    return new ReadableStream({
      start(controller) {
        ws.onmessage = (event) => {
          const log = JSON.parse(event.data);
          controller.enqueue(log);
        };
        ws.onerror = (error) => controller.error(error);
        ws.onclose = () => controller.close();
      },
      cancel() {
        ws.close();
      }
    });
  }

  // Fetch recent logs from Analytics Engine
  const query = `
    SELECT
      timestamp,
      scriptName,
      outcome,
      cpuTime,
      wallTime
    FROM workers_logs
    WHERE scriptName = '${workerName}'
    ORDER BY timestamp DESC
    LIMIT 100
  `;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    }
  );

  const data = await response.json();
  return data.result || [];
}'''


class KVToolGenerator:
    """Generate KV MCP tool implementations."""

    def generate_list_namespaces(self) -> str:
        """Generate list_kv_namespaces tool handler."""
        return '''// MCP Tool: list_kv_namespaces
export async function listKVNamespaces(env: Env): Promise<KVNamespace[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces`,
    {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`API Error: ${data.errors[0]?.message}`);
  }

  return data.result.map((ns: any) => ({
    id: ns.id,
    title: ns.title,
    supports_url_encoding: ns.supports_url_encoding
  }));
}'''

    def generate_kv_operations(self) -> str:
        """Generate KV CRUD operations."""
        return '''// MCP Tools: KV Operations
export async function kvGet(
  env: Env,
  namespaceId: string,
  key: string,
  options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }
): Promise<any> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
    {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`KV Get Error: ${response.statusText}`);
  }

  const type = options?.type || 'text';
  switch (type) {
    case 'json': return response.json();
    case 'arrayBuffer': return response.arrayBuffer();
    case 'stream': return response.body;
    default: return response.text();
  }
}

export async function kvPut(
  env: Env,
  namespaceId: string,
  key: string,
  value: string | ArrayBuffer,
  options?: { expiration?: number; expirationTtl?: number; metadata?: Record<string, any> }
): Promise<boolean> {
  const url = new URL(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`
  );

  if (options?.expiration) url.searchParams.set('expiration', String(options.expiration));
  if (options?.expirationTtl) url.searchParams.set('expiration_ttl', String(options.expirationTtl));

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
  };

  if (options?.metadata) {
    headers['CF-KV-Metadata'] = JSON.stringify(options.metadata);
  }

  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers,
    body: value
  });

  const data = await response.json();
  return data.success;
}

export async function kvDelete(
  env: Env,
  namespaceId: string,
  key: string
): Promise<boolean> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();
  return data.success;
}

export async function kvList(
  env: Env,
  namespaceId: string,
  options?: { prefix?: string; limit?: number; cursor?: string }
): Promise<{ keys: KVKey[]; cursor?: string; list_complete: boolean }> {
  const url = new URL(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/keys`
  );

  if (options?.prefix) url.searchParams.set('prefix', options.prefix);
  if (options?.limit) url.searchParams.set('limit', String(options.limit));
  if (options?.cursor) url.searchParams.set('cursor', options.cursor);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
    }
  });

  const data = await response.json();
  return {
    keys: data.result,
    cursor: data.result_info?.cursor,
    list_complete: !data.result_info?.cursor
  };
}'''


class D1ToolGenerator:
    """Generate D1 MCP tool implementations."""

    def generate_d1_query(self) -> str:
        """Generate D1 query execution handler."""
        return '''// MCP Tool: d1_query
export async function d1Query(
  env: Env,
  databaseId: string,
  sql: string,
  params?: any[]
): Promise<D1Result> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql,
        params: params || []
      })
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`D1 Query Error: ${data.errors[0]?.message}`);
  }

  return {
    success: true,
    results: data.result[0]?.results || [],
    meta: {
      changes: data.result[0]?.meta?.changes,
      duration: data.result[0]?.meta?.duration,
      last_row_id: data.result[0]?.meta?.last_row_id,
      rows_read: data.result[0]?.meta?.rows_read,
      rows_written: data.result[0]?.meta?.rows_written
    }
  };
}

// MCP Tool: d1_batch
export async function d1Batch(
  env: Env,
  databaseId: string,
  statements: Array<{ sql: string; params?: any[] }>
): Promise<D1BatchResult> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(statements)
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`D1 Batch Error: ${data.errors[0]?.message}`);
  }

  return {
    success: true,
    results: data.result.map((r: any) => ({
      results: r.results || [],
      meta: r.meta
    }))
  };
}'''

    def generate_d1_management(self) -> str:
        """Generate D1 database management handlers."""
        return '''// MCP Tool: list_d1_databases
export async function listD1Databases(env: Env): Promise<D1Database[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database`,
    {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();
  return data.result || [];
}

// MCP Tool: create_d1_database
export async function createD1Database(
  env: Env,
  name: string
): Promise<D1Database> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Create DB Error: ${data.errors[0]?.message}`);
  }

  return data.result;
}

// MCP Tool: delete_d1_database
export async function deleteD1Database(
  env: Env,
  databaseId: string
): Promise<boolean> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${databaseId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();
  return data.success;
}'''


class R2ToolGenerator:
    """Generate R2 MCP tool implementations."""

    def generate_r2_operations(self) -> str:
        """Generate R2 CRUD operations."""
        return '''// MCP Tools: R2 Operations
export async function listR2Buckets(env: Env): Promise<R2Bucket[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets`,
    {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();
  return data.result?.buckets || [];
}

export async function createR2Bucket(
  env: Env,
  name: string,
  locationHint?: string
): Promise<R2Bucket> {
  const body: any = { name };
  if (locationHint) body.locationHint = locationHint;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Create Bucket Error: ${data.errors[0]?.message}`);
  }

  return data.result;
}

export async function r2Put(
  env: Env,
  bucketName: string,
  key: string,
  body: ReadableStream | ArrayBuffer | string,
  options?: {
    contentType?: string;
    customMetadata?: Record<string, string>;
    httpMetadata?: HttpMetadata;
  }
): Promise<R2Object> {
  // Use S3-compatible API for uploads
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
  };

  if (options?.contentType) {
    headers['Content-Type'] = options.contentType;
  }

  if (options?.customMetadata) {
    for (const [k, v] of Object.entries(options.customMetadata)) {
      headers[`x-amz-meta-${k}`] = v;
    }
  }

  const response = await fetch(
    `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`,
    {
      method: 'PUT',
      headers,
      body
    }
  );

  if (!response.ok) {
    throw new Error(`R2 Put Error: ${response.statusText}`);
  }

  return {
    key,
    size: typeof body === 'string' ? body.length : 0,
    etag: response.headers.get('ETag') || '',
    uploaded: new Date().toISOString()
  };
}

export async function r2Get(
  env: Env,
  bucketName: string,
  key: string
): Promise<R2ObjectBody | null> {
  const response = await fetch(
    `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`,
    {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`R2 Get Error: ${response.statusText}`);
  }

  return {
    body: response.body,
    contentType: response.headers.get('Content-Type') || 'application/octet-stream',
    size: parseInt(response.headers.get('Content-Length') || '0'),
    etag: response.headers.get('ETag') || ''
  };
}

export async function r2Delete(
  env: Env,
  bucketName: string,
  key: string
): Promise<boolean> {
  const response = await fetch(
    `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  return response.ok;
}

export async function r2List(
  env: Env,
  bucketName: string,
  options?: { prefix?: string; delimiter?: string; maxKeys?: number; cursor?: string }
): Promise<R2Objects> {
  const url = new URL(
    `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}`
  );

  url.searchParams.set('list-type', '2');
  if (options?.prefix) url.searchParams.set('prefix', options.prefix);
  if (options?.delimiter) url.searchParams.set('delimiter', options.delimiter);
  if (options?.maxKeys) url.searchParams.set('max-keys', String(options.maxKeys));
  if (options?.cursor) url.searchParams.set('continuation-token', options.cursor);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
    }
  });

  // Parse XML response (S3-compatible)
  const text = await response.text();
  // In production, use proper XML parser
  return parseListBucketResult(text);
}'''


class DNSToolGenerator:
    """Generate DNS MCP tool implementations."""

    def generate_dns_operations(self) -> str:
        """Generate DNS CRUD operations."""
        return '''// MCP Tools: DNS Operations
export async function listZones(
  env: Env,
  options?: { name?: string; status?: string }
): Promise<Zone[]> {
  const url = new URL(
    'https://api.cloudflare.com/client/v4/zones'
  );

  if (options?.name) url.searchParams.set('name', options.name);
  if (options?.status) url.searchParams.set('status', options.status);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
    }
  });

  const data = await response.json();
  return data.result || [];
}

export async function listDNSRecords(
  env: Env,
  zoneId: string,
  options?: { type?: string; name?: string; content?: string }
): Promise<DNSRecord[]> {
  const url = new URL(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`
  );

  if (options?.type) url.searchParams.set('type', options.type);
  if (options?.name) url.searchParams.set('name', options.name);
  if (options?.content) url.searchParams.set('content', options.content);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
    }
  });

  const data = await response.json();
  return data.result || [];
}

export async function createDNSRecord(
  env: Env,
  zoneId: string,
  record: {
    type: string;
    name: string;
    content: string;
    ttl?: number;
    proxied?: boolean;
    priority?: number;
  }
): Promise<DNSRecord> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl || 1,
        proxied: record.proxied ?? false,
        ...(record.priority !== undefined && { priority: record.priority })
      })
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`DNS Create Error: ${data.errors[0]?.message}`);
  }

  return data.result;
}

export async function updateDNSRecord(
  env: Env,
  zoneId: string,
  recordId: string,
  record: Partial<{
    type: string;
    name: string;
    content: string;
    ttl: number;
    proxied: boolean;
    priority: number;
  }>
): Promise<DNSRecord> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(record)
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`DNS Update Error: ${data.errors[0]?.message}`);
  }

  return data.result;
}

export async function deleteDNSRecord(
  env: Env,
  zoneId: string,
  recordId: string
): Promise<boolean> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();
  return data.success;
}'''


class PagesToolGenerator:
    """Generate Pages MCP tool implementations."""

    def generate_pages_operations(self) -> str:
        """Generate Pages management operations."""
        return '''// MCP Tools: Pages Operations
export async function listPagesProjects(env: Env): Promise<PagesProject[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects`,
    {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();
  return data.result || [];
}

export async function getPagesProject(
  env: Env,
  projectName: string
): Promise<PagesProject | null> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}`,
    {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  if (response.status === 404) return null;

  const data = await response.json();
  return data.result;
}

export async function createPagesDeployment(
  env: Env,
  projectName: string,
  options?: {
    branch?: string;
    commitHash?: string;
    commitMessage?: string;
  }
): Promise<PagesDeployment> {
  const formData = new FormData();

  if (options?.branch) formData.append('branch', options.branch);
  if (options?.commitHash) formData.append('commit_hash', options.commitHash);
  if (options?.commitMessage) formData.append('commit_message', options.commitMessage);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      },
      body: formData
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Deployment Error: ${data.errors[0]?.message}`);
  }

  return data.result;
}

export async function listPagesDeployments(
  env: Env,
  projectName: string,
  options?: { env?: 'production' | 'preview' }
): Promise<PagesDeployment[]> {
  const url = new URL(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments`
  );

  if (options?.env) url.searchParams.set('env', options.env);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
    }
  });

  const data = await response.json();
  return data.result || [];
}

export async function rollbackPagesDeployment(
  env: Env,
  projectName: string,
  deploymentId: string
): Promise<PagesDeployment> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments/${deploymentId}/rollback`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Rollback Error: ${data.errors[0]?.message}`);
  }

  return data.result;
}'''


# ============================================================
# MCP SERVER ENGINE
# ============================================================

class CloudflareMCPEngine:
    """Main MCP engine orchestrating all tool generators."""

    def __init__(self, config: MCPServerConfig):
        self.config = config
        self.workers_gen = WorkersToolGenerator()
        self.kv_gen = KVToolGenerator()
        self.d1_gen = D1ToolGenerator()
        self.r2_gen = R2ToolGenerator()
        self.dns_gen = DNSToolGenerator()
        self.pages_gen = PagesToolGenerator()
        self.config_gen = MCPConfigGenerator(config)

    def get_available_tools(self) -> List[MCPTool]:
        """Get all available MCP tools based on enabled services."""
        tools = []

        for service in self.config.enabled_services:
            if service == MCPService.WORKERS:
                tools.extend([
                    MCPTool.list_workers(),
                    MCPTool.deploy_worker()
                ])
            elif service == MCPService.KV:
                tools.append(MCPTool.kv_put())
            elif service == MCPService.D1:
                tools.append(MCPTool.d1_query())
            elif service == MCPService.DNS:
                tools.append(MCPTool.create_dns_record())

        return tools

    def generate_mcp_server_worker(self) -> str:
        """Generate complete MCP server as a Cloudflare Worker."""
        tools = self.get_available_tools()
        tool_schemas = [tool.to_schema() for tool in tools]

        return f'''// Cloudflare MCP Server Worker
// Generated by CLOUDFLARE.MCP.EXE

interface Env {{
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_ZONE_ID?: string;
}}

// Tool schemas
const TOOLS = {json.dumps(tool_schemas, indent=2)};

// MCP Protocol Handler
export default {{
  async fetch(request: Request, env: Env): Promise<Response> {{
    const url = new URL(request.url);

    // Handle MCP protocol messages
    if (request.method === 'POST') {{
      const body = await request.json();

      switch (body.method) {{
        case 'tools/list':
          return Response.json({{
            tools: TOOLS
          }});

        case 'tools/call':
          return handleToolCall(body.params, env);

        default:
          return Response.json({{
            error: {{ code: -32601, message: 'Method not found' }}
          }}, {{ status: 404 }});
      }}
    }}

    // Health check
    if (url.pathname === '/health') {{
      return Response.json({{ status: 'ok', tools: TOOLS.length }});
    }}

    return new Response('Cloudflare MCP Server', {{
      headers: {{ 'Content-Type': 'text/plain' }}
    }});
  }}
}};

async function handleToolCall(
  params: {{ name: string; arguments: Record<string, any> }},
  env: Env
): Promise<Response> {{
  const {{ name, arguments: args }} = params;

  try {{
    let result: any;

    switch (name) {{
      case 'list_workers':
        result = await listWorkers(env);
        break;
      case 'deploy_worker':
        result = await deployWorker(env, args);
        break;
      case 'kv_get':
        result = await kvGet(env, args.namespace_id, args.key, args);
        break;
      case 'kv_put':
        result = await kvPut(env, args.namespace_id, args.key, args.value, args);
        break;
      case 'd1_query':
        result = await d1Query(env, args.database_id, args.sql, args.params);
        break;
      case 'create_dns_record':
        result = await createDNSRecord(env, args.zone_id, args);
        break;
      default:
        return Response.json({{
          error: {{ code: -32602, message: `Unknown tool: ${{name}}` }}
        }}, {{ status: 400 }});
    }}

    return Response.json({{ content: [{{ type: 'text', text: JSON.stringify(result) }}] }});
  }} catch (error) {{
    return Response.json({{
      error: {{ code: -32000, message: error.message }}
    }}, {{ status: 500 }});
  }}
}}

// Tool implementations
{self.workers_gen.generate_list_workers()}

{self.workers_gen.generate_deploy_worker()}

{self.kv_gen.generate_kv_operations()}

{self.d1_gen.generate_d1_query()}

{self.dns_gen.generate_dns_operations()}
'''

    def generate_tool_documentation(self) -> str:
        """Generate documentation for all MCP tools."""
        lines = [
            "# Cloudflare MCP Server - Tool Reference",
            "",
            "## Available Tools",
            ""
        ]

        for service in MCPService:
            service_tools = [t for t in self.get_available_tools() if t.service == service]
            if service_tools:
                lines.append(f"### {service.display_name}")
                lines.append("")
                lines.append("| Tool | Description |")
                lines.append("|------|-------------|")
                for tool in service_tools:
                    lines.append(f"| `{tool.name}` | {tool.description} |")
                lines.append("")

        return "\n".join(lines)


# ============================================================
# MCP REPORTER
# ============================================================

class MCPReporter:
    """Generate ASCII reports for MCP configuration."""

    @staticmethod
    def services_dashboard(config: MCPServerConfig) -> str:
        """Generate services overview dashboard."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║              CLOUDFLARE MCP SERVER - SERVICES OVERVIEW               ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for service in MCPService:
            enabled = "✓" if service in config.enabled_services else "○"
            permissions = ", ".join(service.required_permissions[:2])
            if len(service.required_permissions) > 2:
                permissions += "..."

            lines.append(f"║  [{enabled}] {service.display_name:<25} │ {permissions:<35} ║")

        lines.extend([
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Account ID: {config.account_id or 'Not configured':<55} ║",
            f"║  Zone ID: {config.zone_id or 'Not configured':<58} ║",
            "╚══════════════════════════════════════════════════════════════════════╝"
        ])

        return "\n".join(lines)

    @staticmethod
    def tools_dashboard(tools: List[MCPTool]) -> str:
        """Generate tools overview dashboard."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║               CLOUDFLARE MCP SERVER - AVAILABLE TOOLS                ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Tool Name              │ Service     │ Type       │ Destructive     ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for tool in tools:
            destructive = "⚠ Yes" if tool.tool_type.is_destructive else "  No"
            lines.append(
                f"║  {tool.name:<22} │ {tool.service.value:<11} │ {tool.tool_type.value:<10} │ {destructive:<15} ║"
            )

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    @staticmethod
    def auth_dashboard(method: AuthMethod) -> str:
        """Generate authentication method dashboard."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║              CLOUDFLARE MCP - AUTHENTICATION SETUP                   ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Method: {method.name:<60} ║",
            f"║  Recommended: {'Yes' if method.is_recommended else 'No':<56} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Required Environment Variables:                                     ║"
        ]

        for var in method.env_vars:
            lines.append(f"║    • {var:<63} ║")

        lines.extend([
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Header Format: {method.header_format:<53} ║",
            "╚══════════════════════════════════════════════════════════════════════╝"
        ])

        return "\n".join(lines)

    @staticmethod
    def dns_records_dashboard(records: List[DNSRecord]) -> str:
        """Generate DNS records dashboard."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                     DNS RECORDS CONFIGURATION                        ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Type   │ Name                  │ Content             │ Proxied      ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for record in records:
            proxied = "✓" if record.proxied else "○"
            name = record.name[:20] + "..." if len(record.name) > 20 else record.name
            content = record.content[:18] + "..." if len(record.content) > 18 else record.content
            lines.append(
                f"║  {record.record_type.value:<6} │ {name:<21} │ {content:<19} │ {proxied:<12} ║"
            )

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        description="CLOUDFLARE.MCP.EXE - Cloudflare MCP Server Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate MCP configuration
  python cloudflare-mcp.py config --api-token TOKEN --account-id ACCOUNT

  # Generate full MCP server Worker
  python cloudflare-mcp.py server --services workers,kv,d1,r2,dns

  # Show available tools
  python cloudflare-mcp.py tools --service workers

  # Generate DNS records
  python cloudflare-mcp.py dns --type A --name api --content 192.0.2.1

  # Generate setup script
  python cloudflare-mcp.py setup --output setup.sh
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Config command
    config_parser = subparsers.add_parser("config", help="Generate MCP configuration")
    config_parser.add_argument("--api-token", help="Cloudflare API token")
    config_parser.add_argument("--account-id", help="Cloudflare account ID")
    config_parser.add_argument("--zone-id", help="Cloudflare zone ID (for DNS)")
    config_parser.add_argument("--services", help="Comma-separated services to enable")
    config_parser.add_argument("--format", choices=["json", "env", "script"], default="json")

    # Server command
    server_parser = subparsers.add_parser("server", help="Generate MCP server Worker")
    server_parser.add_argument("--services", default="workers,kv,d1,r2,dns")
    server_parser.add_argument("--output", "-o", help="Output file path")

    # Tools command
    tools_parser = subparsers.add_parser("tools", help="List available MCP tools")
    tools_parser.add_argument("--service", help="Filter by service")
    tools_parser.add_argument("--format", choices=["table", "json", "schema"], default="table")

    # DNS command
    dns_parser = subparsers.add_parser("dns", help="Generate DNS record configuration")
    dns_parser.add_argument("--type", choices=[t.value for t in DNSRecordType], required=True)
    dns_parser.add_argument("--name", required=True, help="Record name")
    dns_parser.add_argument("--content", required=True, help="Record content")
    dns_parser.add_argument("--proxied", action="store_true", help="Proxy through Cloudflare")
    dns_parser.add_argument("--ttl", type=int, default=1, help="TTL in seconds (1=auto)")

    # Setup command
    setup_parser = subparsers.add_parser("setup", help="Generate setup script")
    setup_parser.add_argument("--output", "-o", help="Output file path")

    # Bindings command
    bindings_parser = subparsers.add_parser("bindings", help="Generate Worker bindings")
    bindings_parser.add_argument("--kv", nargs=2, action="append", metavar=("NAME", "NAMESPACE_ID"))
    bindings_parser.add_argument("--r2", nargs=2, action="append", metavar=("NAME", "BUCKET"))
    bindings_parser.add_argument("--d1", nargs=2, action="append", metavar=("NAME", "DATABASE_ID"))
    bindings_parser.add_argument("--service", nargs=2, action="append", metavar=("NAME", "SERVICE"))
    bindings_parser.add_argument("--ai", action="store_true", help="Add AI binding")

    # Services command
    services_parser = subparsers.add_parser("services", help="List all MCP services")

    # Auth command
    auth_parser = subparsers.add_parser("auth", help="Show authentication methods")
    auth_parser.add_argument("--method", choices=[m.value for m in AuthMethod], default="api_token")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Show demonstration output")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_cli()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == "config":
        services = []
        if args.services:
            services = [MCPService(s) for s in args.services.split(",")]
        else:
            services = [MCPService.WORKERS, MCPService.KV, MCPService.R2]

        config = MCPServerConfig(
            env={
                "CLOUDFLARE_API_TOKEN": args.api_token or "${CLOUDFLARE_API_TOKEN}",
                "CLOUDFLARE_ACCOUNT_ID": args.account_id or "${CLOUDFLARE_ACCOUNT_ID}"
            },
            account_id=args.account_id,
            zone_id=args.zone_id,
            enabled_services=services
        )

        gen = MCPConfigGenerator(config)

        if args.format == "json":
            print(gen.generate_claude_desktop_config())
        elif args.format == "env":
            print(gen.generate_env_file())
        elif args.format == "script":
            print(gen.generate_setup_script())

    elif args.command == "server":
        services = [MCPService(s) for s in args.services.split(",")]
        config = MCPServerConfig(enabled_services=services)
        engine = CloudflareMCPEngine(config)

        code = engine.generate_mcp_server_worker()

        if args.output:
            with open(args.output, "w") as f:
                f.write(code)
            print(f"MCP server written to {args.output}")
        else:
            print(code)

    elif args.command == "tools":
        config = MCPServerConfig(enabled_services=list(MCPService))
        engine = CloudflareMCPEngine(config)
        tools = engine.get_available_tools()

        if args.service:
            service = MCPService(args.service)
            tools = [t for t in tools if t.service == service]

        if args.format == "table":
            print(MCPReporter.tools_dashboard(tools))
        elif args.format == "json":
            print(json.dumps([t.to_schema() for t in tools], indent=2))
        elif args.format == "schema":
            for tool in tools:
                print(f"\n{tool.name}:")
                print(json.dumps(tool.input_schema, indent=2))

    elif args.command == "dns":
        record_type = DNSRecordType(args.type)
        record = DNSRecord(
            record_type=record_type,
            name=args.name,
            content=args.content,
            ttl=args.ttl,
            proxied=args.proxied
        )
        print(json.dumps(record.to_dict(), indent=2))

    elif args.command == "setup":
        config = MCPServerConfig.full_access("TOKEN", "ACCOUNT_ID")
        gen = MCPConfigGenerator(config)
        script = gen.generate_setup_script()

        if args.output:
            with open(args.output, "w") as f:
                f.write(script)
            print(f"Setup script written to {args.output}")
        else:
            print(script)

    elif args.command == "bindings":
        bindings = []

        if args.kv:
            for name, ns_id in args.kv:
                bindings.append(WorkerBinding.kv(name, ns_id))
        if args.r2:
            for name, bucket in args.r2:
                bindings.append(WorkerBinding.r2(name, bucket))
        if args.d1:
            for name, db_id in args.d1:
                bindings.append(WorkerBinding.d1(name, db_id))
        if args.service:
            for name, svc in args.service:
                bindings.append(WorkerBinding.service(name, svc))
        if args.ai:
            bindings.append(WorkerBinding.ai())

        print(json.dumps([b.to_dict() for b in bindings], indent=2))

    elif args.command == "services":
        config = MCPServerConfig(enabled_services=list(MCPService))
        print(MCPReporter.services_dashboard(config))

    elif args.command == "auth":
        method = AuthMethod(args.method)
        print(MCPReporter.auth_dashboard(method))

    elif args.command == "demo":
        print("=" * 70)
        print("CLOUDFLARE.MCP.EXE - DEMONSTRATION")
        print("=" * 70)

        # Services dashboard
        config = MCPServerConfig.full_access("demo-token", "demo-account", "demo-zone")
        print("\n" + MCPReporter.services_dashboard(config))

        # Tools dashboard
        engine = CloudflareMCPEngine(config)
        tools = engine.get_available_tools()
        print("\n" + MCPReporter.tools_dashboard(tools))

        # Auth dashboard
        print("\n" + MCPReporter.auth_dashboard(AuthMethod.API_TOKEN))

        # Sample DNS records
        records = [
            DNSRecord.a_record("api", "192.0.2.1", proxied=True),
            DNSRecord.cname_record("www", "example.com", proxied=True),
            DNSRecord.mx_record("@", "mail.example.com", priority=10),
            DNSRecord.txt_record("@", "v=spf1 include:_spf.google.com ~all")
        ]
        print("\n" + MCPReporter.dns_records_dashboard(records))

        # Sample configuration
        print("\n" + "─" * 70)
        print("SAMPLE MCP CONFIGURATION (Claude Desktop)")
        print("─" * 70)
        gen = MCPConfigGenerator(config)
        print(gen.generate_claude_desktop_config())


if __name__ == "__main__":
    main()
```

---

## SETUP

### Claude Code Quick Setup

```bash
# Add Cloudflare MCP server to Claude Code
claude mcp add cloudflare -- npx @cloudflare/mcp-server-cloudflare

# This will prompt for API token authentication
```

### Environment Variables

```bash
# Cloudflare API token (recommended)
export CLOUDFLARE_API_TOKEN="your-api-token"

# Account ID (for account-level resources)
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Zone ID (for DNS operations)
export CLOUDFLARE_ZONE_ID="your-zone-id"
```

### Manual Configuration

```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "npx",
      "args": ["@cloudflare/mcp-server-cloudflare"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}",
        "CLOUDFLARE_ACCOUNT_ID": "${CLOUDFLARE_ACCOUNT_ID}"
      }
    }
  }
}
```

---

## AVAILABLE TOOLS

### Workers

| Tool | Description |
|------|-------------|
| `list_workers` | List all Workers |
| `get_worker` | Get Worker script |
| `deploy_worker` | Deploy Worker |
| `delete_worker` | Delete Worker |
| `get_worker_logs` | Get Worker logs |

### KV Storage

| Tool | Description |
|------|-------------|
| `list_kv_namespaces` | List KV namespaces |
| `create_kv_namespace` | Create namespace |
| `kv_get` | Get value |
| `kv_put` | Put value |
| `kv_delete` | Delete key |
| `kv_list` | List keys |

### R2 Storage

| Tool | Description |
|------|-------------|
| `list_r2_buckets` | List buckets |
| `create_r2_bucket` | Create bucket |
| `r2_get` | Get object |
| `r2_put` | Put object |
| `r2_delete` | Delete object |
| `r2_list` | List objects |

### D1 Database

| Tool | Description |
|------|-------------|
| `list_d1_databases` | List databases |
| `create_d1_database` | Create database |
| `d1_query` | Execute SQL |
| `d1_batch` | Batch queries |

### DNS

| Tool | Description |
|------|-------------|
| `list_zones` | List DNS zones |
| `list_dns_records` | List DNS records |
| `create_dns_record` | Create record |
| `update_dns_record` | Update record |
| `delete_dns_record` | Delete record |

### Pages

| Tool | Description |
|------|-------------|
| `list_pages_projects` | List Pages projects |
| `get_pages_project` | Get project details |
| `create_pages_deployment` | Deploy to Pages |

---

## QUICK COMMANDS

```
/cloudflare-mcp setup        → Configure MCP server
/cloudflare-mcp workers      → Workers management
/cloudflare-mcp kv           → KV operations
/cloudflare-mcp r2           → R2 storage
/cloudflare-mcp d1           → D1 database
/cloudflare-mcp dns          → DNS management
```

$ARGUMENTS
