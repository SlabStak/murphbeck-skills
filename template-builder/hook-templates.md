# Hook Templates

Hooks allow automatic actions before or after Claude uses tools. Configure in `.claude/settings.json`.

## Hook Types

| Type | When | Use Case |
|------|------|----------|
| `PostToolUse` | After tool executes | Format code, run linters, validate output |
| `PreToolUse` | Before tool executes | Validate commands, block dangerous operations |

## Configuration Location

```
project-root/
└── .claude/
    └── settings.json    # Contains hooks configuration
```

## PostToolUse Hooks

### Auto-Format on File Changes (Recommended)

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
  ]
}
```

**Why `|| true`?** Prevents hook failure from blocking Claude's workflow. Format errors are non-critical.

### Auto-Lint TypeScript Files

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "bun run lint:file -- \"$FILE\" || true"
        }
      ]
    }
  ]
}
```

### Run Tests After Code Changes

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "bun run test:file -- \"$FILE\" 2>&1 | head -50"
        }
      ]
    }
  ]
}
```

### Typecheck After TypeScript Changes

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "filePattern": "*.ts|*.tsx",
      "hooks": [
        {
          "type": "command",
          "command": "bun run typecheck 2>&1 | head -20 || true"
        }
      ]
    }
  ]
}
```

### Generate Types After Schema Changes

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "filePattern": "prisma/schema.prisma",
      "hooks": [
        {
          "type": "command",
          "command": "bunx prisma generate"
        }
      ]
    }
  ]
}
```

### Restart Dev Server After Config Changes

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "filePattern": "*.config.*|.env*",
      "hooks": [
        {
          "type": "command",
          "command": "pkill -f 'next dev' && bun run dev &"
        }
      ]
    }
  ]
}
```

## PreToolUse Hooks

### Block Dangerous Bash Commands

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "validate",
          "pattern": "^rm -rf /|^sudo rm|^:(){ :|:& };:",
          "action": "block",
          "message": "Dangerous command blocked for safety"
        }
      ]
    }
  ]
}
```

### Require Confirmation for Git Push

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "validate",
          "pattern": "git push.*--force|git push -f",
          "action": "confirm",
          "message": "Force push detected. Are you sure?"
        }
      ]
    }
  ]
}
```

### Block Secret Exposure

```json
{
  "PreToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "validate",
          "pattern": "sk-[a-zA-Z0-9]{48}|AKIA[0-9A-Z]{16}",
          "action": "block",
          "message": "Potential secret detected. Use environment variables instead."
        }
      ]
    }
  ]
}
```

## Combined Configuration

### Full Development Setup

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
    },
    {
      "matcher": "Write|Edit",
      "filePattern": "*.ts|*.tsx",
      "hooks": [
        {
          "type": "command",
          "command": "bun run lint:file -- \"$FILE\" 2>&1 | head -10 || true"
        }
      ]
    },
    {
      "matcher": "Write|Edit",
      "filePattern": "prisma/schema.prisma",
      "hooks": [
        {
          "type": "command",
          "command": "bunx prisma generate && bunx prisma format"
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
          "pattern": "^rm -rf /|^sudo|--force|--hard",
          "action": "confirm",
          "message": "This command may be destructive. Proceed?"
        }
      ]
    }
  ]
}
```

### CI/Production Safety

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "validate",
          "pattern": "npm publish|bun publish|yarn publish",
          "action": "block",
          "message": "Publishing blocked. Use CI/CD pipeline."
        },
        {
          "type": "validate",
          "pattern": "git push.*main|git push.*master",
          "action": "confirm",
          "message": "Pushing to main/master. Confirm?"
        }
      ]
    },
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "validate",
          "pattern": "\\.env$|\\.env\\.local$",
          "action": "block",
          "message": "Direct .env editing blocked. Use environment variables."
        }
      ]
    }
  ]
}
```

## Hook Variables

| Variable | Description |
|----------|-------------|
| `$FILE` | Full path to the affected file |
| `$TOOL` | Name of the tool being used |
| `$CWD` | Current working directory |

## Best Practices

### Do
- Always add `|| true` to non-critical formatters/linters
- Pipe long output through `head` to limit context
- Use `filePattern` to target specific file types
- Test hooks locally before committing

### Don't
- Block all destructive commands (some are legitimate)
- Run full test suite on every edit (too slow)
- Use hooks for business logic validation
- Forget to handle hook errors gracefully

## Debugging Hooks

### Check if hooks are running

```bash
# Add debug output
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "echo 'Hook triggered for $FILE' >> /tmp/claude-hooks.log"
        }
      ]
    }
  ]
}
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Hook never runs | Wrong matcher | Check tool name spelling |
| Hook fails silently | Missing `|| true` | Add fallback |
| Hook blocks Claude | Long-running command | Add timeout or `head` |
| File not formatted | Wrong file pattern | Check glob syntax |

## Package Manager Commands

### Bun

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {"type": "command", "command": "bun run format || true"},
        {"type": "command", "command": "bun run lint:file -- \"$FILE\" || true"}
      ]
    }
  ]
}
```

### npm

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {"type": "command", "command": "npm run format || true"},
        {"type": "command", "command": "npm run lint -- --fix \"$FILE\" || true"}
      ]
    }
  ]
}
```

### pnpm

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {"type": "command", "command": "pnpm format || true"},
        {"type": "command", "command": "pnpm lint:file \"$FILE\" || true"}
      ]
    }
  ]
}
```
