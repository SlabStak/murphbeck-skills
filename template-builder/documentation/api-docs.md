# API Documentation Generator

Production-ready API documentation with OpenAPI/Swagger integration and interactive documentation.

## Overview

Generate comprehensive API documentation from code annotations, OpenAPI specs, and runtime analysis. This template provides automatic documentation generation with interactive API explorers.

## Quick Start

```bash
npm install swagger-jsdoc swagger-ui-express @apidevtools/swagger-parser
```

## TypeScript Implementation

### OpenAPI Spec Generator

```typescript
// src/services/docs/openapi-generator.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { OpenAPIV3 } from 'openapi-types';

interface OpenAPIConfig {
  title: string;
  version: string;
  description?: string;
  servers?: Array<{ url: string; description?: string }>;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
  tags?: Array<{
    name: string;
    description?: string;
  }>;
  securitySchemes?: Record<string, OpenAPIV3.SecuritySchemeObject>;
  apiPaths: string[];
}

class OpenAPIGenerator {
  private config: OpenAPIConfig;

  constructor(config: OpenAPIConfig) {
    this.config = config;
  }

  // Generate OpenAPI spec from JSDoc comments
  generateSpec(): OpenAPIV3.Document {
    const options: swaggerJsdoc.Options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: this.config.title,
          version: this.config.version,
          description: this.config.description,
          contact: this.config.contact,
          license: this.config.license,
        },
        servers: this.config.servers || [
          { url: '/api', description: 'API server' },
        ],
        tags: this.config.tags,
        components: {
          securitySchemes: this.config.securitySchemes || {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
            apiKey: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key',
            },
          },
        },
      },
      apis: this.config.apiPaths,
    };

    return swaggerJsdoc(options) as OpenAPIV3.Document;
  }

  // Add endpoint to spec programmatically
  addEndpoint(
    spec: OpenAPIV3.Document,
    path: string,
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    operation: OpenAPIV3.OperationObject
  ): OpenAPIV3.Document {
    if (!spec.paths) {
      spec.paths = {};
    }

    if (!spec.paths[path]) {
      spec.paths[path] = {};
    }

    spec.paths[path][method] = operation;

    return spec;
  }

  // Add schema to components
  addSchema(
    spec: OpenAPIV3.Document,
    name: string,
    schema: OpenAPIV3.SchemaObject
  ): OpenAPIV3.Document {
    if (!spec.components) {
      spec.components = {};
    }

    if (!spec.components.schemas) {
      spec.components.schemas = {};
    }

    spec.components.schemas[name] = schema;

    return spec;
  }

  // Generate TypeScript interfaces from schemas
  generateTypeScriptTypes(spec: OpenAPIV3.Document): string {
    const schemas = spec.components?.schemas || {};
    let output = '// Auto-generated types from OpenAPI spec\n\n';

    for (const [name, schema] of Object.entries(schemas)) {
      if ('$ref' in schema) continue;

      output += this.schemaToTypeScript(name, schema as OpenAPIV3.SchemaObject);
      output += '\n';
    }

    return output;
  }

  private schemaToTypeScript(name: string, schema: OpenAPIV3.SchemaObject): string {
    if (schema.type === 'object') {
      const properties = schema.properties || {};
      const required = schema.required || [];

      let output = `export interface ${name} {\n`;

      for (const [propName, propSchema] of Object.entries(properties)) {
        if ('$ref' in propSchema) {
          const refType = (propSchema.$ref as string).split('/').pop();
          const optional = required.includes(propName) ? '' : '?';
          output += `  ${propName}${optional}: ${refType};\n`;
        } else {
          const typedSchema = propSchema as OpenAPIV3.SchemaObject;
          const tsType = this.getTypeScriptType(typedSchema);
          const optional = required.includes(propName) ? '' : '?';
          output += `  ${propName}${optional}: ${tsType};\n`;
        }
      }

      output += '}\n';
      return output;
    }

    if (schema.enum) {
      return `export type ${name} = ${schema.enum.map(v => `'${v}'`).join(' | ')};\n`;
    }

    return `export type ${name} = ${this.getTypeScriptType(schema)};\n`;
  }

  private getTypeScriptType(schema: OpenAPIV3.SchemaObject): string {
    switch (schema.type) {
      case 'string':
        if (schema.format === 'date' || schema.format === 'date-time') {
          return 'string'; // Or 'Date' if you prefer
        }
        return 'string';
      case 'integer':
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        if (schema.items) {
          if ('$ref' in schema.items) {
            return `${(schema.items.$ref as string).split('/').pop()}[]`;
          }
          return `${this.getTypeScriptType(schema.items as OpenAPIV3.SchemaObject)}[]`;
        }
        return 'any[]';
      case 'object':
        if (schema.additionalProperties) {
          if (typeof schema.additionalProperties === 'boolean') {
            return 'Record<string, any>';
          }
          return `Record<string, ${this.getTypeScriptType(schema.additionalProperties as OpenAPIV3.SchemaObject)}>`;
        }
        return 'object';
      default:
        return 'any';
    }
  }
}

export const openAPIGenerator = new OpenAPIGenerator({
  title: process.env.API_TITLE || 'API Documentation',
  version: process.env.API_VERSION || '1.0.0',
  description: process.env.API_DESCRIPTION,
  apiPaths: ['./src/routes/**/*.ts'],
});
```

### API Documentation Decorator

```typescript
// src/services/docs/decorators.ts
import 'reflect-metadata';

const API_METADATA_KEY = 'api:metadata';

interface ParameterMetadata {
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  type: string;
  required?: boolean;
  description?: string;
  example?: any;
}

interface ResponseMetadata {
  status: number;
  description: string;
  schema?: any;
}

interface EndpointMetadata {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: ParameterMetadata[];
  requestBody?: {
    description?: string;
    schema: any;
    required?: boolean;
  };
  responses?: ResponseMetadata[];
  security?: string[];
  deprecated?: boolean;
}

// Class decorator for API controller
export function ApiController(basePath: string, tags?: string[]) {
  return function (target: any) {
    Reflect.defineMetadata('api:basePath', basePath, target);
    Reflect.defineMetadata('api:tags', tags || [], target);
  };
}

// Method decorator for endpoint
export function ApiEndpoint(metadata: Partial<EndpointMetadata>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(API_METADATA_KEY, target, propertyKey) || {};

    Reflect.defineMetadata(
      API_METADATA_KEY,
      { ...existingMetadata, ...metadata },
      target,
      propertyKey
    );

    return descriptor;
  };
}

// Convenience decorators
export function Get(path: string) {
  return ApiEndpoint({ path, method: 'get' });
}

export function Post(path: string) {
  return ApiEndpoint({ path, method: 'post' });
}

export function Put(path: string) {
  return ApiEndpoint({ path, method: 'put' });
}

export function Delete(path: string) {
  return ApiEndpoint({ path, method: 'delete' });
}

export function Patch(path: string) {
  return ApiEndpoint({ path, method: 'patch' });
}

// Parameter decorator
export function ApiParam(metadata: ParameterMetadata) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(API_METADATA_KEY, target, propertyKey) || {};
    const parameters = existingMetadata.parameters || [];

    parameters.push(metadata);

    Reflect.defineMetadata(
      API_METADATA_KEY,
      { ...existingMetadata, parameters },
      target,
      propertyKey
    );

    return descriptor;
  };
}

// Request body decorator
export function ApiBody(schema: any, options?: { description?: string; required?: boolean }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(API_METADATA_KEY, target, propertyKey) || {};

    Reflect.defineMetadata(
      API_METADATA_KEY,
      {
        ...existingMetadata,
        requestBody: {
          schema,
          description: options?.description,
          required: options?.required ?? true,
        },
      },
      target,
      propertyKey
    );

    return descriptor;
  };
}

// Response decorator
export function ApiResponse(status: number, description: string, schema?: any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(API_METADATA_KEY, target, propertyKey) || {};
    const responses = existingMetadata.responses || [];

    responses.push({ status, description, schema });

    Reflect.defineMetadata(
      API_METADATA_KEY,
      { ...existingMetadata, responses },
      target,
      propertyKey
    );

    return descriptor;
  };
}

// Security decorator
export function ApiSecurity(...schemes: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(API_METADATA_KEY, target, propertyKey) || {};

    Reflect.defineMetadata(
      API_METADATA_KEY,
      { ...existingMetadata, security: schemes },
      target,
      propertyKey
    );

    return descriptor;
  };
}

// Tags decorator
export function ApiTags(...tags: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(API_METADATA_KEY, target, propertyKey) || {};

    Reflect.defineMetadata(
      API_METADATA_KEY,
      { ...existingMetadata, tags },
      target,
      propertyKey
    );

    return descriptor;
  };
}

// Deprecated decorator
export function ApiDeprecated() {
  return ApiEndpoint({ deprecated: true });
}

// Extract metadata from decorated class
export function extractApiMetadata(controllerClass: any): EndpointMetadata[] {
  const basePath = Reflect.getMetadata('api:basePath', controllerClass) || '';
  const defaultTags = Reflect.getMetadata('api:tags', controllerClass) || [];

  const prototype = controllerClass.prototype;
  const methodNames = Object.getOwnPropertyNames(prototype).filter(
    name => name !== 'constructor'
  );

  const endpoints: EndpointMetadata[] = [];

  for (const methodName of methodNames) {
    const metadata = Reflect.getMetadata(API_METADATA_KEY, prototype, methodName);

    if (metadata) {
      endpoints.push({
        ...metadata,
        path: `${basePath}${metadata.path}`,
        tags: metadata.tags || defaultTags,
      });
    }
  }

  return endpoints;
}
```

## Express.js Integration

```typescript
// src/middleware/swagger-ui.ts
import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openAPIGenerator } from '../services/docs/openapi-generator';

const router = Router();

// Generate spec
const spec = openAPIGenerator.generateSpec();

// Serve Swagger UI
router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(spec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  })
);

// Serve raw OpenAPI spec
router.get('/openapi.json', (req: Request, res: Response) => {
  res.json(spec);
});

router.get('/openapi.yaml', (req: Request, res: Response) => {
  const yaml = require('js-yaml');
  res.type('text/yaml').send(yaml.dump(spec));
});

export default router;
```

### JSDoc Annotations

```typescript
// src/routes/users.ts - Example with JSDoc annotations
import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a paginated list of users
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *     security:
 *       - bearerAuth: []
 */
router.get('/', async (req: Request, res: Response) => {
  // Implementation
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a single user by their ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', async (req: Request, res: Response) => {
  // Implementation
});

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create user
 *     description: Create a new user account
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *     security:
 *       - bearerAuth: []
 */
router.post('/', async (req: Request, res: Response) => {
  // Implementation
});

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         role:
 *           type: string
 *           enum: [user, admin, moderator]
 *           example: "user"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *
 *     CreateUserRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *         password:
 *           type: string
 *           minLength: 8
 *         role:
 *           type: string
 *           enum: [user, admin]
 *       required:
 *         - email
 *         - name
 *         - password
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         pages:
 *           type: integer
 */

export default router;
```

## React Documentation Component

```tsx
// src/components/APIDocumentation.tsx
import React, { useState, useEffect } from 'react';

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
}

interface APIDocumentationProps {
  specUrl: string;
}

export function APIDocumentation({ specUrl }: APIDocumentationProps) {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  useEffect(() => {
    fetch(specUrl)
      .then(res => res.json())
      .then(data => {
        setSpec(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load API spec:', err);
        setLoading(false);
      });
  }, [specUrl]);

  if (loading) return <div>Loading documentation...</div>;
  if (!spec) return <div>Failed to load documentation</div>;

  const endpoints = Object.entries(spec.paths).flatMap(([path, methods]) =>
    Object.entries(methods as Record<string, any>).map(([method, details]) => ({
      path,
      method: method.toUpperCase(),
      ...details,
    }))
  );

  return (
    <div className="api-docs">
      <header className="api-docs-header">
        <h1>{spec.info.title}</h1>
        <span className="version">v{spec.info.version}</span>
        {spec.info.description && <p>{spec.info.description}</p>}
      </header>

      <div className="api-docs-content">
        <nav className="endpoints-nav">
          {endpoints.map(endpoint => (
            <button
              key={`${endpoint.method}-${endpoint.path}`}
              className={`endpoint-item ${selectedEndpoint === `${endpoint.method}-${endpoint.path}` ? 'active' : ''}`}
              onClick={() => setSelectedEndpoint(`${endpoint.method}-${endpoint.path}`)}
            >
              <span className={`method method-${endpoint.method.toLowerCase()}`}>
                {endpoint.method}
              </span>
              <span className="path">{endpoint.path}</span>
            </button>
          ))}
        </nav>

        <main className="endpoint-details">
          {selectedEndpoint && <EndpointDetails spec={spec} endpointKey={selectedEndpoint} />}
        </main>
      </div>
    </div>
  );
}

function EndpointDetails({ spec, endpointKey }: { spec: OpenAPISpec; endpointKey: string }) {
  const [method, ...pathParts] = endpointKey.split('-');
  const path = pathParts.join('-');
  const endpoint = spec.paths[path]?.[method.toLowerCase()];

  if (!endpoint) return null;

  return (
    <div className="endpoint-detail">
      <h2>{endpoint.summary || `${method} ${path}`}</h2>
      {endpoint.description && <p className="description">{endpoint.description}</p>}

      {endpoint.parameters?.length > 0 && (
        <section className="parameters">
          <h3>Parameters</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>In</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {endpoint.parameters.map((param: any) => (
                <tr key={param.name}>
                  <td><code>{param.name}</code></td>
                  <td>{param.in}</td>
                  <td>{param.schema?.type || 'any'}</td>
                  <td>{param.required ? 'Yes' : 'No'}</td>
                  <td>{param.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {endpoint.requestBody && (
        <section className="request-body">
          <h3>Request Body</h3>
          <pre>
            {JSON.stringify(
              endpoint.requestBody.content?.['application/json']?.schema,
              null,
              2
            )}
          </pre>
        </section>
      )}

      <section className="responses">
        <h3>Responses</h3>
        {Object.entries(endpoint.responses || {}).map(([status, response]: [string, any]) => (
          <div key={status} className="response">
            <h4>
              <span className={`status status-${status[0]}xx`}>{status}</span>
              {response.description}
            </h4>
            {response.content?.['application/json']?.schema && (
              <pre>
                {JSON.stringify(response.content['application/json'].schema, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
```

## Python Implementation

```python
# api_docs.py
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

app = FastAPI()

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="API Documentation",
        version="1.0.0",
        description="Complete API documentation",
        routes=app.routes,
    )

    # Customize security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        },
        "apiKey": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key"
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi


# Example models with documentation
class UserRole(str, Enum):
    user = "user"
    admin = "admin"
    moderator = "moderator"


class UserBase(BaseModel):
    """Base user model."""
    email: str = Field(..., description="User email address", example="user@example.com")
    name: str = Field(..., description="User full name", example="John Doe")

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "name": "John Doe"
            }
        }


class UserCreate(UserBase):
    """Model for creating a new user."""
    password: str = Field(..., min_length=8, description="User password")
    role: UserRole = Field(default=UserRole.user, description="User role")


class User(UserBase):
    """Full user model with all fields."""
    id: str = Field(..., description="Unique user ID")
    role: UserRole = Field(..., description="User role")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")


class PaginatedUsers(BaseModel):
    """Paginated list of users."""
    users: List[User]
    page: int = Field(..., ge=1, description="Current page number")
    limit: int = Field(..., ge=1, le=100, description="Items per page")
    total: int = Field(..., ge=0, description="Total number of items")
    pages: int = Field(..., ge=0, description="Total number of pages")


# Routes with documentation
@app.get(
    "/users",
    response_model=PaginatedUsers,
    summary="Get all users",
    description="Retrieve a paginated list of users with optional filtering",
    tags=["Users"],
    responses={
        200: {"description": "List of users"},
        401: {"description": "Unauthorized"},
    }
)
async def get_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None
):
    """
    Get all users with pagination.

    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 20, max: 100)
    - **search**: Optional search query
    """
    pass


@app.get(
    "/users/{user_id}",
    response_model=User,
    summary="Get user by ID",
    description="Retrieve a single user by their unique ID",
    tags=["Users"],
    responses={
        200: {"description": "User details"},
        404: {"description": "User not found"},
    }
)
async def get_user(user_id: str):
    """
    Get a specific user by ID.

    - **user_id**: The unique identifier of the user
    """
    pass


@app.post(
    "/users",
    response_model=User,
    status_code=201,
    summary="Create user",
    description="Create a new user account",
    tags=["Users"],
    responses={
        201: {"description": "User created successfully"},
        400: {"description": "Validation error"},
        409: {"description": "Email already exists"},
    }
)
async def create_user(user: UserCreate):
    """
    Create a new user.

    - **email**: Must be a valid email address
    - **name**: User's full name
    - **password**: Must be at least 8 characters
    - **role**: User role (default: user)
    """
    pass


# Custom docs endpoints
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"API Docs",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )


@app.get("/redoc", include_in_schema=False)
async def redoc():
    return get_redoc_html(
        openapi_url="/openapi.json",
        title=f"API Docs",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js",
    )
```

## CLAUDE.md Integration

```markdown
## API Documentation

### Commands
- `api:docs` - Generate API documentation
- `api:validate` - Validate OpenAPI spec
- `api:types` - Generate TypeScript types from spec
- `api:diff` - Compare API versions

### Key Files
- `src/services/docs/openapi-generator.ts` - Spec generator
- `src/services/docs/decorators.ts` - Documentation decorators
- `src/middleware/swagger-ui.ts` - Swagger UI setup

### JSDoc Tags
- `@openapi` - OpenAPI specification block
- `@summary` - Endpoint summary
- `@description` - Detailed description
- `@tags` - Endpoint tags
- `@param` - Parameter documentation
- `@returns` - Response documentation

### Documentation URLs
- `/api/docs` - Swagger UI
- `/api/docs/openapi.json` - OpenAPI JSON spec
- `/api/docs/openapi.yaml` - OpenAPI YAML spec
```

## AI Suggestions

1. **Versioning**: Support multiple API versions in documentation
2. **Examples**: Include request/response examples for all endpoints
3. **Try It Out**: Enable interactive API testing in Swagger UI
4. **Code Generation**: Generate client SDKs from OpenAPI spec
5. **Changelog**: Auto-generate API changelog from spec diffs
6. **Mocking**: Create mock servers from OpenAPI spec
7. **Validation**: Validate requests against OpenAPI schemas
8. **Testing**: Generate API tests from documentation
9. **Webhooks**: Document webhook payloads and events
10. **Rate Limits**: Document rate limiting in API specs
