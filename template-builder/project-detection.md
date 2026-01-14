# Project Detection System

Automatically detect project type, framework, and configuration from existing codebases.

## Detection Strategy

The project detection system analyzes the codebase to identify:

1. **Project Type** (web, mobile, api, monorepo, etc.)
2. **Framework** (Next.js, Expo, Fastify, etc.)
3. **Package Manager** (bun, npm, yarn, pnpm)
4. **Language** (TypeScript, JavaScript, Python, Go)
5. **Database** (PostgreSQL, MySQL, MongoDB, etc.)
6. **Existing Tooling** (ESLint, Prettier, Vitest, etc.)

## Detection Logic

### Primary Detection Files

```typescript
type DetectionResult = {
  projectType: ProjectType
  framework: string | null
  language: 'typescript' | 'javascript' | 'python' | 'go' | 'rust'
  packageManager: 'bun' | 'npm' | 'yarn' | 'pnpm' | 'uv' | 'pip'
  database: string | null
  features: string[]
  confidence: number // 0-1
}

const FILE_INDICATORS: Record<string, Partial<DetectionResult>> = {
  // Framework detection
  'next.config.js': { framework: 'nextjs', projectType: 'web' },
  'next.config.mjs': { framework: 'nextjs', projectType: 'web' },
  'next.config.ts': { framework: 'nextjs', projectType: 'web' },
  'remix.config.js': { framework: 'remix', projectType: 'web' },
  'astro.config.mjs': { framework: 'astro', projectType: 'web' },
  'vite.config.ts': { framework: 'vite', projectType: 'web' },
  'app.json': { framework: 'expo', projectType: 'mobile' },
  'expo.json': { framework: 'expo', projectType: 'mobile' },
  'react-native.config.js': { framework: 'react-native', projectType: 'mobile' },

  // Monorepo detection
  'turbo.json': { projectType: 'monorepo', framework: 'turborepo' },
  'nx.json': { projectType: 'monorepo', framework: 'nx' },
  'lerna.json': { projectType: 'monorepo', framework: 'lerna' },
  'pnpm-workspace.yaml': { projectType: 'monorepo' },

  // API frameworks
  'fastify.config.js': { framework: 'fastify', projectType: 'api' },

  // Python
  'pyproject.toml': { language: 'python' },
  'requirements.txt': { language: 'python', packageManager: 'pip' },
  'uv.lock': { language: 'python', packageManager: 'uv' },

  // Go
  'go.mod': { language: 'go', projectType: 'api' },

  // Rust
  'Cargo.toml': { language: 'rust' },

  // Package managers
  'bun.lockb': { packageManager: 'bun' },
  'yarn.lock': { packageManager: 'yarn' },
  'pnpm-lock.yaml': { packageManager: 'pnpm' },
  'package-lock.json': { packageManager: 'npm' },

  // Database
  'prisma/schema.prisma': { features: ['database'] },
  'drizzle.config.ts': { features: ['database'] },
  'knexfile.js': { features: ['database'] },

  // Language
  'tsconfig.json': { language: 'typescript' },
  'jsconfig.json': { language: 'javascript' },

  // Extension
  'manifest.json': { projectType: 'extension' },
}
```

### Content-Based Detection

```typescript
const CONTENT_PATTERNS: Array<{
  file: string
  pattern: RegExp
  result: Partial<DetectionResult>
}> = [
  // Next.js App Router
  {
    file: 'package.json',
    pattern: /"next":\s*"(?:\^)?1[4-9]\./,
    result: { framework: 'nextjs-app-router' },
  },

  // FastAPI
  {
    file: 'main.py',
    pattern: /from fastapi import FastAPI/,
    result: { framework: 'fastapi', projectType: 'api' },
  },
  {
    file: 'app/main.py',
    pattern: /from fastapi import FastAPI/,
    result: { framework: 'fastapi', projectType: 'api' },
  },

  // Express
  {
    file: 'package.json',
    pattern: /"express":/,
    result: { framework: 'express', projectType: 'api' },
  },

  // Fastify
  {
    file: 'package.json',
    pattern: /"fastify":/,
    result: { framework: 'fastify', projectType: 'api' },
  },

  // Hono
  {
    file: 'package.json',
    pattern: /"hono":/,
    result: { framework: 'hono', projectType: 'api' },
  },

  // Auth providers
  {
    file: 'package.json',
    pattern: /"@clerk\/nextjs":/,
    result: { features: ['auth-clerk'] },
  },
  {
    file: 'package.json',
    pattern: /"next-auth":/,
    result: { features: ['auth-nextauth'] },
  },

  // Payments
  {
    file: 'package.json',
    pattern: /"stripe":|"@stripe\/stripe-js":/,
    result: { features: ['payments-stripe'] },
  },

  // Testing
  {
    file: 'package.json',
    pattern: /"vitest":/,
    result: { features: ['testing-vitest'] },
  },
  {
    file: 'package.json',
    pattern: /"jest":/,
    result: { features: ['testing-jest'] },
  },
  {
    file: 'package.json',
    pattern: /"@playwright\/test":/,
    result: { features: ['testing-playwright'] },
  },

  // Database ORMs
  {
    file: 'package.json',
    pattern: /"@prisma\/client":/,
    result: { features: ['database-prisma'] },
  },
  {
    file: 'package.json',
    pattern: /"drizzle-orm":/,
    result: { features: ['database-drizzle'] },
  },

  // Chrome extension
  {
    file: 'manifest.json',
    pattern: /"manifest_version":\s*3/,
    result: { projectType: 'extension', framework: 'chrome-mv3' },
  },
]
```

### Database Detection

```typescript
async function detectDatabase(projectPath: string): Promise<string | null> {
  // Check Prisma schema
  const prismaSchema = await readFile(
    join(projectPath, 'prisma/schema.prisma'),
    'utf-8'
  ).catch(() => null)

  if (prismaSchema) {
    if (prismaSchema.includes('provider = "postgresql"')) return 'postgresql'
    if (prismaSchema.includes('provider = "mysql"')) return 'mysql'
    if (prismaSchema.includes('provider = "sqlite"')) return 'sqlite'
    if (prismaSchema.includes('provider = "mongodb"')) return 'mongodb'
  }

  // Check environment files
  const envFiles = ['.env', '.env.local', '.env.example']

  for (const envFile of envFiles) {
    const content = await readFile(join(projectPath, envFile), 'utf-8').catch(() => '')

    if (content.includes('postgresql://') || content.includes('postgres://')) {
      return 'postgresql'
    }
    if (content.includes('mysql://')) return 'mysql'
    if (content.includes('mongodb://') || content.includes('mongodb+srv://')) {
      return 'mongodb'
    }
  }

  // Check docker-compose
  const compose = await readFile(
    join(projectPath, 'docker-compose.yml'),
    'utf-8'
  ).catch(() => null)

  if (compose) {
    if (compose.includes('postgres:') || compose.includes('postgresql')) {
      return 'postgresql'
    }
    if (compose.includes('mysql:') || compose.includes('mariadb:')) return 'mysql'
    if (compose.includes('mongo:')) return 'mongodb'
  }

  return null
}
```

## Full Detection Implementation

```typescript
// lib/project-detector.ts

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

type ProjectType = 'web' | 'mobile' | 'api' | 'monorepo' | 'extension' | 'cli' | 'library'

type DetectionResult = {
  projectType: ProjectType | null
  framework: string | null
  language: 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | null
  packageManager: 'bun' | 'npm' | 'yarn' | 'pnpm' | 'uv' | 'pip' | null
  database: string | null
  features: string[]
  existingClaude: {
    claudeMd: boolean
    skills: boolean
    agents: boolean
    hooks: boolean
    mcp: boolean
  }
  confidence: number
  suggestions: string[]
}

export async function detectProject(projectPath: string): Promise<DetectionResult> {
  const result: DetectionResult = {
    projectType: null,
    framework: null,
    language: null,
    packageManager: null,
    database: null,
    features: [],
    existingClaude: {
      claudeMd: false,
      skills: false,
      agents: false,
      hooks: false,
      mcp: false,
    },
    confidence: 0,
    suggestions: [],
  }

  let confidencePoints = 0
  let maxPoints = 0

  // Check for existing files
  const files = await glob('**/*', {
    cwd: projectPath,
    ignore: ['node_modules/**', '.git/**', 'dist/**', '.next/**'],
    maxDepth: 3,
  })

  // File-based detection
  for (const file of files) {
    maxPoints++
    const indicator = FILE_INDICATORS[file]
    if (indicator) {
      confidencePoints++
      Object.assign(result, indicator)
      if (indicator.features) {
        result.features.push(...indicator.features)
      }
    }
  }

  // Content-based detection
  for (const { file, pattern, result: partialResult } of CONTENT_PATTERNS) {
    const filePath = join(projectPath, file)
    if (existsSync(filePath)) {
      maxPoints++
      const content = readFileSync(filePath, 'utf-8')
      if (pattern.test(content)) {
        confidencePoints++
        Object.assign(result, partialResult)
        if (partialResult.features) {
          result.features.push(...partialResult.features)
        }
      }
    }
  }

  // Database detection
  result.database = await detectDatabase(projectPath)
  if (result.database) {
    confidencePoints++
    maxPoints++
  }

  // Claude Code detection
  result.existingClaude = {
    claudeMd: existsSync(join(projectPath, 'CLAUDE.md')),
    skills: existsSync(join(projectPath, '.claude/skills')),
    agents: existsSync(join(projectPath, '.claude/agents')),
    hooks: existsSync(join(projectPath, '.claude/settings.json')),
    mcp: existsSync(join(projectPath, '.mcp.json')),
  }

  // Calculate confidence
  result.confidence = maxPoints > 0 ? confidencePoints / maxPoints : 0

  // Generate suggestions
  result.suggestions = generateSuggestions(result)

  // Deduplicate features
  result.features = [...new Set(result.features)]

  return result
}

function generateSuggestions(result: DetectionResult): string[] {
  const suggestions: string[] = []

  // CLAUDE.md suggestion
  if (!result.existingClaude.claudeMd) {
    suggestions.push('Add CLAUDE.md for project workflow documentation')
  }

  // Agents suggestion
  if (!result.existingClaude.agents) {
    suggestions.push('Add .claude/agents/ with build-validator for CI integration')
  }

  // Hooks suggestion
  if (!result.existingClaude.hooks && result.language === 'typescript') {
    suggestions.push('Add PostToolUse hooks for auto-formatting on Write/Edit')
  }

  // Database suggestion
  if (result.database && !result.features.includes('database-prisma')) {
    suggestions.push('Consider adding Prisma for type-safe database access')
  }

  // Testing suggestion
  if (!result.features.some(f => f.startsWith('testing-'))) {
    suggestions.push('Add testing with Vitest for unit tests')
  }

  // Type safety suggestion
  if (result.language === 'javascript') {
    suggestions.push('Consider migrating to TypeScript for better type safety')
  }

  return suggestions
}
```

## CLI Usage

```typescript
// cli/detect.ts

import { detectProject } from './lib/project-detector'

async function main() {
  const projectPath = process.cwd()

  console.log('Analyzing project...\n')

  const result = await detectProject(projectPath)

  console.log('='.repeat(50))
  console.log('PROJECT DETECTION REPORT')
  console.log('='.repeat(50))
  console.log()
  console.log(`Project Type:     ${result.projectType || 'Unknown'}`)
  console.log(`Framework:        ${result.framework || 'Unknown'}`)
  console.log(`Language:         ${result.language || 'Unknown'}`)
  console.log(`Package Manager:  ${result.packageManager || 'Unknown'}`)
  console.log(`Database:         ${result.database || 'None detected'}`)
  console.log(`Confidence:       ${(result.confidence * 100).toFixed(0)}%`)
  console.log()

  if (result.features.length > 0) {
    console.log('Detected Features:')
    for (const feature of result.features) {
      console.log(`  - ${feature}`)
    }
    console.log()
  }

  console.log('Claude Code Status:')
  console.log(`  CLAUDE.md:  ${result.existingClaude.claudeMd ? '✓' : '✗'}`)
  console.log(`  Skills:     ${result.existingClaude.skills ? '✓' : '✗'}`)
  console.log(`  Agents:     ${result.existingClaude.agents ? '✓' : '✗'}`)
  console.log(`  Hooks:      ${result.existingClaude.hooks ? '✓' : '✗'}`)
  console.log(`  MCP:        ${result.existingClaude.mcp ? '✓' : '✗'}`)
  console.log()

  if (result.suggestions.length > 0) {
    console.log('Suggestions:')
    for (const suggestion of result.suggestions) {
      console.log(`  → ${suggestion}`)
    }
    console.log()
  }

  console.log('='.repeat(50))
}

main().catch(console.error)
```

## Example Output

```
==================================================
PROJECT DETECTION REPORT
==================================================

Project Type:     web
Framework:        nextjs-app-router
Language:         typescript
Package Manager:  bun
Database:         postgresql
Confidence:       87%

Detected Features:
  - auth-clerk
  - database-prisma
  - payments-stripe
  - testing-vitest
  - testing-playwright

Claude Code Status:
  CLAUDE.md:  ✓
  Skills:     ✗
  Agents:     ✗
  Hooks:      ✓
  MCP:        ✗

Suggestions:
  → Add .claude/agents/ with build-validator for CI integration
  → Add custom skills for project-specific workflows

==================================================
```

## Integration with Template Builder

```typescript
// When user runs /template-builder in an existing project

async function suggestTemplates(projectPath: string) {
  const detection = await detectProject(projectPath)

  // Don't recreate what exists
  const missingComponents = []

  if (!detection.existingClaude.claudeMd) {
    missingComponents.push('CLAUDE.md')
  }
  if (!detection.existingClaude.agents) {
    missingComponents.push('agents')
  }
  if (!detection.existingClaude.hooks) {
    missingComponents.push('hooks')
  }

  // Suggest appropriate templates based on detection
  const templates = []

  if (detection.framework === 'nextjs' && !detection.existingClaude.claudeMd) {
    templates.push('claude-md-templates.md#nextjs')
  }

  if (!detection.existingClaude.agents) {
    templates.push('agent-templates.md#build-validator')
  }

  return {
    detection,
    missingComponents,
    suggestedTemplates: templates,
  }
}
```
