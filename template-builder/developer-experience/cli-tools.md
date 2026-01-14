# CLI Tools Template

## Overview
Comprehensive CLI tool development with Commander.js, Yargs, Inquirer, and custom CLI frameworks for building developer tools.

## Quick Start
```bash
npm install commander chalk inquirer ora
npm install -D @types/inquirer tsup
```

## Commander.js CLI

### src/cli.ts
```typescript
#!/usr/bin/env node
// src/cli.ts

import { Command } from 'commander';
import chalk from 'chalk';
import { version } from '../package.json';

const program = new Command();

program
  .name('mytool')
  .description('My awesome CLI tool')
  .version(version, '-v, --version', 'Output the current version');

// Global options
program
  .option('-d, --debug', 'Enable debug mode')
  .option('-q, --quiet', 'Suppress output')
  .option('--no-color', 'Disable colored output')
  .option('-c, --config <path>', 'Path to config file');

// Init command
program
  .command('init')
  .description('Initialize a new project')
  .argument('[name]', 'Project name', 'my-project')
  .option('-t, --template <template>', 'Template to use', 'default')
  .option('--typescript', 'Use TypeScript', true)
  .option('--no-git', 'Skip git initialization')
  .action(async (name, options) => {
    const { init } = await import('./commands/init');
    await init(name, options);
  });

// Generate command
program
  .command('generate <type> [name]')
  .alias('g')
  .description('Generate a new resource')
  .option('-d, --dry-run', 'Preview changes without writing')
  .option('-f, --force', 'Overwrite existing files')
  .action(async (type, name, options) => {
    const { generate } = await import('./commands/generate');
    await generate(type, name, options);
  });

// Build command
program
  .command('build')
  .description('Build the project')
  .option('-w, --watch', 'Watch for changes')
  .option('--minify', 'Minify output')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .action(async (options) => {
    const { build } = await import('./commands/build');
    await build(options);
  });

// Dev command
program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('--host <host>', 'Host address', 'localhost')
  .option('--open', 'Open browser automatically')
  .action(async (options) => {
    const { dev } = await import('./commands/dev');
    await dev(options);
  });

// Config command with subcommands
const configCmd = program
  .command('config')
  .description('Manage configuration');

configCmd
  .command('get <key>')
  .description('Get a config value')
  .action(async (key) => {
    const { configGet } = await import('./commands/config');
    await configGet(key);
  });

configCmd
  .command('set <key> <value>')
  .description('Set a config value')
  .action(async (key, value) => {
    const { configSet } = await import('./commands/config');
    await configSet(key, value);
  });

configCmd
  .command('list')
  .description('List all config values')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const { configList } = await import('./commands/config');
    await configList(options);
  });

// Plugin command
program
  .command('plugin <action> [name]')
  .description('Manage plugins')
  .option('--registry <url>', 'Plugin registry URL')
  .action(async (action, name, options) => {
    const { plugin } = await import('./commands/plugin');
    await plugin(action, name, options);
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error) {
  if (error instanceof Error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
  process.exit(1);
}
```

### src/commands/init.ts
```typescript
// src/commands/init.ts

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';

interface InitOptions {
  template: string;
  typescript: boolean;
  git: boolean;
}

export async function init(name: string, options: InitOptions): Promise<void> {
  console.log(chalk.bold(`\nInitializing ${chalk.cyan(name)}...\n`));

  // Interactive prompts if needed
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: ['default', 'minimal', 'full'],
      default: options.template,
      when: !options.template || options.template === 'default'
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: 'Install dependencies?',
      default: true
    }
  ]);

  const config = { ...options, ...answers };
  const projectPath = path.resolve(process.cwd(), name);

  // Create project directory
  const spinner = ora('Creating project directory...').start();

  try {
    await fs.ensureDir(projectPath);
    spinner.succeed('Created project directory');
  } catch (error) {
    spinner.fail('Failed to create directory');
    throw error;
  }

  // Copy template files
  spinner.start('Copying template files...');
  const templatePath = path.join(__dirname, '..', 'templates', config.template);
  await fs.copy(templatePath, projectPath);
  spinner.succeed('Copied template files');

  // Initialize git
  if (config.git) {
    spinner.start('Initializing git repository...');
    await execa('git', ['init'], { cwd: projectPath });
    spinner.succeed('Initialized git repository');
  }

  // Install dependencies
  if (config.installDeps) {
    spinner.start('Installing dependencies...');
    await execa('npm', ['install'], { cwd: projectPath });
    spinner.succeed('Installed dependencies');
  }

  // Success message
  console.log(chalk.green(`\n✅ Project ${name} created successfully!\n`));
  console.log('Next steps:');
  console.log(chalk.cyan(`  cd ${name}`));
  console.log(chalk.cyan('  npm run dev'));
  console.log();
}
```

## Yargs CLI

### src/yargs-cli.ts
```typescript
#!/usr/bin/env node
// src/yargs-cli.ts

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

const cli = yargs(hideBin(process.argv))
  .scriptName('mytool')
  .usage('$0 <command> [options]')
  .version()
  .help()
  .alias('h', 'help')
  .alias('v', 'version')
  .strict()
  .demandCommand(1, 'You need to specify a command')
  .recommendCommands()
  .showHelpOnFail(true)
  .wrap(Math.min(100, yargs.terminalWidth()));

// Global options
cli.options({
  debug: {
    alias: 'd',
    type: 'boolean',
    description: 'Enable debug mode'
  },
  config: {
    alias: 'c',
    type: 'string',
    description: 'Path to config file'
  }
});

// Init command
cli.command(
  'init [name]',
  'Initialize a new project',
  (yargs) => {
    return yargs
      .positional('name', {
        type: 'string',
        default: 'my-project',
        description: 'Project name'
      })
      .options({
        template: {
          alias: 't',
          type: 'string',
          default: 'default',
          choices: ['default', 'minimal', 'full'],
          description: 'Template to use'
        },
        typescript: {
          type: 'boolean',
          default: true,
          description: 'Use TypeScript'
        },
        git: {
          type: 'boolean',
          default: true,
          description: 'Initialize git repository'
        }
      });
  },
  async (argv) => {
    const { init } = await import('./commands/init');
    await init(argv.name!, {
      template: argv.template!,
      typescript: argv.typescript!,
      git: argv.git!
    });
  }
);

// Generate command
cli.command(
  'generate <type> [name]',
  'Generate a resource',
  (yargs) => {
    return yargs
      .positional('type', {
        type: 'string',
        choices: ['component', 'page', 'api', 'hook'],
        description: 'Type of resource to generate'
      })
      .positional('name', {
        type: 'string',
        description: 'Name of the resource'
      })
      .options({
        'dry-run': {
          type: 'boolean',
          description: 'Preview without writing files'
        },
        force: {
          alias: 'f',
          type: 'boolean',
          description: 'Overwrite existing files'
        }
      });
  },
  async (argv) => {
    console.log(`Generating ${argv.type}: ${argv.name}`);
  }
);

// Build command
cli.command(
  'build',
  'Build the project',
  (yargs) => {
    return yargs.options({
      watch: {
        alias: 'w',
        type: 'boolean',
        description: 'Watch for changes'
      },
      minify: {
        type: 'boolean',
        default: true,
        description: 'Minify output'
      },
      output: {
        alias: 'o',
        type: 'string',
        default: 'dist',
        description: 'Output directory'
      }
    });
  },
  async (argv) => {
    console.log(`Building to ${argv.output}...`);
  }
);

// Middleware for debug mode
cli.middleware((argv) => {
  if (argv.debug) {
    console.log(chalk.gray('Debug mode enabled'));
    console.log(chalk.gray(`Arguments: ${JSON.stringify(argv)}`));
  }
});

// Error handling
cli.fail((msg, err, yargs) => {
  if (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    if (process.env.DEBUG) {
      console.error(err.stack);
    }
  } else if (msg) {
    console.error(chalk.red(msg));
    console.log();
    yargs.showHelp();
  }
  process.exit(1);
});

cli.parse();
```

## Interactive CLI with Inquirer

### src/interactive.ts
```typescript
// src/interactive.ts

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

interface ProjectConfig {
  name: string;
  template: string;
  features: string[];
  packageManager: string;
}

export async function runInteractive(): Promise<void> {
  console.log(chalk.bold('\n🚀 Project Setup Wizard\n'));

  // Basic info
  const basicInfo = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: 'my-project',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required';
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Use lowercase letters, numbers, and hyphens only';
        }
        return true;
      },
      transformer: (input: string) => input.toLowerCase().replace(/\s+/g, '-')
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: 'A new project'
    }
  ]);

  // Template selection with preview
  const templateChoice = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: [
        {
          name: `${chalk.cyan('Next.js')} - Full-stack React framework`,
          value: 'nextjs',
          short: 'Next.js'
        },
        {
          name: `${chalk.cyan('React + Vite')} - Fast SPA development`,
          value: 'react-vite',
          short: 'React + Vite'
        },
        {
          name: `${chalk.cyan('Express')} - Node.js API server`,
          value: 'express',
          short: 'Express'
        },
        new inquirer.Separator(),
        {
          name: `${chalk.gray('More templates...')}`,
          value: 'more'
        }
      ],
      loop: false
    }
  ]);

  // Feature selection
  const featureChoice = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to include:',
      choices: [
        { name: 'TypeScript', value: 'typescript', checked: true },
        { name: 'ESLint', value: 'eslint', checked: true },
        { name: 'Prettier', value: 'prettier', checked: true },
        new inquirer.Separator('--- Styling ---'),
        { name: 'Tailwind CSS', value: 'tailwind' },
        { name: 'Styled Components', value: 'styled-components' },
        { name: 'CSS Modules', value: 'css-modules' },
        new inquirer.Separator('--- Testing ---'),
        { name: 'Vitest', value: 'vitest' },
        { name: 'Playwright', value: 'playwright' },
        new inquirer.Separator('--- Other ---'),
        { name: 'Docker', value: 'docker' },
        { name: 'GitHub Actions', value: 'github-actions' }
      ],
      pageSize: 15
    }
  ]);

  // Package manager
  const pmChoice = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: [
        { name: 'pnpm (Recommended)', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
        { name: 'bun', value: 'bun' }
      ],
      default: 'pnpm'
    }
  ]);

  // Confirmation
  const config: ProjectConfig = {
    ...basicInfo,
    ...templateChoice,
    ...featureChoice,
    ...pmChoice
  };

  console.log(chalk.bold('\n📋 Configuration Summary:\n'));
  console.log(`  Name: ${chalk.cyan(config.name)}`);
  console.log(`  Template: ${chalk.cyan(config.template)}`);
  console.log(`  Features: ${chalk.cyan(config.features.join(', '))}`);
  console.log(`  Package Manager: ${chalk.cyan(config.packageManager)}`);
  console.log();

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Create project with these settings?',
      default: true
    }
  ]);

  if (!confirmed) {
    console.log(chalk.yellow('\nProject creation cancelled.'));
    return;
  }

  // Create project
  const spinner = ora('Creating project...').start();

  // Simulate creation
  await new Promise(resolve => setTimeout(resolve, 2000));

  spinner.succeed('Project created successfully!');

  console.log(chalk.green(`\n✅ Project ${config.name} is ready!\n`));
  console.log('Next steps:');
  console.log(chalk.cyan(`  cd ${config.name}`));
  console.log(chalk.cyan(`  ${config.packageManager} run dev`));
}
```

## CLI Framework

### src/framework/index.ts
```typescript
// src/framework/index.ts

import { EventEmitter } from 'events';
import chalk from 'chalk';

export interface CommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
  args?: ArgumentDefinition[];
  options?: OptionDefinition[];
  action: (args: Record<string, any>, options: Record<string, any>) => Promise<void>;
  subcommands?: CommandDefinition[];
}

export interface ArgumentDefinition {
  name: string;
  description: string;
  required?: boolean;
  default?: any;
}

export interface OptionDefinition {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'boolean' | 'number' | 'array';
  default?: any;
  required?: boolean;
  choices?: any[];
}

export interface CLIConfig {
  name: string;
  version: string;
  description: string;
  commands: CommandDefinition[];
  globalOptions?: OptionDefinition[];
  middleware?: Middleware[];
}

export type Middleware = (
  context: ExecutionContext,
  next: () => Promise<void>
) => Promise<void>;

export interface ExecutionContext {
  command: string;
  args: Record<string, any>;
  options: Record<string, any>;
  rawArgs: string[];
}

export class CLI extends EventEmitter {
  private config: CLIConfig;
  private commands: Map<string, CommandDefinition> = new Map();
  private middleware: Middleware[] = [];

  constructor(config: CLIConfig) {
    super();
    this.config = config;
    this.registerCommands(config.commands);
    this.middleware = config.middleware || [];
  }

  private registerCommands(
    commands: CommandDefinition[],
    prefix: string = ''
  ): void {
    for (const cmd of commands) {
      const fullName = prefix ? `${prefix}:${cmd.name}` : cmd.name;
      this.commands.set(fullName, cmd);

      // Register aliases
      cmd.aliases?.forEach(alias => {
        const aliasName = prefix ? `${prefix}:${alias}` : alias;
        this.commands.set(aliasName, cmd);
      });

      // Register subcommands
      if (cmd.subcommands) {
        this.registerCommands(cmd.subcommands, fullName);
      }
    }
  }

  async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    try {
      // Parse global options
      const { args, options } = this.parseArgs(argv, this.config.globalOptions);

      // Handle help
      if (options.help) {
        this.showHelp();
        return;
      }

      // Handle version
      if (options.version) {
        console.log(this.config.version);
        return;
      }

      // Find command
      const commandName = args[0];
      if (!commandName) {
        this.showHelp();
        return;
      }

      const command = this.commands.get(commandName);
      if (!command) {
        console.error(chalk.red(`Unknown command: ${commandName}`));
        this.showHelp();
        process.exit(1);
      }

      // Parse command args and options
      const cmdArgs = this.parseCommandArgs(args.slice(1), command.args);
      const cmdOptions = this.parseOptions(argv, command.options);

      // Create execution context
      const context: ExecutionContext = {
        command: commandName,
        args: cmdArgs,
        options: { ...options, ...cmdOptions },
        rawArgs: argv
      };

      // Run middleware chain
      await this.runMiddleware(context, async () => {
        await command.action(context.args, context.options);
      });

    } catch (error) {
      this.emit('error', error);
      if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  }

  private async runMiddleware(
    context: ExecutionContext,
    action: () => Promise<void>
  ): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index < this.middleware.length) {
        const mw = this.middleware[index++];
        await mw(context, next);
      } else {
        await action();
      }
    };

    await next();
  }

  private parseArgs(
    argv: string[],
    options?: OptionDefinition[]
  ): { args: string[]; options: Record<string, any> } {
    const args: string[] = [];
    const opts: Record<string, any> = {};

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];

      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const opt = options?.find(o => o.name === key);

        if (opt?.type === 'boolean') {
          opts[key] = true;
        } else {
          opts[key] = argv[++i];
        }
      } else if (arg.startsWith('-')) {
        const alias = arg.slice(1);
        const opt = options?.find(o => o.alias === alias);

        if (opt) {
          if (opt.type === 'boolean') {
            opts[opt.name] = true;
          } else {
            opts[opt.name] = argv[++i];
          }
        }
      } else {
        args.push(arg);
      }
    }

    return { args, options: opts };
  }

  private parseCommandArgs(
    args: string[],
    definitions?: ArgumentDefinition[]
  ): Record<string, any> {
    const result: Record<string, any> = {};

    definitions?.forEach((def, index) => {
      result[def.name] = args[index] ?? def.default;

      if (def.required && result[def.name] === undefined) {
        throw new Error(`Missing required argument: ${def.name}`);
      }
    });

    return result;
  }

  private parseOptions(
    argv: string[],
    definitions?: OptionDefinition[]
  ): Record<string, any> {
    const { options } = this.parseArgs(argv, definitions);

    // Apply defaults
    definitions?.forEach(def => {
      if (options[def.name] === undefined && def.default !== undefined) {
        options[def.name] = def.default;
      }
    });

    return options;
  }

  showHelp(): void {
    console.log(`\n${chalk.bold(this.config.name)} v${this.config.version}`);
    console.log(`${this.config.description}\n`);
    console.log(chalk.bold('Usage:'));
    console.log(`  ${this.config.name} <command> [options]\n`);
    console.log(chalk.bold('Commands:'));

    this.config.commands.forEach(cmd => {
      const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
      console.log(`  ${chalk.cyan(cmd.name)}${aliases}`);
      console.log(`    ${cmd.description}`);
    });

    console.log(chalk.bold('\nGlobal Options:'));
    console.log('  --help, -h     Show help');
    console.log('  --version, -v  Show version');
    console.log();
  }
}
```

## Package.json Configuration

```json
{
  "name": "mytool",
  "version": "1.0.0",
  "description": "My awesome CLI tool",
  "type": "module",
  "bin": {
    "mytool": "./dist/cli.js"
  },
  "files": [
    "dist",
    "templates"
  ],
  "scripts": {
    "build": "tsup src/cli.ts --format esm --dts",
    "dev": "tsup src/cli.ts --format esm --watch",
    "start": "node dist/cli.js",
    "test": "vitest"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "execa": "^8.0.0",
    "fs-extra": "^11.2.0",
    "inquirer": "^9.2.0",
    "ora": "^8.0.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.0",
    "@types/inquirer": "^9.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  }
}
```

## CLAUDE.md Integration

```markdown
## CLI Tools

### Structure
- `src/cli.ts` - Main entry point
- `src/commands/` - Command implementations
- `src/lib/` - Shared utilities
- `templates/` - Project templates

### Commands
- `mytool init [name]` - Initialize project
- `mytool generate <type>` - Generate resource
- `mytool build` - Build project
- `mytool dev` - Start development

### Development
```bash
npm run dev          # Watch mode
npm run build        # Build CLI
npm link             # Link for testing
```

### Testing
```bash
mytool --help
mytool init my-app
mytool generate component Button
```
```

## AI Suggestions

1. **Command completion** - Shell autocomplete
2. **Interactive mode** - Enhanced prompts
3. **Progress indicators** - Better UX
4. **Error messages** - Helpful error hints
5. **Plugin system** - Extensible commands
6. **Config management** - User preferences
7. **Update checker** - Version updates
8. **Analytics** - Usage tracking
9. **Documentation** - Auto-generated help
10. **Testing** - CLI testing utilities
