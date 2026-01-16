#!/usr/bin/env node
/**
 * MCP Database Server
 *
 * Provides database operations (query, insert, update, delete) through MCP.
 * Supports PostgreSQL, MySQL, and SQLite.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { DatabaseClient, createDatabaseClient } from "./database.js";
import { config } from "./config.js";

// Initialize server
const server = new Server(
  {
    name: "mcp-database-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Database client instance
let db: DatabaseClient;

// Tool definitions
const TOOLS = [
  {
    name: "query",
    description: "Execute a SELECT query and return results",
    inputSchema: {
      type: "object" as const,
      properties: {
        sql: {
          type: "string",
          description: "SQL SELECT query to execute",
        },
        params: {
          type: "array",
          items: { type: "string" },
          description: "Query parameters for prepared statements",
        },
      },
      required: ["sql"],
    },
  },
  {
    name: "insert",
    description: "Insert a new record into a table",
    inputSchema: {
      type: "object" as const,
      properties: {
        table: {
          type: "string",
          description: "Table name",
        },
        data: {
          type: "object",
          description: "Key-value pairs of column names and values",
        },
      },
      required: ["table", "data"],
    },
  },
  {
    name: "update",
    description: "Update existing records in a table",
    inputSchema: {
      type: "object" as const,
      properties: {
        table: {
          type: "string",
          description: "Table name",
        },
        data: {
          type: "object",
          description: "Key-value pairs of columns to update",
        },
        where: {
          type: "object",
          description: "WHERE conditions as key-value pairs",
        },
      },
      required: ["table", "data", "where"],
    },
  },
  {
    name: "delete",
    description: "Delete records from a table",
    inputSchema: {
      type: "object" as const,
      properties: {
        table: {
          type: "string",
          description: "Table name",
        },
        where: {
          type: "object",
          description: "WHERE conditions as key-value pairs",
        },
      },
      required: ["table", "where"],
    },
  },
  {
    name: "list_tables",
    description: "List all tables in the database",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "describe_table",
    description: "Get the schema/structure of a table",
    inputSchema: {
      type: "object" as const,
      properties: {
        table: {
          type: "string",
          description: "Table name to describe",
        },
      },
      required: ["table"],
    },
  },
];

// Input validation schemas
const QueryInput = z.object({
  sql: z.string(),
  params: z.array(z.unknown()).optional(),
});

const InsertInput = z.object({
  table: z.string(),
  data: z.record(z.unknown()),
});

const UpdateInput = z.object({
  table: z.string(),
  data: z.record(z.unknown()),
  where: z.record(z.unknown()),
});

const DeleteInput = z.object({
  table: z.string(),
  where: z.record(z.unknown()),
});

const DescribeInput = z.object({
  table: z.string(),
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "query": {
        const input = QueryInput.parse(args);

        // Security: Only allow SELECT queries
        if (!input.sql.trim().toUpperCase().startsWith("SELECT")) {
          throw new Error("Only SELECT queries are allowed with the query tool");
        }

        const results = await db.query(input.sql, input.params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "insert": {
        const input = InsertInput.parse(args);
        const result = await db.insert(input.table, input.data);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Inserted record into ${input.table}`,
                result,
              }),
            },
          ],
        };
      }

      case "update": {
        const input = UpdateInput.parse(args);
        const result = await db.update(input.table, input.data, input.where);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Updated records in ${input.table}`,
                rowsAffected: result.rowCount,
              }),
            },
          ],
        };
      }

      case "delete": {
        const input = DeleteInput.parse(args);
        const result = await db.delete(input.table, input.where);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Deleted records from ${input.table}`,
                rowsAffected: result.rowCount,
              }),
            },
          ],
        };
      }

      case "list_tables": {
        const tables = await db.listTables();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ tables }, null, 2),
            },
          ],
        };
      }

      case "describe_table": {
        const input = DescribeInput.parse(args);
        const schema = await db.describeTable(input.table);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(schema, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: message }),
        },
      ],
      isError: true,
    };
  }
});

// List database resources (tables as resources)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    const tables = await db.listTables();
    return {
      resources: tables.map((table) => ({
        uri: `db://tables/${table}`,
        name: table,
        description: `Database table: ${table}`,
        mimeType: "application/json",
      })),
    };
  } catch {
    return { resources: [] };
  }
});

// Read resource (table data)
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/^db:\/\/tables\/(.+)$/);

  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const tableName = match[1];
  const results = await db.query(
    `SELECT * FROM ${tableName} LIMIT 100`
  );

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(results, null, 2),
      },
    ],
  };
});

// Main entry point
async function main() {
  // Initialize database connection
  db = await createDatabaseClient(config);

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("MCP Database Server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
