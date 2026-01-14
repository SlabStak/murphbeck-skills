# CLAUDE.md Templates

`CLAUDE.md` lives in the project root and provides project-specific instructions to Claude.

## Purpose

- Define development workflow commands
- Specify code style preferences
- Document project conventions
- Set up testing requirements
- Configure CI/CD expectations

## Template: Next.js with Bun

```markdown
# Development Workflow

**Always use `bun`, not `npm`.**

## Quick Reference

```sh
# Development
bun run dev              # Start dev server
bun run build            # Production build
bun run start            # Start production server

# Quality
bun run typecheck        # TypeScript check
bun run lint             # Lint all files
bun run lint:file -- "src/file.ts"  # Lint specific file
bun run format           # Format with Prettier
bun run test             # Run all tests
bun run test -- -t "test name"      # Run specific test

# Database
bun run db:push          # Push schema changes
bun run db:generate      # Generate Prisma client
bun run db:studio        # Open Prisma Studio

# Before PR
bun run lint && bun run typecheck && bun run test
```

## Code Style

### TypeScript
- Prefer `type` over `interface`
- **Never use `enum`** (use string literal unions instead)
- Use `as const` for constant objects
- Explicit return types on exported functions

```typescript
// Good
type Status = 'pending' | 'active' | 'completed'

// Bad
enum Status { Pending, Active, Completed }
```

### React
- Use function components with arrow syntax
- Prefer named exports over default exports
- Colocate components with their tests
- Use `use client` directive only when necessary

### Imports
- Use absolute imports (`@/components/...`)
- Group imports: external → internal → relative
- No circular dependencies

## File Organization

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── (auth)/         # Auth route group
│   └── (dashboard)/    # Dashboard route group
├── components/
│   ├── ui/             # Reusable UI components
│   └── features/       # Feature-specific components
├── lib/                # Utilities and helpers
├── hooks/              # Custom React hooks
├── types/              # TypeScript types
└── server/             # Server-only code
```

## Testing

- Test files: `*.test.ts` or `*.test.tsx`
- Use `describe` blocks for grouping
- Mock external services in tests
- Aim for 80% coverage on critical paths

## Commit Messages

```
feat: add user authentication
fix: resolve cart calculation bug
refactor: simplify checkout flow
docs: update API documentation
test: add payment integration tests
chore: update dependencies
```

## PR Requirements

Before creating a PR:
1. All tests pass
2. No TypeScript errors
3. No lint errors
4. Build succeeds
5. PR description explains "why" not just "what"
```

## Template: React Native / Expo

```markdown
# Development Workflow

**Use `bun` for package management, `npx expo` for Expo CLI.**

## Quick Reference

```sh
# Development
npx expo start           # Start Metro bundler
npx expo start --ios     # Start with iOS simulator
npx expo start --android # Start with Android emulator
npx expo start --web     # Start web version

# Building
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
npx eas build --profile production --platform all

# Quality
bun run typecheck
bun run lint
bun run test

# Updates
npx eas update --branch production --message "description"
```

## Code Style

### TypeScript
- Use strict mode
- Prefer `type` over `interface`
- Never use `any` - use `unknown` and narrow
- Type all props explicitly

### Components
- Use function components
- Keep components under 200 lines
- Extract hooks for complex logic
- Use `StyleSheet.create()` for styles

### Navigation
- Use Expo Router for file-based routing
- Keep route params typed
- Use deep linking for important screens

## File Organization

```
app/                     # Expo Router pages
├── (tabs)/             # Tab navigator group
├── (auth)/             # Auth flow screens
├── _layout.tsx         # Root layout
└── index.tsx           # Home screen
components/
├── ui/                 # Reusable components
└── screens/            # Screen-specific components
hooks/                  # Custom hooks
lib/                    # Utilities
stores/                 # Zustand stores
types/                  # TypeScript types
```

## Platform-Specific Code

```typescript
// Use Platform.select for simple differences
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.select({ ios: 20, android: 0 })
  }
})

// Use .ios.tsx / .android.tsx for complex differences
// Button.ios.tsx
// Button.android.tsx
```

## Testing

- Use React Native Testing Library
- Test user interactions, not implementation
- Mock native modules in jest.setup.js
- Test on both platforms before PR
```

## Template: Fastify API

```markdown
# Development Workflow

**Always use `bun`, not `npm`.**

## Quick Reference

```sh
# Development
bun run dev              # Start with hot reload
bun run start            # Production start
bun run build            # Build for production

# Database
bun run db:migrate       # Run migrations
bun run db:seed          # Seed database
bun run db:reset         # Reset and re-seed

# Quality
bun run typecheck
bun run lint
bun run test
bun run test:e2e         # End-to-end API tests

# Documentation
bun run docs:generate    # Generate OpenAPI spec
```

## Code Style

### TypeScript
- Use Zod for runtime validation
- Define request/response schemas
- Use dependency injection for testability
- Keep handlers thin, logic in services

### API Design
- Use REST conventions
- Version APIs: `/api/v1/...`
- Return consistent error format
- Use proper HTTP status codes

```typescript
// Error format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

### Route Organization
```typescript
// routes/users/index.ts
export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/', listUsers)
  fastify.get('/:id', getUser)
  fastify.post('/', createUser)
  fastify.put('/:id', updateUser)
  fastify.delete('/:id', deleteUser)
}
```

## File Organization

```
src/
├── routes/              # API routes
│   ├── users/
│   ├── auth/
│   └── index.ts        # Route registration
├── services/           # Business logic
├── repositories/       # Data access
├── middleware/         # Fastify plugins
├── schemas/            # Zod schemas
├── types/              # TypeScript types
└── utils/              # Helpers
```

## Testing

- Unit tests for services
- Integration tests for routes
- Use test database for E2E
- Mock external services

## Security

- Validate all inputs with Zod
- Use helmet plugin
- Rate limit endpoints
- Sanitize error messages in production
```

## Template: Monorepo (Turborepo)

```markdown
# Development Workflow

**Always use `bun`, not `npm`. Use `turbo` for task orchestration.**

## Quick Reference

```sh
# All packages
bun install              # Install all dependencies
turbo run build          # Build all packages
turbo run test           # Test all packages
turbo run lint           # Lint all packages

# Specific app
turbo run dev --filter=web
turbo run build --filter=api
turbo run test --filter=@repo/ui

# Add dependency
bun add <package> --filter=web
bun add <package> --filter=@repo/ui

# Development
turbo run dev            # Start all apps
```

## Package Structure

```
apps/
├── web/                 # Next.js web app
├── mobile/              # Expo mobile app
├── api/                 # Fastify API
└── admin/               # Admin dashboard
packages/
├── ui/                  # Shared UI components
├── utils/               # Shared utilities
├── types/               # Shared TypeScript types
├── config-eslint/       # Shared ESLint config
└── config-typescript/   # Shared TS config
```

## Code Style

### Shared Packages
- Export from `index.ts` barrel file
- Use workspace protocol: `"@repo/ui": "workspace:*"`
- Keep packages focused and minimal
- Document public APIs

### Import Conventions
```typescript
// Import from shared packages
import { Button } from '@repo/ui'
import { formatDate } from '@repo/utils'
import type { User } from '@repo/types'

// Import within app
import { Header } from '@/components/Header'
```

## Caching

Turborepo caches task outputs. Configure in `turbo.json`:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "test/**"]
    }
  }
}
```

## Adding a New Package

1. Create directory: `packages/new-package/`
2. Add `package.json` with `name: "@repo/new-package"`
3. Add `tsconfig.json` extending shared config
4. Export from `src/index.ts`
5. Run `bun install` from root

## CI/CD

- Turborepo detects affected packages
- Only build/test what changed
- Use remote caching for speed
```

## Template: Python (FastAPI/Django)

```markdown
# Development Workflow

**Use `uv` for package management (faster than pip).**

## Quick Reference

```sh
# Setup
uv venv                  # Create virtual environment
source .venv/bin/activate
uv pip install -r requirements.txt

# Development
uv run uvicorn main:app --reload  # FastAPI
uv run python manage.py runserver # Django

# Quality
uv run pytest
uv run mypy .
uv run ruff check .
uv run ruff format .

# Database
uv run alembic upgrade head       # FastAPI/SQLAlchemy
uv run python manage.py migrate   # Django
```

## Code Style

### Python
- Use type hints everywhere
- Prefer `pydantic` for data validation
- Use async where beneficial
- Keep functions under 50 lines

### Formatting
- ruff for linting and formatting
- Line length: 88 characters
- Use double quotes for strings

## File Organization

```
src/
├── api/                 # Route handlers
├── models/              # Database models
├── schemas/             # Pydantic schemas
├── services/            # Business logic
├── repositories/        # Data access
└── utils/               # Helpers
tests/
├── unit/
├── integration/
└── conftest.py
```

## Testing

- pytest for all tests
- Use fixtures for setup
- Mock external services
- Aim for 80% coverage
```

## Minimal Template

For simple projects:

```markdown
# Development Workflow

## Commands
- `bun run dev` - Start development
- `bun run build` - Build for production
- `bun run test` - Run tests

## Code Style
- TypeScript strict mode
- Prettier for formatting
- ESLint for linting
```
