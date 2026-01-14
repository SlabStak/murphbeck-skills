# Linting Configuration Template

## Overview
Comprehensive linting setup with ESLint, Prettier, Stylelint, and language-specific linters for consistent code quality.

## Quick Start
```bash
npm install eslint prettier eslint-config-prettier eslint-plugin-prettier --save-dev
npx eslint --init
```

## ESLint Configuration

### eslint.config.js (Flat Config)
```javascript
// eslint.config.js
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.config.js'
    ]
  },

  // Base JavaScript rules
  js.configs.recommended,

  // TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'import': importPlugin
    },
    rules: {
      // TypeScript specific
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports'
      }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Import rules
      'import/order': ['error', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'type'
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }],
      'import/no-duplicates': 'error',
      'import/no-cycle': 'error'
    }
  },

  // React configuration
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react': react,
      'react-hooks': reactHooks
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-curly-brace-presence': ['error', {
        props: 'never',
        children: 'never'
      }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },

  // Test files configuration
  {
    files: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  },

  // Prettier integration (must be last)
  prettier
];
```

### Legacy .eslintrc.js
```javascript
// .eslintrc.js (Legacy format)
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2024: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
    'jsx-a11y'
  ],
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      },
      node: true
    }
  },
  rules: {
    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // TypeScript
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
      fixStyle: 'inline-type-imports'
    }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'off',

    // React
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',

    // Import
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index',
        'type'
      ],
      pathGroups: [
        {
          pattern: 'react',
          group: 'external',
          position: 'before'
        },
        {
          pattern: '@/**',
          group: 'internal'
        }
      ],
      pathGroupsExcludedImportTypes: ['react'],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc'
      }
    }],
    'import/no-cycle': 'error',
    'import/no-unresolved': 'error'
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/unbound-method': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage'
  ]
};
```

## Prettier Configuration

### prettier.config.js
```javascript
// prettier.config.js
/** @type {import('prettier').Config} */
export default {
  // Basic formatting
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',

  // JSX
  jsxSingleQuote: false,

  // Trailing commas
  trailingComma: 'es5',

  // Brackets
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow functions
  arrowParens: 'always',

  // Prose
  proseWrap: 'preserve',

  // HTML
  htmlWhitespaceSensitivity: 'css',

  // End of line
  endOfLine: 'lf',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // Single attribute per line
  singleAttributePerLine: false,

  // Plugins
  plugins: [
    'prettier-plugin-tailwindcss',
    'prettier-plugin-organize-imports'
  ],

  // Plugin options
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva'],

  // Overrides for specific files
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80
      }
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80
      }
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    }
  ]
};
```

### .prettierignore
```
# Dependencies
node_modules/

# Build outputs
dist/
build/
.next/
out/

# Cache
.cache/
.parcel-cache/

# Coverage
coverage/

# Generated files
*.generated.ts
*.min.js
*.min.css

# Package manager
package-lock.json
yarn.lock
pnpm-lock.yaml

# IDE
.idea/
.vscode/

# Environment
.env*

# Other
*.svg
*.ico
```

## Stylelint Configuration

### stylelint.config.js
```javascript
// stylelint.config.js
/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-tailwindcss',
    'stylelint-config-prettier'
  ],
  plugins: [
    'stylelint-order',
    'stylelint-scss'
  ],
  rules: {
    // General
    'color-hex-length': 'short',
    'color-named': 'never',
    'declaration-block-no-redundant-longhand-properties': true,
    'font-family-name-quotes': 'always-where-recommended',
    'function-url-quotes': 'always',
    'length-zero-no-unit': true,
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$|^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
      {
        message: 'Use camelCase or kebab-case for class names'
      }
    ],

    // Order
    'order/order': [
      'custom-properties',
      'dollar-variables',
      'declarations',
      'rules',
      'at-rules'
    ],
    'order/properties-order': [
      // Positioning
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',

      // Display & Box Model
      'display',
      'flex',
      'flex-direction',
      'flex-wrap',
      'justify-content',
      'align-items',
      'align-content',
      'gap',
      'grid',
      'grid-template',
      'grid-template-columns',
      'grid-template-rows',

      // Box
      'width',
      'min-width',
      'max-width',
      'height',
      'min-height',
      'max-height',
      'margin',
      'padding',
      'border',
      'border-radius',

      // Visual
      'background',
      'color',
      'opacity',
      'box-shadow',

      // Typography
      'font',
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'text-align',
      'text-decoration',

      // Animation
      'transition',
      'animation',
      'transform'
    ],

    // SCSS specific
    'scss/at-rule-no-unknown': true,
    'scss/dollar-variable-pattern': '^[a-z][a-zA-Z0-9]+$',
    'scss/selector-no-redundant-nesting-selector': true,

    // Allow Tailwind
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'layer',
          'config',
          'variants',
          'responsive',
          'screen'
        ]
      }
    ],
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['theme']
      }
    ]
  },
  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '**/*.js',
    '**/*.ts',
    '**/*.tsx'
  ]
};
```

## Python Linting

### pyproject.toml
```toml
# pyproject.toml

[tool.ruff]
target-version = "py311"
line-length = 100
select = [
    "E",      # pycodestyle errors
    "W",      # pycodestyle warnings
    "F",      # Pyflakes
    "I",      # isort
    "B",      # flake8-bugbear
    "C4",     # flake8-comprehensions
    "UP",     # pyupgrade
    "ARG",    # flake8-unused-arguments
    "SIM",    # flake8-simplify
    "TCH",    # flake8-type-checking
    "PTH",    # flake8-use-pathlib
    "RUF",    # Ruff-specific rules
]
ignore = [
    "E501",   # line too long (handled by formatter)
    "B008",   # function calls in defaults
    "B904",   # raise without from
]
unfixable = [
    "F401",   # Don't auto-remove unused imports
]

[tool.ruff.per-file-ignores]
"__init__.py" = ["F401"]
"tests/**" = ["ARG", "S101"]

[tool.ruff.isort]
known-first-party = ["myproject"]
force-single-line = true
lines-after-imports = 2

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_ignores = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
show_error_codes = true
plugins = ["pydantic.mypy"]

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false

[tool.black]
line-length = 100
target-version = ["py311"]
include = '\.pyi?$'
exclude = '''
/(
    \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | _build
  | buck-out
  | build
  | dist
)/
'''
```

## Package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "lint:css": "stylelint '**/*.{css,scss}'",
    "lint:css:fix": "stylelint '**/*.{css,scss}' --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "validate": "npm run lint && npm run typecheck && npm run format:check"
  }
}
```

## CLAUDE.md Integration

```markdown
## Linting

### Commands
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript checks

### Rules
- ESLint for JavaScript/TypeScript
- Prettier for formatting
- Stylelint for CSS/SCSS
- Import ordering enforced

### IDE Integration
- Install ESLint extension
- Enable format on save
- Use workspace settings
```

## AI Suggestions

1. **Auto-fix suggestions** - Apply fixes automatically
2. **Rule customization** - Adapt rules for project
3. **Performance optimization** - Cache lint results
4. **Custom rules** - Create project-specific rules
5. **Config sharing** - Export/import configurations
6. **IDE integration** - Better editor feedback
7. **CI integration** - Run in pipelines
8. **Report generation** - Create lint reports
9. **Gradual adoption** - Phase in strict rules
10. **Dependency updates** - Keep configs current
