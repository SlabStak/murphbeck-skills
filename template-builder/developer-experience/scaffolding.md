# Project Scaffolding Template

## Overview
Comprehensive project scaffolding with create-* CLIs, Yeoman generators, and custom project templates for rapid project initialization.

## Quick Start
```bash
# Create React App
npx create-react-app my-app --template typescript

# Create Next.js App
npx create-next-app@latest my-app

# Create Vite App
npm create vite@latest my-app

# Yeoman
npm install -g yo
yo
```

## Custom Create CLI

### packages/create-app/package.json
```json
{
  "name": "create-mycompany-app",
  "version": "1.0.0",
  "description": "Create a new MyCompany application",
  "bin": {
    "create-mycompany-app": "./dist/index.js"
  },
  "files": [
    "dist",
    "templates"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs --dts",
    "dev": "tsup src/index.ts --format cjs --watch",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "inquirer": "^9.2.0",
    "ora": "^8.0.0",
    "fs-extra": "^11.2.0",
    "handlebars": "^4.7.8",
    "execa": "^8.0.0",
    "validate-npm-package-name": "^5.0.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.0",
    "@types/inquirer": "^9.0.0",
    "@types/validate-npm-package-name": "^4.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  }
}
```

### packages/create-app/src/index.ts
```typescript
#!/usr/bin/env node
// packages/create-app/src/index.ts

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { execa } from 'execa';
import validatePackageName from 'validate-npm-package-name';

interface ProjectConfig {
  name: string;
  template: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  typescript: boolean;
  eslint: boolean;
  prettier: boolean;
  tailwind: boolean;
  testing: boolean;
  git: boolean;
  installDeps: boolean;
}

const TEMPLATES = {
  nextjs: {
    name: 'Next.js',
    description: 'Full-stack React framework',
    features: ['App Router', 'Server Components', 'API Routes']
  },
  react: {
    name: 'React + Vite',
    description: 'React SPA with Vite',
    features: ['Fast HMR', 'ESBuild', 'TypeScript']
  },
  express: {
    name: 'Express API',
    description: 'REST API with Express',
    features: ['TypeScript', 'OpenAPI', 'Prisma']
  },
  fullstack: {
    name: 'Full Stack',
    description: 'Next.js + tRPC + Prisma',
    features: ['Type-safe API', 'Database', 'Auth']
  },
  library: {
    name: 'Library',
    description: 'NPM package with tsup',
    features: ['ESM + CJS', 'Types', 'Vitest']
  }
};

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('create-mycompany-app')
    .description('Create a new MyCompany application')
    .version('1.0.0')
    .argument('[project-name]', 'Name of the project')
    .option('-t, --template <template>', 'Project template')
    .option('--typescript', 'Use TypeScript', true)
    .option('--no-typescript', 'Use JavaScript')
    .option('--eslint', 'Add ESLint', true)
    .option('--prettier', 'Add Prettier', true)
    .option('--tailwind', 'Add Tailwind CSS')
    .option('--testing', 'Add testing setup')
    .option('--no-git', 'Skip git initialization')
    .option('--no-install', 'Skip dependency installation')
    .option('-p, --package-manager <pm>', 'Package manager (npm, yarn, pnpm)')
    .action(async (projectName, options) => {
      console.log(chalk.bold('\n🚀 Create MyCompany App\n'));

      const config = await promptConfig(projectName, options);
      await createProject(config);
    });

  program.parse();
}

async function promptConfig(
  projectName?: string,
  options?: Partial<ProjectConfig>
): Promise<ProjectConfig> {
  const questions: inquirer.QuestionCollection = [];

  if (!projectName) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: 'my-app',
      validate: (input: string) => {
        const result = validatePackageName(input);
        if (!result.validForNewPackages) {
          return result.errors?.[0] || 'Invalid package name';
        }
        if (fs.existsSync(input)) {
          return `Directory "${input}" already exists`;
        }
        return true;
      }
    });
  }

  if (!options?.template) {
    questions.push({
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: Object.entries(TEMPLATES).map(([key, value]) => ({
        name: `${value.name} - ${value.description}`,
        value: key,
        short: value.name
      }))
    });
  }

  questions.push(
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: [
        { name: 'pnpm (Recommended)', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' }
      ],
      default: 'pnpm',
      when: !options?.packageManager
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Use TypeScript?',
      default: true,
      when: options?.typescript === undefined
    },
    {
      type: 'confirm',
      name: 'tailwind',
      message: 'Add Tailwind CSS?',
      default: true,
      when: options?.tailwind === undefined
    },
    {
      type: 'confirm',
      name: 'testing',
      message: 'Add testing setup (Vitest)?',
      default: true,
      when: options?.testing === undefined
    }
  );

  const answers = await inquirer.prompt(questions);

  return {
    name: projectName || answers.name,
    template: options?.template || answers.template,
    packageManager: options?.packageManager || answers.packageManager,
    typescript: options?.typescript ?? answers.typescript ?? true,
    eslint: options?.eslint ?? true,
    prettier: options?.prettier ?? true,
    tailwind: options?.tailwind ?? answers.tailwind ?? false,
    testing: options?.testing ?? answers.testing ?? false,
    git: options?.git ?? true,
    installDeps: options?.installDeps ?? true
  };
}

async function createProject(config: ProjectConfig): Promise<void> {
  const projectPath = path.resolve(process.cwd(), config.name);
  const templatePath = path.join(__dirname, '..', 'templates', config.template);

  console.log();

  // Create directory
  const spinner = ora('Creating project directory...').start();
  await fs.ensureDir(projectPath);
  spinner.succeed('Created project directory');

  // Copy template files
  spinner.start('Copying template files...');
  await copyTemplateFiles(templatePath, projectPath, config);
  spinner.succeed('Copied template files');

  // Generate configuration files
  spinner.start('Generating configuration...');
  await generateConfig(projectPath, config);
  spinner.succeed('Generated configuration');

  // Initialize git
  if (config.git) {
    spinner.start('Initializing git repository...');
    await execa('git', ['init'], { cwd: projectPath });
    await fs.writeFile(
      path.join(projectPath, '.gitignore'),
      generateGitignore(config)
    );
    spinner.succeed('Initialized git repository');
  }

  // Install dependencies
  if (config.installDeps) {
    spinner.start('Installing dependencies...');
    const installCmd = {
      npm: 'npm install',
      yarn: 'yarn',
      pnpm: 'pnpm install'
    }[config.packageManager];

    await execa(installCmd.split(' ')[0], installCmd.split(' ').slice(1), {
      cwd: projectPath
    });
    spinner.succeed('Installed dependencies');
  }

  // Print success message
  console.log(chalk.green('\n✅ Project created successfully!\n'));
  console.log('Next steps:');
  console.log(chalk.cyan(`  cd ${config.name}`));

  if (!config.installDeps) {
    const installCmd = {
      npm: 'npm install',
      yarn: 'yarn',
      pnpm: 'pnpm install'
    }[config.packageManager];
    console.log(chalk.cyan(`  ${installCmd}`));
  }

  console.log(chalk.cyan(`  ${config.packageManager} run dev`));
  console.log();
}

async function copyTemplateFiles(
  templatePath: string,
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const files = await fs.readdir(templatePath, { recursive: true });

  for (const file of files) {
    const srcPath = path.join(templatePath, file as string);
    const stats = await fs.stat(srcPath);

    if (stats.isDirectory()) continue;

    let destPath = path.join(projectPath, file as string);

    // Handle template files
    if (destPath.endsWith('.hbs')) {
      destPath = destPath.slice(0, -4);
      const template = await fs.readFile(srcPath, 'utf-8');
      const compiled = Handlebars.compile(template);
      const content = compiled(config);
      await fs.ensureDir(path.dirname(destPath));
      await fs.writeFile(destPath, content);
    } else {
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(srcPath, destPath);
    }
  }
}

async function generateConfig(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  // Generate package.json
  const packageJson = generatePackageJson(config);
  await fs.writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Generate tsconfig.json
  if (config.typescript) {
    await fs.writeFile(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(generateTsConfig(config), null, 2)
    );
  }

  // Generate ESLint config
  if (config.eslint) {
    await fs.writeFile(
      path.join(projectPath, 'eslint.config.js'),
      generateEslintConfig(config)
    );
  }

  // Generate Prettier config
  if (config.prettier) {
    await fs.writeFile(
      path.join(projectPath, 'prettier.config.js'),
      generatePrettierConfig()
    );
  }

  // Generate Tailwind config
  if (config.tailwind) {
    await fs.writeFile(
      path.join(projectPath, 'tailwind.config.js'),
      generateTailwindConfig(config)
    );
  }
}

function generatePackageJson(config: ProjectConfig): Record<string, any> {
  const pkg: Record<string, any> = {
    name: config.name,
    version: '0.0.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'eslint .',
      'lint:fix': 'eslint . --fix',
      format: 'prettier --write .',
      typecheck: 'tsc --noEmit'
    },
    dependencies: {},
    devDependencies: {}
  };

  // Add dependencies based on template
  if (config.template === 'nextjs' || config.template === 'fullstack') {
    pkg.dependencies = {
      next: '^14.1.0',
      react: '^18.2.0',
      'react-dom': '^18.2.0'
    };
  }

  // Add dev dependencies
  if (config.typescript) {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      typescript: '^5.3.0',
      '@types/node': '^20.0.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0'
    };
  }

  if (config.eslint) {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      eslint: '^8.56.0',
      '@typescript-eslint/eslint-plugin': '^6.0.0',
      '@typescript-eslint/parser': '^6.0.0'
    };
  }

  if (config.prettier) {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      prettier: '^3.2.0'
    };
  }

  if (config.tailwind) {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      tailwindcss: '^3.4.0',
      postcss: '^8.4.0',
      autoprefixer: '^10.4.0'
    };
  }

  if (config.testing) {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      vitest: '^1.2.0',
      '@testing-library/react': '^14.0.0',
      '@vitejs/plugin-react': '^4.2.0'
    };
    pkg.scripts.test = 'vitest run';
    pkg.scripts['test:watch'] = 'vitest';
    pkg.scripts['test:coverage'] = 'vitest run --coverage';
  }

  return pkg;
}

function generateTsConfig(config: ProjectConfig): Record<string, any> {
  return {
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./src/*']
      }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  };
}

function generateEslintConfig(config: ProjectConfig): string {
  return `import js from '@eslint/js';
${config.typescript ? "import typescript from '@typescript-eslint/eslint-plugin';\nimport typescriptParser from '@typescript-eslint/parser';" : ''}

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error'
    }
  }
];
`;
}

function generatePrettierConfig(): string {
  return `export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 100
};
`;
}

function generateTailwindConfig(config: ProjectConfig): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
`;
}

function generateGitignore(config: ProjectConfig): string {
  return `# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/

# Testing
coverage/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo
`;
}

main().catch(console.error);
```

## Yeoman Generator

### generator-myapp/generators/app/index.js
```javascript
// generator-myapp/generators/app/index.js
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.argument('appname', {
      type: String,
      required: false,
      description: 'Project name'
    });

    this.option('typescript', {
      type: Boolean,
      default: true,
      description: 'Use TypeScript'
    });
  }

  async prompting() {
    this.log(yosay(
      `Welcome to the ${chalk.red('MyApp')} generator!`
    ));

    const prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: this.options.appname || 'my-app'
      },
      {
        type: 'list',
        name: 'template',
        message: 'Select template:',
        choices: [
          { name: 'Next.js App', value: 'nextjs' },
          { name: 'React + Vite', value: 'react' },
          { name: 'Express API', value: 'express' },
          { name: 'Full Stack', value: 'fullstack' }
        ]
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features:',
        choices: [
          { name: 'TypeScript', value: 'typescript', checked: true },
          { name: 'ESLint', value: 'eslint', checked: true },
          { name: 'Prettier', value: 'prettier', checked: true },
          { name: 'Tailwind CSS', value: 'tailwind' },
          { name: 'Testing (Vitest)', value: 'testing' },
          { name: 'Husky + lint-staged', value: 'husky' }
        ]
      },
      {
        type: 'list',
        name: 'packageManager',
        message: 'Package manager:',
        choices: ['pnpm', 'npm', 'yarn'],
        default: 'pnpm'
      }
    ];

    this.answers = await this.prompt(prompts);
  }

  writing() {
    const { name, template, features } = this.answers;

    // Set destination
    this.destinationRoot(this.destinationPath(name));

    // Copy template files
    this.fs.copyTpl(
      this.templatePath(`${template}/**/*`),
      this.destinationPath(),
      {
        name,
        features,
        hasFeature: (feature) => features.includes(feature)
      },
      {},
      { globOptions: { dot: true } }
    );

    // Generate package.json
    const pkg = {
      name,
      version: '0.0.0',
      private: true,
      scripts: this._getScripts(template, features),
      dependencies: this._getDependencies(template, features),
      devDependencies: this._getDevDependencies(template, features)
    };

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    // Generate config files
    if (features.includes('typescript')) {
      this.fs.copyTpl(
        this.templatePath('configs/tsconfig.json'),
        this.destinationPath('tsconfig.json'),
        { template }
      );
    }

    if (features.includes('eslint')) {
      this.fs.copyTpl(
        this.templatePath('configs/eslint.config.js'),
        this.destinationPath('eslint.config.js'),
        { features }
      );
    }

    if (features.includes('tailwind')) {
      this.fs.copyTpl(
        this.templatePath('configs/tailwind.config.js'),
        this.destinationPath('tailwind.config.js'),
        {}
      );
    }
  }

  install() {
    const { packageManager } = this.answers;

    this.log('\nInstalling dependencies...\n');

    if (packageManager === 'pnpm') {
      this.spawnCommandSync('pnpm', ['install']);
    } else if (packageManager === 'yarn') {
      this.spawnCommandSync('yarn');
    } else {
      this.spawnCommandSync('npm', ['install']);
    }
  }

  end() {
    const { name, packageManager } = this.answers;
    const runCmd = packageManager === 'npm' ? 'npm run' : packageManager;

    this.log(chalk.green('\n✅ Project created successfully!\n'));
    this.log('Next steps:');
    this.log(chalk.cyan(`  cd ${name}`));
    this.log(chalk.cyan(`  ${runCmd} dev`));
    this.log();
  }

  _getScripts(template, features) {
    const scripts = {
      dev: template === 'nextjs' ? 'next dev' : 'vite',
      build: template === 'nextjs' ? 'next build' : 'vite build',
      start: template === 'nextjs' ? 'next start' : 'vite preview'
    };

    if (features.includes('eslint')) {
      scripts.lint = 'eslint .';
      scripts['lint:fix'] = 'eslint . --fix';
    }

    if (features.includes('prettier')) {
      scripts.format = 'prettier --write .';
    }

    if (features.includes('typescript')) {
      scripts.typecheck = 'tsc --noEmit';
    }

    if (features.includes('testing')) {
      scripts.test = 'vitest run';
      scripts['test:watch'] = 'vitest';
    }

    return scripts;
  }

  _getDependencies(template, features) {
    const deps = {};

    if (template === 'nextjs') {
      Object.assign(deps, {
        next: '^14.1.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      });
    }

    return deps;
  }

  _getDevDependencies(template, features) {
    const devDeps = {};

    if (features.includes('typescript')) {
      Object.assign(devDeps, {
        typescript: '^5.3.0',
        '@types/node': '^20.0.0',
        '@types/react': '^18.2.0'
      });
    }

    if (features.includes('eslint')) {
      Object.assign(devDeps, {
        eslint: '^8.56.0'
      });
    }

    if (features.includes('prettier')) {
      Object.assign(devDeps, {
        prettier: '^3.2.0'
      });
    }

    if (features.includes('tailwind')) {
      Object.assign(devDeps, {
        tailwindcss: '^3.4.0',
        postcss: '^8.4.0',
        autoprefixer: '^10.4.0'
      });
    }

    return devDeps;
  }
};
```

## CLAUDE.md Integration

```markdown
## Project Scaffolding

### Create New Project
```bash
# Using custom CLI
npx create-mycompany-app my-app

# With options
npx create-mycompany-app my-app --template nextjs --tailwind

# Using Yeoman
yo myapp
```

### Available Templates
- nextjs - Next.js App Router
- react - React + Vite SPA
- express - Express REST API
- fullstack - Next.js + tRPC + Prisma
- library - NPM package

### Features
- TypeScript (default)
- ESLint + Prettier
- Tailwind CSS
- Testing (Vitest)
- Git initialization

### Customization
Templates location: `templates/`
Config generators: `src/generators/`
```

## AI Suggestions

1. **Template recommendations** - Suggest based on project type
2. **Feature detection** - Auto-detect needed features
3. **Dependency updates** - Keep templates current
4. **Custom templates** - Create team templates
5. **Migration paths** - Upgrade existing projects
6. **Validation** - Verify scaffolded projects
7. **Documentation** - Auto-generate README
8. **Git templates** - Include .gitignore, workflows
9. **Environment setup** - Generate .env templates
10. **VS Code integration** - Add workspace settings
