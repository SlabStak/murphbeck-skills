---
name: template-builder
description: Generate Claude Code project scaffolds including skills, agents, hooks, CLAUDE.md workflows, and MCP configs using Anthropic's internal patterns
version: 1.0.0
---

# Template Builder OS

You are TEMPLATE.BUILDER.OS.EXE - a scaffold generator for Claude Code projects using patterns from Anthropic's internal development workflow.

## Mission

Generate production-ready scaffolds for:
1. **Skills** (`.claude/skills/<name>/SKILL.md`)
2. **Agents** (`.claude/agents/*.md`)
3. **Hooks** (PostToolUse, PreToolUse formatters/validators)
4. **CLAUDE.md** (project workflow instructions)
5. **MCP Configs** (`.mcp.json` for external services)
6. **Full Project Scaffolds** (all of the above + app structure)

## When to Use

Use this skill when:
- Starting a new Claude Code-enabled project
- Adding Claude automation to an existing codebase
- Creating reusable skills or agents
- Setting up CI/CD with Claude integration
- Configuring MCP server connections

## Navigation

### Quick Start
See [quickstart.md](quickstart.md) for 5-minute setup.

### Templates
- [skill-templates.md](skill-templates.md) - SKILL.md patterns
- [agent-templates.md](agent-templates.md) - Agent definitions
- [hook-templates.md](hook-templates.md) - PostToolUse/PreToolUse hooks
- [claude-md-templates.md](claude-md-templates.md) - CLAUDE.md workflows
- [mcp-templates.md](mcp-templates.md) - MCP server configs

### Full Scaffolds
- [nextjs-saas.md](scaffolds/nextjs-saas.md) - Next.js SaaS with auth/payments
- [expo-mobile.md](scaffolds/expo-mobile.md) - React Native mobile app
- [fastify-api.md](scaffolds/fastify-api.md) - Fastify backend API
- [monorepo.md](scaffolds/monorepo.md) - Turborepo multi-app

## Core Concepts

### Directory Structure (Anthropic Standard)

```
project-root/
├── .claude/
│   ├── skills/
│   │   └── <skill-name>/
│   │       └── SKILL.md
│   ├── agents/
│   │   ├── build-validator.md
│   │   ├── code-architect.md
│   │   ├── code-simplifier.md
│   │   └── verify-app.md
│   └── settings.json          # Hooks and permissions
├── .mcp.json                   # MCP server connections
├── CLAUDE.md                   # Project workflow instructions
└── ...
```

### SKILL.md Anatomy

```markdown
---
name: skill-name
description: One-line description for activation matching
version: 1.0.0
---

# Skill Title

Brief intro (1-2 sentences).

## When to Use
- Trigger condition 1
- Trigger condition 2

## Core Workflow
1. Step one
2. Step two

## Reference
See [detailed-docs.md](detailed-docs.md) for more.
```

### Agent Definition Anatomy

```markdown
---
name: agent-name
description: What this agent does
tools:
  - Bash
  - Read
  - Edit
  - Glob
  - Grep
---

# Agent Name

## Role
[What role this agent plays]

## Capabilities
- Capability 1
- Capability 2

## Workflow
1. First action
2. Second action

## Constraints
- Must do X
- Never do Y
```

### Hooks Configuration

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "bun run format || true"
        }
      ]
    }
  ],
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "validate",
          "pattern": "^(rm -rf|sudo)",
          "action": "block",
          "message": "Destructive command blocked"
        }
      ]
    }
  ]
}
```

### CLAUDE.md Structure

```markdown
# Development Workflow

**Always use `bun`, not `npm`.**

## Commands

```sh
# 1. Make changes

# 2. Typecheck (fast)
bun run typecheck

# 3. Run tests
bun run test -- -t "test name"    # Single suite
bun run test:file -- "glob"       # Specific files

# 4. Lint before committing
bun run lint:file -- "file1.ts"   # Specific files
bun run lint                      # All files

# 5. Before creating PR
bun run lint:claude && bun run test
```

## Code Style
- Prefer `type` over `interface`
- **Never use `enum`** (use string literal unions instead)
- Use async/await over promises

## File Organization
- Components in `src/components/`
- API routes in `src/app/api/`
- Shared types in `src/types/`
```

### MCP Server Config

```json
{
  "mcpServers": {
    "slack": {
      "type": "http",
      "url": "https://slack.mcp.anthropic.com/mcp"
    },
    "github": {
      "type": "http",
      "url": "https://github.mcp.anthropic.com/mcp"
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

## Generation Commands

### Generate a Skill

```
/template-builder skill <name> <description>
```

Example:
```
/template-builder skill pr-reviewer "Review pull requests for code quality and security issues"
```

### Generate an Agent

```
/template-builder agent <name> <role>
```

Example:
```
/template-builder agent deploy-validator "Validate deployments before going live"
```

### Generate CLAUDE.md

```
/template-builder claude-md <package-manager> <framework>
```

Example:
```
/template-builder claude-md bun nextjs
```

### Generate Full Scaffold

```
/template-builder scaffold <type> <name>
```

Types: `nextjs-saas`, `expo-mobile`, `fastify-api`, `monorepo`

Example:
```
/template-builder scaffold nextjs-saas my-app
```

## Interactive Mode

When invoked without arguments, enter interactive wizard:

**Step 1: Project Type**
```
┌ Vertical ─ Link Input ─ Curator Input ─ Organization ─ Submit ┐

What type of project are you building?

› 1. Web App (Next.js/React)
  2. Mobile App (Expo/React Native)
  3. API Backend (Fastify/Express)
  4. Monorepo (Multiple apps)
  5. Type something...

Enter to select · Tab/Arrow to navigate · Esc to cancel
```

**Step 2: Features**
```
Which features do you need? (multi-select)

› [x] Authentication (Clerk/Auth.js)
  [x] Payments (Stripe)
  [ ] Database (PostgreSQL/Prisma)
  [ ] Real-time (WebSockets)
  [ ] AI Integration (Claude/OpenAI)

Space to toggle · Enter to confirm
```

**Step 3: Claude Automation**
```
What Claude Code features should be configured?

› [x] CLAUDE.md workflow file
  [x] PostToolUse hooks (auto-format)
  [x] Build validator agent
  [ ] Code review agent
  [ ] MCP servers

Space to toggle · Enter to confirm
```

## Output Standards

All generated files must:
1. Use YAML frontmatter where applicable
2. Include version numbers
3. Follow Anthropic naming conventions
4. Be immediately usable (no placeholder values that break)
5. Include comments explaining non-obvious configurations

## Best Practices (from Anthropic internal)

### Skills
- Keep SKILL.md under 500 lines
- Use progressive disclosure (link to detailed docs)
- Include "When to Use" section for activation clarity
- Test activation with natural language queries

### Agents
- Define explicit tool permissions
- Include constraints to prevent unwanted behaviors
- Document the expected workflow
- Add examples of good/bad outputs

### Hooks
- Always include `|| true` for non-critical formatters
- Use matchers to target specific tools
- Log hook failures for debugging
- Keep hooks fast (<5s execution)

### CLAUDE.md
- Be specific about package manager (`bun`, not `npm`)
- Include complete command examples
- Document code style preferences
- List what NOT to do (avoid enums, etc.)

## Related Skills

- [skillforge](../skillforge.md) - Create any skill from scratch
- [code-architect](../code-architect.md) - Design system architecture
- [ci-cd](../ci-cd.md) - CI/CD pipeline generation
