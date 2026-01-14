# Editor Configuration Template

## Overview
Comprehensive editor configuration with EditorConfig, VS Code settings, workspace configs, and IDE-agnostic formatting standards.

## Quick Start
```bash
touch .editorconfig
mkdir -p .vscode
```

## EditorConfig

### .editorconfig
```ini
# EditorConfig is awesome: https://EditorConfig.org

# Top-most EditorConfig file
root = true

# Default for all files
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
max_line_length = 100

# JavaScript/TypeScript
[*.{js,jsx,ts,tsx,mjs,cjs}]
indent_size = 2
quote_type = single

# JSON files
[*.json]
indent_size = 2

# YAML files
[*.{yml,yaml}]
indent_size = 2

# Python
[*.py]
indent_size = 4
max_line_length = 100

# Go
[*.go]
indent_style = tab
indent_size = 4

# Rust
[*.rs]
indent_size = 4
max_line_length = 100

# Markdown
[*.md]
trim_trailing_whitespace = false
max_line_length = off

# Makefile (must use tabs)
[Makefile]
indent_style = tab

# Shell scripts
[*.sh]
indent_size = 2
shell_variant = bash

# SQL
[*.sql]
indent_size = 4

# Docker
[Dockerfile*]
indent_size = 4

# Package files
[{package.json,*.lock,*.lockb}]
indent_size = 2

# Config files
[.{babel,eslint,prettier,stylelint}rc]
indent_size = 2
```

## VS Code Workspace Settings

### .vscode/settings.json
```json
{
  // Editor settings
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  "editor.formatOnSave": true,
  "editor.formatOnPaste": false,
  "editor.formatOnType": false,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.rulers": [80, 100, 120],
  "editor.wordWrap": "off",
  "editor.minimap.enabled": false,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,
  "editor.linkedEditing": true,
  "editor.suggest.insertMode": "replace",
  "editor.inlineSuggest.enabled": true,
  "editor.quickSuggestions": {
    "strings": true
  },

  // Files settings
  "files.eol": "\n",
  "files.encoding": "utf8",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  },
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/node_modules/**": true,
    "**/dist/**": true
  },
  "files.associations": {
    "*.css": "tailwindcss",
    ".env*": "dotenv",
    "*.mdx": "mdx"
  },

  // Search settings
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true,
    "**/*.lock": true,
    "**/pnpm-lock.yaml": true
  },

  // TypeScript settings
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.quoteStyle": "single",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  // JavaScript settings
  "javascript.preferences.importModuleSpecifier": "relative",
  "javascript.preferences.quoteStyle": "single",
  "javascript.updateImportsOnFileMove.enabled": "always",

  // ESLint settings
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.workingDirectories": [{ "mode": "auto" }],

  // Prettier settings
  "prettier.enable": true,
  "prettier.requireConfig": true,

  // Language-specific settings
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[scss]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.wordWrap": "on",
    "editor.quickSuggestions": {
      "comments": "off",
      "strings": "off",
      "other": "off"
    }
  },
  "[yaml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.autoIndent": "keep"
  },
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.tabSize": 4,
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll": "explicit",
      "source.organizeImports": "explicit"
    }
  },
  "[go]": {
    "editor.defaultFormatter": "golang.go",
    "editor.insertSpaces": false,
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit"
    }
  },
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer",
    "editor.tabSize": 4
  },

  // Tailwind CSS
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],

  // Git settings
  "git.enableSmartCommit": true,
  "git.confirmSync": false,
  "git.autofetch": true,

  // Terminal settings
  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.defaultProfile.linux": "zsh",
  "terminal.integrated.fontFamily": "MesloLGS NF",

  // Explorer settings
  "explorer.confirmDelete": false,
  "explorer.confirmDragAndDrop": false,
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.expand": false,
  "explorer.fileNesting.patterns": {
    "package.json": "package-lock.json, yarn.lock, pnpm-lock.yaml, .npmrc, .yarnrc.yml",
    "tsconfig.json": "tsconfig.*.json, env.d.ts",
    ".eslintrc*": ".eslintignore, .eslintcache",
    ".prettierrc*": ".prettierignore",
    "README.md": "LICENSE*, CHANGELOG*, CONTRIBUTING*, CODE_OF_CONDUCT*",
    "*.ts": "$(capture).test.ts, $(capture).spec.ts, $(capture).d.ts",
    "*.tsx": "$(capture).test.tsx, $(capture).spec.tsx"
  }
}
```

### .vscode/extensions.json
```json
{
  "recommendations": [
    // Essential
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "editorconfig.editorconfig",

    // TypeScript/JavaScript
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "steoates.autoimport",

    // React/Vue/Angular
    "dsznajder.es7-react-js-snippets",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",

    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",

    // Testing
    "vitest.explorer",
    "orta.vscode-jest",

    // Debugging
    "usernamehw.errorlens",
    "ms-vscode.js-debug",

    // Productivity
    "github.copilot",
    "github.copilot-chat",
    "wayou.vscode-todo-highlight",
    "gruntfuggly.todo-tree",

    // Docker/DevOps
    "ms-azuretools.vscode-docker",
    "ms-vscode-remote.remote-containers",

    // Themes/Icons
    "pkief.material-icon-theme",
    "dracula-theme.theme-dracula"
  ],
  "unwantedRecommendations": []
}
```

### .vscode/launch.json
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "- Local:.+(https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    },
    {
      "name": "Node.js: Current File",
      "type": "node",
      "request": "launch",
      "program": "${file}",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Jest: Current File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${relativeFile}", "--config", "jest.config.js"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Vitest: Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal"
    },
    {
      "name": "Python: Current File",
      "type": "debugpy",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal"
    },
    {
      "name": "Python: FastAPI",
      "type": "debugpy",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload"],
      "jinja": true
    }
  ],
  "compounds": [
    {
      "name": "Full Stack",
      "configurations": ["Next.js: debug server-side", "Next.js: debug client-side"]
    }
  ]
}
```

### .vscode/tasks.json
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev",
      "type": "npm",
      "script": "dev",
      "problemMatcher": [],
      "isBackground": true,
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "build",
      "type": "npm",
      "script": "build",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "test",
      "type": "npm",
      "script": "test",
      "group": {
        "kind": "test",
        "isDefault": true
      },
      "problemMatcher": []
    },
    {
      "label": "lint",
      "type": "npm",
      "script": "lint",
      "problemMatcher": ["$eslint-stylish"]
    },
    {
      "label": "lint:fix",
      "type": "npm",
      "script": "lint:fix",
      "problemMatcher": ["$eslint-stylish"]
    },
    {
      "label": "typecheck",
      "type": "npm",
      "script": "typecheck",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "format",
      "type": "npm",
      "script": "format",
      "problemMatcher": []
    },
    {
      "label": "db:migrate",
      "type": "npm",
      "script": "db:migrate",
      "problemMatcher": []
    },
    {
      "label": "db:seed",
      "type": "npm",
      "script": "db:seed",
      "problemMatcher": []
    }
  ]
}
```

## JetBrains IDE Configuration

### .idea/codeStyles/Project.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectCodeStyleConfiguration">
    <code_scheme name="Project" version="173">
      <option name="AUTODETECT_INDENTS" value="false" />
      <option name="RIGHT_MARGIN" value="100" />

      <JSCodeStyleSettings version="0">
        <option name="USE_DOUBLE_QUOTES" value="false" />
        <option name="FORCE_QUOTE_STYLe" value="true" />
        <option name="FORCE_SEMICOLON_STYLE" value="true" />
        <option name="USE_SEMICOLON_AFTER_STATEMENT" value="true" />
        <option name="SPACES_WITHIN_OBJECT_LITERAL_BRACES" value="true" />
        <option name="SPACES_WITHIN_IMPORTS" value="true" />
      </JSCodeStyleSettings>

      <TypeScriptCodeStyleSettings version="0">
        <option name="USE_DOUBLE_QUOTES" value="false" />
        <option name="FORCE_QUOTE_STYLe" value="true" />
        <option name="FORCE_SEMICOLON_STYLE" value="true" />
        <option name="USE_SEMICOLON_AFTER_STATEMENT" value="true" />
        <option name="SPACES_WITHIN_OBJECT_LITERAL_BRACES" value="true" />
        <option name="SPACES_WITHIN_IMPORTS" value="true" />
      </TypeScriptCodeStyleSettings>

      <codeStyleSettings language="JavaScript">
        <option name="RIGHT_MARGIN" value="100" />
        <indentOptions>
          <option name="INDENT_SIZE" value="2" />
          <option name="CONTINUATION_INDENT_SIZE" value="2" />
          <option name="TAB_SIZE" value="2" />
        </indentOptions>
      </codeStyleSettings>

      <codeStyleSettings language="TypeScript">
        <option name="RIGHT_MARGIN" value="100" />
        <indentOptions>
          <option name="INDENT_SIZE" value="2" />
          <option name="CONTINUATION_INDENT_SIZE" value="2" />
          <option name="TAB_SIZE" value="2" />
        </indentOptions>
      </codeStyleSettings>

      <codeStyleSettings language="Python">
        <option name="RIGHT_MARGIN" value="100" />
        <indentOptions>
          <option name="INDENT_SIZE" value="4" />
          <option name="TAB_SIZE" value="4" />
        </indentOptions>
      </codeStyleSettings>
    </code_scheme>
  </component>
</project>
```

## Vim/Neovim Configuration

### .vim/project.vim
```vim
" Project-specific Vim settings
" Source this file in your .vimrc: source .vim/project.vim

" Indentation
set expandtab
set tabstop=2
set shiftwidth=2
set softtabstop=2

" Line length indicator
set colorcolumn=80,100

" File encoding
set encoding=utf-8
set fileencoding=utf-8
set fileencodings=utf-8

" Trim trailing whitespace on save
autocmd BufWritePre * :%s/\s\+$//e

" Insert final newline
set fixendofline

" File type specific settings
autocmd FileType python setlocal tabstop=4 shiftwidth=4 softtabstop=4
autocmd FileType go setlocal noexpandtab tabstop=4 shiftwidth=4
autocmd FileType make setlocal noexpandtab
autocmd FileType markdown setlocal wrap linebreak
```

### init.lua (Neovim)
```lua
-- Neovim project configuration
local opt = vim.opt

-- General settings
opt.expandtab = true
opt.tabstop = 2
opt.shiftwidth = 2
opt.softtabstop = 2
opt.smartindent = true

-- Line length
opt.colorcolumn = "80,100"
opt.textwidth = 100

-- File encoding
opt.encoding = "utf-8"
opt.fileencoding = "utf-8"

-- Trailing whitespace
vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = "*",
  command = [[%s/\s\+$//e]],
})

-- Final newline
opt.fixendofline = true

-- File type settings
vim.api.nvim_create_autocmd("FileType", {
  pattern = "python",
  callback = function()
    vim.opt_local.tabstop = 4
    vim.opt_local.shiftwidth = 4
    vim.opt_local.softtabstop = 4
  end,
})

vim.api.nvim_create_autocmd("FileType", {
  pattern = "go",
  callback = function()
    vim.opt_local.expandtab = false
    vim.opt_local.tabstop = 4
    vim.opt_local.shiftwidth = 4
  end,
})
```

## Editor Config Generator

### scripts/generate-editor-config.ts
```typescript
// scripts/generate-editor-config.ts
import * as fs from 'fs';
import * as path from 'path';

interface EditorConfigOptions {
  indentStyle: 'space' | 'tab';
  indentSize: number;
  endOfLine: 'lf' | 'crlf';
  charset: string;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
  maxLineLength: number | 'off';
}

interface LanguageConfig {
  patterns: string[];
  options: Partial<EditorConfigOptions>;
}

const DEFAULT_OPTIONS: EditorConfigOptions = {
  indentStyle: 'space',
  indentSize: 2,
  endOfLine: 'lf',
  charset: 'utf-8',
  trimTrailingWhitespace: true,
  insertFinalNewline: true,
  maxLineLength: 100
};

const LANGUAGE_CONFIGS: LanguageConfig[] = [
  {
    patterns: ['*.py'],
    options: { indentSize: 4 }
  },
  {
    patterns: ['*.go'],
    options: { indentStyle: 'tab', indentSize: 4 }
  },
  {
    patterns: ['*.rs'],
    options: { indentSize: 4 }
  },
  {
    patterns: ['*.md'],
    options: { trimTrailingWhitespace: false, maxLineLength: 'off' }
  },
  {
    patterns: ['Makefile'],
    options: { indentStyle: 'tab' }
  }
];

function generateEditorConfig(
  baseOptions: Partial<EditorConfigOptions> = {},
  additionalConfigs: LanguageConfig[] = []
): string {
  const options = { ...DEFAULT_OPTIONS, ...baseOptions };
  const configs = [...LANGUAGE_CONFIGS, ...additionalConfigs];

  let content = `# EditorConfig: https://EditorConfig.org
root = true

[*]
indent_style = ${options.indentStyle}
indent_size = ${options.indentSize}
end_of_line = ${options.endOfLine}
charset = ${options.charset}
trim_trailing_whitespace = ${options.trimTrailingWhitespace}
insert_final_newline = ${options.insertFinalNewline}
max_line_length = ${options.maxLineLength}
`;

  for (const config of configs) {
    const pattern = config.patterns.join(',');
    content += `\n[${pattern}]\n`;

    for (const [key, value] of Object.entries(config.options)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      content += `${snakeKey} = ${value}\n`;
    }
  }

  return content;
}

function generateVSCodeSettings(
  options: Partial<EditorConfigOptions> = {}
): Record<string, unknown> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return {
    'editor.tabSize': config.indentSize,
    'editor.insertSpaces': config.indentStyle === 'space',
    'files.eol': config.endOfLine === 'lf' ? '\n' : '\r\n',
    'files.encoding': config.charset,
    'files.trimTrailingWhitespace': config.trimTrailingWhitespace,
    'files.insertFinalNewline': config.insertFinalNewline,
    'editor.rulers': config.maxLineLength !== 'off' ? [config.maxLineLength] : []
  };
}

// Generate configs
const editorConfig = generateEditorConfig();
fs.writeFileSync('.editorconfig', editorConfig);

const vscodeSettings = generateVSCodeSettings();
fs.mkdirSync('.vscode', { recursive: true });
fs.writeFileSync(
  '.vscode/settings.json',
  JSON.stringify(vscodeSettings, null, 2)
);

console.log('Editor configuration files generated!');
```

## CLAUDE.md Integration

```markdown
## Editor Configuration

### Files
- `.editorconfig` - Cross-editor settings
- `.vscode/settings.json` - VS Code workspace settings
- `.vscode/extensions.json` - Recommended extensions
- `.vscode/launch.json` - Debug configurations
- `.vscode/tasks.json` - Build tasks

### Key Settings
- Indent: 2 spaces (4 for Python/Go)
- Line endings: LF
- Max line length: 100
- Format on save: enabled

### VS Code Extensions
Essential:
- ESLint + Prettier
- GitLens
- Error Lens
- Copilot

### Commands
- `Ctrl+Shift+P` - Command palette
- `Ctrl+\`` - Toggle terminal
- `Ctrl+Shift+B` - Run build task
- `F5` - Start debugging
```

## AI Suggestions

1. **Config detection** - Auto-detect project type
2. **Settings sync** - Share configs across editors
3. **Conflict resolution** - Detect setting conflicts
4. **Extension management** - Auto-install extensions
5. **Profile switching** - Language-specific profiles
6. **Config validation** - Validate settings
7. **Migration tools** - Convert between formats
8. **Team sync** - Share team configurations
9. **Performance tuning** - Optimize settings
10. **Custom snippets** - Generate project snippets
