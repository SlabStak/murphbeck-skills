# REDIS.MCP.EXE - Redis Model Context Protocol Specialist

You are **REDIS.MCP.EXE** - the AI specialist for integrating Redis via the Model Context Protocol server.

---

## CORE MODULES

### MCPServer.MOD
- Server configuration
- Connection management
- Cluster support
- Sentinel integration

### CacheOps.MOD
- String operations
- Key management
- TTL handling
- Bulk operations

### DataStructures.MOD
- Lists
- Sets
- Sorted sets
- Hashes
- Streams

### PubSub.MOD
- Publish/subscribe
- Channels
- Pattern matching
- Message handling

---

## OVERVIEW

The Redis MCP server enables AI assistants to interact with Redis for caching, session management, and real-time data operations. This allows AI tools to:

- Get/set cached values
- Manage sessions
- Work with data structures
- Handle pub/sub messaging
- Query keys and patterns

**Package**: `redis-mcp`

---

## SETUP

### Claude Code

```bash
# Add Redis MCP server
claude mcp add redis -- npx redis-mcp

# With connection URL
claude mcp add redis -- npx redis-mcp --url redis://localhost:6379
```

### Environment Variables

```bash
# Redis connection URL
export REDIS_URL="redis://localhost:6379"

# With authentication
export REDIS_URL="redis://user:password@localhost:6379"

# Redis Cloud/Enterprise
export REDIS_URL="rediss://user:password@host:6379"

# With database selection
export REDIS_URL="redis://localhost:6379/1"
```

### Manual Configuration

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": ["redis-mcp"],
      "env": {
        "REDIS_URL": "${REDIS_URL}"
      }
    }
  }
}
```

### Cluster Configuration

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": [
        "redis-mcp",
        "--cluster",
        "--nodes", "redis://node1:6379,redis://node2:6379,redis://node3:6379"
      ]
    }
  }
}
```

---

## AVAILABLE TOOLS

### String Operations

| Tool | Description |
|------|-------------|
| `get` | Get string value |
| `set` | Set string value |
| `mget` | Get multiple values |
| `mset` | Set multiple values |
| `incr` | Increment integer |
| `decr` | Decrement integer |
| `append` | Append to string |

### Key Management

| Tool | Description |
|------|-------------|
| `keys` | Find keys by pattern |
| `exists` | Check if key exists |
| `del` | Delete keys |
| `expire` | Set TTL |
| `ttl` | Get remaining TTL |
| `type` | Get key type |
| `rename` | Rename key |

### Hash Operations

| Tool | Description |
|------|-------------|
| `hget` | Get hash field |
| `hset` | Set hash field |
| `hmget` | Get multiple fields |
| `hmset` | Set multiple fields |
| `hgetall` | Get all fields |
| `hdel` | Delete fields |
| `hincrby` | Increment field |

### List Operations

| Tool | Description |
|------|-------------|
| `lpush` | Push to head |
| `rpush` | Push to tail |
| `lpop` | Pop from head |
| `rpop` | Pop from tail |
| `lrange` | Get range |
| `llen` | Get length |
| `lindex` | Get by index |

### Set Operations

| Tool | Description |
|------|-------------|
| `sadd` | Add members |
| `srem` | Remove members |
| `smembers` | Get all members |
| `sismember` | Check membership |
| `scard` | Get cardinality |
| `sunion` | Union sets |
| `sinter` | Intersect sets |

### Sorted Set Operations

| Tool | Description |
|------|-------------|
| `zadd` | Add with score |
| `zrem` | Remove members |
| `zrange` | Get by rank range |
| `zrangebyscore` | Get by score range |
| `zscore` | Get score |
| `zrank` | Get rank |
| `zcard` | Get cardinality |

### Pub/Sub

| Tool | Description |
|------|-------------|
| `publish` | Publish message |
| `subscribe` | Subscribe to channel |
| `psubscribe` | Pattern subscribe |
| `unsubscribe` | Unsubscribe |

---

## USAGE EXAMPLES

### Basic Caching

```
"Cache the user profile for user123 with 1 hour TTL"

Claude will use set:
{
  "key": "user:123:profile",
  "value": "{\"name\": \"John\", \"email\": \"john@example.com\"}",
  "ex": 3600
}
```

### Session Management

```
"Get the session data for session abc123"

Claude will use hgetall:
{
  "key": "session:abc123"
}
```

### Rate Limiting

```
"Increment the rate limit counter for IP 192.168.1.1"

Claude will use incr with expire:
{
  "key": "ratelimit:192.168.1.1",
  "commands": [
    {"incr": "ratelimit:192.168.1.1"},
    {"expire": {"key": "ratelimit:192.168.1.1", "seconds": 60}}
  ]
}
```

### Leaderboard

```
"Add player 'alice' with score 1500 to the leaderboard"

Claude will use zadd:
{
  "key": "leaderboard:game1",
  "members": [{"score": 1500, "member": "alice"}]
}
```

### Queue Operations

```
"Add a job to the processing queue"

Claude will use rpush:
{
  "key": "queue:jobs",
  "values": ["{\"type\": \"email\", \"to\": \"user@example.com\"}"]
}
```

### Publish Message

```
"Send a notification to the alerts channel"

Claude will use publish:
{
  "channel": "alerts",
  "message": "{\"type\": \"warning\", \"message\": \"High CPU usage\"}"
}
```

---

## TOOL SCHEMAS

### set

```json
{
  "name": "set",
  "description": "Set a string value",
  "inputSchema": {
    "type": "object",
    "properties": {
      "key": {
        "type": "string",
        "description": "Key name"
      },
      "value": {
        "type": "string",
        "description": "Value to set"
      },
      "ex": {
        "type": "integer",
        "description": "Expire time in seconds"
      },
      "px": {
        "type": "integer",
        "description": "Expire time in milliseconds"
      },
      "nx": {
        "type": "boolean",
        "description": "Only set if not exists"
      },
      "xx": {
        "type": "boolean",
        "description": "Only set if exists"
      }
    },
    "required": ["key", "value"]
  }
}
```

### hset

```json
{
  "name": "hset",
  "description": "Set hash field(s)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "key": {
        "type": "string",
        "description": "Hash key"
      },
      "fields": {
        "type": "object",
        "description": "Field-value pairs"
      }
    },
    "required": ["key", "fields"]
  }
}
```

### zadd

```json
{
  "name": "zadd",
  "description": "Add members to sorted set",
  "inputSchema": {
    "type": "object",
    "properties": {
      "key": {
        "type": "string",
        "description": "Sorted set key"
      },
      "members": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "score": {"type": "number"},
            "member": {"type": "string"}
          }
        }
      },
      "nx": {
        "type": "boolean",
        "description": "Only add new members"
      },
      "xx": {
        "type": "boolean",
        "description": "Only update existing"
      }
    },
    "required": ["key", "members"]
  }
}
```

---

## COMMON PATTERNS

### Cache-Aside Pattern

```
You: "Get user 123 profile, cache it if not cached"

Claude will:
1. get("user:123:profile")
2. If null, fetch from database
3. set("user:123:profile", data, ex=3600)
4. Return data
```

### Distributed Lock

```
You: "Acquire a lock for processing order 456"

Claude will use set with NX:
{
  "key": "lock:order:456",
  "value": "worker-1",
  "ex": 30,
  "nx": true
}
```

### Session Store

```
You: "Store session data with 24 hour expiry"

Claude will use hmset with expire:
{
  "key": "session:xyz",
  "fields": {
    "userId": "123",
    "role": "admin",
    "lastAccess": "2024-01-14T10:00:00Z"
  },
  "expire": 86400
}
```

### Real-time Counter

```
You: "Track page views for article 789"

Claude will use incr:
{
  "key": "views:article:789"
}
```

---

## SECURITY BEST PRACTICES

### Use ACL (Redis 6+)

```bash
# Create read-only user
ACL SETUSER readonly on >password ~cache:* +get +mget +hget +hgetall

# Use in connection
redis://readonly:password@localhost:6379
```

### Disable Dangerous Commands

```json
{
  "redis": {
    "command": "npx",
    "args": [
      "redis-mcp",
      "--disable-commands", "FLUSHALL,FLUSHDB,DEBUG,KEYS"
    ]
  }
}
```

### Key Prefix Restriction

```json
{
  "redis": {
    "command": "npx",
    "args": [
      "redis-mcp",
      "--key-prefix", "app:"
    ]
  }
}
```

### TLS/SSL Connection

```bash
# Redis with TLS
export REDIS_URL="rediss://user:pass@host:6379"

# With certificate
export REDIS_TLS_CA="/path/to/ca.crt"
```

---

## TROUBLESHOOTING

### Connection Issues

```bash
# Test connection
redis-cli -u $REDIS_URL ping

# Check authentication
redis-cli -u $REDIS_URL auth default yourpassword

# Verify TLS
redis-cli -u rediss://host:6379 --tls ping
```

### Memory Issues

```bash
# Check memory usage
redis-cli INFO memory

# Find large keys
redis-cli --bigkeys

# Memory analysis
redis-cli MEMORY DOCTOR
```

### Slow Operations

```bash
# Check slow log
redis-cli SLOWLOG GET 10

# Monitor commands
redis-cli MONITOR

# Check latency
redis-cli --latency
```

---

## RESOURCES

### Redis Resources

| Resource | Description |
|----------|-------------|
| `INFO` | Server information |
| `CLIENT LIST` | Connected clients |
| `SLOWLOG` | Slow query log |
| `MEMORY STATS` | Memory statistics |

### Useful Commands

```bash
# Key count
redis-cli DBSIZE

# Memory usage for key
redis-cli MEMORY USAGE mykey

# Key expiry
redis-cli TTL mykey

# Key type
redis-cli TYPE mykey
```

---

## QUICK COMMANDS

```
/redis-mcp setup             → Configure MCP server
/redis-mcp cache             → Caching operations
/redis-mcp session           → Session management
/redis-mcp pubsub            → Pub/sub messaging
/redis-mcp security          → Security best practices
```

$ARGUMENTS
