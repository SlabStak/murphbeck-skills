# CLOUDFLARE.D1.EXE - Serverless SQL Database Specialist

You are CLOUDFLARE.D1.EXE — the serverless SQL database specialist that designs, implements, and optimizes D1 databases for Cloudflare Workers and Pages applications with SQLite-compatible schemas and global query performance.

MISSION
Design schemas. Optimize queries. Scale globally.

---

## CAPABILITIES

### SchemaArchitect.MOD
- Table design patterns
- Index optimization
- Migration management
- Relationship modeling
- Constraint definition

### QueryBuilder.MOD
- Prepared statements
- Parameterized queries
- Batch operations
- Transaction handling
- Result processing

### PerformanceOptimizer.MOD
- Query analysis
- Index strategies
- Read replica usage
- Connection pooling
- Cache integration

### MigrationManager.MOD
- Schema versioning
- Migration scripts
- Rollback procedures
- Data seeding
- Environment sync

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
CLOUDFLARE.D1.EXE - Serverless SQL Database Specialist
Complete D1 database design, migration, and query generation system
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
from datetime import datetime
import json
import re


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS - Comprehensive D1 Domain Types
# ════════════════════════════════════════════════════════════════════════════════

class SQLiteType(Enum):
    """SQLite data types with JavaScript mappings"""
    INTEGER = "INTEGER"
    REAL = "REAL"
    TEXT = "TEXT"
    BLOB = "BLOB"
    NULL = "NULL"
    NUMERIC = "NUMERIC"

    @property
    def js_type(self) -> str:
        """JavaScript type equivalent"""
        mappings = {
            "INTEGER": "number",
            "REAL": "number",
            "TEXT": "string",
            "BLOB": "ArrayBuffer",
            "NULL": "null",
            "NUMERIC": "number | string"
        }
        return mappings.get(self.value, "unknown")

    @property
    def typescript_type(self) -> str:
        """TypeScript type annotation"""
        mappings = {
            "INTEGER": "number",
            "REAL": "number",
            "TEXT": "string",
            "BLOB": "ArrayBuffer | Uint8Array",
            "NULL": "null",
            "NUMERIC": "number | string"
        }
        return mappings.get(self.value, "unknown")

    @property
    def use_cases(self) -> list[str]:
        """Common use cases for this type"""
        cases = {
            "INTEGER": ["Primary keys", "Foreign keys", "Counts", "Booleans (0/1)", "Timestamps (Unix)"],
            "REAL": ["Decimals", "Floating point", "Coordinates", "Percentages"],
            "TEXT": ["Strings", "JSON data", "UUIDs", "ISO timestamps", "Enum values"],
            "BLOB": ["Binary files", "Images", "Encrypted data", "Serialized objects"],
            "NULL": ["Missing values", "Optional fields"],
            "NUMERIC": ["Flexible numeric storage", "Decimal precision"]
        }
        return cases.get(self.value, [])

    @property
    def default_value(self) -> str:
        """Sensible default for this type"""
        defaults = {
            "INTEGER": "0",
            "REAL": "0.0",
            "TEXT": "''",
            "BLOB": "X''",
            "NULL": "NULL",
            "NUMERIC": "0"
        }
        return defaults.get(self.value, "NULL")


class IndexType(Enum):
    """SQLite index types"""
    STANDARD = "INDEX"
    UNIQUE = "UNIQUE INDEX"
    PARTIAL = "PARTIAL INDEX"
    EXPRESSION = "EXPRESSION INDEX"
    COVERING = "COVERING INDEX"

    @property
    def description(self) -> str:
        """Index type description"""
        descriptions = {
            "INDEX": "Standard B-tree index for faster lookups",
            "UNIQUE INDEX": "Ensures uniqueness while indexing",
            "PARTIAL INDEX": "Index with WHERE clause for subset of rows",
            "EXPRESSION INDEX": "Index on computed expressions",
            "COVERING INDEX": "Index that includes all queried columns"
        }
        return descriptions.get(self.value, "")

    @property
    def syntax_template(self) -> str:
        """SQL syntax template"""
        templates = {
            "INDEX": "CREATE INDEX {name} ON {table}({columns})",
            "UNIQUE INDEX": "CREATE UNIQUE INDEX {name} ON {table}({columns})",
            "PARTIAL INDEX": "CREATE INDEX {name} ON {table}({columns}) WHERE {condition}",
            "EXPRESSION INDEX": "CREATE INDEX {name} ON {table}(({expression}))",
            "COVERING INDEX": "CREATE INDEX {name} ON {table}({columns}) INCLUDE ({include_columns})"
        }
        return templates.get(self.value, templates["INDEX"])

    @property
    def performance_impact(self) -> str:
        """Performance characteristics"""
        impacts = {
            "INDEX": "Read: +++ | Write: - | Storage: +",
            "UNIQUE INDEX": "Read: +++ | Write: -- | Storage: +",
            "PARTIAL INDEX": "Read: ++ | Write: minimal | Storage: minimal",
            "EXPRESSION INDEX": "Read: ++ | Write: -- | Storage: +",
            "COVERING INDEX": "Read: ++++ | Write: -- | Storage: ++"
        }
        return impacts.get(self.value, "")


class ConstraintType(Enum):
    """SQL constraint types"""
    PRIMARY_KEY = "PRIMARY KEY"
    FOREIGN_KEY = "FOREIGN KEY"
    UNIQUE = "UNIQUE"
    NOT_NULL = "NOT NULL"
    CHECK = "CHECK"
    DEFAULT = "DEFAULT"
    AUTOINCREMENT = "AUTOINCREMENT"

    @property
    def is_column_level(self) -> bool:
        """Can be applied at column level"""
        return self in [
            ConstraintType.PRIMARY_KEY,
            ConstraintType.UNIQUE,
            ConstraintType.NOT_NULL,
            ConstraintType.DEFAULT,
            ConstraintType.AUTOINCREMENT
        ]

    @property
    def is_table_level(self) -> bool:
        """Can be applied at table level"""
        return self in [
            ConstraintType.PRIMARY_KEY,
            ConstraintType.FOREIGN_KEY,
            ConstraintType.UNIQUE,
            ConstraintType.CHECK
        ]

    @property
    def syntax_example(self) -> str:
        """Example usage"""
        examples = {
            "PRIMARY KEY": "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "FOREIGN KEY": "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
            "UNIQUE": "email TEXT UNIQUE",
            "NOT NULL": "name TEXT NOT NULL",
            "CHECK": "CHECK (age >= 0 AND age <= 150)",
            "DEFAULT": "created_at TEXT DEFAULT CURRENT_TIMESTAMP",
            "AUTOINCREMENT": "id INTEGER PRIMARY KEY AUTOINCREMENT"
        }
        return examples.get(self.value, "")


class QueryMethod(Enum):
    """D1 query execution methods"""
    RUN = "run"
    FIRST = "first"
    ALL = "all"
    RAW = "raw"
    BATCH = "batch"

    @property
    def return_type(self) -> str:
        """TypeScript return type"""
        types = {
            "run": "D1Result",
            "first": "T | null",
            "all": "D1Result<T>",
            "raw": "T[][]",
            "batch": "D1Result[]"
        }
        return types.get(self.value, "unknown")

    @property
    def use_case(self) -> str:
        """When to use this method"""
        cases = {
            "run": "INSERT, UPDATE, DELETE operations",
            "first": "SELECT single row by ID or unique field",
            "all": "SELECT multiple rows with pagination",
            "raw": "Performance-critical queries without object mapping",
            "batch": "Multiple operations in single request"
        }
        return cases.get(self.value, "")

    @property
    def code_template(self) -> str:
        """Usage template"""
        templates = {
            "run": "const result = await db.prepare('INSERT INTO users (name) VALUES (?)').bind(name).run();",
            "first": "const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();",
            "all": "const { results } = await db.prepare('SELECT * FROM users LIMIT ?').bind(limit).all<User>();",
            "raw": "const rows = await db.prepare('SELECT id, name FROM users').raw<[number, string]>();",
            "batch": "const results = await db.batch([stmt1, stmt2, stmt3]);"
        }
        return templates.get(self.value, "")


class RelationType(Enum):
    """Database relationship types"""
    ONE_TO_ONE = "1:1"
    ONE_TO_MANY = "1:N"
    MANY_TO_MANY = "N:M"
    SELF_REFERENTIAL = "self"

    @property
    def description(self) -> str:
        """Relationship description"""
        descriptions = {
            "1:1": "One record relates to exactly one other record",
            "1:N": "One record relates to many records",
            "N:M": "Many records relate to many records (requires junction table)",
            "self": "Record relates to other records in same table"
        }
        return descriptions.get(self.value, "")

    @property
    def implementation_pattern(self) -> str:
        """How to implement in SQL"""
        patterns = {
            "1:1": "Add UNIQUE foreign key to child table",
            "1:N": "Add foreign key to child table",
            "N:M": "Create junction table with composite primary key",
            "self": "Add foreign key referencing same table"
        }
        return patterns.get(self.value, "")

    @property
    def example_tables(self) -> tuple[str, str]:
        """Example table pair"""
        examples = {
            "1:1": ("users", "profiles"),
            "1:N": ("users", "posts"),
            "N:M": ("posts", "tags"),
            "self": ("employees", "employees")
        }
        return examples.get(self.value, ("", ""))


class MigrationAction(Enum):
    """Migration action types"""
    CREATE_TABLE = "create_table"
    DROP_TABLE = "drop_table"
    ALTER_TABLE = "alter_table"
    ADD_COLUMN = "add_column"
    DROP_COLUMN = "drop_column"
    RENAME_COLUMN = "rename_column"
    CREATE_INDEX = "create_index"
    DROP_INDEX = "drop_index"
    ADD_FOREIGN_KEY = "add_foreign_key"
    INSERT_DATA = "insert_data"

    @property
    def is_destructive(self) -> bool:
        """Whether action can lose data"""
        destructive = [
            MigrationAction.DROP_TABLE,
            MigrationAction.DROP_COLUMN,
            MigrationAction.DROP_INDEX
        ]
        return self in destructive

    @property
    def requires_backup(self) -> bool:
        """Whether backup is recommended"""
        return self.is_destructive or self == MigrationAction.ALTER_TABLE

    @property
    def rollback_strategy(self) -> str:
        """How to rollback this action"""
        strategies = {
            "create_table": "DROP TABLE {table_name}",
            "drop_table": "Restore from backup (CREATE TABLE with data)",
            "alter_table": "Restore from backup",
            "add_column": "ALTER TABLE {table} DROP COLUMN {column} (SQLite limitation)",
            "drop_column": "Restore from backup",
            "rename_column": "ALTER TABLE {table} RENAME COLUMN {new} TO {old}",
            "create_index": "DROP INDEX {index_name}",
            "drop_index": "CREATE INDEX {index_name} ON {table}({columns})",
            "add_foreign_key": "Recreate table without foreign key",
            "insert_data": "DELETE FROM {table} WHERE {conditions}"
        }
        return strategies.get(self.value, "Manual intervention required")


class OnDeleteAction(Enum):
    """Foreign key ON DELETE actions"""
    CASCADE = "CASCADE"
    SET_NULL = "SET NULL"
    SET_DEFAULT = "SET DEFAULT"
    RESTRICT = "RESTRICT"
    NO_ACTION = "NO ACTION"

    @property
    def behavior(self) -> str:
        """What happens on parent delete"""
        behaviors = {
            "CASCADE": "Delete child rows automatically",
            "SET NULL": "Set foreign key to NULL",
            "SET DEFAULT": "Set foreign key to default value",
            "RESTRICT": "Prevent deletion if children exist",
            "NO ACTION": "Same as RESTRICT in SQLite"
        }
        return behaviors.get(self.value, "")

    @property
    def use_case(self) -> str:
        """When to use this action"""
        cases = {
            "CASCADE": "Child data meaningless without parent (e.g., comments on deleted post)",
            "SET NULL": "Optional relationship, preserve child (e.g., author leaves company)",
            "SET DEFAULT": "Fallback value exists (e.g., default category)",
            "RESTRICT": "Protect referential integrity, require explicit cleanup",
            "NO_ACTION": "Default behavior, explicit documentation"
        }
        return cases.get(self.value, "")


# ════════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Configuration and State Objects
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class ColumnDefinition:
    """Database column definition"""
    name: str
    data_type: SQLiteType
    nullable: bool = True
    primary_key: bool = False
    autoincrement: bool = False
    unique: bool = False
    default: Optional[str] = None
    check: Optional[str] = None
    references: Optional[str] = None  # "table(column)"
    on_delete: OnDeleteAction = OnDeleteAction.NO_ACTION
    comment: str = ""

    def to_sql(self) -> str:
        """Generate SQL column definition"""
        parts = [self.name, self.data_type.value]

        if self.primary_key:
            parts.append("PRIMARY KEY")
            if self.autoincrement:
                parts.append("AUTOINCREMENT")

        if not self.nullable and not self.primary_key:
            parts.append("NOT NULL")

        if self.unique and not self.primary_key:
            parts.append("UNIQUE")

        if self.default is not None:
            parts.append(f"DEFAULT {self.default}")

        if self.check:
            parts.append(f"CHECK ({self.check})")

        if self.references:
            parts.append(f"REFERENCES {self.references}")
            if self.on_delete != OnDeleteAction.NO_ACTION:
                parts.append(f"ON DELETE {self.on_delete.value}")

        return " ".join(parts)

    def to_typescript_field(self) -> str:
        """Generate TypeScript interface field"""
        ts_type = self.data_type.typescript_type
        optional = "?" if self.nullable else ""
        return f"  {self.name}{optional}: {ts_type};"

    @classmethod
    def primary_key_column(cls, name: str = "id") -> "ColumnDefinition":
        """Create standard primary key column"""
        return cls(
            name=name,
            data_type=SQLiteType.INTEGER,
            nullable=False,
            primary_key=True,
            autoincrement=True
        )

    @classmethod
    def timestamp_column(cls, name: str = "created_at", default_now: bool = True) -> "ColumnDefinition":
        """Create timestamp column"""
        return cls(
            name=name,
            data_type=SQLiteType.TEXT,
            nullable=False,
            default="CURRENT_TIMESTAMP" if default_now else None
        )

    @classmethod
    def foreign_key_column(
        cls,
        name: str,
        references_table: str,
        references_column: str = "id",
        on_delete: OnDeleteAction = OnDeleteAction.CASCADE
    ) -> "ColumnDefinition":
        """Create foreign key column"""
        return cls(
            name=name,
            data_type=SQLiteType.INTEGER,
            nullable=False,
            references=f"{references_table}({references_column})",
            on_delete=on_delete
        )

    @classmethod
    def email_column(cls, name: str = "email", unique: bool = True) -> "ColumnDefinition":
        """Create email column with validation"""
        return cls(
            name=name,
            data_type=SQLiteType.TEXT,
            nullable=False,
            unique=unique,
            check=f"{name} LIKE '%_@__%.__%'"
        )

    @classmethod
    def status_column(cls, name: str = "status", allowed_values: list[str] = None) -> "ColumnDefinition":
        """Create status enum column"""
        allowed = allowed_values or ["draft", "published", "archived"]
        check = f"{name} IN ({', '.join(repr(v) for v in allowed)})"
        return cls(
            name=name,
            data_type=SQLiteType.TEXT,
            nullable=False,
            default=f"'{allowed[0]}'",
            check=check
        )


@dataclass
class IndexDefinition:
    """Database index definition"""
    name: str
    table: str
    columns: list[str]
    index_type: IndexType = IndexType.STANDARD
    condition: Optional[str] = None  # For partial indexes
    include_columns: list[str] = field(default_factory=list)  # For covering indexes

    def to_sql(self) -> str:
        """Generate SQL CREATE INDEX statement"""
        columns_str = ", ".join(self.columns)

        if self.index_type == IndexType.UNIQUE:
            return f"CREATE UNIQUE INDEX {self.name} ON {self.table}({columns_str})"
        elif self.index_type == IndexType.PARTIAL and self.condition:
            return f"CREATE INDEX {self.name} ON {self.table}({columns_str}) WHERE {self.condition}"
        elif self.index_type == IndexType.COVERING and self.include_columns:
            include_str = ", ".join(self.include_columns)
            return f"CREATE INDEX {self.name} ON {self.table}({columns_str}) INCLUDE ({include_str})"
        else:
            return f"CREATE INDEX {self.name} ON {self.table}({columns_str})"

    @classmethod
    def for_foreign_key(cls, table: str, column: str) -> "IndexDefinition":
        """Create index for foreign key column"""
        return cls(
            name=f"idx_{table}_{column}",
            table=table,
            columns=[column]
        )

    @classmethod
    def for_lookup(cls, table: str, columns: list[str], unique: bool = False) -> "IndexDefinition":
        """Create index for common lookups"""
        suffix = "_".join(columns)
        return cls(
            name=f"idx_{table}_{suffix}",
            table=table,
            columns=columns,
            index_type=IndexType.UNIQUE if unique else IndexType.STANDARD
        )

    @classmethod
    def for_active_records(cls, table: str, status_column: str = "status") -> "IndexDefinition":
        """Create partial index for active records only"""
        return cls(
            name=f"idx_{table}_active",
            table=table,
            columns=[status_column],
            index_type=IndexType.PARTIAL,
            condition=f"{status_column} = 'active'"
        )


@dataclass
class TableDefinition:
    """Complete table definition"""
    name: str
    columns: list[ColumnDefinition] = field(default_factory=list)
    indexes: list[IndexDefinition] = field(default_factory=list)
    constraints: list[str] = field(default_factory=list)  # Table-level constraints
    comment: str = ""

    def to_sql(self) -> str:
        """Generate CREATE TABLE SQL"""
        lines = [f"CREATE TABLE {self.name} ("]

        # Columns
        column_defs = [f"  {col.to_sql()}" for col in self.columns]

        # Table-level constraints
        all_parts = column_defs + [f"  {c}" for c in self.constraints]
        lines.append(",\n".join(all_parts))
        lines.append(");")

        # Indexes
        for idx in self.indexes:
            lines.append(idx.to_sql() + ";")

        return "\n".join(lines)

    def to_typescript_interface(self) -> str:
        """Generate TypeScript interface"""
        lines = [f"export interface {self._to_pascal_case(self.name)} {{"]
        for col in self.columns:
            lines.append(col.to_typescript_field())
        lines.append("}")
        return "\n".join(lines)

    def _to_pascal_case(self, name: str) -> str:
        """Convert table_name to PascalCase"""
        return "".join(word.capitalize() for word in name.split("_"))

    def add_timestamps(self) -> "TableDefinition":
        """Add created_at and updated_at columns"""
        self.columns.extend([
            ColumnDefinition.timestamp_column("created_at"),
            ColumnDefinition.timestamp_column("updated_at")
        ])
        return self

    @classmethod
    def users_table(cls) -> "TableDefinition":
        """Create standard users table"""
        table = cls(
            name="users",
            columns=[
                ColumnDefinition.primary_key_column(),
                ColumnDefinition.email_column(),
                ColumnDefinition("name", SQLiteType.TEXT, nullable=False),
                ColumnDefinition("password_hash", SQLiteType.TEXT, nullable=False),
                ColumnDefinition("avatar_url", SQLiteType.TEXT),
                ColumnDefinition.status_column("status", ["active", "inactive", "banned"]),
            ],
            indexes=[
                IndexDefinition.for_lookup("users", ["email"], unique=True),
                IndexDefinition.for_active_records("users"),
            ]
        )
        return table.add_timestamps()

    @classmethod
    def posts_table(cls) -> "TableDefinition":
        """Create standard posts table"""
        table = cls(
            name="posts",
            columns=[
                ColumnDefinition.primary_key_column(),
                ColumnDefinition.foreign_key_column("user_id", "users"),
                ColumnDefinition("title", SQLiteType.TEXT, nullable=False),
                ColumnDefinition("slug", SQLiteType.TEXT, nullable=False, unique=True),
                ColumnDefinition("content", SQLiteType.TEXT),
                ColumnDefinition.status_column("status", ["draft", "published", "archived"]),
                ColumnDefinition("published_at", SQLiteType.TEXT),
            ],
            indexes=[
                IndexDefinition.for_foreign_key("posts", "user_id"),
                IndexDefinition.for_lookup("posts", ["slug"], unique=True),
                IndexDefinition.for_lookup("posts", ["status", "published_at"]),
            ]
        )
        return table.add_timestamps()

    @classmethod
    def junction_table(cls, table1: str, table2: str) -> "TableDefinition":
        """Create many-to-many junction table"""
        name = f"{table1}_{table2}"
        col1 = f"{table1[:-1]}_id" if table1.endswith("s") else f"{table1}_id"
        col2 = f"{table2[:-1]}_id" if table2.endswith("s") else f"{table2}_id"

        return cls(
            name=name,
            columns=[
                ColumnDefinition.foreign_key_column(col1, table1),
                ColumnDefinition.foreign_key_column(col2, table2),
            ],
            constraints=[
                f"PRIMARY KEY ({col1}, {col2})"
            ],
            indexes=[
                IndexDefinition.for_foreign_key(name, col2)
            ]
        )


@dataclass
class MigrationConfig:
    """Database migration configuration"""
    version: str  # e.g., "0001"
    name: str
    description: str
    actions: list[MigrationAction] = field(default_factory=list)
    up_sql: str = ""
    down_sql: str = ""
    is_applied: bool = False
    applied_at: Optional[str] = None

    @property
    def filename(self) -> str:
        """Migration filename"""
        safe_name = re.sub(r'[^a-z0-9]+', '_', self.name.lower())
        return f"{self.version}_{safe_name}.sql"

    @property
    def has_destructive_actions(self) -> bool:
        """Check for destructive operations"""
        return any(action.is_destructive for action in self.actions)

    def to_sql_file(self) -> str:
        """Generate migration SQL file content"""
        lines = [
            f"-- Migration: {self.version} - {self.name}",
            f"-- Description: {self.description}",
            f"-- Created: {datetime.now().isoformat()}",
            "",
            "-- +migrate Up",
            self.up_sql,
            "",
            "-- +migrate Down",
            self.down_sql
        ]
        return "\n".join(lines)

    @classmethod
    def initial_schema(cls, tables: list[TableDefinition]) -> "MigrationConfig":
        """Create initial schema migration"""
        up_parts = [table.to_sql() for table in tables]
        down_parts = [f"DROP TABLE IF EXISTS {table.name};" for table in reversed(tables)]

        return cls(
            version="0001",
            name="initial_schema",
            description="Create initial database schema",
            actions=[MigrationAction.CREATE_TABLE] * len(tables),
            up_sql="\n\n".join(up_parts),
            down_sql="\n".join(down_parts)
        )


@dataclass
class QueryResult:
    """D1 query result representation"""
    success: bool
    results: list[dict] = field(default_factory=list)
    meta: dict = field(default_factory=dict)
    error: Optional[str] = None

    @property
    def row_count(self) -> int:
        """Number of rows returned"""
        return len(self.results)

    @property
    def last_row_id(self) -> Optional[int]:
        """Last inserted row ID"""
        return self.meta.get("last_row_id")

    @property
    def changes(self) -> int:
        """Number of rows affected"""
        return self.meta.get("changes", 0)

    def first(self) -> Optional[dict]:
        """Get first result or None"""
        return self.results[0] if self.results else None


@dataclass
class DatabaseConfig:
    """D1 database configuration"""
    name: str
    binding_name: str = "DB"
    database_id: str = ""
    preview_database_id: str = ""
    migrations_dir: str = "migrations"
    migrations_table: str = "d1_migrations"

    def to_wrangler_binding(self) -> dict:
        """Generate wrangler.toml binding"""
        return {
            "binding": self.binding_name,
            "database_name": self.name,
            "database_id": self.database_id
        }

    def to_wrangler_toml(self) -> str:
        """Generate wrangler.toml d1_databases section"""
        lines = [
            "[[d1_databases]]",
            f'binding = "{self.binding_name}"',
            f'database_name = "{self.name}"',
            f'database_id = "{self.database_id}"'
        ]

        if self.preview_database_id:
            lines.append(f'preview_database_id = "{self.preview_database_id}"')

        lines.append(f'migrations_dir = "{self.migrations_dir}"')
        lines.append(f'migrations_table = "{self.migrations_table}"')

        return "\n".join(lines)

    def to_env_types(self) -> str:
        """Generate TypeScript Env interface"""
        return f"""interface Env {{
  {self.binding_name}: D1Database;
}}"""


# ════════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Schema, Query, and Migration Generation
# ════════════════════════════════════════════════════════════════════════════════

class SchemaArchitect:
    """Design and generate database schemas"""

    def __init__(self):
        self.tables: list[TableDefinition] = []
        self.relationships: list[tuple[str, str, RelationType]] = []

    def add_table(self, table: TableDefinition) -> "SchemaArchitect":
        """Add table to schema"""
        self.tables.append(table)
        return self

    def add_relationship(
        self,
        from_table: str,
        to_table: str,
        relation_type: RelationType
    ) -> "SchemaArchitect":
        """Define relationship between tables"""
        self.relationships.append((from_table, to_table, relation_type))
        return self

    def generate_schema_sql(self) -> str:
        """Generate complete schema SQL"""
        parts = []

        # Pragma statements for optimization
        parts.append("-- D1 Database Schema")
        parts.append("PRAGMA foreign_keys = ON;")
        parts.append("")

        # Tables
        for table in self.tables:
            parts.append(f"-- {table.name} table")
            parts.append(table.to_sql())
            parts.append("")

        return "\n".join(parts)

    def generate_typescript_types(self) -> str:
        """Generate TypeScript interfaces for all tables"""
        lines = [
            "// Auto-generated TypeScript types for D1 database",
            "// Generated at: " + datetime.now().isoformat(),
            "",
            "import { D1Database, D1Result } from '@cloudflare/workers-types';",
            ""
        ]

        for table in self.tables:
            lines.append(table.to_typescript_interface())
            lines.append("")

        return "\n".join(lines)

    def generate_erd_ascii(self) -> str:
        """Generate ASCII Entity-Relationship Diagram"""
        lines = ["", "DATABASE SCHEMA - Entity Relationship Diagram", "=" * 60, ""]

        for table in self.tables:
            lines.append(f"┌{'─' * 40}┐")
            lines.append(f"│ {table.name.upper():^38} │")
            lines.append(f"├{'─' * 40}┤")

            for col in table.columns:
                pk = "🔑" if col.primary_key else "  "
                fk = "🔗" if col.references else "  "
                nullable = "?" if col.nullable else "!"
                lines.append(f"│ {pk}{fk} {col.name:20} {col.data_type.value:10}{nullable} │")

            lines.append(f"└{'─' * 40}┘")
            lines.append("")

        # Relationships
        if self.relationships:
            lines.append("RELATIONSHIPS:")
            for from_t, to_t, rel_type in self.relationships:
                lines.append(f"  {from_t} ─[{rel_type.value}]─ {to_t}")

        return "\n".join(lines)

    @classmethod
    def blog_schema(cls) -> "SchemaArchitect":
        """Create standard blog schema"""
        architect = cls()
        architect.add_table(TableDefinition.users_table())
        architect.add_table(TableDefinition.posts_table())
        architect.add_table(TableDefinition(
            name="tags",
            columns=[
                ColumnDefinition.primary_key_column(),
                ColumnDefinition("name", SQLiteType.TEXT, nullable=False, unique=True),
                ColumnDefinition("slug", SQLiteType.TEXT, nullable=False, unique=True),
            ],
            indexes=[
                IndexDefinition.for_lookup("tags", ["slug"], unique=True)
            ]
        ))
        architect.add_table(TableDefinition.junction_table("posts", "tags"))

        architect.add_relationship("users", "posts", RelationType.ONE_TO_MANY)
        architect.add_relationship("posts", "tags", RelationType.MANY_TO_MANY)

        return architect

    @classmethod
    def ecommerce_schema(cls) -> "SchemaArchitect":
        """Create e-commerce schema"""
        architect = cls()

        # Users
        architect.add_table(TableDefinition.users_table())

        # Products
        products = TableDefinition(
            name="products",
            columns=[
                ColumnDefinition.primary_key_column(),
                ColumnDefinition("name", SQLiteType.TEXT, nullable=False),
                ColumnDefinition("slug", SQLiteType.TEXT, nullable=False, unique=True),
                ColumnDefinition("description", SQLiteType.TEXT),
                ColumnDefinition("price", SQLiteType.REAL, nullable=False, check="price >= 0"),
                ColumnDefinition("inventory", SQLiteType.INTEGER, nullable=False, default="0"),
                ColumnDefinition.status_column("status", ["active", "inactive", "out_of_stock"]),
            ],
            indexes=[
                IndexDefinition.for_lookup("products", ["slug"], unique=True),
                IndexDefinition.for_lookup("products", ["status", "price"]),
            ]
        ).add_timestamps()
        architect.add_table(products)

        # Orders
        orders = TableDefinition(
            name="orders",
            columns=[
                ColumnDefinition.primary_key_column(),
                ColumnDefinition.foreign_key_column("user_id", "users"),
                ColumnDefinition.status_column("status", ["pending", "paid", "shipped", "delivered", "cancelled"]),
                ColumnDefinition("total", SQLiteType.REAL, nullable=False),
                ColumnDefinition("shipping_address", SQLiteType.TEXT, nullable=False),
            ],
            indexes=[
                IndexDefinition.for_foreign_key("orders", "user_id"),
                IndexDefinition.for_lookup("orders", ["status"]),
            ]
        ).add_timestamps()
        architect.add_table(orders)

        # Order Items
        order_items = TableDefinition(
            name="order_items",
            columns=[
                ColumnDefinition.primary_key_column(),
                ColumnDefinition.foreign_key_column("order_id", "orders"),
                ColumnDefinition.foreign_key_column("product_id", "products"),
                ColumnDefinition("quantity", SQLiteType.INTEGER, nullable=False, check="quantity > 0"),
                ColumnDefinition("unit_price", SQLiteType.REAL, nullable=False),
            ],
            indexes=[
                IndexDefinition.for_foreign_key("order_items", "order_id"),
                IndexDefinition.for_foreign_key("order_items", "product_id"),
            ]
        )
        architect.add_table(order_items)

        return architect


class QueryBuilder:
    """Build type-safe D1 queries"""

    def __init__(self, table: TableDefinition):
        self.table = table
        self.table_name = table.name

    def generate_repository(self) -> str:
        """Generate complete TypeScript repository class"""
        entity_name = self._to_pascal_case(self.table_name)
        singular = self.table_name.rstrip("s")

        code = f'''// {entity_name} Repository - Auto-generated
import {{ D1Database }} from '@cloudflare/workers-types';
import {{ {entity_name} }} from './types';

export class {entity_name}Repository {{
  constructor(private db: D1Database) {{}}

  // Find by ID
  async findById(id: number): Promise<{entity_name} | null> {{
    return this.db
      .prepare('SELECT * FROM {self.table_name} WHERE id = ?')
      .bind(id)
      .first<{entity_name}>();
  }}

  // Find all with pagination
  async findAll(page: number = 1, limit: number = 20): Promise<{{
    data: {entity_name}[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }}> {{
    const offset = (page - 1) * limit;

    const [results, countResult] = await this.db.batch([
      this.db.prepare('SELECT * FROM {self.table_name} ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(limit, offset),
      this.db.prepare('SELECT COUNT(*) as total FROM {self.table_name}')
    ]);

    const total = (countResult.results[0] as {{ total: number }}).total;

    return {{
      data: results.results as {entity_name}[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }};
  }}

  // Create
  async create(data: Omit<{entity_name}, 'id' | 'created_at' | 'updated_at'>): Promise<{entity_name}> {{
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const result = await this.db
      .prepare(`INSERT INTO {self.table_name} (${{columns.join(', ')}}) VALUES (${{placeholders}})`)
      .bind(...values)
      .run();

    return this.findById(result.meta.last_row_id as number) as Promise<{entity_name}>;
  }}

  // Update
  async update(id: number, data: Partial<Omit<{entity_name}, 'id' | 'created_at'>>): Promise<{entity_name} | null> {{
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${{col}} = ?`).join(', ');
    const values = [...Object.values(data), id];

    await this.db
      .prepare(`UPDATE {self.table_name} SET ${{setClause}}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(...values)
      .run();

    return this.findById(id);
  }}

  // Delete
  async delete(id: number): Promise<boolean> {{
    const result = await this.db
      .prepare('DELETE FROM {self.table_name} WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }}

  // Count
  async count(): Promise<number> {{
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM {self.table_name}')
      .first<{{ count: number }}>();

    return result?.count ?? 0;
  }}
'''

        # Add custom finders for unique columns
        for col in self.table.columns:
            if col.unique and not col.primary_key:
                finder_name = self._to_camel_case(f"find_by_{col.name}")
                ts_type = col.data_type.typescript_type
                code += f'''
  // Find by {col.name}
  async {finder_name}({col.name}: {ts_type}): Promise<{entity_name} | null> {{
    return this.db
      .prepare('SELECT * FROM {self.table_name} WHERE {col.name} = ?')
      .bind({col.name})
      .first<{entity_name}>();
  }}
'''

        code += "}\n"
        return code

    def generate_queries(self) -> dict[str, str]:
        """Generate common query patterns"""
        return {
            "select_all": f"SELECT * FROM {self.table_name}",
            "select_by_id": f"SELECT * FROM {self.table_name} WHERE id = ?",
            "select_paginated": f"SELECT * FROM {self.table_name} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            "count": f"SELECT COUNT(*) as total FROM {self.table_name}",
            "insert": self._generate_insert_query(),
            "update": self._generate_update_query(),
            "delete": f"DELETE FROM {self.table_name} WHERE id = ?"
        }

    def _generate_insert_query(self) -> str:
        """Generate INSERT query"""
        insertable = [c for c in self.table.columns if not c.primary_key and not c.autoincrement]
        columns = [c.name for c in insertable if c.default is None]
        placeholders = ", ".join("?" for _ in columns)
        return f"INSERT INTO {self.table_name} ({', '.join(columns)}) VALUES ({placeholders})"

    def _generate_update_query(self) -> str:
        """Generate UPDATE query template"""
        updatable = [c for c in self.table.columns if not c.primary_key]
        columns = [c.name for c in updatable]
        set_clause = ", ".join(f"{c} = ?" for c in columns)
        return f"UPDATE {self.table_name} SET {set_clause} WHERE id = ?"

    def _to_pascal_case(self, name: str) -> str:
        return "".join(word.capitalize() for word in name.split("_"))

    def _to_camel_case(self, name: str) -> str:
        pascal = self._to_pascal_case(name)
        return pascal[0].lower() + pascal[1:] if pascal else ""


class MigrationManager:
    """Manage database migrations"""

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.migrations: list[MigrationConfig] = []

    def add_migration(self, migration: MigrationConfig) -> "MigrationManager":
        """Add migration to manager"""
        self.migrations.append(migration)
        return self

    def generate_migration_file(self, migration: MigrationConfig) -> str:
        """Generate migration SQL file"""
        return migration.to_sql_file()

    def generate_all_migrations(self) -> dict[str, str]:
        """Generate all migration files"""
        return {m.filename: m.to_sql_file() for m in self.migrations}

    def generate_wrangler_commands(self) -> list[str]:
        """Generate wrangler CLI commands"""
        commands = [
            f"# Create database",
            f"wrangler d1 create {self.config.name}",
            "",
            f"# Apply migrations",
        ]

        for migration in self.migrations:
            commands.append(
                f"wrangler d1 execute {self.config.name} --file={self.config.migrations_dir}/{migration.filename}"
            )

        return commands

    def generate_migration_tracker(self) -> str:
        """Generate migration tracking table SQL"""
        return f'''-- Migration Tracking Table
CREATE TABLE IF NOT EXISTS {self.config.migrations_table} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_{self.config.migrations_table}_version
  ON {self.config.migrations_table}(version);
'''

    def generate_migration_status_query(self) -> str:
        """Generate query to check migration status"""
        return f'''SELECT
  m.version,
  m.name,
  m.applied_at,
  CASE WHEN m.id IS NOT NULL THEN 'applied' ELSE 'pending' END as status
FROM {self.config.migrations_table} m
ORDER BY m.version;
'''


class RepositoryGenerator:
    """Generate complete repository layer"""

    def __init__(self, schema: SchemaArchitect):
        self.schema = schema

    def generate_all_repositories(self) -> dict[str, str]:
        """Generate repository for each table"""
        repos = {}
        for table in self.schema.tables:
            builder = QueryBuilder(table)
            filename = f"{table.name}.repository.ts"
            repos[filename] = builder.generate_repository()
        return repos

    def generate_index_file(self) -> str:
        """Generate index.ts for repositories"""
        lines = ["// Repository Index - Auto-generated", ""]

        for table in self.schema.tables:
            name = self._to_pascal_case(table.name)
            lines.append(f"export {{ {name}Repository }} from './{table.name}.repository';")

        return "\n".join(lines)

    def generate_types_file(self) -> str:
        """Generate types.ts file"""
        return self.schema.generate_typescript_types()

    def _to_pascal_case(self, name: str) -> str:
        return "".join(word.capitalize() for word in name.split("_"))


class TransactionBuilder:
    """Build D1 transaction patterns"""

    @staticmethod
    def generate_batch_insert(table: str, columns: list[str]) -> str:
        """Generate batch insert pattern"""
        placeholders = ", ".join("?" for _ in columns)
        cols = ", ".join(columns)

        return f'''// Batch insert for {table}
async function batchInsert{table.title()}(
  db: D1Database,
  items: Array<{{ {', '.join(f'{c}: any' for c in columns)} }}>
): Promise<D1Result[]> {{
  const statements = items.map(item =>
    db.prepare('INSERT INTO {table} ({cols}) VALUES ({placeholders})')
      .bind({', '.join(f'item.{c}' for c in columns)})
  );

  return db.batch(statements);
}}
'''

    @staticmethod
    def generate_transaction_pattern(operations: list[str]) -> str:
        """Generate transaction-like batch pattern"""
        return f'''// Transaction pattern using batch
async function executeTransaction(db: D1Database): Promise<D1Result[]> {{
  // D1 batch() executes all statements atomically
  const statements = [
    {','.join(f'db.prepare("{op}")' for op in operations)}
  ];

  try {{
    return await db.batch(statements);
  }} catch (error) {{
    // All statements are rolled back if any fails
    throw error;
  }}
}}
'''

    @staticmethod
    def generate_upsert_pattern(table: str, unique_col: str, columns: list[str]) -> str:
        """Generate upsert (INSERT OR REPLACE) pattern"""
        cols = ", ".join(columns)
        placeholders = ", ".join("?" for _ in columns)
        update_clause = ", ".join(f"{c} = excluded.{c}" for c in columns if c != unique_col)

        return f'''// Upsert pattern for {table}
async function upsert{table.title()}(
  db: D1Database,
  data: {{ {', '.join(f'{c}: any' for c in columns)} }}
): Promise<D1Result> {{
  return db.prepare(`
    INSERT INTO {table} ({cols})
    VALUES ({placeholders})
    ON CONFLICT({unique_col}) DO UPDATE SET
      {update_clause},
      updated_at = CURRENT_TIMESTAMP
  `).bind({', '.join(f'data.{c}' for c in columns)}).run();
}}
'''


# ════════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Dashboard Generation
# ════════════════════════════════════════════════════════════════════════════════

class D1Reporter:
    """Generate ASCII reports and dashboards"""

    @staticmethod
    def database_dashboard(config: DatabaseConfig, schema: SchemaArchitect) -> str:
        """Generate database overview dashboard"""
        table_count = len(schema.tables)
        index_count = sum(len(t.indexes) for t in schema.tables)
        column_count = sum(len(t.columns) for t in schema.tables)

        return f'''
╔══════════════════════════════════════════════════════════════╗
║           CLOUDFLARE D1 DATABASE DASHBOARD                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  DATABASE: {config.name:<46} ║
║  BINDING: {config.binding_name:<47} ║
║  ID: {config.database_id or 'Not yet created':<51} ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  SCHEMA STATISTICS                                           ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  Tables:  {table_count:<8} ████████████████████░░░░░░ │  ║
║  │  Columns: {column_count:<8} ██████████████████████████ │  ║
║  │  Indexes: {index_count:<8} ████████████░░░░░░░░░░░░░░ │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  STATUS: ● Database Ready                                    ║
╚══════════════════════════════════════════════════════════════╝
'''

    @staticmethod
    def table_summary(tables: list[TableDefinition]) -> str:
        """Generate table summary"""
        lines = [
            "",
            "TABLE SUMMARY",
            "═" * 70,
            f"{'Table':<20} {'Columns':<10} {'Indexes':<10} {'PK':<8} {'FK':<8}",
            "─" * 70
        ]

        for table in tables:
            pk_count = sum(1 for c in table.columns if c.primary_key)
            fk_count = sum(1 for c in table.columns if c.references)
            lines.append(
                f"{table.name:<20} {len(table.columns):<10} {len(table.indexes):<10} "
                f"{pk_count:<8} {fk_count:<8}"
            )

        lines.append("═" * 70)
        return "\n".join(lines)

    @staticmethod
    def migration_status(migrations: list[MigrationConfig]) -> str:
        """Generate migration status report"""
        lines = [
            "",
            "MIGRATION STATUS",
            "═" * 70,
            f"{'Version':<10} {'Name':<30} {'Status':<15} {'Applied':<15}",
            "─" * 70
        ]

        for m in migrations:
            status = "✓ Applied" if m.is_applied else "○ Pending"
            applied = m.applied_at[:10] if m.applied_at else "-"
            destructive = " ⚠" if m.has_destructive_actions else ""
            lines.append(
                f"{m.version:<10} {m.name:<30} {status:<15} {applied:<15}{destructive}"
            )

        lines.append("═" * 70)
        return "\n".join(lines)

    @staticmethod
    def query_methods_reference() -> str:
        """Generate query methods reference"""
        lines = [
            "",
            "D1 QUERY METHODS REFERENCE",
            "═" * 70
        ]

        for method in QueryMethod:
            lines.extend([
                f"\n{method.value}()",
                f"  Returns: {method.return_type}",
                f"  Use for: {method.use_case}",
                f"  Example: {method.code_template}"
            ])

        return "\n".join(lines)

    @staticmethod
    def index_recommendations(table: TableDefinition) -> str:
        """Generate index recommendations"""
        lines = [
            "",
            f"INDEX RECOMMENDATIONS FOR: {table.name.upper()}",
            "═" * 60
        ]

        # Check for foreign keys without indexes
        fk_columns = [c for c in table.columns if c.references]
        indexed_columns = set()
        for idx in table.indexes:
            indexed_columns.update(idx.columns)

        for col in fk_columns:
            if col.name not in indexed_columns:
                lines.append(f"⚠ Missing index on foreign key: {col.name}")
                lines.append(f"  Recommendation: CREATE INDEX idx_{table.name}_{col.name} ON {table.name}({col.name})")

        # Check for common query patterns
        if any(c.name == "status" for c in table.columns):
            if "status" not in indexed_columns:
                lines.append(f"\n💡 Consider partial index on status for active records")

        if any(c.name in ["created_at", "updated_at"] for c in table.columns):
            lines.append(f"\n💡 Consider index on timestamp columns if used in ORDER BY")

        if not lines[3:]:
            lines.append("✓ No immediate index recommendations")

        return "\n".join(lines)


# ════════════════════════════════════════════════════════════════════════════════
# MAIN ENGINE - Orchestrator
# ════════════════════════════════════════════════════════════════════════════════

class CloudflareD1Engine:
    """Main D1 database engine orchestrator"""

    def __init__(self, database_name: str):
        self.config = DatabaseConfig(name=database_name)
        self.schema = SchemaArchitect()
        self.migration_manager = MigrationManager(self.config)
        self.reporter = D1Reporter()

    def use_blog_schema(self) -> "CloudflareD1Engine":
        """Apply blog schema template"""
        self.schema = SchemaArchitect.blog_schema()
        return self

    def use_ecommerce_schema(self) -> "CloudflareD1Engine":
        """Apply e-commerce schema template"""
        self.schema = SchemaArchitect.ecommerce_schema()
        return self

    def add_table(self, table: TableDefinition) -> "CloudflareD1Engine":
        """Add custom table"""
        self.schema.add_table(table)
        return self

    def generate_initial_migration(self) -> "CloudflareD1Engine":
        """Generate initial schema migration"""
        migration = MigrationConfig.initial_schema(self.schema.tables)
        self.migration_manager.add_migration(migration)
        return self

    def generate_all_files(self) -> dict[str, str]:
        """Generate all necessary files"""
        files = {}

        # Schema SQL
        files["schema.sql"] = self.schema.generate_schema_sql()

        # TypeScript types
        files["src/db/types.ts"] = self.schema.generate_typescript_types()

        # Repositories
        repo_gen = RepositoryGenerator(self.schema)
        files.update({f"src/db/{k}": v for k, v in repo_gen.generate_all_repositories().items()})
        files["src/db/index.ts"] = repo_gen.generate_index_file()

        # Migrations
        files.update({
            f"{self.config.migrations_dir}/{k}": v
            for k, v in self.migration_manager.generate_all_migrations().items()
        })

        # Wrangler config snippet
        files["wrangler.d1.toml"] = self.config.to_wrangler_toml()

        # Environment types
        files["src/env.d.ts"] = self.config.to_env_types()

        return files

    def generate_report(self) -> str:
        """Generate comprehensive report"""
        parts = [
            self.reporter.database_dashboard(self.config, self.schema),
            self.reporter.table_summary(self.schema.tables),
            self.schema.generate_erd_ascii(),
            self.reporter.migration_status(self.migration_manager.migrations),
            self.reporter.query_methods_reference()
        ]
        return "\n".join(parts)

    def generate_cli_commands(self) -> str:
        """Generate wrangler CLI commands"""
        commands = [
            "# Cloudflare D1 Setup Commands",
            "# ═══════════════════════════════════════",
            "",
            "# 1. Create database",
            f"wrangler d1 create {self.config.name}",
            "",
            "# 2. Apply migrations"
        ]

        for m in self.migration_manager.migrations:
            commands.append(
                f"wrangler d1 execute {self.config.name} "
                f"--file={self.config.migrations_dir}/{m.filename}"
            )

        commands.extend([
            "",
            "# 3. Verify tables",
            f"wrangler d1 execute {self.config.name} --command=\"SELECT name FROM sqlite_master WHERE type='table'\"",
            "",
            "# 4. Run locally",
            f"wrangler d1 execute {self.config.name} --local --file=schema.sql"
        ])

        return "\n".join(commands)


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="CLOUDFLARE.D1.EXE - Serverless SQL Database Specialist"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create new D1 database schema")
    create_parser.add_argument("name", help="Database name")
    create_parser.add_argument("--template", choices=["blog", "ecommerce", "custom"],
                               default="custom", help="Schema template")

    # Table command
    table_parser = subparsers.add_parser("table", help="Generate table definition")
    table_parser.add_argument("name", help="Table name")
    table_parser.add_argument("--columns", nargs="+", help="Column definitions (name:type)")
    table_parser.add_argument("--timestamps", action="store_true", help="Add timestamp columns")

    # Repository command
    repo_parser = subparsers.add_parser("repository", help="Generate repository class")
    repo_parser.add_argument("table", help="Table name")

    # Migration command
    migrate_parser = subparsers.add_parser("migration", help="Create migration")
    migrate_parser.add_argument("name", help="Migration name")
    migrate_parser.add_argument("--version", help="Migration version")

    # Types command
    types_parser = subparsers.add_parser("types", help="Show SQLite type mappings")

    # Methods command
    methods_parser = subparsers.add_parser("methods", help="Show D1 query methods")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demonstration")
    demo_parser.add_argument("--schema", choices=["blog", "ecommerce"],
                            default="blog", help="Demo schema")

    args = parser.parse_args()

    if args.command == "create":
        engine = CloudflareD1Engine(args.name)
        if args.template == "blog":
            engine.use_blog_schema()
        elif args.template == "ecommerce":
            engine.use_ecommerce_schema()
        engine.generate_initial_migration()

        print(engine.generate_report())
        print("\n" + engine.generate_cli_commands())

    elif args.command == "table":
        columns = []
        if args.columns:
            for col_def in args.columns:
                name, type_str = col_def.split(":")
                sqlite_type = SQLiteType[type_str.upper()]
                columns.append(ColumnDefinition(name, sqlite_type))

        table = TableDefinition(name=args.name, columns=columns)
        if args.timestamps:
            table.add_timestamps()

        print(table.to_sql())
        print("\n" + table.to_typescript_interface())

    elif args.command == "repository":
        # Create minimal table for demo
        table = TableDefinition(
            name=args.table,
            columns=[
                ColumnDefinition.primary_key_column(),
                ColumnDefinition("name", SQLiteType.TEXT, nullable=False)
            ]
        ).add_timestamps()

        builder = QueryBuilder(table)
        print(builder.generate_repository())

    elif args.command == "migration":
        version = args.version or datetime.now().strftime("%Y%m%d%H%M%S")
        migration = MigrationConfig(
            version=version,
            name=args.name,
            description=f"Migration: {args.name}"
        )
        print(migration.to_sql_file())

    elif args.command == "types":
        print("\nSQLite Type Mappings")
        print("=" * 60)
        for t in SQLiteType:
            print(f"\n{t.value}")
            print(f"  JavaScript: {t.js_type}")
            print(f"  TypeScript: {t.typescript_type}")
            print(f"  Use cases: {', '.join(t.use_cases)}")

    elif args.command == "methods":
        print(D1Reporter.query_methods_reference())

    elif args.command == "demo":
        print("=" * 60)
        print("CLOUDFLARE D1.EXE - DEMONSTRATION")
        print("=" * 60)

        engine = CloudflareD1Engine("demo_db")
        if args.schema == "blog":
            engine.use_blog_schema()
        else:
            engine.use_ecommerce_schema()
        engine.generate_initial_migration()

        print(engine.generate_report())

        print("\nGENERATED FILES:")
        print("-" * 40)
        for filename, content in engine.generate_all_files().items():
            print(f"\n📄 {filename}")
            print("-" * 40)
            # Show first 30 lines
            lines = content.split("\n")[:30]
            print("\n".join(lines))
            if len(content.split("\n")) > 30:
                print("... (truncated)")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/cloudflare-d1 create [name]` - Create new D1 database
- `/cloudflare-d1 schema [tables]` - Design database schema
- `/cloudflare-d1 migration [name]` - Create migration file
- `/cloudflare-d1 queries [table]` - Generate query functions
- `/cloudflare-d1 seed [table]` - Create seed data script

$ARGUMENTS
