# Murphbeck AI Skill Development Guide

## Complete Reference for Creating Production-Ready Skills

---

## Table of Contents

1. [Introduction](#introduction)
2. [Skill Anatomy](#skill-anatomy)
3. [Naming Conventions](#naming-conventions)
4. [Module Structure](#module-structure)
5. [Workflow Design](#workflow-design)
6. [Output Formatting](#output-formatting)
7. [Quick Commands](#quick-commands)
8. [Best Practices](#best-practices)
9. [Testing & Validation](#testing-validation)
10. [Examples & Templates](#examples-templates)

---

## Introduction

### What is a Murphbeck Skill?

A skill is a specialized AI persona that can be invoked to handle specific types of tasks. Skills provide:

- **Domain expertise** in a specific area
- **Consistent output format** for reliable results
- **Structured workflow** for complex tasks
- **Quick commands** for common operations

### Skill File Location

```
/Volumes/LaCie/ai/skills/     # Primary skill storage
~/.claude/commands/            # Claude Code commands (symlinked)
```

### Invoking Skills

Skills are invoked using slash commands:

```
/skill-name [arguments]

Examples:
/debug fix authentication
/pdf create catalog for products
/deploy-vercel production
```

---

## Skill Anatomy

Every skill follows this structure:

```markdown
# SKILL.NAME.EXE - [Role Description]

You are SKILL.NAME.EXE — [detailed persona description].

MISSION
[3-7 word mission statement]

---

## CAPABILITIES

### Module1.MOD
- Capability 1
- Capability 2
- Capability 3
- Capability 4
- Capability 5

### Module2.MOD
- Capability 1
- Capability 2
- Capability 3
- Capability 4
- Capability 5

### Module3.MOD
[...]

### Module4.MOD
[...]

---

## WORKFLOW

### Phase 1: [PHASE_NAME]
1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5

### Phase 2: [PHASE_NAME]
[...]

### Phase 3: [PHASE_NAME]
[...]

### Phase 4: [PHASE_NAME]
[...]

---

## [REFERENCE TABLES]

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value    | Value    | Value    |

---

## OUTPUT FORMAT

```
[ASCII BOX OUTPUT TEMPLATE]
═══════════════════════════════════════
[Title section with box-drawing chars]
═══════════════════════════════════════

[Section with code examples]
```

---

## QUICK COMMANDS

- `/skill-name action1` - Description
- `/skill-name action2` - Description
- `/skill-name action3` - Description
- `/skill-name action4` - Description
- `/skill-name action5` - Description

$ARGUMENTS
```

---

## Naming Conventions

### Skill File Names

```
kebab-case.md

Examples:
- google-analytics.md
- react-native.md
- kubernetes-architect.md
```

### Skill Header Names

```
UPPER.CASE.EXE

Examples:
- GOOGLE.ANALYTICS.EXE
- REACT.NATIVE.EXE
- KUBERNETES.ARCHITECT.EXE
```

### Role Descriptions

Keep to 3-6 words describing the primary function:

```
Good:
- Error Monitoring Specialist
- Mobile Development Specialist
- Container Orchestration Architect

Bad:
- The Best Error Monitoring Tool Ever Created
- A Specialist for Mobile Development
```

### Module Names

```
PascalCase.MOD

Examples:
- SDKInstaller.MOD
- ErrorEngineer.MOD
- DeploymentManager.MOD
```

---

## Module Structure

### Standard Module Count

Every skill should have **exactly 4 modules**:

```markdown
### Module1.MOD  ← Primary capability
### Module2.MOD  ← Secondary capability
### Module3.MOD  ← Supporting capability
### Module4.MOD  ← Output/delivery capability
```

### Module Content

Each module should list **5 capabilities**:

```markdown
### SDKInstaller.MOD
- Platform SDKs          ← What it installs
- Framework integrations ← What it integrates
- Source maps            ← What it configures
- Release tracking       ← What it tracks
- Environment config     ← What it manages
```

### Module Naming Patterns

| Pattern | Use Case | Examples |
|---------|----------|----------|
| `*Architect.MOD` | Design/planning | `APIArchitect.MOD` |
| `*Engineer.MOD` | Implementation | `AutomationEngineer.MOD` |
| `*Builder.MOD` | Creation | `ComponentBuilder.MOD` |
| `*Manager.MOD` | Management | `DeploymentManager.MOD` |
| `*Optimizer.MOD` | Optimization | `PerformanceOptimizer.MOD` |
| `*Analyzer.MOD` | Analysis | `MetricsAnalyzer.MOD` |

---

## Workflow Design

### Standard Phase Count

Every skill should have **exactly 4 phases**:

```markdown
### Phase 1: [SETUP/PLAN/DISCOVER]
### Phase 2: [IMPLEMENT/BUILD/DESIGN]
### Phase 3: [CONFIGURE/INTEGRATE/SECURE]
### Phase 4: [OPTIMIZE/DEPLOY/MONITOR]
```

### Phase Content

Each phase should have **exactly 5 steps**:

```markdown
### Phase 1: SETUP
1. Create project      ← Foundation
2. Install SDK         ← Dependencies
3. Configure DSN       ← Settings
4. Set up source maps  ← Tooling
5. Configure releases  ← Versioning
```

### Common Phase Patterns

| Phase Type | Purpose | Steps Include |
|------------|---------|---------------|
| DISCOVER | Research | Analyze, identify, map, document, define |
| PLAN | Strategy | Design, define, plan, configure, set up |
| SETUP | Foundation | Create, install, configure, set up, enable |
| BUILD | Implementation | Create, implement, add, write, develop |
| INTEGRATE | Connection | Connect, set up, link, enable, configure |
| CONFIGURE | Settings | Configure, set up, define, enable, add |
| SECURE | Security | Scope, configure, add, enable, set |
| OPTIMIZE | Improvement | Reduce, optimize, parallelize, minimize, monitor |
| DEPLOY | Release | Build, test, deploy, verify, monitor |
| MONITOR | Observation | Review, analyze, track, monitor, optimize |

---

## Output Formatting

### ASCII Box Drawing Characters

Use these characters for consistent output:

```
═  Double horizontal line (header/footer)
─  Single horizontal line (sections)
│  Vertical line (sides)
┌  Top-left corner
┐  Top-right corner
└  Bottom-left corner
┘  Bottom-right corner
├  Left T-junction
┤  Right T-junction
●  Status indicator (filled)
░  Progress bar (empty)
█  Progress bar (filled)
```

### Standard Header Template

```
[SKILL NAME] SPECIFICATION
═══════════════════════════════════════
[Key]: [Value]
[Key]: [Value]
[Key]: [Value]
═══════════════════════════════════════
```

### Standard Status Box

```
┌─────────────────────────────────────┐
│        [SKILL] STATUS               │
│                                     │
│  [Field]: [Value]                   │
│  [Field]: [Value]                   │
│                                     │
│  [List Title]:                      │
│  • Item 1                           │
│  • Item 2                           │
│  • Item 3                           │
│                                     │
│  Progress: ████████░░ [X]%          │
│  Status: [●] [State]                │
└─────────────────────────────────────┘
```

### Section Headers

```
SECTION NAME
────────────────────────────────────────
```

### Footer Status Line

```
[Noun] Status: ● [State]
```

Examples:
```
Analytics Status: ● Tracking Configured
Pipeline Status: ● GitHub Actions Ready
Jira Status: ● Integration Active
```

---

## Quick Commands

### Command Format

```markdown
- `/skill-name action` - Description
```

### Standard Command Count

Every skill should have **exactly 5 quick commands**.

### Command Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| `setup` | Initial configuration | `/skill setup [platform]` |
| `create` | Create new item | `/skill create [type]` |
| `configure` | Modify settings | `/skill configure [setting]` |
| `deploy` | Release/publish | `/skill deploy [env]` |
| `debug` | Troubleshooting | `/skill debug` |

### Good Command Examples

```markdown
- `/sentry-integration setup [platform]` - Install and configure Sentry
- `/sentry-integration alerts` - Configure alert rules
- `/sentry-integration boundary` - Create error boundary
- `/sentry-integration performance` - Set up performance monitoring
- `/sentry-integration replay` - Configure session replay
```

---

## Best Practices

### DO

1. **Keep skills focused** - One domain per skill
2. **Use consistent naming** - Follow `.EXE` and `.MOD` patterns
3. **Include working code** - All examples should be copy-paste ready
4. **Cover common scenarios** - Most users should find what they need
5. **Use markdown code blocks** - With language hints for syntax highlighting
6. **Include environment variables** - Show required configuration
7. **Add status indicator** - End with status line
8. **Use tables for reference** - Scannable information
9. **Keep descriptions concise** - Under 10 words per item

### DON'T

1. **Don't mix domains** - Keep skills single-purpose
2. **Don't use emojis in headers** - Keep professional
3. **Don't skip $ARGUMENTS** - Always include at end
4. **Don't use more than 4 modules** - Maintain consistency
5. **Don't use more than 4 phases** - Keep workflow manageable
6. **Don't write essays** - Use bullet points
7. **Don't include obsolete code** - Keep examples current
8. **Don't forget error handling** - Show production patterns
9. **Don't skip TypeScript** - Type safety matters

---

## Testing & Validation

### Skill Checklist

Before publishing a skill, verify:

```
□ File name is kebab-case.md
□ Header uses UPPER.CASE.EXE format
□ Role description is 3-6 words
□ MISSION is 3-7 words
□ Has exactly 4 MOD modules
□ Each module has exactly 5 capabilities
□ Has exactly 4 WORKFLOW phases
□ Each phase has exactly 5 steps
□ Has reference tables where appropriate
□ OUTPUT FORMAT uses ASCII box drawing
□ Has exactly 5 QUICK COMMANDS
□ Ends with $ARGUMENTS
□ Code examples are valid and tested
□ Environment variables are documented
□ Status line is present at end
```

### Testing Commands

```bash
# Validate skill syntax
cat /Volumes/LaCie/ai/skills/skill-name.md | head -50

# Count modules
grep -c "### .*\.MOD" /Volumes/LaCie/ai/skills/skill-name.md

# Count phases
grep -c "### Phase" /Volumes/LaCie/ai/skills/skill-name.md

# Count quick commands
grep -c "^- \`/skill" /Volumes/LaCie/ai/skills/skill-name.md

# Verify $ARGUMENTS
tail -5 /Volumes/LaCie/ai/skills/skill-name.md
```

---

## Examples & Templates

### Minimal Skill Template

```markdown
# SKILL.NAME.EXE - Role Description

You are SKILL.NAME.EXE — detailed description of the AI persona and what it does.

MISSION
Three to seven word mission.

---

## CAPABILITIES

### Primary.MOD
- Capability 1
- Capability 2
- Capability 3
- Capability 4
- Capability 5

### Secondary.MOD
- Capability 1
- Capability 2
- Capability 3
- Capability 4
- Capability 5

### Supporting.MOD
- Capability 1
- Capability 2
- Capability 3
- Capability 4
- Capability 5

### Output.MOD
- Capability 1
- Capability 2
- Capability 3
- Capability 4
- Capability 5

---

## WORKFLOW

### Phase 1: SETUP
1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5

### Phase 2: BUILD
1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5

### Phase 3: CONFIGURE
1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5

### Phase 4: DEPLOY
1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5

---

## OUTPUT FORMAT

```
SKILL OUTPUT
═══════════════════════════════════════
Key: Value
═══════════════════════════════════════

SECTION
────────────────────────────────────────
Content here...

Status: ● Active
```

## QUICK COMMANDS

- `/skill-name setup` - Initialize the skill
- `/skill-name create` - Create a new item
- `/skill-name configure` - Modify settings
- `/skill-name deploy` - Deploy to target
- `/skill-name help` - Show documentation

$ARGUMENTS
```

### Integration Skill Template

For skills that integrate with external services:

```markdown
# SERVICE.INTEGRATION.EXE - Service Integration Specialist

You are SERVICE.INTEGRATION.EXE — integration specialist for [Service Name].

MISSION
Connect. Sync. Automate.

---

## CAPABILITIES

### APIEngineer.MOD
- REST/GraphQL client
- Authentication
- Rate limiting
- Error handling
- Retry logic

### WebhookHandler.MOD
- Webhook setup
- Signature verification
- Event processing
- Error recovery
- Logging

### SyncManager.MOD
- Data synchronization
- Conflict resolution
- Batch operations
- Real-time updates
- State management

### AutomationBuilder.MOD
- Workflow rules
- Triggers
- Actions
- Conditions
- Notifications

---

## WORKFLOW

[Standard 4-phase workflow]

---

## API CLIENT

```typescript
// Complete API client implementation
```

## WEBHOOK HANDLER

```typescript
// Complete webhook handler implementation
```

## ENVIRONMENT VARIABLES

```bash
SERVICE_API_KEY=xxx
SERVICE_WEBHOOK_SECRET=xxx
```

## QUICK COMMANDS

[5 commands specific to the integration]

$ARGUMENTS
```

### Builder Skill Template

For skills that create/scaffold things:

```markdown
# THING.BUILDER.EXE - Thing Creation Specialist

You are THING.BUILDER.EXE — specialist for creating [things].

MISSION
Build. Configure. Ship.

---

## CAPABILITIES

### ScaffoldArchitect.MOD
- Project structure
- File generation
- Template processing
- Configuration
- Dependencies

### CodeGenerator.MOD
- Component creation
- Type definitions
- Test generation
- Documentation
- Examples

### ConfigManager.MOD
- Build configuration
- Environment setup
- Plugin integration
- Optimization
- Deployment

### QualityEngineer.MOD
- Linting
- Type checking
- Testing
- Performance
- Accessibility

---

## WORKFLOW

[Standard 4-phase workflow]

---

## PROJECT STRUCTURE

```
project/
├── src/
├── tests/
├── config/
└── package.json
```

## QUICK COMMANDS

- `/thing-builder new [name]` - Create new project
- `/thing-builder component [name]` - Add component
- `/thing-builder config` - Configure settings
- `/thing-builder build` - Build project
- `/thing-builder deploy` - Deploy project

$ARGUMENTS
```

---

## Skill Categories

### By Domain

| Category | Skills | Pattern |
|----------|--------|---------|
| Cloud | gcp-architect, azure-architect, aws-architect | `*-architect.md` |
| Mobile | react-native, flutter-builder | `*-builder.md` |
| Web | remix-builder, astro-builder, nextjs-builder | `*-builder.md` |
| DevOps | kubernetes-architect, github-actions | `*-architect.md` |
| Integration | jira-integration, linear-integration | `*-integration.md` |
| Analytics | google-analytics, sentry-integration | `*-analytics.md` |
| AI/ML | langchain-builder, lora-trainer | `*-builder.md` |

### By Function

| Function | Example Skills |
|----------|---------------|
| Building | `*-builder.md` |
| Architecting | `*-architect.md` |
| Integrating | `*-integration.md` |
| Analyzing | `*-analytics.md` |
| Deploying | `deploy-*.md` |
| Testing | `test-*.md` |
| Debugging | `debug.md` |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01 | Initial guide |

---

*This guide is the authoritative reference for Murphbeck AI skill development.*
