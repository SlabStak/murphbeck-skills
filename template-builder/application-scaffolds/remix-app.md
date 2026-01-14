# Remix Application Template

## Overview
Full-stack React framework with nested routes, progressive enhancement, data loading, and built-in form handling.

## Quick Start

```bash
# Create project
npx create-remix@latest my-app --template remix-run/indie-stack

# Or minimal setup
npx create-remix@latest my-app

cd my-app

# Install additional dependencies
npm install @prisma/client bcryptjs
npm install zod zodix tiny-invariant
npm install clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Dev dependencies
npm install -D prisma @types/bcryptjs
```

## Project Structure

```
app/
├── routes/
│   ├── _index.tsx                  # Homepage (/)
│   ├── _auth.tsx                   # Auth layout
│   ├── _auth.login.tsx             # Login (/login)
│   ├── _auth.register.tsx          # Register (/register)
│   ├── _app.tsx                    # App layout (authenticated)
│   ├── _app.dashboard.tsx          # Dashboard (/dashboard)
│   ├── _app.dashboard._index.tsx   # Dashboard index
│   ├── _app.dashboard.settings.tsx # Settings (/dashboard/settings)
│   ├── _app.projects.tsx           # Projects layout
│   ├── _app.projects._index.tsx    # Projects list
│   ├── _app.projects.$id.tsx       # Project detail
│   ├── _app.projects.$id.edit.tsx  # Project edit
│   ├── _app.projects.new.tsx       # New project
│   ├── api.webhooks.$.tsx          # Webhook handler
│   └── healthcheck.tsx             # Health check endpoint
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Form.tsx
│   ├── ErrorBoundary.tsx
│   └── Navbar.tsx
├── lib/
│   ├── db.server.ts                # Prisma client
│   ├── session.server.ts           # Session management
│   ├── auth.server.ts              # Authentication
│   ├── utils.ts
│   └── env.server.ts               # Environment validation
├── models/
│   ├── user.server.ts
│   └── project.server.ts
├── styles/
│   └── tailwind.css
├── entry.client.tsx
├── entry.server.tsx
└── root.tsx
```

## Environment Variables

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/myapp"
SESSION_SECRET="your-super-secret-session-key"

# Optional
STRIPE_SECRET_KEY="sk_test_..."
RESEND_API_KEY="re_..."
SENTRY_DSN="https://..."
```

## Root Layout

```tsx
// app/root.tsx
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from '@remix-run/react';
import { getUser } from '~/lib/session.server';
import stylesheet from '~/styles/tailwind.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
];

export const meta: MetaFunction = () => [
  { charset: 'utf-8' },
  { title: 'My Remix App' },
  { viewport: 'width=device-width,initial-scale=1' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-background text-foreground">
        <Outlet context={{ user }} />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <html lang="en" className="h-full">
        <head>
          <Meta />
          <Links />
        </head>
        <body className="h-full">
          <div className="flex min-h-full flex-col items-center justify-center">
            <h1 className="text-4xl font-bold">{error.status}</h1>
            <p className="mt-2 text-lg">{error.statusText}</p>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <div className="flex min-h-full flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">Error</h1>
          <p className="mt-2 text-lg">Something went wrong</p>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
```

## Authentication

### Session Management
```typescript
// app/lib/session.server.ts
import { createCookieSessionStorage, redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { getUserById } from '~/models/user.server';

invariant(process.env.SESSION_SECRET, 'SESSION_SECRET must be set');

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === 'production',
  },
});

const USER_SESSION_KEY = 'userId';

export async function getSession(request: Request) {
  const cookie = request.headers.get('Cookie');
  return sessionStorage.getSession(cookie);
}

export async function getUserId(request: Request): Promise<string | undefined> {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;

  const user = await getUserById(userId);
  if (!user) {
    throw await logout(request);
  }

  return user;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);
  const user = await getUserById(userId);
  if (!user) {
    throw await logout(request);
  }
  return user;
}

export async function createUserSession({
  request,
  userId,
  remember,
  redirectTo,
}: {
  request: Request;
  userId: string;
  remember: boolean;
  redirectTo: string;
}) {
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session, {
        maxAge: remember ? 60 * 60 * 24 * 7 : undefined,
      }),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect('/login', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}
```

### User Model
```typescript
// app/models/user.server.ts
import bcrypt from 'bcryptjs';
import { db } from '~/lib/db.server';

export type { User } from '@prisma/client';

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export async function createUser(
  email: string,
  password: string,
  name?: string
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });
}

export async function verifyLogin(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.password) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string }
) {
  return db.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id: string) {
  return db.user.delete({ where: { id } });
}
```

### Login Route
```tsx
// app/routes/_auth.login.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import { z } from 'zod';
import { zx } from 'zodix';
import { verifyLogin } from '~/models/user.server';
import { createUserSession, getUserId } from '~/lib/session.server';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.string().optional(),
  redirectTo: z.string().default('/dashboard'),
});

export const meta: MetaFunction = () => [{ title: 'Login' }];

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/dashboard');
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const result = await zx.parseFormSafe(request, loginSchema);

  if (!result.success) {
    return json(
      { errors: result.error.flatten().fieldErrors, values: null },
      { status: 400 }
    );
  }

  const { email, password, remember, redirectTo } = result.data;

  const user = await verifyLogin(email, password);

  if (!user) {
    return json(
      {
        errors: { email: ['Invalid email or password'], password: [] },
        values: { email },
      },
      { status: 400 }
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: remember === 'on',
    redirectTo,
  });
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <h1 className="text-2xl font-bold mb-8 text-center">Welcome back</h1>

        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={actionData?.values?.email}
              aria-invalid={actionData?.errors?.email ? true : undefined}
              aria-describedby="email-error"
            />
            {actionData?.errors?.email && (
              <p id="email-error" className="mt-1 text-sm text-red-500">
                {actionData.errors.email[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={actionData?.errors?.password ? true : undefined}
            />
            {actionData?.errors?.password && (
              <p className="mt-1 text-sm text-red-500">
                {actionData.errors.password[0]}
              </p>
            )}
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="remember" className="text-sm">
                Remember me
              </label>
            </div>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to={{ pathname: '/register', search: searchParams.toString() }}
            className="text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

## Data Loading with Nested Routes

### Projects Layout
```tsx
// app/routes/_app.projects.tsx
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, Outlet, useLoaderData, useLocation } from '@remix-run/react';
import { Plus } from 'lucide-react';
import { requireUser } from '~/lib/session.server';
import { getProjectsByUserId } from '~/models/project.server';
import { Button } from '~/components/ui/Button';
import { cn } from '~/lib/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const projects = await getProjectsByUserId(user.id);
  return json({ projects });
}

export default function ProjectsLayout() {
  const { projects } = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 border-r p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Projects</h2>
          <Button size="sm" asChild>
            <Link to="new">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <nav className="space-y-1">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={project.id}
              className={cn(
                'block px-3 py-2 rounded-md text-sm transition-colors',
                location.pathname.includes(project.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              {project.name}
            </Link>
          ))}

          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-2">
              No projects yet
            </p>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

### Project Detail
```tsx
// app/routes/_app.projects.$id.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Link, useFetcher, useLoaderData } from '@remix-run/react';
import { Pencil, Trash2 } from 'lucide-react';
import invariant from 'tiny-invariant';
import { requireUser } from '~/lib/session.server';
import { getProject, deleteProject } from '~/models/project.server';
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  invariant(params.id, 'Project ID is required');

  const project = await getProject(params.id, user.id);
  if (!project) {
    throw new Response('Project not found', { status: 404 });
  }

  return json({ project });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  invariant(params.id, 'Project ID is required');

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'delete') {
    await deleteProject(params.id, user.id);
    return redirect('/projects');
  }

  return json({ error: 'Invalid intent' }, { status: 400 });
}

export default function ProjectDetail() {
  const { project } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== 'idle';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="edit">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <fetcher.Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </fetcher.Form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Description
            </label>
            <p className="mt-1">{project.description || 'No description'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Status
            </label>
            <p className="mt-1 capitalize">{project.status.toLowerCase()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Created
            </label>
            <p className="mt-1">
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### New Project Form
```tsx
// app/routes/_app.projects.new.tsx
import type { ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { z } from 'zod';
import { zx } from 'zodix';
import { requireUser } from '~/lib/session.server';
import { createProject } from '~/models/project.server';
import { Input } from '~/components/ui/Input';
import { Textarea } from '~/components/ui/Textarea';
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  const result = await zx.parseFormSafe(request, createProjectSchema);

  if (!result.success) {
    return json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const project = await createProject({
    ...result.data,
    userId: user.id,
  });

  return redirect(`/projects/${project.id}`);
}

export default function NewProject() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Project Name
            </label>
            <Input
              id="name"
              name="name"
              placeholder="My awesome project"
              aria-invalid={actionData?.errors?.name ? true : undefined}
            />
            {actionData?.errors?.name && (
              <p className="mt-1 text-sm text-red-500">
                {actionData.errors.name[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="A brief description of your project"
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href="/projects">Cancel</a>
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
```

## Optimistic UI

```tsx
// app/routes/_app.tasks.$id.tsx
import { useFetcher } from '@remix-run/react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

function TaskItem({ task }: { task: Task }) {
  const fetcher = useFetcher();

  // Optimistic update
  const completed = fetcher.formData
    ? fetcher.formData.get('completed') === 'true'
    : task.completed;

  return (
    <fetcher.Form method="post" className="flex items-center gap-3">
      <input type="hidden" name="intent" value="toggle" />
      <input type="hidden" name="taskId" value={task.id} />
      <input
        type="hidden"
        name="completed"
        value={(!task.completed).toString()}
      />
      <button
        type="submit"
        className={`h-5 w-5 rounded border-2 ${
          completed ? 'bg-primary border-primary' : 'border-gray-300'
        }`}
      >
        {completed && <CheckIcon className="h-4 w-4 text-white" />}
      </button>
      <span className={completed ? 'line-through text-muted-foreground' : ''}>
        {task.title}
      </span>
    </fetcher.Form>
  );
}
```

## Resource Routes

```typescript
// app/routes/api.projects.$id.ts
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { requireUser } from '~/lib/session.server';
import { getProject, updateProject, deleteProject } from '~/models/project.server';

// GET /api/projects/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  invariant(params.id, 'Project ID is required');

  const project = await getProject(params.id, user.id);
  if (!project) {
    return json({ error: 'Project not found' }, { status: 404 });
  }

  return json({ project });
}

// PATCH /api/projects/:id
export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  invariant(params.id, 'Project ID is required');

  if (request.method === 'DELETE') {
    await deleteProject(params.id, user.id);
    return json({ success: true });
  }

  if (request.method === 'PATCH') {
    const data = await request.json();
    const project = await updateProject(params.id, user.id, data);
    return json({ project });
  }

  return json({ error: 'Method not allowed' }, { status: 405 });
}
```

## Error Handling

```tsx
// app/routes/_app.projects.$id.tsx
import { isRouteErrorResponse, useRouteError } from '@remix-run/react';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h1 className="text-2xl font-bold">Project Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The project you're looking for doesn't exist or you don't have access.
          </p>
          <Button asChild className="mt-4">
            <Link to="/projects">Back to Projects</Link>
          </Button>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
    </div>
  );
}
```

## Testing

```typescript
// app/routes/_auth.login.test.ts
import { createRemixStub } from '@remix-run/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage, { action } from './_auth.login';

describe('Login Page', () => {
  it('renders login form', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/login',
        Component: LoginPage,
        loader: () => ({}),
      },
    ]);

    render(<RemixStub initialEntries={['/login']} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();

    const RemixStub = createRemixStub([
      {
        path: '/login',
        Component: LoginPage,
        loader: () => ({}),
        action,
      },
    ]);

    render(<RemixStub initialEntries={['/login']} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# Remix Application

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx prisma studio` - Database GUI

## Route Conventions
- `_index.tsx` - Index route
- `_layout.tsx` - Layout route (no segment)
- `$param.tsx` - Dynamic segment
- `$.tsx` - Splat route (catch-all)
- `route.tsx` - Co-located in folder

## Data Flow
- `loader` - GET data (runs on server)
- `action` - POST/PUT/DELETE (form submissions)
- `useLoaderData` - Access loader data
- `useActionData` - Access action response
- `useFetcher` - Non-navigating mutations

## Authentication
- Session: `app/lib/session.server.ts`
- User model: `app/models/user.server.ts`
- Require auth: `requireUser(request)`

## Forms
- Native `<Form>` component
- Progressive enhancement
- `useNavigation` for loading states
- `useFetcher` for inline mutations
```

## AI Suggestions

1. **Intelligent Prefetching** - Use ML to predict user navigation patterns and prefetch routes
2. **Form Auto-Save** - Automatically save form drafts with conflict resolution
3. **Smart Error Recovery** - AI-powered suggestions for common errors and recovery paths
4. **Query Optimization** - Analyze loader patterns and suggest query batching/caching
5. **Route-Based Code Splitting** - Automatic bundle analysis and optimization recommendations
6. **Session Analytics** - Track user flows and identify friction points in multi-step processes
7. **Validation Suggestions** - AI-generated Zod schemas based on database models
8. **Performance Monitoring** - Real-time loader/action performance analysis with alerts
9. **A/B Testing Integration** - Built-in experiment framework with server-side flag evaluation
10. **Offline Support** - Intelligent service worker generation for offline-first capabilities
