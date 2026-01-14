# NPM React Component Library

## Overview

Production-ready React component library for npm publication with TypeScript, Storybook documentation, CSS-in-JS with vanilla-extract, accessibility testing, visual regression testing, and design tokens. Includes comprehensive build pipeline for ESM/CJS with preserved CSS.

## Quick Start

```bash
# Create project
mkdir my-components && cd my-components
npm init -y

# Install dependencies
npm install react react-dom
npm install -D typescript @types/react @types/react-dom \
  tsup vitest @vitest/coverage-v8 happy-dom @testing-library/react \
  storybook @storybook/react-vite @storybook/addon-essentials \
  @storybook/addon-a11y @storybook/test \
  @vanilla-extract/css @vanilla-extract/recipes \
  clsx @changesets/cli eslint prettier

# Initialize Storybook
npx storybook@latest init

# Create directory structure
mkdir -p src/components src/hooks src/utils

# Build and test
npm run build
npm test
```

## Project Structure

```
my-components/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── components/
│   │   ├── index.ts             # Component exports
│   │   ├── Button/
│   │   │   ├── index.ts
│   │   │   ├── Button.tsx
│   │   │   ├── Button.css.ts    # vanilla-extract styles
│   │   │   ├── Button.test.tsx
│   │   │   └── Button.stories.tsx
│   │   ├── Input/
│   │   │   ├── index.ts
│   │   │   ├── Input.tsx
│   │   │   ├── Input.css.ts
│   │   │   ├── Input.test.tsx
│   │   │   └── Input.stories.tsx
│   │   └── Card/
│   │       ├── index.ts
│   │       ├── Card.tsx
│   │       ├── Card.css.ts
│   │       ├── Card.test.tsx
│   │       └── Card.stories.tsx
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useToggle.ts
│   │   └── useMediaQuery.ts
│   ├── tokens/
│   │   ├── index.ts
│   │   ├── colors.css.ts
│   │   ├── spacing.css.ts
│   │   └── typography.css.ts
│   └── utils/
│       ├── index.ts
│       └── cn.ts                # Class name utility
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── .changeset/
│   └── config.json
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── vitest.setup.ts
└── CLAUDE.md
```

## Configuration Files

### package.json

```json
{
  "name": "@yourorg/my-components",
  "version": "1.0.0",
  "description": "A production-ready React component library",
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./styles.css": "./dist/styles.css",
    "./tokens": {
      "import": {
        "types": "./dist/tokens/index.d.ts",
        "default": "./dist/tokens/index.js"
      },
      "require": {
        "types": "./dist/tokens/index.d.cts",
        "default": "./dist/tokens/index.cjs"
      }
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "sideEffects": [
    "*.css",
    "*.css.ts"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write 'src/**/*.{ts,tsx}'",
    "typecheck": "tsc --noEmit",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "npm run build && changeset publish",
    "prepublishOnly": "npm run build && npm run test:run",
    "clean": "rm -rf dist storybook-static coverage"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@storybook/addon-a11y": "^8.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "@storybook/test": "^8.0.0",
    "@testing-library/react": "^15.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vanilla-extract/css": "^1.14.0",
    "@vanilla-extract/esbuild-plugin": "^2.3.0",
    "@vanilla-extract/recipes": "^0.5.0",
    "@vitest/coverage-v8": "^1.5.0",
    "@vitest/ui": "^1.5.0",
    "clsx": "^2.1.0",
    "eslint": "^8.57.0",
    "happy-dom": "^14.7.0",
    "prettier": "^3.2.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "storybook": "^8.0.0",
    "tsup": "^8.0.2",
    "typescript": "^5.4.5",
    "vitest": "^1.5.0"
  },
  "keywords": [
    "react",
    "components",
    "ui",
    "typescript"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/yourorg/my-components.git"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
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
    "noImplicitReturns": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.tsx", "**/*.stories.tsx"]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';
import { vanillaExtractPlugin } from '@vanilla-extract/esbuild-plugin';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'tokens/index': 'src/tokens/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  treeshake: true,
  splitting: true,
  target: 'es2022',
  external: ['react', 'react-dom'],
  esbuildPlugins: [vanillaExtractPlugin()],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
  onSuccess: async () => {
    // Copy CSS file if needed
    console.log('Build completed successfully');
  },
});
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.test.tsx',
        '.storybook/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### vitest.setup.ts

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### .storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/react-vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(vanillaExtractPlugin());
    return config;
  },
};

export default config;
```

### .storybook/preview.ts

```typescript
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
```

## Core Implementation

### src/index.ts

```typescript
/**
 * @yourorg/my-components
 *
 * A production-ready React component library
 *
 * @packageDocumentation
 */

// Components
export * from './components/index.js';

// Hooks
export * from './hooks/index.js';

// Tokens (for consumers who want to use design tokens)
export * from './tokens/index.js';

// Utilities
export { cn } from './utils/cn.js';
```

### src/components/index.ts

```typescript
// Button
export { Button, type ButtonProps } from './Button/index.js';

// Input
export { Input, type InputProps } from './Input/index.js';

// Card
export { Card, type CardProps } from './Card/index.js';
```

### src/tokens/index.ts

```typescript
export * from './colors.css.js';
export * from './spacing.css.js';
export * from './typography.css.js';
```

### src/tokens/colors.css.ts

```typescript
import { createGlobalTheme, createThemeContract } from '@vanilla-extract/css';

export const colorVars = createThemeContract({
  background: {
    primary: null,
    secondary: null,
    tertiary: null,
  },
  foreground: {
    primary: null,
    secondary: null,
    muted: null,
  },
  accent: {
    primary: null,
    secondary: null,
  },
  border: {
    default: null,
    focus: null,
  },
  status: {
    success: null,
    warning: null,
    error: null,
    info: null,
  },
});

export const lightTheme = createGlobalTheme(':root', colorVars, {
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },
  foreground: {
    primary: '#111827',
    secondary: '#374151',
    muted: '#6b7280',
  },
  accent: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
  },
  border: {
    default: '#e5e7eb',
    focus: '#3b82f6',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
});

export const darkTheme = createGlobalTheme('[data-theme="dark"]', colorVars, {
  background: {
    primary: '#111827',
    secondary: '#1f2937',
    tertiary: '#374151',
  },
  foreground: {
    primary: '#f9fafb',
    secondary: '#e5e7eb',
    muted: '#9ca3af',
  },
  accent: {
    primary: '#60a5fa',
    secondary: '#93c5fd',
  },
  border: {
    default: '#374151',
    focus: '#60a5fa',
  },
  status: {
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
  },
});
```

### src/tokens/spacing.css.ts

```typescript
import { createGlobalTheme } from '@vanilla-extract/css';

export const spaceVars = createGlobalTheme(':root', {
  space: {
    '0': '0',
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '8': '2rem',
    '10': '2.5rem',
    '12': '3rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
  },
  radii: {
    none: '0',
    sm: '0.125rem',
    default: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
});
```

### src/tokens/typography.css.ts

```typescript
import { createGlobalTheme } from '@vanilla-extract/css';

export const fontVars = createGlobalTheme(':root', {
  fontFamily: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
});
```

### src/utils/cn.ts

```typescript
import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function to merge class names
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
```

### src/components/Button/index.ts

```typescript
export { Button, type ButtonProps } from './Button.js';
```

### src/components/Button/Button.tsx

```typescript
import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn.js';
import * as styles from './Button.css.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
}

/**
 * Button component
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">
 *   Click me
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          styles.button,
          styles.variants[variant],
          styles.sizes[size],
          fullWidth && styles.fullWidth,
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className={styles.spinnerIcon}>
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.25"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
        {!loading && leftIcon && (
          <span className={styles.icon} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span className={loading ? styles.hiddenText : undefined}>{children}</span>
        {!loading && rightIcon && (
          <span className={styles.icon} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### src/components/Button/Button.css.ts

```typescript
import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { colorVars } from '../../tokens/colors.css.js';
import { spaceVars } from '../../tokens/spacing.css.js';
import { fontVars } from '../../tokens/typography.css.js';

export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spaceVars.space['2'],
  fontFamily: fontVars.fontFamily.sans,
  fontWeight: fontVars.fontWeight.medium,
  borderRadius: spaceVars.radii.md,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  outline: 'none',
  ':focus-visible': {
    outline: `2px solid ${colorVars.border.focus}`,
    outlineOffset: '2px',
  },
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const variants = styleVariants({
  primary: {
    backgroundColor: colorVars.accent.primary,
    color: '#ffffff',
    ':hover:not(:disabled)': {
      backgroundColor: colorVars.accent.secondary,
    },
  },
  secondary: {
    backgroundColor: colorVars.background.secondary,
    color: colorVars.foreground.primary,
    ':hover:not(:disabled)': {
      backgroundColor: colorVars.background.tertiary,
    },
  },
  outline: {
    backgroundColor: 'transparent',
    color: colorVars.foreground.primary,
    border: `1px solid ${colorVars.border.default}`,
    ':hover:not(:disabled)': {
      backgroundColor: colorVars.background.secondary,
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colorVars.foreground.primary,
    ':hover:not(:disabled)': {
      backgroundColor: colorVars.background.secondary,
    },
  },
  destructive: {
    backgroundColor: colorVars.status.error,
    color: '#ffffff',
    ':hover:not(:disabled)': {
      opacity: 0.9,
    },
  },
});

export const sizes = styleVariants({
  sm: {
    height: '32px',
    padding: `0 ${spaceVars.space['3']}`,
    fontSize: fontVars.fontSize.sm,
  },
  md: {
    height: '40px',
    padding: `0 ${spaceVars.space['4']}`,
    fontSize: fontVars.fontSize.base,
  },
  lg: {
    height: '48px',
    padding: `0 ${spaceVars.space['6']}`,
    fontSize: fontVars.fontSize.lg,
  },
});

export const fullWidth = style({
  width: '100%',
});

export const icon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1em',
  height: '1em',
});

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const spinner = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const spinnerIcon = style({
  width: '1em',
  height: '1em',
  animation: `${spin} 1s linear infinite`,
});

export const hiddenText = style({
  visibility: 'hidden',
});
```

### src/components/Button/Button.test.tsx

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button.js';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass(expect.stringContaining('primary'));

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass(expect.stringContaining('secondary'));
  });

  it('applies size styles', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass(expect.stringContaining('lg'));
  });

  it('handles disabled state', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('handles loading state', () => {
    render(<Button loading>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('renders left icon', () => {
    render(<Button leftIcon={<span data-testid="left-icon">←</span>}>With Icon</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Button rightIcon={<span data-testid="right-icon">→</span>}>With Icon</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies fullWidth style', () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole('button')).toHaveClass(expect.stringContaining('fullWidth'));
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });
});
```

### src/components/Button/Button.stories.tsx

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button.js';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    fullWidth: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button leftIcon={<span>←</span>}>Back</Button>
      <Button rightIcon={<span>→</span>}>Next</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button variant="primary" disabled>Primary</Button>
        <Button variant="secondary" disabled>Secondary</Button>
        <Button variant="outline" disabled>Outline</Button>
        <Button variant="ghost" disabled>Ghost</Button>
        <Button variant="destructive" disabled>Destructive</Button>
      </div>
    </div>
  ),
};
```

### src/hooks/index.ts

```typescript
export { useToggle } from './useToggle.js';
export { useMediaQuery } from './useMediaQuery.js';
```

### src/hooks/useToggle.ts

```typescript
import { useState, useCallback } from 'react';

/**
 * Hook for managing boolean toggle state
 *
 * @param initialValue - Initial toggle value
 * @returns Tuple of [value, toggle, setValue]
 *
 * @example
 * ```tsx
 * const [isOpen, toggle, setIsOpen] = useToggle(false);
 * ```
 */
export function useToggle(
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue];
}
```

### src/hooks/useMediaQuery.ts

```typescript
import { useState, useEffect } from 'react';

/**
 * Hook for responsive design using media queries
 *
 * @param query - Media query string
 * @returns Whether the media query matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}
```

## CLAUDE.md Integration

```markdown
# React Component Library

## Commands
- `npm run dev` - Watch mode
- `npm run build` - Build library
- `npm run storybook` - Start Storybook
- `npm test` - Run tests

## Architecture
- vanilla-extract for CSS-in-JS
- Storybook for documentation
- Vitest + Testing Library for tests
- Design tokens in src/tokens/

## Adding Components
1. Create folder in src/components/
2. Add Component.tsx, .css.ts, .test.tsx, .stories.tsx
3. Export from components/index.ts

## Design Tokens
- Colors: src/tokens/colors.css.ts
- Spacing: src/tokens/spacing.css.ts
- Typography: src/tokens/typography.css.ts

## Publishing
1. `npx changeset` - Create changeset
2. Merge to main
3. CI publishes automatically
```

## AI Suggestions

1. **Chromatic** - Add visual regression testing with Chromatic
2. **Design Token Generator** - Build Figma plugin to sync design tokens
3. **Component Variants** - Use class-variance-authority for complex variants
4. **Compound Components** - Implement compound component patterns
5. **Polymorphic Components** - Add "as" prop for element flexibility
6. **Animation Library** - Integrate framer-motion for animations
7. **Form Components** - Add form integration with react-hook-form
8. **Accessibility Audit** - Run axe-core in CI for a11y checks
9. **Bundle Analysis** - Add bundle size tracking with bundlephobia
10. **Theme Builder** - Create interactive theme customizer in Storybook
