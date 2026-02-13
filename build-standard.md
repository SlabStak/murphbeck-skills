# Licenzr Build Standard

> **MANDATORY REFERENCE** for all `/siteforge`, `/build`, `/blueprint`, and app/site creation tasks.
> This standard codifies the exact architecture from the Licenzr `gm-changes-2026-02-04` branch.

---

## Section 1: Build Standard Overview & Architecture

### Core Principle

**NO ORMs EVER.** Direct PostgreSQL functions via the `pg` library only.

### Architecture Flow

```
API Route → TS Wrapper → callFunction<T>() → PG Function → JSONB → function_log
```

### Mandatory Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js App Router |
| Database | PostgreSQL 16 via `pg` library |
| Auth | Clerk |
| Payments | Stripe |
| Validation | Zod |
| UI | Radix UI + Tailwind CSS |
| Testing | Jest + Playwright |
| Cache | Redis 7 |
| Container | Docker Compose |

### When This Standard Applies

- Every `/siteforge` invocation
- Every `/build` invocation
- Every `/blueprint` invocation
- Any app or site creation task
- Any database-backed application

---

## Section 2: Pre-Build Checklist (18 Steps)

Execute these steps in order when starting any new project:

### Repository & Project Setup
- [ ] **Step 1:** Create GitHub repo
- [ ] **Step 2:** Scaffold Next.js App Router project (`npx create-next-app@latest --typescript --tailwind --eslint --app`)
- [ ] **Step 3:** Set up Docker Compose (PostgreSQL 16 + Redis 7 + App)

### Database Foundation
- [ ] **Step 4:** Create restricted API user SQL (`postgresql/setup-api-user.sql`)
- [ ] **Step 5:** Create `function_log` table
- [ ] **Step 6:** Scaffold `postgresql/functions/` directory (one `.sql` per domain)

### TypeScript Database Layer
- [ ] **Step 7:** Create `src/lib/db.ts` (pool + `callFunction`)
- [ ] **Step 8:** Create `src/types/db.ts` (`DbResult` + entity types)
- [ ] **Step 9:** Create `src/lib/db/` wrapper directory with `index.ts` barrel

### Authentication & Validation
- [ ] **Step 10:** Set up Clerk auth
- [ ] **Step 11:** Set up Zod validation schemas

### API Layer
- [ ] **Step 12:** Create API route structure under `src/app/api/`

### Infrastructure & Deployment
- [ ] **Step 13:** Set up CI/CD (GitHub Actions)
- [ ] **Step 14:** Create `vercel.json` with security headers

### Data Management
- [ ] **Step 15:** Set up seed data directory (`postgresql/seed/`)

### Planning & Documentation
- [ ] **Step 16:** Create `agentic/prd/` directory for PRD planning
- [ ] **Step 17:** Create `mockups/` directory for HTML prototypes
- [ ] **Step 18:** Create `.claude/skills/` for project-specific Claude skills

---

## Section 3: PostgreSQL Function Templates

### CREATE Function Template

```sql
CREATE OR REPLACE FUNCTION create_[entity](
    p_user_id TEXT,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    l_id TEXT;
    l_result JSONB;
    l_now TIMESTAMPTZ := NOW();
BEGIN
    -- Generate prefixed UUID
    l_id := '[prefix]_' || gen_random_uuid()::TEXT;

    -- Insert record
    INSERT INTO [entity]s (
        id,
        name,
        description,
        metadata,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        l_id,
        p_name,
        p_description,
        p_metadata,
        p_user_id,
        l_now,
        l_now
    );

    -- Build result
    l_result := jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'id', l_id,
            'name', p_name,
            'description', p_description,
            'metadata', p_metadata,
            'created_by', p_user_id,
            'created_at', l_now,
            'updated_at', l_now
        )
    );

    -- Log operation
    INSERT INTO function_log (
        function_name,
        user_id,
        input_params,
        output_result,
        execution_time_ms
    ) VALUES (
        'create_[entity]',
        p_user_id,
        jsonb_build_object('name', p_name, 'description', p_description),
        l_result,
        EXTRACT(MILLISECONDS FROM (clock_timestamp() - l_now))::INTEGER
    );

    RETURN l_result;

EXCEPTION WHEN OTHERS THEN
    l_result := jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM
    );

    INSERT INTO function_log (
        function_name,
        user_id,
        input_params,
        output_result,
        error_message
    ) VALUES (
        'create_[entity]',
        p_user_id,
        jsonb_build_object('name', p_name, 'description', p_description),
        l_result,
        SQLERRM
    );

    RETURN l_result;
END;
$$;
```

### GET Function Template

```sql
CREATE OR REPLACE FUNCTION get_[entity](
    p_user_id TEXT,
    p_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    l_result JSONB;
    l_record RECORD;
    l_now TIMESTAMPTZ := NOW();
BEGIN
    -- Fetch record
    SELECT *
    INTO l_record
    FROM [entity]s
    WHERE id = p_id
      AND is_deleted = FALSE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', '[Entity] not found'
        );
    END IF;

    -- Build result
    l_result := jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'id', l_record.id,
            'name', l_record.name,
            'description', l_record.description,
            'metadata', l_record.metadata,
            'created_by', l_record.created_by,
            'created_at', l_record.created_at,
            'updated_at', l_record.updated_at
        )
    );

    -- Log operation
    INSERT INTO function_log (
        function_name,
        user_id,
        input_params,
        output_result,
        execution_time_ms
    ) VALUES (
        'get_[entity]',
        p_user_id,
        jsonb_build_object('id', p_id),
        l_result,
        EXTRACT(MILLISECONDS FROM (clock_timestamp() - l_now))::INTEGER
    );

    RETURN l_result;
END;
$$;
```

### LIST Function Template

```sql
CREATE OR REPLACE FUNCTION list_[entity]s(
    p_user_id TEXT,
    p_filters JSONB DEFAULT '{}'::JSONB,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    l_result JSONB;
    l_items JSONB;
    l_total INTEGER;
    l_now TIMESTAMPTZ := NOW();
BEGIN
    -- Get total count
    SELECT COUNT(*)
    INTO l_total
    FROM [entity]s
    WHERE is_deleted = FALSE
      AND (p_filters->>'organization_id' IS NULL
           OR organization_id = p_filters->>'organization_id');

    -- Get paginated items
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', e.id,
            'name', e.name,
            'description', e.description,
            'metadata', e.metadata,
            'created_at', e.created_at,
            'updated_at', e.updated_at
        ) ORDER BY e.created_at DESC
    ), '[]'::JSONB)
    INTO l_items
    FROM [entity]s e
    WHERE e.is_deleted = FALSE
      AND (p_filters->>'organization_id' IS NULL
           OR e.organization_id = p_filters->>'organization_id')
    LIMIT p_limit
    OFFSET p_offset;

    -- Build result
    l_result := jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'items', l_items,
            'total', l_total,
            'limit', p_limit,
            'offset', p_offset
        )
    );

    -- Log operation
    INSERT INTO function_log (
        function_name,
        user_id,
        input_params,
        output_result,
        execution_time_ms
    ) VALUES (
        'list_[entity]s',
        p_user_id,
        jsonb_build_object('filters', p_filters, 'limit', p_limit, 'offset', p_offset),
        jsonb_build_object('success', TRUE, 'total', l_total),
        EXTRACT(MILLISECONDS FROM (clock_timestamp() - l_now))::INTEGER
    );

    RETURN l_result;
END;
$$;
```

### UPDATE Function Template

```sql
CREATE OR REPLACE FUNCTION update_[entity](
    p_user_id TEXT,
    p_id TEXT,
    p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    l_result JSONB;
    l_exists BOOLEAN;
    l_now TIMESTAMPTZ := NOW();
BEGIN
    -- Check existence
    SELECT EXISTS(
        SELECT 1 FROM [entity]s
        WHERE id = p_id AND is_deleted = FALSE
    ) INTO l_exists;

    IF NOT l_exists THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', '[Entity] not found'
        );
    END IF;

    -- Update record
    UPDATE [entity]s
    SET
        name = COALESCE(p_updates->>'name', name),
        description = COALESCE(p_updates->>'description', description),
        metadata = COALESCE(p_updates->'metadata', metadata),
        updated_at = l_now,
        updated_by = p_user_id
    WHERE id = p_id;

    -- Return updated record
    RETURN get_[entity](p_user_id, p_id);

EXCEPTION WHEN OTHERS THEN
    l_result := jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM
    );

    INSERT INTO function_log (
        function_name,
        user_id,
        input_params,
        output_result,
        error_message
    ) VALUES (
        'update_[entity]',
        p_user_id,
        jsonb_build_object('id', p_id, 'updates', p_updates),
        l_result,
        SQLERRM
    );

    RETURN l_result;
END;
$$;
```

### DELETE Function Template (Soft Delete)

```sql
CREATE OR REPLACE FUNCTION delete_[entity](
    p_user_id TEXT,
    p_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    l_result JSONB;
    l_exists BOOLEAN;
    l_now TIMESTAMPTZ := NOW();
BEGIN
    -- Check existence
    SELECT EXISTS(
        SELECT 1 FROM [entity]s
        WHERE id = p_id AND is_deleted = FALSE
    ) INTO l_exists;

    IF NOT l_exists THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', '[Entity] not found'
        );
    END IF;

    -- Soft delete
    UPDATE [entity]s
    SET
        is_deleted = TRUE,
        deleted_at = l_now,
        deleted_by = p_user_id,
        updated_at = l_now
    WHERE id = p_id;

    l_result := jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'id', p_id,
            'deleted', TRUE
        )
    );

    -- Log operation
    INSERT INTO function_log (
        function_name,
        user_id,
        input_params,
        output_result,
        execution_time_ms
    ) VALUES (
        'delete_[entity]',
        p_user_id,
        jsonb_build_object('id', p_id),
        l_result,
        EXTRACT(MILLISECONDS FROM (clock_timestamp() - l_now))::INTEGER
    );

    RETURN l_result;
END;
$$;
```

### BULK CREATE Function Template

```sql
CREATE OR REPLACE FUNCTION bulk_create_[entity]s(
    p_user_id TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    l_item JSONB;
    l_id TEXT;
    l_ids TEXT[] := '{}';
    l_result JSONB;
    l_now TIMESTAMPTZ := NOW();
BEGIN
    FOR l_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        l_id := '[prefix]_' || gen_random_uuid()::TEXT;
        l_ids := array_append(l_ids, l_id);

        INSERT INTO [entity]s (
            id,
            name,
            description,
            metadata,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            l_id,
            l_item->>'name',
            l_item->>'description',
            COALESCE(l_item->'metadata', '{}'::JSONB),
            p_user_id,
            l_now,
            l_now
        );
    END LOOP;

    l_result := jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'ids', to_jsonb(l_ids),
            'count', array_length(l_ids, 1)
        )
    );

    -- Log operation
    INSERT INTO function_log (
        function_name,
        user_id,
        input_params,
        output_result,
        execution_time_ms
    ) VALUES (
        'bulk_create_[entity]s',
        p_user_id,
        jsonb_build_object('count', jsonb_array_length(p_items)),
        l_result,
        EXTRACT(MILLISECONDS FROM (clock_timestamp() - l_now))::INTEGER
    );

    RETURN l_result;

EXCEPTION WHEN OTHERS THEN
    l_result := jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM
    );
    RETURN l_result;
END;
$$;
```

### ANALYTICS Function Template

```sql
CREATE OR REPLACE FUNCTION get_[entity]_analytics(
    p_user_id TEXT,
    p_organization_id TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_granularity TEXT DEFAULT 'DAY'  -- DAY, WEEK, MONTH, QUARTER, YEAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    l_result JSONB;
    l_data JSONB;
    l_now TIMESTAMPTZ := NOW();
BEGIN
    WITH date_series AS (
        SELECT generate_series(
            p_start_date::TIMESTAMP,
            p_end_date::TIMESTAMP,
            CASE p_granularity
                WHEN 'DAY' THEN '1 day'::INTERVAL
                WHEN 'WEEK' THEN '1 week'::INTERVAL
                WHEN 'MONTH' THEN '1 month'::INTERVAL
                WHEN 'QUARTER' THEN '3 months'::INTERVAL
                WHEN 'YEAR' THEN '1 year'::INTERVAL
            END
        ) AS period_start
    ),
    aggregated AS (
        SELECT
            ds.period_start,
            COUNT(e.id) AS count,
            COALESCE(SUM((e.metadata->>'amount')::NUMERIC), 0) AS total_amount
        FROM date_series ds
        LEFT JOIN [entity]s e ON
            DATE_TRUNC(LOWER(p_granularity), e.created_at) = ds.period_start
            AND e.organization_id = p_organization_id
            AND e.is_deleted = FALSE
        GROUP BY ds.period_start
        ORDER BY ds.period_start
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'period', period_start,
            'count', count,
            'total_amount', total_amount
        )
    )
    INTO l_data
    FROM aggregated;

    l_result := jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'granularity', p_granularity,
            'start_date', p_start_date,
            'end_date', p_end_date,
            'periods', COALESCE(l_data, '[]'::JSONB)
        )
    );

    -- Log operation
    INSERT INTO function_log (
        function_name,
        user_id,
        input_params,
        output_result,
        execution_time_ms
    ) VALUES (
        'get_[entity]_analytics',
        p_user_id,
        jsonb_build_object(
            'organization_id', p_organization_id,
            'start_date', p_start_date,
            'end_date', p_end_date,
            'granularity', p_granularity
        ),
        jsonb_build_object('success', TRUE),
        EXTRACT(MILLISECONDS FROM (clock_timestamp() - l_now))::INTEGER
    );

    RETURN l_result;
END;
$$;
```

---

## Section 4: Security Setup Template

### setup-api-user.sql

```sql
-- Create restricted API user
-- Run this AFTER creating all tables and functions

-- Create the user (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_api') THEN
        CREATE ROLE app_api WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;
END
$$;

-- Revoke all default privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_api;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM app_api;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM app_api;

-- Grant connect to database
GRANT CONNECT ON DATABASE [database_name] TO app_api;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO app_api;

-- Grant EXECUTE on all functions (the ONLY way app_api accesses data)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_api;

-- Set default privileges for future functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO app_api;

-- Explicitly deny direct table access
-- (This is the default after REVOKE ALL, but being explicit)
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM app_api;

-- The app_api user can ONLY:
-- 1. Connect to the database
-- 2. Execute functions (which use SECURITY DEFINER to access tables)
-- 3. Nothing else
```

### function_log Table

```sql
CREATE TABLE IF NOT EXISTS function_log (
    id BIGSERIAL PRIMARY KEY,
    function_name TEXT NOT NULL,
    user_id TEXT,
    input_params JSONB DEFAULT '{}'::JSONB,
    output_result JSONB DEFAULT '{}'::JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by function name
CREATE INDEX IF NOT EXISTS idx_function_log_function_name
    ON function_log(function_name);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_function_log_user_id
    ON function_log(user_id);

-- Index for querying by time
CREATE INDEX IF NOT EXISTS idx_function_log_created_at
    ON function_log(created_at DESC);

-- Partition by month for large-scale deployments (optional)
-- CREATE TABLE function_log_y2024m01 PARTITION OF function_log
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## Section 5: TypeScript DB Connection (src/lib/db.ts)

```typescript
import { Pool, PoolClient, QueryResult } from 'pg';

// Singleton pool with globalThis caching for development hot-reload
const globalForPg = globalThis as unknown as { pgPool: Pool | undefined };

const pool = globalForPg.pgPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                    // Maximum connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Fail if can't connect in 10s
});

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pool;
}

/**
 * Result wrapper type for all database operations
 */
export interface DbResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Call a PostgreSQL function and return typed result
 * This is the PRIMARY way to interact with the database
 */
export async function callFunction<T>(
  functionName: string,
  args: unknown[] = []
): Promise<DbResult<T>> {
  const client = await pool.connect();

  try {
    // Build parameterized query: SELECT function_name($1, $2, ...) as result
    const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `SELECT ${functionName}(${placeholders}) as result`;

    const result = await client.query(sql, args);

    // Parse JSONB result from PostgreSQL function
    const jsonResult = result.rows[0]?.result;

    if (!jsonResult) {
      return { success: false, error: 'No result from function' };
    }

    return jsonResult as DbResult<T>;
  } catch (error) {
    console.error(`Database function ${functionName} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  } finally {
    client.release();
  }
}

/**
 * Execute raw SQL query (use sparingly - prefer callFunction)
 */
export async function query<T>(
  sql: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    return await client.query<T>(sql, params);
  } finally {
    client.release();
  }
}

/**
 * Get a client for transaction support
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Graceful shutdown
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export { pool };
```

---

## Section 6: TypeScript Domain Wrapper Template

### src/lib/db/[domain].ts

```typescript
import 'server-only';

import { callFunction, DbResult } from '../db';
import { [Entity], [Entity]ListResult, [Entity]CreateInput } from '@/types/db';

/**
 * Map database row (snake_case) to TypeScript object (camelCase)
 */
function mapRow(row: Record<string, unknown>): [Entity] {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    metadata: row.metadata as Record<string, unknown>,
    organizationId: row.organization_id as string,
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Create a new [entity]
 */
export async function create[Entity](
  userId: string,
  input: [Entity]CreateInput
): Promise<DbResult<[Entity]>> {
  const result = await callFunction<Record<string, unknown>>(
    'create_[entity]',
    [userId, input.name, input.description, input.metadata ?? {}]
  );

  if (result.success && result.data) {
    return { success: true, data: mapRow(result.data) };
  }

  return result as DbResult<[Entity]>;
}

/**
 * Get [entity] by ID
 */
export async function get[Entity](
  userId: string,
  id: string
): Promise<DbResult<[Entity]>> {
  const result = await callFunction<Record<string, unknown>>(
    'get_[entity]',
    [userId, id]
  );

  if (result.success && result.data) {
    return { success: true, data: mapRow(result.data) };
  }

  return result as DbResult<[Entity]>;
}

/**
 * List [entity]s with pagination and filters
 */
export async function list[Entity]s(
  userId: string,
  filters: Record<string, unknown> = {},
  limit = 50,
  offset = 0
): Promise<DbResult<[Entity]ListResult>> {
  const result = await callFunction<{
    items: Record<string, unknown>[];
    total: number;
    limit: number;
    offset: number;
  }>('list_[entity]s', [userId, filters, limit, offset]);

  if (result.success && result.data) {
    return {
      success: true,
      data: {
        items: result.data.items.map(mapRow),
        total: result.data.total,
        limit: result.data.limit,
        offset: result.data.offset,
      },
    };
  }

  return result as DbResult<[Entity]ListResult>;
}

/**
 * Update [entity]
 */
export async function update[Entity](
  userId: string,
  id: string,
  updates: Partial<[Entity]CreateInput>
): Promise<DbResult<[Entity]>> {
  const result = await callFunction<Record<string, unknown>>(
    'update_[entity]',
    [userId, id, updates]
  );

  if (result.success && result.data) {
    return { success: true, data: mapRow(result.data) };
  }

  return result as DbResult<[Entity]>;
}

/**
 * Delete [entity] (soft delete)
 */
export async function delete[Entity](
  userId: string,
  id: string
): Promise<DbResult<{ id: string; deleted: boolean }>> {
  return callFunction('delete_[entity]', [userId, id]);
}
```

### src/lib/db/index.ts (Barrel Export)

```typescript
// Re-export all domain modules
export * from './organizations';
export * from './users';
export * from './products';
export * from './orders';
// Add more domain exports as needed
```

---

## Section 7: Entity Types (src/types/db.ts)

```typescript
/**
 * Standard result wrapper for all database operations
 */
export interface DbResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Pagination result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// ORGANIZATION
// =============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationCreateInput {
  name: string;
  slug: string;
  metadata?: Record<string, unknown>;
}

export type OrganizationListResult = PaginatedResult<Organization>;

// =============================================================================
// USER
// =============================================================================

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationId: string;
  role: UserRole;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface UserCreateInput {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  role?: UserRole;
}

export type UserListResult = PaginatedResult<User>;

// =============================================================================
// PRODUCT (Example Domain)
// =============================================================================

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  organizationId: string;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreateInput {
  name: string;
  description?: string;
  sku: string;
  price: number;
  metadata?: Record<string, unknown>;
}

export type ProductListResult = PaginatedResult<Product>;

// =============================================================================
// Add more entity types following this pattern
// =============================================================================
```

---

## Section 8: API Route Templates

### GET List Route

```typescript
// src/app/api/[domain]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { list[Entity]s } from '@/lib/db';
import { getDataAccessContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const context = await getDataAccessContext(userId);

  if (!context.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);
  const filters = {
    organizationId: context.organizationId,
  };

  const result = await list[Entity]s(userId, filters, limit, offset);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
```

### GET by ID Route

```typescript
// src/app/api/[domain]/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { get[Entity] } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await get[Entity](userId, params.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === '[Entity] not found' ? 404 : 500 }
    );
  }

  return NextResponse.json(result.data);
}
```

### POST Create Route

```typescript
// src/app/api/[domain]/route.ts (add to existing file)
import { z } from 'zod';
import { create[Entity] } from '@/lib/db';

const Create[Entity]Schema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const context = await getDataAccessContext(userId);

  if (!context.canWrite) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = Create[Entity]Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await create[Entity](userId, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data, { status: 201 });
}
```

### PATCH Update Route

```typescript
// src/app/api/[domain]/[id]/route.ts (add to existing file)
import { z } from 'zod';
import { update[Entity] } from '@/lib/db';

const Update[Entity]Schema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = Update[Entity]Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await update[Entity](userId, params.id, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === '[Entity] not found' ? 404 : 500 }
    );
  }

  return NextResponse.json(result.data);
}
```

### DELETE Route

```typescript
// src/app/api/[domain]/[id]/route.ts (add to existing file)
import { delete[Entity] } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await delete[Entity](userId, params.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === '[Entity] not found' ? 404 : 500 }
    );
  }

  return NextResponse.json(result.data);
}
```

### Complex Route (Parallel Data Fetching)

```typescript
// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listOrganizations, listProducts, getAnalytics } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parallel data fetching for dashboard
  const [orgsResult, productsResult, analyticsResult] = await Promise.all([
    listOrganizations(userId, {}, 10, 0),
    listProducts(userId, {}, 5, 0),
    getAnalytics(userId, { period: 'last_30_days' }),
  ]);

  // Graceful fallbacks for partial failures
  return NextResponse.json({
    organizations: orgsResult.success ? orgsResult.data : { items: [], total: 0 },
    products: productsResult.success ? productsResult.data : { items: [], total: 0 },
    analytics: analyticsResult.success ? analyticsResult.data : null,
    errors: {
      organizations: orgsResult.success ? null : orgsResult.error,
      products: productsResult.success ? null : productsResult.error,
      analytics: analyticsResult.success ? null : analyticsResult.error,
    },
  });
}
```

---

## Section 9: Complete Project Structure

```
project-root/
├── agentic/
│   └── prd/
│       ├── proposed/              # New PRD ideas
│       │   └── notes.md
│       ├── working/               # Active PRDs + task lists
│       │   ├── 001-prd-user-auth.md
│       │   └── 001-tasks-user-auth.md
│       └── completed/             # Archived task lists
│           └── 001-tasks-user-auth.md
├── mockups/
│   ├── README.md                  # Index of all mockups
│   ├── dashboard.html
│   ├── products.html
│   ├── settings.html
│   └── login.html
├── postgresql/
│   ├── functions/                 # One .sql file per domain
│   │   ├── organization.sql
│   │   ├── user.sql
│   │   ├── product.sql
│   │   └── order.sql
│   ├── seed/                      # Seed data files
│   │   ├── 00-truncate.sql
│   │   ├── 01-seed-base.sql
│   │   ├── 02-seed-organizations.sql
│   │   ├── products/              # Batched product seeds
│   │   │   ├── prod-0001-0020.sql
│   │   │   ├── prod-0021-0040.sql
│   │   │   └── prod-0041-0060.sql
│   │   └── sales/                 # Monthly sales seeds
│   │       ├── sales-2024-01.sql
│   │       ├── sales-2024-02.sql
│   │       └── ...
│   └── setup-api-user.sql
├── scripts/
│   ├── run-migration.sh           # Migration runner
│   ├── reset-and-seed.sh          # Full reset + seed
│   ├── generate-products.sh       # Product seed generator
│   └── generate-sales.sh          # Sales seed generator
├── sql/
│   └── migrations/                # Numbered migrations
│       ├── 0001_initial_schema.sql
│       ├── 0002_add_products.sql
│       └── 0003_add_orders.sql
├── src/
│   ├── app/
│   │   ├── api/                   # Next.js API routes
│   │   │   ├── organizations/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── products/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   └── dashboard/
│   │   │       └── route.ts
│   │   ├── (auth)/                # Auth pages
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/           # Protected pages
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                    # Radix + Tailwind components
│   │   └── ...
│   ├── lib/
│   │   ├── db.ts                  # Pool + callFunction
│   │   ├── db/                    # Domain wrappers
│   │   │   ├── index.ts           # Barrel export
│   │   │   ├── organizations.ts
│   │   │   ├── users.ts
│   │   │   └── products.ts
│   │   ├── auth.ts                # Auth utilities
│   │   └── utils.ts
│   └── types/
│       └── db.ts                  # All entity types
├── .claude/
│   └── skills/                    # Project-specific skills
│       ├── db-migration/
│       │   └── SKILL.md
│       ├── sql-migrate/
│       │   └── SKILL.md
│       └── prd/
│           └── SKILL.md
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Main CI workflow
│       └── deploy.yml             # Deployment workflow
├── docker-compose.yml
├── vercel.json
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .env.example
├── .env.local                     # (gitignored)
└── .gitignore
```

---

## Section 10: Infrastructure Templates

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ${PROJECT_NAME:-app}_postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-app_dev}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgresql:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ${PROJECT_NAME:-app}_redis
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${PROJECT_NAME:-app}_web
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-app_dev}
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules

  adminer:
    image: adminer:latest
    container_name: ${PROJECT_NAME:-app}_adminer
    ports:
      - '8080:8080'
    depends_on:
      - postgres
    profiles:
      - tools

volumes:
  postgres_data:
  redis_data:
```

### Vercel Configuration

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ],
  "functions": {
    "src/app/api/**/*": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily-cleanup",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

### GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next

  e2e:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm audit --audit-level=high
      - name: Run Snyk
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Migration Script

```bash
#!/bin/bash
# scripts/run-migration.sh

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
DRY_RUN=false
MIGRATION_FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry)
      DRY_RUN=true
      shift
      ;;
    *)
      MIGRATION_FILE="$1"
      shift
      ;;
  esac
done

# Determine database connection
if [ -n "$LOCAL_DATABASE_URL" ]; then
  echo -e "${YELLOW}Using LOCAL_DATABASE_URL${NC}"
  export PGPASSWORD=$(echo $LOCAL_DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_HOST=$(echo $LOCAL_DATABASE_URL | sed -n 's/.*@\([^:\/]*\).*/\1/p')
  DB_PORT=$(echo $LOCAL_DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo $LOCAL_DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  DB_USER=$(echo $LOCAL_DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
elif [ -n "$RDS_HOSTNAME" ]; then
  echo -e "${YELLOW}Using RDS credentials${NC}"
  export PGPASSWORD="$RDS_PASSWORD"
  DB_HOST="$RDS_HOSTNAME"
  DB_PORT="${RDS_PORT:-5432}"
  DB_NAME="$RDS_DB_NAME"
  DB_USER="$RDS_USERNAME"
else
  echo -e "${RED}Error: No database credentials found${NC}"
  exit 1
fi

# Run migration
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN - showing migration without executing${NC}"
  cat "$MIGRATION_FILE"
else
  echo -e "${GREEN}Running migration: $MIGRATION_FILE${NC}"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 \
    -f "$MIGRATION_FILE" \
    2>&1 | tee "migration-$(date +%Y%m%d-%H%M%S).log"

  echo -e "${GREEN}Migration completed successfully${NC}"
fi
```

---

## Section 11: Seed Data Patterns

### Directory Structure

```
postgresql/seed/
├── 00-truncate.sql           # Clear all tables
├── 01-seed-base.sql          # Core reference data
├── 02-seed-organizations.sql # Organization data
├── 03-seed-users.sql         # User data
├── products/                 # Batched product seeds
│   ├── prod-0001-0020.sql
│   ├── prod-0021-0040.sql
│   └── prod-0041-0060.sql
└── sales/                    # Monthly sales seeds
    ├── sales-2024-01.sql
    ├── sales-2024-02.sql
    └── ...
```

### 00-truncate.sql

```sql
-- Truncate all tables in correct order (respecting foreign keys)
TRUNCATE TABLE
    function_log,
    order_items,
    orders,
    products,
    organization_members,
    users,
    organizations
CASCADE;

-- Reset sequences if needed
-- ALTER SEQUENCE function_log_id_seq RESTART WITH 1;
```

### Reset and Seed Script

```bash
#!/bin/bash
# scripts/reset-and-seed.sh

set -e

echo "Resetting database and running seeds..."

# Run truncate
psql -d $DATABASE_URL -f postgresql/seed/00-truncate.sql

# Run base seeds in order
for seed_file in postgresql/seed/0[1-9]*.sql; do
  echo "Running: $seed_file"
  psql -d $DATABASE_URL -f "$seed_file"
done

# Run batched product seeds
for seed_file in postgresql/seed/products/*.sql; do
  echo "Running: $seed_file"
  psql -d $DATABASE_URL -f "$seed_file"
done

# Run sales seeds
for seed_file in postgresql/seed/sales/*.sql; do
  echo "Running: $seed_file"
  psql -d $DATABASE_URL -f "$seed_file"
done

echo "Seed complete!"
```

---

## Section 12: Agentic PRD & Task Planning Pattern

### Directory Structure

```
agentic/prd/
├── proposed/           # Ideas that haven't been approved
│   └── notes.md       # Running list of feature ideas
├── working/           # Active PRDs and task lists
│   ├── 001-prd-user-authentication.md
│   ├── 001-tasks-user-authentication.md
│   ├── 002-prd-product-catalog.md
│   └── 002-tasks-product-catalog.md
└── completed/         # Archived completed task lists
    └── 001-tasks-user-authentication.md
```

### PRD Format

```markdown
# PRD-001: User Authentication

## Problem Statement
Users cannot currently sign in or manage their accounts, blocking all authenticated features.

## User Stories
- As a user, I want to sign up with email so that I can create an account
- As a user, I want to sign in with email/password so that I can access my data
- As a user, I want to reset my password so that I can recover my account

## Acceptance Criteria
- [ ] Users can sign up with email and password
- [ ] Users can sign in with existing credentials
- [ ] Users can request password reset via email
- [ ] Invalid credentials show appropriate error messages
- [ ] Session persists across page refreshes

## Technical Approach
- Use Clerk for authentication
- Store user data in PostgreSQL via `create_user` function
- Sync Clerk webhooks to keep user data current

## Out of Scope
- Social login (OAuth)
- Two-factor authentication
- Enterprise SSO
```

### Task List Format

```markdown
# Tasks: User Authentication (PRD-001)

## Phase 1: Clerk Setup
- [x] Task 1.1: Install Clerk SDK and configure environment variables
- [x] Task 1.2: Create Clerk application and get API keys
- [x] Task 1.3: Configure middleware.ts for protected routes

## Phase 2: Database Schema
- [x] Task 2.1: Create users table migration
- [x] Task 2.2: Create user PostgreSQL functions (create, get, update, delete)
- [x] Task 2.3: Create TypeScript wrapper for user functions

## Phase 3: Auth Pages
- [ ] Task 3.1: Create sign-in page at /sign-in
- [ ] Task 3.2: Create sign-up page at /sign-up
- [ ] Task 3.3: Create password reset flow

## Phase 4: Webhook Sync
- [ ] Task 4.1: Create Clerk webhook endpoint
- [ ] Task 4.2: Handle user.created webhook
- [ ] Task 4.3: Handle user.updated webhook
- [ ] Task 4.4: Handle user.deleted webhook

## Commit History
- Phase 1: "feat(auth): configure Clerk authentication"
- Phase 2: "feat(db): add user schema and functions"
```

### Commit Convention

Each phase gets its own commit with a detailed message:

```bash
git commit -m "$(cat <<'EOF'
feat(auth): configure Clerk authentication

Phase 1 of User Authentication (PRD-001):
- Installed @clerk/nextjs
- Configured middleware for protected routes
- Added environment variables to .env.example
- Created (auth) route group for sign-in/sign-up

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Section 13: Mockup Pattern

### Directory Structure

```
mockups/
├── README.md           # Index of all mockups
├── dashboard.html      # Main dashboard view
├── products.html       # Product listing
├── product-detail.html # Single product view
├── settings.html       # Settings page
└── login.html          # Login page
```

### README.md Template

```markdown
# Mockups

Static HTML prototypes for design alignment before implementation.

## Views

| Mockup | Description | Status |
|--------|-------------|--------|
| dashboard.html | Main dashboard with KPIs and recent activity | Ready |
| products.html | Product listing with filters and search | Ready |
| product-detail.html | Single product view with edit form | In Progress |
| settings.html | User and organization settings | Not Started |
| login.html | Authentication pages | Ready |

## How to Use

1. Open any `.html` file directly in a browser
2. No build step required - all CSS/JS is inline
3. Use for stakeholder review and design validation
```

### Mockup Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Page Name] - [Project Name]</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Custom styles if needed */
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- Navigation -->
  <nav class="bg-white border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <span class="text-xl font-bold">[Project Name]</span>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-gray-600">user@example.com</span>
          <button class="text-gray-400 hover:text-gray-600">Sign Out</button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">[Page Title]</h1>

    <!-- Page content here -->

  </main>

  <script>
    // Interactive behavior if needed
  </script>
</body>
</html>
```

---

## Section 14: Claude Skills Pattern (.claude/skills/)

### Directory Structure

```
.claude/skills/
├── db-migration/
│   └── SKILL.md
├── sql-migrate/
│   ├── SKILL.md
│   └── scripts/
│       └── migrate.sh
├── checkpoint/
│   └── SKILL.md
├── prd/
│   └── SKILL.md
├── prd-to-tasks/
│   └── SKILL.md
├── playwright-tests/
│   └── SKILL.md
├── pg-troubleshoot/
│   └── SKILL.md
├── data-ui/
│   └── SKILL.md
├── local-db/
│   └── SKILL.md
└── working-task-list/
    └── SKILL.md
```

### Skill Template

```markdown
# [Skill Name]

## Mission
[One sentence describing what this skill does]

## When to Use
- [Trigger condition 1]
- [Trigger condition 2]

## Workflow

### Phase 1: [Phase Name]
1. [Step 1]
2. [Step 2]

### Phase 2: [Phase Name]
1. [Step 1]
2. [Step 2]

## Output Format
[Describe expected output]

## Examples

### Example 1: [Scenario]
Input: [example input]
Output: [example output]
```

---

## Section 15: Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| PG functions | snake_case | `create_organization` |
| PG params | p_ prefix | `p_user_id` |
| PG locals | l_ prefix | `l_result` |
| PG IDs | prefix_ + uuid | `org_abc123...` |
| TS exports | camelCase | `createOrganization()` |
| TS types | PascalCase | `Organization` |
| TS files | kebab-case | `fiscal-calendar.ts` |
| SQL files | domain.sql | `organization.sql` |
| Migrations | numbered | `0001_description.sql` |
| Seeds | numbered | `00-truncate.sql` |
| API routes | Next.js convention | `src/app/api/[domain]/route.ts` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL` |
| CSS classes | Tailwind convention | `bg-blue-500 text-white` |
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | use prefix | `useProducts.ts` |
| Context | PascalCase + Context | `AuthContext.tsx` |

### ID Prefixes by Entity

| Entity | Prefix | Example |
|--------|--------|---------|
| Organization | org_ | `org_a1b2c3d4...` |
| User | usr_ | `usr_a1b2c3d4...` |
| Product | prod_ | `prod_a1b2c3d4...` |
| Order | ord_ | `ord_a1b2c3d4...` |
| Invoice | inv_ | `inv_a1b2c3d4...` |
| Payment | pay_ | `pay_a1b2c3d4...` |
| Subscription | sub_ | `sub_a1b2c3d4...` |

---

## Section 16: Anti-Patterns (NEVER DO)

### Database Anti-Patterns

- **NEVER** use Prisma, Drizzle, TypeORM, Sequelize, or any ORM
- **NEVER** let the application user have direct table SELECT/INSERT/UPDATE/DELETE
- **NEVER** skip `function_log` audit logging in PostgreSQL functions
- **NEVER** return raw SQL results without the `{success, data, error}` JSONB wrapper
- **NEVER** use hard deletes (always soft delete with `is_deleted` + `deleted_at`)
- **NEVER** skip `SECURITY DEFINER` on PostgreSQL functions
- **NEVER** put database logic in TypeScript (keep it in PostgreSQL functions)
- **NEVER** skip the `p_user_id` parameter (every operation needs audit trail)

### API Anti-Patterns

- **NEVER** skip Zod validation on POST/PATCH request bodies
- **NEVER** return stack traces or internal errors to clients
- **NEVER** expose database IDs without the entity prefix

### Security Anti-Patterns

- **NEVER** hardcode secrets (use `.env` / environment variables)
- **NEVER** commit `.env` files
- **NEVER** log sensitive data (passwords, tokens, PII)
- **NEVER** disable CORS in production
- **NEVER** trust client-side data without server validation

### Code Anti-Patterns

- **NEVER** commit `__pycache__` or `.pyc` files
- **NEVER** commit `node_modules`
- **NEVER** use `any` type in TypeScript (use `unknown` and narrow)
- **NEVER** ignore TypeScript errors with `@ts-ignore`
- **NEVER** mix async patterns (callbacks + promises)

### Architecture Anti-Patterns

- **NEVER** call database directly from React components
- **NEVER** store session data in localStorage (use cookies)
- **NEVER** implement auth from scratch (use Clerk)
- **NEVER** implement payments from scratch (use Stripe)

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    LICENZR BUILD STANDARD                       │
├─────────────────────────────────────────────────────────────────┤
│  Architecture Flow:                                             │
│  API Route → TS Wrapper → callFunction<T>() → PG Function       │
├─────────────────────────────────────────────────────────────────┤
│  Stack: Next.js | pg | Clerk | Stripe | Zod | Radix | Tailwind │
├─────────────────────────────────────────────────────────────────┤
│  DB Result Format: { success: boolean, data?: T, error?: string }│
├─────────────────────────────────────────────────────────────────┤
│  PG Function Pattern:                                           │
│  - SECURITY DEFINER                                             │
│  - p_ params, l_ locals                                         │
│  - prefix_ + gen_random_uuid() IDs                              │
│  - function_log on every call                                   │
│  - Soft delete only (is_deleted + deleted_at)                   │
├─────────────────────────────────────────────────────────────────┤
│  File Locations:                                                │
│  - postgresql/functions/[domain].sql                            │
│  - src/lib/db.ts (pool + callFunction)                          │
│  - src/lib/db/[domain].ts (wrappers)                            │
│  - src/types/db.ts (types)                                      │
│  - src/app/api/[domain]/route.ts                                │
├─────────────────────────────────────────────────────────────────┤
│  NEVER: ORM | Direct table access | Hard delete | Skip logs     │
└─────────────────────────────────────────────────────────────────┘
```
