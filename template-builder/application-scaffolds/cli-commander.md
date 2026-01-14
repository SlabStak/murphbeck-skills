# Node.js CLI with Commander.js

## Overview

Production-ready Node.js command-line interface using Commander.js with TypeScript, featuring subcommands, interactive prompts, configuration management, colored output, progress indicators, and comprehensive testing. Includes plugin architecture for extensibility.

## Quick Start

```bash
# Create project
mkdir my-cli && cd my-cli
npm init -y

# Install dependencies
npm install commander chalk@4 ora@5 inquirer@8 conf cosmiconfig dotenv figlet boxen update-notifier
npm install -D typescript @types/node @types/inquirer @types/figlet @types/update-notifier \
  tsup vitest @vitest/coverage-v8 eslint prettier

# Initialize TypeScript
npx tsc --init

# Create directory structure
mkdir -p src/{commands,lib,utils,plugins} tests/{unit,integration,e2e}

# Build and link
npm run build
npm link
```

## Project Structure

```
my-cli/
├── src/
│   ├── index.ts                 # Entry point
│   ├── cli.ts                   # CLI setup
│   ├── commands/
│   │   ├── index.ts             # Command registry
│   │   ├── init.ts              # Init command
│   │   ├── config.ts            # Config command
│   │   ├── generate.ts          # Generate command
│   │   └── plugin.ts            # Plugin command
│   ├── lib/
│   │   ├── config.ts            # Configuration manager
│   │   ├── logger.ts            # Logging utility
│   │   ├── prompt.ts            # Interactive prompts
│   │   └── plugin-loader.ts     # Plugin system
│   ├── utils/
│   │   ├── fs.ts                # File system utilities
│   │   ├── template.ts          # Template engine
│   │   ├── spinner.ts           # Progress spinner
│   │   └── validation.ts        # Input validation
│   └── plugins/
│       └── example-plugin.ts    # Example plugin
├── tests/
│   ├── unit/
│   │   ├── config.test.ts
│   │   └── utils.test.ts
│   ├── integration/
│   │   └── commands.test.ts
│   └── e2e/
│       └── cli.test.ts
├── templates/
│   └── default/
│       ├── package.json.hbs
│       └── index.ts.hbs
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .eslintrc.cjs
└── CLAUDE.md
```

## Configuration Files

### package.json

```json
{
  "name": "my-cli",
  "version": "1.0.0",
  "description": "Production CLI built with Commander.js",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "my-cli": "./dist/index.js"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./plugins": {
      "import": "./dist/plugins/index.js",
      "types": "./dist/plugins/index.d.ts"
    }
  },
  "files": [
    "dist",
    "templates"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test"
  },
  "dependencies": {
    "chalk": "^4.1.2",
    "commander": "^12.1.0",
    "conf": "^12.0.0",
    "cosmiconfig": "^9.0.0",
    "dotenv": "^16.4.5",
    "figlet": "^1.7.0",
    "inquirer": "^8.2.6",
    "ora": "^5.4.1",
    "boxen": "^5.1.2",
    "update-notifier": "^6.0.2",
    "handlebars": "^4.7.8",
    "glob": "^10.3.10",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "@types/figlet": "^1.5.8",
    "@types/fs-extra": "^11.0.4",
    "@types/inquirer": "^8.2.10",
    "@types/node": "^20.12.7",
    "@types/update-notifier": "^6.0.8",
    "@vitest/coverage-v8": "^1.5.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5",
    "tsup": "^8.0.2",
    "typescript": "^5.4.5",
    "vitest": "^1.5.0"
  },
  "keywords": [
    "cli",
    "command-line",
    "commander",
    "typescript"
  ]
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
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
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/index': 'src/plugins/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node18',
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['fsevents'],
  esbuildOptions(options) {
    options.footer = {
      js: '// Built with tsup',
    };
  },
});
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['tests/**', 'dist/**', '*.config.*'],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

## Core Implementation

### src/index.ts

```typescript
#!/usr/bin/env node

import { cli } from './cli.js';

async function main(): Promise<void> {
  try {
    await cli.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

main();
```

### src/cli.ts

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';
import { generateCommand } from './commands/generate.js';
import { pluginCommand } from './commands/plugin.js';
import { Logger } from './lib/logger.js';
import { loadPlugins } from './lib/plugin-loader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

// Check for updates
const notifier = updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 });
if (notifier.update) {
  console.log(
    boxen(
      `Update available: ${chalk.dim(notifier.update.current)} → ${chalk.green(notifier.update.latest)}
Run ${chalk.cyan('npm install -g ' + pkg.name)} to update`,
      { padding: 1, margin: 1, borderColor: 'yellow', borderStyle: 'round' }
    )
  );
}

export const cli = new Command();

cli
  .name('my-cli')
  .description(chalk.cyan(figlet.textSync('My CLI', { horizontalLayout: 'fitted' })) + '\n\n' + pkg.description)
  .version(pkg.version, '-v, --version', 'Output the current version')
  .option('-d, --debug', 'Enable debug mode', false)
  .option('-q, --quiet', 'Suppress output', false)
  .option('-c, --config <path>', 'Path to config file')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    if (options.debug) {
      process.env.DEBUG = 'true';
      Logger.setLevel('debug');
    }
    if (options.quiet) {
      Logger.setLevel('error');
    }
  });

// Register built-in commands
cli.addCommand(initCommand);
cli.addCommand(configCommand);
cli.addCommand(generateCommand);
cli.addCommand(pluginCommand);

// Load and register plugins
await loadPlugins(cli);

// Help command customization
cli.configureHelp({
  sortSubcommands: true,
  sortOptions: true,
  subcommandTerm: (cmd) => chalk.cyan(cmd.name()) + ' ' + chalk.dim(cmd.usage()),
});

// Error handling
cli.showHelpAfterError('(add --help for additional information)');
cli.showSuggestionAfterError(true);

// Custom help
cli.addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('$')} my-cli init my-project
  ${chalk.dim('$')} my-cli generate component --name Button
  ${chalk.dim('$')} my-cli config set theme dark
  ${chalk.dim('$')} my-cli plugin add @my-cli/plugin-docker

${chalk.bold('Documentation:')}
  ${chalk.blue('https://my-cli.dev/docs')}
`);
```

### src/commands/init.ts

```typescript
import { Command, Option } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';

import { Logger } from '../lib/logger.js';
import { Spinner } from '../utils/spinner.js';
import { TemplateEngine } from '../utils/template.js';
import { validateProjectName } from '../utils/validation.js';

interface InitOptions {
  template: string;
  typescript: boolean;
  git: boolean;
  install: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  force: boolean;
}

export const initCommand = new Command('init')
  .description('Initialize a new project')
  .argument('[name]', 'Project name')
  .option('-t, --template <name>', 'Template to use', 'default')
  .option('--typescript', 'Use TypeScript', true)
  .option('--no-typescript', 'Use JavaScript')
  .option('--git', 'Initialize git repository', true)
  .option('--no-git', 'Skip git initialization')
  .option('-i, --install', 'Install dependencies', true)
  .option('--no-install', 'Skip dependency installation')
  .addOption(
    new Option('-p, --package-manager <pm>', 'Package manager to use')
      .choices(['npm', 'yarn', 'pnpm', 'bun'])
      .default('npm')
  )
  .option('-f, --force', 'Overwrite existing directory', false)
  .action(async (name: string | undefined, options: InitOptions) => {
    const logger = Logger.getInstance();
    const spinner = new Spinner();

    try {
      // Interactive prompts if name not provided
      let projectName = name;
      let answers: Partial<InitOptions> = {};

      if (!projectName) {
        const response = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: 'What is your project name?',
            default: 'my-project',
            validate: validateProjectName,
          },
          {
            type: 'list',
            name: 'template',
            message: 'Which template would you like to use?',
            choices: [
              { name: 'Default - Basic project structure', value: 'default' },
              { name: 'API - REST API with Express', value: 'api' },
              { name: 'Library - NPM package', value: 'library' },
              { name: 'Full-stack - Next.js application', value: 'fullstack' },
            ],
            default: options.template,
          },
          {
            type: 'confirm',
            name: 'typescript',
            message: 'Use TypeScript?',
            default: options.typescript,
          },
          {
            type: 'list',
            name: 'packageManager',
            message: 'Which package manager?',
            choices: ['npm', 'yarn', 'pnpm', 'bun'],
            default: options.packageManager,
          },
        ]);

        projectName = response.projectName;
        answers = response;
      }

      const finalOptions = { ...options, ...answers };
      const projectPath = path.resolve(process.cwd(), projectName!);

      // Check if directory exists
      if (await fs.pathExists(projectPath)) {
        if (!finalOptions.force) {
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: `Directory ${chalk.cyan(projectName)} already exists. Overwrite?`,
              default: false,
            },
          ]);

          if (!overwrite) {
            logger.info('Operation cancelled');
            return;
          }
        }
        await fs.remove(projectPath);
      }

      // Create project
      spinner.start('Creating project structure...');
      await fs.ensureDir(projectPath);

      // Generate from template
      const templateEngine = new TemplateEngine();
      await templateEngine.generate(finalOptions.template, projectPath, {
        projectName: projectName!,
        typescript: finalOptions.typescript,
        packageManager: finalOptions.packageManager,
        version: '1.0.0',
        author: process.env.USER || 'developer',
      });
      spinner.succeed('Project structure created');

      // Initialize git
      if (finalOptions.git) {
        spinner.start('Initializing git repository...');
        const { execSync } = await import('child_process');
        execSync('git init', { cwd: projectPath, stdio: 'pipe' });
        execSync('git add .', { cwd: projectPath, stdio: 'pipe' });
        execSync('git commit -m "Initial commit"', { cwd: projectPath, stdio: 'pipe' });
        spinner.succeed('Git repository initialized');
      }

      // Install dependencies
      if (finalOptions.install) {
        spinner.start('Installing dependencies...');
        const { execSync } = await import('child_process');
        const installCmd = {
          npm: 'npm install',
          yarn: 'yarn',
          pnpm: 'pnpm install',
          bun: 'bun install',
        }[finalOptions.packageManager];

        execSync(installCmd, { cwd: projectPath, stdio: 'pipe' });
        spinner.succeed('Dependencies installed');
      }

      // Success message
      console.log('\n' + chalk.green('✨ Project created successfully!') + '\n');
      console.log(chalk.bold('Next steps:'));
      console.log(chalk.dim('  $') + ` cd ${projectName}`);

      if (!finalOptions.install) {
        const installCmd = {
          npm: 'npm install',
          yarn: 'yarn',
          pnpm: 'pnpm install',
          bun: 'bun install',
        }[finalOptions.packageManager];
        console.log(chalk.dim('  $') + ` ${installCmd}`);
      }

      console.log(chalk.dim('  $') + ` ${finalOptions.packageManager} run dev\n`);

    } catch (error) {
      spinner.fail('Project creation failed');
      throw error;
    }
  });
```

### src/commands/config.ts

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';

import { ConfigManager, ConfigKey } from '../lib/config.js';
import { Logger } from '../lib/logger.js';

export const configCommand = new Command('config')
  .description('Manage CLI configuration');

configCommand
  .command('get [key]')
  .description('Get configuration value(s)')
  .option('-a, --all', 'Show all configuration')
  .action(async (key: string | undefined, options: { all?: boolean }) => {
    const config = ConfigManager.getInstance();
    const logger = Logger.getInstance();

    if (options.all || !key) {
      const allConfig = config.getAll();
      console.log(chalk.bold('\nCurrent Configuration:\n'));

      for (const [k, v] of Object.entries(allConfig)) {
        console.log(`  ${chalk.cyan(k)}: ${chalk.white(JSON.stringify(v))}`);
      }
      console.log();
    } else {
      const value = config.get(key as ConfigKey);
      if (value !== undefined) {
        console.log(JSON.stringify(value, null, 2));
      } else {
        logger.warn(`Configuration key '${key}' not found`);
      }
    }
  });

configCommand
  .command('set <key> <value>')
  .description('Set configuration value')
  .action(async (key: string, value: string) => {
    const config = ConfigManager.getInstance();
    const logger = Logger.getInstance();

    try {
      // Try to parse as JSON
      let parsedValue: unknown;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }

      config.set(key as ConfigKey, parsedValue);
      logger.success(`Set ${chalk.cyan(key)} = ${chalk.white(JSON.stringify(parsedValue))}`);
    } catch (error) {
      logger.error(`Failed to set configuration: ${(error as Error).message}`);
    }
  });

configCommand
  .command('delete <key>')
  .description('Delete configuration value')
  .action(async (key: string) => {
    const config = ConfigManager.getInstance();
    const logger = Logger.getInstance();

    if (config.has(key as ConfigKey)) {
      config.delete(key as ConfigKey);
      logger.success(`Deleted configuration key '${chalk.cyan(key)}'`);
    } else {
      logger.warn(`Configuration key '${key}' not found`);
    }
  });

configCommand
  .command('reset')
  .description('Reset configuration to defaults')
  .option('-f, --force', 'Skip confirmation')
  .action(async (options: { force?: boolean }) => {
    const config = ConfigManager.getInstance();
    const logger = Logger.getInstance();

    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset all configuration?',
          default: false,
        },
      ]);

      if (!confirm) {
        logger.info('Operation cancelled');
        return;
      }
    }

    config.reset();
    logger.success('Configuration reset to defaults');
  });

configCommand
  .command('path')
  .description('Show configuration file path')
  .action(() => {
    const config = ConfigManager.getInstance();
    console.log(config.path);
  });
```

### src/commands/generate.ts

```typescript
import { Command, Option } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';

import { Logger } from '../lib/logger.js';
import { Spinner } from '../utils/spinner.js';
import { TemplateEngine } from '../utils/template.js';

interface GenerateOptions {
  name: string;
  output: string;
  force: boolean;
  dry: boolean;
}

const generators = {
  component: {
    description: 'Generate a React component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name:',
        validate: (input: string) => /^[A-Z][a-zA-Z0-9]*$/.test(input) || 'Must be PascalCase',
      },
      {
        type: 'list',
        name: 'style',
        message: 'Styling solution:',
        choices: ['CSS Modules', 'Styled Components', 'Tailwind', 'None'],
      },
    ],
  },
  hook: {
    description: 'Generate a React hook',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Hook name (without use prefix):',
        validate: (input: string) => /^[a-z][a-zA-Z0-9]*$/.test(input) || 'Must be camelCase',
      },
    ],
  },
  api: {
    description: 'Generate an API endpoint',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Endpoint name:',
      },
      {
        type: 'checkbox',
        name: 'methods',
        message: 'HTTP methods:',
        choices: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        default: ['GET'],
      },
    ],
  },
  model: {
    description: 'Generate a database model',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Model name:',
        validate: (input: string) => /^[A-Z][a-zA-Z0-9]*$/.test(input) || 'Must be PascalCase',
      },
      {
        type: 'editor',
        name: 'fields',
        message: 'Define fields (JSON format):',
        default: '{\n  "id": "uuid",\n  "createdAt": "datetime"\n}',
      },
    ],
  },
};

export const generateCommand = new Command('generate')
  .alias('g')
  .description('Generate code from templates')
  .argument('<type>', `Type to generate: ${Object.keys(generators).join(', ')}`)
  .option('-n, --name <name>', 'Name of the generated item')
  .option('-o, --output <path>', 'Output directory', '.')
  .option('-f, --force', 'Overwrite existing files', false)
  .option('--dry', 'Dry run - show what would be generated', false)
  .action(async (type: keyof typeof generators, options: GenerateOptions) => {
    const logger = Logger.getInstance();
    const spinner = new Spinner();

    if (!generators[type]) {
      logger.error(`Unknown generator type: ${type}`);
      logger.info(`Available types: ${Object.keys(generators).join(', ')}`);
      return;
    }

    const generator = generators[type];

    // Gather options via prompts
    const answers = await inquirer.prompt(
      generator.prompts.filter((p) => !options[p.name as keyof GenerateOptions])
    );

    const finalOptions = { ...options, ...answers };

    if (options.dry) {
      console.log(chalk.bold('\nDry Run - Would generate:\n'));
      console.log(chalk.cyan(`  Type: ${type}`));
      console.log(chalk.cyan(`  Options: ${JSON.stringify(finalOptions, null, 2)}`));
      return;
    }

    try {
      spinner.start(`Generating ${type}...`);

      const templateEngine = new TemplateEngine();
      const outputPath = path.resolve(process.cwd(), finalOptions.output);

      const files = await templateEngine.generateType(type, outputPath, finalOptions);

      spinner.succeed(`Generated ${type}`);

      console.log(chalk.bold('\nCreated files:'));
      for (const file of files) {
        console.log(chalk.dim('  •') + ` ${path.relative(process.cwd(), file)}`);
      }
      console.log();

    } catch (error) {
      spinner.fail(`Failed to generate ${type}`);
      throw error;
    }
  });
```

### src/lib/config.ts

```typescript
import Conf from 'conf';
import { cosmiconfig } from 'cosmiconfig';
import path from 'path';

export type ConfigKey =
  | 'theme'
  | 'defaultTemplate'
  | 'packageManager'
  | 'gitInit'
  | 'installDeps'
  | 'plugins'
  | 'telemetry'
  | 'editor'
  | 'outputFormat';

interface ConfigSchema {
  theme: 'light' | 'dark' | 'auto';
  defaultTemplate: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  gitInit: boolean;
  installDeps: boolean;
  plugins: string[];
  telemetry: boolean;
  editor: string;
  outputFormat: 'table' | 'json' | 'yaml';
}

const defaults: ConfigSchema = {
  theme: 'auto',
  defaultTemplate: 'default',
  packageManager: 'npm',
  gitInit: true,
  installDeps: true,
  plugins: [],
  telemetry: true,
  editor: process.env.EDITOR || 'code',
  outputFormat: 'table',
};

export class ConfigManager {
  private static instance: ConfigManager;
  private store: Conf<ConfigSchema>;
  private projectConfig: Partial<ConfigSchema> | null = null;

  private constructor() {
    this.store = new Conf<ConfigSchema>({
      projectName: 'my-cli',
      defaults,
      schema: {
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'auto'],
        },
        defaultTemplate: {
          type: 'string',
        },
        packageManager: {
          type: 'string',
          enum: ['npm', 'yarn', 'pnpm', 'bun'],
        },
        gitInit: {
          type: 'boolean',
        },
        installDeps: {
          type: 'boolean',
        },
        plugins: {
          type: 'array',
          items: { type: 'string' },
        },
        telemetry: {
          type: 'boolean',
        },
        editor: {
          type: 'string',
        },
        outputFormat: {
          type: 'string',
          enum: ['table', 'json', 'yaml'],
        },
      },
    });
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async loadProjectConfig(dir: string = process.cwd()): Promise<void> {
    const explorer = cosmiconfig('my-cli');
    try {
      const result = await explorer.search(dir);
      if (result && !result.isEmpty) {
        this.projectConfig = result.config as Partial<ConfigSchema>;
      }
    } catch {
      // No project config found
    }
  }

  get<K extends ConfigKey>(key: K): ConfigSchema[K] {
    // Project config takes precedence
    if (this.projectConfig && key in this.projectConfig) {
      return this.projectConfig[key] as ConfigSchema[K];
    }
    return this.store.get(key);
  }

  set<K extends ConfigKey>(key: K, value: ConfigSchema[K]): void {
    this.store.set(key, value);
  }

  has(key: ConfigKey): boolean {
    return this.store.has(key);
  }

  delete(key: ConfigKey): void {
    this.store.delete(key);
  }

  reset(): void {
    this.store.clear();
  }

  getAll(): ConfigSchema {
    const stored = this.store.store;
    return { ...stored, ...this.projectConfig };
  }

  get path(): string {
    return this.store.path;
  }
}
```

### src/lib/logger.ts

```typescript
import chalk from 'chalk';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export class Logger {
  private static instance: Logger;
  private static level: LogLevel = 'info';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  static setLevel(level: LogLevel): void {
    Logger.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return levels[level] >= levels[Logger.level];
  }

  private timestamp(): string {
    return chalk.dim(`[${new Date().toISOString()}]`);
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(
        this.timestamp(),
        chalk.magenta('DEBUG'),
        message,
        ...args
      );
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(chalk.blue('ℹ'), message, ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(chalk.green('✔'), message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(chalk.yellow('⚠'), chalk.yellow(message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(chalk.red('✖'), chalk.red(message), ...args);
    }
  }

  table(data: Record<string, unknown>[] | Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.table(data);
    }
  }

  json(data: unknown): void {
    if (this.shouldLog('info')) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  newline(): void {
    if (this.shouldLog('info')) {
      console.log();
    }
  }

  box(message: string, title?: string): void {
    if (this.shouldLog('info')) {
      const lines = message.split('\n');
      const maxLength = Math.max(...lines.map((l) => l.length), title?.length || 0);
      const border = '─'.repeat(maxLength + 2);

      console.log(`┌${border}┐`);
      if (title) {
        console.log(`│ ${chalk.bold(title.padEnd(maxLength))} │`);
        console.log(`├${border}┤`);
      }
      for (const line of lines) {
        console.log(`│ ${line.padEnd(maxLength)} │`);
      }
      console.log(`└${border}┘`);
    }
  }
}
```

### src/lib/plugin-loader.ts

```typescript
import { Command } from 'commander';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs-extra';

import { ConfigManager } from './config.js';
import { Logger } from './logger.js';

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  register: (cli: Command) => void | Promise<void>;
}

export async function loadPlugins(cli: Command): Promise<void> {
  const config = ConfigManager.getInstance();
  const logger = Logger.getInstance();
  const plugins = config.get('plugins');

  for (const pluginName of plugins) {
    try {
      let plugin: Plugin;

      // Check if it's a local plugin
      if (pluginName.startsWith('./') || pluginName.startsWith('/')) {
        const pluginPath = path.resolve(process.cwd(), pluginName);
        const pluginUrl = pathToFileURL(pluginPath).href;
        const module = await import(pluginUrl);
        plugin = module.default || module;
      } else {
        // npm package
        const module = await import(pluginName);
        plugin = module.default || module;
      }

      if (typeof plugin.register !== 'function') {
        logger.warn(`Plugin '${pluginName}' does not export a register function`);
        continue;
      }

      await plugin.register(cli);
      logger.debug(`Loaded plugin: ${plugin.name}@${plugin.version}`);

    } catch (error) {
      logger.warn(`Failed to load plugin '${pluginName}': ${(error as Error).message}`);
    }
  }
}

export async function installPlugin(name: string): Promise<void> {
  const logger = Logger.getInstance();
  const { execSync } = await import('child_process');

  try {
    execSync(`npm install -g ${name}`, { stdio: 'pipe' });

    const config = ConfigManager.getInstance();
    const plugins = config.get('plugins');

    if (!plugins.includes(name)) {
      config.set('plugins', [...plugins, name]);
    }

    logger.success(`Installed plugin: ${name}`);
  } catch (error) {
    throw new Error(`Failed to install plugin: ${(error as Error).message}`);
  }
}

export async function uninstallPlugin(name: string): Promise<void> {
  const logger = Logger.getInstance();
  const { execSync } = await import('child_process');

  try {
    execSync(`npm uninstall -g ${name}`, { stdio: 'pipe' });

    const config = ConfigManager.getInstance();
    const plugins = config.get('plugins');

    config.set('plugins', plugins.filter((p) => p !== name));

    logger.success(`Uninstalled plugin: ${name}`);
  } catch (error) {
    throw new Error(`Failed to uninstall plugin: ${(error as Error).message}`);
  }
}

export async function listPlugins(): Promise<Plugin[]> {
  const config = ConfigManager.getInstance();
  const pluginNames = config.get('plugins');
  const plugins: Plugin[] = [];

  for (const name of pluginNames) {
    try {
      const module = await import(name);
      const plugin = module.default || module;
      plugins.push({
        name: plugin.name || name,
        version: plugin.version || 'unknown',
        description: plugin.description,
        register: plugin.register,
      });
    } catch {
      plugins.push({
        name,
        version: 'error',
        description: 'Failed to load',
        register: () => {},
      });
    }
  }

  return plugins;
}
```

### src/utils/spinner.ts

```typescript
import ora, { Ora } from 'ora';
import chalk from 'chalk';

export class Spinner {
  private spinner: Ora;
  private isCI: boolean;

  constructor() {
    this.isCI = Boolean(process.env.CI);
    this.spinner = ora({
      spinner: 'dots',
      color: 'cyan',
      hideCursor: true,
    });
  }

  start(text: string): this {
    if (this.isCI) {
      console.log(chalk.cyan('→'), text);
    } else {
      this.spinner.start(text);
    }
    return this;
  }

  update(text: string): this {
    if (this.isCI) {
      console.log(chalk.cyan('→'), text);
    } else {
      this.spinner.text = text;
    }
    return this;
  }

  succeed(text?: string): this {
    if (this.isCI) {
      console.log(chalk.green('✔'), text || this.spinner.text);
    } else {
      this.spinner.succeed(text);
    }
    return this;
  }

  fail(text?: string): this {
    if (this.isCI) {
      console.log(chalk.red('✖'), text || this.spinner.text);
    } else {
      this.spinner.fail(text);
    }
    return this;
  }

  warn(text?: string): this {
    if (this.isCI) {
      console.log(chalk.yellow('⚠'), text || this.spinner.text);
    } else {
      this.spinner.warn(text);
    }
    return this;
  }

  info(text?: string): this {
    if (this.isCI) {
      console.log(chalk.blue('ℹ'), text || this.spinner.text);
    } else {
      this.spinner.info(text);
    }
    return this;
  }

  stop(): this {
    if (!this.isCI) {
      this.spinner.stop();
    }
    return this;
  }

  clear(): this {
    if (!this.isCI) {
      this.spinner.clear();
    }
    return this;
  }
}

export async function withSpinner<T>(
  text: string,
  fn: () => Promise<T>
): Promise<T> {
  const spinner = new Spinner();
  spinner.start(text);

  try {
    const result = await fn();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}
```

### src/utils/template.ts

```typescript
import Handlebars from 'handlebars';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Register Handlebars helpers
Handlebars.registerHelper('lowercase', (str: string) => str.toLowerCase());
Handlebars.registerHelper('uppercase', (str: string) => str.toUpperCase());
Handlebars.registerHelper('capitalize', (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1)
);
Handlebars.registerHelper('camelCase', (str: string) =>
  str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
);
Handlebars.registerHelper('kebabCase', (str: string) =>
  str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
);
Handlebars.registerHelper('pascalCase', (str: string) =>
  str.replace(/(^|-)([a-z])/g, (g) => g.toUpperCase()).replace(/-/g, '')
);
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
Handlebars.registerHelper('or', (...args: unknown[]) =>
  args.slice(0, -1).some(Boolean)
);
Handlebars.registerHelper('and', (...args: unknown[]) =>
  args.slice(0, -1).every(Boolean)
);

export interface TemplateContext {
  projectName: string;
  typescript?: boolean;
  packageManager?: string;
  version?: string;
  author?: string;
  [key: string]: unknown;
}

export class TemplateEngine {
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '../../templates');
  }

  async generate(
    templateName: string,
    outputDir: string,
    context: TemplateContext
  ): Promise<string[]> {
    const templateDir = path.join(this.templatesDir, templateName);

    if (!(await fs.pathExists(templateDir))) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const files = await glob('**/*', {
      cwd: templateDir,
      nodir: true,
      dot: true,
    });

    const createdFiles: string[] = [];

    for (const file of files) {
      const sourcePath = path.join(templateDir, file);
      let destPath = path.join(outputDir, file);

      // Process filename templates
      destPath = this.processFilename(destPath, context);

      // Remove .hbs extension
      if (destPath.endsWith('.hbs')) {
        destPath = destPath.slice(0, -4);
      }

      await fs.ensureDir(path.dirname(destPath));

      const content = await fs.readFile(sourcePath, 'utf-8');

      // Check if it's a Handlebars template
      if (file.endsWith('.hbs') || content.includes('{{')) {
        const template = Handlebars.compile(content);
        await fs.writeFile(destPath, template(context));
      } else {
        await fs.copyFile(sourcePath, destPath);
      }

      createdFiles.push(destPath);
    }

    return createdFiles;
  }

  async generateType(
    type: string,
    outputDir: string,
    context: TemplateContext
  ): Promise<string[]> {
    const typeTemplateDir = path.join(this.templatesDir, 'generators', type);

    if (!(await fs.pathExists(typeTemplateDir))) {
      // Use inline templates for common types
      return this.generateInlineType(type, outputDir, context);
    }

    return this.generate(`generators/${type}`, outputDir, context);
  }

  private async generateInlineType(
    type: string,
    outputDir: string,
    context: TemplateContext
  ): Promise<string[]> {
    const templates: Record<string, { filename: string; content: string }[]> = {
      component: [
        {
          filename: '{{pascalCase name}}/{{pascalCase name}}.tsx',
          content: `import React from 'react';
import styles from './{{pascalCase name}}.module.css';

export interface {{pascalCase name}}Props {
  children?: React.ReactNode;
}

export const {{pascalCase name}}: React.FC<{{pascalCase name}}Props> = ({ children }) => {
  return (
    <div className={styles.root}>
      {children}
    </div>
  );
};
`,
        },
        {
          filename: '{{pascalCase name}}/{{pascalCase name}}.module.css',
          content: `.root {
  /* Add styles */
}
`,
        },
        {
          filename: '{{pascalCase name}}/index.ts',
          content: `export { {{pascalCase name}} } from './{{pascalCase name}}';
export type { {{pascalCase name}}Props } from './{{pascalCase name}}';
`,
        },
      ],
      hook: [
        {
          filename: 'use{{pascalCase name}}.ts',
          content: `import { useState, useCallback } from 'react';

export function use{{pascalCase name}}() {
  const [state, setState] = useState(null);

  const action = useCallback(() => {
    // Implementation
  }, []);

  return { state, action };
}
`,
        },
      ],
    };

    const typeTemplates = templates[type];
    if (!typeTemplates) {
      throw new Error(`No inline template for type '${type}'`);
    }

    const createdFiles: string[] = [];

    for (const { filename, content } of typeTemplates) {
      const processedFilename = this.processFilename(
        path.join(outputDir, filename),
        context
      );

      await fs.ensureDir(path.dirname(processedFilename));

      const template = Handlebars.compile(content);
      await fs.writeFile(processedFilename, template(context));

      createdFiles.push(processedFilename);
    }

    return createdFiles;
  }

  private processFilename(filename: string, context: TemplateContext): string {
    const template = Handlebars.compile(filename);
    return template(context);
  }

  async listTemplates(): Promise<string[]> {
    const dirs = await fs.readdir(this.templatesDir);
    const templates: string[] = [];

    for (const dir of dirs) {
      const stat = await fs.stat(path.join(this.templatesDir, dir));
      if (stat.isDirectory() && dir !== 'generators') {
        templates.push(dir);
      }
    }

    return templates;
  }
}
```

### src/utils/validation.ts

```typescript
export function validateProjectName(input: string): true | string {
  if (!input || input.trim().length === 0) {
    return 'Project name is required';
  }

  if (!/^[a-z0-9][a-z0-9-_]*$/.test(input)) {
    return 'Project name must start with lowercase letter or number and contain only lowercase letters, numbers, hyphens, and underscores';
  }

  if (input.length > 214) {
    return 'Project name must be less than 214 characters';
  }

  const reserved = [
    'node_modules',
    'favicon.ico',
    'package.json',
    'package-lock.json',
  ];

  if (reserved.includes(input)) {
    return `'${input}' is a reserved name`;
  }

  return true;
}

export function validatePackageName(input: string): true | string {
  if (!input || input.trim().length === 0) {
    return 'Package name is required';
  }

  // Scoped package
  if (input.startsWith('@')) {
    const match = input.match(/^@([^/]+)\/([^/]+)$/);
    if (!match) {
      return 'Invalid scoped package name format. Use @scope/name';
    }
    const [, scope, name] = match;
    const scopeResult = validatePackageName(scope);
    if (scopeResult !== true) return `Invalid scope: ${scopeResult}`;
    const nameResult = validatePackageName(name);
    if (nameResult !== true) return `Invalid name: ${nameResult}`;
    return true;
  }

  if (!/^[a-z0-9][a-z0-9._-]*$/.test(input)) {
    return 'Package name must start with lowercase letter or number';
  }

  if (input.length > 214) {
    return 'Package name must be less than 214 characters';
  }

  return true;
}

export function validateEmail(input: string): true | string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(input)) {
    return 'Please enter a valid email address';
  }

  return true;
}

export function validateUrl(input: string): true | string {
  try {
    new URL(input);
    return true;
  } catch {
    return 'Please enter a valid URL';
  }
}

export function validatePort(input: string): true | string {
  const port = parseInt(input, 10);

  if (isNaN(port)) {
    return 'Port must be a number';
  }

  if (port < 1 || port > 65535) {
    return 'Port must be between 1 and 65535';
  }

  return true;
}

export function validateSemver(input: string): true | string {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;

  if (!semverRegex.test(input)) {
    return 'Please enter a valid semantic version (e.g., 1.0.0)';
  }

  return true;
}
```

## Testing

### tests/unit/config.test.ts

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../../src/lib/config.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('ConfigManager', () => {
  let configDir: string;

  beforeEach(() => {
    configDir = path.join(os.tmpdir(), `cli-test-${Date.now()}`);
    process.env.XDG_CONFIG_HOME = configDir;
  });

  afterEach(async () => {
    await fs.remove(configDir);
  });

  it('should return default values', () => {
    const config = ConfigManager.getInstance();
    expect(config.get('theme')).toBe('auto');
    expect(config.get('packageManager')).toBe('npm');
  });

  it('should set and get values', () => {
    const config = ConfigManager.getInstance();
    config.set('theme', 'dark');
    expect(config.get('theme')).toBe('dark');
  });

  it('should delete values', () => {
    const config = ConfigManager.getInstance();
    config.set('theme', 'dark');
    config.delete('theme');
    expect(config.get('theme')).toBe('auto'); // Returns default
  });

  it('should reset to defaults', () => {
    const config = ConfigManager.getInstance();
    config.set('theme', 'dark');
    config.set('packageManager', 'pnpm');
    config.reset();
    expect(config.get('theme')).toBe('auto');
    expect(config.get('packageManager')).toBe('npm');
  });
});
```

### tests/integration/commands.test.ts

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('CLI Commands', () => {
  let testDir: string;
  const cliPath = path.resolve(__dirname, '../../dist/index.js');

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `cli-integration-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  const runCli = (args: string): string => {
    return execSync(`node ${cliPath} ${args}`, {
      cwd: testDir,
      encoding: 'utf-8',
    });
  };

  describe('init command', () => {
    it('should create project structure', () => {
      runCli('init test-project --no-install --no-git --template default');

      const projectPath = path.join(testDir, 'test-project');
      expect(fs.existsSync(projectPath)).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
    });

    it('should fail with invalid project name', () => {
      expect(() => {
        runCli('init "Invalid Name"');
      }).toThrow();
    });
  });

  describe('config command', () => {
    it('should set and get config values', () => {
      runCli('config set theme dark');
      const output = runCli('config get theme');
      expect(output).toContain('dark');
    });

    it('should show all config', () => {
      const output = runCli('config get --all');
      expect(output).toContain('theme');
      expect(output).toContain('packageManager');
    });
  });

  describe('help', () => {
    it('should show help', () => {
      const output = runCli('--help');
      expect(output).toContain('Usage:');
      expect(output).toContain('Commands:');
    });

    it('should show version', () => {
      const output = runCli('--version');
      expect(output).toMatch(/\d+\.\d+\.\d+/);
    });
  });
});
```

## Example Plugin

### src/plugins/example-plugin.ts

```typescript
import { Command } from 'commander';
import type { Plugin } from '../lib/plugin-loader.js';

const plugin: Plugin = {
  name: '@my-cli/plugin-docker',
  version: '1.0.0',
  description: 'Docker integration for my-cli',

  register(cli: Command): void {
    const docker = new Command('docker')
      .description('Docker-related commands');

    docker
      .command('init')
      .description('Initialize Docker configuration')
      .option('--compose', 'Include docker-compose.yml')
      .action(async (options) => {
        console.log('Initializing Docker configuration...');
        // Implementation
      });

    docker
      .command('build')
      .description('Build Docker image')
      .option('-t, --tag <tag>', 'Image tag', 'latest')
      .action(async (options) => {
        console.log(`Building Docker image with tag: ${options.tag}`);
        // Implementation
      });

    cli.addCommand(docker);
  },
};

export default plugin;
```

## CLAUDE.md Integration

```markdown
# CLI Project

## Commands
- `npm run dev` - Watch mode development
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm link` - Link for local testing

## Architecture
- Commander.js for argument parsing
- Inquirer for interactive prompts
- Handlebars for templates
- Conf for configuration storage
- Plugin architecture for extensibility

## Adding Commands
1. Create command file in src/commands/
2. Export Command instance
3. Import and add to cli.ts

## Adding Generators
1. Create template in templates/generators/<type>/
2. Or add inline template in src/utils/template.ts
3. Register in src/commands/generate.ts

## Testing
- Unit tests in tests/unit/
- Integration tests in tests/integration/
- E2E tests in tests/e2e/

## Plugin Development
Plugins must export: { name, version, register(cli) }
```

## AI Suggestions

1. **Shell Completions** - Add bash/zsh/fish completion scripts using Commander's createCompletionScript or omelette library
2. **Telemetry** - Implement opt-in anonymous usage analytics using PostHog or Amplitude
3. **Self-Update** - Add `self-update` command using pkg-install for seamless CLI updates
4. **Offline Mode** - Cache templates locally for offline project generation
5. **Project Detection** - Auto-detect project type and suggest relevant commands/generators
6. **Interactive Mode** - Add REPL mode using vorpal or similar for continuous interaction
7. **Output Formats** - Support JSON/YAML output for CI/CD integration with `--json` flag
8. **Config Profiles** - Support multiple config profiles (work, personal) with profile switching
9. **Undo/Rollback** - Track changes and provide undo capability for generated files
10. **AI Integration** - Add optional AI-powered code generation using OpenAI/Anthropic APIs
