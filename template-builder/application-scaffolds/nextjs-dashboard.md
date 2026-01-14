# Next.js Dashboard Template

## Overview
Admin dashboard application with data visualization, role-based access control, real-time updates, and comprehensive UI components.

## Quick Start

```bash
# Create project
npx create-next-app@latest my-dashboard --typescript --tailwind --eslint --app --src-dir

cd my-dashboard

# Install dependencies
npm install @prisma/client next-auth @tanstack/react-query
npm install recharts @tremor/react date-fns
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install @radix-ui/react-avatar @radix-ui/react-tooltip
npm install zustand zod react-hook-form @hookform/resolvers
npm install lucide-react clsx tailwind-merge class-variance-authority
npm install @tanstack/react-table cmdk sonner
npm install socket.io-client

# Dev dependencies
npm install -D prisma @types/node
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Dashboard layout
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── analytics/page.tsx          # Analytics view
│   │   ├── users/
│   │   │   ├── page.tsx                # User list
│   │   │   └── [id]/page.tsx           # User detail
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── team/page.tsx
│   │   │   └── billing/page.tsx
│   │   └── [entity]/                   # Dynamic CRUD routes
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── users/route.ts
│   │   ├── analytics/route.ts
│   │   └── [...]/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                             # Base UI components
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── CommandMenu.tsx
│   │   └── UserNav.tsx
│   ├── charts/
│   │   ├── AreaChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── LineChart.tsx
│   │   └── PieChart.tsx
│   ├── data-table/
│   │   ├── DataTable.tsx
│   │   ├── DataTablePagination.tsx
│   │   ├── DataTableToolbar.tsx
│   │   └── columns/
│   └── forms/
│       ├── UserForm.tsx
│       └── SettingsForm.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── validations/
├── hooks/
│   ├── useUser.ts
│   ├── useRealTime.ts
│   └── usePermissions.ts
├── stores/
│   └── sidebar-store.ts
└── types/
    └── index.ts
```

## Environment Variables

```bash
# .env.local
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dashboard"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Real-time (optional)
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="us2"

# Analytics
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"
```

## Database Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role      @default(USER)
  status        UserStatus @default(ACTIVE)
  accounts      Account[]
  sessions      Session[]
  teamMemberships TeamMember[]
  activityLogs  ActivityLog[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Team {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  description String?
  members     TeamMember[]
  invitations TeamInvitation[]
  settings    TeamSettings?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model TeamMember {
  id        String       @id @default(cuid())
  role      TeamRole     @default(MEMBER)
  teamId    String
  team      Team         @relation(fields: [teamId], references: [id], onDelete: Cascade)
  userId    String
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  joinedAt  DateTime     @default(now())

  @@unique([teamId, userId])
}

enum TeamRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

model TeamInvitation {
  id        String   @id @default(cuid())
  email     String
  role      TeamRole @default(MEMBER)
  token     String   @unique
  teamId    String
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@unique([teamId, email])
}

model TeamSettings {
  id                    String  @id @default(cuid())
  teamId                String  @unique
  team                  Team    @relation(fields: [teamId], references: [id], onDelete: Cascade)
  allowMemberInvites    Boolean @default(false)
  defaultMemberRole     TeamRole @default(MEMBER)
  requireTwoFactor      Boolean @default(false)
}

model Permission {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  roles       RolePermission[]
}

model RolePermission {
  id           String     @id @default(cuid())
  role         Role
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([role, permissionId])
}

model ActivityLog {
  id        String   @id @default(cuid())
  action    String
  entity    String
  entityId  String?
  metadata  Json?
  ipAddress String?
  userAgent String?
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([entity, entityId])
  @@index([createdAt])
}

model Analytics {
  id          String   @id @default(cuid())
  date        DateTime @db.Date
  metric      String
  value       Float
  dimensions  Json?
  createdAt   DateTime @default(now())

  @@unique([date, metric])
  @@index([date])
  @@index([metric])
}
```

## Core Components

### Dashboard Layout
```tsx
// src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { CommandMenu } from '@/components/dashboard/CommandMenu';
import { Toaster } from '@/components/ui/sonner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {children}
        </main>
      </div>
      <CommandMenu />
      <Toaster />
    </div>
  );
}
```

### Sidebar Component
```tsx
// src/components/dashboard/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  FileText,
  Bell,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navigation = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    title: 'Settings',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Notifications', href: '/settings/notifications', icon: Bell },
      { name: 'Billing', href: '/settings/billing', icon: CreditCard },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'relative flex flex-col border-r bg-card transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                D
              </div>
              <span>Dashboard</span>
            </Link>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground mx-auto">
              D
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-6 px-2">
            {navigation.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h4>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    const linkContent = (
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <li key={item.name}>
                          <Tooltip>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side="right">
                              {item.name}
                            </TooltipContent>
                          </Tooltip>
                        </li>
                      );
                    }

                    return <li key={item.name}>{linkContent}</li>;
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
```

### Command Menu
```tsx
// src/components/dashboard/CommandMenu.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  Users,
  BarChart3,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/analytics'))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/users'))}>
            <Users className="mr-2 h-4 w-4" />
            Users
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push('/settings/profile'))}>
            <User className="mr-2 h-4 w-4" />
            Profile
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings/billing'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

### Data Table Component
```tsx
// src/components/data-table/DataTable.tsx
'use client';

import { useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  filterableColumns?: {
    id: string;
    title: string;
    options: { label: string; value: string }[];
  }[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  filterableColumns = [],
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        filterableColumns={filterableColumns}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

### Analytics Chart
```tsx
// src/components/charts/AreaChart.tsx
'use client';

import {
  AreaChart as TremorAreaChart,
  Card,
  Title,
  Text,
} from '@tremor/react';

interface ChartData {
  date: string;
  [key: string]: string | number;
}

interface AreaChartProps {
  title: string;
  description?: string;
  data: ChartData[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showGridLines?: boolean;
  showAnimation?: boolean;
}

const defaultValueFormatter = (value: number) =>
  Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);

export function AreaChart({
  title,
  description,
  data,
  categories,
  index,
  colors = ['blue', 'cyan'],
  valueFormatter = defaultValueFormatter,
  showLegend = true,
  showGridLines = true,
  showAnimation = true,
}: AreaChartProps) {
  return (
    <Card>
      <Title>{title}</Title>
      {description && <Text>{description}</Text>}
      <TremorAreaChart
        className="h-72 mt-4"
        data={data}
        index={index}
        categories={categories}
        colors={colors}
        valueFormatter={valueFormatter}
        showLegend={showLegend}
        showGridLines={showGridLines}
        showAnimation={showAnimation}
      />
    </Card>
  );
}
```

### Dashboard Stats Cards
```tsx
// src/components/dashboard/StatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'from last month',
  icon,
  trend,
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={cn('text-xs flex items-center gap-1 mt-1', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            <span>
              {change > 0 ? '+' : ''}{change}% {changeLabel}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  stats: StatCardProps[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
```

## Role-Based Access Control

```typescript
// src/lib/permissions.ts
import { Role } from '@prisma/client';

export type Permission =
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'analytics:read'
  | 'analytics:export'
  | 'settings:read'
  | 'settings:write'
  | 'team:manage'
  | 'billing:read'
  | 'billing:write';

const rolePermissions: Record<Role, Permission[]> = {
  USER: ['analytics:read'],
  ADMIN: [
    'users:read',
    'users:write',
    'analytics:read',
    'analytics:export',
    'settings:read',
    'settings:write',
    'team:manage',
  ],
  SUPER_ADMIN: [
    'users:read',
    'users:write',
    'users:delete',
    'analytics:read',
    'analytics:export',
    'settings:read',
    'settings:write',
    'team:manage',
    'billing:read',
    'billing:write',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return rolePermissions[role] ?? [];
}

// src/hooks/usePermissions.ts
'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, Permission } from '@/lib/permissions';
import { Role } from '@prisma/client';

export function usePermissions() {
  const { data: session } = useSession();
  const role = (session?.user?.role as Role) || 'USER';

  return {
    can: (permission: Permission) => hasPermission(role, permission),
    role,
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    isSuperAdmin: role === 'SUPER_ADMIN',
  };
}

// src/components/PermissionGate.tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/permissions';

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

## Real-Time Updates

```typescript
// src/hooks/useRealTime.ts
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseRealTimeOptions<T> {
  channel: string;
  event: string;
  onUpdate?: (data: T) => void;
}

export function useRealTime<T>({ channel, event, onUpdate }: UseRealTimeOptions<T>) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      path: '/api/socket',
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('join', channel);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on(event, (newData: T) => {
      setData(newData);
      onUpdate?.(newData);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('leave', channel);
      socketInstance.disconnect();
    };
  }, [channel, event, onUpdate]);

  const emit = (eventName: string, payload: any) => {
    socket?.emit(eventName, payload);
  };

  return { data, isConnected, emit };
}
```

## Activity Logging

```typescript
// src/lib/activity-log.ts
import { prisma } from './prisma';
import { headers } from 'next/headers';

interface LogActivityParams {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export async function logActivity({
  action,
  entity,
  entityId,
  userId,
  metadata,
}: LogActivityParams) {
  const headersList = headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');
  const userAgent = headersList.get('user-agent');

  await prisma.activityLog.create({
    data: {
      action,
      entity,
      entityId,
      userId,
      metadata,
      ipAddress,
      userAgent,
    },
  });
}

// Usage in API routes
export async function POST(request: Request) {
  // ... handle request

  await logActivity({
    action: 'user.created',
    entity: 'User',
    entityId: newUser.id,
    userId: session?.user?.id,
    metadata: { email: newUser.email },
  });
}
```

## Testing

```typescript
// __tests__/permissions.test.ts
import { hasPermission, getPermissions } from '@/lib/permissions';

describe('Permissions', () => {
  it('should allow USER to read analytics', () => {
    expect(hasPermission('USER', 'analytics:read')).toBe(true);
  });

  it('should not allow USER to write users', () => {
    expect(hasPermission('USER', 'users:write')).toBe(false);
  });

  it('should allow ADMIN to manage team', () => {
    expect(hasPermission('ADMIN', 'team:manage')).toBe(true);
  });

  it('should allow SUPER_ADMIN all permissions', () => {
    expect(hasPermission('SUPER_ADMIN', 'users:delete')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'billing:write')).toBe(true);
  });

  it('should return correct permissions for role', () => {
    const adminPermissions = getPermissions('ADMIN');
    expect(adminPermissions).toContain('users:read');
    expect(adminPermissions).toContain('users:write');
    expect(adminPermissions).not.toContain('users:delete');
  });
});
```

## CLAUDE.md Integration

```markdown
# Dashboard Application

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Run migrations

## Role Hierarchy
1. SUPER_ADMIN - Full access
2. ADMIN - User/team management
3. USER - Read-only analytics

## Key Files
- Permissions: `src/lib/permissions.ts`
- Auth config: `src/lib/auth.ts`
- Activity logging: `src/lib/activity-log.ts`

## API Patterns
- All routes check session via `getServerSession(authOptions)`
- Permission checks via `hasPermission(role, permission)`
- Activity logged via `logActivity()`

## Real-Time
- Socket.IO for live updates
- Channels: `analytics`, `users`, `notifications`

## Keyboard Shortcuts
- `Cmd+K` - Command menu
- `Cmd+P` - Profile settings
- `Cmd+B` - Billing
```

## AI Suggestions

1. **Predictive Analytics Dashboard** - ML-powered forecasting for key metrics with confidence intervals
2. **Anomaly Detection** - Real-time alerting when metrics deviate from expected patterns
3. **Smart Data Export** - AI-generated report summaries with key insights highlighted
4. **Natural Language Queries** - Allow users to ask questions about data in plain English
5. **Automated Insights** - Weekly AI-generated insights based on dashboard data trends
6. **Permission Recommendations** - ML-based role suggestions based on user activity patterns
7. **Dashboard Personalization** - AI-optimized widget layouts based on user preferences
8. **Predictive Search** - Command menu with ML-powered suggestion ranking
9. **Intelligent Caching** - Preload likely-needed data based on user navigation patterns
10. **Activity Pattern Analysis** - Detect unusual user behavior for security monitoring
