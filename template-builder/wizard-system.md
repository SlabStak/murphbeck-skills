# Interactive Wizard System

Implementation patterns for the template builder interactive wizard experience.

## Wizard Architecture

The wizard system uses a multi-step conversation flow to gather requirements and generate appropriate scaffolds.

### Wizard State Machine

```typescript
// types/wizard.ts
type WizardStep =
  | 'project_type'
  | 'framework'
  | 'features'
  | 'claude_config'
  | 'database'
  | 'deployment'
  | 'confirm'
  | 'generate'

type ProjectType = 'web' | 'mobile' | 'api' | 'monorepo' | 'extension' | 'cli'

type Framework = {
  web: 'nextjs' | 'remix' | 'astro' | 'vite-react'
  mobile: 'expo' | 'react-native-cli'
  api: 'fastify' | 'express' | 'hono' | 'fastapi' | 'gin'
  monorepo: 'turborepo' | 'nx' | 'lerna'
  extension: 'chrome' | 'firefox' | 'vscode'
  cli: 'commander' | 'oclif' | 'cliff'
}

type Feature =
  | 'auth'
  | 'database'
  | 'payments'
  | 'realtime'
  | 'ai'
  | 'storage'
  | 'email'
  | 'analytics'
  | 'testing'
  | 'ci-cd'

type WizardState = {
  step: WizardStep
  projectName: string
  projectType: ProjectType | null
  framework: string | null
  features: Feature[]
  claudeConfig: {
    skills: boolean
    agents: boolean
    hooks: boolean
    mcp: boolean
  }
  database: 'postgres' | 'mysql' | 'sqlite' | 'mongodb' | null
  deployment: 'vercel' | 'railway' | 'fly' | 'docker' | null
}
```

## Step 1: Project Type Selection

```markdown
## What type of project are you building?

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. 🌐 Web Application                                      │
│     Full-stack web app with frontend and backend            │
│                                                             │
│  2. 📱 Mobile Application                                   │
│     Native mobile app for iOS and Android                   │
│                                                             │
│  3. 🔌 API Backend                                          │
│     REST or GraphQL API service                             │
│                                                             │
│  4. 📦 Monorepo                                             │
│     Multiple apps and packages in one repository            │
│                                                             │
│  5. 🧩 Browser Extension                                    │
│     Chrome, Firefox, or Edge extension                      │
│                                                             │
│  6. ⌨️  CLI Tool                                             │
│     Command-line application                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Enter number (1-6) or type to search:
```

### Implementation

```typescript
async function selectProjectType(): Promise<ProjectType> {
  const options = [
    { value: 'web', label: 'Web Application', icon: '🌐' },
    { value: 'mobile', label: 'Mobile Application', icon: '📱' },
    { value: 'api', label: 'API Backend', icon: '🔌' },
    { value: 'monorepo', label: 'Monorepo', icon: '📦' },
    { value: 'extension', label: 'Browser Extension', icon: '🧩' },
    { value: 'cli', label: 'CLI Tool', icon: '⌨️' },
  ]

  // Present options to user via Claude's AskUserQuestion tool
  // or collect via conversation
  return selectedType
}
```

## Step 2: Framework Selection

Based on project type, show relevant frameworks:

### Web Frameworks

```markdown
## Choose your web framework:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. ▲ Next.js (Recommended)                                 │
│     React framework with App Router, SSR, and API routes    │
│                                                             │
│  2. 💿 Remix                                                │
│     Full-stack React framework with nested routing          │
│                                                             │
│  3. 🚀 Astro                                                │
│     Content-focused with islands architecture               │
│                                                             │
│  4. ⚡ Vite + React                                         │
│     Lightweight SPA with fast development                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### API Frameworks

```markdown
## Choose your API framework:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. ⚡ Fastify (Recommended)                                │
│     High-performance Node.js framework                      │
│                                                             │
│  2. 🚂 Express                                              │
│     Minimal and flexible Node.js framework                  │
│                                                             │
│  3. 🔥 Hono                                                 │
│     Ultrafast, works on edge runtimes                       │
│                                                             │
│  4. 🐍 FastAPI                                              │
│     Modern Python framework with auto-docs                  │
│                                                             │
│  5. 🔷 Gin                                                  │
│     High-performance Go framework                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Step 3: Feature Selection

Multi-select features to include:

```markdown
## Which features do you need? (Space to toggle, Enter to confirm)

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [x] 🔐 Authentication                                      │
│      User login, registration, sessions                     │
│                                                             │
│  [x] 🗄️  Database                                           │
│      PostgreSQL with Prisma ORM                             │
│                                                             │
│  [ ] 💳 Payments                                            │
│      Stripe integration for subscriptions                   │
│                                                             │
│  [ ] ⚡ Real-time                                           │
│      WebSocket support for live updates                     │
│                                                             │
│  [ ] 🤖 AI Integration                                      │
│      Claude/OpenAI API integration                          │
│                                                             │
│  [ ] 📁 File Storage                                        │
│      S3/R2 for file uploads                                 │
│                                                             │
│  [x] 📧 Email                                               │
│      Transactional emails with Resend                       │
│                                                             │
│  [ ] 📊 Analytics                                           │
│      PostHog for product analytics                          │
│                                                             │
│  [x] 🧪 Testing                                             │
│      Vitest + Playwright setup                              │
│                                                             │
│  [x] 🚀 CI/CD                                               │
│      GitHub Actions workflow                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Selected: Authentication, Database, Email, Testing, CI/CD
```

### Feature Dependencies

```typescript
const featureDependencies: Record<Feature, Feature[]> = {
  auth: ['database'],
  payments: ['auth', 'database'],
  realtime: [],
  ai: [],
  storage: [],
  email: [],
  analytics: [],
  testing: [],
  'ci-cd': [],
  database: [],
}

function resolveFeatures(selected: Feature[]): Feature[] {
  const resolved = new Set<Feature>()

  function addWithDeps(feature: Feature) {
    if (resolved.has(feature)) return
    for (const dep of featureDependencies[feature]) {
      addWithDeps(dep)
    }
    resolved.add(feature)
  }

  for (const feature of selected) {
    addWithDeps(feature)
  }

  return Array.from(resolved)
}
```

## Step 4: Claude Code Configuration

```markdown
## Configure Claude Code automation:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [x] 📄 CLAUDE.md                                           │
│      Project workflow and coding guidelines                 │
│                                                             │
│  [x] 🎯 Skills                                              │
│      Custom capabilities (.claude/skills/)                  │
│                                                             │
│  [x] 🤖 Agents                                              │
│      Specialized agents (.claude/agents/)                   │
│      - build-validator                                      │
│      - code-simplifier                                      │
│                                                             │
│  [x] 🪝 Hooks                                               │
│      Automated actions on tool use                          │
│      - Auto-format on Write/Edit                            │
│      - Lint check on commit                                 │
│                                                             │
│  [ ] 🔌 MCP Servers                                         │
│      External service connections                           │
│      - GitHub                                               │
│      - PostgreSQL                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Step 5: Database Selection

```markdown
## Choose your database:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. 🐘 PostgreSQL (Recommended)                             │
│     Full-featured relational database                       │
│     Best for: Most applications                             │
│                                                             │
│  2. 🐬 MySQL                                                │
│     Popular relational database                             │
│     Best for: WordPress, legacy systems                     │
│                                                             │
│  3. 🪶 SQLite                                               │
│     Lightweight file-based database                         │
│     Best for: Prototypes, embedded apps                     │
│                                                             │
│  4. 🍃 MongoDB                                              │
│     Document-oriented database                              │
│     Best for: Flexible schemas, JSON data                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Step 6: Deployment Target

```markdown
## Where will you deploy?

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. ▲ Vercel (Recommended for Next.js)                      │
│     Zero-config deployments, edge functions                 │
│                                                             │
│  2. 🚂 Railway                                              │
│     Simple infrastructure, databases included               │
│                                                             │
│  3. 🎈 Fly.io                                               │
│     Global deployment, great for containers                 │
│                                                             │
│  4. 🐳 Docker (Self-hosted)                                 │
│     Full control, any infrastructure                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Step 7: Confirmation

```markdown
## Review your project configuration:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  📦 Project: my-saas-app                                    │
│                                                             │
│  Type:       Web Application                                │
│  Framework:  Next.js 14 (App Router)                        │
│  Database:   PostgreSQL + Prisma                            │
│  Deploy:     Vercel                                         │
│                                                             │
│  Features:                                                  │
│  ✓ Authentication (Clerk)                                   │
│  ✓ Database (PostgreSQL + Prisma)                           │
│  ✓ Email (Resend)                                           │
│  ✓ Testing (Vitest + Playwright)                            │
│  ✓ CI/CD (GitHub Actions)                                   │
│                                                             │
│  Claude Code:                                               │
│  ✓ CLAUDE.md workflow file                                  │
│  ✓ build-validator agent                                    │
│  ✓ code-simplifier agent                                    │
│  ✓ PostToolUse hooks (auto-format)                          │
│                                                             │
│  Files to generate: 42                                      │
│  Estimated size: ~150KB                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Proceed with generation? [Y/n]
```

## Step 8: Generation

```markdown
## Generating project...

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [████████████████████████████████████████] 100%            │
│                                                             │
│  ✓ Created package.json                                     │
│  ✓ Created tsconfig.json                                    │
│  ✓ Created next.config.js                                   │
│  ✓ Created CLAUDE.md                                        │
│  ✓ Created .claude/settings.json                            │
│  ✓ Created .claude/agents/build-validator.md                │
│  ✓ Created .claude/agents/code-simplifier.md                │
│  ✓ Created prisma/schema.prisma                             │
│  ✓ Created src/app/layout.tsx                               │
│  ✓ Created src/app/page.tsx                                 │
│  ... and 32 more files                                      │
│                                                             │
│  🎉 Project generated successfully!                         │
│                                                             │
│  Next steps:                                                │
│  1. cd my-saas-app                                          │
│  2. bun install                                             │
│  3. cp .env.example .env.local                              │
│  4. bun run dev                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Wizard Implementation

### Claude Conversation Flow

When the wizard is invoked, Claude should:

1. **Start with project type question**
   ```
   I'll help you create a new project with Claude Code support.

   What type of project are you building?
   1. Web Application
   2. Mobile Application
   3. API Backend
   4. Monorepo
   5. Browser Extension
   6. CLI Tool
   ```

2. **Follow up based on selection**
   ```
   Great choice! For a web application, which framework would you like to use?
   1. Next.js (Recommended)
   2. Remix
   3. Astro
   4. Vite + React
   ```

3. **Collect features**
   ```
   Which features do you need? (You can select multiple)
   - Authentication
   - Database
   - Payments
   - Real-time
   - AI Integration
   - Testing
   - CI/CD
   ```

4. **Generate based on selections**
   After collecting all information, generate the appropriate scaffold.

### Using AskUserQuestion Tool

```typescript
// Example wizard step implementation
const projectTypeQuestion = {
  questions: [
    {
      question: "What type of project are you building?",
      header: "Project Type",
      options: [
        { label: "Web Application", description: "Full-stack web app with frontend and backend" },
        { label: "Mobile Application", description: "Native mobile app for iOS and Android" },
        { label: "API Backend", description: "REST or GraphQL API service" },
        { label: "Monorepo", description: "Multiple apps and packages in one repository" },
      ],
      multiSelect: false,
    },
  ],
}
```

### Generation Logic

```typescript
async function generateProject(state: WizardState): Promise<void> {
  const scaffold = selectScaffold(state.projectType, state.framework)
  const features = resolveFeatures(state.features)

  // Generate base files
  await generateFromScaffold(scaffold, state.projectName)

  // Add feature-specific files
  for (const feature of features) {
    await addFeatureFiles(feature, state)
  }

  // Add Claude Code configuration
  if (state.claudeConfig.skills) {
    await addSkillsDirectory(state)
  }
  if (state.claudeConfig.agents) {
    await addAgentFiles(state)
  }
  if (state.claudeConfig.hooks) {
    await addHooksConfig(state)
  }
  if (state.claudeConfig.mcp) {
    await addMcpConfig(state)
  }

  // Generate CLAUDE.md
  await generateClaudeMd(state)
}
```
