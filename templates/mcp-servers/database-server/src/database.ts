/**
 * Database abstraction layer supporting PostgreSQL, MySQL, and SQLite
 */

import pg from "pg";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";
import type { Config } from "./config.js";

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
}

export interface DatabaseClient {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  insert(table: string, data: Record<string, unknown>): Promise<QueryResult>;
  update(
    table: string,
    data: Record<string, unknown>,
    where: Record<string, unknown>
  ): Promise<QueryResult>;
  delete(table: string, where: Record<string, unknown>): Promise<QueryResult>;
  listTables(): Promise<string[]>;
  describeTable(table: string): Promise<TableColumn[]>;
  close(): Promise<void>;
}

// PostgreSQL Client
class PostgresClient implements DatabaseClient {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  async query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async insert(table: string, data: Record<string, unknown>): Promise<QueryResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

    const sql = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.pool.query(sql, values);

    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  }

  async update(
    table: string,
    data: Record<string, unknown>,
    where: Record<string, unknown>
  ): Promise<QueryResult> {
    const dataColumns = Object.keys(data);
    const whereColumns = Object.keys(where);

    let paramIndex = 1;
    const setClause = dataColumns
      .map((col) => `"${col}" = $${paramIndex++}`)
      .join(", ");
    const whereClause = whereColumns
      .map((col) => `"${col}" = $${paramIndex++}`)
      .join(" AND ");

    const sql = `UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`;
    const values = [...Object.values(data), ...Object.values(where)];

    const result = await this.pool.query(sql, values);
    return { rows: [], rowCount: result.rowCount ?? 0 };
  }

  async delete(table: string, where: Record<string, unknown>): Promise<QueryResult> {
    const whereColumns = Object.keys(where);
    const whereClause = whereColumns
      .map((col, i) => `"${col}" = $${i + 1}`)
      .join(" AND ");

    const sql = `DELETE FROM "${table}" WHERE ${whereClause}`;
    const result = await this.pool.query(sql, Object.values(where));

    return { rows: [], rowCount: result.rowCount ?? 0 };
  }

  async listTables(): Promise<string[]> {
    const result = await this.pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    return result.rows.map((row) => row.table_name as string);
  }

  async describeTable(table: string): Promise<TableColumn[]> {
    const result = await this.pool.query(`
      SELECT
        column_name as name,
        data_type as type,
        is_nullable = 'YES' as nullable,
        column_default as default_value,
        EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = $1
            AND tc.constraint_type = 'PRIMARY KEY'
            AND kcu.column_name = c.column_name
        ) as is_primary_key
      FROM information_schema.columns c
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);

    return result.rows.map((row) => ({
      name: row.name as string,
      type: row.type as string,
      nullable: row.nullable as boolean,
      defaultValue: row.default_value as string | null,
      isPrimaryKey: row.is_primary_key as boolean,
    }));
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// MySQL Client
class MySQLClient implements DatabaseClient {
  private pool: mysql.Pool;

  constructor(connectionString: string) {
    this.pool = mysql.createPool(connectionString);
  }

  async query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as Record<string, unknown>[];
  }

  async insert(table: string, data: Record<string, unknown>): Promise<QueryResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => "?").join(", ");

    const sql = `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(", ")}) VALUES (${placeholders})`;
    const [result] = await this.pool.execute(sql, values) as mysql.ResultSetHeader[];

    return { rows: [], rowCount: result.affectedRows };
  }

  async update(
    table: string,
    data: Record<string, unknown>,
    where: Record<string, unknown>
  ): Promise<QueryResult> {
    const setClause = Object.keys(data)
      .map((col) => `\`${col}\` = ?`)
      .join(", ");
    const whereClause = Object.keys(where)
      .map((col) => `\`${col}\` = ?`)
      .join(" AND ");

    const sql = `UPDATE \`${table}\` SET ${setClause} WHERE ${whereClause}`;
    const values = [...Object.values(data), ...Object.values(where)];

    const [result] = await this.pool.execute(sql, values) as mysql.ResultSetHeader[];
    return { rows: [], rowCount: result.affectedRows };
  }

  async delete(table: string, where: Record<string, unknown>): Promise<QueryResult> {
    const whereClause = Object.keys(where)
      .map((col) => `\`${col}\` = ?`)
      .join(" AND ");

    const sql = `DELETE FROM \`${table}\` WHERE ${whereClause}`;
    const [result] = await this.pool.execute(sql, Object.values(where)) as mysql.ResultSetHeader[];

    return { rows: [], rowCount: result.affectedRows };
  }

  async listTables(): Promise<string[]> {
    const [rows] = await this.pool.execute("SHOW TABLES");
    return (rows as Record<string, string>[]).map((row) => Object.values(row)[0]);
  }

  async describeTable(table: string): Promise<TableColumn[]> {
    const [rows] = await this.pool.execute(`DESCRIBE \`${table}\``);
    return (rows as Record<string, unknown>[]).map((row) => ({
      name: row.Field as string,
      type: row.Type as string,
      nullable: row.Null === "YES",
      defaultValue: row.Default as string | null,
      isPrimaryKey: row.Key === "PRI",
    }));
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// SQLite Client
class SQLiteClient implements DatabaseClient {
  private db: Database.Database;

  constructor(filename: string) {
    this.db = new Database(filename);
  }

  async query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...(params ?? [])) as Record<string, unknown>[];
  }

  async insert(table: string, data: Record<string, unknown>): Promise<QueryResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => "?").join(", ");

    const sql = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders})`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...values);

    return { rows: [], rowCount: result.changes };
  }

  async update(
    table: string,
    data: Record<string, unknown>,
    where: Record<string, unknown>
  ): Promise<QueryResult> {
    const setClause = Object.keys(data)
      .map((col) => `"${col}" = ?`)
      .join(", ");
    const whereClause = Object.keys(where)
      .map((col) => `"${col}" = ?`)
      .join(" AND ");

    const sql = `UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`;
    const values = [...Object.values(data), ...Object.values(where)];

    const stmt = this.db.prepare(sql);
    const result = stmt.run(...values);

    return { rows: [], rowCount: result.changes };
  }

  async delete(table: string, where: Record<string, unknown>): Promise<QueryResult> {
    const whereClause = Object.keys(where)
      .map((col) => `"${col}" = ?`)
      .join(" AND ");

    const sql = `DELETE FROM "${table}" WHERE ${whereClause}`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...Object.values(where));

    return { rows: [], rowCount: result.changes };
  }

  async listTables(): Promise<string[]> {
    const rows = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all() as { name: string }[];
    return rows.map((row) => row.name);
  }

  async describeTable(table: string): Promise<TableColumn[]> {
    const rows = this.db.prepare(`PRAGMA table_info("${table}")`).all() as {
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }[];

    return rows.map((row) => ({
      name: row.name,
      type: row.type,
      nullable: row.notnull === 0,
      defaultValue: row.dflt_value,
      isPrimaryKey: row.pk === 1,
    }));
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

// Factory function
export async function createDatabaseClient(config: Config): Promise<DatabaseClient> {
  switch (config.type) {
    case "postgresql":
      return new PostgresClient(config.connectionString);
    case "mysql":
      return new MySQLClient(config.connectionString);
    case "sqlite":
      return new SQLiteClient(config.connectionString);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}
