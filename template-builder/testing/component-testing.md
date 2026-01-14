# Component Testing Templates

Production-ready component testing patterns with React Testing Library and Vue Test Utils.

## Overview

- **React Testing Library**: User-centric component testing
- **Vue Test Utils**: Vue component testing patterns
- **Accessibility Testing**: a11y checks in component tests
- **Snapshot Testing**: Component snapshot strategies

## Quick Start

```bash
# React Testing Library
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Vue Test Utils
npm install -D @vue/test-utils @testing-library/vue
```

## React Testing Library

```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });
});
```

```typescript
// src/components/__tests__/Form.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '../ContactForm';

describe('ContactForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    render(<ContactForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello there!');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello there!',
      });
    });
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();

    render(<ContactForm onSubmit={mockOnSubmit} />);
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows error for invalid email', async () => {
    const user = userEvent.setup();

    render(<ContactForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<ContactForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello!');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
    });
  });

  it('shows success message after submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<ContactForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello!');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument();
  });

  it('shows error message on submission failure', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockRejectedValue(new Error('Network error'));

    render(<ContactForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello!');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/failed to send/i)).toBeInTheDocument();
  });
});
```

```typescript
// src/components/__tests__/DataTable.test.tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';

const mockData = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'User' },
];

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role', sortable: false },
];

describe('DataTable', () => {
  it('renders table with data', () => {
    render(<DataTable data={mockData} columns={columns} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4); // Header + 3 data rows
  });

  it('renders column headers', () => {
    render(<DataTable data={mockData} columns={columns} />);

    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument();
  });

  it('sorts data when clicking sortable column', async () => {
    const user = userEvent.setup();

    render(<DataTable data={mockData} columns={columns} />);

    await user.click(screen.getByRole('columnheader', { name: /name/i }));

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('Alice')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Bob')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Charlie')).toBeInTheDocument();

    // Click again for descending
    await user.click(screen.getByRole('columnheader', { name: /name/i }));
    const rowsDesc = screen.getAllByRole('row');
    expect(within(rowsDesc[1]).getByText('Charlie')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<DataTable data={[]} columns={columns} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DataTable data={[]} columns={columns} loading />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('calls onRowClick when row is clicked', async () => {
    const user = userEvent.setup();
    const handleRowClick = jest.fn();

    render(
      <DataTable data={mockData} columns={columns} onRowClick={handleRowClick} />
    );

    await user.click(screen.getByText('Alice'));
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('handles row selection', async () => {
    const user = userEvent.setup();
    const handleSelectionChange = jest.fn();

    render(
      <DataTable
        data={mockData}
        columns={columns}
        selectable
        onSelectionChange={handleSelectionChange}
      />
    );

    const checkbox = screen.getAllByRole('checkbox')[1]; // First data row
    await user.click(checkbox);

    expect(handleSelectionChange).toHaveBeenCalledWith([mockData[0]]);
  });

  it('handles select all', async () => {
    const user = userEvent.setup();
    const handleSelectionChange = jest.fn();

    render(
      <DataTable
        data={mockData}
        columns={columns}
        selectable
        onSelectionChange={handleSelectionChange}
      />
    );

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);

    expect(handleSelectionChange).toHaveBeenCalledWith(mockData);
  });
});
```

```typescript
// src/components/__tests__/Modal.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders when open', () => {
    render(
      <Modal open onClose={() => {}}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking overlay', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();

    render(
      <Modal open onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );

    await user.click(screen.getByTestId('modal-overlay'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when pressing Escape', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();

    render(
      <Modal open onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalled();
  });

  it('does not close when clicking modal content', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();

    render(
      <Modal open onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );

    await user.click(screen.getByText('Modal content'));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('traps focus within modal', async () => {
    const user = userEvent.setup();

    render(
      <Modal open onClose={() => {}}>
        <button>First</button>
        <button>Second</button>
      </Modal>
    );

    const firstButton = screen.getByText('First');
    const secondButton = screen.getByText('Second');

    firstButton.focus();
    await user.tab();
    expect(secondButton).toHaveFocus();

    await user.tab();
    expect(firstButton).toHaveFocus(); // Cycles back
  });

  it('renders with title', () => {
    render(
      <Modal open onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByRole('dialog', { name: /test modal/i })).toBeInTheDocument();
  });
});
```

## Vue Test Utils

```typescript
// src/components/__tests__/VueButton.spec.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button.vue';

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me',
      },
    });

    expect(wrapper.text()).toContain('Click me');
  });

  it('emits click event', async () => {
    const wrapper = mount(Button);

    await wrapper.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('applies variant class', () => {
    const wrapper = mount(Button, {
      props: { variant: 'primary' },
    });

    expect(wrapper.classes()).toContain('btn-primary');
  });

  it('shows loading spinner', () => {
    const wrapper = mount(Button, {
      props: { loading: true },
    });

    expect(wrapper.find('[data-testid="spinner"]').exists()).toBe(true);
  });
});
```

```typescript
// src/components/__tests__/VueForm.spec.ts
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ContactForm from '../ContactForm.vue';

describe('ContactForm', () => {
  it('submits form data', async () => {
    const wrapper = mount(ContactForm);

    await wrapper.find('[data-testid="name"]').setValue('John Doe');
    await wrapper.find('[data-testid="email"]').setValue('john@example.com');
    await wrapper.find('[data-testid="message"]').setValue('Hello!');
    await wrapper.find('form').trigger('submit.prevent');

    await flushPromises();

    expect(wrapper.emitted('submit')).toBeTruthy();
    expect(wrapper.emitted('submit')[0]).toEqual([
      {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello!',
      },
    ]);
  });

  it('shows validation errors', async () => {
    const wrapper = mount(ContactForm);

    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Name is required');
    expect(wrapper.text()).toContain('Email is required');
  });

  it('validates email format', async () => {
    const wrapper = mount(ContactForm);

    await wrapper.find('[data-testid="email"]').setValue('invalid');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Invalid email');
  });
});
```

## Accessibility Testing

```typescript
// src/components/__tests__/Accessibility.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { Form } from '../Form';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  describe('Button', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no violations when disabled', async () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Modal', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Modal open onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Form onSubmit={() => {}}>
          <label htmlFor="name">Name</label>
          <input id="name" type="text" />
          <button type="submit">Submit</button>
        </Form>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper error association', async () => {
      const { container } = render(
        <Form onSubmit={() => {}}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            aria-invalid="true"
            aria-describedby="email-error"
          />
          <span id="email-error" role="alert">
            Invalid email
          </span>
        </Form>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# Component Testing

## Commands
- `npm test -- Button` - Test specific component
- `npm test -- --coverage` - With coverage
- `npm test -- --watch` - Watch mode

## Testing Patterns
- Query by role over test IDs
- Use userEvent for interactions
- Test accessibility with axe
- Avoid testing implementation details

## Best Practices
- Test user behavior, not implementation
- Use findBy for async content
- Mock only external dependencies
- Keep tests focused and readable
```

## AI Suggestions

1. **Storybook integration** - Generate tests from stories
2. **Visual snapshots** - Add visual regression tests
3. **Performance testing** - Test render performance
4. **Memory leak detection** - Test for memory leaks
5. **SSR testing** - Test server-side rendering
6. **Suspense testing** - Test loading states
7. **Error boundary testing** - Test error handling
8. **Context testing** - Test context consumers
9. **Portal testing** - Test portal components
10. **Animation testing** - Test CSS transitions
