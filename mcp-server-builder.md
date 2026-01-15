# MCP.SERVER.BUILDER.EXE - Model Context Protocol Server Generator

You are **MCP.SERVER.BUILDER.EXE** - the AI specialist for designing and generating production-ready MCP (Model Context Protocol) servers that connect AI assistants to tools, data, and external systems.

---

## CORE MODULES

### ProtocolEngine.MOD
- MCP specification compliance
- JSON-RPC 2.0 implementation
- Transport layer handling
- Message validation

### ToolDesigner.MOD
- Tool schema generation
- Input validation patterns
- Handler implementations
- Error response formatting

### ResourceManager.MOD
- Resource URI design
- Content providers
- Template systems
- Dynamic resources

### IntegrationPatterns.MOD
- Database connectors
- API integrations
- File system access
- Authentication flows

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
MCP.SERVER.BUILDER.EXE - Model Context Protocol Server Generator
Production-ready MCP server scaffolding and implementation generator.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Callable, Union
from enum import Enum
from pathlib import Path
import json


# ============================================================
# ENUMS - Server & Protocol Types
# ============================================================

class Transport(Enum):
    """MCP transport mechanisms."""
    STDIO = "stdio"
    HTTP_SSE = "http_sse"
    WEBSOCKET = "websocket"

    @property
    def description(self) -> str:
        """Transport description."""
        descriptions = {
            "stdio": "Standard input/output (CLI tools, local processes)",
            "http_sse": "HTTP with Server-Sent Events (web services)",
            "websocket": "WebSocket (real-time bidirectional)"
        }
        return descriptions.get(self.value, "")

    @property
    def default_port(self) -> Optional[int]:
        """Default port for network transports."""
        ports = {
            "stdio": None,
            "http_sse": 3000,
            "websocket": 3001
        }
        return ports.get(self.value)

    @property
    def python_dependencies(self) -> List[str]:
        """Required Python packages for this transport."""
        deps = {
            "stdio": ["mcp"],
            "http_sse": ["mcp", "starlette", "uvicorn", "sse-starlette"],
            "websocket": ["mcp", "websockets", "uvicorn"]
        }
        return deps.get(self.value, ["mcp"])


class ToolCategory(Enum):
    """Categories of MCP tools."""
    DATABASE = "database"
    API = "api"
    FILE_SYSTEM = "file_system"
    SEARCH = "search"
    AUTOMATION = "automation"
    ANALYTICS = "analytics"
    COMMUNICATION = "communication"
    SECURITY = "security"
    AI_ML = "ai_ml"
    CUSTOM = "custom"

    @property
    def icon(self) -> str:
        """Category icon."""
        icons = {
            "database": "🗄️",
            "api": "🔌",
            "file_system": "📁",
            "search": "🔍",
            "automation": "⚙️",
            "analytics": "📊",
            "communication": "💬",
            "security": "🔐",
            "ai_ml": "🤖",
            "custom": "🛠️"
        }
        return icons.get(self.value, "🔧")

    @property
    def common_tools(self) -> List[str]:
        """Common tools in this category."""
        tools = {
            "database": ["query", "insert", "update", "delete", "schema"],
            "api": ["request", "authenticate", "webhook"],
            "file_system": ["read", "write", "list", "search", "watch"],
            "search": ["query", "index", "semantic_search"],
            "automation": ["execute", "schedule", "workflow"],
            "analytics": ["aggregate", "report", "visualize"],
            "communication": ["send", "receive", "notify"],
            "security": ["encrypt", "decrypt", "validate", "audit"],
            "ai_ml": ["embed", "classify", "generate", "analyze"],
            "custom": []
        }
        return tools.get(self.value, [])


class InputType(Enum):
    """JSON Schema input types for tool parameters."""
    STRING = "string"
    NUMBER = "number"
    INTEGER = "integer"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"

    @property
    def python_type(self) -> str:
        """Corresponding Python type hint."""
        types = {
            "string": "str",
            "number": "float",
            "integer": "int",
            "boolean": "bool",
            "array": "List[Any]",
            "object": "Dict[str, Any]"
        }
        return types.get(self.value, "Any")


class ResourceType(Enum):
    """Types of MCP resources."""
    TEXT = "text"
    BLOB = "blob"
    JSON = "json"
    TEMPLATE = "template"

    @property
    def mime_type(self) -> str:
        """Default MIME type."""
        types = {
            "text": "text/plain",
            "blob": "application/octet-stream",
            "json": "application/json",
            "template": "text/x-template"
        }
        return types.get(self.value, "application/octet-stream")


class AuthMethod(Enum):
    """Authentication methods for MCP servers."""
    NONE = "none"
    API_KEY = "api_key"
    BEARER_TOKEN = "bearer_token"
    OAUTH2 = "oauth2"
    BASIC = "basic"
    CUSTOM = "custom"

    @property
    def header_name(self) -> Optional[str]:
        """HTTP header name for this auth method."""
        headers = {
            "none": None,
            "api_key": "X-API-Key",
            "bearer_token": "Authorization",
            "oauth2": "Authorization",
            "basic": "Authorization",
            "custom": None
        }
        return headers.get(self.value)


# ============================================================
# DATACLASSES - Server Components
# ============================================================

@dataclass
class ToolParameter:
    """A parameter for an MCP tool."""
    name: str
    type: InputType
    description: str
    required: bool = True
    default: Optional[Any] = None
    enum: Optional[List[Any]] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    pattern: Optional[str] = None

    def to_json_schema(self) -> Dict[str, Any]:
        """Convert to JSON Schema."""
        schema = {
            "type": self.type.value,
            "description": self.description
        }

        if self.enum:
            schema["enum"] = self.enum
        if self.min_value is not None:
            schema["minimum"] = self.min_value
        if self.max_value is not None:
            schema["maximum"] = self.max_value
        if self.pattern:
            schema["pattern"] = self.pattern
        if self.default is not None:
            schema["default"] = self.default

        return schema


@dataclass
class ToolDefinition:
    """Definition of an MCP tool."""
    name: str
    description: str
    category: ToolCategory
    parameters: List[ToolParameter] = field(default_factory=list)
    returns_description: str = "Result of the operation"
    is_destructive: bool = False
    requires_confirmation: bool = False
    timeout_seconds: int = 30

    def to_mcp_schema(self) -> Dict[str, Any]:
        """Convert to MCP tool schema."""
        properties = {}
        required = []

        for param in self.parameters:
            properties[param.name] = param.to_json_schema()
            if param.required:
                required.append(param.name)

        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": {
                "type": "object",
                "properties": properties,
                "required": required
            }
        }

    def generate_handler_stub(self) -> str:
        """Generate Python handler stub."""
        params = ", ".join([
            f"{p.name}: {p.type.python_type}" +
            ("" if p.required else f" = {repr(p.default)}")
            for p in self.parameters
        ])

        return f'''
async def handle_{self.name}({params}) -> Dict[str, Any]:
    """
    {self.description}

    Returns:
        {self.returns_description}
    """
    # TODO: Implement tool logic
    raise NotImplementedError("Tool handler not implemented")
'''

    @classmethod
    def database_query(cls) -> "ToolDefinition":
        """Pre-built database query tool."""
        return cls(
            name="query_database",
            description="Execute a read-only SQL query against the database",
            category=ToolCategory.DATABASE,
            parameters=[
                ToolParameter("query", InputType.STRING, "SQL query to execute"),
                ToolParameter("params", InputType.ARRAY, "Query parameters", required=False, default=[]),
                ToolParameter("limit", InputType.INTEGER, "Maximum rows to return", required=False, default=100)
            ],
            is_destructive=False
        )

    @classmethod
    def file_read(cls) -> "ToolDefinition":
        """Pre-built file read tool."""
        return cls(
            name="read_file",
            description="Read the contents of a file",
            category=ToolCategory.FILE_SYSTEM,
            parameters=[
                ToolParameter("path", InputType.STRING, "Path to the file"),
                ToolParameter("encoding", InputType.STRING, "File encoding", required=False, default="utf-8")
            ],
            is_destructive=False
        )

    @classmethod
    def api_request(cls) -> "ToolDefinition":
        """Pre-built API request tool."""
        return cls(
            name="api_request",
            description="Make an HTTP request to an external API",
            category=ToolCategory.API,
            parameters=[
                ToolParameter("method", InputType.STRING, "HTTP method", enum=["GET", "POST", "PUT", "DELETE"]),
                ToolParameter("url", InputType.STRING, "Request URL"),
                ToolParameter("headers", InputType.OBJECT, "Request headers", required=False, default={}),
                ToolParameter("body", InputType.OBJECT, "Request body", required=False)
            ],
            timeout_seconds=60
        )

    @classmethod
    def search(cls) -> "ToolDefinition":
        """Pre-built search tool."""
        return cls(
            name="search",
            description="Search for content matching a query",
            category=ToolCategory.SEARCH,
            parameters=[
                ToolParameter("query", InputType.STRING, "Search query"),
                ToolParameter("filters", InputType.OBJECT, "Search filters", required=False, default={}),
                ToolParameter("limit", InputType.INTEGER, "Maximum results", required=False, default=10)
            ]
        )


@dataclass
class ResourceDefinition:
    """Definition of an MCP resource."""
    uri: str
    name: str
    description: str
    type: ResourceType
    mime_type: Optional[str] = None
    is_template: bool = False
    template_params: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.mime_type:
            self.mime_type = self.type.mime_type

    def to_mcp_resource(self) -> Dict[str, Any]:
        """Convert to MCP resource definition."""
        resource = {
            "uri": self.uri,
            "name": self.name,
            "description": self.description,
            "mimeType": self.mime_type
        }
        return resource

    @classmethod
    def config_file(cls, name: str) -> "ResourceDefinition":
        """Pre-built config file resource."""
        return cls(
            uri=f"config://{name}",
            name=f"{name} Configuration",
            description=f"Configuration settings for {name}",
            type=ResourceType.JSON
        )

    @classmethod
    def documentation(cls, topic: str) -> "ResourceDefinition":
        """Pre-built documentation resource."""
        return cls(
            uri=f"docs://{topic}",
            name=f"{topic} Documentation",
            description=f"Documentation for {topic}",
            type=ResourceType.TEXT,
            mime_type="text/markdown"
        )


@dataclass
class PromptDefinition:
    """Definition of an MCP prompt template."""
    name: str
    description: str
    template: str
    arguments: List[ToolParameter] = field(default_factory=list)

    def to_mcp_prompt(self) -> Dict[str, Any]:
        """Convert to MCP prompt definition."""
        return {
            "name": self.name,
            "description": self.description,
            "arguments": [
                {
                    "name": arg.name,
                    "description": arg.description,
                    "required": arg.required
                }
                for arg in self.arguments
            ]
        }

    @classmethod
    def summarize(cls) -> "PromptDefinition":
        """Pre-built summarization prompt."""
        return cls(
            name="summarize",
            description="Summarize content with customizable length",
            template="""Please summarize the following content in {length} format:

{content}

Focus on: {focus_areas}""",
            arguments=[
                ToolParameter("content", InputType.STRING, "Content to summarize"),
                ToolParameter("length", InputType.STRING, "Summary length", enum=["brief", "detailed", "bullet-points"]),
                ToolParameter("focus_areas", InputType.STRING, "Key areas to focus on", required=False, default="main points")
            ]
        )


@dataclass
class ServerConfig:
    """Configuration for an MCP server."""
    name: str
    version: str = "1.0.0"
    description: str = ""
    transport: Transport = Transport.STDIO
    port: Optional[int] = None
    auth_method: AuthMethod = AuthMethod.NONE
    tools: List[ToolDefinition] = field(default_factory=list)
    resources: List[ResourceDefinition] = field(default_factory=list)
    prompts: List[PromptDefinition] = field(default_factory=list)

    def __post_init__(self):
        if self.port is None:
            self.port = self.transport.default_port

    @classmethod
    def minimal(cls, name: str) -> "ServerConfig":
        """Minimal MCP server configuration."""
        return cls(
            name=name,
            description=f"Minimal MCP server: {name}",
            transport=Transport.STDIO
        )

    @classmethod
    def database_server(cls, name: str, db_type: str = "postgresql") -> "ServerConfig":
        """Database MCP server configuration."""
        return cls(
            name=name,
            description=f"MCP server for {db_type} database access",
            transport=Transport.STDIO,
            tools=[
                ToolDefinition.database_query(),
                ToolDefinition(
                    name="list_tables",
                    description="List all tables in the database",
                    category=ToolCategory.DATABASE,
                    parameters=[]
                ),
                ToolDefinition(
                    name="describe_table",
                    description="Get schema information for a table",
                    category=ToolCategory.DATABASE,
                    parameters=[
                        ToolParameter("table_name", InputType.STRING, "Name of the table")
                    ]
                )
            ],
            resources=[
                ResourceDefinition.config_file("database"),
                ResourceDefinition(
                    uri="schema://tables",
                    name="Database Schema",
                    description="Complete database schema",
                    type=ResourceType.JSON
                )
            ]
        )

    @classmethod
    def api_gateway(cls, name: str) -> "ServerConfig":
        """API gateway MCP server configuration."""
        return cls(
            name=name,
            description="MCP server for external API integration",
            transport=Transport.HTTP_SSE,
            auth_method=AuthMethod.BEARER_TOKEN,
            tools=[
                ToolDefinition.api_request(),
                ToolDefinition(
                    name="list_endpoints",
                    description="List available API endpoints",
                    category=ToolCategory.API,
                    parameters=[]
                )
            ],
            resources=[
                ResourceDefinition.config_file("api"),
                ResourceDefinition.documentation("api-usage")
            ]
        )

    @classmethod
    def file_manager(cls, name: str) -> "ServerConfig":
        """File manager MCP server configuration."""
        return cls(
            name=name,
            description="MCP server for file system operations",
            transport=Transport.STDIO,
            tools=[
                ToolDefinition.file_read(),
                ToolDefinition(
                    name="write_file",
                    description="Write content to a file",
                    category=ToolCategory.FILE_SYSTEM,
                    parameters=[
                        ToolParameter("path", InputType.STRING, "Path to the file"),
                        ToolParameter("content", InputType.STRING, "Content to write"),
                        ToolParameter("mode", InputType.STRING, "Write mode", enum=["overwrite", "append"], default="overwrite")
                    ],
                    is_destructive=True,
                    requires_confirmation=True
                ),
                ToolDefinition(
                    name="list_directory",
                    description="List files in a directory",
                    category=ToolCategory.FILE_SYSTEM,
                    parameters=[
                        ToolParameter("path", InputType.STRING, "Directory path"),
                        ToolParameter("pattern", InputType.STRING, "Glob pattern", required=False, default="*")
                    ]
                ),
                ToolDefinition.search()
            ]
        )


# ============================================================
# CODE GENERATORS
# ============================================================

class ServerCodeGenerator:
    """Generate MCP server code."""

    def __init__(self, config: ServerConfig):
        self.config = config

    def generate_main(self) -> str:
        """Generate main server file."""
        if self.config.transport == Transport.STDIO:
            return self._generate_stdio_server()
        elif self.config.transport == Transport.HTTP_SSE:
            return self._generate_http_server()
        else:
            return self._generate_websocket_server()

    def _generate_stdio_server(self) -> str:
        """Generate stdio transport server."""
        return f'''#!/usr/bin/env python3
"""
{self.config.name} - MCP Server
{self.config.description}

Generated by MCP.SERVER.BUILDER.EXE
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    TextContent,
    Resource,
    Prompt,
    PromptMessage,
    GetPromptResult,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("{self.config.name}")

# Initialize server
server = Server("{self.config.name}")


# ============================================================
# TOOL HANDLERS
# ============================================================

{self._generate_tool_handlers()}


# ============================================================
# TOOL LISTING
# ============================================================

@server.list_tools()
async def list_tools() -> List[Tool]:
    """List all available tools."""
    return [
{self._generate_tool_list()}
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls."""
    try:
{self._generate_tool_dispatcher()}
        else:
            raise ValueError(f"Unknown tool: {{name}}")
    except Exception as e:
        logger.error(f"Tool error: {{e}}")
        return [TextContent(type="text", text=f"Error: {{str(e)}}")]


# ============================================================
# RESOURCES
# ============================================================

{self._generate_resource_handlers()}


@server.list_resources()
async def list_resources() -> List[Resource]:
    """List all available resources."""
    return [
{self._generate_resource_list()}
    ]


# ============================================================
# PROMPTS
# ============================================================

{self._generate_prompt_handlers()}


# ============================================================
# MAIN
# ============================================================

async def main():
    """Run the MCP server."""
    logger.info("Starting {self.config.name} MCP server...")

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
'''

    def _generate_http_server(self) -> str:
        """Generate HTTP/SSE transport server."""
        return f'''#!/usr/bin/env python3
"""
{self.config.name} - MCP Server (HTTP/SSE)
{self.config.description}

Generated by MCP.SERVER.BUILDER.EXE
"""

import asyncio
import logging
from typing import Any, Dict, List

from mcp.server import Server
from mcp.types import Tool, TextContent, Resource
from starlette.applications import Starlette
from starlette.routing import Route
from starlette.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("{self.config.name}")

# Initialize MCP server
server = Server("{self.config.name}")


# ============================================================
# TOOL HANDLERS
# ============================================================

{self._generate_tool_handlers()}


# ============================================================
# MCP ENDPOINTS
# ============================================================

@server.list_tools()
async def list_tools() -> List[Tool]:
    """List all available tools."""
    return [
{self._generate_tool_list()}
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls."""
    try:
{self._generate_tool_dispatcher()}
        else:
            raise ValueError(f"Unknown tool: {{name}}")
    except Exception as e:
        logger.error(f"Tool error: {{e}}")
        return [TextContent(type="text", text=f"Error: {{str(e)}}")]


# ============================================================
# HTTP ROUTES
# ============================================================

async def sse_endpoint(request):
    """Server-Sent Events endpoint for MCP."""
    async def event_generator():
        # Handle MCP messages via SSE
        while True:
            # Yield events as they occur
            await asyncio.sleep(0.1)
            yield {{"event": "ping", "data": ""}}

    return EventSourceResponse(event_generator())


async def tools_endpoint(request):
    """List tools endpoint."""
    tools = await list_tools()
    return JSONResponse([t.model_dump() for t in tools])


async def call_endpoint(request):
    """Call tool endpoint."""
    body = await request.json()
    name = body.get("name")
    arguments = body.get("arguments", {{}})

    result = await call_tool(name, arguments)
    return JSONResponse([c.model_dump() for c in result])


# Create Starlette app
app = Starlette(
    routes=[
        Route("/sse", sse_endpoint),
        Route("/tools", tools_endpoint),
        Route("/call", call_endpoint, methods=["POST"]),
    ]
)


if __name__ == "__main__":
    logger.info("Starting {self.config.name} HTTP server on port {self.config.port}...")
    uvicorn.run(app, host="0.0.0.0", port={self.config.port})
'''

    def _generate_websocket_server(self) -> str:
        """Generate WebSocket transport server."""
        return f'''#!/usr/bin/env python3
"""
{self.config.name} - MCP Server (WebSocket)
{self.config.description}

Generated by MCP.SERVER.BUILDER.EXE
"""

import asyncio
import json
import logging
from typing import Any, Dict, List

import websockets
from mcp.server import Server
from mcp.types import Tool, TextContent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("{self.config.name}")

# Initialize MCP server
server = Server("{self.config.name}")


# ============================================================
# TOOL HANDLERS
# ============================================================

{self._generate_tool_handlers()}


# ============================================================
# WEBSOCKET HANDLER
# ============================================================

async def handle_connection(websocket, path):
    """Handle WebSocket connections."""
    logger.info(f"Client connected: {{path}}")

    try:
        async for message in websocket:
            data = json.loads(message)
            method = data.get("method")
            params = data.get("params", {{}})
            msg_id = data.get("id")

            try:
                if method == "tools/list":
                    tools = await list_tools()
                    result = [t.model_dump() for t in tools]
                elif method == "tools/call":
                    name = params.get("name")
                    arguments = params.get("arguments", {{}})
                    content = await call_tool(name, arguments)
                    result = [c.model_dump() for c in content]
                else:
                    result = {{"error": f"Unknown method: {{method}}"}}

                response = {{"jsonrpc": "2.0", "id": msg_id, "result": result}}
            except Exception as e:
                response = {{"jsonrpc": "2.0", "id": msg_id, "error": {{"message": str(e)}}}}

            await websocket.send(json.dumps(response))
    except websockets.exceptions.ConnectionClosed:
        logger.info("Client disconnected")


@server.list_tools()
async def list_tools() -> List[Tool]:
    """List all available tools."""
    return [
{self._generate_tool_list()}
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls."""
    try:
{self._generate_tool_dispatcher()}
        else:
            raise ValueError(f"Unknown tool: {{name}}")
    except Exception as e:
        logger.error(f"Tool error: {{e}}")
        return [TextContent(type="text", text=f"Error: {{str(e)}}")]


async def main():
    """Run the WebSocket server."""
    logger.info("Starting {self.config.name} WebSocket server on port {self.config.port}...")

    async with websockets.serve(handle_connection, "0.0.0.0", {self.config.port}):
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    asyncio.run(main())
'''

    def _generate_tool_handlers(self) -> str:
        """Generate tool handler functions."""
        handlers = []
        for tool in self.config.tools:
            handlers.append(tool.generate_handler_stub())
        return "\n".join(handlers) if handlers else "# No tools defined"

    def _generate_tool_list(self) -> str:
        """Generate tool list for list_tools."""
        if not self.config.tools:
            return "        # No tools defined"

        items = []
        for tool in self.config.tools:
            schema = tool.to_mcp_schema()
            items.append(f'''        Tool(
            name="{tool.name}",
            description="{tool.description}",
            inputSchema={json.dumps(schema["inputSchema"], indent=12)}
        ),''')
        return "\n".join(items)

    def _generate_tool_dispatcher(self) -> str:
        """Generate tool call dispatcher."""
        if not self.config.tools:
            return "        pass"

        lines = []
        for i, tool in enumerate(self.config.tools):
            keyword = "if" if i == 0 else "elif"
            lines.append(f'''        {keyword} name == "{tool.name}":
            result = await handle_{tool.name}(**arguments)
            return [TextContent(type="text", text=str(result))]''')
        return "\n".join(lines)

    def _generate_resource_handlers(self) -> str:
        """Generate resource handler functions."""
        if not self.config.resources:
            return "# No resources defined"

        handlers = []
        for resource in self.config.resources:
            handler_name = resource.uri.replace("://", "_").replace("/", "_").replace("-", "_")
            handlers.append(f'''
async def get_resource_{handler_name}() -> str:
    """
    Retrieve resource: {resource.name}
    URI: {resource.uri}
    """
    # TODO: Implement resource retrieval
    return "{{\\"placeholder\\": \\"Implement resource logic\\"}}"
''')
        return "\n".join(handlers)

    def _generate_resource_list(self) -> str:
        """Generate resource list."""
        if not self.config.resources:
            return "        # No resources defined"

        items = []
        for resource in self.config.resources:
            items.append(f'''        Resource(
            uri="{resource.uri}",
            name="{resource.name}",
            description="{resource.description}",
            mimeType="{resource.mime_type}"
        ),''')
        return "\n".join(items)

    def _generate_prompt_handlers(self) -> str:
        """Generate prompt handlers."""
        if not self.config.prompts:
            return "# No prompts defined"

        handlers = []
        for prompt in self.config.prompts:
            handlers.append(f'''
@server.get_prompt()
async def get_prompt_{prompt.name}(name: str, arguments: Dict[str, str]) -> GetPromptResult:
    """Handle {prompt.name} prompt."""
    if name != "{prompt.name}":
        raise ValueError(f"Unknown prompt: {{name}}")

    template = """{prompt.template}"""

    # Format template with arguments
    formatted = template.format(**arguments)

    return GetPromptResult(
        description="{prompt.description}",
        messages=[
            PromptMessage(role="user", content=TextContent(type="text", text=formatted))
        ]
    )
''')
        return "\n".join(handlers)

    def generate_requirements(self) -> str:
        """Generate requirements.txt."""
        deps = set(self.config.transport.python_dependencies)
        deps.add("pydantic")

        # Add specific dependencies based on tools
        for tool in self.config.tools:
            if tool.category == ToolCategory.DATABASE:
                deps.add("asyncpg")
                deps.add("sqlalchemy")
            elif tool.category == ToolCategory.API:
                deps.add("httpx")
            elif tool.category == ToolCategory.SEARCH:
                deps.add("whoosh")

        return "\n".join(sorted(deps))

    def generate_pyproject(self) -> str:
        """Generate pyproject.toml."""
        deps = self.config.transport.python_dependencies

        return f'''[project]
name = "{self.config.name.lower().replace(" ", "-")}"
version = "{self.config.version}"
description = "{self.config.description}"
requires-python = ">=3.10"
dependencies = [
    {", ".join(f'"{d}"' for d in deps)}
]

[project.scripts]
{self.config.name.lower().replace(" ", "-")} = "server:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
'''

    def generate_readme(self) -> str:
        """Generate README.md."""
        return f'''# {self.config.name}

{self.config.description}

## Installation

```bash
pip install -e .
```

## Usage

### Start the server

```bash
python server.py
```

### Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{{
  "mcpServers": {{
    "{self.config.name.lower().replace(" ", "-")}": {{
      "command": "python",
      "args": ["{Path.cwd()}/server.py"]
    }}
  }}
}}
```

## Available Tools

{self._readme_tools()}

## Available Resources

{self._readme_resources()}

## Transport

- **Type**: {self.config.transport.value}
- **Description**: {self.config.transport.description}
{f"- **Port**: {self.config.port}" if self.config.port else ""}

---

Generated by MCP.SERVER.BUILDER.EXE
'''

    def _readme_tools(self) -> str:
        """Generate tools section for README."""
        if not self.config.tools:
            return "_No tools defined_"

        lines = []
        for tool in self.config.tools:
            lines.append(f"### {tool.name}")
            lines.append(f"\n{tool.description}\n")

            if tool.parameters:
                lines.append("**Parameters:**\n")
                for param in tool.parameters:
                    req = "(required)" if param.required else "(optional)"
                    lines.append(f"- `{param.name}` ({param.type.value}) {req}: {param.description}")

            lines.append("")

        return "\n".join(lines)

    def _readme_resources(self) -> str:
        """Generate resources section for README."""
        if not self.config.resources:
            return "_No resources defined_"

        lines = []
        for resource in self.config.resources:
            lines.append(f"- **{resource.name}** (`{resource.uri}`): {resource.description}")

        return "\n".join(lines)


class ConfigGenerator:
    """Generate Claude Desktop configuration."""

    @staticmethod
    def generate_claude_config(servers: List[ServerConfig]) -> str:
        """Generate claude_desktop_config.json snippet."""
        config = {"mcpServers": {}}

        for server in servers:
            server_id = server.name.lower().replace(" ", "-")

            if server.transport == Transport.STDIO:
                config["mcpServers"][server_id] = {
                    "command": "python",
                    "args": ["server.py"]
                }
            else:
                config["mcpServers"][server_id] = {
                    "command": "python",
                    "args": ["server.py"],
                    "env": {
                        "PORT": str(server.port)
                    }
                }

        return json.dumps(config, indent=2)


# ============================================================
# TEMPLATES
# ============================================================

class MCPServerTemplates:
    """Pre-built MCP server templates."""

    @staticmethod
    def database_postgres() -> ServerConfig:
        """PostgreSQL database server."""
        config = ServerConfig.database_server("postgres-mcp", "postgresql")
        config.tools.extend([
            ToolDefinition(
                name="execute_query",
                description="Execute a write query (INSERT, UPDATE, DELETE)",
                category=ToolCategory.DATABASE,
                parameters=[
                    ToolParameter("query", InputType.STRING, "SQL query to execute"),
                    ToolParameter("params", InputType.ARRAY, "Query parameters", required=False, default=[])
                ],
                is_destructive=True,
                requires_confirmation=True
            )
        ])
        return config

    @staticmethod
    def file_manager() -> ServerConfig:
        """File system manager server."""
        return ServerConfig.file_manager("file-manager-mcp")

    @staticmethod
    def api_integrator() -> ServerConfig:
        """API integration server."""
        return ServerConfig.api_gateway("api-integrator-mcp")

    @staticmethod
    def knowledge_base() -> ServerConfig:
        """Knowledge base server with search."""
        return ServerConfig(
            name="knowledge-base-mcp",
            description="MCP server for knowledge base with semantic search",
            tools=[
                ToolDefinition.search(),
                ToolDefinition(
                    name="add_document",
                    description="Add a document to the knowledge base",
                    category=ToolCategory.SEARCH,
                    parameters=[
                        ToolParameter("title", InputType.STRING, "Document title"),
                        ToolParameter("content", InputType.STRING, "Document content"),
                        ToolParameter("metadata", InputType.OBJECT, "Document metadata", required=False, default={})
                    ]
                ),
                ToolDefinition(
                    name="semantic_search",
                    description="Search using natural language",
                    category=ToolCategory.AI_ML,
                    parameters=[
                        ToolParameter("query", InputType.STRING, "Natural language query"),
                        ToolParameter("top_k", InputType.INTEGER, "Number of results", required=False, default=5)
                    ]
                )
            ],
            resources=[
                ResourceDefinition(
                    uri="kb://stats",
                    name="Knowledge Base Stats",
                    description="Statistics about the knowledge base",
                    type=ResourceType.JSON
                )
            ],
            prompts=[
                PromptDefinition.summarize()
            ]
        )

    @staticmethod
    def automation_hub() -> ServerConfig:
        """Automation and workflow server."""
        return ServerConfig(
            name="automation-mcp",
            description="MCP server for task automation and workflows",
            tools=[
                ToolDefinition(
                    name="run_script",
                    description="Execute a predefined script",
                    category=ToolCategory.AUTOMATION,
                    parameters=[
                        ToolParameter("script_id", InputType.STRING, "ID of the script to run"),
                        ToolParameter("args", InputType.OBJECT, "Script arguments", required=False, default={})
                    ],
                    is_destructive=True
                ),
                ToolDefinition(
                    name="schedule_task",
                    description="Schedule a task for later execution",
                    category=ToolCategory.AUTOMATION,
                    parameters=[
                        ToolParameter("task_name", InputType.STRING, "Name of the task"),
                        ToolParameter("cron", InputType.STRING, "Cron expression for scheduling"),
                        ToolParameter("action", InputType.OBJECT, "Action to perform")
                    ]
                ),
                ToolDefinition(
                    name="list_workflows",
                    description="List available workflows",
                    category=ToolCategory.AUTOMATION,
                    parameters=[]
                )
            ]
        )


# ============================================================
# REPORTER
# ============================================================

class MCPServerReporter:
    """Generate reports about MCP server configurations."""

    @staticmethod
    def server_dashboard(config: ServerConfig) -> str:
        """Generate server overview dashboard."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    MCP SERVER - CONFIGURATION                        ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Name: {config.name:<61} ║",
            f"║  Version: {config.version:<58} ║",
            f"║  Transport: {config.transport.value:<56} ║",
            f"║  Auth: {config.auth_method.value:<61} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Tools: {len(config.tools):<60} ║",
            f"║  Resources: {len(config.resources):<56} ║",
            f"║  Prompts: {len(config.prompts):<58} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  TOOLS                                                               ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for tool in config.tools:
            icon = tool.category.icon
            destructive = "⚠️" if tool.is_destructive else "  "
            lines.append(f"║  {icon} {tool.name:<35} {destructive} {tool.category.value:<20} ║")

        if not config.tools:
            lines.append("║  No tools defined                                                    ║")

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    @staticmethod
    def tool_summary(tools: List[ToolDefinition]) -> str:
        """Generate tool summary by category."""
        categories: Dict[ToolCategory, List[ToolDefinition]] = {}

        for tool in tools:
            if tool.category not in categories:
                categories[tool.category] = []
            categories[tool.category].append(tool)

        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    TOOLS BY CATEGORY                                 ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for category in sorted(categories.keys(), key=lambda c: c.value):
            cat_tools = categories[category]
            lines.append(f"║  {category.icon} {category.value.upper():<65} ║")
            for tool in cat_tools:
                lines.append(f"║     • {tool.name:<62} ║")

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# ============================================================
# ENGINE
# ============================================================

class MCPServerBuilder:
    """Main engine for building MCP servers."""

    def __init__(self, config: ServerConfig):
        self.config = config
        self.generator = ServerCodeGenerator(config)

    def build(self, output_dir: str = ".") -> Dict[str, str]:
        """Build all server files."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        files = {
            "server.py": self.generator.generate_main(),
            "requirements.txt": self.generator.generate_requirements(),
            "pyproject.toml": self.generator.generate_pyproject(),
            "README.md": self.generator.generate_readme()
        }

        for filename, content in files.items():
            file_path = output_path / filename
            file_path.write_text(content)

        return files

    def preview(self) -> str:
        """Preview the generated server code."""
        return self.generator.generate_main()

    def add_tool(self, tool: ToolDefinition) -> "MCPServerBuilder":
        """Add a tool to the server."""
        self.config.tools.append(tool)
        return self

    def add_resource(self, resource: ResourceDefinition) -> "MCPServerBuilder":
        """Add a resource to the server."""
        self.config.resources.append(resource)
        return self

    def add_prompt(self, prompt: PromptDefinition) -> "MCPServerBuilder":
        """Add a prompt to the server."""
        self.config.prompts.append(prompt)
        return self


# ============================================================
# CLI
# ============================================================

def create_cli():
    """Create CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        description="MCP.SERVER.BUILDER.EXE - Generate MCP servers",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create a database server
  python mcp-server-builder.py create --template database --name my-db-mcp

  # Create an API gateway
  python mcp-server-builder.py create --template api --transport http_sse

  # Preview server code
  python mcp-server-builder.py preview --template file-manager

  # List available templates
  python mcp-server-builder.py list --templates
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new MCP server")
    create_parser.add_argument("--template", choices=["database", "file-manager", "api", "knowledge-base", "automation", "minimal"], required=True)
    create_parser.add_argument("--name", default="my-mcp-server", help="Server name")
    create_parser.add_argument("--transport", choices=["stdio", "http_sse", "websocket"], default="stdio")
    create_parser.add_argument("--output", "-o", default="./mcp-server", help="Output directory")

    # Preview command
    preview_parser = subparsers.add_parser("preview", help="Preview generated code")
    preview_parser.add_argument("--template", choices=["database", "file-manager", "api", "knowledge-base", "automation", "minimal"], required=True)
    preview_parser.add_argument("--name", default="preview-server", help="Server name")

    # List command
    list_parser = subparsers.add_parser("list", help="List available options")
    list_parser.add_argument("--templates", action="store_true", help="List templates")
    list_parser.add_argument("--transports", action="store_true", help="List transports")
    list_parser.add_argument("--tool-categories", action="store_true", help="List tool categories")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Show demonstration")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_cli()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    templates = {
        "database": MCPServerTemplates.database_postgres,
        "file-manager": MCPServerTemplates.file_manager,
        "api": MCPServerTemplates.api_integrator,
        "knowledge-base": MCPServerTemplates.knowledge_base,
        "automation": MCPServerTemplates.automation_hub,
        "minimal": lambda: ServerConfig.minimal("minimal-server")
    }

    if args.command == "create":
        config = templates[args.template]()
        config.name = args.name
        config.transport = Transport(args.transport)

        builder = MCPServerBuilder(config)
        files = builder.build(args.output)

        print(f"Created MCP server in {args.output}/")
        print(f"  Files: {', '.join(files.keys())}")
        print(f"\nTo start the server:")
        print(f"  cd {args.output}")
        print(f"  pip install -r requirements.txt")
        print(f"  python server.py")

    elif args.command == "preview":
        config = templates[args.template]()
        config.name = args.name

        builder = MCPServerBuilder(config)
        print(builder.preview())

    elif args.command == "list":
        if args.templates:
            print("\nAvailable Templates:")
            print("  database      - PostgreSQL database access")
            print("  file-manager  - File system operations")
            print("  api           - External API integration")
            print("  knowledge-base - Document search and retrieval")
            print("  automation    - Task automation and workflows")
            print("  minimal       - Minimal starter template")

        elif args.transports:
            print("\nAvailable Transports:")
            for t in Transport:
                print(f"  {t.value:<15} - {t.description}")

        elif args.tool_categories:
            print("\nTool Categories:")
            for c in ToolCategory:
                print(f"  {c.icon} {c.value:<15} - Common tools: {', '.join(c.common_tools[:3])}")

    elif args.command == "demo":
        print("=" * 70)
        print("MCP.SERVER.BUILDER.EXE - DEMONSTRATION")
        print("=" * 70)

        config = MCPServerTemplates.database_postgres()

        print("\n" + MCPServerReporter.server_dashboard(config))
        print("\n" + MCPServerReporter.tool_summary(config.tools))

        print("\n" + "-" * 70)
        print("SAMPLE SERVER CODE (first 60 lines)")
        print("-" * 70)

        builder = MCPServerBuilder(config)
        code = builder.preview()
        for line in code.split("\n")[:60]:
            print(line)
        print("...")


if __name__ == "__main__":
    main()
```

---

## USAGE

### Quick Start

```bash
# Create a database MCP server
python mcp-server-builder.py create --template database --name my-db-mcp

# Create an API gateway with HTTP transport
python mcp-server-builder.py create --template api --transport http_sse

# Preview what will be generated
python mcp-server-builder.py preview --template knowledge-base

# List available templates
python mcp-server-builder.py list --templates
```

### Available Templates

| Template | Description | Use Case |
|----------|-------------|----------|
| `database` | PostgreSQL access | Query databases |
| `file-manager` | File operations | Read/write files |
| `api` | HTTP requests | External APIs |
| `knowledge-base` | Search & retrieval | Document Q&A |
| `automation` | Workflows | Task automation |
| `minimal` | Starter template | Custom servers |

### Transport Options

| Transport | Description | When to Use |
|-----------|-------------|-------------|
| `stdio` | Standard I/O | CLI tools, local |
| `http_sse` | HTTP + SSE | Web services |
| `websocket` | WebSocket | Real-time apps |

---

## QUICK COMMANDS

```
/mcp-server-builder database   → Create database server
/mcp-server-builder api        → Create API gateway
/mcp-server-builder files      → Create file manager
/mcp-server-builder knowledge  → Create knowledge base
/mcp-server-builder custom     → Custom configuration
```

$ARGUMENTS
