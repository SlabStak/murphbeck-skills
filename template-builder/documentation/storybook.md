# Storybook Component Documentation

Production-ready Storybook setup for component documentation, visual testing, and design systems.

## Overview

Implement comprehensive component documentation with Storybook, including interactive examples, accessibility testing, and design tokens. This template provides a complete setup for React component libraries.

## Quick Start

```bash
npx storybook@latest init
npm install @storybook/addon-a11y @storybook/addon-designs chromatic
```

## Storybook Configuration

### Main Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-designs',
    '@storybook/addon-coverage',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  typescript: {
    check: true,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => {
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules');
        }
        return true;
      },
    },
  },
};

export default config;
```

### Preview Configuration

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
      sort: 'requiredFirst',
    },
    docs: {
      theme: themes.light,
      toc: true,
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
    layout: 'centered',
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: ['light', 'dark'],
        showName: true,
      },
    },
    locale: {
      name: 'Locale',
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        items: ['en', 'es', 'fr', 'de', 'ja'],
        showName: true,
      },
    },
  },
};

export default preview;
```

### Custom Theme

```typescript
// .storybook/theme.ts
import { create } from '@storybook/theming/create';

export default create({
  base: 'light',
  brandTitle: 'My Design System',
  brandUrl: 'https://example.com',
  brandImage: '/logo.svg',
  brandTarget: '_self',

  // Colors
  colorPrimary: '#3B82F6',
  colorSecondary: '#6366F1',

  // UI
  appBg: '#F8FAFC',
  appContentBg: '#FFFFFF',
  appBorderColor: '#E2E8F0',
  appBorderRadius: 8,

  // Text colors
  textColor: '#1E293B',
  textInverseColor: '#FFFFFF',
  textMutedColor: '#64748B',

  // Toolbar default and active colors
  barTextColor: '#64748B',
  barSelectedColor: '#3B82F6',
  barBg: '#FFFFFF',

  // Form colors
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  inputTextColor: '#1E293B',
  inputBorderRadius: 4,
});
```

## Component Stories

### Button Component Story

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './Button';

/**
 * Buttons allow users to take actions and make choices with a single tap.
 *
 * ## Usage
 *
 * ```tsx
 * import { Button } from '@/components/Button';
 *
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 *
 * ## Accessibility
 *
 * - Use clear, descriptive button text
 * - Ensure sufficient color contrast
 * - Provide focus states for keyboard navigation
 */
const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes.',
      },
    },
    design: {
      type: 'figma',
      url: 'https://figma.com/file/xxx/button',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      description: 'The visual style variant',
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      description: 'The size of the button',
      control: 'select',
      options: ['sm', 'md', 'lg'],
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    disabled: {
      description: 'Whether the button is disabled',
      control: 'boolean',
    },
    loading: {
      description: 'Whether the button shows a loading state',
      control: 'boolean',
    },
    fullWidth: {
      description: 'Whether the button takes full width',
      control: 'boolean',
    },
    onClick: {
      description: 'Click handler',
      action: 'clicked',
    },
  },
  args: {
    onClick: fn(),
    children: 'Button',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default button style used for primary actions.
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * Secondary buttons are used for less prominent actions.
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * Outline buttons are used for tertiary actions.
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

/**
 * Ghost buttons are used for subtle actions.
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * Destructive buttons are used for dangerous actions like delete.
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

/**
 * Different button sizes for various contexts.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/**
 * Button with loading state shows a spinner.
 */
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

/**
 * Disabled buttons cannot be interacted with.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

/**
 * Button with icon on the left.
 */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Item
      </>
    ),
  },
};

/**
 * Full width button spans the container.
 */
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
};

/**
 * All variants displayed together.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};
```

### Form Input Story

```typescript
// src/components/Input/Input.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    error: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    value: 'invalid-email',
    error: 'Please enter a valid email address',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    helperText: 'Must be at least 8 characters',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    value: 'Cannot edit this',
    disabled: true,
  },
};

/**
 * This story includes interaction tests.
 */
export const WithInteractionTest: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the input
    const input = canvas.getByRole('textbox');

    // Type in the input
    await userEvent.type(input, 'john_doe');

    // Verify the value
    await expect(input).toHaveValue('john_doe');
  },
};

/**
 * Test validation on blur.
 */
export const ValidationOnBlur: Story = {
  args: {
    label: 'Email',
    type: 'email',
    required: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    // Focus and blur without entering value
    await userEvent.click(input);
    await userEvent.tab();

    // Check for error state
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  },
};
```

### Card Component Story

```typescript
// src/components/Card/Card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { Button } from '../Button';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Card Title</h3>
        <p className="text-sm text-gray-500">Card description goes here</p>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card. It can contain any content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Confirm Action</h3>
      </CardHeader>
      <CardContent>
        <p>Are you sure you want to proceed with this action?</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Confirm</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Card>
      <img
        src="https://picsum.photos/400/200"
        alt="Card image"
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <CardHeader>
        <h3 className="text-lg font-semibold">Image Card</h3>
      </CardHeader>
      <CardContent>
        <p>A card with an image header.</p>
      </CardContent>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <h3 className="text-lg font-semibold">Interactive Card</h3>
      </CardHeader>
      <CardContent>
        <p>Hover over this card to see the effect.</p>
      </CardContent>
    </Card>
  ),
};
```

## MDX Documentation

```mdx
{/* src/docs/Introduction.mdx */}
import { Meta, Canvas, Story, Controls } from '@storybook/blocks';

<Meta title="Introduction" />

# Design System

Welcome to our design system documentation. This guide contains all the components, patterns, and guidelines needed to build consistent user interfaces.

## Getting Started

Install the package:

```bash
npm install @company/design-system
```

Import and use components:

```tsx
import { Button, Card, Input } from '@company/design-system';

function App() {
  return (
    <Card>
      <Input label="Email" />
      <Button>Submit</Button>
    </Card>
  );
}
```

## Design Principles

1. **Consistency** - Use consistent patterns across all interfaces
2. **Accessibility** - All components meet WCAG 2.1 AA standards
3. **Performance** - Optimized for fast load times and smooth interactions
4. **Flexibility** - Components are customizable for different contexts

## Component Status

| Component | Status | Version |
|-----------|--------|---------|
| Button    | Stable | 2.0.0   |
| Input     | Stable | 2.0.0   |
| Card      | Stable | 2.0.0   |
| Modal     | Beta   | 1.5.0   |
| Toast     | Alpha  | 1.0.0   |

## Resources

- [Figma Design Files](https://figma.com)
- [GitHub Repository](https://github.com)
- [API Documentation](/docs/api)
```

## Test Runner Setup

```typescript
// .storybook/test-runner.ts
import type { TestRunnerConfig } from '@storybook/test-runner';
import { checkA11y, injectAxe } from 'axe-playwright';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  },
};

export default config;
```

## Visual Testing with Chromatic

```typescript
// .storybook/chromatic.config.ts
export default {
  projectToken: process.env.CHROMATIC_PROJECT_TOKEN,
  buildScriptName: 'build-storybook',
  onlyChanged: true,
  exitOnceUploaded: true,
  skip: process.env.CI !== 'true',
};
```

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build-storybook
          onlyChanged: true
```

## CLAUDE.md Integration

```markdown
## Storybook

### Commands
- `npm run storybook` - Start Storybook dev server
- `npm run build-storybook` - Build static Storybook
- `npm run test-storybook` - Run Storybook tests

### Key Files
- `.storybook/main.ts` - Storybook configuration
- `.storybook/preview.ts` - Preview configuration
- `src/**/*.stories.tsx` - Component stories

### Story Structure
- Export meta object with component info
- Export named stories for each variant
- Use `play` function for interaction tests

### Addons
- `@storybook/addon-a11y` - Accessibility testing
- `@storybook/addon-designs` - Figma integration
- `@storybook/addon-interactions` - Interactive tests
```

## AI Suggestions

1. **Design Tokens**: Document design tokens in Storybook
2. **Figma Integration**: Connect components to Figma designs
3. **Accessibility Audits**: Run automated a11y checks
4. **Visual Regression**: Integrate Chromatic for visual testing
5. **Composition**: Create complex component compositions
6. **Performance**: Profile component rendering performance
7. **Dark Mode**: Document dark mode variants
8. **Responsive**: Test responsive behavior at breakpoints
9. **State Management**: Document state patterns
10. **Migration Guides**: Create upgrade documentation
