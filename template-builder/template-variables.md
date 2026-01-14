# Template Variable System

A system for replacing placeholders in templates with project-specific values.

## Variable Syntax

Templates use double curly braces for variable substitution:

```
{{variable_name}}
```

### Standard Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{project_name}}` | Project name (kebab-case) | `my-awesome-app` |
| `{{project_name_pascal}}` | Project name (PascalCase) | `MyAwesomeApp` |
| `{{project_name_camel}}` | Project name (camelCase) | `myAwesomeApp` |
| `{{project_name_snake}}` | Project name (snake_case) | `my_awesome_app` |
| `{{project_name_title}}` | Project name (Title Case) | `My Awesome App` |
| `{{description}}` | Project description | `A web application` |
| `{{author}}` | Author name | `John Doe` |
| `{{author_email}}` | Author email | `john@example.com` |
| `{{license}}` | License type | `MIT` |
| `{{year}}` | Current year | `2024` |
| `{{date}}` | Current date | `2024-01-15` |
| `{{timestamp}}` | ISO timestamp | `2024-01-15T10:30:00Z` |
| `{{version}}` | Initial version | `0.1.0` |
| `{{node_version}}` | Node.js version | `20` |
| `{{bun_version}}` | Bun version | `1.0` |

### Conditional Variables

```
{{#if feature_auth}}
// Authentication code here
{{/if}}

{{#unless feature_payments}}
// Default placeholder when payments not enabled
{{/unless}}
```

### Loop Variables

```
{{#each dependencies}}
"{{name}}": "{{version}}"
{{/each}}
```

## Implementation

### TypeScript Implementation

```typescript
// lib/template-engine.ts

type TemplateVariables = {
  project_name: string
  description?: string
  author?: string
  author_email?: string
  license?: string
  features?: string[]
  dependencies?: Array<{ name: string; version: string }>
  [key: string]: unknown
}

type TransformFn = (value: string) => string

const transforms: Record<string, TransformFn> = {
  pascal: (s) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
  camel: (s) => {
    const pascal = transforms.pascal(s)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  },
  snake: (s) => s.replace(/-/g, '_'),
  title: (s) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  upper: (s) => s.toUpperCase(),
  lower: (s) => s.toLowerCase(),
}

function processTemplate(template: string, variables: TemplateVariables): string {
  let result = template

  // Process conditionals first
  result = processConditionals(result, variables)

  // Process loops
  result = processLoops(result, variables)

  // Process simple variables with transforms
  result = result.replace(
    /\{\{(\w+)(?:_(\w+))?\}\}/g,
    (match, name, transform) => {
      const value = variables[name]

      if (value === undefined) {
        console.warn(`Template variable not found: ${name}`)
        return match
      }

      if (typeof value !== 'string') {
        return String(value)
      }

      if (transform && transforms[transform]) {
        return transforms[transform](value)
      }

      return value
    }
  )

  // Process derived variables
  result = processDerivedVariables(result, variables)

  return result
}

function processConditionals(template: string, variables: TemplateVariables): string {
  // Process {{#if feature}}...{{/if}}
  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g

  let result = template.replace(ifRegex, (match, condition, content) => {
    const value = variables[condition]

    // Check if condition is truthy
    if (value || (variables.features && variables.features.includes(condition))) {
      return content
    }

    return ''
  })

  // Process {{#unless feature}}...{{/unless}}
  const unlessRegex = /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g

  result = result.replace(unlessRegex, (match, condition, content) => {
    const value = variables[condition]

    // Check if condition is falsy
    if (!value && !(variables.features && variables.features.includes(condition))) {
      return content
    }

    return ''
  })

  return result
}

function processLoops(template: string, variables: TemplateVariables): string {
  const loopRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g

  return template.replace(loopRegex, (match, arrayName, content) => {
    const array = variables[arrayName]

    if (!Array.isArray(array)) {
      console.warn(`Template loop variable is not an array: ${arrayName}`)
      return ''
    }

    return array.map((item, index) => {
      let itemContent = content

      // Replace item properties
      if (typeof item === 'object' && item !== null) {
        for (const [key, value] of Object.entries(item)) {
          itemContent = itemContent.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            String(value)
          )
        }
      } else {
        itemContent = itemContent.replace(/\{\{this\}\}/g, String(item))
      }

      // Replace index
      itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index))
      itemContent = itemContent.replace(/\{\{@first\}\}/g, String(index === 0))
      itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === array.length - 1))

      return itemContent
    }).join('')
  })
}

function processDerivedVariables(template: string, variables: TemplateVariables): string {
  const projectName = variables.project_name || 'my-project'

  const derived: Record<string, string> = {
    project_name_pascal: transforms.pascal(projectName),
    project_name_camel: transforms.camel(projectName),
    project_name_snake: transforms.snake(projectName),
    project_name_title: transforms.title(projectName),
    year: new Date().getFullYear().toString(),
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  }

  let result = template

  for (const [key, value] of Object.entries(derived)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }

  return result
}

export { processTemplate, TemplateVariables }
```

## Template Examples

### package.json Template

```json
{
  "name": "{{project_name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "author": "{{author}} <{{author_email}}>",
  "license": "{{license}}",
  "scripts": {
    "dev": "{{#if nextjs}}next dev{{/if}}{{#if vite}}vite{{/if}}",
    "build": "{{#if nextjs}}next build{{/if}}{{#if vite}}vite build{{/if}}",
    "start": "{{#if nextjs}}next start{{/if}}{{#if vite}}vite preview{{/if}}",
    "lint": "{{#if eslint}}eslint .{{/if}}{{#if biome}}biome check .{{/if}}",
    "typecheck": "tsc --noEmit"{{#if testing}},
    "test": "{{#if vitest}}vitest{{/if}}{{#if jest}}jest{{/if}}"{{/if}}
  },
  "dependencies": {
{{#each dependencies}}
    "{{name}}": "{{version}}"{{#unless @last}},{{/unless}}
{{/each}}
  },
  "devDependencies": {
{{#each devDependencies}}
    "{{name}}": "{{version}}"{{#unless @last}},{{/unless}}
{{/each}}
  }
}
```

### CLAUDE.md Template

```markdown
# {{project_name_title}} Development Workflow

**Always use `{{package_manager}}`, not `npm`.**

## Commands

```sh
{{package_manager}} run dev          # Start dev server
{{package_manager}} run build        # Build for production
{{package_manager}} run typecheck    # TypeScript check
{{package_manager}} run lint         # Lint code
{{#if testing}}
{{package_manager}} run test         # Run tests
{{/if}}
```

## Code Style

- Prefer `type` over `interface`
- **Never use `enum`** (use string literal unions)
- Use async/await over promises

{{#if database}}
## Database

```sh
{{package_manager}} run db:migrate   # Run migrations
{{package_manager}} run db:push      # Push schema changes
{{package_manager}} run db:studio    # Open Prisma Studio
```
{{/if}}

{{#if auth}}
## Authentication

Using {{auth_provider}} for authentication.
- Sign in: `/sign-in`
- Sign up: `/sign-up`
- Protected routes use `auth()` middleware
{{/if}}

## Project Structure

```
{{project_name}}/
├── {{#if nextjs}}app/{{/if}}{{#if vite}}src/{{/if}}
{{#if database}}├── prisma/{{/if}}
├── {{#if testing}}tests/{{/if}}
├── CLAUDE.md
└── package.json
```
```

### Component Template

```typescript
// src/components/{{component_name_pascal}}.tsx

{{#if typescript}}
type {{component_name_pascal}}Props = {
  {{#each props}}
  {{name}}{{#if optional}}?{{/if}}: {{type}}
  {{/each}}
}
{{/if}}

export function {{component_name_pascal}}({{#if typescript}}props: {{component_name_pascal}}Props{{else}}props{{/if}}) {
  {{#each props}}
  const { {{name}} } = props
  {{/each}}

  return (
    <div className="{{component_name}}">
      {/* {{component_name_title}} component */}
    </div>
  )
}
```

## Variable Collection

### From User Input

```typescript
async function collectVariables(): Promise<TemplateVariables> {
  // Get from wizard or prompts
  const projectName = await ask('Project name?')
  const description = await ask('Description?')

  // Detect from environment
  const author = await detectGitUser()

  // Use defaults
  const license = 'MIT'
  const version = '0.1.0'

  return {
    project_name: projectName,
    description,
    author: author.name,
    author_email: author.email,
    license,
    version,
  }
}

async function detectGitUser(): Promise<{ name: string; email: string }> {
  const name = await exec('git config user.name').catch(() => 'Your Name')
  const email = await exec('git config user.email').catch(() => 'you@example.com')
  return { name: name.trim(), email: email.trim() }
}
```

### From package.json

```typescript
function collectFromPackageJson(path: string): Partial<TemplateVariables> {
  const pkg = JSON.parse(readFileSync(path, 'utf-8'))

  return {
    project_name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    license: pkg.license,
    author: typeof pkg.author === 'string'
      ? pkg.author
      : pkg.author?.name,
    author_email: typeof pkg.author === 'object'
      ? pkg.author?.email
      : undefined,
  }
}
```

## CLI Integration

```bash
# Using the template system from CLI
template-builder generate my-project \
  --template=nextjs-saas \
  --author="John Doe" \
  --description="My SaaS application" \
  --features=auth,database,payments
```

## Best Practices

1. **Always provide defaults**
   - Don't leave required variables undefined
   - Use sensible defaults for optional values

2. **Validate inputs**
   - Project names should be valid npm package names
   - Email addresses should be valid format

3. **Escape special characters**
   - Handle JSON strings properly
   - Escape regex special chars in patterns

4. **Document all variables**
   - List all supported variables in template headers
   - Include examples of usage

5. **Test templates**
   - Verify output with various inputs
   - Check edge cases (empty strings, special chars)
