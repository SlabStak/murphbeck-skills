# Code Generation Template

## Overview
Comprehensive code generation setup with Plop, Hygen, Yeoman, and custom generators for consistent scaffolding and boilerplate generation.

## Quick Start
```bash
# Plop
npm install plop --save-dev

# Hygen
npm install hygen --save-dev
npx hygen init self

# Yeoman
npm install -g yo
```

## Plop Configuration

### plopfile.js
```javascript
// plopfile.js
import { NodePlopAPI } from 'plop';

export default function(plop: NodePlopAPI) {
  // Helper functions
  plop.setHelper('upperCase', (text) => text.toUpperCase());
  plop.setHelper('lowerCase', (text) => text.toLowerCase());
  plop.setHelper('camelCase', (text) => plop.getHelper('camelCase')(text));
  plop.setHelper('pascalCase', (text) => plop.getHelper('pascalCase')(text));
  plop.setHelper('kebabCase', (text) => plop.getHelper('kebabCase')(text));
  plop.setHelper('snakeCase', (text) => plop.getHelper('snakeCase')(text));

  // Custom action types
  plop.setActionType('addManyWithLog', (answers, config, plop) => {
    console.log(`Creating ${config.templateFiles} files...`);
    return plop.renderString(config.templateFiles, answers);
  });

  // React Component Generator
  plop.setGenerator('component', {
    description: 'Create a React component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name:',
        validate: (value) => {
          if (!value) return 'Name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Component name must be PascalCase';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'Component type:',
        choices: ['functional', 'server', 'client'],
        default: 'functional'
      },
      {
        type: 'confirm',
        name: 'withTests',
        message: 'Include tests?',
        default: true
      },
      {
        type: 'confirm',
        name: 'withStories',
        message: 'Include Storybook story?',
        default: true
      },
      {
        type: 'list',
        name: 'directory',
        message: 'Directory:',
        choices: [
          { name: 'src/components', value: 'src/components' },
          { name: 'src/components/ui', value: 'src/components/ui' },
          { name: 'src/features', value: 'src/features' }
        ]
      }
    ],
    actions: (data) => {
      const actions = [
        {
          type: 'add',
          path: '{{directory}}/{{pascalCase name}}/{{pascalCase name}}.tsx',
          templateFile: 'plop-templates/component/component.tsx.hbs'
        },
        {
          type: 'add',
          path: '{{directory}}/{{pascalCase name}}/index.ts',
          templateFile: 'plop-templates/component/index.ts.hbs'
        }
      ];

      if (data.withTests) {
        actions.push({
          type: 'add',
          path: '{{directory}}/{{pascalCase name}}/{{pascalCase name}}.test.tsx',
          templateFile: 'plop-templates/component/component.test.tsx.hbs'
        });
      }

      if (data.withStories) {
        actions.push({
          type: 'add',
          path: '{{directory}}/{{pascalCase name}}/{{pascalCase name}}.stories.tsx',
          templateFile: 'plop-templates/component/component.stories.tsx.hbs'
        });
      }

      return actions;
    }
  });

  // API Route Generator
  plop.setGenerator('api', {
    description: 'Create an API route',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Route name (e.g., users, posts):',
        validate: (value) => value ? true : 'Name is required'
      },
      {
        type: 'checkbox',
        name: 'methods',
        message: 'HTTP methods:',
        choices: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        default: ['GET', 'POST']
      },
      {
        type: 'confirm',
        name: 'withAuth',
        message: 'Require authentication?',
        default: true
      },
      {
        type: 'confirm',
        name: 'withValidation',
        message: 'Include request validation?',
        default: true
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'src/app/api/{{kebabCase name}}/route.ts',
        templateFile: 'plop-templates/api/route.ts.hbs'
      },
      {
        type: 'add',
        path: 'src/app/api/{{kebabCase name}}/[id]/route.ts',
        templateFile: 'plop-templates/api/route-id.ts.hbs',
        skip: (data) => !data.methods.includes('GET') && !data.methods.includes('PUT')
      },
      {
        type: 'add',
        path: 'src/lib/validations/{{kebabCase name}}.ts',
        templateFile: 'plop-templates/api/validation.ts.hbs',
        skip: (data) => !data.withValidation
      }
    ]
  });

  // Feature Module Generator
  plop.setGenerator('feature', {
    description: 'Create a feature module',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Feature name:',
        validate: (value) => value ? true : 'Name is required'
      },
      {
        type: 'checkbox',
        name: 'includes',
        message: 'Include:',
        choices: [
          { name: 'Components', value: 'components', checked: true },
          { name: 'Hooks', value: 'hooks', checked: true },
          { name: 'API', value: 'api', checked: true },
          { name: 'Types', value: 'types', checked: true },
          { name: 'Utils', value: 'utils', checked: false },
          { name: 'Store', value: 'store', checked: false }
        ]
      }
    ],
    actions: (data) => {
      const actions = [
        {
          type: 'add',
          path: 'src/features/{{kebabCase name}}/index.ts',
          templateFile: 'plop-templates/feature/index.ts.hbs'
        }
      ];

      if (data.includes.includes('components')) {
        actions.push({
          type: 'add',
          path: 'src/features/{{kebabCase name}}/components/{{pascalCase name}}List.tsx',
          templateFile: 'plop-templates/feature/components/List.tsx.hbs'
        });
        actions.push({
          type: 'add',
          path: 'src/features/{{kebabCase name}}/components/{{pascalCase name}}Card.tsx',
          templateFile: 'plop-templates/feature/components/Card.tsx.hbs'
        });
      }

      if (data.includes.includes('hooks')) {
        actions.push({
          type: 'add',
          path: 'src/features/{{kebabCase name}}/hooks/use{{pascalCase name}}.ts',
          templateFile: 'plop-templates/feature/hooks/useFeature.ts.hbs'
        });
      }

      if (data.includes.includes('api')) {
        actions.push({
          type: 'add',
          path: 'src/features/{{kebabCase name}}/api/{{camelCase name}}Api.ts',
          templateFile: 'plop-templates/feature/api/api.ts.hbs'
        });
      }

      if (data.includes.includes('types')) {
        actions.push({
          type: 'add',
          path: 'src/features/{{kebabCase name}}/types/index.ts',
          templateFile: 'plop-templates/feature/types/index.ts.hbs'
        });
      }

      if (data.includes.includes('store')) {
        actions.push({
          type: 'add',
          path: 'src/features/{{kebabCase name}}/store/{{camelCase name}}Slice.ts',
          templateFile: 'plop-templates/feature/store/slice.ts.hbs'
        });
      }

      return actions;
    }
  });

  // Page Generator
  plop.setGenerator('page', {
    description: 'Create a Next.js page',
    prompts: [
      {
        type: 'input',
        name: 'path',
        message: 'Page path (e.g., dashboard, users/[id]):',
        validate: (value) => value ? true : 'Path is required'
      },
      {
        type: 'list',
        name: 'type',
        message: 'Page type:',
        choices: [
          { name: 'Server Component', value: 'server' },
          { name: 'Client Component', value: 'client' },
          { name: 'Static Page', value: 'static' }
        ]
      },
      {
        type: 'confirm',
        name: 'withLayout',
        message: 'Create layout?',
        default: false
      },
      {
        type: 'confirm',
        name: 'withLoading',
        message: 'Create loading state?',
        default: true
      },
      {
        type: 'confirm',
        name: 'withError',
        message: 'Create error boundary?',
        default: true
      }
    ],
    actions: (data) => {
      const actions = [
        {
          type: 'add',
          path: 'src/app/{{path}}/page.tsx',
          templateFile: 'plop-templates/page/page.tsx.hbs'
        }
      ];

      if (data.withLayout) {
        actions.push({
          type: 'add',
          path: 'src/app/{{path}}/layout.tsx',
          templateFile: 'plop-templates/page/layout.tsx.hbs'
        });
      }

      if (data.withLoading) {
        actions.push({
          type: 'add',
          path: 'src/app/{{path}}/loading.tsx',
          templateFile: 'plop-templates/page/loading.tsx.hbs'
        });
      }

      if (data.withError) {
        actions.push({
          type: 'add',
          path: 'src/app/{{path}}/error.tsx',
          templateFile: 'plop-templates/page/error.tsx.hbs'
        });
      }

      return actions;
    }
  });

  // Hook Generator
  plop.setGenerator('hook', {
    description: 'Create a custom React hook',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Hook name (without "use" prefix):',
        validate: (value) => value ? true : 'Name is required'
      },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: ['state', 'effect', 'query', 'mutation', 'utility']
      },
      {
        type: 'confirm',
        name: 'withTests',
        message: 'Include tests?',
        default: true
      }
    ],
    actions: (data) => {
      const actions = [
        {
          type: 'add',
          path: 'src/hooks/use{{pascalCase name}}.ts',
          templateFile: 'plop-templates/hook/hook.ts.hbs'
        }
      ];

      if (data.withTests) {
        actions.push({
          type: 'add',
          path: 'src/hooks/use{{pascalCase name}}.test.ts',
          templateFile: 'plop-templates/hook/hook.test.ts.hbs'
        });
      }

      return actions;
    }
  });
}
```

### plop-templates/component/component.tsx.hbs
```handlebars
{{#if (eq type "client")}}
'use client';

{{/if}}
import * as React from 'react';
{{#if (eq type "server")}}
import { Suspense } from 'react';
{{/if}}

import { cn } from '@/lib/utils';

export interface {{pascalCase name}}Props {
  className?: string;
  children?: React.ReactNode;
}

{{#if (eq type "server")}}
async function {{pascalCase name}}Content({ className }: {{pascalCase name}}Props) {
  // Fetch data here

  return (
    <div className={cn('', className)}>
      {/* Component content */}
    </div>
  );
}

export async function {{pascalCase name}}({ className, ...props }: {{pascalCase name}}Props) {
  return (
    <Suspense fallback={<{{pascalCase name}}Skeleton />}>
      <{{pascalCase name}}Content className={className} {...props} />
    </Suspense>
  );
}

function {{pascalCase name}}Skeleton() {
  return (
    <div className="animate-pulse">
      {/* Skeleton content */}
    </div>
  );
}
{{else}}
export function {{pascalCase name}}({ className, children }: {{pascalCase name}}Props) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
}
{{/if}}

{{pascalCase name}}.displayName = '{{pascalCase name}}';
```

### plop-templates/component/component.test.tsx.hbs
```handlebars
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { {{pascalCase name}} } from './{{pascalCase name}}';

describe('{{pascalCase name}}', () => {
  it('renders without crashing', () => {
    render(<{{pascalCase name}} />);
  });

  it('renders children', () => {
    render(<{{pascalCase name}}>Test content</{{pascalCase name}}>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<{{pascalCase name}} className="custom-class" />);
    expect(screen.getByRole('generic')).toHaveClass('custom-class');
  });

  it('matches snapshot', () => {
    const { container } = render(<{{pascalCase name}}>Content</{{pascalCase name}}>);
    expect(container).toMatchSnapshot();
  });
});
```

## Hygen Configuration

### _templates/component/new/component.tsx.ejs.t
```ejs
---
to: src/components/<%= h.changeCase.pascal(name) %>/<%= h.changeCase.pascal(name) %>.tsx
---
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface <%= h.changeCase.pascal(name) %>Props {
  className?: string;
  children?: React.ReactNode;
}

export function <%= h.changeCase.pascal(name) %>({ className, children }: <%= h.changeCase.pascal(name) %>Props) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
}

<%= h.changeCase.pascal(name) %>.displayName = '<%= h.changeCase.pascal(name) %>';
```

### _templates/component/new/index.ts.ejs.t
```ejs
---
to: src/components/<%= h.changeCase.pascal(name) %>/index.ts
---
export { <%= h.changeCase.pascal(name) %> } from './<%= h.changeCase.pascal(name) %>';
export type { <%= h.changeCase.pascal(name) %>Props } from './<%= h.changeCase.pascal(name) %>';
```

### _templates/component/new/test.tsx.ejs.t
```ejs
---
to: src/components/<%= h.changeCase.pascal(name) %>/<%= h.changeCase.pascal(name) %>.test.tsx
unless_exists: true
---
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { <%= h.changeCase.pascal(name) %> } from './<%= h.changeCase.pascal(name) %>';

describe('<%= h.changeCase.pascal(name) %>', () => {
  it('renders without crashing', () => {
    render(<<%= h.changeCase.pascal(name) %> />);
  });

  it('renders children', () => {
    render(<<%= h.changeCase.pascal(name) %>>Test</<%= h.changeCase.pascal(name) %>>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### _templates/component/new/prompt.js
```javascript
module.exports = {
  prompt: ({ inquirer }) => {
    const questions = [
      {
        type: 'input',
        name: 'name',
        message: 'Component name:'
      },
      {
        type: 'confirm',
        name: 'withTests',
        message: 'Include tests?',
        default: true
      },
      {
        type: 'confirm',
        name: 'withStory',
        message: 'Include Storybook story?',
        default: true
      }
    ];

    return inquirer.prompt(questions);
  }
};
```

## Custom Generator CLI

### scripts/generate.ts
```typescript
#!/usr/bin/env ts-node
// scripts/generate.ts

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import Handlebars from 'handlebars';

interface GeneratorConfig {
  name: string;
  description: string;
  prompts: Prompt[];
  templates: Template[];
}

interface Prompt {
  name: string;
  message: string;
  type: 'input' | 'confirm' | 'select';
  default?: string | boolean;
  choices?: string[];
  validate?: (value: string) => boolean | string;
}

interface Template {
  source: string;
  destination: string;
  condition?: (answers: Record<string, any>) => boolean;
}

// Register Handlebars helpers
Handlebars.registerHelper('pascalCase', (str: string) => {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
});

Handlebars.registerHelper('camelCase', (str: string) => {
  const pascal = Handlebars.helpers.pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});

Handlebars.registerHelper('kebabCase', (str: string) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
});

Handlebars.registerHelper('snakeCase', (str: string) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
});

// Generator configurations
const generators: Record<string, GeneratorConfig> = {
  component: {
    name: 'component',
    description: 'Create a React component',
    prompts: [
      {
        name: 'name',
        message: 'Component name:',
        type: 'input',
        validate: (value) => /^[A-Z][a-zA-Z0-9]*$/.test(value) || 'Must be PascalCase'
      },
      {
        name: 'withTests',
        message: 'Include tests?',
        type: 'confirm',
        default: true
      }
    ],
    templates: [
      {
        source: 'templates/component/component.tsx.hbs',
        destination: 'src/components/{{pascalCase name}}/{{pascalCase name}}.tsx'
      },
      {
        source: 'templates/component/index.ts.hbs',
        destination: 'src/components/{{pascalCase name}}/index.ts'
      },
      {
        source: 'templates/component/test.tsx.hbs',
        destination: 'src/components/{{pascalCase name}}/{{pascalCase name}}.test.tsx',
        condition: (answers) => answers.withTests
      }
    ]
  },
  hook: {
    name: 'hook',
    description: 'Create a custom hook',
    prompts: [
      {
        name: 'name',
        message: 'Hook name (without "use"):',
        type: 'input'
      },
      {
        name: 'withTests',
        message: 'Include tests?',
        type: 'confirm',
        default: true
      }
    ],
    templates: [
      {
        source: 'templates/hook/hook.ts.hbs',
        destination: 'src/hooks/use{{pascalCase name}}.ts'
      },
      {
        source: 'templates/hook/test.ts.hbs',
        destination: 'src/hooks/use{{pascalCase name}}.test.ts',
        condition: (answers) => answers.withTests
      }
    ]
  },
  api: {
    name: 'api',
    description: 'Create an API route',
    prompts: [
      {
        name: 'name',
        message: 'Route name:',
        type: 'input'
      },
      {
        name: 'methods',
        message: 'HTTP methods:',
        type: 'select',
        choices: ['GET,POST', 'GET,POST,PUT,DELETE', 'GET only', 'POST only']
      }
    ],
    templates: [
      {
        source: 'templates/api/route.ts.hbs',
        destination: 'src/app/api/{{kebabCase name}}/route.ts'
      }
    ]
  }
};

class Generator {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async run(): Promise<void> {
    const generatorName = process.argv[2];

    if (!generatorName || !generators[generatorName]) {
      console.log('Available generators:');
      Object.values(generators).forEach(gen => {
        console.log(`  ${gen.name} - ${gen.description}`);
      });
      console.log('\nUsage: npx ts-node scripts/generate.ts <generator>');
      this.rl.close();
      return;
    }

    const config = generators[generatorName];
    console.log(`\n${config.description}\n`);

    const answers = await this.collectAnswers(config.prompts);
    await this.generateFiles(config.templates, answers);

    console.log('\nGeneration complete!');
    this.rl.close();
  }

  private async collectAnswers(prompts: Prompt[]): Promise<Record<string, any>> {
    const answers: Record<string, any> = {};

    for (const prompt of prompts) {
      answers[prompt.name] = await this.ask(prompt);
    }

    return answers;
  }

  private ask(prompt: Prompt): Promise<any> {
    return new Promise((resolve) => {
      const defaultStr = prompt.default !== undefined ? ` (${prompt.default})` : '';

      this.rl.question(`${prompt.message}${defaultStr} `, (answer) => {
        let value: any = answer || prompt.default;

        if (prompt.type === 'confirm') {
          value = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' ||
                  (answer === '' && prompt.default === true);
        }

        if (prompt.validate) {
          const result = prompt.validate(value);
          if (result !== true) {
            console.log(`  Error: ${result}`);
            resolve(this.ask(prompt));
            return;
          }
        }

        resolve(value);
      });
    });
  }

  private async generateFiles(
    templates: Template[],
    answers: Record<string, any>
  ): Promise<void> {
    for (const template of templates) {
      if (template.condition && !template.condition(answers)) {
        continue;
      }

      const destPath = Handlebars.compile(template.destination)(answers);
      const destDir = path.dirname(destPath);

      // Ensure directory exists
      fs.mkdirSync(destDir, { recursive: true });

      // Read and compile template
      const templatePath = path.join(__dirname, '..', template.source);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateContent);
      const content = compiled(answers);

      // Write file
      fs.writeFileSync(destPath, content);
      console.log(`  Created: ${destPath}`);
    }
  }
}

const generator = new Generator();
generator.run().catch(console.error);
```

## Package.json Scripts

```json
{
  "scripts": {
    "generate": "plop",
    "generate:component": "plop component",
    "generate:api": "plop api",
    "generate:feature": "plop feature",
    "generate:page": "plop page",
    "generate:hook": "plop hook",
    "hygen": "hygen",
    "hygen:component": "hygen component new",
    "scaffold": "ts-node scripts/generate.ts"
  }
}
```

## CLAUDE.md Integration

```markdown
## Code Generation

### Available Generators
- `npm run generate` - Interactive generator menu
- `npm run generate:component` - Create React component
- `npm run generate:api` - Create API route
- `npm run generate:feature` - Create feature module
- `npm run generate:page` - Create Next.js page
- `npm run generate:hook` - Create custom hook

### Generator Options
Component types:
- functional - Standard component
- server - Server component
- client - Client component ('use client')

Feature includes:
- components, hooks, api, types, utils, store

### Templates Location
- `plop-templates/` - Plop templates
- `_templates/` - Hygen templates
- `templates/` - Custom generator templates
```

## AI Suggestions

1. **Smart scaffolding** - AI-generated boilerplate
2. **Pattern detection** - Learn from existing code
3. **Context awareness** - Adapt to project structure
4. **Code review** - Validate generated code
5. **Refactoring** - Update existing generators
6. **Documentation** - Auto-document generators
7. **Testing** - Generate test templates
8. **Versioning** - Track template changes
9. **Sharing** - Export/import generators
10. **Analytics** - Track generator usage
