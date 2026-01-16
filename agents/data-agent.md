---
name: data-agent
description: Autonomous data agent for ETL, transformation, analysis, and pipeline management
version: 1.0.0
category: agents
tags: [data, etl, transformation, analytics, pipeline, sql]
---

# Data Agent

Autonomous agent for data extraction, transformation, loading (ETL), analysis, and pipeline management.

## Agent Configuration

```json
{
  "agent_id": "data-agent-v1",
  "name": "Data Agent",
  "type": "AutonomousAgent",
  "version": "1.0.0",
  "description": "Handles data ETL, transformation, analysis, and pipeline operations",
  "capabilities": {
    "data_extraction": true,
    "data_transformation": true,
    "data_loading": true,
    "query_generation": true,
    "schema_analysis": true,
    "data_validation": true,
    "pipeline_orchestration": true,
    "anomaly_detection": true,
    "report_generation": true,
    "data_profiling": true
  },
  "integrations": [
    "postgresql", "mysql", "snowflake", "bigquery", "redshift",
    "s3", "gcs", "azure_blob",
    "airflow", "dagster", "prefect",
    "dbt", "fivetran"
  ],
  "memory": {
    "type": "persistent",
    "retention": "schema_cache",
    "context": ["table_schemas", "query_history", "transformation_rules"]
  },
  "guardrails": {
    "require_approval": ["drop_table", "truncate", "production_writes", "schema_changes"],
    "auto_approve": ["select", "explain", "staging_writes"],
    "row_limit": 1000000,
    "execution_timeout": 300
  }
}
```

## System Prompt

```
You are an expert data engineer handling ETL operations, data transformations, and analytics queries. Your mission is to efficiently move, transform, and analyze data while maintaining data quality and integrity.

CORE PRINCIPLES:
1. Data Quality First - Validate and clean data at every step
2. Idempotency - Operations should be safely repeatable
3. Auditability - Log all transformations and changes
4. Performance - Optimize for efficiency at scale
5. Security - Never expose sensitive data

SQL BEST PRACTICES:
- Use CTEs for readability over subqueries
- Add comments explaining complex logic
- Use explicit column names, avoid SELECT *
- Include proper indexing recommendations
- Consider query performance at scale
- Use parameterized queries to prevent injection

TRANSFORMATION GUIDELINES:
- Document source-to-target mappings
- Handle nulls and edge cases explicitly
- Implement proper error handling
- Use incremental loads when possible
- Maintain referential integrity

DATA QUALITY CHECKS:
- Null percentage thresholds
- Uniqueness constraints
- Referential integrity
- Value range validation
- Format/pattern matching
- Freshness checks

ETL PATTERNS:
- Extract: Full, incremental, CDC
- Transform: Staging → Transform → Target
- Load: Insert, Upsert, SCD Type 1/2

PROHIBITED:
- Running DELETE without WHERE clause
- DROP operations without explicit approval
- Exposing PII in logs or outputs
- Bypassing data quality checks
- Direct production writes without staging
```

## Tool Definitions

```typescript
const dataTools = [
  {
    name: "query_database",
    description: "Execute a SQL query against a database",
    parameters: {
      type: "object",
      properties: {
        connection: { type: "string", description: "Database connection name" },
        query: { type: "string" },
        parameters: { type: "array", items: { type: "any" } },
        timeout: { type: "number", default: 30 },
        explain: { type: "boolean", default: false }
      },
      required: ["connection", "query"]
    }
  },
  {
    name: "get_schema",
    description: "Get database schema information",
    parameters: {
      type: "object",
      properties: {
        connection: { type: "string" },
        schema: { type: "string" },
        table: { type: "string" },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["columns", "indexes", "constraints", "statistics", "sample_data"]
          }
        }
      },
      required: ["connection"]
    }
  },
  {
    name: "profile_data",
    description: "Generate data profiling statistics",
    parameters: {
      type: "object",
      properties: {
        connection: { type: "string" },
        table: { type: "string" },
        columns: { type: "array", items: { type: "string" } },
        sample_size: { type: "number", default: 10000 },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "cardinality",
              "nulls",
              "min_max",
              "distribution",
              "patterns",
              "outliers"
            ]
          }
        }
      },
      required: ["connection", "table"]
    }
  },
  {
    name: "validate_data",
    description: "Run data quality validations",
    parameters: {
      type: "object",
      properties: {
        connection: { type: "string" },
        table: { type: "string" },
        validations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: [
                  "not_null",
                  "unique",
                  "foreign_key",
                  "range",
                  "pattern",
                  "custom"
                ]
              },
              column: { type: "string" },
              params: { type: "object" }
            }
          }
        },
        fail_threshold: { type: "number", default: 0 }
      },
      required: ["connection", "table", "validations"]
    }
  },
  {
    name: "transform_data",
    description: "Apply transformations to data",
    parameters: {
      type: "object",
      properties: {
        source: {
          type: "object",
          properties: {
            connection: { type: "string" },
            table: { type: "string" },
            query: { type: "string" }
          }
        },
        transformations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              operation: {
                type: "string",
                enum: [
                  "rename",
                  "cast",
                  "derive",
                  "filter",
                  "aggregate",
                  "join",
                  "pivot",
                  "unpivot",
                  "dedupe",
                  "fill_null"
                ]
              },
              params: { type: "object" }
            }
          }
        },
        target: {
          type: "object",
          properties: {
            connection: { type: "string" },
            table: { type: "string" },
            mode: {
              type: "string",
              enum: ["insert", "upsert", "replace", "append"]
            }
          }
        }
      },
      required: ["source", "transformations"]
    }
  },
  {
    name: "create_pipeline",
    description: "Create a data pipeline definition",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        schedule: { type: "string", description: "Cron expression" },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string" },
              config: { type: "object" },
              depends_on: { type: "array", items: { type: "string" } }
            }
          }
        },
        notifications: {
          type: "object",
          properties: {
            on_success: { type: "array", items: { type: "string" } },
            on_failure: { type: "array", items: { type: "string" } }
          }
        }
      },
      required: ["name", "steps"]
    }
  },
  {
    name: "extract_from_api",
    description: "Extract data from an API",
    parameters: {
      type: "object",
      properties: {
        endpoint: { type: "string" },
        method: { type: "string", default: "GET" },
        headers: { type: "object" },
        params: { type: "object" },
        pagination: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["offset", "cursor", "page"] },
            limit: { type: "number" }
          }
        },
        flatten: { type: "boolean", default: true }
      },
      required: ["endpoint"]
    }
  },
  {
    name: "load_file",
    description: "Load data from a file",
    parameters: {
      type: "object",
      properties: {
        source: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["s3", "gcs", "azure", "local"] },
            path: { type: "string" }
          }
        },
        format: {
          type: "string",
          enum: ["csv", "json", "parquet", "avro", "excel"]
        },
        options: {
          type: "object",
          properties: {
            delimiter: { type: "string" },
            header: { type: "boolean" },
            schema: { type: "object" }
          }
        },
        target: {
          type: "object",
          properties: {
            connection: { type: "string" },
            table: { type: "string" }
          }
        }
      },
      required: ["source", "format"]
    }
  },
  {
    name: "export_data",
    description: "Export data to a file or destination",
    parameters: {
      type: "object",
      properties: {
        source: {
          type: "object",
          properties: {
            connection: { type: "string" },
            query: { type: "string" }
          }
        },
        destination: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["s3", "gcs", "azure", "local"] },
            path: { type: "string" }
          }
        },
        format: {
          type: "string",
          enum: ["csv", "json", "parquet", "excel"]
        },
        options: { type: "object" }
      },
      required: ["source", "destination", "format"]
    }
  },
  {
    name: "compare_datasets",
    description: "Compare two datasets for differences",
    parameters: {
      type: "object",
      properties: {
        source_a: {
          type: "object",
          properties: {
            connection: { type: "string" },
            table_or_query: { type: "string" }
          }
        },
        source_b: {
          type: "object",
          properties: {
            connection: { type: "string" },
            table_or_query: { type: "string" }
          }
        },
        key_columns: { type: "array", items: { type: "string" } },
        compare_columns: { type: "array", items: { type: "string" } },
        tolerance: { type: "number", description: "Numeric tolerance for comparisons" }
      },
      required: ["source_a", "source_b", "key_columns"]
    }
  },
  {
    name: "generate_sql",
    description: "Generate SQL from natural language",
    parameters: {
      type: "object",
      properties: {
        request: { type: "string" },
        connection: { type: "string" },
        tables: { type: "array", items: { type: "string" } },
        dialect: {
          type: "string",
          enum: ["postgresql", "mysql", "snowflake", "bigquery", "redshift"]
        },
        explain: { type: "boolean", default: true }
      },
      required: ["request", "connection"]
    }
  },
  {
    name: "detect_anomalies",
    description: "Detect anomalies in data",
    parameters: {
      type: "object",
      properties: {
        connection: { type: "string" },
        table: { type: "string" },
        metric_column: { type: "string" },
        time_column: { type: "string" },
        dimensions: { type: "array", items: { type: "string" } },
        method: {
          type: "string",
          enum: ["zscore", "iqr", "isolation_forest", "prophet"]
        },
        threshold: { type: "number" }
      },
      required: ["connection", "table", "metric_column"]
    }
  }
];
```

## SQL Generation

### Query Templates

```typescript
const sqlTemplates = {
  // Incremental load
  incremental_load: `
-- Incremental Load: {{source_table}} -> {{target_table}}
-- Watermark Column: {{watermark_column}}

WITH source_data AS (
    SELECT *
    FROM {{source_table}}
    WHERE {{watermark_column}} > (
        SELECT COALESCE(MAX({{watermark_column}}), '1970-01-01')
        FROM {{target_table}}
    )
),
transformed AS (
    SELECT
        {{#each columns}}
        {{this.transform}} AS {{this.target}}{{#unless @last}},{{/unless}}
        {{/each}}
    FROM source_data
)
INSERT INTO {{target_table}}
SELECT * FROM transformed;
  `,

  // SCD Type 2
  scd_type_2: `
-- SCD Type 2 Merge: {{source}} -> {{target}}
-- Key: {{key_column}}

MERGE INTO {{target}} AS t
USING (
    SELECT *, MD5({{value_columns}}) AS row_hash
    FROM {{source}}
) AS s
ON t.{{key_column}} = s.{{key_column}} AND t.is_current = true

WHEN MATCHED AND t.row_hash != s.row_hash THEN
    UPDATE SET
        is_current = false,
        end_date = CURRENT_TIMESTAMP

WHEN NOT MATCHED THEN
    INSERT ({{all_columns}}, is_current, start_date, end_date, row_hash)
    VALUES ({{all_values}}, true, CURRENT_TIMESTAMP, NULL, s.row_hash);
  `,

  // Data quality check
  data_quality: `
-- Data Quality Report: {{table}}

SELECT
    '{{table}}' AS table_name,
    COUNT(*) AS total_rows,
    {{#each columns}}
    -- {{this.name}} checks
    SUM(CASE WHEN {{this.name}} IS NULL THEN 1 ELSE 0 END) AS {{this.name}}_nulls,
    COUNT(DISTINCT {{this.name}}) AS {{this.name}}_distinct,
    {{#if this.is_numeric}}
    MIN({{this.name}}) AS {{this.name}}_min,
    MAX({{this.name}}) AS {{this.name}}_max,
    AVG({{this.name}}) AS {{this.name}}_avg,
    {{/if}}
    {{/each}}
    CURRENT_TIMESTAMP AS check_timestamp
FROM {{table}};
  `,

  // Duplicate detection
  find_duplicates: `
-- Find Duplicates: {{table}}
-- Key Columns: {{key_columns}}

WITH duplicates AS (
    SELECT
        {{key_columns}},
        COUNT(*) AS occurrence_count,
        MIN({{id_column}}) AS first_id,
        MAX({{id_column}}) AS last_id
    FROM {{table}}
    GROUP BY {{key_columns}}
    HAVING COUNT(*) > 1
)
SELECT
    d.*,
    t.*
FROM duplicates d
JOIN {{table}} t ON {{join_conditions}}
ORDER BY {{key_columns}}, t.{{id_column}};
  `,

  // Gap analysis
  gap_analysis: `
-- Gap Analysis: {{table}}
-- Time Column: {{time_column}}
-- Expected Interval: {{interval}}

WITH time_series AS (
    SELECT
        {{time_column}},
        LAG({{time_column}}) OVER (ORDER BY {{time_column}}) AS prev_time
    FROM {{table}}
)
SELECT
    prev_time AS gap_start,
    {{time_column}} AS gap_end,
    {{time_column}} - prev_time AS gap_duration
FROM time_series
WHERE {{time_column}} - prev_time > INTERVAL '{{interval}}'
ORDER BY gap_duration DESC;
  `
};
```

### Natural Language to SQL

```typescript
async function generateSQL(request: string, context: SchemaContext) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: DATA_AGENT_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Generate SQL for this request: "${request}"

Database: ${context.dialect}

Available Tables:
${context.tables.map(t => `
Table: ${t.name}
Columns:
${t.columns.map(c => `  - ${c.name} (${c.type})${c.isPrimaryKey ? ' PK' : ''}${c.isForeignKey ? ` FK -> ${c.references}` : ''}`).join('\n')}
`).join('\n')}

Sample Data:
${JSON.stringify(context.sampleData, null, 2)}

Generate:
1. The SQL query
2. Explanation of the logic
3. Any assumptions made
4. Performance considerations`
    }]
  });

  return response.content[0].text;
}
```

## Pipeline Templates

### Daily ETL Pipeline

```yaml
pipeline: daily_etl
schedule: "0 2 * * *"  # 2 AM daily
timeout: 3600  # 1 hour

steps:
  - name: extract_source_a
    type: query
    config:
      connection: source_db
      query: |
        SELECT * FROM transactions
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
          AND created_at < CURRENT_DATE
      output: staging.transactions_raw

  - name: extract_source_b
    type: api
    config:
      endpoint: https://api.example.com/orders
      params:
        date: "{{ ds }}"
      output: staging.orders_raw

  - name: validate_extracts
    type: validation
    depends_on: [extract_source_a, extract_source_b]
    config:
      checks:
        - table: staging.transactions_raw
          type: row_count
          min: 1000
        - table: staging.orders_raw
          type: not_empty

  - name: transform
    type: sql
    depends_on: [validate_extracts]
    config:
      connection: warehouse
      query: |
        INSERT INTO analytics.daily_summary
        SELECT
            DATE(t.created_at) AS date,
            COUNT(DISTINCT t.user_id) AS unique_users,
            COUNT(*) AS transaction_count,
            SUM(t.amount) AS total_amount,
            AVG(t.amount) AS avg_amount
        FROM staging.transactions_raw t
        LEFT JOIN staging.orders_raw o ON t.order_id = o.id
        GROUP BY DATE(t.created_at)

  - name: validate_output
    type: validation
    depends_on: [transform]
    config:
      checks:
        - table: analytics.daily_summary
          type: freshness
          column: date
          max_age: "1 day"

  - name: cleanup
    type: sql
    depends_on: [validate_output]
    config:
      queries:
        - TRUNCATE staging.transactions_raw
        - TRUNCATE staging.orders_raw

notifications:
  on_success:
    - slack: "#data-team"
  on_failure:
    - slack: "#data-alerts"
    - pagerduty: data-oncall
```

### CDC Pipeline

```yaml
pipeline: cdc_pipeline
schedule: "*/5 * * * *"  # Every 5 minutes
type: incremental

source:
  connection: source_db
  tables:
    - name: users
      key: id
      watermark: updated_at
    - name: orders
      key: id
      watermark: updated_at
    - name: products
      key: id
      watermark: updated_at

steps:
  - name: capture_changes
    type: cdc
    config:
      method: timestamp  # or: log_based, trigger_based
      batch_size: 10000

  - name: transform_users
    type: transform
    source: cdc.users
    transformations:
      - derive:
          full_name: "CONCAT(first_name, ' ', last_name)"
      - cast:
          created_at: timestamp

  - name: load_warehouse
    type: load
    target:
      connection: warehouse
      schema: raw
    mode: upsert

  - name: update_watermarks
    type: metadata
    action: update_watermarks
```

## Integration Examples

### PostgreSQL + Snowflake Pipeline

```typescript
import { Pool } from 'pg';
import snowflake from 'snowflake-sdk';
import Anthropic from '@anthropic-ai/sdk';

const pgPool = new Pool({ connectionString: process.env.POSTGRES_URL });
const anthropic = new Anthropic();

class DataAgent {
  async extractTransformLoad(config: ETLConfig) {
    // Extract from PostgreSQL
    const extractResult = await this.extract(config.source);

    // Transform with Claude-generated SQL
    const transformedData = await this.transform(extractResult, config.transformations);

    // Validate before loading
    const validationResult = await this.validate(transformedData, config.validations);

    if (!validationResult.passed) {
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Load to Snowflake
    await this.load(transformedData, config.target);

    return {
      rowsExtracted: extractResult.length,
      rowsLoaded: transformedData.length,
      validations: validationResult
    };
  }

  async generateTransformationSQL(request: string, schema: any) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: DATA_AGENT_SYSTEM_PROMPT,
      tools: dataTools,
      messages: [{
        role: 'user',
        content: `Generate transformation SQL for: ${request}

Schema:
${JSON.stringify(schema, null, 2)}

Generate efficient, well-documented SQL.`
      }]
    });

    return response.content[0].text;
  }

  async profileTable(connection: string, table: string) {
    const schema = await this.getSchema(connection, table);

    const profilingQueries = schema.columns.map(col => {
      const baseStats = `
        COUNT(*) AS total_rows,
        SUM(CASE WHEN ${col.name} IS NULL THEN 1 ELSE 0 END) AS null_count,
        COUNT(DISTINCT ${col.name}) AS distinct_count
      `;

      const typeStats = col.type.includes('int') || col.type.includes('numeric')
        ? `, MIN(${col.name}) AS min_val, MAX(${col.name}) AS max_val, AVG(${col.name}) AS avg_val`
        : col.type.includes('char') || col.type.includes('text')
        ? `, MIN(LENGTH(${col.name})) AS min_len, MAX(LENGTH(${col.name})) AS max_len`
        : '';

      return `SELECT '${col.name}' AS column_name, ${baseStats}${typeStats} FROM ${table}`;
    });

    const results = await Promise.all(
      profilingQueries.map(q => this.query(connection, q))
    );

    return this.formatProfilingReport(results);
  }

  async detectAnomalies(config: AnomalyConfig) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Analyze this time series data for anomalies:

Data:
${JSON.stringify(config.data, null, 2)}

Metric: ${config.metric}
Time Column: ${config.timeColumn}

Identify:
1. Outliers (using Z-score > 3)
2. Trend changes
3. Seasonal anomalies
4. Missing data gaps

Return as JSON with anomalies array and explanation.`
      }]
    });

    return JSON.parse(response.content[0].text);
  }
}
```

### Airflow DAG Generator

```typescript
async function generateAirflowDAG(pipelineConfig: PipelineConfig) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: DATA_AGENT_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Generate an Airflow DAG for this pipeline:

${JSON.stringify(pipelineConfig, null, 2)}

Include:
1. Proper task dependencies
2. Error handling with retries
3. SLA monitoring
4. Notifications
5. XCom for passing data between tasks`
    }]
  });

  return response.content[0].text;
}
```

## Data Quality Framework

```typescript
interface DataQualityCheck {
  name: string;
  type: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'uniqueness';
  table: string;
  column?: string;
  condition: string;
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
}

const dataQualityChecks: DataQualityCheck[] = [
  {
    name: 'orders_completeness',
    type: 'completeness',
    table: 'orders',
    column: 'customer_id',
    condition: 'customer_id IS NOT NULL',
    threshold: 99.9,
    severity: 'critical'
  },
  {
    name: 'orders_freshness',
    type: 'timeliness',
    table: 'orders',
    column: 'created_at',
    condition: "MAX(created_at) > NOW() - INTERVAL '1 hour'",
    threshold: 100,
    severity: 'critical'
  },
  {
    name: 'users_uniqueness',
    type: 'uniqueness',
    table: 'users',
    column: 'email',
    condition: 'COUNT(*) = COUNT(DISTINCT email)',
    threshold: 100,
    severity: 'warning'
  }
];

async function runDataQualityChecks(checks: DataQualityCheck[]) {
  const results = [];

  for (const check of checks) {
    const result = await executeCheck(check);
    results.push({
      ...check,
      passed: result.value >= check.threshold,
      actual: result.value,
      timestamp: new Date()
    });
  }

  return {
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length
    },
    results,
    critical_failures: results.filter(r => !r.passed && r.severity === 'critical')
  };
}
```

## Deployment Checklist

- [ ] Configure database connections
- [ ] Set up credentials securely (secrets manager)
- [ ] Configure query timeouts and limits
- [ ] Set up staging schemas
- [ ] Create data quality rules
- [ ] Configure pipeline orchestrator (Airflow/Dagster)
- [ ] Set up monitoring and alerting
- [ ] Configure data lineage tracking
- [ ] Set up audit logging
- [ ] Test with sample data
- [ ] Configure backup and recovery
- [ ] Document data models
