# RuntimeEnvelope - Canonical Input Schema

## Overview
The RuntimeEnvelope is the canonical input format for the Murphbeck Meta Runtime system. It routes requests through the Meta Runtime → Router → Downstream prompts pipeline with full governance, audit logging, and cost controls.

## Schema

```json
{
  "meta": {
    "request_id": "req_2025_12_16_0001",
    "source": "claude_code|nextjs|n8n|script",
    "timestamp": "2025-12-16T00:00:00.000Z"
  },
  "mode": "STRICT|FAST|ENTERPRISE",
  "role": "founder|operator|contractor|end_user",
  "request": {
    "text": "What you want done (plain English).",
    "attachments": []
  },
  "context": {
    "org": "Murphbeck Technologies LLC",
    "product": "AdScail|MuralRide|LastStand|SlabStak|Generic",
    "project": "optional",
    "notes": "optional"
  },
  "constraints": {
    "output_format": "Prompt Pack|Build Spec|Execution Plan|SQL|JSON|Code",
    "model_preference": "claude|openai|bedrock|vertex|any",
    "max_prompts": 4,
    "budget": { "max_usd": 5.0, "max_tokens": 4000 },
    "sla": { "tier": "standard|priority|enterprise", "latency_ms": 12000 }
  },
  "environment": {
    "tools_available": [],
    "external_access": false,
    "db_logging": true,
    "providers_allowed": ["anthropic","openai","bedrock","vertex"]
  },
  "catalog": {
    "use_registry": true,
    "available_prompt_keys": [],
    "deny_prompt_keys": [],
    "force_prompt_keys": []
  },
  "memory_policy": {
    "allowed": "none|session_only|approved_store",
    "redact_sensitive": true,
    "retention_days": 0
  }
}
```

## Response Format

```json
{
  "request_id": "req_...",
  "status": "complete|needs_input|blocked|failed",
  "mode": "STRICT",
  "selected_prompt_keys": ["master-builder", "strategic-brief"],
  "prompt_pack": {
    "meta_runtime": { "system": "...", "user": "..." },
    "router": { "system": "...", "user": "..." },
    "downstream": [
      { "prompt_key": "master-builder", "system": "...", "user": "..." }
    ]
  },
  "audit": {
    "assumptions": [],
    "risk_flags": [],
    "approvals_required": []
  },
  "artifacts": [
    { "type": "sql|json|spec|code|prompt_pack", "content": "..." }
  ]
}
```

## Field Reference

### Meta
| Field | Type | Description |
|-------|------|-------------|
| request_id | string | Unique ID: `req_YYYY_MM_DD_NNNN` |
| source | enum | Origin: `claude_code`, `nextjs`, `n8n`, `script` |
| timestamp | string | ISO 8601 timestamp |

### Mode
| Value | Description |
|-------|-------------|
| STRICT | Full governance, audit logging, approval gates |
| FAST | Minimal logging, skip optional checks |
| ENTERPRISE | Full audit + multi-approval workflow |

### Role
| Value | Permissions |
|-------|-------------|
| founder | Full access, all prompts |
| operator | Standard access, operational prompts |
| contractor | Limited access, scoped to project |
| end_user | Minimal access, public prompts only |

### Constraints
| Field | Type | Default |
|-------|------|---------|
| output_format | enum | Prompt Pack |
| model_preference | enum | claude |
| max_prompts | number | 4 |
| budget.max_usd | number | 5.0 |
| budget.max_tokens | number | 4000 |
| sla.tier | enum | standard |
| sla.latency_ms | number | 12000 |

### Catalog
| Field | Description |
|-------|-------------|
| use_registry | Whether to use the prompt registry |
| available_prompt_keys | Whitelist of allowed prompts |
| deny_prompt_keys | Blacklist of blocked prompts |
| force_prompt_keys | Must use these prompts |

## TypeScript Usage

```typescript
import { createEnvelope, validateEnvelope, RuntimeEnvelope } from "@/lib/ai/envelope";
import { createRun, finalizeRun, addAuditEvent, storeArtifact } from "@/lib/ai/run-logger";

// Create envelope
const envelope = createEnvelope(
  "Build an AI-powered ad campaign generator for ecommerce",
  {
    source: "nextjs",
    mode: "STRICT",
    role: "founder",
    product: "AdScail",
    outputFormat: "Prompt Pack",
    modelPreference: "claude",
    maxTokens: 8000,
  }
);

// Validate
const { valid, errors } = validateEnvelope(envelope);
if (!valid) throw new Error(errors.join(", "));

// Log to database
const { run_id } = await createRun(db, envelope);
await addAuditEvent(db, run_id, "routing", "info", "Request routed to master-builder");

// Execute prompts...

// Finalize
await finalizeRun(db, run_id, "complete", ["master-builder"], [], [], [], []);
await storeArtifact(db, run_id, "prompt_pack", JSON.stringify(promptPack));
```

## Database Schema

```sql
CREATE TABLE prompt_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  mode TEXT NOT NULL,
  input_envelope JSONB NOT NULL,
  selected_prompt_keys TEXT[],
  selected_versions TEXT[],
  assumptions TEXT[],
  risk_flags TEXT[],
  approvals_required TEXT[],
  status TEXT NOT NULL DEFAULT 'planned',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES prompt_runs(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE output_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES prompt_runs(id),
  artifact_type TEXT NOT NULL,
  storage_ref TEXT,
  content_inline TEXT,
  content_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Files

| Path | Description |
|------|-------------|
| `src/lib/ai/envelope.ts` | TypeScript types + factory functions |
| `src/lib/ai/run-logger.ts` | Database logging utilities |
| `.claude/commands/run-governed.md` | Slash command |

## Related Prompts
- `/router` - Routes envelope to downstream prompts
- `/master-builder` - Full-stack app generation
- `/adscail-campaign-builder` - Ad campaign generation

## Tags
`runtime` `envelope` `governance` `audit` `logging` `postgres`
