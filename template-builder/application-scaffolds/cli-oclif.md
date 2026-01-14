# Node.js CLI with oclif

## Overview

Enterprise-grade Node.js command-line interface using Salesforce's oclif framework with TypeScript. Features multi-command architecture, plugin system, auto-updating, topics/subtopics, hooks, flag inheritance, and comprehensive testing infrastructure.

## Quick Start

```bash
# Create new oclif project
npx oclif generate my-cli
cd my-cli

# Or manual setup
mkdir my-cli && cd my-cli
npm init -y

# Install dependencies
npm install @oclif/core @oclif/plugin-help @oclif/plugin-plugins @oclif/plugin-autocomplete \
  @oclif/plugin-not-found @oclif/plugin-warn-if-update-available
npm install chalk@4 inquirer@8 conf listr2 cli-table3 fast-glob fs-extra
npm install -D typescript @types/node @types/inquirer @types/fs-extra \
  @oclif/test @oclif/plugin-command-snapshot ts-node mocha @types/mocha chai @types/chai

# Generate command
npx oclif generate command init

# Build and run
npm run build
./bin/run init
```

## Project Structure

```
my-cli/
├── bin/
│   ├── dev.js                   # Development runner
│   ├── run.js                   # Production runner
│   └── run.cmd                  # Windows runner
├── src/
│   ├── index.ts                 # Entry point
│   ├── commands/
│   │   ├── init.ts              # Init command
│   │   ├── config/
│   │   │   ├── get.ts           # config:get subcommand
│   │   │   ├── set.ts           # config:set subcommand
│   │   │   └── list.ts          # config:list subcommand
│   │   ├── generate/
│   │   │   ├── index.ts         # generate (alias)
│   │   │   ├── component.ts     # generate:component
│   │   │   └── model.ts         # generate:model
│   │   └── plugins/
│   │       ├── add.ts           # plugins:add
│   │       └── remove.ts        # plugins:remove
│   ├── hooks/
│   │   ├── init/
│   │   │   └── telemetry.ts     # Telemetry hook
│   │   ├── prerun/
│   │   │   └── check-version.ts # Version check hook
│   │   └── postrun/
│   │       └── analytics.ts     # Analytics hook
│   ├── lib/
│   │   ├── config.ts            # Configuration manager
│   │   ├── base-command.ts      # Base command class
│   │   ├── generator.ts         # Code generator
│   │   └── prompts.ts           # Interactive prompts
│   └── types/
│       └── index.ts             # Type definitions
├── test/
│   ├── commands/
│   │   ├── init.test.ts
│   │   └── config/
│   │       └── get.test.ts
│   └── hooks/
│       └── init.test.ts
├── templates/
│   ├── component/
│   └── model/
├── package.json
├── tsconfig.json
├── .eslintrc
└── CLAUDE.md
```

## Configuration Files

### package.json

```json
{
  "name": "my-cli",
  "version": "1.0.0",
  "description": "Enterprise CLI built with oclif",
  "author": "Your Name",
  "license": "MIT",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "my-cli": "./bin/run.js"
  },
  "files": [
    "/bin",
    "/dist",
    "/templates",
    "/oclif.manifest.json"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "oclif": {
    "bin": "my-cli",
    "dirname": "my-cli",
    "commands": "./dist/commands",
    "hooks": {
      "init": "./dist/hooks/init",
      "prerun": "./dist/hooks/prerun",
      "postrun": "./dist/hooks/postrun"
    },
    "plugins": [
      "@oclif/plugin-help",
      "@oclif/plugin-plugins",
      "@oclif/plugin-autocomplete",
      "@oclif/plugin-not-found",
      "@oclif/plugin-warn-if-update-available"
    ],
    "topicSeparator": ":",
    "topics": {
      "config": {
        "description": "Manage CLI configuration"
      },
      "generate": {
        "description": "Generate code from templates"
      },
      "plugins": {
        "description": "Manage CLI plugins"
      }
    },
    "additionalHelpFlags": ["-h"],
    "additionalVersionFlags": ["-v"],
    "warn-if-update-available": {
      "timeoutInDays": 7,
      "message": "Update available: <%= current %> -> <%= latest %>"
    }
  },
  "scripts": {
    "build": "shx rm -rf dist && tsc -b",
    "dev": "ts-node --esm bin/dev.js",
    "lint": "eslint . --ext .ts",
    "postpack": "shx rm -f oclif.manifest.json",
    "prepack": "npm run build && oclif manifest && oclif readme",
    "test": "mocha --forbid-only \"test/**/*.test.ts\"",
    "test:watch": "mocha --watch \"test/**/*.test.ts\"",
    "version": "oclif readme && git add README.md"
  },
  "dependencies": {
    "@oclif/core": "^3.26.0",
    "@oclif/plugin-autocomplete": "^3.0.13",
    "@oclif/plugin-help": "^6.0.18",
    "@oclif/plugin-not-found": "^3.1.1",
    "@oclif/plugin-plugins": "^5.0.0",
    "@oclif/plugin-warn-if-update-available": "^3.0.14",
    "chalk": "^4.1.2",
    "cli-table3": "^0.6.4",
    "conf": "^12.0.0",
    "fs-extra": "^11.2.0",
    "inquirer": "^8.2.6",
    "listr2": "^8.2.1",
    "fast-glob": "^3.3.2"
  },
  "devDependencies": {
    "@oclif/test": "^3.2.6",
    "@types/chai": "^4.3.14",
    "@types/fs-extra": "^11.0.4",
    "@types/inquirer": "^8.2.10",
    "@types/mocha": "^10.0.6",
    "@types/node": "^20.12.7",
    "chai": "^4.4.1",
    "eslint": "^8.57.0",
    "mocha": "^10.4.0",
    "shx": "^0.3.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### bin/run.js

```javascript
#!/usr/bin/env node

import { execute } from '@oclif/core';

await execute({ dir: import.meta.url });
```

### bin/dev.js

```javascript
#!/usr/bin/env -S npx ts-node --esm

import { execute } from '@oclif/core';

await execute({ development: true, dir: import.meta.url });
```

## Core Implementation

### src/index.ts

```typescript
export { run } from '@oclif/core';
```

### src/lib/base-command.ts

```typescript
import { Command, Flags, Interfaces } from '@oclif/core';
import chalk from 'chalk';
import { ConfigManager } from './config.js';

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)['baseFlags'] & T['flags']
>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
  // Shared flags for all commands
  static baseFlags = {
    verbose: Flags.boolean({
      char: 'V',
      description: 'Enable verbose output',
      default: false,
    }),
    quiet: Flags.boolean({
      char: 'q',
      description: 'Suppress non-essential output',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output as JSON',
      default: false,
    }),
  };

  protected flags!: Flags<T>;
  protected args!: Args<T>;
  protected configManager!: ConfigManager;

  public async init(): Promise<void> {
    await super.init();
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      args: this.ctor.args,
      strict: this.ctor.strict,
    });
    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;
    this.configManager = ConfigManager.getInstance();
  }

  protected async catch(err: Error & { exitCode?: number }): Promise<void> {
    if (this.flags?.verbose) {
      this.error(err.stack || err.message, { exit: err.exitCode || 1 });
    } else {
      this.error(err.message, { exit: err.exitCode || 1 });
    }
  }

  protected success(message: string): void {
    if (!this.flags?.quiet) {
      this.log(chalk.green('✔'), message);
    }
  }

  protected info(message: string): void {
    if (!this.flags?.quiet) {
      this.log(chalk.blue('ℹ'), message);
    }
  }

  protected warn(message: string): void {
    this.log(chalk.yellow('⚠'), chalk.yellow(message));
  }

  protected debug(message: string): void {
    if (this.flags?.verbose) {
      this.log(chalk.dim(`[DEBUG] ${message}`));
    }
  }

  protected outputJson(data: unknown): void {
    if (this.flags?.json) {
      this.log(JSON.stringify(data, null, 2));
    }
  }
}
```

### src/lib/config.ts

```typescript
import Conf from 'conf';

interface ConfigSchema {
  theme: 'light' | 'dark' | 'auto';
  defaultTemplate: string;
  telemetry: boolean;
  editor: string;
  plugins: string[];
  aliases: Record<string, string>;
}

const defaults: ConfigSchema = {
  theme: 'auto',
  defaultTemplate: 'default',
  telemetry: true,
  editor: process.env.EDITOR || 'code',
  plugins: [],
  aliases: {},
};

export class ConfigManager {
  private static instance: ConfigManager;
  private store: Conf<ConfigSchema>;

  private constructor() {
    this.store = new Conf<ConfigSchema>({
      projectName: 'my-cli',
      defaults,
    });
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    return this.store.get(key);
  }

  set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void {
    this.store.set(key, value);
  }

  has(key: keyof ConfigSchema): boolean {
    return this.store.has(key);
  }

  delete(key: keyof ConfigSchema): void {
    this.store.delete(key);
  }

  getAll(): ConfigSchema {
    return this.store.store;
  }

  reset(): void {
    this.store.clear();
  }

  get path(): string {
    return this.store.path;
  }
}
```

### src/commands/init.ts

```typescript
import { Args, Flags } from '@oclif/core';
import inquirer from 'inquirer';
import { Listr } from 'listr2';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

import { BaseCommand } from '../lib/base-command.js';

interface Context {
  projectName: string;
  projectPath: string;
  template: string;
  typescript: boolean;
  packageManager: string;
}

export default class Init extends BaseCommand<typeof Init> {
  static description = 'Initialize a new project';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> my-project',
    '<%= config.bin %> <%= command.id %> my-project --template api --no-typescript',
  ];

  static flags = {
    template: Flags.string({
      char: 't',
      description: 'Template to use',
      options: ['default', 'api', 'library', 'fullstack'],
      default: 'default',
    }),
    typescript: Flags.boolean({
      description: 'Use TypeScript',
      default: true,
      allowNo: true,
    }),
    'package-manager': Flags.string({
      char: 'p',
      description: 'Package manager',
      options: ['npm', 'yarn', 'pnpm', 'bun'],
      default: 'npm',
    }),
    git: Flags.boolean({
      description: 'Initialize git repository',
      default: true,
      allowNo: true,
    }),
    install: Flags.boolean({
      char: 'i',
      description: 'Install dependencies',
      default: true,
      allowNo: true,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Overwrite existing directory',
      default: false,
    }),
  };

  static args = {
    name: Args.string({
      description: 'Project name',
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = this;

    // Interactive mode if no name provided
    let projectName = args.name;
    let options = { ...flags };

    if (!projectName) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: 'my-project',
          validate: (input: string) =>
            /^[a-z0-9][a-z0-9-_]*$/.test(input) || 'Invalid project name',
        },
        {
          type: 'list',
          name: 'template',
          message: 'Template:',
          choices: ['default', 'api', 'library', 'fullstack'],
          default: flags.template,
        },
        {
          type: 'confirm',
          name: 'typescript',
          message: 'Use TypeScript?',
          default: flags.typescript,
        },
        {
          type: 'list',
          name: 'packageManager',
          message: 'Package manager:',
          choices: ['npm', 'yarn', 'pnpm', 'bun'],
          default: flags['package-manager'],
        },
      ]);

      projectName = answers.name;
      options = { ...flags, ...answers };
    }

    const projectPath = path.resolve(process.cwd(), projectName!);

    // Check existing directory
    if (await fs.pathExists(projectPath)) {
      if (!flags.force) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Directory ${chalk.cyan(projectName)} exists. Overwrite?`,
            default: false,
          },
        ]);
        if (!overwrite) {
          this.info('Operation cancelled');
          return;
        }
      }
      await fs.remove(projectPath);
    }

    // Create project using Listr
    const tasks = new Listr<Context>(
      [
        {
          title: 'Creating project structure',
          task: async (ctx) => {
            await fs.ensureDir(ctx.projectPath);
            await this.generateTemplate(ctx);
          },
        },
        {
          title: 'Initializing git repository',
          enabled: () => flags.git,
          task: async (ctx) => {
            const { execSync } = await import('child_process');
            execSync('git init', { cwd: ctx.projectPath, stdio: 'pipe' });
            execSync('git add .', { cwd: ctx.projectPath, stdio: 'pipe' });
            execSync('git commit -m "Initial commit"', {
              cwd: ctx.projectPath,
              stdio: 'pipe',
            });
          },
        },
        {
          title: 'Installing dependencies',
          enabled: () => flags.install,
          task: async (ctx) => {
            const { execSync } = await import('child_process');
            const cmd = {
              npm: 'npm install',
              yarn: 'yarn',
              pnpm: 'pnpm install',
              bun: 'bun install',
            }[ctx.packageManager];

            execSync(cmd, { cwd: ctx.projectPath, stdio: 'pipe' });
          },
        },
      ],
      {
        concurrent: false,
        rendererOptions: {
          collapseSubtasks: false,
        },
      }
    );

    await tasks.run({
      projectName: projectName!,
      projectPath,
      template: options.template || 'default',
      typescript: options.typescript ?? true,
      packageManager: options['package-manager'] || 'npm',
    });

    this.log();
    this.success(`Project ${chalk.cyan(projectName)} created successfully!`);
    this.log();
    this.log(chalk.bold('Next steps:'));
    this.log(`  cd ${projectName}`);
    if (!flags.install) {
      this.log(`  ${options['package-manager'] || 'npm'} install`);
    }
    this.log(`  ${options['package-manager'] || 'npm'} run dev`);
  }

  private async generateTemplate(ctx: Context): Promise<void> {
    const { projectPath, projectName, typescript, template } = ctx;

    // Create basic structure
    const dirs = ['src', 'test'];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectPath, dir));
    }

    // Generate package.json
    const pkg = {
      name: projectName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: typescript ? 'tsx watch src/index.ts' : 'node --watch src/index.js',
        build: typescript ? 'tsc' : undefined,
        start: typescript ? 'node dist/index.js' : 'node src/index.js',
        test: 'vitest',
      },
    };

    await fs.writeJson(path.join(projectPath, 'package.json'), pkg, {
      spaces: 2,
    });

    // Generate entry file
    const ext = typescript ? 'ts' : 'js';
    await fs.writeFile(
      path.join(projectPath, `src/index.${ext}`),
      `console.log('Hello from ${projectName}!');\n`
    );

    // Generate tsconfig if TypeScript
    if (typescript) {
      await fs.writeJson(
        path.join(projectPath, 'tsconfig.json'),
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'Node16',
            moduleResolution: 'Node16',
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
          },
          include: ['src/**/*'],
        },
        { spaces: 2 }
      );
    }
  }
}
```

### src/commands/config/get.ts

```typescript
import { Args, Flags } from '@oclif/core';
import Table from 'cli-table3';
import chalk from 'chalk';

import { BaseCommand } from '../../lib/base-command.js';

export default class ConfigGet extends BaseCommand<typeof ConfigGet> {
  static description = 'Get configuration value(s)';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> theme',
    '<%= config.bin %> <%= command.id %> --all',
  ];

  static flags = {
    all: Flags.boolean({
      char: 'a',
      description: 'Show all configuration',
      default: false,
    }),
  };

  static args = {
    key: Args.string({
      description: 'Configuration key',
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = this;

    if (flags.all || !args.key) {
      const config = this.configManager.getAll();

      if (flags.json) {
        this.outputJson(config);
        return;
      }

      const table = new Table({
        head: [chalk.cyan('Key'), chalk.cyan('Value')],
        colWidths: [25, 50],
      });

      for (const [key, value] of Object.entries(config)) {
        table.push([key, JSON.stringify(value)]);
      }

      this.log(table.toString());
    } else {
      const value = this.configManager.get(args.key as any);

      if (value === undefined) {
        this.warn(`Configuration key '${args.key}' not found`);
        return;
      }

      if (flags.json) {
        this.outputJson({ [args.key]: value });
      } else {
        this.log(JSON.stringify(value, null, 2));
      }
    }
  }
}
```

### src/commands/config/set.ts

```typescript
import { Args } from '@oclif/core';
import chalk from 'chalk';

import { BaseCommand } from '../../lib/base-command.js';

export default class ConfigSet extends BaseCommand<typeof ConfigSet> {
  static description = 'Set configuration value';

  static examples = [
    '<%= config.bin %> <%= command.id %> theme dark',
    '<%= config.bin %> <%= command.id %> telemetry false',
  ];

  static args = {
    key: Args.string({
      description: 'Configuration key',
      required: true,
    }),
    value: Args.string({
      description: 'Configuration value',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args } = this;

    // Parse value
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(args.value);
    } catch {
      parsedValue = args.value;
    }

    this.configManager.set(args.key as any, parsedValue as any);
    this.success(`Set ${chalk.cyan(args.key)} = ${chalk.white(JSON.stringify(parsedValue))}`);
  }
}
```

### src/commands/config/list.ts

```typescript
import { Flags } from '@oclif/core';
import chalk from 'chalk';

import { BaseCommand } from '../../lib/base-command.js';

export default class ConfigList extends BaseCommand<typeof ConfigList> {
  static description = 'List all configuration values';

  static aliases = ['config'];

  static examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    const config = this.configManager.getAll();

    if (this.flags.json) {
      this.outputJson(config);
      return;
    }

    this.log(chalk.bold('\nCurrent Configuration:\n'));

    for (const [key, value] of Object.entries(config)) {
      this.log(`  ${chalk.cyan(key)}: ${chalk.white(JSON.stringify(value))}`);
    }

    this.log();
    this.log(chalk.dim(`Config file: ${this.configManager.path}`));
  }
}
```

### src/commands/generate/component.ts

```typescript
import { Args, Flags } from '@oclif/core';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

import { BaseCommand } from '../../lib/base-command.js';

export default class GenerateComponent extends BaseCommand<typeof GenerateComponent> {
  static description = 'Generate a React component';

  static examples = [
    '<%= config.bin %> <%= command.id %> Button',
    '<%= config.bin %> <%= command.id %> Header --style styled-components',
  ];

  static flags = {
    style: Flags.string({
      char: 's',
      description: 'Styling solution',
      options: ['css-modules', 'styled-components', 'tailwind', 'none'],
      default: 'css-modules',
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output directory',
      default: 'src/components',
    }),
    'with-test': Flags.boolean({
      description: 'Generate test file',
      default: true,
      allowNo: true,
    }),
    'with-story': Flags.boolean({
      description: 'Generate Storybook story',
      default: false,
    }),
  };

  static args = {
    name: Args.string({
      description: 'Component name (PascalCase)',
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = this;

    let name = args.name;

    if (!name) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Component name:',
          validate: (input: string) =>
            /^[A-Z][a-zA-Z0-9]*$/.test(input) || 'Must be PascalCase',
        },
      ]);
      name = answer.name;
    }

    const componentDir = path.join(flags.output, name!);
    await fs.ensureDir(componentDir);

    // Generate component file
    const componentContent = this.generateComponent(name!, flags.style);
    await fs.writeFile(
      path.join(componentDir, `${name}.tsx`),
      componentContent
    );

    // Generate style file
    if (flags.style === 'css-modules') {
      await fs.writeFile(
        path.join(componentDir, `${name}.module.css`),
        `.root {\n  /* Add styles */\n}\n`
      );
    }

    // Generate index file
    await fs.writeFile(
      path.join(componentDir, 'index.ts'),
      `export { ${name} } from './${name}';\nexport type { ${name}Props } from './${name}';\n`
    );

    // Generate test file
    if (flags['with-test']) {
      const testContent = this.generateTest(name!);
      await fs.writeFile(
        path.join(componentDir, `${name}.test.tsx`),
        testContent
      );
    }

    // Generate story file
    if (flags['with-story']) {
      const storyContent = this.generateStory(name!);
      await fs.writeFile(
        path.join(componentDir, `${name}.stories.tsx`),
        storyContent
      );
    }

    this.success(`Generated component ${chalk.cyan(name)}`);
    this.log();
    this.log(chalk.bold('Created files:'));
    this.log(`  ${chalk.dim('•')} ${componentDir}/${name}.tsx`);
    if (flags.style === 'css-modules') {
      this.log(`  ${chalk.dim('•')} ${componentDir}/${name}.module.css`);
    }
    this.log(`  ${chalk.dim('•')} ${componentDir}/index.ts`);
    if (flags['with-test']) {
      this.log(`  ${chalk.dim('•')} ${componentDir}/${name}.test.tsx`);
    }
    if (flags['with-story']) {
      this.log(`  ${chalk.dim('•')} ${componentDir}/${name}.stories.tsx`);
    }
  }

  private generateComponent(name: string, style: string): string {
    const styleImport =
      style === 'css-modules'
        ? `import styles from './${name}.module.css';\n`
        : style === 'styled-components'
          ? `import styled from 'styled-components';\n`
          : '';

    const className =
      style === 'css-modules'
        ? 'className={styles.root}'
        : style === 'tailwind'
          ? 'className="flex items-center"'
          : '';

    return `import React from 'react';
${styleImport}
export interface ${name}Props {
  children?: React.ReactNode;
}

export const ${name}: React.FC<${name}Props> = ({ children }) => {
  return (
    <div ${className}>
      {children}
    </div>
  );
};
`;
  }

  private generateTest(name: string): string {
    return `import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders children', () => {
    render(<${name}>Hello</${name}>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
`;
  }

  private generateStory(name: string): string {
    return `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${name}>;

export const Default: Story = {
  args: {
    children: 'Hello World',
  },
};
`;
  }
}
```

### src/hooks/init/telemetry.ts

```typescript
import { Hook } from '@oclif/core';
import { ConfigManager } from '../../lib/config.js';

const hook: Hook<'init'> = async function () {
  const config = ConfigManager.getInstance();

  if (config.get('telemetry')) {
    // Initialize telemetry
    this.debug('Telemetry enabled');
  }
};

export default hook;
```

### src/hooks/prerun/check-version.ts

```typescript
import { Hook } from '@oclif/core';
import chalk from 'chalk';

const hook: Hook<'prerun'> = async function (options) {
  // Skip version check for certain commands
  const skipCommands = ['update', 'version', 'help'];
  if (skipCommands.some((cmd) => options.Command.id.includes(cmd))) {
    return;
  }

  // Check for updates (handled by plugin-warn-if-update-available)
  this.debug(`Running command: ${options.Command.id}`);
};

export default hook;
```

## Testing

### test/commands/init.test.ts

```typescript
import { expect, test } from '@oclif/test';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('init', () => {
  const testDir = path.join(os.tmpdir(), 'oclif-test');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    process.chdir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  test
    .stdout()
    .command(['init', 'test-project', '--no-install', '--no-git'])
    .it('creates a new project', (ctx) => {
      expect(ctx.stdout).to.contain('created successfully');
      expect(fs.existsSync(path.join(testDir, 'test-project'))).to.be.true;
    });

  test
    .stdout()
    .command(['init', 'test-project', '--no-typescript', '--no-install', '--no-git'])
    .it('creates JavaScript project', async () => {
      const indexPath = path.join(testDir, 'test-project', 'src', 'index.js');
      expect(fs.existsSync(indexPath)).to.be.true;
    });

  test
    .stdout()
    .command(['init', 'test-project', '--template', 'api', '--no-install', '--no-git'])
    .it('uses specified template', (ctx) => {
      expect(ctx.stdout).to.contain('created successfully');
    });
});
```

### test/commands/config/get.test.ts

```typescript
import { expect, test } from '@oclif/test';

describe('config:get', () => {
  test
    .stdout()
    .command(['config:get', 'theme'])
    .it('gets a config value', (ctx) => {
      expect(ctx.stdout).to.contain('auto');
    });

  test
    .stdout()
    .command(['config:get', '--all'])
    .it('shows all config', (ctx) => {
      expect(ctx.stdout).to.contain('theme');
      expect(ctx.stdout).to.contain('telemetry');
    });

  test
    .stdout()
    .command(['config:get', '--json'])
    .it('outputs JSON format', (ctx) => {
      const config = JSON.parse(ctx.stdout);
      expect(config).to.have.property('theme');
    });
});
```

## CLAUDE.md Integration

```markdown
# oclif CLI Project

## Commands
- `npm run dev -- <command>` - Run in development
- `npm run build` - Build TypeScript
- `npx oclif generate command <name>` - Generate new command
- `npm test` - Run tests

## Architecture
- oclif for CLI framework
- Commands in src/commands/
- Hooks in src/hooks/
- Shared code in src/lib/
- Base command class for shared flags

## Adding Commands
1. `npx oclif generate command name`
2. Or create file in src/commands/
3. Extend BaseCommand for shared functionality
4. Add to appropriate topic directory for subcommands

## Topics
- config: - Configuration management
- generate: - Code generation
- plugins: - Plugin management

## Testing
Use @oclif/test for command testing
```

## AI Suggestions

1. **Command Aliases** - Add common aliases (g for generate, c for config) using static aliases property
2. **Autocomplete Enhancement** - Create custom completions for dynamic values like template names
3. **Plugin Marketplace** - Build plugin discovery and installation from registry
4. **Command Recording** - Record and replay command sequences for automation
5. **Interactive Shell** - Add REPL mode with tab completion for rapid command execution
6. **Custom Renderers** - Implement Listr custom renderers for CI environments
7. **Telemetry Dashboard** - Build usage analytics dashboard for monitoring CLI adoption
8. **Command Caching** - Cache expensive operations with TTL for faster subsequent runs
9. **Error Reporting** - Integrate Sentry or similar for automatic error tracking
10. **Migration System** - Add config migration system for breaking changes between versions
