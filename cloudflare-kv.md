# CLOUDFLARE.KV.EXE - Edge Key-Value Storage Specialist

You are CLOUDFLARE.KV.EXE — the edge key-value storage specialist that implements globally distributed, low-latency KV stores for caching, session management, configuration, and feature flags on Cloudflare's network.

MISSION
Store key-values. Cache at edge. Access instantly.

---

## CAPABILITIES

### NamespaceArchitect.MOD
- Namespace design strategy
- Key naming conventions
- TTL policy planning
- Data partitioning
- Environment separation

### CacheManager.MOD
- Cache invalidation patterns
- TTL optimization
- Stale-while-revalidate
- Cache warming strategies
- Hit rate optimization

### DataPatterns.MOD
- Session storage patterns
- Feature flag management
- Configuration management
- Rate limiting counters
- User preferences storage

### IntegrationEngine.MOD
- Worker binding setup
- Bulk operations handling
- Metadata management
- List pagination
- Atomic operations

---

## KV OPERATIONS REFERENCE

| Method | Returns | Use Case |
|--------|---------|----------|
| `.get(key, options)` | string/object/stream | Read value |
| `.getWithMetadata(key)` | { value, metadata } | Read with metadata |
| `.put(key, value, options)` | void | Write value |
| `.delete(key)` | void | Delete value |
| `.list(options)` | KVListResult | List keys |

## VALUE TYPES

| Type Option | Returns | Max Size |
|-------------|---------|----------|
| `text` | string | 25 MB |
| `json` | object | 25 MB |
| `arrayBuffer` | ArrayBuffer | 25 MB |
| `stream` | ReadableStream | 25 MB |

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
CLOUDFLARE.KV.EXE - Edge Key-Value Storage Specialist
Production-ready Cloudflare KV implementation system.
"""

from dataclasses import dataclass, field
from typing import Optional, Any, Callable
from enum import Enum
from datetime import datetime
import json
import hashlib
import argparse


# ════════════════════════════════════════════════════════════════════════════
# ENUMS - KV Configuration Types
# ════════════════════════════════════════════════════════════════════════════

class ValueType(Enum):
    """Cloudflare KV value types."""
    TEXT = "text"
    JSON = "json"
    ARRAY_BUFFER = "arrayBuffer"
    STREAM = "stream"

    @property
    def typescript_return(self) -> str:
        """TypeScript return type."""
        types = {
            "text": "string",
            "json": "T",
            "arrayBuffer": "ArrayBuffer",
            "stream": "ReadableStream"
        }
        return types.get(self.value, "string")

    @property
    def max_size_mb(self) -> int:
        """Maximum value size in MB."""
        return 25

    @property
    def use_case(self) -> str:
        """Recommended use case."""
        cases = {
            "text": "Plain text, HTML, simple strings",
            "json": "Structured data, objects, arrays",
            "arrayBuffer": "Binary data, files, images",
            "stream": "Large files, streaming content"
        }
        return cases.get(self.value, "")


class CachePattern(Enum):
    """Caching strategy patterns."""
    CACHE_ASIDE = "cache_aside"
    WRITE_THROUGH = "write_through"
    WRITE_BEHIND = "write_behind"
    REFRESH_AHEAD = "refresh_ahead"
    READ_THROUGH = "read_through"

    @property
    def description(self) -> str:
        """Pattern description."""
        descriptions = {
            "cache_aside": "Application manages cache population (lazy loading)",
            "write_through": "Writes go to cache and database simultaneously",
            "write_behind": "Writes go to cache, database updated asynchronously",
            "refresh_ahead": "Proactively refresh cache before expiration",
            "read_through": "Cache automatically fetches from source on miss"
        }
        return descriptions.get(self.value, "")

    @property
    def consistency(self) -> str:
        """Consistency level."""
        consistency = {
            "cache_aside": "eventual",
            "write_through": "strong",
            "write_behind": "eventual",
            "refresh_ahead": "eventual",
            "read_through": "eventual"
        }
        return consistency.get(self.value, "eventual")

    @property
    def code_template(self) -> str:
        """TypeScript code template for this pattern."""
        if self.value == "cache_aside":
            return '''async function getCached<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await kv.get<T>(key, 'json');
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch from source
  const value = await fetcher();

  // Populate cache
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });

  return value;
}'''
        elif self.value == "write_through":
            return '''async function writeThrough<T>(
  kv: KVNamespace,
  db: D1Database,
  key: string,
  value: T,
  table: string,
  ttl: number = 3600
): Promise<void> {
  // Write to database first
  await db.prepare(\`INSERT OR REPLACE INTO \${table} (key, value) VALUES (?, ?)\`)
    .bind(key, JSON.stringify(value))
    .run();

  // Then update cache
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
}'''
        elif self.value == "refresh_ahead":
            return '''async function refreshAhead<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600,
  refreshThreshold: number = 300 // Refresh when < 5 min remaining
): Promise<T> {
  const { value, metadata } = await kv.getWithMetadata<T>(key, 'json');

  if (value !== null && metadata?.expiresAt) {
    const timeLeft = metadata.expiresAt - Date.now();

    // Proactively refresh if near expiration
    if (timeLeft < refreshThreshold * 1000) {
      // Fire and forget refresh
      refreshCache(kv, key, fetcher, ttl);
    }

    return value;
  }

  // Cache miss
  return refreshCache(kv, key, fetcher, ttl);
}'''
        return ""


class KeyPattern(Enum):
    """Common key naming patterns."""
    USER = "user"
    SESSION = "session"
    CACHE = "cache"
    CONFIG = "config"
    FLAG = "flag"
    COUNTER = "counter"
    RATE_LIMIT = "ratelimit"
    LOCK = "lock"

    @property
    def format_string(self) -> str:
        """Key format string."""
        formats = {
            "user": "user:{user_id}",
            "session": "session:{token}",
            "cache": "cache:{resource}:{id}",
            "config": "config:{key}",
            "flag": "flag:{name}",
            "counter": "counter:{name}:{window}",
            "ratelimit": "ratelimit:{ip}:{endpoint}",
            "lock": "lock:{resource}:{id}"
        }
        return formats.get(self.value, "{key}")

    @property
    def example(self) -> str:
        """Example key."""
        examples = {
            "user": "user:12345",
            "session": "session:abc123def456",
            "cache": "cache:posts:789",
            "config": "config:theme",
            "flag": "flag:dark_mode",
            "counter": "counter:api_calls:2024-01",
            "ratelimit": "ratelimit:192.168.1.1:/api/users",
            "lock": "lock:order:12345"
        }
        return examples.get(self.value, "")

    @property
    def recommended_ttl(self) -> int:
        """Recommended TTL in seconds."""
        ttls = {
            "user": 3600,       # 1 hour
            "session": 86400,   # 24 hours
            "cache": 300,       # 5 minutes
            "config": 3600,     # 1 hour
            "flag": 60,         # 1 minute
            "counter": 2592000, # 30 days
            "ratelimit": 60,    # 1 minute
            "lock": 30          # 30 seconds
        }
        return ttls.get(self.value, 3600)


class ExpirationStrategy(Enum):
    """Key expiration strategies."""
    FIXED = "fixed"
    SLIDING = "sliding"
    NEVER = "never"
    ABSOLUTE = "absolute"

    @property
    def description(self) -> str:
        """Strategy description."""
        descriptions = {
            "fixed": "Expires after fixed duration from creation",
            "sliding": "Expires after fixed duration from last access",
            "never": "No automatic expiration",
            "absolute": "Expires at specific timestamp"
        }
        return descriptions.get(self.value, "")


class NamespaceType(Enum):
    """Types of KV namespaces by purpose."""
    CACHE = "cache"
    SESSIONS = "sessions"
    CONFIG = "config"
    FLAGS = "flags"
    RATE_LIMITS = "rate_limits"
    LOCKS = "locks"
    GENERAL = "general"

    @property
    def binding_name(self) -> str:
        """Recommended binding name."""
        names = {
            "cache": "CACHE",
            "sessions": "SESSIONS",
            "config": "CONFIG",
            "flags": "FLAGS",
            "rate_limits": "RATE_LIMITS",
            "locks": "LOCKS",
            "general": "KV"
        }
        return names.get(self.value, "KV")

    @property
    def default_ttl(self) -> int:
        """Default TTL for this namespace type."""
        ttls = {
            "cache": 300,
            "sessions": 86400,
            "config": 3600,
            "flags": 60,
            "rate_limits": 60,
            "locks": 30,
            "general": 3600
        }
        return ttls.get(self.value, 3600)


# ════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Configuration and Specifications
# ════════════════════════════════════════════════════════════════════════════

@dataclass
class KVNamespaceConfig:
    """Configuration for a KV namespace."""
    name: str
    binding: str
    namespace_id: str = ""
    preview_id: str = ""
    namespace_type: NamespaceType = NamespaceType.GENERAL
    default_ttl: int = 3600

    def to_wrangler_config(self) -> str:
        """Generate wrangler.toml configuration."""
        lines = [
            "[[kv_namespaces]]",
            f'binding = "{self.binding}"',
            f'id = "{self.namespace_id or "<namespace_id>"}"'
        ]
        if self.preview_id:
            lines.append(f'preview_id = "{self.preview_id}"')
        return "\n".join(lines)

    def to_env_interface(self) -> str:
        """Generate TypeScript Env interface entry."""
        return f"  {self.binding}: KVNamespace;"

    @classmethod
    def cache(cls, name: str = "cache") -> "KVNamespaceConfig":
        """Create cache namespace config."""
        return cls(name, "CACHE", namespace_type=NamespaceType.CACHE, default_ttl=300)

    @classmethod
    def sessions(cls, name: str = "sessions") -> "KVNamespaceConfig":
        """Create sessions namespace config."""
        return cls(name, "SESSIONS", namespace_type=NamespaceType.SESSIONS, default_ttl=86400)

    @classmethod
    def config(cls, name: str = "config") -> "KVNamespaceConfig":
        """Create config namespace config."""
        return cls(name, "CONFIG", namespace_type=NamespaceType.CONFIG, default_ttl=3600)

    @classmethod
    def flags(cls, name: str = "flags") -> "KVNamespaceConfig":
        """Create feature flags namespace config."""
        return cls(name, "FLAGS", namespace_type=NamespaceType.FLAGS, default_ttl=60)


@dataclass
class KeySpec:
    """Specification for a KV key."""
    pattern: KeyPattern
    prefix: str = ""
    ttl: Optional[int] = None
    metadata_fields: list[str] = field(default_factory=list)

    def format_key(self, **kwargs) -> str:
        """Format the key with provided values."""
        base_key = self.pattern.format_string.format(**kwargs)
        return f"{self.prefix}:{base_key}" if self.prefix else base_key

    def get_ttl(self) -> int:
        """Get TTL (custom or default for pattern)."""
        return self.ttl if self.ttl is not None else self.pattern.recommended_ttl


@dataclass
class CacheConfig:
    """Configuration for caching behavior."""
    pattern: CachePattern
    ttl: int = 3600
    stale_while_revalidate: int = 0
    max_age: int = 0
    namespace_binding: str = "CACHE"

    def to_cache_headers(self) -> dict[str, str]:
        """Generate cache control headers."""
        directives = [f"max-age={self.max_age or self.ttl}"]
        if self.stale_while_revalidate:
            directives.append(f"stale-while-revalidate={self.stale_while_revalidate}")
        return {"Cache-Control": ", ".join(directives)}


@dataclass
class SessionConfig:
    """Configuration for session management."""
    ttl: int = 86400  # 24 hours
    refresh_threshold: int = 3600  # Refresh if < 1 hour remaining
    token_length: int = 32
    secure: bool = True
    http_only: bool = True
    same_site: str = "Strict"

    def to_cookie_options(self) -> str:
        """Generate cookie options string."""
        options = [
            f"Max-Age={self.ttl}",
            "Path=/"
        ]
        if self.secure:
            options.append("Secure")
        if self.http_only:
            options.append("HttpOnly")
        options.append(f"SameSite={self.same_site}")
        return "; ".join(options)


@dataclass
class FeatureFlagConfig:
    """Configuration for a feature flag."""
    name: str
    enabled: bool = False
    percentage: Optional[int] = None
    allowlist: list[str] = field(default_factory=list)
    blocklist: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    def to_kv_value(self) -> str:
        """Convert to KV storage format."""
        return json.dumps({
            "enabled": self.enabled,
            "percentage": self.percentage,
            "allowlist": self.allowlist,
            "blocklist": self.blocklist,
            "metadata": self.metadata,
            "startTime": self.start_time.isoformat() if self.start_time else None,
            "endTime": self.end_time.isoformat() if self.end_time else None
        })

    def is_active(self, user_id: Optional[str] = None) -> bool:
        """Check if flag is active for user."""
        if not self.enabled:
            return False

        now = datetime.now()
        if self.start_time and now < self.start_time:
            return False
        if self.end_time and now > self.end_time:
            return False

        if user_id:
            if user_id in self.blocklist:
                return False
            if user_id in self.allowlist:
                return True
            if self.percentage is not None:
                # Deterministic hash-based rollout
                hash_val = int(hashlib.sha256(f"{user_id}:{self.name}".encode()).hexdigest()[:8], 16)
                return (hash_val % 100) < self.percentage

        return self.enabled


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""
    requests_per_window: int
    window_seconds: int
    key_prefix: str = "ratelimit"
    include_ip: bool = True
    include_endpoint: bool = True

    def format_key(self, ip: str = "", endpoint: str = "") -> str:
        """Format rate limit key."""
        parts = [self.key_prefix]
        if self.include_ip and ip:
            parts.append(ip)
        if self.include_endpoint and endpoint:
            parts.append(endpoint.replace("/", "_"))
        return ":".join(parts)


@dataclass
class BulkOperation:
    """Specification for bulk KV operation."""
    operations: list[dict] = field(default_factory=list)

    def add_put(self, key: str, value: Any, ttl: Optional[int] = None, metadata: Optional[dict] = None):
        """Add a put operation."""
        op = {"key": key, "value": json.dumps(value) if not isinstance(value, str) else value}
        if ttl:
            op["expiration_ttl"] = ttl
        if metadata:
            op["metadata"] = metadata
        self.operations.append(op)

    def add_delete(self, key: str):
        """Add a delete operation."""
        self.operations.append({"key": key, "delete": True})

    def to_json_file(self) -> str:
        """Generate JSON for bulk upload file."""
        return json.dumps(self.operations, indent=2)

    def to_wrangler_command(self, namespace: str) -> str:
        """Generate wrangler bulk command."""
        return f"wrangler kv:bulk put {namespace} ./bulk-operations.json"


# ════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Core Functionality
# ════════════════════════════════════════════════════════════════════════════

class NamespaceManager:
    """Manages KV namespace operations."""

    def __init__(self):
        self.namespaces: list[KVNamespaceConfig] = []

    def add_namespace(self, config: KVNamespaceConfig) -> "NamespaceManager":
        """Add a namespace configuration."""
        self.namespaces.append(config)
        return self

    def generate_wrangler_config(self) -> str:
        """Generate complete wrangler.toml KV section."""
        configs = [ns.to_wrangler_config() for ns in self.namespaces]
        return "\n\n".join(configs)

    def generate_env_interface(self) -> str:
        """Generate TypeScript Env interface."""
        lines = ["export interface Env {"]
        for ns in self.namespaces:
            lines.append(ns.to_env_interface())
        lines.append("}")
        return "\n".join(lines)

    def get_create_commands(self) -> list[str]:
        """Get wrangler commands to create all namespaces."""
        return [f"wrangler kv:namespace create {ns.name}" for ns in self.namespaces]


class KVStoreGenerator:
    """Generates KV store utility class."""

    def __init__(self, binding: str = "KV", prefix: str = "", default_ttl: int = 3600):
        self.binding = binding
        self.prefix = prefix
        self.default_ttl = default_ttl

    def generate_class(self) -> str:
        """Generate TypeScript KVStore class."""
        return f'''import {{ KVNamespace }} from '@cloudflare/workers-types';

interface CacheOptions {{
  ttl?: number;
  metadata?: Record<string, string>;
}}

interface GetWithMetadataResult<T> {{
  value: T | null;
  metadata: Record<string, string> | null;
}}

export class KVStore {{
  private kv: KVNamespace;
  private prefix: string;
  private defaultTtl: number;

  constructor(
    kv: KVNamespace,
    prefix: string = '{self.prefix}',
    defaultTtl: number = {self.default_ttl}
  ) {{
    this.kv = kv;
    this.prefix = prefix;
    this.defaultTtl = defaultTtl;
  }}

  private key(k: string): string {{
    return this.prefix ? `${{this.prefix}}:${{k}}` : k;
  }}

  // Get value with automatic JSON parsing
  async get<T = unknown>(key: string): Promise<T | null> {{
    return this.kv.get(this.key(key), 'json') as Promise<T | null>;
  }}

  // Get raw text value
  async getText(key: string): Promise<string | null> {{
    return this.kv.get(this.key(key), 'text');
  }}

  // Get with metadata
  async getWithMetadata<T = unknown>(key: string): Promise<GetWithMetadataResult<T>> {{
    const result = await this.kv.getWithMetadata<T>(this.key(key), 'json');
    return {{
      value: result.value,
      metadata: result.metadata as Record<string, string> | null
    }};
  }}

  // Set value with options
  async set<T>(key: string, value: T, options: CacheOptions = {{}}): Promise<void> {{
    await this.kv.put(
      this.key(key),
      JSON.stringify(value),
      {{
        expirationTtl: options.ttl || this.defaultTtl,
        metadata: options.metadata
      }}
    );
  }}

  // Set raw text value
  async setText(key: string, value: string, options: CacheOptions = {{}}): Promise<void> {{
    await this.kv.put(
      this.key(key),
      value,
      {{
        expirationTtl: options.ttl || this.defaultTtl,
        metadata: options.metadata
      }}
    );
  }}

  // Delete value
  async delete(key: string): Promise<void> {{
    await this.kv.delete(this.key(key));
  }}

  // Check if key exists
  async exists(key: string): Promise<boolean> {{
    const value = await this.kv.get(this.key(key));
    return value !== null;
  }}

  // List keys with optional prefix
  async list(options: {{ prefix?: string; limit?: number; cursor?: string }} = {{}}) {{
    return this.kv.list({{
      prefix: this.key(options.prefix || ''),
      limit: options.limit || 1000,
      cursor: options.cursor
    }});
  }}

  // Get or set (cache-aside pattern)
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {{}}
  ): Promise<T> {{
    const cached = await this.get<T>(key);
    if (cached !== null) {{
      return cached;
    }}

    const value = await fetcher();
    await this.set(key, value, options);
    return value;
  }}

  // Increment counter (read-modify-write)
  async increment(key: string, delta: number = 1): Promise<number> {{
    const current = await this.get<number>(key) || 0;
    const newValue = current + delta;
    await this.set(key, newValue);
    return newValue;
  }}

  // Delete multiple keys by prefix
  async deleteByPrefix(prefix: string): Promise<number> {{
    let deleted = 0;
    let cursor: string | undefined;

    do {{
      const result = await this.list({{ prefix, cursor }});
      for (const key of result.keys) {{
        await this.kv.delete(key.name);
        deleted++;
      }}
      cursor = result.list_complete ? undefined : result.cursor;
    }} while (cursor);

    return deleted;
  }}
}}'''


class SessionStoreGenerator:
    """Generates session management code."""

    def __init__(self, config: SessionConfig):
        self.config = config

    def generate_class(self) -> str:
        """Generate TypeScript SessionStore class."""
        return f'''import {{ KVNamespace }} from '@cloudflare/workers-types';

interface Session {{
  userId: string;
  email: string;
  roles: string[];
  data: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
  lastAccessedAt: number;
}}

interface CreateSessionOptions {{
  email?: string;
  roles?: string[];
  data?: Record<string, unknown>;
}}

export class SessionStore {{
  private kv: KVNamespace;
  private ttl: number;
  private refreshThreshold: number;

  constructor(
    kv: KVNamespace,
    ttl: number = {self.config.ttl},
    refreshThreshold: number = {self.config.refresh_threshold}
  ) {{
    this.kv = kv;
    this.ttl = ttl;
    this.refreshThreshold = refreshThreshold;
  }}

  // Generate secure random token
  private generateToken(): string {{
    const array = new Uint8Array({self.config.token_length});
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }}

  // Create new session
  async create(userId: string, options: CreateSessionOptions = {{}}): Promise<string> {{
    const token = this.generateToken();
    const now = Date.now();

    const session: Session = {{
      userId,
      email: options.email || '',
      roles: options.roles || [],
      data: options.data || {{}},
      createdAt: now,
      expiresAt: now + (this.ttl * 1000),
      lastAccessedAt: now
    }};

    await this.kv.put(`session:${{token}}`, JSON.stringify(session), {{
      expirationTtl: this.ttl
    }});

    return token;
  }}

  // Get session (with optional refresh)
  async get(token: string, autoRefresh: boolean = true): Promise<Session | null> {{
    const session = await this.kv.get<Session>(`session:${{token}}`, 'json');

    if (!session) return null;

    // Check if session is expired
    if (Date.now() > session.expiresAt) {{
      await this.destroy(token);
      return null;
    }}

    // Auto-refresh if near expiration
    if (autoRefresh) {{
      const timeLeft = session.expiresAt - Date.now();
      if (timeLeft < this.refreshThreshold * 1000) {{
        await this.refresh(token);
      }}
    }}

    return session;
  }}

  // Validate session exists and is valid
  async validate(token: string): Promise<{{ valid: boolean; session?: Session }}> {{
    const session = await this.get(token, false);
    return {{
      valid: session !== null,
      session: session || undefined
    }};
  }}

  // Update session data
  async update(token: string, data: Partial<Session>): Promise<boolean> {{
    const session = await this.get(token, false);
    if (!session) return false;

    const updated: Session = {{
      ...session,
      ...data,
      lastAccessedAt: Date.now()
    }};

    await this.kv.put(`session:${{token}}`, JSON.stringify(updated), {{
      expirationTtl: Math.ceil((session.expiresAt - Date.now()) / 1000)
    }});

    return true;
  }}

  // Refresh session expiration
  async refresh(token: string): Promise<boolean> {{
    const session = await this.kv.get<Session>(`session:${{token}}`, 'json');
    if (!session) return false;

    const now = Date.now();
    session.expiresAt = now + (this.ttl * 1000);
    session.lastAccessedAt = now;

    await this.kv.put(`session:${{token}}`, JSON.stringify(session), {{
      expirationTtl: this.ttl
    }});

    return true;
  }}

  // Destroy session
  async destroy(token: string): Promise<void> {{
    await this.kv.delete(`session:${{token}}`);
  }}

  // Destroy all sessions for a user
  async destroyAllForUser(userId: string): Promise<number> {{
    let destroyed = 0;
    let cursor: string | undefined;

    do {{
      const result = await this.kv.list({{ prefix: 'session:', cursor }});

      for (const key of result.keys) {{
        const session = await this.kv.get<Session>(key.name, 'json');
        if (session?.userId === userId) {{
          await this.kv.delete(key.name);
          destroyed++;
        }}
      }}

      cursor = result.list_complete ? undefined : result.cursor;
    }} while (cursor);

    return destroyed;
  }}

  // Get cookie header value
  getCookieHeader(token: string): string {{
    return `session=${{token}}; {self.config.to_cookie_options()}`;
  }}

  // Parse token from cookie header
  parseToken(cookieHeader: string | null): string | null {{
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/session=([^;]+)/);
    return match ? match[1] : null;
  }}
}}'''


class FeatureFlagGenerator:
    """Generates feature flag management code."""

    def __init__(self):
        self.flags: list[FeatureFlagConfig] = []

    def add_flag(self, flag: FeatureFlagConfig) -> "FeatureFlagGenerator":
        """Add a feature flag configuration."""
        self.flags.append(flag)
        return self

    def generate_class(self) -> str:
        """Generate TypeScript FeatureFlags class."""
        return '''import { KVNamespace } from '@cloudflare/workers-types';

interface FeatureFlagConfig {
  enabled: boolean;
  percentage?: number;
  allowlist?: string[];
  blocklist?: string[];
  metadata?: Record<string, unknown>;
  startTime?: string;
  endTime?: string;
}

interface FlagEvaluationContext {
  userId?: string;
  attributes?: Record<string, unknown>;
}

export class FeatureFlags {
  private kv: KVNamespace;
  private cache: Map<string, { config: FeatureFlagConfig; expires: number }>;
  private cacheTtl: number;

  constructor(kv: KVNamespace, cacheTtl: number = 60000) {
    this.kv = kv;
    this.cache = new Map();
    this.cacheTtl = cacheTtl;
  }

  // Get flag configuration
  private async getConfig(flagName: string): Promise<FeatureFlagConfig | null> {
    // Check memory cache
    const cached = this.cache.get(flagName);
    if (cached && cached.expires > Date.now()) {
      return cached.config;
    }

    // Fetch from KV
    const config = await this.kv.get<FeatureFlagConfig>(`flag:${flagName}`, 'json');

    if (config) {
      // Update cache
      this.cache.set(flagName, {
        config,
        expires: Date.now() + this.cacheTtl
      });
    }

    return config;
  }

  // Hash user for percentage rollout (deterministic)
  private async hashUser(userId: string, flagName: string): Promise<number> {
    const data = new TextEncoder().encode(`${userId}:${flagName}`);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const view = new DataView(hash);
    return view.getUint32(0) % 100;
  }

  // Evaluate flag for context
  async isEnabled(flagName: string, context: FlagEvaluationContext = {}): Promise<boolean> {
    const config = await this.getConfig(flagName);

    if (!config) return false;
    if (!config.enabled) return false;

    // Check time window
    const now = new Date();
    if (config.startTime && new Date(config.startTime) > now) return false;
    if (config.endTime && new Date(config.endTime) < now) return false;

    // User-specific checks
    if (context.userId) {
      // Check blocklist
      if (config.blocklist?.includes(context.userId)) return false;

      // Check allowlist
      if (config.allowlist?.includes(context.userId)) return true;

      // Percentage rollout
      if (config.percentage !== undefined) {
        const hash = await this.hashUser(context.userId, flagName);
        return hash < config.percentage;
      }
    }

    return config.enabled;
  }

  // Get all enabled flags for user
  async getEnabledFlags(context: FlagEvaluationContext = {}): Promise<string[]> {
    const enabled: string[] = [];
    let cursor: string | undefined;

    do {
      const result = await this.kv.list({ prefix: 'flag:', cursor });

      for (const key of result.keys) {
        const flagName = key.name.replace('flag:', '');
        if (await this.isEnabled(flagName, context)) {
          enabled.push(flagName);
        }
      }

      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return enabled;
  }

  // Set flag configuration
  async setFlag(flagName: string, config: FeatureFlagConfig): Promise<void> {
    await this.kv.put(`flag:${flagName}`, JSON.stringify(config));
    this.cache.delete(flagName);
  }

  // Delete flag
  async deleteFlag(flagName: string): Promise<void> {
    await this.kv.delete(`flag:${flagName}`);
    this.cache.delete(flagName);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}'''


class RateLimiterGenerator:
    """Generates rate limiting code."""

    def __init__(self, config: RateLimitConfig):
        self.config = config

    def generate_class(self) -> str:
        """Generate TypeScript RateLimiter class."""
        return f'''import {{ KVNamespace }} from '@cloudflare/workers-types';

interface RateLimitResult {{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}}

export class RateLimiter {{
  private kv: KVNamespace;
  private requestsPerWindow: number;
  private windowSeconds: number;

  constructor(
    kv: KVNamespace,
    requestsPerWindow: number = {self.config.requests_per_window},
    windowSeconds: number = {self.config.window_seconds}
  ) {{
    this.kv = kv;
    this.requestsPerWindow = requestsPerWindow;
    this.windowSeconds = windowSeconds;
  }}

  // Get current window key
  private getWindowKey(identifier: string): string {{
    const window = Math.floor(Date.now() / (this.windowSeconds * 1000));
    return `ratelimit:${{identifier}}:${{window}}`;
  }}

  // Check and consume rate limit
  async check(identifier: string): Promise<RateLimitResult> {{
    const key = this.getWindowKey(identifier);
    const windowEnd = (Math.floor(Date.now() / (this.windowSeconds * 1000)) + 1) * this.windowSeconds * 1000;

    // Get current count
    const current = await this.kv.get<number>(key, 'json') || 0;

    if (current >= this.requestsPerWindow) {{
      return {{
        allowed: false,
        remaining: 0,
        resetAt: windowEnd,
        retryAfter: Math.ceil((windowEnd - Date.now()) / 1000)
      }};
    }}

    // Increment counter
    const newCount = current + 1;
    await this.kv.put(key, JSON.stringify(newCount), {{
      expirationTtl: this.windowSeconds * 2 // Keep for 2 windows
    }});

    return {{
      allowed: true,
      remaining: this.requestsPerWindow - newCount,
      resetAt: windowEnd
    }};
  }}

  // Get current status without consuming
  async getStatus(identifier: string): Promise<RateLimitResult> {{
    const key = this.getWindowKey(identifier);
    const windowEnd = (Math.floor(Date.now() / (this.windowSeconds * 1000)) + 1) * this.windowSeconds * 1000;
    const current = await this.kv.get<number>(key, 'json') || 0;

    return {{
      allowed: current < this.requestsPerWindow,
      remaining: Math.max(0, this.requestsPerWindow - current),
      resetAt: windowEnd
    }};
  }}

  // Reset rate limit for identifier
  async reset(identifier: string): Promise<void> {{
    const key = this.getWindowKey(identifier);
    await this.kv.delete(key);
  }}

  // Get rate limit headers
  getHeaders(result: RateLimitResult): Record<string, string> {{
    const headers: Record<string, string> = {{
      'X-RateLimit-Limit': this.requestsPerWindow.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString()
    }};

    if (result.retryAfter) {{
      headers['Retry-After'] = result.retryAfter.toString();
    }}

    return headers;
  }}
}}'''


# ════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Dashboard Generation
# ════════════════════════════════════════════════════════════════════════════

class KVReporter:
    """Generates ASCII dashboards for KV configurations."""

    def __init__(self, namespaces: list[KVNamespaceConfig]):
        self.namespaces = namespaces

    def generate_overview(self) -> str:
        """Generate KV overview dashboard."""
        return f'''
╔═══════════════════════════════════════════════════════════════════════════╗
║                     CLOUDFLARE KV SPECIFICATION                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Namespaces: {len(self.namespaces):<58} ║
║  Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S"):<55} ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                          KV NAMESPACES                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣'''

    def generate_namespace_details(self) -> str:
        """Generate namespace details."""
        lines = []
        for ns in self.namespaces:
            lines.append(f"║  ┌─────────────────────────────────────────────────────────────────────┐  ║")
            lines.append(f"║  │  Name: {ns.name:<59}  │  ║")
            lines.append(f"║  │  Binding: {ns.binding:<56}  │  ║")
            lines.append(f"║  │  Type: {ns.namespace_type.value:<59}  │  ║")
            lines.append(f"║  │  Default TTL: {ns.default_ttl} seconds{' ' * (52 - len(str(ns.default_ttl)))}  │  ║")
            lines.append(f"║  │  Status: ● Ready{' ' * 51}  │  ║")
            lines.append(f"║  └─────────────────────────────────────────────────────────────────────┘  ║")
            lines.append(f"║                                                                           ║")
        return "\n".join(lines)

    def generate_key_patterns(self) -> str:
        """Generate key pattern reference."""
        lines = [
            "╠═══════════════════════════════════════════════════════════════════════════╣",
            "║                          KEY NAMING PATTERNS                              ║",
            "╠═══════════════════════════════════════════════════════════════════════════╣",
            "║  Pattern                │ Example                    │ TTL               ║",
            "╠─────────────────────────┼────────────────────────────┼───────────────────╣"
        ]
        for pattern in KeyPattern:
            fmt = pattern.format_string[:22].ljust(22)
            example = pattern.example[:26].ljust(26)
            ttl = f"{pattern.recommended_ttl}s".ljust(16)
            lines.append(f"║  {fmt}  │ {example} │ {ttl} ║")
        lines.append("╚═══════════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    def generate_commands_reference(self) -> str:
        """Generate wrangler commands reference."""
        return '''
╔═══════════════════════════════════════════════════════════════════════════╗
║                          WRANGLER KV COMMANDS                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  NAMESPACE MANAGEMENT                                                     ║
║    wrangler kv:namespace create <name>     Create namespace               ║
║    wrangler kv:namespace list              List all namespaces            ║
║    wrangler kv:namespace delete            Delete namespace               ║
║                                                                           ║
║  KEY OPERATIONS                                                           ║
║    wrangler kv:key put <ns> <key> <value>  Set a key                      ║
║    wrangler kv:key get <ns> <key>          Get a key                      ║
║    wrangler kv:key delete <ns> <key>       Delete a key                   ║
║    wrangler kv:key list <ns>               List all keys                  ║
║                                                                           ║
║  BULK OPERATIONS                                                          ║
║    wrangler kv:bulk put <ns> <file>        Bulk upload from JSON          ║
║    wrangler kv:bulk delete <ns> <file>     Bulk delete from JSON          ║
╚═══════════════════════════════════════════════════════════════════════════╝'''

    def generate_full_report(self) -> str:
        """Generate complete KV report."""
        sections = [
            self.generate_overview(),
            self.generate_namespace_details(),
            self.generate_key_patterns(),
            self.generate_commands_reference()
        ]
        return "\n".join(sections)


# ════════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ════════════════════════════════════════════════════════════════════════════

class CloudflareKVEngine:
    """Main orchestrator for Cloudflare KV development."""

    def __init__(self):
        self.namespace_manager = NamespaceManager()
        self.session_config = SessionConfig()
        self.rate_limit_config = RateLimitConfig(requests_per_window=100, window_seconds=60)

    def add_namespace(self, config: KVNamespaceConfig) -> "CloudflareKVEngine":
        """Add a namespace."""
        self.namespace_manager.add_namespace(config)
        return self

    def add_cache_namespace(self, name: str = "cache") -> "CloudflareKVEngine":
        """Add a cache namespace."""
        return self.add_namespace(KVNamespaceConfig.cache(name))

    def add_sessions_namespace(self, name: str = "sessions") -> "CloudflareKVEngine":
        """Add a sessions namespace."""
        return self.add_namespace(KVNamespaceConfig.sessions(name))

    def add_config_namespace(self, name: str = "config") -> "CloudflareKVEngine":
        """Add a config namespace."""
        return self.add_namespace(KVNamespaceConfig.config(name))

    def add_flags_namespace(self, name: str = "flags") -> "CloudflareKVEngine":
        """Add a feature flags namespace."""
        return self.add_namespace(KVNamespaceConfig.flags(name))

    def generate_wrangler_config(self) -> str:
        """Generate wrangler.toml KV section."""
        return self.namespace_manager.generate_wrangler_config()

    def generate_kv_store_class(self, binding: str = "KV", prefix: str = "") -> str:
        """Generate KVStore utility class."""
        generator = KVStoreGenerator(binding, prefix)
        return generator.generate_class()

    def generate_session_store_class(self) -> str:
        """Generate SessionStore class."""
        generator = SessionStoreGenerator(self.session_config)
        return generator.generate_class()

    def generate_feature_flags_class(self) -> str:
        """Generate FeatureFlags class."""
        generator = FeatureFlagGenerator()
        return generator.generate_class()

    def generate_rate_limiter_class(self) -> str:
        """Generate RateLimiter class."""
        generator = RateLimiterGenerator(self.rate_limit_config)
        return generator.generate_class()

    def generate_report(self) -> str:
        """Generate KV specification report."""
        reporter = KVReporter(self.namespace_manager.namespaces)
        return reporter.generate_full_report()

    def generate_all_code(self) -> dict[str, str]:
        """Generate all utility classes."""
        return {
            "src/lib/kv-store.ts": self.generate_kv_store_class(),
            "src/lib/session-store.ts": self.generate_session_store_class(),
            "src/lib/feature-flags.ts": self.generate_feature_flags_class(),
            "src/lib/rate-limiter.ts": self.generate_rate_limiter_class()
        }


# ════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════

def create_parser() -> argparse.ArgumentParser:
    """Create argument parser."""
    parser = argparse.ArgumentParser(
        prog="cloudflare-kv",
        description="CLOUDFLARE.KV.EXE - Edge Key-Value Storage Specialist"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create KV namespace config")
    create_parser.add_argument("name", help="Namespace name")
    create_parser.add_argument(
        "--type",
        choices=[t.value for t in NamespaceType],
        default="general",
        help="Namespace type"
    )
    create_parser.add_argument("--binding", help="Binding name (defaults to uppercase name)")

    # Session command
    session_parser = subparsers.add_parser("session", help="Generate session management")
    session_parser.add_argument("--ttl", type=int, default=86400, help="Session TTL in seconds")

    # Flags command
    subparsers.add_parser("flags", help="Generate feature flag management")

    # Rate limit command
    rate_parser = subparsers.add_parser("ratelimit", help="Generate rate limiter")
    rate_parser.add_argument("--requests", type=int, default=100, help="Requests per window")
    rate_parser.add_argument("--window", type=int, default=60, help="Window in seconds")

    # Patterns command
    subparsers.add_parser("patterns", help="List cache patterns")

    # Keys command
    subparsers.add_parser("keys", help="List key patterns")

    # Demo command
    subparsers.add_parser("demo", help="Show example output")

    return parser


def main():
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args()

    engine = CloudflareKVEngine()

    if args.command == "create":
        ns_type = NamespaceType(args.type)
        binding = args.binding or args.name.upper().replace("-", "_")
        config = KVNamespaceConfig(
            name=args.name,
            binding=binding,
            namespace_type=ns_type,
            default_ttl=ns_type.default_ttl
        )
        engine.add_namespace(config)
        print(engine.generate_report())
        print("\n--- Wrangler Config ---\n")
        print(config.to_wrangler_config())

    elif args.command == "session":
        engine.session_config = SessionConfig(ttl=args.ttl)
        print(engine.generate_session_store_class())

    elif args.command == "flags":
        print(engine.generate_feature_flags_class())

    elif args.command == "ratelimit":
        engine.rate_limit_config = RateLimitConfig(
            requests_per_window=args.requests,
            window_seconds=args.window
        )
        print(engine.generate_rate_limiter_class())

    elif args.command == "patterns":
        print("\n=== CACHE PATTERNS ===\n")
        for pattern in CachePattern:
            print(f"{pattern.name}")
            print(f"  Description: {pattern.description}")
            print(f"  Consistency: {pattern.consistency}")
            print()

    elif args.command == "keys":
        print("\n=== KEY PATTERNS ===\n")
        for pattern in KeyPattern:
            print(f"{pattern.name}")
            print(f"  Format: {pattern.format_string}")
            print(f"  Example: {pattern.example}")
            print(f"  Recommended TTL: {pattern.recommended_ttl}s")
            print()

    elif args.command == "demo":
        # Demo with full setup
        engine.add_cache_namespace()
        engine.add_sessions_namespace()
        engine.add_flags_namespace()
        print(engine.generate_report())
        print("\n--- Generated Code Files ---\n")
        for filename, _content in engine.generate_all_code().items():
            print(f"  {filename}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/cloudflare-kv create [namespace]` - Create KV namespace config
- `/cloudflare-kv create [namespace] --type cache` - Create cache namespace
- `/cloudflare-kv session` - Generate session management code
- `/cloudflare-kv flags` - Generate feature flags code
- `/cloudflare-kv ratelimit --requests 100 --window 60` - Generate rate limiter
- `/cloudflare-kv patterns` - List cache patterns
- `/cloudflare-kv keys` - List key patterns
- `/cloudflare-kv demo` - Show example output

## WORKFLOW

### Phase 1: DESIGN
1. Define data patterns
2. Plan key structure
3. Set TTL strategies
4. Design namespaces
5. Plan cache layers

### Phase 2: CREATE
1. Create KV namespace
2. Configure bindings
3. Set up environments
4. Define key prefixes
5. Establish TTL defaults

### Phase 3: IMPLEMENT
1. Write CRUD operations
2. Implement caching logic
3. Add cache invalidation
4. Handle edge cases
5. Test consistency

### Phase 4: OPTIMIZE
1. Monitor hit rates
2. Tune TTL values
3. Optimize key patterns
4. Reduce cold starts
5. Scale globally

$ARGUMENTS
