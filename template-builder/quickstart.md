# Quick Start Guide

Get a Claude Code-enabled project running in 5 minutes.

## Option 1: Minimal Setup (2 minutes)

Add Claude Code support to any existing project:

### Step 1: Create CLAUDE.md

```bash
cat > CLAUDE.md << 'EOF'
# Development Workflow

## Commands
- `bun run dev` - Start development
- `bun run build` - Build for production
- `bun run test` - Run tests
- `bun run lint` - Lint code

## Code Style
- TypeScript strict mode
- Prefer `type` over `interface`
- Never use `enum` (use string literal unions)
EOF
```

### Step 2: Create Hooks (Optional)

```bash
mkdir -p .claude
cat > .claude/settings.json << 'EOF'
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
  ]
}
EOF
```

Done! Claude Code will now follow your project conventions.

---

## Option 2: Full Setup (5 minutes)

Complete Claude Code configuration with agents and MCP servers.

### Step 1: Create Directory Structure

```bash
mkdir -p .claude/agents .claude/skills
```

### Step 2: Create CLAUDE.md

```bash
cat > CLAUDE.md << 'EOF'
# Development Workflow

**Always use `bun`, not `npm`.**

## Commands

```sh
# Development
bun run dev              # Start dev server

# Quality
bun run typecheck        # TypeScript check
bun run lint             # Lint all files
bun run test             # Run tests

# Before PR
bun run lint && bun run typecheck && bun run test
```

## Code Style
- Prefer `type` over `interface`
- **Never use `enum`** (use string literal unions)
- Use async/await over promises
- Keep functions under 50 lines

## File Organization
- Components: `src/components/`
- API: `src/app/api/`
- Types: `src/types/`
- Utils: `src/lib/`
EOF
```

### Step 3: Create Hooks

```bash
cat > .claude/settings.json << 'EOF'
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "bun run format || true"
        },
        {
          "type": "command",
          "command": "bun run lint:file -- \"$FILE\" 2>&1 | head -10 || true"
        }
      ]
    }
  ]
}
EOF
```

### Step 4: Create Build Validator Agent

```bash
cat > .claude/agents/build-validator.md << 'EOF'
---
name: build-validator
description: Validate builds pass before deployment
tools:
  - Bash
  - Read
---

# Build Validator

## Workflow
1. Run `bun run typecheck`
2. Run `bun run lint`
3. Run `bun run test`
4. Run `bun run build`

## Success Criteria
All commands exit with code 0.
EOF
```

### Step 5: Create MCP Config (Optional)

```bash
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://github.mcp.anthropic.com/mcp"
    }
  }
}
EOF
```

### Step 6: Update .gitignore

```bash
echo ".claude/settings.local.json" >> .gitignore
echo ".env*.local" >> .gitignore
```

Done! Your project is now fully configured for Claude Code.

---

## Option 3: Interactive Wizard

Run the template builder interactively:

```
/template-builder
```

Follow the prompts to configure:
1. Project type (web, mobile, API, monorepo)
2. Features (auth, payments, database)
3. Claude automation (hooks, agents, MCP)

---

## Verification

Test your setup:

1. **Check CLAUDE.md is recognized**
   - Open Claude Code in your project
   - Ask "What commands should I use to run tests?"
   - Claude should respond with your documented commands

2. **Check hooks work**
   - Make a code change
   - Hooks should auto-format on save

3. **Check agents work**
   - Run `/build-validator` (or reference in prompt)
   - Agent should validate your build

---

## Common Issues

### Hook not running
- Check `.claude/settings.json` syntax
- Verify tool matcher is correct (`Write|Edit`)
- Test command works manually

### CLAUDE.md not recognized
- File must be at project root
- File must be named exactly `CLAUDE.md`
- Restart Claude Code session

### MCP server not connecting
- Check environment variables are set
- Test server manually: `npx @modelcontextprotocol/server-postgres`
- Verify `.mcp.json` syntax

---

## Next Steps

- Read [agent-templates.md](agent-templates.md) to add more agents
- Read [hook-templates.md](hook-templates.md) for advanced automation
- Read [mcp-templates.md](mcp-templates.md) to add integrations
- Check [scaffolds/](scaffolds/) for full project templates
