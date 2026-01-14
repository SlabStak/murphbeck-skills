# Workspace Setup Template

## Overview
Comprehensive workspace configuration with VS Code workspaces, multi-root setups, team settings, and development environment standardization.

## Quick Start
```bash
# Create workspace file
code --new-window --add ./project1 --add ./project2
# Save as: myworkspace.code-workspace
```

## VS Code Workspace Configuration

### myproject.code-workspace
```json
{
  "folders": [
    {
      "name": "Frontend",
      "path": "./apps/web"
    },
    {
      "name": "Backend API",
      "path": "./apps/api"
    },
    {
      "name": "Mobile App",
      "path": "./apps/mobile"
    },
    {
      "name": "Shared Packages",
      "path": "./packages"
    },
    {
      "name": "Infrastructure",
      "path": "./infra"
    },
    {
      "name": "Documentation",
      "path": "./docs"
    }
  ],
  "settings": {
    // Editor settings
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit",
      "source.organizeImports": "explicit"
    },
    "editor.rulers": [80, 100],
    "editor.tabSize": 2,

    // Files
    "files.exclude": {
      "**/.git": true,
      "**/node_modules": true,
      "**/.next": true,
      "**/dist": true,
      "**/coverage": true
    },
    "files.watcherExclude": {
      "**/node_modules/**": true,
      "**/.git/objects/**": true
    },

    // Search
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/.next": true,
      "**/coverage": true,
      "**/*.lock": true
    },

    // TypeScript
    "typescript.preferences.importModuleSpecifier": "relative",
    "typescript.suggest.autoImports": true,
    "typescript.updateImportsOnFileMove.enabled": "always",

    // ESLint - per folder configuration
    "eslint.workingDirectories": [
      { "directory": "./apps/web", "changeProcessCWD": true },
      { "directory": "./apps/api", "changeProcessCWD": true },
      { "directory": "./packages/*", "changeProcessCWD": true }
    ],

    // Testing
    "testing.automaticallyOpenPeekView": "failureVisible",

    // Git
    "git.autofetch": true,
    "git.enableSmartCommit": true,

    // Terminal
    "terminal.integrated.cwd": "${workspaceFolder}",

    // Tailwind CSS
    "tailwindCSS.rootFontSize": 16,
    "tailwindCSS.experimental.classRegex": [
      ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
      ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
    ],

    // Folder-specific settings
    "[Frontend]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[Backend API]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    }
  },
  "extensions": {
    "recommendations": [
      // Essential
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "editorconfig.editorconfig",

      // TypeScript/JavaScript
      "ms-vscode.vscode-typescript-next",
      "christian-kohler.path-intellisense",

      // React
      "dsznajder.es7-react-js-snippets",
      "bradlc.vscode-tailwindcss",

      // Testing
      "vitest.explorer",
      "ms-playwright.playwright",

      // Git
      "eamodio.gitlens",
      "mhutchie.git-graph",

      // API Development
      "humao.rest-client",
      "rangav.vscode-thunder-client",

      // Database
      "prisma.prisma",
      "cweijan.vscode-database-client2",

      // Docker
      "ms-azuretools.vscode-docker",
      "ms-vscode-remote.remote-containers",

      // Documentation
      "yzhang.markdown-all-in-one",
      "davidanson.vscode-markdownlint",

      // Productivity
      "github.copilot",
      "usernamehw.errorlens",
      "gruntfuggly.todo-tree"
    ],
    "unwantedRecommendations": []
  },
  "launch": {
    "version": "0.2.0",
    "configurations": [
      {
        "name": "Frontend: Next.js",
        "type": "node-terminal",
        "request": "launch",
        "command": "npm run dev",
        "cwd": "${workspaceFolder:Frontend}"
      },
      {
        "name": "Backend: API Server",
        "type": "node",
        "request": "launch",
        "program": "${workspaceFolder:Backend API}/src/index.ts",
        "runtimeArgs": ["-r", "ts-node/register"],
        "env": {
          "NODE_ENV": "development"
        },
        "cwd": "${workspaceFolder:Backend API}"
      },
      {
        "name": "Frontend: Debug Chrome",
        "type": "chrome",
        "request": "launch",
        "url": "http://localhost:3000"
      },
      {
        "name": "Tests: Frontend",
        "type": "node",
        "request": "launch",
        "program": "${workspaceFolder:Frontend}/node_modules/vitest/vitest.mjs",
        "args": ["run"],
        "cwd": "${workspaceFolder:Frontend}"
      },
      {
        "name": "Tests: Backend",
        "type": "node",
        "request": "launch",
        "program": "${workspaceFolder:Backend API}/node_modules/vitest/vitest.mjs",
        "args": ["run"],
        "cwd": "${workspaceFolder:Backend API}"
      }
    ],
    "compounds": [
      {
        "name": "Full Stack",
        "configurations": ["Frontend: Next.js", "Backend: API Server"]
      }
    ]
  },
  "tasks": {
    "version": "2.0.0",
    "tasks": [
      {
        "label": "Install All",
        "type": "shell",
        "command": "pnpm install",
        "options": {
          "cwd": "${workspaceFolder}"
        },
        "problemMatcher": []
      },
      {
        "label": "Build All",
        "type": "shell",
        "command": "pnpm run build",
        "options": {
          "cwd": "${workspaceFolder}"
        },
        "group": {
          "kind": "build",
          "isDefault": true
        },
        "problemMatcher": ["$tsc"]
      },
      {
        "label": "Test All",
        "type": "shell",
        "command": "pnpm run test",
        "options": {
          "cwd": "${workspaceFolder}"
        },
        "group": {
          "kind": "test",
          "isDefault": true
        }
      },
      {
        "label": "Lint All",
        "type": "shell",
        "command": "pnpm run lint",
        "options": {
          "cwd": "${workspaceFolder}"
        },
        "problemMatcher": ["$eslint-stylish"]
      },
      {
        "label": "Docker: Up",
        "type": "shell",
        "command": "docker-compose up -d",
        "problemMatcher": []
      },
      {
        "label": "Docker: Down",
        "type": "shell",
        "command": "docker-compose down",
        "problemMatcher": []
      },
      {
        "label": "Database: Migrate",
        "type": "shell",
        "command": "pnpm run db:migrate",
        "options": {
          "cwd": "${workspaceFolder:Backend API}"
        },
        "problemMatcher": []
      }
    ]
  }
}
```

## Project Structure Template

### scripts/init-workspace.ts
```typescript
// scripts/init-workspace.ts
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface WorkspaceConfig {
  name: string;
  folders: {
    name: string;
    path: string;
    template?: string;
  }[];
  monorepo?: boolean;
}

const defaultConfig: WorkspaceConfig = {
  name: 'myproject',
  folders: [
    { name: 'Frontend', path: './apps/web', template: 'nextjs' },
    { name: 'Backend API', path: './apps/api', template: 'express' },
    { name: 'Shared', path: './packages/shared' },
    { name: 'UI Components', path: './packages/ui' },
    { name: 'Documentation', path: './docs' }
  ],
  monorepo: true
};

async function initWorkspace(config: WorkspaceConfig = defaultConfig): Promise<void> {
  console.log(`\n🚀 Initializing workspace: ${config.name}\n`);

  // Create root directory structure
  const rootDir = path.resolve(process.cwd(), config.name);
  fs.mkdirSync(rootDir, { recursive: true });

  // Create folders
  for (const folder of config.folders) {
    const folderPath = path.join(rootDir, folder.path);
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Created: ${folder.path}`);

    // Initialize based on template
    if (folder.template) {
      initTemplate(folderPath, folder.template);
    }
  }

  // Create workspace file
  const workspaceFile = generateWorkspaceFile(config);
  fs.writeFileSync(
    path.join(rootDir, `${config.name}.code-workspace`),
    JSON.stringify(workspaceFile, null, 2)
  );
  console.log(`Created: ${config.name}.code-workspace`);

  // Create monorepo config if needed
  if (config.monorepo) {
    initMonorepo(rootDir);
  }

  // Create common config files
  createCommonConfigs(rootDir);

  console.log('\n✅ Workspace initialized successfully!');
  console.log(`\nOpen in VS Code: code ${config.name}/${config.name}.code-workspace\n`);
}

function generateWorkspaceFile(config: WorkspaceConfig): Record<string, unknown> {
  return {
    folders: config.folders.map(f => ({
      name: f.name,
      path: f.path
    })),
    settings: {
      'editor.formatOnSave': true,
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'files.exclude': {
        '**/.git': true,
        '**/node_modules': true
      }
    },
    extensions: {
      recommendations: [
        'dbaeumer.vscode-eslint',
        'esbenp.prettier-vscode'
      ]
    }
  };
}

function initTemplate(folderPath: string, template: string): void {
  switch (template) {
    case 'nextjs':
      createNextJsTemplate(folderPath);
      break;
    case 'express':
      createExpressTemplate(folderPath);
      break;
    default:
      createBasicPackage(folderPath);
  }
}

function initMonorepo(rootDir: string): void {
  // Create pnpm-workspace.yaml
  const pnpmWorkspace = `packages:
  - 'apps/*'
  - 'packages/*'
`;
  fs.writeFileSync(path.join(rootDir, 'pnpm-workspace.yaml'), pnpmWorkspace);

  // Create turbo.json
  const turboConfig = {
    $schema: 'https://turbo.build/schema.json',
    tasks: {
      build: {
        dependsOn: ['^build'],
        outputs: ['dist/**', '.next/**']
      },
      dev: {
        cache: false,
        persistent: true
      },
      lint: {},
      test: {}
    }
  };
  fs.writeFileSync(
    path.join(rootDir, 'turbo.json'),
    JSON.stringify(turboConfig, null, 2)
  );

  // Create root package.json
  const rootPackage = {
    name: 'monorepo',
    private: true,
    scripts: {
      dev: 'turbo run dev',
      build: 'turbo run build',
      lint: 'turbo run lint',
      test: 'turbo run test'
    },
    devDependencies: {
      turbo: '^2.0.0'
    },
    packageManager: 'pnpm@8.15.0'
  };
  fs.writeFileSync(
    path.join(rootDir, 'package.json'),
    JSON.stringify(rootPackage, null, 2)
  );
}

function createCommonConfigs(rootDir: string): void {
  // .gitignore
  const gitignore = `node_modules/
dist/
.next/
coverage/
.env
.env.local
*.log
`;
  fs.writeFileSync(path.join(rootDir, '.gitignore'), gitignore);

  // .editorconfig
  const editorconfig = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
`;
  fs.writeFileSync(path.join(rootDir, '.editorconfig'), editorconfig);

  // prettier.config.js
  const prettier = `export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5'
};
`;
  fs.writeFileSync(path.join(rootDir, 'prettier.config.js'), prettier);
}

function createNextJsTemplate(folderPath: string): void {
  const packageJson = {
    name: '@repo/web',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    dependencies: {
      next: '^14.1.0',
      react: '^18.2.0',
      'react-dom': '^18.2.0'
    }
  };
  fs.writeFileSync(
    path.join(folderPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

function createExpressTemplate(folderPath: string): void {
  const packageJson = {
    name: '@repo/api',
    private: true,
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
      lint: 'eslint src/'
    },
    dependencies: {
      express: '^4.18.0'
    },
    devDependencies: {
      tsx: '^4.0.0',
      typescript: '^5.3.0'
    }
  };
  fs.writeFileSync(
    path.join(folderPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

function createBasicPackage(folderPath: string): void {
  const packageJson = {
    name: `@repo/${path.basename(folderPath)}`,
    private: true,
    main: './dist/index.js',
    types: './dist/index.d.ts',
    scripts: {
      build: 'tsc',
      dev: 'tsc --watch'
    }
  };
  fs.writeFileSync(
    path.join(folderPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

// Run if called directly
initWorkspace();
```

## Team Configuration Sync

### scripts/sync-settings.ts
```typescript
// scripts/sync-settings.ts
import * as fs from 'fs';
import * as path from 'path';

interface TeamSettings {
  editor: Record<string, unknown>;
  extensions: string[];
  snippets: Record<string, unknown>;
}

const teamSettings: TeamSettings = {
  editor: {
    'editor.formatOnSave': true,
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
    'editor.codeActionsOnSave': {
      'source.fixAll.eslint': 'explicit'
    },
    'editor.tabSize': 2,
    'editor.rulers': [80, 100],
    'files.eol': '\n'
  },
  extensions: [
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode',
    'editorconfig.editorconfig',
    'eamodio.gitlens',
    'usernamehw.errorlens',
    'bradlc.vscode-tailwindcss',
    'prisma.prisma'
  ],
  snippets: {
    'React Functional Component': {
      prefix: 'rfc',
      body: [
        "import React from 'react';",
        '',
        'interface ${1:Component}Props {',
        '  ${2}',
        '}',
        '',
        'export function ${1:Component}({ ${3} }: ${1:Component}Props) {',
        '  return (',
        '    <div>',
        '      ${0}',
        '    </div>',
        '  );',
        '}'
      ],
      description: 'React Functional Component with TypeScript'
    }
  }
};

function syncSettings(): void {
  const vscodeDir = path.join(process.cwd(), '.vscode');
  fs.mkdirSync(vscodeDir, { recursive: true });

  // Write settings.json
  const existingSettings = fs.existsSync(path.join(vscodeDir, 'settings.json'))
    ? JSON.parse(fs.readFileSync(path.join(vscodeDir, 'settings.json'), 'utf-8'))
    : {};

  const mergedSettings = { ...existingSettings, ...teamSettings.editor };
  fs.writeFileSync(
    path.join(vscodeDir, 'settings.json'),
    JSON.stringify(mergedSettings, null, 2)
  );

  // Write extensions.json
  fs.writeFileSync(
    path.join(vscodeDir, 'extensions.json'),
    JSON.stringify({ recommendations: teamSettings.extensions }, null, 2)
  );

  // Write snippets
  const snippetsDir = path.join(vscodeDir);
  fs.writeFileSync(
    path.join(snippetsDir, 'project.code-snippets'),
    JSON.stringify(teamSettings.snippets, null, 2)
  );

  console.log('✅ Team settings synced to .vscode/');
}

syncSettings();
```

## Environment Detection

### scripts/detect-environment.ts
```typescript
// scripts/detect-environment.ts
import * as os from 'os';
import * as fs from 'fs';
import { execSync } from 'child_process';

interface EnvironmentInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  npmVersion: string;
  packageManager: string;
  docker: boolean;
  git: boolean;
  vscode: boolean;
  shell: string;
  memory: string;
  cpus: number;
}

function detectEnvironment(): EnvironmentInfo {
  const getVersion = (cmd: string): string => {
    try {
      return execSync(cmd, { encoding: 'utf-8' }).trim();
    } catch {
      return 'not installed';
    }
  };

  const commandExists = (cmd: string): boolean => {
    try {
      execSync(`which ${cmd}`, { encoding: 'utf-8' });
      return true;
    } catch {
      return false;
    }
  };

  const detectPackageManager = (): string => {
    if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
    if (fs.existsSync('yarn.lock')) return 'yarn';
    if (fs.existsSync('bun.lockb')) return 'bun';
    return 'npm';
  };

  return {
    platform: `${os.platform()} ${os.release()}`,
    arch: os.arch(),
    nodeVersion: getVersion('node --version'),
    npmVersion: getVersion('npm --version'),
    packageManager: detectPackageManager(),
    docker: commandExists('docker'),
    git: commandExists('git'),
    vscode: commandExists('code'),
    shell: process.env.SHELL || 'unknown',
    memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
    cpus: os.cpus().length
  };
}

function printEnvironment(): void {
  const env = detectEnvironment();

  console.log('\n📊 Development Environment\n');
  console.log('System:');
  console.log(`  Platform: ${env.platform}`);
  console.log(`  Architecture: ${env.arch}`);
  console.log(`  Memory: ${env.memory}`);
  console.log(`  CPUs: ${env.cpus}`);
  console.log(`  Shell: ${env.shell}`);

  console.log('\nTools:');
  console.log(`  Node.js: ${env.nodeVersion}`);
  console.log(`  npm: ${env.npmVersion}`);
  console.log(`  Package Manager: ${env.packageManager}`);
  console.log(`  Docker: ${env.docker ? '✓' : '✗'}`);
  console.log(`  Git: ${env.git ? '✓' : '✗'}`);
  console.log(`  VS Code: ${env.vscode ? '✓' : '✗'}`);
  console.log();
}

printEnvironment();
```

## CLAUDE.md Integration

```markdown
## Workspace Setup

### Opening the Workspace
```bash
code myproject.code-workspace
```

### Structure
- apps/web - Frontend (Next.js)
- apps/api - Backend (Express)
- packages/ - Shared packages
- docs/ - Documentation

### Team Settings
Run to sync team settings:
```bash
npm run sync-settings
```

### Debug Configurations
- Frontend: Next.js server
- Backend: API server
- Full Stack: Both together
- Tests: Per-project testing

### Tasks (Ctrl+Shift+B)
- Build All
- Test All
- Lint All
- Docker Up/Down
```

## AI Suggestions

1. **Auto-detect structure** - Infer workspace config
2. **Extension sync** - Team extension management
3. **Settings profiles** - Per-project settings
4. **Task automation** - Smart task discovery
5. **Debug configs** - Auto-generate launch.json
6. **Environment validation** - Check prerequisites
7. **Workspace templates** - Project archetypes
8. **Remote development** - SSH/container support
9. **Multi-language** - Polyglot workspaces
10. **Documentation** - Auto-document workspace
