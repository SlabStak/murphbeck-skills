# CLOUDFLARE.PAGES.EXE - Full-Stack Deployment Specialist

You are CLOUDFLARE.PAGES.EXE — the full-stack deployment specialist that builds and deploys web applications on Cloudflare Pages with Functions, framework support, and seamless integration with Workers ecosystem bindings.

MISSION
Deploy applications. Enable functions. Scale globally.

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
CLOUDFLARE.PAGES.EXE - Full-Stack Deployment Specialist
Deploy applications. Enable functions. Scale globally.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Set
from enum import Enum
from datetime import datetime
import json
import argparse


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS - Framework, Routing, Binding, and Deployment Types
# ═══════════════════════════════════════════════════════════════════════════════

class Framework(Enum):
    """Supported frontend frameworks with build configuration."""
    NEXTJS = "nextjs"
    NUXT = "nuxt"
    ASTRO = "astro"
    SVELTEKIT = "sveltekit"
    REMIX = "remix"
    REACT_VITE = "react-vite"
    VUE_VITE = "vue-vite"
    SOLID_START = "solid-start"
    QWIK = "qwik"
    ANGULAR = "angular"
    GATSBY = "gatsby"
    ELEVENTY = "eleventy"
    HUGO = "hugo"
    STATIC = "static"

    @property
    def build_command(self) -> str:
        """Default build command for the framework."""
        commands = {
            "nextjs": "next build",
            "nuxt": "nuxt build",
            "astro": "astro build",
            "sveltekit": "vite build",
            "remix": "remix build",
            "react-vite": "vite build",
            "vue-vite": "vite build",
            "solid-start": "solid-start build",
            "qwik": "qwik build",
            "angular": "ng build",
            "gatsby": "gatsby build",
            "eleventy": "eleventy",
            "hugo": "hugo",
            "static": ""
        }
        return commands.get(self.value, "npm run build")

    @property
    def output_directory(self) -> str:
        """Default output directory for build artifacts."""
        dirs = {
            "nextjs": ".next",
            "nuxt": ".output",
            "astro": "dist",
            "sveltekit": "build",
            "remix": "public",
            "react-vite": "dist",
            "vue-vite": "dist",
            "solid-start": ".output",
            "qwik": "dist",
            "angular": "dist/browser",
            "gatsby": "public",
            "eleventy": "_site",
            "hugo": "public",
            "static": "."
        }
        return dirs.get(self.value, "dist")

    @property
    def requires_adapter(self) -> bool:
        """Whether the framework requires a Cloudflare adapter."""
        return self.value in ["nextjs", "nuxt", "sveltekit", "solid-start", "qwik"]

    @property
    def adapter_package(self) -> Optional[str]:
        """NPM package for the Cloudflare adapter."""
        adapters = {
            "nextjs": "@cloudflare/next-on-pages",
            "nuxt": "nitro-preset-cloudflare-pages",
            "sveltekit": "@sveltejs/adapter-cloudflare",
            "solid-start": "solid-start-cloudflare-pages",
            "qwik": "@builder.io/qwik-city/adapters/cloudflare-pages/vite"
        }
        return adapters.get(self.value)

    @property
    def supports_ssr(self) -> bool:
        """Whether the framework supports server-side rendering."""
        return self.value in ["nextjs", "nuxt", "sveltekit", "remix", "solid-start", "qwik", "astro"]


class RouteType(Enum):
    """Types of Pages Functions routes."""
    STATIC = "static"
    DYNAMIC = "dynamic"
    CATCH_ALL = "catch_all"
    OPTIONAL_CATCH_ALL = "optional_catch_all"
    MIDDLEWARE = "middleware"

    @property
    def path_pattern(self) -> str:
        """Path pattern syntax for the route type."""
        patterns = {
            "static": "/api/endpoint",
            "dynamic": "/api/[param]",
            "catch_all": "/api/[...path]",
            "optional_catch_all": "/api/[[path]]",
            "middleware": "/_middleware"
        }
        return patterns.get(self.value, "/")

    @property
    def file_naming(self) -> str:
        """File naming convention for the route type."""
        names = {
            "static": "endpoint.ts",
            "dynamic": "[param].ts",
            "catch_all": "[...path].ts",
            "optional_catch_all": "[[path]].ts",
            "middleware": "_middleware.ts"
        }
        return names.get(self.value, "index.ts")

    @property
    def example_usage(self) -> str:
        """Example usage description."""
        examples = {
            "static": "Fixed routes like /api/health, /api/users",
            "dynamic": "Dynamic segments like /api/users/[id]",
            "catch_all": "Catch remaining path like /api/files/[...path]",
            "optional_catch_all": "Optional catch-all like /api/[[slug]]",
            "middleware": "Request/response interceptors"
        }
        return examples.get(self.value, "")


class BindingType(Enum):
    """Types of Cloudflare bindings available in Pages."""
    KV = "kv"
    D1 = "d1"
    R2 = "r2"
    DURABLE_OBJECTS = "durable_objects"
    SERVICE = "service"
    AI = "ai"
    VECTORIZE = "vectorize"
    QUEUES = "queues"
    HYPERDRIVE = "hyperdrive"
    BROWSER = "browser"
    ANALYTICS = "analytics"
    SECRETS = "secrets"
    VARS = "vars"

    @property
    def wrangler_config_key(self) -> str:
        """Configuration key in wrangler.toml."""
        keys = {
            "kv": "kv_namespaces",
            "d1": "d1_databases",
            "r2": "r2_buckets",
            "durable_objects": "durable_objects",
            "service": "services",
            "ai": "ai",
            "vectorize": "vectorize",
            "queues": "queues",
            "hyperdrive": "hyperdrive",
            "browser": "browser",
            "analytics": "analytics_engine_datasets",
            "secrets": "secrets",
            "vars": "vars"
        }
        return keys.get(self.value, self.value)

    @property
    def typescript_type(self) -> str:
        """TypeScript type for the binding."""
        types = {
            "kv": "KVNamespace",
            "d1": "D1Database",
            "r2": "R2Bucket",
            "durable_objects": "DurableObjectNamespace",
            "service": "Fetcher",
            "ai": "Ai",
            "vectorize": "VectorizeIndex",
            "queues": "Queue",
            "hyperdrive": "Hyperdrive",
            "browser": "Browser",
            "analytics": "AnalyticsEngineDataset",
            "secrets": "string",
            "vars": "string"
        }
        return types.get(self.value, "unknown")

    @property
    def is_array_config(self) -> bool:
        """Whether the binding is configured as an array in TOML."""
        return self.value in ["kv", "d1", "r2", "durable_objects", "service", "vectorize", "queues", "hyperdrive", "analytics"]


class HTTPMethod(Enum):
    """HTTP methods supported in Pages Functions."""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    HEAD = "HEAD"
    OPTIONS = "OPTIONS"
    ALL = "ALL"

    @property
    def handler_name(self) -> str:
        """Handler function name for the method."""
        if self.value == "ALL":
            return "onRequest"
        return f"onRequest{self.value.capitalize()}"

    @property
    def is_safe(self) -> bool:
        """Whether the method is considered safe (no side effects)."""
        return self.value in ["GET", "HEAD", "OPTIONS"]

    @property
    def allows_body(self) -> bool:
        """Whether the method typically has a request body."""
        return self.value in ["POST", "PUT", "PATCH"]


class DeploymentType(Enum):
    """Types of Pages deployments."""
    PREVIEW = "preview"
    PRODUCTION = "production"
    ALIAS = "alias"
    BRANCH = "branch"

    @property
    def is_permanent(self) -> bool:
        """Whether the deployment URL is permanent."""
        return self.value in ["production", "alias"]

    @property
    def url_pattern(self) -> str:
        """URL pattern for the deployment type."""
        patterns = {
            "preview": "{commit}.{project}.pages.dev",
            "production": "{project}.pages.dev",
            "alias": "{alias}.{project}.pages.dev",
            "branch": "{branch}.{project}.pages.dev"
        }
        return patterns.get(self.value, "")


class NodeVersion(Enum):
    """Supported Node.js versions for Pages builds."""
    NODE_16 = "16"
    NODE_18 = "18"
    NODE_20 = "20"
    NODE_22 = "22"

    @property
    def is_lts(self) -> bool:
        """Whether this is an LTS version."""
        return self.value in ["18", "20", "22"]

    @property
    def is_recommended(self) -> bool:
        """Whether this is the recommended version."""
        return self.value == "20"


# ═══════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Configuration and Structure Definitions
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class FunctionRoute:
    """Represents a Pages Function route."""
    path: str
    route_type: RouteType
    methods: List[HTTPMethod] = field(default_factory=lambda: [HTTPMethod.ALL])
    description: str = ""
    bindings: List[str] = field(default_factory=list)
    middleware: bool = False

    @classmethod
    def api_endpoint(cls, name: str, methods: List[HTTPMethod] = None, description: str = "") -> "FunctionRoute":
        """Create a static API endpoint route."""
        return cls(
            path=f"/api/{name}",
            route_type=RouteType.STATIC,
            methods=methods or [HTTPMethod.GET, HTTPMethod.POST],
            description=description
        )

    @classmethod
    def dynamic_resource(cls, resource: str, param: str = "id") -> "FunctionRoute":
        """Create a dynamic resource route."""
        return cls(
            path=f"/api/{resource}/[{param}]",
            route_type=RouteType.DYNAMIC,
            methods=[HTTPMethod.GET, HTTPMethod.PUT, HTTPMethod.DELETE],
            description=f"Single {resource} resource by {param}"
        )

    @classmethod
    def catch_all_api(cls, prefix: str = "api") -> "FunctionRoute":
        """Create a catch-all API route."""
        return cls(
            path=f"/{prefix}/[[path]]",
            route_type=RouteType.OPTIONAL_CATCH_ALL,
            methods=[HTTPMethod.ALL],
            description=f"Catch-all for {prefix} routes"
        )

    @classmethod
    def global_middleware(cls) -> "FunctionRoute":
        """Create global middleware route."""
        return cls(
            path="/_middleware",
            route_type=RouteType.MIDDLEWARE,
            methods=[HTTPMethod.ALL],
            description="Global request/response middleware",
            middleware=True
        )

    def to_file_path(self) -> str:
        """Convert route to file path in functions directory."""
        path = self.path.replace("/api/", "functions/api/")
        if self.middleware:
            return path.replace("/_middleware", "/_middleware.ts")

        # Handle dynamic segments
        if "[" in path:
            parts = path.split("/")
            return "/".join(parts[:-1]) + "/" + parts[-1] + ".ts"

        return path + ".ts" if not path.endswith(".ts") else path


@dataclass
class BindingConfig:
    """Configuration for a Cloudflare binding."""
    name: str
    binding_type: BindingType
    resource_id: str = ""
    preview_id: str = ""
    options: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def kv_namespace(cls, binding_name: str, namespace_id: str, preview_id: str = "") -> "BindingConfig":
        """Create a KV namespace binding."""
        return cls(
            name=binding_name,
            binding_type=BindingType.KV,
            resource_id=namespace_id,
            preview_id=preview_id or f"{namespace_id}_preview"
        )

    @classmethod
    def d1_database(cls, binding_name: str, database_name: str, database_id: str) -> "BindingConfig":
        """Create a D1 database binding."""
        return cls(
            name=binding_name,
            binding_type=BindingType.D1,
            resource_id=database_id,
            options={"database_name": database_name}
        )

    @classmethod
    def r2_bucket(cls, binding_name: str, bucket_name: str, preview_bucket: str = "") -> "BindingConfig":
        """Create an R2 bucket binding."""
        return cls(
            name=binding_name,
            binding_type=BindingType.R2,
            resource_id=bucket_name,
            preview_id=preview_bucket or f"{bucket_name}-preview"
        )

    @classmethod
    def ai_binding(cls, binding_name: str = "AI") -> "BindingConfig":
        """Create an AI binding."""
        return cls(
            name=binding_name,
            binding_type=BindingType.AI
        )

    @classmethod
    def vectorize_index(cls, binding_name: str, index_name: str) -> "BindingConfig":
        """Create a Vectorize index binding."""
        return cls(
            name=binding_name,
            binding_type=BindingType.VECTORIZE,
            resource_id=index_name
        )

    def to_wrangler_config(self) -> Dict[str, Any]:
        """Convert to wrangler.toml configuration."""
        config = {"binding": self.name}

        if self.binding_type == BindingType.KV:
            config["id"] = self.resource_id
            if self.preview_id:
                config["preview_id"] = self.preview_id
        elif self.binding_type == BindingType.D1:
            config["database_id"] = self.resource_id
            if "database_name" in self.options:
                config["database_name"] = self.options["database_name"]
        elif self.binding_type == BindingType.R2:
            config["bucket_name"] = self.resource_id
            if self.preview_id:
                config["preview_bucket_name"] = self.preview_id
        elif self.binding_type == BindingType.VECTORIZE:
            config["index_name"] = self.resource_id

        return config


@dataclass
class BuildConfig:
    """Build configuration for a Pages project."""
    framework: Framework
    build_command: str = ""
    output_directory: str = ""
    root_directory: str = "/"
    node_version: NodeVersion = NodeVersion.NODE_20
    environment_variables: Dict[str, str] = field(default_factory=dict)
    install_command: str = "npm install"

    def __post_init__(self):
        if not self.build_command:
            self.build_command = self.framework.build_command
        if not self.output_directory:
            self.output_directory = self.framework.output_directory

    @classmethod
    def nextjs_app(cls, node_version: NodeVersion = NodeVersion.NODE_20) -> "BuildConfig":
        """Create Next.js app build config."""
        return cls(
            framework=Framework.NEXTJS,
            build_command="npx @cloudflare/next-on-pages@1",
            output_directory=".vercel/output/static",
            node_version=node_version,
            environment_variables={"NODE_ENV": "production"}
        )

    @classmethod
    def astro_site(cls, ssr: bool = False) -> "BuildConfig":
        """Create Astro site build config."""
        return cls(
            framework=Framework.ASTRO,
            build_command="astro build",
            output_directory="dist",
            environment_variables={"SSR": str(ssr).lower()}
        )

    @classmethod
    def vite_spa(cls, framework: Framework = Framework.REACT_VITE) -> "BuildConfig":
        """Create Vite SPA build config."""
        return cls(
            framework=framework,
            build_command="vite build",
            output_directory="dist"
        )


@dataclass
class PagesProject:
    """Complete Pages project configuration."""
    name: str
    build_config: BuildConfig
    routes: List[FunctionRoute] = field(default_factory=list)
    bindings: List[BindingConfig] = field(default_factory=list)
    custom_domains: List[str] = field(default_factory=list)
    compatibility_date: str = "2024-01-01"
    compatibility_flags: List[str] = field(default_factory=list)

    @classmethod
    def fullstack_app(cls, name: str, framework: Framework = Framework.NEXTJS) -> "PagesProject":
        """Create a full-stack Pages application."""
        build = BuildConfig.nextjs_app() if framework == Framework.NEXTJS else BuildConfig(framework=framework)

        return cls(
            name=name,
            build_config=build,
            routes=[
                FunctionRoute.global_middleware(),
                FunctionRoute.api_endpoint("health", [HTTPMethod.GET], "Health check"),
                FunctionRoute.api_endpoint("users", [HTTPMethod.GET, HTTPMethod.POST], "User management"),
                FunctionRoute.dynamic_resource("users")
            ],
            bindings=[
                BindingConfig.d1_database("DB", f"{name}-db", ""),
                BindingConfig.kv_namespace("CACHE", ""),
                BindingConfig.ai_binding()
            ]
        )

    @classmethod
    def static_site(cls, name: str, framework: Framework = Framework.ASTRO) -> "PagesProject":
        """Create a static site project."""
        return cls(
            name=name,
            build_config=BuildConfig(framework=framework),
            routes=[],
            bindings=[]
        )

    @classmethod
    def api_only(cls, name: str) -> "PagesProject":
        """Create an API-only project (no frontend build)."""
        return cls(
            name=name,
            build_config=BuildConfig(framework=Framework.STATIC, build_command="", output_directory="public"),
            routes=[
                FunctionRoute.global_middleware(),
                FunctionRoute.catch_all_api()
            ],
            bindings=[]
        )


@dataclass
class MiddlewareConfig:
    """Configuration for Pages middleware."""
    name: str
    scope: str = "/*"
    cors_enabled: bool = True
    cors_origins: List[str] = field(default_factory=lambda: ["*"])
    cors_methods: List[str] = field(default_factory=lambda: ["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    auth_enabled: bool = False
    auth_header: str = "Authorization"
    rate_limit_enabled: bool = False
    rate_limit_requests: int = 100
    rate_limit_window: int = 60
    logging_enabled: bool = True
    custom_headers: Dict[str, str] = field(default_factory=dict)


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Code Generation and Configuration
# ═══════════════════════════════════════════════════════════════════════════════

class PagesArchitect:
    """Architect for Pages project structure and configuration."""

    def __init__(self, project: PagesProject):
        self.project = project

    def generate_wrangler_config(self) -> str:
        """Generate wrangler.toml configuration."""
        config_lines = [
            f'name = "{self.project.name}"',
            f'pages_build_output_dir = "./{self.project.build_config.output_directory}"',
            f'compatibility_date = "{self.project.compatibility_date}"',
            ""
        ]

        # Add compatibility flags
        if self.project.compatibility_flags:
            flags = ", ".join(f'"{f}"' for f in self.project.compatibility_flags)
            config_lines.append(f"compatibility_flags = [{flags}]")
            config_lines.append("")

        # Group bindings by type
        binding_groups: Dict[str, List[BindingConfig]] = {}
        for binding in self.project.bindings:
            key = binding.binding_type.wrangler_config_key
            if key not in binding_groups:
                binding_groups[key] = []
            binding_groups[key].append(binding)

        # Generate binding configurations
        for config_key, bindings in binding_groups.items():
            if bindings[0].binding_type.is_array_config:
                for binding in bindings:
                    config_lines.append(f"[[{config_key}]]")
                    wrangler_config = binding.to_wrangler_config()
                    for key, value in wrangler_config.items():
                        if isinstance(value, str):
                            config_lines.append(f'{key} = "{value}"')
                        else:
                            config_lines.append(f'{key} = {value}')
                    config_lines.append("")
            elif bindings[0].binding_type == BindingType.AI:
                config_lines.append("[ai]")
                config_lines.append(f'binding = "{bindings[0].name}"')
                config_lines.append("")

        # Add environment variables
        if self.project.build_config.environment_variables:
            config_lines.append("[vars]")
            for key, value in self.project.build_config.environment_variables.items():
                config_lines.append(f'{key} = "{value}"')
            config_lines.append("")

        return "\n".join(config_lines)

    def generate_env_interface(self) -> str:
        """Generate TypeScript Env interface for bindings."""
        lines = [
            "// types/env.d.ts",
            "import type {",
            "  KVNamespace,",
            "  D1Database,",
            "  R2Bucket,",
            "  Ai,",
            "  VectorizeIndex,",
            "  Queue,",
            "  DurableObjectNamespace,",
            "  Fetcher",
            "} from '@cloudflare/workers-types';",
            "",
            "export interface Env {"
        ]

        for binding in self.project.bindings:
            ts_type = binding.binding_type.typescript_type
            lines.append(f"  {binding.name}: {ts_type};")

        lines.extend([
            "}",
            "",
            "// Re-export for use in functions",
            "export type { Env };"
        ])

        return "\n".join(lines)

    def generate_project_structure(self) -> Dict[str, str]:
        """Generate complete project file structure."""
        files = {}

        # wrangler.toml
        files["wrangler.toml"] = self.generate_wrangler_config()

        # TypeScript env types
        files["types/env.d.ts"] = self.generate_env_interface()

        # Generate function files for each route
        for route in self.project.routes:
            if route.middleware:
                files[route.to_file_path()] = self._generate_middleware()
            else:
                files[route.to_file_path()] = self._generate_function(route)

        # _routes.json for custom routing
        files["functions/_routes.json"] = self._generate_routes_json()

        return files

    def _generate_function(self, route: FunctionRoute) -> str:
        """Generate a Pages Function handler."""
        lines = [
            "// " + route.to_file_path(),
            "import type { PagesFunction } from '@cloudflare/workers-types';",
            "import type { Env } from '../types/env';",
            ""
        ]

        for method in route.methods:
            handler_name = method.handler_name
            lines.extend([
                f"export const {handler_name}: PagesFunction<Env> = async (context) => {{",
                "  const { request, env, params } = context;",
                ""
            ])

            if method == HTTPMethod.GET:
                lines.extend([
                    "  // Handle GET request",
                    "  return Response.json({",
                    "    success: true,",
                    "    data: null,",
                    f'    message: "{route.description or "Success"}"',
                    "  });",
                ])
            elif method.allows_body:
                lines.extend([
                    "  // Parse request body",
                    "  const body = await request.json();",
                    "",
                    f"  // Handle {method.value} request",
                    "  return Response.json({",
                    "    success: true,",
                    "    data: body",
                    f"  }}, {{ status: {201 if method == HTTPMethod.POST else 200} }});",
                ])
            elif method == HTTPMethod.DELETE:
                lines.extend([
                    "  // Handle DELETE request",
                    "  return new Response(null, { status: 204 });",
                ])
            else:
                lines.extend([
                    f"  // Handle {method.value} request",
                    "  return Response.json({ success: true });",
                ])

            lines.extend(["};", ""])

        return "\n".join(lines)

    def _generate_middleware(self) -> str:
        """Generate global middleware."""
        return '''// functions/_middleware.ts
import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from './types/env';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Add request timing
  const startTime = Date.now();

  try {
    // Continue to next handler
    const response = await context.next();

    // Clone response to add headers
    const newResponse = new Response(response.body, response);

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    // Add timing header
    newResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

    return newResponse;
  } catch (error) {
    console.error('Middleware error:', error);

    return Response.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
};
'''

    def _generate_routes_json(self) -> str:
        """Generate _routes.json for custom routing."""
        routes_config = {
            "version": 1,
            "include": ["/api/*"],
            "exclude": []
        }
        return json.dumps(routes_config, indent=2)


class FunctionsBuilder:
    """Builder for Pages Functions with various patterns."""

    def __init__(self, bindings: List[BindingConfig] = None):
        self.bindings = bindings or []

    def generate_crud_api(self, resource: str, table: str) -> str:
        """Generate a complete CRUD API for a resource."""
        return f'''// functions/api/{resource}/index.ts
import type {{ PagesFunction }} from '@cloudflare/workers-types';
import type {{ Env }} from '../../types/env';

interface {resource.capitalize()} {{
  id: number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}}

// GET /api/{resource} - List all
export const onRequestGet: PagesFunction<Env> = async (context) => {{
  const {{ env, request }} = context;
  const url = new URL(request.url);

  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const {{ results }} = await env.DB
    .prepare('SELECT * FROM {table} ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<{resource.capitalize()}>();

  // Get total count
  const {{ results: countResult }} = await env.DB
    .prepare('SELECT COUNT(*) as count FROM {table}')
    .all<{{ count: number }}>();

  return Response.json({{
    data: results,
    pagination: {{
      limit,
      offset,
      total: countResult[0]?.count || 0
    }}
  }});
}};

// POST /api/{resource} - Create new
export const onRequestPost: PagesFunction<Env> = async (context) => {{
  const {{ env, request }} = context;

  try {{
    const body = await request.json();

    // Validate required fields
    if (!body || Object.keys(body).length === 0) {{
      return Response.json(
        {{ error: 'Request body is required' }},
        {{ status: 400 }}
      );
    }}

    const columns = Object.keys(body);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(body);

    const result = await env.DB
      .prepare(`INSERT INTO {table} (${{columns.join(', ')}}) VALUES (${{placeholders}})`)
      .bind(...values)
      .run();

    return Response.json(
      {{ id: result.meta.last_row_id, ...body }},
      {{ status: 201 }}
    );
  }} catch (error) {{
    console.error('Create {resource} error:', error);
    return Response.json(
      {{ error: 'Failed to create {resource}' }},
      {{ status: 500 }}
    );
  }}
}};
'''

    def generate_crud_item(self, resource: str, table: str) -> str:
        """Generate CRUD handlers for a single resource item."""
        return f'''// functions/api/{resource}/[id].ts
import type {{ PagesFunction }} from '@cloudflare/workers-types';
import type {{ Env }} from '../../types/env';

// GET /api/{resource}/:id
export const onRequestGet: PagesFunction<Env> = async (context) => {{
  const {{ env, params }} = context;
  const id = params.id;

  const item = await env.DB
    .prepare('SELECT * FROM {table} WHERE id = ?')
    .bind(id)
    .first();

  if (!item) {{
    return Response.json(
      {{ error: '{resource.capitalize()} not found' }},
      {{ status: 404 }}
    );
  }}

  return Response.json({{ data: item }});
}};

// PUT /api/{resource}/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {{
  const {{ env, params, request }} = context;
  const id = params.id;

  try {{
    const body = await request.json();

    const updates = Object.entries(body)
      .map(([key, _]) => `${{key}} = ?`)
      .join(', ');
    const values = [...Object.values(body), id];

    await env.DB
      .prepare(`UPDATE {table} SET ${{updates}}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await env.DB
      .prepare('SELECT * FROM {table} WHERE id = ?')
      .bind(id)
      .first();

    return Response.json({{ data: updated }});
  }} catch (error) {{
    console.error('Update {resource} error:', error);
    return Response.json(
      {{ error: 'Failed to update {resource}' }},
      {{ status: 500 }}
    );
  }}
}};

// DELETE /api/{resource}/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {{
  const {{ env, params }} = context;
  const id = params.id;

  const existing = await env.DB
    .prepare('SELECT id FROM {table} WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {{
    return Response.json(
      {{ error: '{resource.capitalize()} not found' }},
      {{ status: 404 }}
    );
  }}

  await env.DB
    .prepare('DELETE FROM {table} WHERE id = ?')
    .bind(id)
    .run();

  return new Response(null, {{ status: 204 }});
}};
'''

    def generate_auth_middleware(self) -> str:
        """Generate authentication middleware."""
        return '''// functions/api/_middleware.ts
import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../types/env';

interface AuthContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Extend the context with auth data
type AuthEnv = Env & { data: AuthContext };

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Skip auth for public endpoints
  const publicPaths = ['/api/health', '/api/auth/login', '/api/auth/register'];
  const path = new URL(request.url).pathname;

  if (publicPaths.some(p => path.startsWith(p))) {
    return context.next();
  }

  // Check for Authorization header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json(
      { error: 'Unauthorized', message: 'Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    // Validate token (check cache first)
    const cachedUser = await env.CACHE?.get(`token:${token}`);

    if (cachedUser) {
      context.data = { user: JSON.parse(cachedUser) };
      return context.next();
    }

    // Verify token with your auth service
    const user = await verifyToken(token, env);

    if (!user) {
      return Response.json(
        { error: 'Unauthorized', message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Cache the user
    await env.CACHE?.put(`token:${token}`, JSON.stringify(user), {
      expirationTtl: 3600
    });

    context.data = { user };
    return context.next();

  } catch (error) {
    console.error('Auth error:', error);
    return Response.json(
      { error: 'Unauthorized', message: 'Token validation failed' },
      { status: 401 }
    );
  }
};

async function verifyToken(token: string, env: Env): Promise<AuthContext['user'] | null> {
  // Implement your token verification logic here
  // This could be JWT validation, API call to auth service, etc.

  // Example: Check token in database
  const session = await env.DB?.prepare(
    'SELECT users.* FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.token = ? AND sessions.expires_at > CURRENT_TIMESTAMP'
  ).bind(token).first();

  if (!session) return null;

  return {
    id: session.id as string,
    email: session.email as string,
    role: session.role as string
  };
}
'''

    def generate_file_upload(self) -> str:
        """Generate file upload handler with R2."""
        return '''// functions/api/upload/[[path]].ts
import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../types/env';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

// POST /api/upload
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique key
    const ext = file.name.split('.').pop();
    const key = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    // Upload to R2
    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      }
    });

    // Return the URL
    const url = `https://${env.BUCKET_DOMAIN}/${key}`;

    return Response.json({
      success: true,
      data: {
        key,
        url,
        size: file.size,
        type: file.type,
        name: file.name
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
};

// GET /api/upload/:path - Get file
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path;

  if (!path) {
    return Response.json(
      { error: 'File path required' },
      { status: 400 }
    );
  }

  const object = await env.BUCKET.get(`uploads/${path}`);

  if (!object) {
    return Response.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
};

// DELETE /api/upload/:path
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path;

  if (!path) {
    return Response.json(
      { error: 'File path required' },
      { status: 400 }
    );
  }

  await env.BUCKET.delete(`uploads/${path}`);

  return new Response(null, { status: 204 });
};
'''


class DeploymentManager:
    """Manager for Pages deployments and configuration."""

    def __init__(self, project: PagesProject):
        self.project = project

    def generate_github_workflow(self) -> str:
        """Generate GitHub Actions workflow for Pages deployment."""
        return f'''# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '{self.project.build_config.node_version.value}'
          cache: 'npm'

      - name: Install dependencies
        run: {self.project.build_config.install_command}

      - name: Build
        run: {self.project.build_config.build_command}
        env:
          NODE_ENV: production

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{{{ secrets.CLOUDFLARE_API_TOKEN }}}}
          accountId: ${{{{ secrets.CLOUDFLARE_ACCOUNT_ID }}}}
          command: pages deploy {self.project.build_config.output_directory} --project-name={self.project.name}
'''

    def generate_deployment_commands(self) -> Dict[str, str]:
        """Generate deployment commands for various scenarios."""
        return {
            "local_dev": f"npx wrangler pages dev {self.project.build_config.output_directory}",
            "preview": f"npx wrangler pages deploy {self.project.build_config.output_directory} --project-name={self.project.name}",
            "production": f"npx wrangler pages deploy {self.project.build_config.output_directory} --project-name={self.project.name} --branch=main",
            "create_project": f"npx wrangler pages project create {self.project.name}",
            "list_deployments": f"npx wrangler pages deployment list --project-name={self.project.name}",
            "tail_logs": f"npx wrangler pages deployment tail --project-name={self.project.name}"
        }

    def generate_package_scripts(self) -> Dict[str, str]:
        """Generate package.json scripts for Pages development."""
        return {
            "dev": f"wrangler pages dev {self.project.build_config.output_directory}",
            "build": self.project.build_config.build_command,
            "preview": f"npm run build && wrangler pages dev {self.project.build_config.output_directory}",
            "deploy": f"npm run build && wrangler pages deploy {self.project.build_config.output_directory}",
            "deploy:preview": f"npm run build && wrangler pages deploy {self.project.build_config.output_directory} --branch=preview",
            "types": "wrangler types",
            "cf-typegen": "wrangler types --env-interface CloudflareEnv"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# REPORTER CLASS - ASCII Dashboard Generation
# ═══════════════════════════════════════════════════════════════════════════════

class PagesReporter:
    """Reporter for generating Pages project dashboards."""

    def __init__(self, project: PagesProject):
        self.project = project

    def generate_dashboard(self) -> str:
        """Generate a complete ASCII dashboard for the project."""
        sections = [
            self._header(),
            self._project_overview(),
            self._build_config(),
            self._functions_overview(),
            self._bindings_overview(),
            self._deployment_status(),
            self._checklist()
        ]
        return "\n\n".join(sections)

    def _header(self) -> str:
        """Generate dashboard header."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return f"""CLOUDFLARE PAGES SPECIFICATION
{'=' * 55}
Project: {self.project.name}
Framework: {self.project.build_config.framework.value}
Time: {timestamp}
{'=' * 55}"""

    def _project_overview(self) -> str:
        """Generate project overview section."""
        func_count = len([r for r in self.project.routes if not r.middleware])
        mw_count = len([r for r in self.project.routes if r.middleware])
        binding_count = len(self.project.bindings)

        return f"""PROJECT OVERVIEW
{'-' * 55}
+---------------------------------------------------+
|                 PAGES STATUS                       |
|                                                   |
|  Project: {self.project.name:<37} |
|  Framework: {self.project.build_config.framework.value:<35} |
|  Node Version: {self.project.build_config.node_version.value:<32} |
|                                                   |
|  Functions: {func_count:<3} routes                          |
|  Bindings: {binding_count:<3} configured                       |
|  Middleware: {mw_count:<3} layers                          |
|                                                   |
|  SSR Support: {'Yes' if self.project.build_config.framework.supports_ssr else 'No':<33} |
|  Adapter: {self.project.build_config.framework.adapter_package or 'None':<37} |
|                                                   |
+---------------------------------------------------+"""

    def _build_config(self) -> str:
        """Generate build configuration section."""
        bc = self.project.build_config
        return f"""BUILD CONFIGURATION
{'-' * 55}
| Setting          | Value                          |
|------------------|--------------------------------|
| Build Command    | {bc.build_command:<30} |
| Output Directory | {bc.output_directory:<30} |
| Root Directory   | {bc.root_directory:<30} |
| Node Version     | {bc.node_version.value:<30} |
| Install Command  | {bc.install_command:<30} |"""

    def _functions_overview(self) -> str:
        """Generate functions structure section."""
        lines = [
            "FUNCTIONS STRUCTURE",
            "-" * 55,
            "```",
            "functions/"
        ]

        for route in self.project.routes:
            file_path = route.to_file_path().replace("functions/", "")
            methods = ", ".join(m.value for m in route.methods)
            lines.append(f"|-- {file_path:<30} # {methods}")

        lines.append("```")
        return "\n".join(lines)

    def _bindings_overview(self) -> str:
        """Generate bindings section."""
        lines = [
            "BINDINGS CONFIGURED",
            "-" * 55,
            "| Binding Name | Type         | Resource                |",
            "|--------------|--------------|-------------------------|"
        ]

        for binding in self.project.bindings:
            lines.append(
                f"| {binding.name:<12} | {binding.binding_type.value:<12} | {binding.resource_id or 'auto':<23} |"
            )

        return "\n".join(lines)

    def _deployment_status(self) -> str:
        """Generate deployment status section."""
        domains = ", ".join(self.project.custom_domains) if self.project.custom_domains else "None configured"

        return f"""DEPLOYMENT STATUS
{'-' * 55}
Pages URL: {self.project.name}.pages.dev
Custom Domains: {domains}
Compatibility Date: {self.project.compatibility_date}

Production: [READY]
Preview: [READY]"""

    def _checklist(self) -> str:
        """Generate implementation checklist."""
        return f"""IMPLEMENTATION CHECKLIST
{'-' * 55}
[{'X' if self.project.build_config.framework else ' '}] Project initialized
[{'X' if self.project.routes else ' '}] Functions created
[{'X' if self.project.bindings else ' '}] Bindings configured
[ ] Build successful
[ ] Production deployed

Pages Status: {'[READY]' if self.project.routes or self.project.bindings else '[PENDING]'}"""


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ENGINE - Orchestrator
# ═══════════════════════════════════════════════════════════════════════════════

class CloudflarePagesEngine:
    """Main engine for Cloudflare Pages operations."""

    def __init__(self, project_name: str = "my-app", framework: Framework = Framework.NEXTJS):
        self.project = PagesProject.fullstack_app(project_name, framework)
        self.architect = PagesArchitect(self.project)
        self.functions_builder = FunctionsBuilder(self.project.bindings)
        self.deployment_manager = DeploymentManager(self.project)
        self.reporter = PagesReporter(self.project)

    def create_fullstack_app(self) -> Dict[str, str]:
        """Create a complete full-stack Pages application."""
        files = self.architect.generate_project_structure()

        # Add CRUD API for users
        files["functions/api/users/index.ts"] = self.functions_builder.generate_crud_api("users", "users")
        files["functions/api/users/[id].ts"] = self.functions_builder.generate_crud_item("users", "users")

        # Add auth middleware
        files["functions/api/_middleware.ts"] = self.functions_builder.generate_auth_middleware()

        # Add file upload
        files["functions/api/upload/[[path]].ts"] = self.functions_builder.generate_file_upload()

        # Add GitHub workflow
        files[".github/workflows/deploy.yml"] = self.deployment_manager.generate_github_workflow()

        return files

    def create_static_site(self, framework: Framework = Framework.ASTRO) -> Dict[str, str]:
        """Create a static site with minimal configuration."""
        self.project = PagesProject.static_site(self.project.name, framework)
        self.architect = PagesArchitect(self.project)

        return self.architect.generate_project_structure()

    def create_api_only(self) -> Dict[str, str]:
        """Create an API-only project."""
        self.project = PagesProject.api_only(self.project.name)
        self.architect = PagesArchitect(self.project)
        self.functions_builder = FunctionsBuilder(self.project.bindings)

        files = self.architect.generate_project_structure()

        # Add comprehensive API structure
        files["functions/api/users/index.ts"] = self.functions_builder.generate_crud_api("users", "users")
        files["functions/api/users/[id].ts"] = self.functions_builder.generate_crud_item("users", "users")

        return files

    def add_binding(self, binding: BindingConfig):
        """Add a binding to the project."""
        self.project.bindings.append(binding)

    def add_route(self, route: FunctionRoute):
        """Add a route to the project."""
        self.project.routes.append(route)

    def get_report(self) -> str:
        """Generate a dashboard report."""
        return self.reporter.generate_dashboard()

    def get_wrangler_config(self) -> str:
        """Get the wrangler.toml configuration."""
        return self.architect.generate_wrangler_config()

    def get_deployment_commands(self) -> Dict[str, str]:
        """Get deployment commands."""
        return self.deployment_manager.generate_deployment_commands()


# ═══════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="CLOUDFLARE.PAGES.EXE - Full-Stack Deployment Specialist"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new Pages project")
    create_parser.add_argument("name", help="Project name")
    create_parser.add_argument(
        "--framework", "-f",
        choices=[f.value for f in Framework],
        default="nextjs",
        help="Frontend framework"
    )
    create_parser.add_argument(
        "--type", "-t",
        choices=["fullstack", "static", "api"],
        default="fullstack",
        help="Project type"
    )

    # Function command
    func_parser = subparsers.add_parser("function", help="Generate a function")
    func_parser.add_argument("route", help="Route path (e.g., /api/users)")
    func_parser.add_argument(
        "--methods", "-m",
        nargs="+",
        default=["GET", "POST"],
        help="HTTP methods"
    )

    # Middleware command
    mw_parser = subparsers.add_parser("middleware", help="Generate middleware")
    mw_parser.add_argument("--scope", default="api", help="Middleware scope")
    mw_parser.add_argument("--auth", action="store_true", help="Include authentication")

    # Binding command
    bind_parser = subparsers.add_parser("binding", help="Add a binding")
    bind_parser.add_argument("name", help="Binding name")
    bind_parser.add_argument(
        "--type", "-t",
        choices=[b.value for b in BindingType],
        required=True,
        help="Binding type"
    )
    bind_parser.add_argument("--id", help="Resource ID")

    # Frameworks command
    subparsers.add_parser("frameworks", help="List supported frameworks")

    # Bindings command
    subparsers.add_parser("bindings", help="List available binding types")

    # Demo command
    subparsers.add_parser("demo", help="Run a demonstration")

    args = parser.parse_args()

    if args.command == "create":
        framework = Framework(args.framework)
        engine = CloudflarePagesEngine(args.name, framework)

        if args.type == "fullstack":
            files = engine.create_fullstack_app()
        elif args.type == "static":
            files = engine.create_static_site(framework)
        else:
            files = engine.create_api_only()

        print(engine.get_report())
        print("\nGenerated Files:")
        for path in sorted(files.keys()):
            print(f"  - {path}")

    elif args.command == "function":
        engine = CloudflarePagesEngine("app")
        methods = [HTTPMethod[m.upper()] for m in args.methods]
        route = FunctionRoute(
            path=args.route,
            route_type=RouteType.STATIC,
            methods=methods
        )
        print(f"Generated function for: {args.route}")
        print(f"Methods: {', '.join(m.value for m in methods)}")

    elif args.command == "middleware":
        builder = FunctionsBuilder()
        if args.auth:
            print(builder.generate_auth_middleware())
        else:
            print("Use --auth flag for authentication middleware")

    elif args.command == "frameworks":
        print("\nSupported Frameworks:")
        print("-" * 60)
        for fw in Framework:
            print(f"  {fw.value:<15} | Build: {fw.build_command:<20} | Output: {fw.output_directory}")

    elif args.command == "bindings":
        print("\nAvailable Binding Types:")
        print("-" * 60)
        for bt in BindingType:
            print(f"  {bt.value:<20} | TypeScript: {bt.typescript_type}")

    elif args.command == "demo":
        print("=" * 60)
        print("CLOUDFLARE PAGES DEMONSTRATION")
        print("=" * 60)

        # Create a full-stack app
        engine = CloudflarePagesEngine("demo-app", Framework.NEXTJS)

        # Add additional bindings
        engine.add_binding(BindingConfig.vectorize_index("SEARCH", "search-index"))
        engine.add_binding(BindingConfig.r2_bucket("ASSETS", "demo-assets"))

        # Add custom route
        engine.add_route(FunctionRoute.api_endpoint(
            "search",
            [HTTPMethod.GET, HTTPMethod.POST],
            "Semantic search endpoint"
        ))

        print(engine.get_report())

        print("\n\nWRANGLER.TOML:")
        print("-" * 40)
        print(engine.get_wrangler_config())

        print("\n\nDEPLOYMENT COMMANDS:")
        print("-" * 40)
        for name, cmd in engine.get_deployment_commands().items():
            print(f"{name}: {cmd}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/cloudflare-pages create [name] --framework [fw]` - Initialize Pages project
- `/cloudflare-pages function [route]` - Create API function
- `/cloudflare-pages middleware --auth` - Add middleware
- `/cloudflare-pages binding [name] --type [type]` - Configure binding
- `/cloudflare-pages frameworks` - List supported frameworks
- `/cloudflare-pages demo` - Run demonstration

$ARGUMENTS
