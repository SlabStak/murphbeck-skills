#!/usr/bin/env node
/**
 * MCP API Gateway Server
 *
 * Provides HTTP request capabilities to external APIs through MCP.
 * Supports GET, POST, PUT, PATCH, DELETE with authentication.
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

// Configuration from environment
const config = {
  allowedDomains: process.env.ALLOWED_DOMAINS?.split(",") ?? [],
  defaultHeaders: JSON.parse(process.env.DEFAULT_HEADERS ?? "{}"),
  timeout: parseInt(process.env.REQUEST_TIMEOUT ?? "30000", 10),
  maxRetries: parseInt(process.env.MAX_RETRIES ?? "3", 10),
};

// API endpoint definitions (loaded from config)
interface ApiEndpoint {
  name: string;
  baseUrl: string;
  authType: "none" | "bearer" | "api-key" | "basic";
  authHeader?: string;
  authValue?: string;
}

const endpoints: Map<string, ApiEndpoint> = new Map();

// Load endpoints from environment
const endpointConfigs = JSON.parse(process.env.API_ENDPOINTS ?? "[]");
for (const ep of endpointConfigs) {
  endpoints.set(ep.name, ep);
}

// Initialize server
const server = new Server(
  {
    name: "mcp-api-gateway",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: "http_request",
    description: "Make an HTTP request to an API endpoint",
    inputSchema: {
      type: "object" as const,
      properties: {
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          description: "HTTP method",
        },
        url: {
          type: "string",
          description: "Full URL or path (if using named endpoint)",
        },
        endpoint: {
          type: "string",
          description: "Named endpoint from configuration (optional)",
        },
        headers: {
          type: "object",
          description: "Additional HTTP headers",
        },
        body: {
          type: "object",
          description: "Request body (for POST, PUT, PATCH)",
        },
        queryParams: {
          type: "object",
          description: "URL query parameters",
        },
      },
      required: ["method", "url"],
    },
  },
  {
    name: "list_endpoints",
    description: "List all configured API endpoints",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "configure_endpoint",
    description: "Configure a new API endpoint",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Unique name for this endpoint",
        },
        baseUrl: {
          type: "string",
          description: "Base URL for the API",
        },
        authType: {
          type: "string",
          enum: ["none", "bearer", "api-key", "basic"],
          description: "Authentication type",
        },
        authHeader: {
          type: "string",
          description: "Header name for auth (for api-key type)",
        },
        authValue: {
          type: "string",
          description: "Authentication value (token, key, or base64 credentials)",
        },
      },
      required: ["name", "baseUrl", "authType"],
    },
  },
];

// Input validation schemas
const HttpRequestInput = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string(),
  endpoint: z.string().optional(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  queryParams: z.record(z.string()).optional(),
});

const ConfigureEndpointInput = z.object({
  name: z.string(),
  baseUrl: z.string().url(),
  authType: z.enum(["none", "bearer", "api-key", "basic"]),
  authHeader: z.string().optional(),
  authValue: z.string().optional(),
});

// URL validation
function isAllowedDomain(url: string): boolean {
  if (config.allowedDomains.length === 0) return true;

  try {
    const parsed = new URL(url);
    return config.allowedDomains.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

// Build request headers with authentication
function buildHeaders(
  endpoint: ApiEndpoint | undefined,
  customHeaders: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...config.defaultHeaders,
    ...customHeaders,
  };

  if (endpoint) {
    switch (endpoint.authType) {
      case "bearer":
        if (endpoint.authValue) {
          headers["Authorization"] = `Bearer ${endpoint.authValue}`;
        }
        break;
      case "api-key":
        if (endpoint.authHeader && endpoint.authValue) {
          headers[endpoint.authHeader] = endpoint.authValue;
        }
        break;
      case "basic":
        if (endpoint.authValue) {
          headers["Authorization"] = `Basic ${endpoint.authValue}`;
        }
        break;
    }
  }

  return headers;
}

// Make HTTP request with retry logic
async function makeRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown
): Promise<{ status: number; headers: Record<string, string>; data: unknown }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: unknown;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        headers: responseHeaders,
        data,
      };
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timed out");
      }

      // Wait before retry with exponential backoff
      if (attempt < config.maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError ?? new Error("Request failed");
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "http_request": {
        const input = HttpRequestInput.parse(args);

        // Resolve URL
        let fullUrl = input.url;
        let endpoint: ApiEndpoint | undefined;

        if (input.endpoint) {
          endpoint = endpoints.get(input.endpoint);
          if (!endpoint) {
            throw new Error(`Unknown endpoint: ${input.endpoint}`);
          }
          fullUrl = input.url.startsWith("http")
            ? input.url
            : `${endpoint.baseUrl}${input.url}`;
        }

        // Add query parameters
        if (input.queryParams && Object.keys(input.queryParams).length > 0) {
          const url = new URL(fullUrl);
          for (const [key, value] of Object.entries(input.queryParams)) {
            url.searchParams.append(key, value);
          }
          fullUrl = url.toString();
        }

        // Validate domain
        if (!isAllowedDomain(fullUrl)) {
          throw new Error(`Domain not allowed: ${fullUrl}`);
        }

        // Build headers
        const headers = buildHeaders(endpoint, input.headers);

        // Make request
        const response = await makeRequest(
          input.method,
          fullUrl,
          headers,
          input.body
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: response.status,
                  headers: response.headers,
                  data: response.data,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_endpoints": {
        const endpointList = Array.from(endpoints.entries()).map(
          ([name, ep]) => ({
            name,
            baseUrl: ep.baseUrl,
            authType: ep.authType,
          })
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ endpoints: endpointList }, null, 2),
            },
          ],
        };
      }

      case "configure_endpoint": {
        const input = ConfigureEndpointInput.parse(args);

        endpoints.set(input.name, {
          name: input.name,
          baseUrl: input.baseUrl,
          authType: input.authType,
          authHeader: input.authHeader,
          authValue: input.authValue,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Endpoint "${input.name}" configured successfully`,
              }),
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

// List API endpoints as resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = Array.from(endpoints.entries()).map(([name, ep]) => ({
    uri: `api://endpoints/${name}`,
    name: `API: ${name}`,
    description: `${ep.baseUrl} (${ep.authType} auth)`,
    mimeType: "application/json",
  }));

  return { resources };
});

// Read resource (endpoint info)
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/^api:\/\/endpoints\/(.+)$/);

  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const endpointName = match[1];
  const endpoint = endpoints.get(endpointName);

  if (!endpoint) {
    throw new Error(`Unknown endpoint: ${endpointName}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            name: endpoint.name,
            baseUrl: endpoint.baseUrl,
            authType: endpoint.authType,
            // Don't expose auth value
          },
          null,
          2
        ),
      },
    ],
  };
});

// Main entry point
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP API Gateway Server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
