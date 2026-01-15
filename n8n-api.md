# N8N.API.EXE - n8n API Integration Specialist

You are N8N.API.EXE — the n8n API integration expert that connects any REST API to n8n workflows with proper authentication, pagination handling, error recovery, and data transformation.

MISSION
Connect APIs. Handle authentication. Transform data.

---

## CAPABILITIES

### EndpointMapper.MOD
- REST endpoint configuration
- Request method selection
- Query parameter building
- Body payload construction
- Header management

### AuthManager.MOD
- API key authentication
- Bearer token handling
- OAuth 2.0 flows
- Basic auth setup
- Custom header auth

### PaginationEngine.MOD
- Offset pagination loops
- Cursor-based navigation
- Link header parsing
- Rate limit compliance
- Batch size optimization

### ErrorHandler.MOD
- Retry with backoff
- Status code handling
- Response validation
- Timeout management
- Graceful degradation

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
N8N.API.EXE - n8n API Integration Specialist
Connect any REST API to n8n workflows with proper authentication,
pagination handling, error recovery, and data transformation.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import json
import base64
import argparse
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS - API Integration Domain Types
# ═══════════════════════════════════════════════════════════════════════════════

class HttpMethod(Enum):
    """HTTP methods for REST API requests."""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    HEAD = "HEAD"
    OPTIONS = "OPTIONS"

    @property
    def has_body(self) -> bool:
        """Whether this method typically has a request body."""
        return self in (HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH)

    @property
    def is_safe(self) -> bool:
        """Whether this method is safe (read-only, no side effects)."""
        return self in (HttpMethod.GET, HttpMethod.HEAD, HttpMethod.OPTIONS)

    @property
    def is_idempotent(self) -> bool:
        """Whether this method is idempotent (same result on repeat)."""
        return self != HttpMethod.POST

    @property
    def description(self) -> str:
        """Human-readable description of the method use case."""
        descriptions = {
            "GET": "Retrieve data from the server",
            "POST": "Create a new resource",
            "PUT": "Replace an existing resource completely",
            "PATCH": "Update specific fields of a resource",
            "DELETE": "Remove a resource",
            "HEAD": "Get headers only (no body)",
            "OPTIONS": "Get allowed methods for endpoint"
        }
        return descriptions.get(self.value, "Unknown method")


class AuthType(Enum):
    """Authentication types for API access."""
    NONE = "none"
    API_KEY = "api_key"
    BEARER = "bearer"
    BASIC = "basic"
    OAUTH2 = "oauth2"
    OAUTH2_CLIENT_CREDENTIALS = "oauth2_client_credentials"
    DIGEST = "digest"
    CUSTOM_HEADER = "custom_header"
    QUERY_PARAM = "query_param"

    @property
    def header_name(self) -> str:
        """Default header name for this auth type."""
        header_map = {
            "api_key": "X-API-Key",
            "bearer": "Authorization",
            "basic": "Authorization",
            "oauth2": "Authorization",
            "oauth2_client_credentials": "Authorization",
            "digest": "Authorization",
            "custom_header": "X-Custom-Auth",
            "query_param": "",
            "none": ""
        }
        return header_map.get(self.value, "")

    @property
    def n8n_credential_type(self) -> str:
        """Corresponding n8n credential type."""
        credential_map = {
            "api_key": "httpHeaderAuth",
            "bearer": "httpHeaderAuth",
            "basic": "httpBasicAuth",
            "oauth2": "oAuth2Api",
            "oauth2_client_credentials": "oAuth2Api",
            "digest": "httpDigestAuth",
            "custom_header": "httpHeaderAuth",
            "query_param": "httpQueryAuth",
            "none": ""
        }
        return credential_map.get(self.value, "")

    @property
    def requires_refresh(self) -> bool:
        """Whether this auth type requires token refresh."""
        return self in (AuthType.OAUTH2, AuthType.OAUTH2_CLIENT_CREDENTIALS)


class PaginationType(Enum):
    """Pagination strategies for API responses."""
    NONE = "none"
    OFFSET = "offset"
    PAGE_NUMBER = "page_number"
    CURSOR = "cursor"
    LINK_HEADER = "link_header"
    TOKEN = "token"
    KEYSET = "keyset"

    @property
    def n8n_pattern(self) -> str:
        """n8n implementation pattern for this pagination type."""
        patterns = {
            "none": "single_request",
            "offset": "loop_with_offset",
            "page_number": "loop_with_page",
            "cursor": "loop_until_null",
            "link_header": "parse_link_header",
            "token": "loop_until_empty",
            "keyset": "loop_with_last_id"
        }
        return patterns.get(self.value, "single_request")

    @property
    def required_params(self) -> list[str]:
        """Parameters required for this pagination type."""
        params_map = {
            "none": [],
            "offset": ["offset", "limit"],
            "page_number": ["page", "per_page"],
            "cursor": ["cursor", "limit"],
            "link_header": [],
            "token": ["next_token", "max_results"],
            "keyset": ["after_id", "limit"]
        }
        return params_map.get(self.value, [])


class ResponseFormat(Enum):
    """Expected response formats from APIs."""
    JSON = "json"
    XML = "xml"
    TEXT = "text"
    BINARY = "binary"
    FORM_DATA = "form_data"

    @property
    def content_type(self) -> str:
        """Content-Type header value for this format."""
        content_types = {
            "json": "application/json",
            "xml": "application/xml",
            "text": "text/plain",
            "binary": "application/octet-stream",
            "form_data": "multipart/form-data"
        }
        return content_types.get(self.value, "application/json")

    @property
    def n8n_response_format(self) -> str:
        """n8n HTTP Request node response format setting."""
        format_map = {
            "json": "json",
            "xml": "text",
            "text": "text",
            "binary": "file",
            "form_data": "json"
        }
        return format_map.get(self.value, "json")


class RateLimitStrategy(Enum):
    """Rate limiting strategies for API compliance."""
    NONE = "none"
    FIXED_DELAY = "fixed_delay"
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    ADAPTIVE = "adaptive"
    TOKEN_BUCKET = "token_bucket"

    @property
    def description(self) -> str:
        """Description of the rate limit strategy."""
        descriptions = {
            "none": "No rate limiting applied",
            "fixed_delay": "Fixed delay between requests",
            "exponential_backoff": "Exponential backoff on 429 errors",
            "adaptive": "Adjust based on rate limit headers",
            "token_bucket": "Token bucket algorithm for burst handling"
        }
        return descriptions.get(self.value, "Unknown strategy")


class RetryStrategy(Enum):
    """Retry strategies for failed requests."""
    NONE = "none"
    IMMEDIATE = "immediate"
    LINEAR_BACKOFF = "linear_backoff"
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    JITTERED_BACKOFF = "jittered_backoff"

    @property
    def retry_codes(self) -> list[int]:
        """HTTP status codes that should trigger a retry."""
        return [408, 429, 500, 502, 503, 504]

    def calculate_delay(self, attempt: int, base_delay: float = 1.0) -> float:
        """Calculate delay for a given retry attempt."""
        if self == RetryStrategy.NONE:
            return 0
        elif self == RetryStrategy.IMMEDIATE:
            return 0
        elif self == RetryStrategy.LINEAR_BACKOFF:
            return base_delay * attempt
        elif self == RetryStrategy.EXPONENTIAL_BACKOFF:
            return base_delay * (2 ** (attempt - 1))
        elif self == RetryStrategy.JITTERED_BACKOFF:
            import random
            return base_delay * (2 ** (attempt - 1)) * (0.5 + random.random())
        return base_delay


# ═══════════════════════════════════════════════════════════════════════════════
# DATACLASSES - API Configuration Structures
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class HeaderConfig:
    """Configuration for a request header."""
    name: str
    value: str
    is_sensitive: bool = False
    source: str = "static"  # static, expression, credential

    def to_n8n_header(self) -> dict:
        """Convert to n8n header format."""
        if self.source == "expression":
            return {"name": self.name, "value": f"={{{{ {self.value} }}}}"}
        elif self.source == "credential":
            return {"name": self.name, "value": "={{ $credentials.value }}"}
        return {"name": self.name, "value": self.value}


@dataclass
class QueryParam:
    """Configuration for a query parameter."""
    name: str
    value: str
    source: str = "static"  # static, expression, variable
    required: bool = True

    def to_n8n_param(self) -> dict:
        """Convert to n8n query parameter format."""
        if self.source == "expression":
            return {"name": self.name, "value": f"={{{{ {self.value} }}}}"}
        elif self.source == "variable":
            return {"name": self.name, "value": f"={{{{ $json.{self.value} }}}}"}
        return {"name": self.name, "value": self.value}


@dataclass
class AuthConfig:
    """Authentication configuration for API access."""
    auth_type: AuthType
    credential_name: str = ""
    header_name: str = ""
    header_prefix: str = ""
    api_key_location: str = "header"  # header, query
    query_param_name: str = ""
    oauth_scopes: list[str] = field(default_factory=list)
    token_url: str = ""
    refresh_before_expiry: int = 60  # seconds

    @classmethod
    def api_key(cls, credential_name: str, header_name: str = "X-API-Key") -> "AuthConfig":
        """Create API key authentication config."""
        return cls(
            auth_type=AuthType.API_KEY,
            credential_name=credential_name,
            header_name=header_name
        )

    @classmethod
    def bearer_token(cls, credential_name: str) -> "AuthConfig":
        """Create Bearer token authentication config."""
        return cls(
            auth_type=AuthType.BEARER,
            credential_name=credential_name,
            header_name="Authorization",
            header_prefix="Bearer "
        )

    @classmethod
    def basic_auth(cls, credential_name: str) -> "AuthConfig":
        """Create Basic authentication config."""
        return cls(
            auth_type=AuthType.BASIC,
            credential_name=credential_name,
            header_name="Authorization",
            header_prefix="Basic "
        )

    @classmethod
    def oauth2(cls, credential_name: str, scopes: list[str], token_url: str = "") -> "AuthConfig":
        """Create OAuth 2.0 authentication config."""
        return cls(
            auth_type=AuthType.OAUTH2,
            credential_name=credential_name,
            oauth_scopes=scopes,
            token_url=token_url,
            header_name="Authorization",
            header_prefix="Bearer "
        )

    def to_n8n_auth(self) -> dict:
        """Convert to n8n authentication configuration."""
        if self.auth_type == AuthType.NONE:
            return {"authentication": "none"}

        auth_config = {
            "authentication": "genericCredentialType",
            "genericAuthType": self.auth_type.n8n_credential_type,
            "nodeCredentialType": self.auth_type.n8n_credential_type
        }

        if self.credential_name:
            auth_config["credentials"] = {self.auth_type.n8n_credential_type: self.credential_name}

        return auth_config

    def generate_credential_setup(self) -> str:
        """Generate credential setup instructions."""
        instructions = []
        instructions.append(f"Authentication Type: {self.auth_type.value.replace('_', ' ').title()}")
        instructions.append("")

        if self.auth_type == AuthType.API_KEY:
            instructions.append("Credential Setup:")
            instructions.append("1. Go to Settings > Credentials")
            instructions.append("2. Click 'Add Credential' > 'Header Auth'")
            instructions.append(f"3. Name: {self.credential_name or 'API Key'}")
            instructions.append(f"4. Header Name: {self.header_name}")
            instructions.append("5. Header Value: Your API key")

        elif self.auth_type == AuthType.BEARER:
            instructions.append("Credential Setup:")
            instructions.append("1. Go to Settings > Credentials")
            instructions.append("2. Click 'Add Credential' > 'Header Auth'")
            instructions.append(f"3. Name: {self.credential_name or 'Bearer Token'}")
            instructions.append("4. Header Name: Authorization")
            instructions.append("5. Header Value: Bearer YOUR_TOKEN_HERE")

        elif self.auth_type == AuthType.BASIC:
            instructions.append("Credential Setup:")
            instructions.append("1. Go to Settings > Credentials")
            instructions.append("2. Click 'Add Credential' > 'Basic Auth'")
            instructions.append(f"3. Name: {self.credential_name or 'Basic Auth'}")
            instructions.append("4. Username: Your username")
            instructions.append("5. Password: Your password")

        elif self.auth_type in (AuthType.OAUTH2, AuthType.OAUTH2_CLIENT_CREDENTIALS):
            instructions.append("Credential Setup:")
            instructions.append("1. Go to Settings > Credentials")
            instructions.append("2. Click 'Add Credential' > 'OAuth2 API'")
            instructions.append(f"3. Name: {self.credential_name or 'OAuth2'}")
            instructions.append("4. Grant Type: Authorization Code / Client Credentials")
            instructions.append("5. Authorization URL: [from API docs]")
            instructions.append(f"6. Token URL: {self.token_url or '[from API docs]'}")
            instructions.append("7. Client ID: Your client ID")
            instructions.append("8. Client Secret: Your client secret")
            if self.oauth_scopes:
                instructions.append(f"9. Scopes: {' '.join(self.oauth_scopes)}")

        return "\n".join(instructions)


@dataclass
class PaginationConfig:
    """Pagination configuration for API responses."""
    pagination_type: PaginationType
    page_size: int = 100
    page_param: str = "page"
    limit_param: str = "limit"
    offset_param: str = "offset"
    cursor_param: str = "cursor"
    cursor_response_path: str = "next_cursor"
    total_path: str = "total"
    data_path: str = "data"
    max_pages: int = 100

    @classmethod
    def offset_pagination(cls, limit: int = 100, offset_param: str = "offset",
                         limit_param: str = "limit", data_path: str = "data") -> "PaginationConfig":
        """Create offset-based pagination config."""
        return cls(
            pagination_type=PaginationType.OFFSET,
            page_size=limit,
            offset_param=offset_param,
            limit_param=limit_param,
            data_path=data_path
        )

    @classmethod
    def page_pagination(cls, per_page: int = 100, page_param: str = "page",
                       limit_param: str = "per_page", data_path: str = "data") -> "PaginationConfig":
        """Create page number pagination config."""
        return cls(
            pagination_type=PaginationType.PAGE_NUMBER,
            page_size=per_page,
            page_param=page_param,
            limit_param=limit_param,
            data_path=data_path
        )

    @classmethod
    def cursor_pagination(cls, limit: int = 100, cursor_param: str = "cursor",
                         cursor_response_path: str = "next_cursor", data_path: str = "data") -> "PaginationConfig":
        """Create cursor-based pagination config."""
        return cls(
            pagination_type=PaginationType.CURSOR,
            page_size=limit,
            cursor_param=cursor_param,
            cursor_response_path=cursor_response_path,
            data_path=data_path
        )

    def generate_loop_code(self) -> str:
        """Generate n8n Code node for pagination loop."""
        if self.pagination_type == PaginationType.OFFSET:
            return f'''// Offset Pagination Loop
const limit = {self.page_size};
const currentOffset = $json.offset || 0;
const total = $json.{self.total_path} || 0;
const data = $json.{self.data_path} || [];

// Check if more pages exist
const hasMore = currentOffset + data.length < total;
const nextOffset = currentOffset + limit;

return {{
  json: {{
    items: data,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
    total,
    currentPage: Math.floor(currentOffset / limit) + 1
  }}
}};'''

        elif self.pagination_type == PaginationType.PAGE_NUMBER:
            return f'''// Page Number Pagination Loop
const perPage = {self.page_size};
const currentPage = $json.{self.page_param} || 1;
const total = $json.{self.total_path} || 0;
const data = $json.{self.data_path} || [];

// Calculate total pages
const totalPages = Math.ceil(total / perPage);
const hasMore = currentPage < totalPages;

return {{
  json: {{
    items: data,
    hasMore,
    nextPage: hasMore ? currentPage + 1 : null,
    totalPages,
    currentPage
  }}
}};'''

        elif self.pagination_type == PaginationType.CURSOR:
            return f'''// Cursor Pagination Loop
const cursor = $json.{self.cursor_response_path};
const data = $json.{self.data_path} || [];

// Check if more pages exist (cursor is present and not empty)
const hasMore = cursor && cursor !== '' && cursor !== null;

return {{
  json: {{
    items: data,
    hasMore,
    nextCursor: hasMore ? cursor : null,
    itemCount: data.length
  }}
}};'''

        elif self.pagination_type == PaginationType.LINK_HEADER:
            return '''// Link Header Pagination
const linkHeader = $response.headers.link || '';
const data = $json.data || $json;

// Parse Link header
const links = {};
linkHeader.split(',').forEach(part => {
  const match = part.match(/<([^>]+)>.*rel="([^"]+)"/);
  if (match) {
    links[match[2]] = match[1];
  }
});

const hasMore = !!links.next;

return {
  json: {
    items: Array.isArray(data) ? data : [data],
    hasMore,
    nextUrl: links.next || null,
    links
  }
};'''

        return "// No pagination required"


@dataclass
class RetryConfig:
    """Retry configuration for failed requests."""
    strategy: RetryStrategy = RetryStrategy.EXPONENTIAL_BACKOFF
    max_retries: int = 3
    base_delay_ms: int = 1000
    max_delay_ms: int = 30000
    retry_on_status: list[int] = field(default_factory=lambda: [408, 429, 500, 502, 503, 504])
    retry_on_timeout: bool = True

    def to_n8n_retry(self) -> dict:
        """Convert to n8n retry configuration."""
        return {
            "retryOnFail": self.max_retries > 0,
            "maxTries": self.max_retries + 1,
            "waitBetweenTries": self.base_delay_ms
        }

    def generate_retry_code(self) -> str:
        """Generate n8n Code node for custom retry logic."""
        return f'''// Custom Retry Logic
const statusCode = $json.statusCode || $response?.statusCode;
const retryStatuses = {json.dumps(self.retry_on_status)};
const maxRetries = {self.max_retries};
const baseDelay = {self.base_delay_ms};

// Get current retry count from workflow variable
const currentRetry = $workflow.runData?.retryCount || 0;

if (retryStatuses.includes(statusCode) && currentRetry < maxRetries) {{
  // Calculate backoff delay
  const delay = Math.min(baseDelay * Math.pow(2, currentRetry), {self.max_delay_ms});

  return {{
    json: {{
      shouldRetry: true,
      retryCount: currentRetry + 1,
      delayMs: delay,
      reason: `Status ${{statusCode}}, retry ${{currentRetry + 1}}/${{maxRetries}}`
    }}
  }};
}}

return {{
  json: {{
    shouldRetry: false,
    retryCount: currentRetry,
    finalStatus: statusCode
  }}
}};'''


@dataclass
class RateLimitConfig:
    """Rate limiting configuration for API compliance."""
    requests_per_minute: int = 60
    requests_per_second: float = 1.0
    burst_limit: int = 10
    strategy: RateLimitStrategy = RateLimitStrategy.FIXED_DELAY
    respect_headers: bool = True
    rate_limit_header: str = "X-RateLimit-Remaining"
    retry_after_header: str = "Retry-After"

    @property
    def delay_between_requests_ms(self) -> int:
        """Calculate delay between requests in milliseconds."""
        if self.requests_per_second > 0:
            return int(1000 / self.requests_per_second)
        return int(60000 / self.requests_per_minute)

    def generate_throttle_code(self) -> str:
        """Generate n8n Code node for rate limiting."""
        return f'''// Rate Limit Throttling
const rateLimit = {self.requests_per_minute}; // requests per minute
const delayMs = {self.delay_between_requests_ms};
const burstLimit = {self.burst_limit};

// Check rate limit headers if available
const remaining = parseInt($response?.headers?.['{self.rate_limit_header.lower()}'] || rateLimit);
const retryAfter = parseInt($response?.headers?.['{self.retry_after_header.lower()}'] || 0);

if (retryAfter > 0) {{
  // API is requesting we wait
  return {{
    json: {{
      throttle: true,
      waitMs: retryAfter * 1000,
      reason: 'Rate limit exceeded, waiting for retry-after'
    }}
  }};
}}

if (remaining <= 1) {{
  // Near rate limit, slow down
  return {{
    json: {{
      throttle: true,
      waitMs: delayMs * 2,
      reason: 'Approaching rate limit'
    }}
  }};
}}

return {{
  json: {{
    throttle: false,
    waitMs: delayMs,
    remaining
  }}
}};'''


@dataclass
class EndpointConfig:
    """Configuration for a single API endpoint."""
    path: str
    method: HttpMethod = HttpMethod.GET
    description: str = ""
    headers: list[HeaderConfig] = field(default_factory=list)
    query_params: list[QueryParam] = field(default_factory=list)
    body_template: Optional[dict] = None
    response_format: ResponseFormat = ResponseFormat.JSON
    data_path: str = ""
    timeout_ms: int = 30000

    def full_url(self, base_url: str) -> str:
        """Build full URL with base and path."""
        base = base_url.rstrip("/")
        path = self.path.lstrip("/")
        return f"{base}/{path}"

    def to_n8n_node(self, base_url: str, node_name: str = "HTTP Request") -> dict:
        """Convert to n8n HTTP Request node configuration."""
        node = {
            "parameters": {
                "method": self.method.value,
                "url": self.full_url(base_url),
                "options": {
                    "timeout": self.timeout_ms
                }
            },
            "name": node_name,
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [0, 0]
        }

        # Add headers
        if self.headers:
            node["parameters"]["sendHeaders"] = True
            node["parameters"]["headerParameters"] = {
                "parameters": [h.to_n8n_header() for h in self.headers]
            }

        # Add query parameters
        if self.query_params:
            node["parameters"]["sendQuery"] = True
            node["parameters"]["queryParameters"] = {
                "parameters": [p.to_n8n_param() for p in self.query_params]
            }

        # Add body for POST/PUT/PATCH
        if self.method.has_body and self.body_template:
            node["parameters"]["sendBody"] = True
            node["parameters"]["bodyParameters"] = {
                "parameters": [
                    {"name": k, "value": json.dumps(v) if isinstance(v, (dict, list)) else str(v)}
                    for k, v in self.body_template.items()
                ]
            }

        # Set response format
        node["parameters"]["options"]["response"] = {
            "response": {
                "responseFormat": self.response_format.n8n_response_format
            }
        }

        return node


@dataclass
class APIIntegration:
    """Complete API integration configuration."""
    service_name: str
    base_url: str
    description: str = ""
    auth: AuthConfig = field(default_factory=lambda: AuthConfig(AuthType.NONE))
    endpoints: list[EndpointConfig] = field(default_factory=list)
    pagination: Optional[PaginationConfig] = None
    retry: RetryConfig = field(default_factory=RetryConfig)
    rate_limit: Optional[RateLimitConfig] = None
    default_headers: list[HeaderConfig] = field(default_factory=list)

    @property
    def complexity_score(self) -> int:
        """Calculate integration complexity (1-10)."""
        score = 1

        # Authentication complexity
        if self.auth.auth_type != AuthType.NONE:
            score += 1
        if self.auth.auth_type in (AuthType.OAUTH2, AuthType.OAUTH2_CLIENT_CREDENTIALS):
            score += 2

        # Pagination complexity
        if self.pagination and self.pagination.pagination_type != PaginationType.NONE:
            score += 2

        # Endpoint count
        score += min(3, len(self.endpoints))

        # Rate limiting
        if self.rate_limit:
            score += 1

        return min(10, score)

    def add_endpoint(self, path: str, method: HttpMethod = HttpMethod.GET,
                    description: str = "") -> EndpointConfig:
        """Add an endpoint to this integration."""
        endpoint = EndpointConfig(
            path=path,
            method=method,
            description=description,
            headers=list(self.default_headers)  # Copy default headers
        )
        self.endpoints.append(endpoint)
        return endpoint

    def to_n8n_workflow(self, name: str = "") -> dict:
        """Convert integration to complete n8n workflow."""
        workflow_name = name or f"{self.service_name} Integration"
        nodes = []
        connections = {}

        # Start with trigger
        trigger_node = {
            "parameters": {},
            "name": "Manual Trigger",
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [250, 300]
        }
        nodes.append(trigger_node)

        prev_node = "Manual Trigger"
        x_pos = 450

        # Add HTTP request nodes for each endpoint
        for i, endpoint in enumerate(self.endpoints):
            node = endpoint.to_n8n_node(self.base_url, f"API: {endpoint.path}")
            node["position"] = [x_pos, 300]

            # Add authentication
            auth_config = self.auth.to_n8n_auth()
            node["parameters"].update(auth_config)

            nodes.append(node)

            # Connect to previous node
            connections[prev_node] = {"main": [[{"node": node["name"], "type": "main", "index": 0}]]}
            prev_node = node["name"]
            x_pos += 200

        return {
            "name": workflow_name,
            "nodes": nodes,
            "connections": connections,
            "settings": {
                "executionOrder": "v1"
            }
        }


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - API Integration Engines
# ═══════════════════════════════════════════════════════════════════════════════

class EndpointMapper:
    """Engine for REST endpoint configuration and URL building."""

    # Common API patterns
    API_PATTERNS = {
        "rest_list": {"method": HttpMethod.GET, "path": "/{resource}"},
        "rest_get": {"method": HttpMethod.GET, "path": "/{resource}/{id}"},
        "rest_create": {"method": HttpMethod.POST, "path": "/{resource}"},
        "rest_update": {"method": HttpMethod.PUT, "path": "/{resource}/{id}"},
        "rest_patch": {"method": HttpMethod.PATCH, "path": "/{resource}/{id}"},
        "rest_delete": {"method": HttpMethod.DELETE, "path": "/{resource}/{id}"},
        "graphql": {"method": HttpMethod.POST, "path": "/graphql"},
        "search": {"method": HttpMethod.GET, "path": "/{resource}/search"},
        "batch": {"method": HttpMethod.POST, "path": "/{resource}/batch"}
    }

    @classmethod
    def create_crud_endpoints(cls, resource: str, base_path: str = "") -> list[EndpointConfig]:
        """Create standard CRUD endpoints for a resource."""
        path_prefix = f"{base_path}/{resource}" if base_path else f"/{resource}"

        return [
            EndpointConfig(
                path=path_prefix,
                method=HttpMethod.GET,
                description=f"List all {resource}"
            ),
            EndpointConfig(
                path=f"{path_prefix}/{{id}}",
                method=HttpMethod.GET,
                description=f"Get single {resource} by ID"
            ),
            EndpointConfig(
                path=path_prefix,
                method=HttpMethod.POST,
                description=f"Create new {resource}",
                body_template={"name": "", "data": {}}
            ),
            EndpointConfig(
                path=f"{path_prefix}/{{id}}",
                method=HttpMethod.PUT,
                description=f"Update {resource} by ID",
                body_template={"name": "", "data": {}}
            ),
            EndpointConfig(
                path=f"{path_prefix}/{{id}}",
                method=HttpMethod.DELETE,
                description=f"Delete {resource} by ID"
            )
        ]

    @classmethod
    def build_url_with_params(cls, base_url: str, path: str,
                             path_params: dict = None, query_params: dict = None) -> str:
        """Build complete URL with path and query parameters."""
        url = base_url.rstrip("/") + "/" + path.lstrip("/")

        # Replace path parameters
        if path_params:
            for key, value in path_params.items():
                url = url.replace(f"{{{key}}}", str(value))

        # Add query parameters
        if query_params:
            query_string = "&".join(f"{k}={v}" for k, v in query_params.items())
            url = f"{url}?{query_string}"

        return url

    @classmethod
    def parse_api_spec(cls, spec: dict) -> list[EndpointConfig]:
        """Parse OpenAPI/Swagger spec to endpoint configs."""
        endpoints = []

        paths = spec.get("paths", {})
        for path, methods in paths.items():
            for method, details in methods.items():
                if method.upper() in [m.value for m in HttpMethod]:
                    endpoint = EndpointConfig(
                        path=path,
                        method=HttpMethod(method.upper()),
                        description=details.get("summary", details.get("description", ""))
                    )

                    # Extract query parameters
                    for param in details.get("parameters", []):
                        if param.get("in") == "query":
                            endpoint.query_params.append(QueryParam(
                                name=param["name"],
                                value="",
                                required=param.get("required", False)
                            ))

                    endpoints.append(endpoint)

        return endpoints


class AuthManager:
    """Engine for API authentication setup."""

    # Known API authentication patterns
    KNOWN_APIS = {
        "stripe": AuthConfig.bearer_token("Stripe API"),
        "github": AuthConfig.bearer_token("GitHub Token"),
        "slack": AuthConfig.bearer_token("Slack Bot Token"),
        "openai": AuthConfig.bearer_token("OpenAI API Key"),
        "anthropic": AuthConfig.api_key("Anthropic API Key", "x-api-key"),
        "sendgrid": AuthConfig.bearer_token("SendGrid API Key"),
        "twilio": AuthConfig.basic_auth("Twilio Credentials"),
        "aws": AuthConfig(auth_type=AuthType.CUSTOM_HEADER, credential_name="AWS Credentials"),
        "google": AuthConfig.oauth2("Google OAuth", ["https://www.googleapis.com/auth/cloud-platform"]),
        "salesforce": AuthConfig.oauth2("Salesforce OAuth", []),
        "hubspot": AuthConfig.oauth2("HubSpot OAuth", []),
        "shopify": AuthConfig.api_key("Shopify API Key", "X-Shopify-Access-Token"),
        "airtable": AuthConfig.bearer_token("Airtable API Key"),
        "notion": AuthConfig.bearer_token("Notion Integration Token"),
        "linear": AuthConfig.bearer_token("Linear API Key"),
        "jira": AuthConfig.basic_auth("Jira Credentials"),
        "confluence": AuthConfig.basic_auth("Confluence Credentials")
    }

    @classmethod
    def get_auth_for_service(cls, service: str) -> AuthConfig:
        """Get authentication config for known service."""
        service_lower = service.lower()
        return cls.KNOWN_APIS.get(service_lower, AuthConfig(AuthType.NONE))

    @classmethod
    def create_oauth2_flow(cls, provider: str, client_id: str = "",
                          scopes: list[str] = None) -> dict:
        """Generate OAuth 2.0 flow configuration."""
        providers = {
            "google": {
                "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "default_scopes": ["openid", "email", "profile"]
            },
            "microsoft": {
                "authorization_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                "default_scopes": ["openid", "profile", "email"]
            },
            "github": {
                "authorization_url": "https://github.com/login/oauth/authorize",
                "token_url": "https://github.com/login/oauth/access_token",
                "default_scopes": ["read:user", "repo"]
            },
            "slack": {
                "authorization_url": "https://slack.com/oauth/v2/authorize",
                "token_url": "https://slack.com/api/oauth.v2.access",
                "default_scopes": ["chat:write", "channels:read"]
            }
        }

        provider_config = providers.get(provider.lower(), {})

        return {
            "grant_type": "authorization_code",
            "authorization_url": provider_config.get("authorization_url", ""),
            "token_url": provider_config.get("token_url", ""),
            "client_id": client_id,
            "scopes": scopes or provider_config.get("default_scopes", []),
            "redirect_uri": "http://localhost:5678/rest/oauth2-credential/callback"
        }

    @classmethod
    def generate_basic_auth_header(cls, username: str, password: str) -> str:
        """Generate Basic auth header value."""
        credentials = f"{username}:{password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"

    @classmethod
    def detect_auth_from_headers(cls, headers: dict) -> AuthType:
        """Detect authentication type from response headers."""
        www_auth = headers.get("WWW-Authenticate", "").lower()

        if "bearer" in www_auth:
            return AuthType.BEARER
        elif "basic" in www_auth:
            return AuthType.BASIC
        elif "digest" in www_auth:
            return AuthType.DIGEST
        elif "oauth" in www_auth:
            return AuthType.OAUTH2

        return AuthType.NONE


class PaginationEngine:
    """Engine for handling API pagination."""

    # Common pagination patterns
    PATTERNS = {
        "github": PaginationConfig.page_pagination(100, "page", "per_page", ""),
        "stripe": PaginationConfig.cursor_pagination(100, "starting_after", "has_more", "data"),
        "slack": PaginationConfig.cursor_pagination(200, "cursor", "response_metadata.next_cursor", "messages"),
        "shopify": PaginationConfig(pagination_type=PaginationType.LINK_HEADER),
        "airtable": PaginationConfig.cursor_pagination(100, "offset", "offset", "records"),
        "notion": PaginationConfig.cursor_pagination(100, "start_cursor", "next_cursor", "results"),
        "hubspot": PaginationConfig.cursor_pagination(100, "after", "paging.next.after", "results"),
        "linear": PaginationConfig.cursor_pagination(50, "after", "pageInfo.endCursor", "nodes"),
        "elasticsearch": PaginationConfig.offset_pagination(10000, "from", "size", "hits.hits")
    }

    @classmethod
    def get_pattern_for_service(cls, service: str) -> PaginationConfig:
        """Get pagination pattern for known service."""
        return cls.PATTERNS.get(service.lower(), PaginationConfig(PaginationType.NONE))

    @classmethod
    def detect_pagination_type(cls, response: dict) -> PaginationType:
        """Detect pagination type from API response."""
        # Check for cursor-based
        cursor_fields = ["next_cursor", "cursor", "nextCursor", "after", "next_page_token"]
        for field in cursor_fields:
            if field in response or any(field in str(v) for v in response.values() if isinstance(v, dict)):
                return PaginationType.CURSOR

        # Check for offset-based
        if "total" in response and ("offset" in response or "page" in response):
            return PaginationType.OFFSET

        # Check for token-based
        if "next_token" in response or "nextToken" in response:
            return PaginationType.TOKEN

        return PaginationType.NONE

    @classmethod
    def generate_pagination_workflow(cls, config: PaginationConfig) -> dict:
        """Generate n8n workflow nodes for pagination."""
        nodes = []

        if config.pagination_type == PaginationType.OFFSET:
            # Loop node for offset pagination
            loop_node = {
                "parameters": {
                    "mode": "loop",
                    "loopCount": config.max_pages,
                    "options": {}
                },
                "name": "Pagination Loop",
                "type": "n8n-nodes-base.splitInBatches",
                "typeVersion": 3,
                "position": [0, 0]
            }
            nodes.append(loop_node)

            # Code node to calculate next offset
            code_node = {
                "parameters": {
                    "jsCode": config.generate_loop_code()
                },
                "name": "Calculate Offset",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [200, 0]
            }
            nodes.append(code_node)

        elif config.pagination_type == PaginationType.CURSOR:
            # Loop until done for cursor pagination
            loop_node = {
                "parameters": {
                    "mode": "loop",
                    "loopCount": config.max_pages,
                    "options": {}
                },
                "name": "Cursor Loop",
                "type": "n8n-nodes-base.splitInBatches",
                "typeVersion": 3,
                "position": [0, 0]
            }
            nodes.append(loop_node)

            # IF node to check for more pages
            if_node = {
                "parameters": {
                    "conditions": {
                        "boolean": [
                            {
                                "value1": f"={{{{ $json.{config.cursor_response_path} }}}}",
                                "operation": "isNotEmpty"
                            }
                        ]
                    }
                },
                "name": "Has More Pages?",
                "type": "n8n-nodes-base.if",
                "typeVersion": 2,
                "position": [200, 0]
            }
            nodes.append(if_node)

        return {"nodes": nodes}


class ErrorHandler:
    """Engine for API error handling and recovery."""

    # HTTP status code categories
    STATUS_CATEGORIES = {
        "success": range(200, 300),
        "redirect": range(300, 400),
        "client_error": range(400, 500),
        "server_error": range(500, 600)
    }

    # Standard error responses
    ERROR_HANDLERS = {
        400: {"action": "log_and_fail", "message": "Bad Request - Check request format"},
        401: {"action": "refresh_auth", "message": "Unauthorized - Refresh credentials"},
        403: {"action": "log_and_fail", "message": "Forbidden - Check permissions"},
        404: {"action": "skip_item", "message": "Not Found - Resource doesn't exist"},
        408: {"action": "retry", "message": "Request Timeout - Retry"},
        429: {"action": "backoff", "message": "Rate Limited - Wait and retry"},
        500: {"action": "retry", "message": "Server Error - Retry"},
        502: {"action": "retry", "message": "Bad Gateway - Retry"},
        503: {"action": "retry", "message": "Service Unavailable - Retry"},
        504: {"action": "retry", "message": "Gateway Timeout - Retry"}
    }

    @classmethod
    def get_handler_for_status(cls, status_code: int) -> dict:
        """Get error handler for status code."""
        return cls.ERROR_HANDLERS.get(status_code, {
            "action": "log_and_fail",
            "message": f"Unexpected status: {status_code}"
        })

    @classmethod
    def generate_error_handling_code(cls, retry_config: RetryConfig) -> str:
        """Generate n8n Code node for comprehensive error handling."""
        return f'''// Comprehensive Error Handler
const statusCode = $input.first().json.statusCode || $response?.statusCode || 200;
const errorMessage = $input.first().json.message || $input.first().json.error || '';

// Define handlers for each status
const handlers = {{
  400: {{ action: 'fail', reason: 'Bad Request' }},
  401: {{ action: 'refresh', reason: 'Unauthorized' }},
  403: {{ action: 'fail', reason: 'Forbidden' }},
  404: {{ action: 'skip', reason: 'Not Found' }},
  408: {{ action: 'retry', reason: 'Timeout' }},
  429: {{ action: 'backoff', reason: 'Rate Limited' }},
  500: {{ action: 'retry', reason: 'Server Error' }},
  502: {{ action: 'retry', reason: 'Bad Gateway' }},
  503: {{ action: 'retry', reason: 'Service Unavailable' }},
  504: {{ action: 'retry', reason: 'Gateway Timeout' }}
}};

const handler = handlers[statusCode] || {{ action: 'continue', reason: 'OK' }};
const retryCount = $workflow.runData?.errorRetryCount || 0;
const maxRetries = {retry_config.max_retries};

// Calculate backoff delay
const baseDelay = {retry_config.base_delay_ms};
const backoffDelay = Math.min(baseDelay * Math.pow(2, retryCount), {retry_config.max_delay_ms});

let result = {{
  statusCode,
  action: handler.action,
  reason: handler.reason,
  errorMessage,
  retryCount,
  canRetry: handler.action === 'retry' && retryCount < maxRetries
}};

if (handler.action === 'backoff') {{
  // Check Retry-After header
  const retryAfter = parseInt($response?.headers?.['retry-after'] || 0);
  result.waitMs = retryAfter > 0 ? retryAfter * 1000 : backoffDelay;
  result.canRetry = retryCount < maxRetries;
}} else if (handler.action === 'retry') {{
  result.waitMs = backoffDelay;
}}

return {{ json: result }};'''

    @classmethod
    def generate_error_workflow(cls) -> dict:
        """Generate n8n error handling sub-workflow."""
        return {
            "nodes": [
                {
                    "parameters": {
                        "conditions": {
                            "number": [
                                {"value1": "={{ $json.statusCode }}", "operation": "gte", "value2": 400}
                            ]
                        }
                    },
                    "name": "Is Error?",
                    "type": "n8n-nodes-base.if",
                    "typeVersion": 2,
                    "position": [0, 0]
                },
                {
                    "parameters": {
                        "conditions": {
                            "boolean": [
                                {"value1": "={{ $json.canRetry }}", "value2": True}
                            ]
                        }
                    },
                    "name": "Can Retry?",
                    "type": "n8n-nodes-base.if",
                    "typeVersion": 2,
                    "position": [200, 0]
                },
                {
                    "parameters": {
                        "waitTime": "={{ $json.waitMs / 1000 }}"
                    },
                    "name": "Wait for Backoff",
                    "type": "n8n-nodes-base.wait",
                    "typeVersion": 1,
                    "position": [400, -100]
                },
                {
                    "parameters": {
                        "errorMessage": "={{ $json.reason }}: {{ $json.errorMessage }}"
                    },
                    "name": "Throw Error",
                    "type": "n8n-nodes-base.stopAndError",
                    "typeVersion": 1,
                    "position": [400, 100]
                }
            ]
        }


class APIOrchestrator:
    """Main orchestrator for API integrations."""

    def __init__(self):
        self.endpoint_mapper = EndpointMapper()
        self.auth_manager = AuthManager()
        self.pagination_engine = PaginationEngine()
        self.error_handler = ErrorHandler()

    def create_integration(self, service_name: str, base_url: str,
                          description: str = "") -> APIIntegration:
        """Create a new API integration."""
        # Auto-detect auth for known services
        auth = self.auth_manager.get_auth_for_service(service_name)

        # Auto-detect pagination for known services
        pagination = self.pagination_engine.get_pattern_for_service(service_name)

        return APIIntegration(
            service_name=service_name,
            base_url=base_url,
            description=description,
            auth=auth,
            pagination=pagination if pagination.pagination_type != PaginationType.NONE else None
        )

    def create_integration_from_spec(self, spec: dict) -> APIIntegration:
        """Create integration from OpenAPI/Swagger spec."""
        info = spec.get("info", {})
        servers = spec.get("servers", [{}])

        integration = APIIntegration(
            service_name=info.get("title", "API"),
            base_url=servers[0].get("url", ""),
            description=info.get("description", "")
        )

        # Parse endpoints from spec
        integration.endpoints = self.endpoint_mapper.parse_api_spec(spec)

        # Detect security schemes
        security = spec.get("securityDefinitions", spec.get("components", {}).get("securitySchemes", {}))
        if security:
            first_scheme = list(security.values())[0] if security else {}
            scheme_type = first_scheme.get("type", "")

            if scheme_type == "apiKey":
                integration.auth = AuthConfig.api_key(
                    "API Key",
                    first_scheme.get("name", "X-API-Key")
                )
            elif scheme_type == "http" and first_scheme.get("scheme") == "bearer":
                integration.auth = AuthConfig.bearer_token("Bearer Token")
            elif scheme_type == "oauth2":
                integration.auth = AuthConfig.oauth2("OAuth2", [])

        return integration

    def generate_complete_workflow(self, integration: APIIntegration,
                                  include_pagination: bool = True,
                                  include_error_handling: bool = True) -> dict:
        """Generate complete n8n workflow for integration."""
        workflow = integration.to_n8n_workflow()

        # Add pagination if configured
        if include_pagination and integration.pagination:
            pagination_nodes = self.pagination_engine.generate_pagination_workflow(
                integration.pagination
            )
            # Insert pagination nodes into workflow

        # Add error handling
        if include_error_handling:
            error_nodes = self.error_handler.generate_error_workflow()
            # Insert error handling nodes

        return workflow

    def test_endpoint(self, endpoint: EndpointConfig, base_url: str,
                     auth: AuthConfig = None) -> dict:
        """Generate test configuration for an endpoint."""
        return {
            "url": endpoint.full_url(base_url),
            "method": endpoint.method.value,
            "headers": {h.name: h.value for h in endpoint.headers},
            "auth_type": auth.auth_type.value if auth else "none",
            "expected_status": 200,
            "timeout_ms": endpoint.timeout_ms
        }


# ═══════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Dashboard Generation
# ═══════════════════════════════════════════════════════════════════════════════

class APIReporter:
    """Generates ASCII dashboard reports for API integrations."""

    @staticmethod
    def generate_integration_report(integration: APIIntegration) -> str:
        """Generate comprehensive integration report."""
        lines = []
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Header
        lines.append("API INTEGRATION")
        lines.append("═" * 55)
        lines.append(f"Service: {integration.service_name}")
        lines.append(f"Base URL: {integration.base_url}")
        lines.append(f"Time: {now}")
        lines.append("═" * 55)
        lines.append("")

        # Integration Overview
        lines.append("INTEGRATION OVERVIEW")
        lines.append("─" * 55)
        lines.append("┌" + "─" * 53 + "┐")
        lines.append("│" + "API CONNECTION STATUS".center(53) + "│")
        lines.append("│" + " " * 53 + "│")
        lines.append(f"│  Base URL: {integration.base_url[:40]:<41}│")
        lines.append(f"│  Endpoints: {len(integration.endpoints):<40}│")
        lines.append(f"│  Auth Type: {integration.auth.auth_type.value:<40}│")
        lines.append("│" + " " * 53 + "│")

        # Complexity bar
        complexity = integration.complexity_score
        bar = "█" * complexity + "░" * (10 - complexity)
        lines.append(f"│  Complexity: {bar} {complexity}/10".ljust(54) + "│")
        lines.append("│  Status: ● Configuration Ready".ljust(54) + "│")
        lines.append("└" + "─" * 53 + "┘")
        lines.append("")

        # Authentication
        lines.append("AUTHENTICATION")
        lines.append("─" * 55)
        lines.append("┌" + "─" * 53 + "┐")
        lines.append(f"│  TYPE: {integration.auth.auth_type.value.upper():<44}│")
        lines.append("│" + " " * 53 + "│")
        if integration.auth.header_name:
            lines.append(f"│  HEADER: {integration.auth.header_name:<42}│")
        if integration.auth.header_prefix:
            lines.append(f"│  PREFIX: {integration.auth.header_prefix:<42}│")
        lines.append("│" + " " * 53 + "│")
        lines.append("│  CREDENTIAL SETUP:".ljust(54) + "│")
        for line in integration.auth.generate_credential_setup().split("\n")[:5]:
            lines.append(f"│  {line[:49]:<51}│")
        lines.append("└" + "─" * 53 + "┘")
        lines.append("")

        # Endpoints
        lines.append("ENDPOINTS")
        lines.append("─" * 55)
        lines.append("| Method | Path | Description |")
        lines.append("|--------|------|-------------|")
        for endpoint in integration.endpoints[:10]:
            method = endpoint.method.value.ljust(6)
            path = endpoint.path[:20].ljust(20)
            desc = endpoint.description[:20].ljust(20)
            lines.append(f"| {method} | {path} | {desc} |")
        if len(integration.endpoints) > 10:
            lines.append(f"| ... | +{len(integration.endpoints) - 10} more endpoints | |")
        lines.append("")

        # Pagination
        if integration.pagination:
            lines.append("PAGINATION")
            lines.append("─" * 55)
            lines.append("┌" + "─" * 53 + "┐")
            lines.append(f"│  Type: {integration.pagination.pagination_type.value:<44}│")
            lines.append(f"│  Page Size: {integration.pagination.page_size:<39}│")
            lines.append(f"│  Max Pages: {integration.pagination.max_pages:<39}│")
            lines.append(f"│  Data Path: {integration.pagination.data_path:<39}│")
            lines.append("└" + "─" * 53 + "┘")
            lines.append("")

        # Retry Configuration
        lines.append("ERROR HANDLING")
        lines.append("─" * 55)
        lines.append("| Status | Action | Retry |")
        lines.append("|--------|--------|-------|")
        lines.append("| 429 | Rate limit backoff | Yes |")
        lines.append("| 401 | Refresh credentials | Once |")
        lines.append("| 500 | Retry with delay | 3x |")
        lines.append("| 404 | Log and skip | No |")
        lines.append("")

        # Implementation Checklist
        lines.append("IMPLEMENTATION CHECKLIST")
        lines.append("─" * 55)
        has_auth = integration.auth.auth_type != AuthType.NONE
        has_endpoints = len(integration.endpoints) > 0
        has_pagination = integration.pagination is not None

        lines.append(f"  {'●' if has_auth else '○'} Credentials configured")
        lines.append(f"  {'●' if has_endpoints else '○'} Endpoints defined")
        lines.append(f"  {'●' if has_pagination else '○'} Pagination handled")
        lines.append("  ● Error handling enabled")
        lines.append("  ○ Data transformation (configure as needed)")
        lines.append("")

        lines.append(f"Integration Status: {'● Ready to Use' if has_auth and has_endpoints else '○ Configuration Needed'}")

        return "\n".join(lines)

    @staticmethod
    def generate_endpoint_report(endpoint: EndpointConfig, base_url: str) -> str:
        """Generate report for a single endpoint."""
        lines = []

        lines.append("ENDPOINT CONFIGURATION")
        lines.append("═" * 55)
        lines.append(f"URL: {endpoint.full_url(base_url)}")
        lines.append(f"Method: {endpoint.method.value}")
        lines.append(f"Description: {endpoint.description}")
        lines.append("")

        if endpoint.headers:
            lines.append("HEADERS")
            lines.append("─" * 55)
            for header in endpoint.headers:
                sensitive = " (sensitive)" if header.is_sensitive else ""
                lines.append(f"  {header.name}: {header.value}{sensitive}")
            lines.append("")

        if endpoint.query_params:
            lines.append("QUERY PARAMETERS")
            lines.append("─" * 55)
            for param in endpoint.query_params:
                required = " (required)" if param.required else ""
                lines.append(f"  {param.name}: {param.value}{required}")
            lines.append("")

        if endpoint.body_template:
            lines.append("REQUEST BODY TEMPLATE")
            lines.append("─" * 55)
            lines.append(json.dumps(endpoint.body_template, indent=2))
            lines.append("")

        lines.append(f"Response Format: {endpoint.response_format.value}")
        lines.append(f"Timeout: {endpoint.timeout_ms}ms")

        return "\n".join(lines)

    @staticmethod
    def generate_auth_report(auth: AuthConfig) -> str:
        """Generate authentication setup report."""
        lines = []

        lines.append("AUTHENTICATION SETUP")
        lines.append("═" * 55)
        lines.append(f"Type: {auth.auth_type.value}")
        lines.append(f"Credential: {auth.credential_name}")
        lines.append("")
        lines.append(auth.generate_credential_setup())

        if auth.auth_type.requires_refresh:
            lines.append("")
            lines.append("TOKEN REFRESH")
            lines.append("─" * 55)
            lines.append(f"  Refresh before expiry: {auth.refresh_before_expiry}s")
            if auth.token_url:
                lines.append(f"  Token URL: {auth.token_url}")

        return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# CLI - Command Line Interface
# ═══════════════════════════════════════════════════════════════════════════════

def create_parser() -> argparse.ArgumentParser:
    """Create CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="n8n-api",
        description="N8N.API.EXE - n8n API Integration Specialist"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Connect command
    connect_parser = subparsers.add_parser("connect", help="Connect to an API service")
    connect_parser.add_argument("service", help="Service name (e.g., stripe, github)")
    connect_parser.add_argument("--url", "-u", help="Base URL for the API")
    connect_parser.add_argument("--output", "-o", help="Output file for workflow JSON")

    # Auth command
    auth_parser = subparsers.add_parser("auth", help="Set up authentication")
    auth_parser.add_argument("type", choices=["api_key", "bearer", "basic", "oauth2"],
                            help="Authentication type")
    auth_parser.add_argument("--name", "-n", default="API Credential",
                            help="Credential name")
    auth_parser.add_argument("--header", "-H", help="Header name for API key")

    # Endpoint command
    endpoint_parser = subparsers.add_parser("endpoint", help="Configure an endpoint")
    endpoint_parser.add_argument("method", choices=["GET", "POST", "PUT", "PATCH", "DELETE"],
                                help="HTTP method")
    endpoint_parser.add_argument("path", help="Endpoint path")
    endpoint_parser.add_argument("--base-url", "-u", required=True, help="Base URL")
    endpoint_parser.add_argument("--description", "-d", help="Endpoint description")

    # Paginate command
    paginate_parser = subparsers.add_parser("paginate", help="Configure pagination")
    paginate_parser.add_argument("type", choices=["offset", "cursor", "page", "link"],
                                help="Pagination type")
    paginate_parser.add_argument("--limit", "-l", type=int, default=100,
                                help="Page size")
    paginate_parser.add_argument("--cursor-field", help="Field containing next cursor")
    paginate_parser.add_argument("--data-path", default="data", help="Path to data array")

    # Generate command
    generate_parser = subparsers.add_parser("generate", help="Generate workflow")
    generate_parser.add_argument("service", help="Service name")
    generate_parser.add_argument("--url", "-u", required=True, help="Base URL")
    generate_parser.add_argument("--endpoints", "-e", nargs="+", help="Endpoint paths")
    generate_parser.add_argument("--output", "-o", help="Output file")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_parser()
    args = parser.parse_args()

    orchestrator = APIOrchestrator()
    reporter = APIReporter()

    if args.command == "connect":
        # Create integration for known service
        base_url = args.url or f"https://api.{args.service}.com"
        integration = orchestrator.create_integration(args.service, base_url)

        print(reporter.generate_integration_report(integration))

        if args.output:
            workflow = integration.to_n8n_workflow()
            with open(args.output, "w") as f:
                json.dump(workflow, f, indent=2)
            print(f"\nWorkflow saved to: {args.output}")

    elif args.command == "auth":
        # Generate auth configuration
        if args.type == "api_key":
            auth = AuthConfig.api_key(args.name, args.header or "X-API-Key")
        elif args.type == "bearer":
            auth = AuthConfig.bearer_token(args.name)
        elif args.type == "basic":
            auth = AuthConfig.basic_auth(args.name)
        elif args.type == "oauth2":
            auth = AuthConfig.oauth2(args.name, [])

        print(reporter.generate_auth_report(auth))

    elif args.command == "endpoint":
        # Configure endpoint
        endpoint = EndpointConfig(
            path=args.path,
            method=HttpMethod(args.method),
            description=args.description or ""
        )

        print(reporter.generate_endpoint_report(endpoint, args.base_url))

    elif args.command == "paginate":
        # Generate pagination config
        if args.type == "offset":
            config = PaginationConfig.offset_pagination(args.limit, data_path=args.data_path)
        elif args.type == "cursor":
            config = PaginationConfig.cursor_pagination(
                args.limit, cursor_response_path=args.cursor_field or "next_cursor",
                data_path=args.data_path
            )
        elif args.type == "page":
            config = PaginationConfig.page_pagination(args.limit, data_path=args.data_path)
        elif args.type == "link":
            config = PaginationConfig(pagination_type=PaginationType.LINK_HEADER)

        print("PAGINATION CONFIGURATION")
        print("═" * 55)
        print(f"Type: {config.pagination_type.value}")
        print(f"Page Size: {config.page_size}")
        print(f"Data Path: {config.data_path}")
        print("")
        print("PAGINATION CODE")
        print("─" * 55)
        print(config.generate_loop_code())

    elif args.command == "generate":
        # Generate complete workflow
        integration = orchestrator.create_integration(args.service, args.url)

        if args.endpoints:
            for path in args.endpoints:
                integration.add_endpoint(path)

        workflow = orchestrator.generate_complete_workflow(integration)

        print(reporter.generate_integration_report(integration))

        if args.output:
            with open(args.output, "w") as f:
                json.dump(workflow, f, indent=2)
            print(f"\nWorkflow saved to: {args.output}")
        else:
            print("\nWORKFLOW JSON")
            print("─" * 55)
            print(json.dumps(workflow, indent=2)[:2000])

    elif args.command == "demo":
        # Run demonstration
        print("N8N.API.EXE - API Integration Demo")
        print("=" * 55)
        print()

        # Demo: Stripe integration
        stripe_integration = orchestrator.create_integration(
            "Stripe",
            "https://api.stripe.com/v1",
            "Stripe payment processing API"
        )

        # Add common Stripe endpoints
        stripe_integration.add_endpoint("/customers", HttpMethod.GET, "List customers")
        stripe_integration.add_endpoint("/customers", HttpMethod.POST, "Create customer")
        stripe_integration.add_endpoint("/charges", HttpMethod.GET, "List charges")
        stripe_integration.add_endpoint("/invoices", HttpMethod.GET, "List invoices")

        print(reporter.generate_integration_report(stripe_integration))
        print()
        print("Demo completed! Use commands like:")
        print("  n8n-api connect github")
        print("  n8n-api auth bearer --name 'My Token'")
        print("  n8n-api paginate cursor --cursor-field next_page")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/n8n-api connect [service]` - Integrate specific API
- `/n8n-api auth [type]` - Setup authentication pattern
- `/n8n-api paginate [type]` - Implement pagination
- `/n8n-api endpoint [method] [path]` - Configure endpoint
- `/n8n-api generate [service]` - Generate complete workflow

## AUTHENTICATION TYPES

| Type | Header | Format |
|------|--------|--------|
| API Key | X-API-Key | Key value directly |
| Bearer | Authorization | Bearer {token} |
| Basic | Authorization | Base64 encoded |
| OAuth 2.0 | Authorization | Bearer {access_token} |
| Custom | Variable | Per API spec |

## PAGINATION TYPES

| Type | Parameters | Example |
|------|------------|---------|
| Offset | offset, limit | ?offset=100&limit=50 |
| Page | page, per_page | ?page=2&per_page=100 |
| Cursor | cursor, limit | ?cursor=abc&limit=50 |
| Link Header | Link header | rel="next" parsing |
| Token | next_token | ?token=xyz |

## KNOWN API PATTERNS

| Service | Auth | Pagination | Base URL |
|---------|------|------------|----------|
| Stripe | Bearer | Cursor | api.stripe.com/v1 |
| GitHub | Bearer | Page/Link | api.github.com |
| Slack | Bearer | Cursor | slack.com/api |
| Shopify | Header | Link | {store}.myshopify.com/admin/api |
| Airtable | Bearer | Cursor | api.airtable.com/v0 |
| Notion | Bearer | Cursor | api.notion.com/v1 |

$ARGUMENTS
