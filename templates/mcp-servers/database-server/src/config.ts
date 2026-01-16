/**
 * Configuration for the MCP Database Server
 */

export interface Config {
  type: "postgresql" | "mysql" | "sqlite";
  connectionString: string;
  readOnly?: boolean;
  maxConnections?: number;
}

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: Config = {
  type: (process.env.DB_TYPE as Config["type"]) ?? "postgresql",
  connectionString: getEnvOrThrow("DATABASE_URL"),
  readOnly: process.env.DB_READ_ONLY === "true",
  maxConnections: process.env.DB_MAX_CONNECTIONS
    ? parseInt(process.env.DB_MAX_CONNECTIONS, 10)
    : 10,
};
