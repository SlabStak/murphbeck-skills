# CLOUDFLARE.WORKERS.EXE - Serverless Edge Computing Specialist

You are CLOUDFLARE.WORKERS.EXE — the serverless edge computing specialist that builds, deploys, and scales applications on Cloudflare's global network using Workers, with integrated access to KV, D1, Durable Objects, Queues, and R2.

MISSION
Build serverless. Deploy globally. Scale infinitely.

---

## CAPABILITIES

### WorkerArchitect.MOD
- Worker script development with TypeScript
- Request/response handling patterns
- Fetch event processing with routing
- Scheduled event handlers for cron jobs
- Environment configuration management

### BindingsManager.MOD
- KV namespace bindings for key-value storage
- D1 database connections for SQL
- R2 bucket access for object storage
- Durable Object bindings for stateful coordination
- Service bindings for worker-to-worker calls

### RoutingEngine.MOD
- Route pattern matching with wildcards
- Custom domain routing configuration
- Path-based handlers with middleware
- Middleware chains for request processing
- Error handling flows with custom responses

### DeploymentOps.MOD
- Wrangler CLI operations automation
- Environment management (dev/staging/prod)
- Secret configuration and rotation
- Version deployment with rollbacks
- Metrics monitoring and alerting

---

## WORKER TYPES

| Type | Use Case | Handler |
|------|----------|---------|
| Fetch | HTTP requests | `fetch(request, env, ctx)` |
| Scheduled | Cron jobs | `scheduled(event, env, ctx)` |
| Queue | Message processing | `queue(batch, env, ctx)` |
| Email | Email routing | `email(message, env, ctx)` |
| Tail | Log consumption | `tail(events)` |

## BINDING TYPES

| Binding | Purpose | Config Key |
|---------|---------|------------|
| KV | Key-value storage | `kv_namespaces` |
| D1 | SQL database | `d1_databases` |
| R2 | Object storage | `r2_buckets` |
| Durable Objects | Stateful coordination | `durable_objects` |
| Queues | Message queues | `queues` |
| Service | Worker-to-worker | `services` |
| AI | ML inference | `ai` |

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
CLOUDFLARE.WORKERS.EXE - Serverless Edge Computing Specialist
Production-ready Cloudflare Workers development and deployment system.
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
from datetime import datetime
import json
import argparse
import re


# ════════════════════════════════════════════════════════════════════════════
# ENUMS - Worker Types and Configuration Options
# ════════════════════════════════════════════════════════════════════════════

class WorkerType(Enum):
    """Types of Cloudflare Workers with their event handlers."""
    FETCH = "fetch"
    SCHEDULED = "scheduled"
    QUEUE = "queue"
    EMAIL = "email"
    TAIL = "tail"
    WEBSOCKET = "websocket"

    @property
    def handler_signature(self) -> str:
        """TypeScript handler signature for this worker type."""
        signatures = {
            "fetch": "async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>",
            "scheduled": "async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void>",
            "queue": "async queue(batch: MessageBatch<unknown>, env: Env, ctx: ExecutionContext): Promise<void>",
            "email": "async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void>",
            "tail": "async tail(events: TraceItem[]): Promise<void>",
            "websocket": "async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>"
        }
        return signatures.get(self.value, signatures["fetch"])

    @property
    def event_type(self) -> str:
        """Event type that triggers this worker."""
        events = {
            "fetch": "HTTP Request",
            "scheduled": "Cron Trigger",
            "queue": "Queue Message",
            "email": "Email Message",
            "tail": "Log Event",
            "websocket": "WebSocket Connection"
        }
        return events.get(self.value, "HTTP Request")

    @property
    def use_cases(self) -> list[str]:
        """Common use cases for this worker type."""
        cases = {
            "fetch": ["API endpoints", "Static site hosting", "Request routing", "Auth middleware"],
            "scheduled": ["Data sync jobs", "Cleanup tasks", "Report generation", "Health checks"],
            "queue": ["Background processing", "Email sending", "Webhook delivery", "Data pipelines"],
            "email": ["Email forwarding", "Spam filtering", "Auto-responders", "Email parsing"],
            "tail": ["Log aggregation", "Error tracking", "Analytics", "Alerting"],
            "websocket": ["Real-time chat", "Live updates", "Gaming", "Collaboration"]
        }
        return cases.get(self.value, cases["fetch"])

    @property
    def boilerplate(self) -> str:
        """Basic boilerplate code for this worker type."""
        if self.value == "fetch":
            return '''export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Add your route handling here

    return new Response('Hello from Workers!', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};'''
        elif self.value == "scheduled":
            return '''export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron trigger: ${event.cron}`);

    // Add your scheduled task logic here
    ctx.waitUntil(processTask(env));
  }
};

async function processTask(env: Env): Promise<void> {
  // Implementation
}'''
        elif self.value == "queue":
            return '''export default {
  async queue(batch: MessageBatch<unknown>, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        // Process message
        console.log(`Processing: ${JSON.stringify(message.body)}`);
        message.ack();
      } catch (error) {
        message.retry();
      }
    }
  }
};'''
        elif self.value == "websocket":
            return '''export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const [client, server] = Object.values(new WebSocketPair());

    server.accept();
    server.addEventListener('message', (event) => {
      server.send(`Echo: ${event.data}`);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
};'''
        return self.boilerplate


class BindingType(Enum):
    """Types of Cloudflare Workers bindings."""
    KV = "kv_namespaces"
    D1 = "d1_databases"
    R2 = "r2_buckets"
    DURABLE_OBJECTS = "durable_objects"
    QUEUES = "queues"
    SERVICE = "services"
    AI = "ai"
    VECTORIZE = "vectorize"
    HYPERDRIVE = "hyperdrive"
    ANALYTICS_ENGINE = "analytics_engine"

    @property
    def typescript_type(self) -> str:
        """TypeScript type for this binding."""
        types = {
            "kv_namespaces": "KVNamespace",
            "d1_databases": "D1Database",
            "r2_buckets": "R2Bucket",
            "durable_objects": "DurableObjectNamespace",
            "queues": "Queue<unknown>",
            "services": "Fetcher",
            "ai": "Ai",
            "vectorize": "VectorizeIndex",
            "hyperdrive": "Hyperdrive",
            "analytics_engine": "AnalyticsEngineDataset"
        }
        return types.get(self.value, "unknown")

    @property
    def wrangler_key(self) -> str:
        """Key used in wrangler.toml."""
        return self.value

    @property
    def description(self) -> str:
        """Description of this binding type."""
        descriptions = {
            "kv_namespaces": "Key-value storage for caching and simple data",
            "d1_databases": "SQL database (SQLite) at the edge",
            "r2_buckets": "S3-compatible object storage",
            "durable_objects": "Stateful serverless coordination",
            "queues": "Message queue for async processing",
            "services": "Worker-to-worker communication",
            "ai": "Workers AI for ML inference",
            "vectorize": "Vector database for embeddings",
            "hyperdrive": "Database connection pooling",
            "analytics_engine": "High-cardinality analytics"
        }
        return descriptions.get(self.value, "")

    @property
    def config_template(self) -> dict:
        """Configuration template for wrangler.toml."""
        templates = {
            "kv_namespaces": {"binding": "CACHE", "id": "<namespace_id>"},
            "d1_databases": {"binding": "DB", "database_name": "my-db", "database_id": "<database_id>"},
            "r2_buckets": {"binding": "STORAGE", "bucket_name": "my-bucket"},
            "durable_objects": {"bindings": [{"name": "COUNTER", "class_name": "Counter"}]},
            "queues": {"producers": [{"binding": "QUEUE", "queue": "my-queue"}]},
            "services": [{"binding": "AUTH_SERVICE", "service": "auth-worker"}],
            "ai": {"binding": "AI"},
            "vectorize": [{"binding": "VECTORS", "index_name": "my-index"}],
            "hyperdrive": [{"binding": "HYPERDRIVE", "id": "<hyperdrive_id>"}],
            "analytics_engine": [{"binding": "ANALYTICS", "dataset": "my-dataset"}]
        }
        return templates.get(self.value, {})


class Environment(Enum):
    """Deployment environments for Workers."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    PREVIEW = "preview"

    @property
    def wrangler_env(self) -> str:
        """Environment name for wrangler commands."""
        return self.value if self.value != "development" else ""

    @property
    def deploy_command(self) -> str:
        """Wrangler deploy command for this environment."""
        if self.value == "development":
            return "wrangler dev"
        elif self.value == "preview":
            return "wrangler deploy --env preview"
        return f"wrangler deploy --env {self.value}" if self.value != "production" else "wrangler deploy"

    @property
    def characteristics(self) -> dict:
        """Environment characteristics."""
        chars = {
            "development": {"hot_reload": True, "local": True, "logs": "verbose"},
            "staging": {"hot_reload": False, "local": False, "logs": "info"},
            "production": {"hot_reload": False, "local": False, "logs": "warn"},
            "preview": {"hot_reload": False, "local": False, "logs": "info"}
        }
        return chars.get(self.value, chars["development"])


class RouteMatchType(Enum):
    """Types of route pattern matching."""
    EXACT = "exact"
    PREFIX = "prefix"
    WILDCARD = "wildcard"
    REGEX = "regex"

    @property
    def example(self) -> str:
        """Example pattern for this match type."""
        examples = {
            "exact": "/api/users",
            "prefix": "/api/*",
            "wildcard": "*.example.com/*",
            "regex": r"^/api/v[0-9]+/.*$"
        }
        return examples.get(self.value, "/*")


class CompatibilityFlag(Enum):
    """Cloudflare Workers compatibility flags."""
    NODEJS_COMPAT = "nodejs_compat"
    STREAMS_ENABLE_CONSTRUCTORS = "streams_enable_constructors"
    TRANSFORMSTREAM_ENABLE_STANDARD_CONSTRUCTOR = "transformstream_enable_standard_constructor"
    URL_STANDARD = "url_standard"
    FETCH_REFUSES_UNKNOWN_PROTOCOLS = "fetch_refuses_unknown_protocols"
    STRICT_CRYPTO_CHECKS = "strict_crypto_checks"

    @property
    def description(self) -> str:
        """Description of this compatibility flag."""
        descriptions = {
            "nodejs_compat": "Enable Node.js API compatibility",
            "streams_enable_constructors": "Enable Streams API constructors",
            "transformstream_enable_standard_constructor": "Enable standard TransformStream constructor",
            "url_standard": "Use standard URL API behavior",
            "fetch_refuses_unknown_protocols": "Fetch API refuses unknown protocols",
            "strict_crypto_checks": "Enable strict crypto checks"
        }
        return descriptions.get(self.value, "")


# ════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Configuration and State Management
# ════════════════════════════════════════════════════════════════════════════

@dataclass
class BindingConfig:
    """Configuration for a single Worker binding."""
    binding_type: BindingType
    name: str
    id: str = ""
    options: dict = field(default_factory=dict)

    def to_env_interface(self) -> str:
        """Generate TypeScript Env interface entry."""
        return f"  {self.name}: {self.binding_type.typescript_type};"

    def to_wrangler_config(self) -> dict:
        """Generate wrangler.toml configuration."""
        config = {"binding": self.name}

        if self.binding_type == BindingType.KV:
            config["id"] = self.id or "<namespace_id>"
        elif self.binding_type == BindingType.D1:
            config["database_name"] = self.options.get("database_name", "my-db")
            config["database_id"] = self.id or "<database_id>"
        elif self.binding_type == BindingType.R2:
            config["bucket_name"] = self.options.get("bucket_name", "my-bucket")
        elif self.binding_type == BindingType.QUEUES:
            config["queue"] = self.options.get("queue_name", "my-queue")
        elif self.binding_type == BindingType.AI:
            return {"binding": self.name}

        return config

    @classmethod
    def kv_namespace(cls, name: str, namespace_id: str = "") -> "BindingConfig":
        """Create KV namespace binding."""
        return cls(BindingType.KV, name, namespace_id)

    @classmethod
    def d1_database(cls, name: str, database_name: str, database_id: str = "") -> "BindingConfig":
        """Create D1 database binding."""
        return cls(BindingType.D1, name, database_id, {"database_name": database_name})

    @classmethod
    def r2_bucket(cls, name: str, bucket_name: str) -> "BindingConfig":
        """Create R2 bucket binding."""
        return cls(BindingType.R2, name, "", {"bucket_name": bucket_name})

    @classmethod
    def queue(cls, name: str, queue_name: str) -> "BindingConfig":
        """Create Queue binding."""
        return cls(BindingType.QUEUES, name, "", {"queue_name": queue_name})

    @classmethod
    def ai(cls, name: str = "AI") -> "BindingConfig":
        """Create AI binding."""
        return cls(BindingType.AI, name)


@dataclass
class RouteConfig:
    """Configuration for a Worker route."""
    pattern: str
    zone_name: str = ""
    custom_domain: str = ""
    match_type: RouteMatchType = RouteMatchType.WILDCARD

    def to_wrangler_config(self) -> dict:
        """Generate wrangler.toml route configuration."""
        config = {"pattern": self.pattern}
        if self.zone_name:
            config["zone_name"] = self.zone_name
        if self.custom_domain:
            config["custom_domain"] = self.custom_domain
        return config

    def matches(self, path: str) -> bool:
        """Check if a path matches this route pattern."""
        if self.match_type == RouteMatchType.EXACT:
            return path == self.pattern
        elif self.match_type == RouteMatchType.PREFIX:
            prefix = self.pattern.rstrip("*")
            return path.startswith(prefix)
        elif self.match_type == RouteMatchType.WILDCARD:
            regex_pattern = self.pattern.replace("*", ".*").replace("?", ".")
            return bool(re.match(f"^{regex_pattern}$", path))
        elif self.match_type == RouteMatchType.REGEX:
            return bool(re.match(self.pattern, path))
        return False


@dataclass
class SecretConfig:
    """Configuration for Worker secrets."""
    name: str
    description: str = ""
    required: bool = True
    env_var: str = ""

    def to_secret_command(self) -> str:
        """Generate wrangler secret put command."""
        return f"wrangler secret put {self.name}"

    def to_env_interface(self) -> str:
        """Generate TypeScript Env interface entry."""
        return f"  {self.name}: string;  // Secret: {self.description}"


@dataclass
class CronTrigger:
    """Configuration for scheduled Worker triggers."""
    cron_expression: str
    description: str = ""

    @property
    def schedule_description(self) -> str:
        """Human-readable schedule description."""
        parts = self.cron_expression.split()
        if len(parts) == 5:
            minute, hour, day, month, weekday = parts
            if self.cron_expression == "* * * * *":
                return "Every minute"
            elif minute == "0" and hour == "*":
                return "Every hour"
            elif minute == "0" and hour == "0":
                return "Daily at midnight"
            elif minute == "0" and hour == "0" and weekday == "1":
                return "Weekly on Monday"
        return self.cron_expression

    def to_wrangler_config(self) -> dict:
        """Generate wrangler.toml trigger configuration."""
        return {"crons": [self.cron_expression]}

    @classmethod
    def every_minute(cls) -> "CronTrigger":
        """Trigger every minute."""
        return cls("* * * * *", "Every minute")

    @classmethod
    def hourly(cls) -> "CronTrigger":
        """Trigger every hour."""
        return cls("0 * * * *", "Every hour at :00")

    @classmethod
    def daily(cls, hour: int = 0) -> "CronTrigger":
        """Trigger daily at specified hour (UTC)."""
        return cls(f"0 {hour} * * *", f"Daily at {hour:02d}:00 UTC")

    @classmethod
    def weekly(cls, weekday: int = 1, hour: int = 0) -> "CronTrigger":
        """Trigger weekly on specified day (1=Monday)."""
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        return cls(f"0 {hour} * * {weekday}", f"Weekly on {days[weekday-1]} at {hour:02d}:00 UTC")


@dataclass
class WorkerConfig:
    """Complete Worker configuration."""
    name: str
    worker_type: WorkerType = WorkerType.FETCH
    main_file: str = "src/index.ts"
    compatibility_date: str = "2024-01-01"
    bindings: list[BindingConfig] = field(default_factory=list)
    routes: list[RouteConfig] = field(default_factory=list)
    secrets: list[SecretConfig] = field(default_factory=list)
    cron_triggers: list[CronTrigger] = field(default_factory=list)
    vars: dict = field(default_factory=dict)
    compatibility_flags: list[CompatibilityFlag] = field(default_factory=list)
    node_compat: bool = False

    def add_binding(self, binding: BindingConfig) -> "WorkerConfig":
        """Add a binding to the worker."""
        self.bindings.append(binding)
        return self

    def add_route(self, route: RouteConfig) -> "WorkerConfig":
        """Add a route to the worker."""
        self.routes.append(route)
        return self

    def add_secret(self, secret: SecretConfig) -> "WorkerConfig":
        """Add a secret to the worker."""
        self.secrets.append(secret)
        return self

    def add_cron(self, trigger: CronTrigger) -> "WorkerConfig":
        """Add a cron trigger to the worker."""
        self.cron_triggers.append(trigger)
        return self

    @classmethod
    def api_worker(cls, name: str) -> "WorkerConfig":
        """Create an API-focused worker configuration."""
        return cls(
            name=name,
            worker_type=WorkerType.FETCH,
            bindings=[
                BindingConfig.d1_database("DB", f"{name}-db"),
                BindingConfig.kv_namespace("CACHE")
            ],
            vars={"API_VERSION": "v1"}
        )

    @classmethod
    def scheduled_worker(cls, name: str, schedule: str = "0 * * * *") -> "WorkerConfig":
        """Create a scheduled worker configuration."""
        return cls(
            name=name,
            worker_type=WorkerType.SCHEDULED,
            cron_triggers=[CronTrigger(schedule)],
            bindings=[BindingConfig.kv_namespace("STATE")]
        )

    @classmethod
    def queue_processor(cls, name: str, queue_name: str) -> "WorkerConfig":
        """Create a queue processor worker configuration."""
        return cls(
            name=name,
            worker_type=WorkerType.QUEUE,
            bindings=[
                BindingConfig.queue("QUEUE", queue_name),
                BindingConfig.kv_namespace("RESULTS")
            ]
        )

    @classmethod
    def full_stack_worker(cls, name: str) -> "WorkerConfig":
        """Create a full-stack worker with all common bindings."""
        return cls(
            name=name,
            worker_type=WorkerType.FETCH,
            bindings=[
                BindingConfig.d1_database("DB", f"{name}-db"),
                BindingConfig.kv_namespace("CACHE"),
                BindingConfig.r2_bucket("STORAGE", f"{name}-bucket"),
                BindingConfig.ai()
            ],
            secrets=[
                SecretConfig("API_KEY", "External API authentication"),
                SecretConfig("JWT_SECRET", "JWT signing key")
            ],
            vars={"ENVIRONMENT": "production"}
        )


@dataclass
class DeploymentResult:
    """Result of a Worker deployment."""
    worker_name: str
    environment: Environment
    success: bool
    url: str = ""
    version: str = ""
    timestamp: datetime = field(default_factory=datetime.now)
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "worker_name": self.worker_name,
            "environment": self.environment.value,
            "success": self.success,
            "url": self.url,
            "version": self.version,
            "timestamp": self.timestamp.isoformat(),
            "errors": self.errors
        }


# ════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Core Functionality
# ════════════════════════════════════════════════════════════════════════════

class WorkerArchitect:
    """Designs and generates Worker code."""

    def __init__(self, config: WorkerConfig):
        self.config = config

    def generate_env_interface(self) -> str:
        """Generate TypeScript Env interface."""
        lines = ["export interface Env {"]

        # Add bindings
        for binding in self.config.bindings:
            lines.append(binding.to_env_interface())

        # Add secrets
        for secret in self.config.secrets:
            lines.append(secret.to_env_interface())

        # Add vars
        for var_name, var_value in self.config.vars.items():
            lines.append(f"  {var_name}: string;")

        lines.append("}")
        return "\n".join(lines)

    def generate_handler(self) -> str:
        """Generate the main handler code."""
        return self.config.worker_type.boilerplate

    def generate_router(self, routes: list[dict]) -> str:
        """Generate a routing handler for multiple endpoints."""
        route_cases = []
        for route in routes:
            path = route.get("path", "/")
            method = route.get("method", "GET")
            handler = route.get("handler", "handleRequest")
            route_cases.append(f'''    if (url.pathname === '{path}' && request.method === '{method}') {{
      return {handler}(request, env, ctx);
    }}''')

        routes_code = "\n".join(route_cases)

        return f'''export default {{
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {{
    const url = new URL(request.url);

{routes_code}

    return new Response('Not Found', {{ status: 404 }});
  }}
}};'''

    def generate_middleware_chain(self, middlewares: list[str]) -> str:
        """Generate middleware chain code."""
        middleware_calls = "\n    ".join([f"request = await {m}(request, env);" for m in middlewares])

        return f'''type Middleware = (request: Request, env: Env) => Promise<Request>;

const middlewares: Middleware[] = [{", ".join(middlewares)}];

async function applyMiddlewares(request: Request, env: Env): Promise<Request> {{
    {middleware_calls}
    return request;
}}'''

    def generate_error_handler(self) -> str:
        """Generate error handling code."""
        return '''interface ErrorResponse {
  error: string;
  code: number;
  details?: string;
}

function handleError(error: unknown, status: number = 500): Response {
  const body: ErrorResponse = {
    error: error instanceof Error ? error.message : 'Internal Server Error',
    code: status,
  };

  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    body.details = error.stack;
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}'''

    def generate_complete_worker(self) -> str:
        """Generate complete worker source code."""
        sections = []

        # Type definitions
        sections.append("// Type Definitions")
        sections.append(self.generate_env_interface())
        sections.append("")

        # Error handling
        sections.append("// Error Handling")
        sections.append(self.generate_error_handler())
        sections.append("")

        # Main handler
        sections.append("// Main Worker Handler")
        sections.append(self.generate_handler())

        return "\n".join(sections)


class WranglerConfigGenerator:
    """Generates wrangler.toml configuration."""

    def __init__(self, config: WorkerConfig):
        self.config = config

    def generate_toml(self, environment: Optional[Environment] = None) -> str:
        """Generate complete wrangler.toml content."""
        lines = [
            f'name = "{self.config.name}"',
            f'main = "{self.config.main_file}"',
            f'compatibility_date = "{self.config.compatibility_date}"',
        ]

        # Compatibility flags
        if self.config.compatibility_flags:
            flags = ", ".join([f'"{f.value}"' for f in self.config.compatibility_flags])
            lines.append(f"compatibility_flags = [{flags}]")

        if self.config.node_compat:
            lines.append('node_compat = true')

        lines.append("")

        # Variables
        if self.config.vars:
            lines.append("[vars]")
            for key, value in self.config.vars.items():
                lines.append(f'{key} = "{value}"')
            lines.append("")

        # Triggers (cron)
        if self.config.cron_triggers:
            lines.append("[triggers]")
            crons = ", ".join([f'"{t.cron_expression}"' for t in self.config.cron_triggers])
            lines.append(f"crons = [{crons}]")
            lines.append("")

        # Routes
        if self.config.routes:
            lines.append("# Routes")
            for route in self.config.routes:
                lines.append("[[routes]]")
                lines.append(f'pattern = "{route.pattern}"')
                if route.zone_name:
                    lines.append(f'zone_name = "{route.zone_name}"')
                if route.custom_domain:
                    lines.append(f'custom_domain = "{route.custom_domain}"')
            lines.append("")

        # Bindings
        self._add_bindings(lines)

        # Environment-specific config
        if environment and environment != Environment.PRODUCTION:
            lines.append(f"[env.{environment.value}]")
            lines.append(f'name = "{self.config.name}-{environment.value}"')

        return "\n".join(lines)

    def _add_bindings(self, lines: list[str]) -> None:
        """Add binding configurations to lines."""
        # Group bindings by type
        bindings_by_type: dict[BindingType, list[BindingConfig]] = {}
        for binding in self.config.bindings:
            if binding.binding_type not in bindings_by_type:
                bindings_by_type[binding.binding_type] = []
            bindings_by_type[binding.binding_type].append(binding)

        # KV Namespaces
        if BindingType.KV in bindings_by_type:
            lines.append("# KV Namespaces")
            for binding in bindings_by_type[BindingType.KV]:
                lines.append("[[kv_namespaces]]")
                lines.append(f'binding = "{binding.name}"')
                lines.append(f'id = "{binding.id or "<namespace_id>"}"')
            lines.append("")

        # D1 Databases
        if BindingType.D1 in bindings_by_type:
            lines.append("# D1 Databases")
            for binding in bindings_by_type[BindingType.D1]:
                lines.append("[[d1_databases]]")
                lines.append(f'binding = "{binding.name}"')
                lines.append(f'database_name = "{binding.options.get("database_name", "my-db")}"')
                lines.append(f'database_id = "{binding.id or "<database_id>"}"')
            lines.append("")

        # R2 Buckets
        if BindingType.R2 in bindings_by_type:
            lines.append("# R2 Buckets")
            for binding in bindings_by_type[BindingType.R2]:
                lines.append("[[r2_buckets]]")
                lines.append(f'binding = "{binding.name}"')
                lines.append(f'bucket_name = "{binding.options.get("bucket_name", "my-bucket")}"')
            lines.append("")

        # Queues
        if BindingType.QUEUES in bindings_by_type:
            lines.append("# Queues")
            lines.append("[queues]")
            lines.append("producers = [")
            for binding in bindings_by_type[BindingType.QUEUES]:
                lines.append(f'  {{ binding = "{binding.name}", queue = "{binding.options.get("queue_name", "my-queue")}" }},')
            lines.append("]")
            lines.append("")

        # AI Binding
        if BindingType.AI in bindings_by_type:
            lines.append("# Workers AI")
            for binding in bindings_by_type[BindingType.AI]:
                lines.append("[ai]")
                lines.append(f'binding = "{binding.name}"')
            lines.append("")


class DeploymentEngine:
    """Manages Worker deployment operations."""

    def __init__(self, config: WorkerConfig):
        self.config = config

    def get_init_commands(self) -> list[str]:
        """Get commands to initialize a new Worker project."""
        return [
            f"wrangler init {self.config.name}",
            f"cd {self.config.name}",
            "npm install",
        ]

    def get_dev_command(self, port: int = 8787) -> str:
        """Get local development command."""
        return f"wrangler dev --port {port}"

    def get_deploy_command(self, environment: Environment = Environment.PRODUCTION) -> str:
        """Get deployment command for environment."""
        if environment == Environment.DEVELOPMENT:
            return "wrangler dev"
        elif environment == Environment.PRODUCTION:
            return "wrangler deploy"
        else:
            return f"wrangler deploy --env {environment.value}"

    def get_secret_commands(self) -> list[str]:
        """Get commands to set all secrets."""
        commands = []
        for secret in self.config.secrets:
            commands.append(f"wrangler secret put {secret.name}")
        return commands

    def get_tail_command(self, format_json: bool = False) -> str:
        """Get command to stream live logs."""
        cmd = "wrangler tail"
        if format_json:
            cmd += " --format json"
        return cmd

    def get_rollback_command(self, version: str) -> str:
        """Get command to rollback to a specific version."""
        return f"wrangler rollback --version {version}"

    def get_kv_commands(self, namespace: str) -> dict[str, str]:
        """Get KV management commands."""
        return {
            "create": f"wrangler kv:namespace create {namespace}",
            "list": "wrangler kv:namespace list",
            "delete": f"wrangler kv:namespace delete --namespace-id <id>",
            "put": f"wrangler kv:key put --binding {namespace} <key> <value>",
            "get": f"wrangler kv:key get --binding {namespace} <key>",
            "delete_key": f"wrangler kv:key delete --binding {namespace} <key>",
        }

    def get_d1_commands(self, database: str) -> dict[str, str]:
        """Get D1 management commands."""
        return {
            "create": f"wrangler d1 create {database}",
            "list": "wrangler d1 list",
            "execute": f"wrangler d1 execute {database} --command '<SQL>'",
            "execute_file": f"wrangler d1 execute {database} --file schema.sql",
            "backup": f"wrangler d1 backup create {database}",
            "restore": f"wrangler d1 backup restore {database} <backup_id>",
        }

    def get_r2_commands(self, bucket: str) -> dict[str, str]:
        """Get R2 management commands."""
        return {
            "create": f"wrangler r2 bucket create {bucket}",
            "list": "wrangler r2 bucket list",
            "delete": f"wrangler r2 bucket delete {bucket}",
            "put": f"wrangler r2 object put {bucket}/<key> --file <file>",
            "get": f"wrangler r2 object get {bucket}/<key>",
            "delete_obj": f"wrangler r2 object delete {bucket}/<key>",
        }

    def generate_deployment_checklist(self) -> list[dict]:
        """Generate deployment checklist."""
        checklist = [
            {"step": "Initialize project", "command": self.get_init_commands()[0], "done": False},
            {"step": "Configure wrangler.toml", "command": "Edit wrangler.toml", "done": False},
            {"step": "Write worker code", "command": f"Edit {self.config.main_file}", "done": False},
        ]

        # Add binding setup steps
        for binding in self.config.bindings:
            if binding.binding_type == BindingType.KV:
                checklist.append({
                    "step": f"Create KV namespace: {binding.name}",
                    "command": f"wrangler kv:namespace create {binding.name}",
                    "done": False
                })
            elif binding.binding_type == BindingType.D1:
                checklist.append({
                    "step": f"Create D1 database: {binding.options.get('database_name')}",
                    "command": f"wrangler d1 create {binding.options.get('database_name')}",
                    "done": False
                })
            elif binding.binding_type == BindingType.R2:
                checklist.append({
                    "step": f"Create R2 bucket: {binding.options.get('bucket_name')}",
                    "command": f"wrangler r2 bucket create {binding.options.get('bucket_name')}",
                    "done": False
                })

        # Add secret setup steps
        for secret in self.config.secrets:
            checklist.append({
                "step": f"Set secret: {secret.name}",
                "command": f"wrangler secret put {secret.name}",
                "done": False
            })

        # Final deployment
        checklist.extend([
            {"step": "Test locally", "command": "wrangler dev", "done": False},
            {"step": "Deploy to production", "command": "wrangler deploy", "done": False},
            {"step": "Verify deployment", "command": "wrangler tail", "done": False},
        ])

        return checklist


class APIBuilder:
    """Builds REST API handlers for Workers."""

    def __init__(self, base_path: str = "/api"):
        self.base_path = base_path
        self.endpoints: list[dict] = []

    def add_endpoint(
        self,
        path: str,
        method: str,
        handler_name: str,
        description: str = ""
    ) -> "APIBuilder":
        """Add an API endpoint."""
        self.endpoints.append({
            "path": f"{self.base_path}{path}",
            "method": method.upper(),
            "handler": handler_name,
            "description": description
        })
        return self

    def add_crud(self, resource: str, handler_prefix: str = "") -> "APIBuilder":
        """Add CRUD endpoints for a resource."""
        prefix = handler_prefix or resource
        self.endpoints.extend([
            {"path": f"{self.base_path}/{resource}", "method": "GET", "handler": f"list{prefix.title()}", "description": f"List all {resource}"},
            {"path": f"{self.base_path}/{resource}", "method": "POST", "handler": f"create{prefix.title()}", "description": f"Create new {resource[:-1] if resource.endswith('s') else resource}"},
            {"path": f"{self.base_path}/{resource}/:id", "method": "GET", "handler": f"get{prefix.title()}", "description": f"Get {resource[:-1] if resource.endswith('s') else resource} by ID"},
            {"path": f"{self.base_path}/{resource}/:id", "method": "PUT", "handler": f"update{prefix.title()}", "description": f"Update {resource[:-1] if resource.endswith('s') else resource}"},
            {"path": f"{self.base_path}/{resource}/:id", "method": "DELETE", "handler": f"delete{prefix.title()}", "description": f"Delete {resource[:-1] if resource.endswith('s') else resource}"},
        ])
        return self

    def generate_router(self) -> str:
        """Generate complete API router code."""
        # Build route matching
        route_matches = []
        for endpoint in self.endpoints:
            path_pattern = endpoint["path"].replace(":id", "(?<id>[^/]+)")
            route_matches.append(f'''  // {endpoint["description"]}
  if (request.method === '{endpoint["method"]}' && url.pathname.match(/^{path_pattern}$/)) {{
    return {endpoint["handler"]}(request, env, ctx);
  }}''')

        routes_code = "\n\n".join(route_matches)

        return f'''// API Router
export async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {{
  const url = new URL(request.url);

{routes_code}

  return new Response(JSON.stringify({{ error: 'Not Found' }}), {{
    status: 404,
    headers: {{ 'Content-Type': 'application/json' }}
  }});
}}'''

    def generate_handler_stubs(self) -> str:
        """Generate handler function stubs."""
        handlers = []
        unique_handlers = set()

        for endpoint in self.endpoints:
            handler = endpoint["handler"]
            if handler not in unique_handlers:
                unique_handlers.add(handler)
                handlers.append(f'''// {endpoint["description"]}
async function {handler}(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {{
  // TODO: Implement {handler}
  return new Response(JSON.stringify({{ message: '{handler} not implemented' }}), {{
    status: 501,
    headers: {{ 'Content-Type': 'application/json' }}
  }});
}}''')

        return "\n\n".join(handlers)


class DurableObjectBuilder:
    """Builds Durable Object classes."""

    def __init__(self, class_name: str):
        self.class_name = class_name
        self.state_fields: list[dict] = []
        self.methods: list[dict] = []

    def add_state_field(self, name: str, type_str: str, default: str = "") -> "DurableObjectBuilder":
        """Add a state field."""
        self.state_fields.append({
            "name": name,
            "type": type_str,
            "default": default
        })
        return self

    def add_method(self, name: str, params: str, return_type: str, body: str = "") -> "DurableObjectBuilder":
        """Add a method."""
        self.methods.append({
            "name": name,
            "params": params,
            "return_type": return_type,
            "body": body
        })
        return self

    def generate_class(self) -> str:
        """Generate Durable Object class code."""
        # State interface
        state_fields = "\n".join([
            f"  {f['name']}: {f['type']};" for f in self.state_fields
        ])

        # Constructor initialization
        init_fields = "\n    ".join([
            f"this.{f['name']} = {f['default'] or f'undefined as any'};"
            for f in self.state_fields
        ])

        # Methods
        methods_code = []
        for method in self.methods:
            methods_code.append(f'''  async {method["name"]}({method["params"]}): Promise<{method["return_type"]}> {{
    {method["body"] or "// TODO: Implement"}
  }}''')

        methods_str = "\n\n".join(methods_code)

        return f'''interface {self.class_name}State {{
{state_fields}
}}

export class {self.class_name} implements DurableObject {{
  private state: DurableObjectState;
  private env: Env;

  // State fields
{chr(10).join([f"  private {f['name']}: {f['type']};" for f in self.state_fields])}

  constructor(state: DurableObjectState, env: Env) {{
    this.state = state;
    this.env = env;
    {init_fields}

    // Load state from storage
    this.state.blockConcurrencyWhile(async () => {{
      const stored = await this.state.storage.get<{self.class_name}State>('state');
      if (stored) {{
        {chr(10).join([f"this.{f['name']} = stored.{f['name']};" for f in self.state_fields])}
      }}
    }});
  }}

  async fetch(request: Request): Promise<Response> {{
    const url = new URL(request.url);

    // Route handling for Durable Object
    switch (url.pathname) {{
      default:
        return new Response('Not Found', {{ status: 404 }});
    }}
  }}

{methods_str}

  private async saveState(): Promise<void> {{
    await this.state.storage.put('state', {{
      {", ".join([f"{f['name']}: this.{f['name']}" for f in self.state_fields])}
    }});
  }}
}}'''


# ════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Dashboard Generation
# ════════════════════════════════════════════════════════════════════════════

class WorkersReporter:
    """Generates ASCII dashboards for Workers."""

    def __init__(self, config: WorkerConfig):
        self.config = config

    def generate_overview(self) -> str:
        """Generate worker overview dashboard."""
        bindings_count = len(self.config.bindings)
        secrets_count = len(self.config.secrets)
        routes_count = len(self.config.routes)
        crons_count = len(self.config.cron_triggers)

        return f'''
╔═══════════════════════════════════════════════════════════════════════════╗
║                     CLOUDFLARE WORKER SPECIFICATION                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Worker: {self.config.name:<58} ║
║  Type: {self.config.worker_type.value:<60} ║
║  Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S"):<55} ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                          WORKER STATUS                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │  Name: {self.config.name:<57}  │  ║
║  │  Type: {self.config.worker_type.value:<57}  │  ║
║  │  Main: {self.config.main_file:<57}  │  ║
║  │  Runtime: {self.config.compatibility_date:<54}  │  ║
║  │                                                                     │  ║
║  │  Routes: {routes_count:<8}  Bindings: {bindings_count:<8}  Secrets: {secrets_count:<8}  │  ║
║  │  Cron Triggers: {crons_count:<8}                                       │  ║
║  │                                                                     │  ║
║  │  Status: ● Ready for Development                                   │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝'''

    def generate_bindings_report(self) -> str:
        """Generate bindings configuration report."""
        lines = [
            "╔═══════════════════════════════════════════════════════════════════════════╗",
            "║                          CONFIGURED BINDINGS                              ║",
            "╠═══════════════════════════════════════════════════════════════════════════╣"
        ]

        if not self.config.bindings:
            lines.append("║  No bindings configured                                                   ║")
        else:
            # Group by type
            by_type: dict[BindingType, list[BindingConfig]] = {}
            for b in self.config.bindings:
                if b.binding_type not in by_type:
                    by_type[b.binding_type] = []
                by_type[b.binding_type].append(b)

            for btype, bindings in by_type.items():
                lines.append(f"║  {btype.name}:".ljust(74) + "║")
                for b in bindings:
                    lines.append(f"║    • {b.name:<65} ║")
                lines.append("║                                                                           ║")

        lines.append("╚═══════════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    def generate_routes_report(self) -> str:
        """Generate routes configuration report."""
        lines = [
            "╔═══════════════════════════════════════════════════════════════════════════╗",
            "║                          ROUTE CONFIGURATION                              ║",
            "╠═══════════════════════════════════════════════════════════════════════════╣",
            "║  Pattern                              │ Zone          │ Type              ║",
            "╠───────────────────────────────────────┼───────────────┼───────────────────╣"
        ]

        if not self.config.routes:
            lines.append("║  No routes configured (using workers.dev subdomain)                       ║")
        else:
            for route in self.config.routes:
                pattern = route.pattern[:36].ljust(36)
                zone = (route.zone_name or "-")[:12].ljust(12)
                match_type = route.match_type.value[:16].ljust(16)
                lines.append(f"║  {pattern}  │ {zone}  │ {match_type} ║")

        lines.append("╚═══════════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    def generate_deployment_checklist(self) -> str:
        """Generate deployment checklist."""
        engine = DeploymentEngine(self.config)
        checklist = engine.generate_deployment_checklist()

        lines = [
            "╔═══════════════════════════════════════════════════════════════════════════╗",
            "║                         DEPLOYMENT CHECKLIST                              ║",
            "╠═══════════════════════════════════════════════════════════════════════════╣"
        ]

        for item in checklist:
            status = "●" if item["done"] else "○"
            step = item["step"][:65].ljust(65)
            lines.append(f"║  [{status}] {step} ║")

        lines.append("╠═══════════════════════════════════════════════════════════════════════════╣")
        lines.append("║  ● Complete  ○ Pending                                                    ║")
        lines.append("╚═══════════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    def generate_commands_reference(self) -> str:
        """Generate wrangler commands reference."""
        engine = DeploymentEngine(self.config)

        lines = [
            "╔═══════════════════════════════════════════════════════════════════════════╗",
            "║                         WRANGLER COMMANDS                                 ║",
            "╠═══════════════════════════════════════════════════════════════════════════╣",
            "║  DEVELOPMENT                                                              ║",
            f"║    wrangler dev                      Start local dev server               ║",
            f"║    wrangler tail                     Stream live logs                     ║",
            "║                                                                           ║",
            "║  DEPLOYMENT                                                               ║",
            f"║    wrangler deploy                   Deploy to production                 ║",
            f"║    wrangler deploy --env staging     Deploy to staging                    ║",
            "║                                                                           ║",
            "║  SECRETS                                                                  ║"
        ]

        for secret in self.config.secrets:
            cmd = f"wrangler secret put {secret.name}"
            lines.append(f"║    {cmd:<67} ║")

        lines.append("╚═══════════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    def generate_full_report(self) -> str:
        """Generate complete worker report."""
        sections = [
            self.generate_overview(),
            "",
            self.generate_bindings_report(),
            "",
            self.generate_routes_report(),
            "",
            self.generate_deployment_checklist(),
            "",
            self.generate_commands_reference()
        ]
        return "\n".join(sections)


# ════════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ════════════════════════════════════════════════════════════════════════════

class CloudflareWorkersEngine:
    """Main orchestrator for Cloudflare Workers development."""

    def __init__(self, config: Optional[WorkerConfig] = None):
        self.config = config

    def create_worker(self, name: str, worker_type: WorkerType = WorkerType.FETCH) -> WorkerConfig:
        """Create a new worker configuration."""
        self.config = WorkerConfig(name=name, worker_type=worker_type)
        return self.config

    def create_api_worker(self, name: str) -> WorkerConfig:
        """Create an API-focused worker."""
        self.config = WorkerConfig.api_worker(name)
        return self.config

    def create_scheduled_worker(self, name: str, schedule: str) -> WorkerConfig:
        """Create a scheduled worker."""
        self.config = WorkerConfig.scheduled_worker(name, schedule)
        return self.config

    def create_queue_worker(self, name: str, queue_name: str) -> WorkerConfig:
        """Create a queue processor worker."""
        self.config = WorkerConfig.queue_processor(name, queue_name)
        return self.config

    def create_full_stack_worker(self, name: str) -> WorkerConfig:
        """Create a full-stack worker with common bindings."""
        self.config = WorkerConfig.full_stack_worker(name)
        return self.config

    def generate_project_files(self) -> dict[str, str]:
        """Generate all project files."""
        if not self.config:
            raise ValueError("No worker configuration set")

        architect = WorkerArchitect(self.config)
        wrangler_gen = WranglerConfigGenerator(self.config)

        files = {
            "wrangler.toml": wrangler_gen.generate_toml(),
            "src/index.ts": architect.generate_complete_worker(),
        }

        # Add package.json
        files["package.json"] = json.dumps({
            "name": self.config.name,
            "version": "1.0.0",
            "private": True,
            "scripts": {
                "dev": "wrangler dev",
                "deploy": "wrangler deploy",
                "tail": "wrangler tail"
            },
            "devDependencies": {
                "@cloudflare/workers-types": "^4.20240117.0",
                "typescript": "^5.3.3",
                "wrangler": "^3.22.4"
            }
        }, indent=2)

        # Add tsconfig.json
        files["tsconfig.json"] = json.dumps({
            "compilerOptions": {
                "target": "ES2021",
                "module": "ES2022",
                "moduleResolution": "node",
                "lib": ["ES2021"],
                "types": ["@cloudflare/workers-types"],
                "strict": true,
                "noEmit": true,
                "skipLibCheck": True
            },
            "include": ["src/**/*"]
        }, indent=2)

        return files

    def generate_report(self) -> str:
        """Generate worker specification report."""
        if not self.config:
            raise ValueError("No worker configuration set")

        reporter = WorkersReporter(self.config)
        return reporter.generate_full_report()


# ════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════

def create_parser() -> argparse.ArgumentParser:
    """Create argument parser."""
    parser = argparse.ArgumentParser(
        prog="cloudflare-workers",
        description="CLOUDFLARE.WORKERS.EXE - Serverless Edge Computing Specialist"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create new worker")
    create_parser.add_argument("name", help="Worker name")
    create_parser.add_argument(
        "--type",
        choices=[t.value for t in WorkerType],
        default="fetch",
        help="Worker type"
    )
    create_parser.add_argument("--api", action="store_true", help="Create API worker")
    create_parser.add_argument("--scheduled", help="Create scheduled worker with cron")
    create_parser.add_argument("--queue", help="Create queue processor for queue name")
    create_parser.add_argument("--full-stack", action="store_true", help="Create full-stack worker")

    # Binding command
    binding_parser = subparsers.add_parser("binding", help="Add binding")
    binding_parser.add_argument(
        "type",
        choices=[b.value for b in BindingType],
        help="Binding type"
    )
    binding_parser.add_argument("name", help="Binding name")
    binding_parser.add_argument("--id", help="Resource ID")

    # Route command
    route_parser = subparsers.add_parser("route", help="Add route")
    route_parser.add_argument("pattern", help="Route pattern")
    route_parser.add_argument("--zone", help="Zone name")
    route_parser.add_argument("--custom-domain", help="Custom domain")

    # Deploy command
    deploy_parser = subparsers.add_parser("deploy", help="Generate deployment config")
    deploy_parser.add_argument(
        "--env",
        choices=[e.value for e in Environment],
        default="production",
        help="Deployment environment"
    )

    # Types command
    subparsers.add_parser("types", help="List worker types")

    # Bindings command
    subparsers.add_parser("bindings", help="List binding types")

    # Demo command
    subparsers.add_parser("demo", help="Show example output")

    return parser


def main():
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args()

    engine = CloudflareWorkersEngine()

    if args.command == "create":
        if args.api:
            engine.create_api_worker(args.name)
        elif args.scheduled:
            engine.create_scheduled_worker(args.name, args.scheduled)
        elif args.queue:
            engine.create_queue_worker(args.name, args.queue)
        elif args.full_stack:
            engine.create_full_stack_worker(args.name)
        else:
            worker_type = WorkerType(args.type)
            engine.create_worker(args.name, worker_type)

        print(engine.generate_report())
        print("\n--- Generated Files ---\n")
        for filename, content in engine.generate_project_files().items():
            print(f"=== {filename} ===")
            print(content)
            print()

    elif args.command == "types":
        print("\n=== WORKER TYPES ===\n")
        for wt in WorkerType:
            print(f"{wt.value.upper()}")
            print(f"  Event: {wt.event_type}")
            print(f"  Use Cases: {', '.join(wt.use_cases)}")
            print(f"  Handler: {wt.handler_signature}")
            print()

    elif args.command == "bindings":
        print("\n=== BINDING TYPES ===\n")
        for bt in BindingType:
            print(f"{bt.name}")
            print(f"  Key: {bt.wrangler_key}")
            print(f"  TypeScript: {bt.typescript_type}")
            print(f"  Description: {bt.description}")
            print()

    elif args.command == "demo":
        # Demo with full-stack worker
        engine.create_full_stack_worker("my-api")
        engine.config.add_route(RouteConfig("api.example.com/*", "example.com"))
        engine.config.add_cron(CronTrigger.daily(hour=6))
        print(engine.generate_report())

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/cloudflare-workers create [name]` - Initialize new worker
- `/cloudflare-workers create [name] --api` - Create API worker with D1 + KV
- `/cloudflare-workers create [name] --scheduled "0 * * * *"` - Create scheduled worker
- `/cloudflare-workers create [name] --queue [queue-name]` - Create queue processor
- `/cloudflare-workers create [name] --full-stack` - Create full-stack worker
- `/cloudflare-workers types` - List all worker types
- `/cloudflare-workers bindings` - List all binding types
- `/cloudflare-workers demo` - Show example output

## WORKFLOW

### Phase 1: DESIGN
1. Define worker purpose and type
2. Plan route structure
3. Identify required bindings
4. Design data flow
5. Set performance targets

### Phase 2: DEVELOP
1. Initialize with Wrangler
2. Write handler logic
3. Configure bindings
4. Implement middleware
5. Add error handling

### Phase 3: TEST
1. Run local dev server
2. Test route matching
3. Validate bindings
4. Check edge cases
5. Performance profiling

### Phase 4: DEPLOY
1. Configure environments
2. Set secrets and vars
3. Deploy to staging
4. Validate production
5. Monitor metrics

$ARGUMENTS
