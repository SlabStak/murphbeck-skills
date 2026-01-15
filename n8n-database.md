# N8N.DATABASE.EXE - n8n Database Operations Specialist

You are N8N.DATABASE.EXE — the n8n database integration specialist that connects workflows to PostgreSQL, MySQL, MongoDB, Redis, and other databases with proper queries, transactions, sync patterns, and caching strategies.

MISSION
Connect databases. Query data. Sync systems.

---

## CAPABILITIES

### QueryArchitect.MOD
- SQL query construction
- NoSQL aggregation pipelines
- Parameterized query building
- Join optimization
- Index recommendations

### SyncEngine.MOD
- Full sync patterns
- Incremental sync design
- CDC implementation
- State management
- Conflict resolution

### TransactionManager.MOD
- Multi-step transactions
- Rollback handling
- Connection pooling
- Timeout configuration
- Error recovery

### CacheLayer.MOD
- Redis integration
- Cache invalidation
- TTL management
- Queue patterns
- Rate limiting

---

## SYSTEM IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
N8N.DATABASE.EXE - n8n Database Operations Specialist
Database integration, sync patterns, and caching for n8n workflows
"""

from dataclasses import dataclass, field
from typing import Optional, Any
from enum import Enum
from datetime import datetime
import json
import argparse


# ============================================================
# ENUMS - Database Domain Types
# ============================================================

class DatabaseType(Enum):
    """Supported database systems."""
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MONGODB = "mongodb"
    REDIS = "redis"
    SQLITE = "sqlite"
    SUPABASE = "supabase"
    AIRTABLE = "airtable"
    MSSQL = "mssql"
    MARIADB = "mariadb"
    CLICKHOUSE = "clickhouse"

    @property
    def n8n_node(self) -> str:
        nodes = {
            "postgresql": "n8n-nodes-base.postgres",
            "mysql": "n8n-nodes-base.mySql",
            "mongodb": "n8n-nodes-base.mongoDb",
            "redis": "n8n-nodes-base.redis",
            "sqlite": "n8n-nodes-base.sqlite",
            "supabase": "n8n-nodes-base.supabase",
            "airtable": "n8n-nodes-base.airtable",
            "mssql": "n8n-nodes-base.microsoftSql",
            "mariadb": "n8n-nodes-base.mariaDb",
            "clickhouse": "n8n-nodes-community.clickhouse"
        }
        return nodes.get(self.value, "")

    @property
    def credential_type(self) -> str:
        creds = {
            "postgresql": "postgres",
            "mysql": "mySql",
            "mongodb": "mongoDb",
            "redis": "redis",
            "sqlite": "",
            "supabase": "supabaseApi",
            "airtable": "airtableTokenApi",
            "mssql": "microsoftSql",
            "mariadb": "mariaDb",
            "clickhouse": "clickhouse"
        }
        return creds.get(self.value, "")

    @property
    def is_sql(self) -> bool:
        return self in (
            DatabaseType.POSTGRESQL, DatabaseType.MYSQL,
            DatabaseType.SQLITE, DatabaseType.MSSQL,
            DatabaseType.MARIADB, DatabaseType.SUPABASE,
            DatabaseType.CLICKHOUSE
        )

    @property
    def is_nosql(self) -> bool:
        return self in (DatabaseType.MONGODB, DatabaseType.REDIS, DatabaseType.AIRTABLE)

    @property
    def default_port(self) -> int:
        ports = {
            "postgresql": 5432,
            "mysql": 3306,
            "mongodb": 27017,
            "redis": 6379,
            "mssql": 1433,
            "mariadb": 3306,
            "clickhouse": 8123
        }
        return ports.get(self.value, 0)

    @property
    def placeholder_style(self) -> str:
        """Parameter placeholder style for prepared statements."""
        styles = {
            "postgresql": "$1, $2, $3",
            "mysql": "?, ?, ?",
            "mssql": "@p1, @p2, @p3",
            "mariadb": "?, ?, ?",
            "sqlite": "?, ?, ?",
            "supabase": "$1, $2, $3"
        }
        return styles.get(self.value, "?")


class OperationType(Enum):
    """Database operation types."""
    SELECT = "select"
    INSERT = "insert"
    UPDATE = "update"
    DELETE = "delete"
    UPSERT = "upsert"
    AGGREGATE = "aggregate"
    EXECUTE = "execute"
    TRANSACTION = "transaction"

    @property
    def is_read(self) -> bool:
        return self in (OperationType.SELECT, OperationType.AGGREGATE)

    @property
    def is_write(self) -> bool:
        return self in (
            OperationType.INSERT, OperationType.UPDATE,
            OperationType.DELETE, OperationType.UPSERT
        )

    @property
    def requires_commit(self) -> bool:
        return self.is_write

    @property
    def n8n_operation(self) -> str:
        ops = {
            "select": "select",
            "insert": "insert",
            "update": "update",
            "delete": "delete",
            "upsert": "upsert",
            "aggregate": "aggregate",
            "execute": "executeQuery",
            "transaction": "executeQuery"
        }
        return ops.get(self.value, "executeQuery")


class SyncPattern(Enum):
    """Data synchronization patterns."""
    FULL_SYNC = "full_sync"
    INCREMENTAL = "incremental"
    CDC = "cdc"
    QUEUE_BASED = "queue"
    SNAPSHOT = "snapshot"
    MERGE = "merge"

    @property
    def description(self) -> str:
        descs = {
            "full_sync": "Complete data refresh, replace all records",
            "incremental": "Sync only changed records since last run",
            "cdc": "Change Data Capture - real-time event streaming",
            "queue": "Queue-based processing for high volume",
            "snapshot": "Point-in-time consistent copy",
            "merge": "Compare and merge differences"
        }
        return descs.get(self.value, "")

    @property
    def recommended_frequency(self) -> str:
        freqs = {
            "full_sync": "Daily or weekly",
            "incremental": "Every 5-15 minutes",
            "cdc": "Real-time (continuous)",
            "queue": "On-demand",
            "snapshot": "Hourly or daily",
            "merge": "Hourly"
        }
        return freqs.get(self.value, "")

    @property
    def requires_tracking(self) -> bool:
        return self in (SyncPattern.INCREMENTAL, SyncPattern.CDC, SyncPattern.MERGE)


class CacheStrategy(Enum):
    """Caching strategies."""
    WRITE_THROUGH = "write_through"
    WRITE_BEHIND = "write_behind"
    READ_THROUGH = "read_through"
    CACHE_ASIDE = "cache_aside"
    REFRESH_AHEAD = "refresh_ahead"

    @property
    def description(self) -> str:
        descs = {
            "write_through": "Write to cache and DB simultaneously",
            "write_behind": "Write to cache, async write to DB",
            "read_through": "Read from cache, fallback to DB",
            "cache_aside": "App manages cache separately from DB",
            "refresh_ahead": "Preemptively refresh expiring entries"
        }
        return descs.get(self.value, "")

    @property
    def consistency_level(self) -> str:
        levels = {
            "write_through": "Strong",
            "write_behind": "Eventual",
            "read_through": "Eventual",
            "cache_aside": "Eventual",
            "refresh_ahead": "Near-real-time"
        }
        return levels.get(self.value, "")

    @property
    def performance_impact(self) -> str:
        impacts = {
            "write_through": "Higher write latency",
            "write_behind": "Best write performance",
            "read_through": "Best read performance",
            "cache_aside": "Flexible, app-controlled",
            "refresh_ahead": "Prevents cache misses"
        }
        return impacts.get(self.value, "")


class QueryPattern(Enum):
    """Common query patterns."""
    SIMPLE_SELECT = "simple_select"
    PARAMETERIZED = "parameterized"
    PAGINATED = "paginated"
    AGGREGATION = "aggregation"
    JOIN = "join"
    UPSERT = "upsert"
    BATCH = "batch"
    SUBQUERY = "subquery"

    @property
    def template(self) -> str:
        templates = {
            "simple_select": "SELECT * FROM {table}",
            "parameterized": "SELECT * FROM {table} WHERE {column} = $1",
            "paginated": "SELECT * FROM {table} ORDER BY {order_column} LIMIT $1 OFFSET $2",
            "aggregation": "SELECT {group_column}, COUNT(*) as count FROM {table} GROUP BY {group_column}",
            "join": "SELECT * FROM {table1} t1 JOIN {table2} t2 ON t1.{join_column} = t2.{join_column}",
            "upsert": "INSERT INTO {table} ({columns}) VALUES ({values}) ON CONFLICT ({conflict_column}) DO UPDATE SET {update_set}",
            "batch": "INSERT INTO {table} ({columns}) VALUES {batch_values}",
            "subquery": "SELECT * FROM {table} WHERE {column} IN (SELECT {subquery_column} FROM {subquery_table} WHERE {subquery_condition})"
        }
        return templates.get(self.value, "")

    @property
    def use_case(self) -> str:
        cases = {
            "simple_select": "Fetch all records from a table",
            "parameterized": "Safe queries with user input",
            "paginated": "Large dataset navigation",
            "aggregation": "Reports and statistics",
            "join": "Related data from multiple tables",
            "upsert": "Insert or update existing records",
            "batch": "Bulk insert operations",
            "subquery": "Complex filtering with nested queries"
        }
        return cases.get(self.value, "")


class TransactionIsolation(Enum):
    """Transaction isolation levels."""
    READ_UNCOMMITTED = "read_uncommitted"
    READ_COMMITTED = "read_committed"
    REPEATABLE_READ = "repeatable_read"
    SERIALIZABLE = "serializable"

    @property
    def description(self) -> str:
        descs = {
            "read_uncommitted": "Lowest isolation, dirty reads possible",
            "read_committed": "No dirty reads, default for most DBs",
            "repeatable_read": "Consistent reads within transaction",
            "serializable": "Highest isolation, full consistency"
        }
        return descs.get(self.value, "")

    @property
    def performance_impact(self) -> str:
        impacts = {
            "read_uncommitted": "Fastest, no locking",
            "read_committed": "Good balance",
            "repeatable_read": "Some locking overhead",
            "serializable": "Slowest, full locking"
        }
        return impacts.get(self.value, "")


class RedisOperation(Enum):
    """Redis-specific operations."""
    GET = "get"
    SET = "set"
    DELETE = "delete"
    INCR = "incr"
    EXPIRE = "expire"
    LPUSH = "lpush"
    RPOP = "rpop"
    HSET = "hset"
    HGET = "hget"
    PUBLISH = "publish"
    SUBSCRIBE = "subscribe"
    KEYS = "keys"

    @property
    def is_queue_operation(self) -> bool:
        return self in (RedisOperation.LPUSH, RedisOperation.RPOP)

    @property
    def is_pubsub(self) -> bool:
        return self in (RedisOperation.PUBLISH, RedisOperation.SUBSCRIBE)


# ============================================================
# DATACLASSES - Configuration and Data Structures
# ============================================================

@dataclass
class ConnectionConfig:
    """Database connection configuration."""
    db_type: DatabaseType
    host: str = "localhost"
    port: int = 0
    database: str = ""
    username: str = ""
    password: str = ""
    ssl: bool = False
    connection_string: str = ""
    pool_size: int = 10
    timeout_seconds: int = 30
    credential_name: str = ""

    def __post_init__(self):
        if self.port == 0:
            self.port = self.db_type.default_port

    def to_n8n_credential(self) -> dict:
        if self.db_type == DatabaseType.POSTGRESQL:
            return {
                "host": self.host,
                "port": self.port,
                "database": self.database,
                "user": self.username,
                "password": self.password,
                "ssl": "require" if self.ssl else "disable"
            }
        elif self.db_type == DatabaseType.MONGODB:
            return {
                "connectionString": self.connection_string or f"mongodb://{self.host}:{self.port}/{self.database}"
            }
        elif self.db_type == DatabaseType.REDIS:
            return {
                "host": self.host,
                "port": self.port,
                "password": self.password
            }
        return {}

    @classmethod
    def postgres(cls, host: str, database: str, username: str, password: str, ssl: bool = True) -> "ConnectionConfig":
        return cls(
            db_type=DatabaseType.POSTGRESQL,
            host=host,
            database=database,
            username=username,
            password=password,
            ssl=ssl
        )

    @classmethod
    def mongodb(cls, connection_string: str) -> "ConnectionConfig":
        return cls(
            db_type=DatabaseType.MONGODB,
            connection_string=connection_string
        )

    @classmethod
    def redis(cls, host: str = "localhost", port: int = 6379, password: str = "") -> "ConnectionConfig":
        return cls(
            db_type=DatabaseType.REDIS,
            host=host,
            port=port,
            password=password
        )


@dataclass
class QuerySpec:
    """Query specification."""
    operation: OperationType
    table: str
    columns: list[str] = field(default_factory=list)
    where_clause: str = ""
    parameters: list[Any] = field(default_factory=list)
    order_by: str = ""
    limit: int = 0
    offset: int = 0
    joins: list[str] = field(default_factory=list)
    group_by: str = ""
    having: str = ""
    conflict_column: str = ""
    update_columns: list[str] = field(default_factory=list)

    def build_sql(self, db_type: DatabaseType) -> str:
        if self.operation == OperationType.SELECT:
            return self._build_select(db_type)
        elif self.operation == OperationType.INSERT:
            return self._build_insert(db_type)
        elif self.operation == OperationType.UPDATE:
            return self._build_update(db_type)
        elif self.operation == OperationType.DELETE:
            return self._build_delete(db_type)
        elif self.operation == OperationType.UPSERT:
            return self._build_upsert(db_type)
        return ""

    def _build_select(self, db_type: DatabaseType) -> str:
        cols = ", ".join(self.columns) if self.columns else "*"
        sql = f"SELECT {cols} FROM {self.table}"

        if self.joins:
            sql += " " + " ".join(self.joins)
        if self.where_clause:
            sql += f" WHERE {self.where_clause}"
        if self.group_by:
            sql += f" GROUP BY {self.group_by}"
        if self.having:
            sql += f" HAVING {self.having}"
        if self.order_by:
            sql += f" ORDER BY {self.order_by}"
        if self.limit > 0:
            if db_type == DatabaseType.MSSQL:
                sql += f" OFFSET {self.offset} ROWS FETCH NEXT {self.limit} ROWS ONLY"
            else:
                sql += f" LIMIT {self.limit}"
                if self.offset > 0:
                    sql += f" OFFSET {self.offset}"

        return sql

    def _build_insert(self, db_type: DatabaseType) -> str:
        cols = ", ".join(self.columns)
        placeholders = self._get_placeholders(len(self.columns), db_type)
        return f"INSERT INTO {self.table} ({cols}) VALUES ({placeholders})"

    def _build_update(self, db_type: DatabaseType) -> str:
        set_clauses = []
        for i, col in enumerate(self.columns):
            placeholder = self._get_placeholder(i + 1, db_type)
            set_clauses.append(f"{col} = {placeholder}")

        sql = f"UPDATE {self.table} SET {', '.join(set_clauses)}"
        if self.where_clause:
            sql += f" WHERE {self.where_clause}"
        return sql

    def _build_delete(self, db_type: DatabaseType) -> str:
        sql = f"DELETE FROM {self.table}"
        if self.where_clause:
            sql += f" WHERE {self.where_clause}"
        return sql

    def _build_upsert(self, db_type: DatabaseType) -> str:
        cols = ", ".join(self.columns)
        placeholders = self._get_placeholders(len(self.columns), db_type)

        if db_type in (DatabaseType.POSTGRESQL, DatabaseType.SUPABASE):
            update_set = ", ".join([f"{c} = EXCLUDED.{c}" for c in self.update_columns])
            return f"""INSERT INTO {self.table} ({cols}) VALUES ({placeholders})
ON CONFLICT ({self.conflict_column}) DO UPDATE SET {update_set}"""

        elif db_type == DatabaseType.MYSQL:
            update_set = ", ".join([f"{c} = VALUES({c})" for c in self.update_columns])
            return f"""INSERT INTO {self.table} ({cols}) VALUES ({placeholders})
ON DUPLICATE KEY UPDATE {update_set}"""

        return self._build_insert(db_type)

    def _get_placeholder(self, index: int, db_type: DatabaseType) -> str:
        if db_type in (DatabaseType.POSTGRESQL, DatabaseType.SUPABASE):
            return f"${index}"
        elif db_type == DatabaseType.MSSQL:
            return f"@p{index}"
        else:
            return "?"

    def _get_placeholders(self, count: int, db_type: DatabaseType) -> str:
        return ", ".join([self._get_placeholder(i + 1, db_type) for i in range(count)])


@dataclass
class SyncConfig:
    """Data synchronization configuration."""
    pattern: SyncPattern
    source_table: str
    destination_table: str
    tracking_column: str = "updated_at"
    batch_size: int = 1000
    conflict_resolution: str = "source_wins"
    delete_missing: bool = False
    transform_function: str = ""
    last_sync_value: str = ""

    def get_incremental_query(self, db_type: DatabaseType) -> str:
        placeholder = "$1" if db_type in (DatabaseType.POSTGRESQL, DatabaseType.SUPABASE) else "?"
        return f"""SELECT * FROM {self.source_table}
WHERE {self.tracking_column} > {placeholder}
ORDER BY {self.tracking_column}
LIMIT {self.batch_size}"""

    def get_full_sync_query(self) -> str:
        return f"SELECT * FROM {self.source_table}"

    def to_n8n_function_code(self) -> str:
        return f'''// Sync Transform Function
const items = $input.all();
const transformed = items.map(item => {{
  const data = item.json;

  // Apply transformation
  return {{
    json: {{
      ...data,
      _synced_at: new Date().toISOString(),
      _source: '{self.source_table}'
    }}
  }};
}});

return transformed;'''


@dataclass
class CacheConfig:
    """Cache configuration."""
    strategy: CacheStrategy
    key_prefix: str = ""
    ttl_seconds: int = 3600
    max_size: int = 1000
    eviction_policy: str = "lru"
    serialize_format: str = "json"

    def get_cache_key(self, identifier: str) -> str:
        prefix = f"{self.key_prefix}:" if self.key_prefix else ""
        return f"{prefix}{identifier}"

    def to_redis_commands(self, key: str, value: str) -> list[dict]:
        commands = []

        if self.strategy == CacheStrategy.WRITE_THROUGH:
            commands.append({"operation": "set", "key": key, "value": value})
            if self.ttl_seconds > 0:
                commands.append({"operation": "expire", "key": key, "seconds": self.ttl_seconds})

        elif self.strategy == CacheStrategy.CACHE_ASIDE:
            commands.append({"operation": "get", "key": key})
            commands.append({"operation": "set", "key": key, "value": value, "conditional": "if_miss"})

        return commands


@dataclass
class TransactionConfig:
    """Transaction configuration."""
    isolation: TransactionIsolation = TransactionIsolation.READ_COMMITTED
    timeout_seconds: int = 30
    retry_count: int = 3
    retry_delay_ms: int = 100
    savepoints: list[str] = field(default_factory=list)

    def get_begin_statement(self, db_type: DatabaseType) -> str:
        if db_type == DatabaseType.POSTGRESQL:
            return f"BEGIN ISOLATION LEVEL {self.isolation.value.upper().replace('_', ' ')}"
        elif db_type == DatabaseType.MYSQL:
            return f"SET TRANSACTION ISOLATION LEVEL {self.isolation.value.upper().replace('_', ' ')}; START TRANSACTION"
        return "BEGIN"


@dataclass
class MongoOperation:
    """MongoDB operation specification."""
    collection: str
    operation: str  # find, insertOne, updateOne, deleteOne, aggregate
    filter_doc: dict = field(default_factory=dict)
    update_doc: dict = field(default_factory=dict)
    projection: dict = field(default_factory=dict)
    pipeline: list[dict] = field(default_factory=list)
    options: dict = field(default_factory=dict)

    def to_n8n_parameters(self) -> dict:
        params = {
            "collection": self.collection,
            "operation": self.operation
        }

        if self.operation == "find":
            params["query"] = json.dumps(self.filter_doc)
            if self.projection:
                params["projection"] = json.dumps(self.projection)
        elif self.operation in ("insertOne", "insertMany"):
            params["document"] = "={{ $json }}"
        elif self.operation in ("updateOne", "updateMany"):
            params["query"] = json.dumps(self.filter_doc)
            params["update"] = json.dumps(self.update_doc)
        elif self.operation == "aggregate":
            params["pipeline"] = json.dumps(self.pipeline)

        return params


@dataclass
class DatabaseOperation:
    """Complete database operation specification."""
    operation_id: str
    connection: ConnectionConfig
    query_spec: Optional[QuerySpec] = None
    mongo_op: Optional[MongoOperation] = None
    cache_config: Optional[CacheConfig] = None
    sync_config: Optional[SyncConfig] = None
    transaction_config: Optional[TransactionConfig] = None
    estimated_rows: int = 0
    timeout_ms: int = 30000

    def to_n8n_node(self) -> dict:
        if self.connection.db_type == DatabaseType.MONGODB and self.mongo_op:
            return self._build_mongo_node()
        elif self.connection.db_type == DatabaseType.REDIS:
            return self._build_redis_node()
        else:
            return self._build_sql_node()

    def _build_sql_node(self) -> dict:
        sql = self.query_spec.build_sql(self.connection.db_type) if self.query_spec else ""

        return {
            "parameters": {
                "operation": "executeQuery",
                "query": sql,
                "options": {
                    "queryParams": f"={{{{ {json.dumps(self.query_spec.parameters if self.query_spec else [])} }}}}"
                }
            },
            "name": self.operation_id,
            "type": self.connection.db_type.n8n_node,
            "typeVersion": 2,
            "credentials": {
                self.connection.db_type.credential_type: {
                    "id": "={{ $credentials.id }}",
                    "name": self.connection.credential_name
                }
            }
        }

    def _build_mongo_node(self) -> dict:
        return {
            "parameters": self.mongo_op.to_n8n_parameters() if self.mongo_op else {},
            "name": self.operation_id,
            "type": "n8n-nodes-base.mongoDb",
            "typeVersion": 1,
            "credentials": {
                "mongoDb": {
                    "id": "={{ $credentials.id }}",
                    "name": self.connection.credential_name
                }
            }
        }

    def _build_redis_node(self) -> dict:
        return {
            "parameters": {
                "operation": "get",
                "key": "={{ $json.cache_key }}"
            },
            "name": self.operation_id,
            "type": "n8n-nodes-base.redis",
            "typeVersion": 1,
            "credentials": {
                "redis": {
                    "id": "={{ $credentials.id }}",
                    "name": self.connection.credential_name
                }
            }
        }


# ============================================================
# ENGINE CLASSES - Core Processing Logic
# ============================================================

class QueryBuilder:
    """Builds SQL and NoSQL queries."""

    COMMON_INDEXES = {
        "created_at": "CREATE INDEX IF NOT EXISTS idx_{table}_created ON {table}(created_at)",
        "updated_at": "CREATE INDEX IF NOT EXISTS idx_{table}_updated ON {table}(updated_at)",
        "email": "CREATE UNIQUE INDEX IF NOT EXISTS idx_{table}_email ON {table}(email)",
        "user_id": "CREATE INDEX IF NOT EXISTS idx_{table}_user ON {table}(user_id)",
        "status": "CREATE INDEX IF NOT EXISTS idx_{table}_status ON {table}(status)"
    }

    def __init__(self, db_type: DatabaseType):
        self.db_type = db_type

    def select(self, table: str, columns: list[str] = None, where: str = "",
               params: list = None, order_by: str = "", limit: int = 0) -> QuerySpec:
        return QuerySpec(
            operation=OperationType.SELECT,
            table=table,
            columns=columns or [],
            where_clause=where,
            parameters=params or [],
            order_by=order_by,
            limit=limit
        )

    def insert(self, table: str, columns: list[str]) -> QuerySpec:
        return QuerySpec(
            operation=OperationType.INSERT,
            table=table,
            columns=columns
        )

    def update(self, table: str, columns: list[str], where: str = "") -> QuerySpec:
        return QuerySpec(
            operation=OperationType.UPDATE,
            table=table,
            columns=columns,
            where_clause=where
        )

    def upsert(self, table: str, columns: list[str], conflict_col: str,
               update_cols: list[str]) -> QuerySpec:
        return QuerySpec(
            operation=OperationType.UPSERT,
            table=table,
            columns=columns,
            conflict_column=conflict_col,
            update_columns=update_cols
        )

    def paginated_select(self, table: str, order_col: str = "id") -> str:
        return f"""SELECT * FROM {table}
ORDER BY {order_col}
LIMIT $1 OFFSET $2"""

    def suggest_indexes(self, table: str, columns: list[str]) -> list[str]:
        suggestions = []
        for col in columns:
            if col in self.COMMON_INDEXES:
                suggestions.append(
                    self.COMMON_INDEXES[col].format(table=table)
                )
        return suggestions

    def build_aggregation(self, table: str, group_by: str, agg_column: str,
                          agg_func: str = "COUNT") -> str:
        return f"""SELECT {group_by}, {agg_func}({agg_column}) as result
FROM {table}
GROUP BY {group_by}
ORDER BY result DESC"""


class SyncEngine:
    """Handles data synchronization between databases."""

    def __init__(self, config: SyncConfig):
        self.config = config

    def generate_sync_workflow(self, source_conn: ConnectionConfig,
                               dest_conn: ConnectionConfig) -> dict:
        nodes = []
        connections = {}

        # 1. Trigger node
        nodes.append({
            "parameters": {
                "rule": {"interval": [{"field": "minutes", "minutesInterval": 15}]}
            },
            "name": "Schedule Trigger",
            "type": "n8n-nodes-base.scheduleTrigger",
            "typeVersion": 1,
            "position": [250, 300]
        })

        # 2. Get last sync timestamp
        nodes.append({
            "parameters": {
                "jsCode": f'''// Get last sync timestamp
const staticData = $getWorkflowStaticData('global');
const lastSync = staticData.lastSync || '1970-01-01T00:00:00Z';
return [{{ json: {{ lastSync }} }}];'''
            },
            "name": "Get Last Sync",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [500, 300]
        })

        # 3. Fetch source data
        if self.config.pattern == SyncPattern.INCREMENTAL:
            query = self.config.get_incremental_query(source_conn.db_type)
        else:
            query = self.config.get_full_sync_query()

        nodes.append({
            "parameters": {
                "operation": "executeQuery",
                "query": query,
                "options": {
                    "queryParams": "={{ [$json.lastSync] }}"
                }
            },
            "name": "Fetch Source Data",
            "type": source_conn.db_type.n8n_node,
            "typeVersion": 2,
            "position": [750, 300]
        })

        # 4. Transform data
        nodes.append({
            "parameters": {
                "jsCode": self.config.to_n8n_function_code()
            },
            "name": "Transform Data",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1000, 300]
        })

        # 5. Upsert to destination
        nodes.append({
            "parameters": {
                "operation": "upsert",
                "table": self.config.destination_table,
                "columns": "={{ Object.keys($json) }}",
                "conflictColumn": self.config.tracking_column
            },
            "name": "Upsert Destination",
            "type": dest_conn.db_type.n8n_node,
            "typeVersion": 2,
            "position": [1250, 300]
        })

        # 6. Update sync timestamp
        nodes.append({
            "parameters": {
                "jsCode": '''// Update last sync timestamp
const staticData = $getWorkflowStaticData('global');
staticData.lastSync = new Date().toISOString();
return [{ json: { status: 'sync_complete', timestamp: staticData.lastSync } }];'''
            },
            "name": "Update Sync Time",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1500, 300]
        })

        # Build connections
        connections = {
            "Schedule Trigger": {"main": [[{"node": "Get Last Sync", "type": "main", "index": 0}]]},
            "Get Last Sync": {"main": [[{"node": "Fetch Source Data", "type": "main", "index": 0}]]},
            "Fetch Source Data": {"main": [[{"node": "Transform Data", "type": "main", "index": 0}]]},
            "Transform Data": {"main": [[{"node": "Upsert Destination", "type": "main", "index": 0}]]},
            "Upsert Destination": {"main": [[{"node": "Update Sync Time", "type": "main", "index": 0}]]}
        }

        return {
            "name": f"Sync {self.config.source_table} to {self.config.destination_table}",
            "nodes": nodes,
            "connections": connections,
            "settings": {"executionOrder": "v1"},
            "tags": ["sync", "database", "automation"]
        }


class CacheManager:
    """Manages caching layer with Redis."""

    CACHE_PATTERNS = {
        "user_session": {"prefix": "session", "ttl": 3600},
        "api_response": {"prefix": "api", "ttl": 300},
        "rate_limit": {"prefix": "ratelimit", "ttl": 60},
        "feature_flag": {"prefix": "feature", "ttl": 600},
        "lookup_table": {"prefix": "lookup", "ttl": 86400}
    }

    def __init__(self, config: CacheConfig):
        self.config = config

    def generate_cache_check_node(self, key_expression: str) -> dict:
        return {
            "parameters": {
                "operation": "get",
                "key": key_expression
            },
            "type": "n8n-nodes-base.redis",
            "typeVersion": 1
        }

    def generate_cache_set_node(self, key_expression: str, value_expression: str) -> dict:
        return {
            "parameters": {
                "operation": "set",
                "key": key_expression,
                "value": value_expression,
                "expire": self.config.ttl_seconds > 0,
                "ttl": self.config.ttl_seconds
            },
            "type": "n8n-nodes-base.redis",
            "typeVersion": 1
        }

    def generate_cache_function(self) -> str:
        return f'''// Cache Strategy: {self.config.strategy.value}
const cacheKey = '{self.config.key_prefix}:' + $json.id;
const cachedValue = $('Redis Get').first()?.json;

if (cachedValue && cachedValue.value) {{
  // Cache hit
  return [{{
    json: {{
      ...JSON.parse(cachedValue.value),
      _cache: 'hit',
      _cache_key: cacheKey
    }}
  }}];
}}

// Cache miss - proceed to database
return [{{
  json: {{
    ...$json,
    _cache: 'miss',
    _cache_key: cacheKey,
    _ttl: {self.config.ttl_seconds}
  }}
}}];'''

    def generate_rate_limit_function(self, max_requests: int, window_seconds: int) -> str:
        return f'''// Rate Limiting with Redis
const identifier = $json.user_id || $json.ip_address;
const key = 'ratelimit:' + identifier;
const now = Math.floor(Date.now() / 1000);
const windowStart = now - {window_seconds};

// Check current count
const currentCount = parseInt($('Redis Get Count').first()?.json?.value || '0');

if (currentCount >= {max_requests}) {{
  return [{{
    json: {{
      allowed: false,
      error: 'Rate limit exceeded',
      retry_after: {window_seconds} - (now % {window_seconds})
    }}
  }}];
}}

return [{{
  json: {{
    allowed: true,
    current_count: currentCount + 1,
    remaining: {max_requests} - currentCount - 1,
    key: key
  }}
}}];'''


class TransactionManager:
    """Manages database transactions."""

    def __init__(self, config: TransactionConfig, db_type: DatabaseType):
        self.config = config
        self.db_type = db_type

    def generate_transaction_wrapper(self, operations: list[str]) -> str:
        begin = self.config.get_begin_statement(self.db_type)

        ops_code = "\n    ".join([f"// Step {i+1}: {op}" for i, op in enumerate(operations)])

        return f'''// Transaction Wrapper
try {{
  // Begin transaction
  await $db.query('{begin}');

  {ops_code}

  // Commit if all successful
  await $db.query('COMMIT');

  return [{{ json: {{ status: 'committed', steps: {len(operations)} }} }}];

}} catch (error) {{
  // Rollback on any error
  await $db.query('ROLLBACK');

  return [{{ json: {{
    status: 'rolled_back',
    error: error.message,
    retry_count: {self.config.retry_count}
  }} }}];
}}'''

    def generate_savepoint_code(self, savepoint_name: str) -> str:
        if self.db_type in (DatabaseType.POSTGRESQL, DatabaseType.MYSQL):
            return f'''// Savepoint: {savepoint_name}
await $db.query('SAVEPOINT {savepoint_name}');

try {{
  // Operations here

  await $db.query('RELEASE SAVEPOINT {savepoint_name}');
}} catch (error) {{
  await $db.query('ROLLBACK TO SAVEPOINT {savepoint_name}');
  throw error;
}}'''
        return ""


class WorkflowGenerator:
    """Generates complete n8n database workflows."""

    def __init__(self):
        self.nodes = []
        self.connections = {}
        self.node_counter = 0

    def add_trigger(self, trigger_type: str = "manual") -> str:
        node_name = "Trigger"

        if trigger_type == "manual":
            self.nodes.append({
                "parameters": {},
                "name": node_name,
                "type": "n8n-nodes-base.manualTrigger",
                "typeVersion": 1,
                "position": [250, 300]
            })
        elif trigger_type == "schedule":
            self.nodes.append({
                "parameters": {
                    "rule": {"interval": [{"field": "hours", "hoursInterval": 1}]}
                },
                "name": node_name,
                "type": "n8n-nodes-base.scheduleTrigger",
                "typeVersion": 1,
                "position": [250, 300]
            })
        elif trigger_type == "webhook":
            self.nodes.append({
                "parameters": {"path": "database-webhook", "httpMethod": "POST"},
                "name": node_name,
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 1,
                "position": [250, 300]
            })

        return node_name

    def add_database_node(self, operation: DatabaseOperation, position: list[int]) -> str:
        node = operation.to_n8n_node()
        node["position"] = position
        self.nodes.append(node)
        return operation.operation_id

    def add_code_node(self, name: str, code: str, position: list[int]) -> str:
        self.nodes.append({
            "parameters": {"jsCode": code},
            "name": name,
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": position
        })
        return name

    def connect_nodes(self, from_node: str, to_node: str, from_index: int = 0, to_index: int = 0):
        if from_node not in self.connections:
            self.connections[from_node] = {"main": [[]]}

        while len(self.connections[from_node]["main"]) <= from_index:
            self.connections[from_node]["main"].append([])

        self.connections[from_node]["main"][from_index].append({
            "node": to_node,
            "type": "main",
            "index": to_index
        })

    def build_workflow(self, name: str) -> dict:
        return {
            "name": name,
            "nodes": self.nodes,
            "connections": self.connections,
            "settings": {
                "executionOrder": "v1",
                "saveManualExecutions": True
            },
            "tags": ["database", "automation"]
        }


# ============================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================

class DatabaseReporter:
    """Generates ASCII reports for database operations."""

    @staticmethod
    def operation_status(operation: DatabaseOperation) -> str:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        db_type = operation.connection.db_type.value.upper()
        op_type = operation.query_spec.operation.value.upper() if operation.query_spec else "QUERY"
        table = operation.query_spec.table if operation.query_spec else "N/A"

        sql = ""
        if operation.query_spec:
            sql = operation.query_spec.build_sql(operation.connection.db_type)

        return f"""
DATABASE OPERATION
═══════════════════════════════════════
Database: {db_type}
Operation: {op_type}
Time: {timestamp}
═══════════════════════════════════════

OPERATION OVERVIEW
────────────────────────────────────────
┌─────────────────────────────────────┐
│       DATABASE STATUS               │
│                                     │
│  Database: {db_type:>22}  │
│  Operation: {op_type:>21}  │
│  Table: {table:>25}  │
│                                     │
│  Timeout: {operation.timeout_ms:>18}ms  │
│  Est. Rows: {operation.estimated_rows:>20}  │
│                                     │
│  Status: [●] Ready                  │
└─────────────────────────────────────┘

QUERY SPECIFICATION
────────────────────────────────────────
{sql}

N8N NODE CONFIGURATION
────────────────────────────────────────
Node Type: {operation.connection.db_type.n8n_node}
Credential: {operation.connection.db_type.credential_type}
"""

    @staticmethod
    def sync_status(config: SyncConfig) -> str:
        return f"""
SYNC CONFIGURATION
═══════════════════════════════════════
Pattern: {config.pattern.value.upper()}
Source: {config.source_table}
Destination: {config.destination_table}
═══════════════════════════════════════

┌─────────────────────────────────────┐
│       SYNC SETTINGS                 │
│                                     │
│  Pattern: {config.pattern.value:>22}  │
│  Tracking: {config.tracking_column:>21}  │
│  Batch Size: {config.batch_size:>19}  │
│  Delete Missing: {str(config.delete_missing):>14}  │
│                                     │
│  Frequency: {config.pattern.recommended_frequency:>20}  │
│                                     │
└─────────────────────────────────────┘

PATTERN DETAILS
────────────────────────────────────────
{config.pattern.description}
"""

    @staticmethod
    def cache_status(config: CacheConfig) -> str:
        return f"""
CACHE CONFIGURATION
═══════════════════════════════════════
Strategy: {config.strategy.value.upper()}
TTL: {config.ttl_seconds}s
═══════════════════════════════════════

┌─────────────────────────────────────┐
│       CACHE SETTINGS                │
│                                     │
│  Strategy: {config.strategy.value:>21}  │
│  Key Prefix: {config.key_prefix:>19}  │
│  TTL: {config.ttl_seconds:>23}s  │
│  Max Size: {config.max_size:>21}  │
│  Eviction: {config.eviction_policy:>21}  │
│                                     │
│  Consistency: {config.strategy.consistency_level:>18}  │
│                                     │
└─────────────────────────────────────┘

STRATEGY DETAILS
────────────────────────────────────────
{config.strategy.description}
Performance: {config.strategy.performance_impact}
"""

    @staticmethod
    def database_reference() -> str:
        report = """
DATABASE REFERENCE
═══════════════════════════════════════

SUPPORTED DATABASES
────────────────────────────────────────
"""
        for db in DatabaseType:
            if db.n8n_node:
                report += f"""
{db.value.upper()}
  Node: {db.n8n_node}
  Port: {db.default_port}
  SQL: {db.is_sql}
  Placeholder: {db.placeholder_style}
"""
        return report

    @staticmethod
    def query_patterns() -> str:
        report = """
QUERY PATTERNS
═══════════════════════════════════════

"""
        for pattern in QueryPattern:
            report += f"""
{pattern.value.upper().replace('_', ' ')}
────────────────────────────────────────
Use Case: {pattern.use_case}
Template:
{pattern.template}

"""
        return report


# ============================================================
# CLI INTERFACE
# ============================================================

def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="n8n-database",
        description="N8N.DATABASE.EXE - n8n Database Operations Specialist"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Query command
    query_parser = subparsers.add_parser("query", help="Build a database query")
    query_parser.add_argument("--db", required=True, choices=[d.value for d in DatabaseType])
    query_parser.add_argument("--table", required=True, help="Table name")
    query_parser.add_argument("--operation", choices=["select", "insert", "update", "delete", "upsert"], default="select")
    query_parser.add_argument("--columns", help="Comma-separated columns")
    query_parser.add_argument("--where", help="WHERE clause")

    # Sync command
    sync_parser = subparsers.add_parser("sync", help="Create sync workflow")
    sync_parser.add_argument("--source", required=True, help="Source table")
    sync_parser.add_argument("--dest", required=True, help="Destination table")
    sync_parser.add_argument("--pattern", choices=[p.value for p in SyncPattern], default="incremental")
    sync_parser.add_argument("--tracking", default="updated_at", help="Tracking column")

    # Cache command
    cache_parser = subparsers.add_parser("cache", help="Configure caching")
    cache_parser.add_argument("--strategy", choices=[s.value for s in CacheStrategy], default="cache_aside")
    cache_parser.add_argument("--prefix", default="cache", help="Key prefix")
    cache_parser.add_argument("--ttl", type=int, default=3600, help="TTL in seconds")

    # Export command
    export_parser = subparsers.add_parser("export", help="Export workflow JSON")
    export_parser.add_argument("--db", required=True, choices=[d.value for d in DatabaseType])
    export_parser.add_argument("--name", default="Database Workflow", help="Workflow name")
    export_parser.add_argument("--file", "-o", help="Output file path")

    # Reference commands
    subparsers.add_parser("databases", help="Show supported databases")
    subparsers.add_parser("patterns", help="Show query patterns")
    subparsers.add_parser("sync-patterns", help="Show sync patterns")
    subparsers.add_parser("demo", help="Run demonstration")

    return parser


def main():
    parser = create_parser()
    args = parser.parse_args()

    if args.command == "query":
        db_type = DatabaseType(args.db)
        builder = QueryBuilder(db_type)

        columns = args.columns.split(",") if args.columns else []
        op = OperationType(args.operation)

        if op == OperationType.SELECT:
            spec = builder.select(args.table, columns, args.where or "")
        elif op == OperationType.INSERT:
            spec = builder.insert(args.table, columns)
        elif op == OperationType.UPDATE:
            spec = builder.update(args.table, columns, args.where or "")
        else:
            spec = builder.select(args.table)

        operation = DatabaseOperation(
            operation_id="query_1",
            connection=ConnectionConfig(db_type=db_type),
            query_spec=spec
        )
        print(DatabaseReporter.operation_status(operation))

    elif args.command == "sync":
        config = SyncConfig(
            pattern=SyncPattern(args.pattern),
            source_table=args.source,
            destination_table=args.dest,
            tracking_column=args.tracking
        )
        print(DatabaseReporter.sync_status(config))

    elif args.command == "cache":
        config = CacheConfig(
            strategy=CacheStrategy(args.strategy),
            key_prefix=args.prefix,
            ttl_seconds=args.ttl
        )
        print(DatabaseReporter.cache_status(config))

    elif args.command == "export":
        db_type = DatabaseType(args.db)
        gen = WorkflowGenerator()

        trigger = gen.add_trigger("manual")
        query_op = DatabaseOperation(
            operation_id="Database Query",
            connection=ConnectionConfig(db_type=db_type),
            query_spec=QuerySpec(
                operation=OperationType.SELECT,
                table="example_table"
            )
        )
        query_node = gen.add_database_node(query_op, [500, 300])
        gen.connect_nodes(trigger, query_node)

        workflow = gen.build_workflow(args.name)

        if args.file:
            with open(args.file, 'w') as f:
                json.dump(workflow, f, indent=2)
            print(f"Workflow exported to: {args.file}")
        else:
            print(json.dumps(workflow, indent=2))

    elif args.command == "databases":
        print(DatabaseReporter.database_reference())

    elif args.command == "patterns":
        print(DatabaseReporter.query_patterns())

    elif args.command == "sync-patterns":
        print("\nSYNC PATTERNS\n" + "=" * 50)
        for pattern in SyncPattern:
            print(f"\n{pattern.value.upper()}")
            print(f"  Description: {pattern.description}")
            print(f"  Frequency: {pattern.recommended_frequency}")
            print(f"  Requires Tracking: {pattern.requires_tracking}")

    elif args.command == "demo":
        print("\n" + "=" * 60)
        print("N8N.DATABASE.EXE - Database Operations Demo")
        print("=" * 60)

        # Demo query
        builder = QueryBuilder(DatabaseType.POSTGRESQL)
        spec = builder.select(
            "users",
            ["id", "email", "name", "created_at"],
            "status = $1",
            ["active"],
            "created_at DESC",
            100
        )

        operation = DatabaseOperation(
            operation_id="demo_query",
            connection=ConnectionConfig.postgres(
                "localhost", "mydb", "user", "pass"
            ),
            query_spec=spec,
            estimated_rows=100
        )

        print(DatabaseReporter.operation_status(operation))

        # Demo sync config
        sync_config = SyncConfig(
            pattern=SyncPattern.INCREMENTAL,
            source_table="source_users",
            destination_table="dest_users",
            tracking_column="updated_at",
            batch_size=500
        )
        print(DatabaseReporter.sync_status(sync_config))

        # Demo cache config
        cache_config = CacheConfig(
            strategy=CacheStrategy.CACHE_ASIDE,
            key_prefix="user",
            ttl_seconds=3600
        )
        print(DatabaseReporter.cache_status(cache_config))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW PHASES

### Phase 1: ANALYZE
1. Identify data requirements
2. Map source/destination systems
3. Define sync frequency
4. Assess volume and scale
5. Plan error handling

### Phase 2: DESIGN
1. Select database nodes
2. Build query templates
3. Design sync pattern
4. Plan caching strategy
5. Configure connections

### Phase 3: IMPLEMENT
1. Configure database credentials
2. Write parameterized queries
3. Add transaction handling
4. Implement cache layer
5. Build error workflows

### Phase 4: OPTIMIZE
1. Add query indexes
2. Tune batch sizes
3. Configure timeouts
4. Monitor performance
5. Scale as needed

---

## SUPPORTED DATABASES

| Database | Node | Port | Use Case |
|----------|------|------|----------|
| PostgreSQL | n8n-nodes-base.postgres | 5432 | Primary app DB |
| MySQL | n8n-nodes-base.mySql | 3306 | Legacy systems |
| MongoDB | n8n-nodes-base.mongoDb | 27017 | Document storage |
| Redis | n8n-nodes-base.redis | 6379 | Caching, queues |
| SQLite | n8n-nodes-base.sqlite | - | Local storage |
| Supabase | n8n-nodes-base.supabase | 5432 | Postgres + Auth |
| Airtable | n8n-nodes-base.airtable | - | Spreadsheet DB |
| MS SQL | n8n-nodes-base.microsoftSql | 1433 | Enterprise |
| MariaDB | n8n-nodes-base.mariaDb | 3306 | MySQL fork |
| ClickHouse | n8n-nodes-community.clickhouse | 8123 | Analytics |

## QUERY PATTERNS

| Pattern | Use Case | Template |
|---------|----------|----------|
| Simple Select | Fetch all records | `SELECT * FROM {table}` |
| Parameterized | User input safety | `WHERE {column} = $1` |
| Paginated | Large datasets | `LIMIT $1 OFFSET $2` |
| Aggregation | Reports/stats | `GROUP BY {column}` |
| Join | Related data | `JOIN {table2} ON...` |
| Upsert | Insert or update | `ON CONFLICT DO UPDATE` |
| Batch | Bulk operations | `VALUES (...), (...)` |

## SYNC PATTERNS

| Pattern | Frequency | Use Case |
|---------|-----------|----------|
| Full Sync | Daily/weekly | Complete refresh |
| Incremental | 5-15 minutes | Changed records |
| CDC | Real-time | Event streaming |
| Queue-Based | On-demand | High volume |
| Snapshot | Hourly | Point-in-time copy |
| Merge | Hourly | Compare & merge |

## CACHE STRATEGIES

| Strategy | Consistency | Performance |
|----------|-------------|-------------|
| Write-Through | Strong | Higher write latency |
| Write-Behind | Eventual | Best write performance |
| Read-Through | Eventual | Best read performance |
| Cache-Aside | Eventual | Flexible, app-controlled |
| Refresh-Ahead | Near-RT | Prevents cache misses |

## QUICK COMMANDS

- `/n8n-database query` - Build a database query
- `/n8n-database sync` - Create sync workflow
- `/n8n-database cache` - Configure caching layer
- `/n8n-database export` - Export workflow JSON
- `/n8n-database databases` - Show supported databases
- `/n8n-database patterns` - Show query patterns
- `/n8n-database demo` - Run demonstration

$ARGUMENTS
