# Template Builder Skill

Generate Claude Code project scaffolds using patterns from Anthropic's internal development workflow.

## What's Included

```
template-builder/
├── SKILL.md                    # Main skill file
├── README.md                   # This file
├── quickstart.md               # 5-minute setup guide
├── skill-templates.md          # SKILL.md patterns
├── agent-templates.md          # Agent definitions
├── hook-templates.md           # PostToolUse/PreToolUse hooks
├── claude-md-templates.md      # CLAUDE.md workflows
├── mcp-templates.md            # MCP server configs
└── scaffolds/
    └── nextjs-saas.md          # Full Next.js SaaS scaffold
```

## Quick Start

1. **Copy to your Claude skills directory**
   ```bash
   cp -r template-builder ~/.claude/skills/
   ```

2. **Invoke the skill**
   ```
   /template-builder
   ```

3. **Follow the interactive wizard** or use specific commands:
   ```
   /template-builder skill pr-reviewer "Review PRs for quality"
   /template-builder agent deploy-validator "Validate deployments"
   /template-builder scaffold nextjs-saas my-app
   ```

## Patterns Included

Based on Anthropic's internal Claude Code usage:

| Pattern | Description |
|---------|-------------|
| **Skills** | `.claude/skills/<name>/SKILL.md` with YAML frontmatter |
| **Agents** | `.claude/agents/*.md` (build-validator, code-architect, etc.) |
| **Hooks** | `PostToolUse` matchers for auto-formatting |
| **CLAUDE.md** | Project-specific workflow instructions |
| **MCP Servers** | `.mcp.json` for external integrations |

## Key Features

- **Interactive wizard** - Multi-step input collection
- **Full scaffolds** - Next.js SaaS, Expo mobile, Fastify API
- **Best practices** - TypeScript strict, no enums, bun over npm
- **CI/CD ready** - Hooks, validators, and agents for automation

## Usage Examples

### Add Claude Code to existing project

```bash
# Creates CLAUDE.md + .claude/settings.json
/template-builder minimal
```

### Create a new skill

```bash
/template-builder skill database-migrations "Manage DB migrations safely"
```

### Generate full SaaS app

```bash
/template-builder scaffold nextjs-saas my-startup
```

## Source

Templates derived from:
- Anthropic's claude-cli-internal repository patterns
- Claude Code development workflow
- Best practices from Claude Agent SDK

## Version

1.0.0 - Initial release

---

Built for the Murphbeck AI Template Builder System.
