# Database Migration Workflow

A safe workflow for planning, executing, and verifying database schema migrations in production applications.

---

## WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                   DATABASE MIGRATION WORKFLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │   PLAN   │ → │  DEVELOP │ → │   TEST   │ → │  DEPLOY  │        │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│       ↓              ↓              ↓              ↓               │
│   Schema        Migration       Local &         Staged            │
│   Design        Scripts        Staging         Rollout            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: PLAN

### Skills Used
- `/prisma-builder` or `/drizzle-builder` - Schema design
- `/api-design` - API impact analysis

### Steps

```bash
# 1. Document current schema
npx prisma db pull  # or equivalent

# 2. Design new schema
/prisma-builder schema

# 3. Analyze impact
# - Which tables are affected?
# - Which queries need updating?
# - What's the data migration path?
```

### Migration Planning Document

```markdown
## Migration Plan: [Name]

### Summary
[Brief description of the change]

### Schema Changes

#### Tables Modified
| Table | Change | Risk Level |
|-------|--------|------------|
| users | Add column `role` | Low |
| orders | Add index on `created_at` | Medium |

#### New Tables
- `user_roles` - Stores role definitions

#### Removed Tables
- None

### Data Migration
- Existing users get default role 'user'
- No data loss expected

### API Impact
- GET /users now returns `role` field
- New endpoint: GET /roles

### Rollback Plan
1. Run down migration
2. Deploy previous API version
3. No data loss expected

### Estimated Downtime
- Zero downtime (backward compatible)
```

### Risk Assessment

```markdown
## Risk Assessment

### High Risk Migrations
- [ ] Dropping columns/tables
- [ ] Changing column types
- [ ] Removing indexes
- [ ] Large table modifications

### Medium Risk
- [ ] Adding NOT NULL columns
- [ ] Adding unique constraints
- [ ] Creating new indexes on large tables

### Low Risk
- [ ] Adding nullable columns
- [ ] Adding new tables
- [ ] Adding indexes on small tables

### Mitigation Strategies
1. Test on production-like data
2. Run during low-traffic period
3. Have rollback ready
4. Monitor query performance
```

---

## PHASE 2: DEVELOP

### Skills Used
- `/prisma-builder` - Prisma migrations
- `/drizzle-builder` - Drizzle migrations

### Prisma Migration

```bash
# 1. Update schema
# Edit prisma/schema.prisma

# 2. Generate migration
npx prisma migrate dev --name add_user_roles

# 3. Review generated SQL
cat prisma/migrations/*/migration.sql
```

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)  // New field
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
  MODERATOR
}

// New table
model UserRole {
  id          String @id @default(cuid())
  name        String @unique
  permissions Json
}
```

### Drizzle Migration

```typescript
// drizzle/schema.ts
import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['USER', 'ADMIN', 'MODERATOR']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: roleEnum('role').default('USER'),  // New field
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

```bash
# Generate migration
npx drizzle-kit generate:pg

# Review migration
cat drizzle/0001_add_user_roles.sql
```

### Data Migration Script

```typescript
// scripts/migrate-data.ts
import { prisma } from '@/lib/prisma';

async function migrateUserRoles() {
  console.log('Starting data migration...');

  // Batch process for large tables
  const batchSize = 1000;
  let processed = 0;

  while (true) {
    const users = await prisma.user.findMany({
      where: { role: null },
      take: batchSize,
    });

    if (users.length === 0) break;

    await prisma.user.updateMany({
      where: {
        id: { in: users.map(u => u.id) },
      },
      data: { role: 'USER' },
    });

    processed += users.length;
    console.log(`Processed ${processed} users...`);
  }

  console.log(`Migration complete. ${processed} users updated.`);
}

migrateUserRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## PHASE 3: TEST

### Skills Used
- `/test-gen` - Migration tests
- `/vitest-builder` - Test runner

### Local Testing

```bash
# 1. Reset local database
npx prisma migrate reset

# 2. Run migrations
npx prisma migrate deploy

# 3. Seed test data
npx prisma db seed

# 4. Run application tests
npm run test
```

### Migration Tests

```typescript
// tests/migrations/user-roles.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('User Roles Migration', () => {
  beforeAll(async () => {
    // Set up test data
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should have role column with default value', async () => {
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
    });

    expect(user?.role).toBe('USER');
  });

  it('should allow setting role to ADMIN', async () => {
    const user = await prisma.user.update({
      where: { email: 'test@example.com' },
      data: { role: 'ADMIN' },
    });

    expect(user.role).toBe('ADMIN');
  });

  it('should reject invalid role values', async () => {
    await expect(
      prisma.user.update({
        where: { email: 'test@example.com' },
        data: { role: 'INVALID' as any },
      })
    ).rejects.toThrow();
  });
});
```

### Staging Deployment

```bash
# 1. Deploy to staging
DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy

# 2. Run data migration
DATABASE_URL=$STAGING_DATABASE_URL npx ts-node scripts/migrate-data.ts

# 3. Verify in staging
# - Check schema is correct
# - Run integration tests
# - Verify API responses
```

---

## PHASE 4: DEPLOY

### Skills Used
- `/deploy-vercel` - Deploy application
- `/ci-cd` - Automated deployment

### Deployment Checklist

```markdown
## Pre-Deployment Checklist

### Database
- [ ] Migration SQL reviewed
- [ ] Rollback SQL prepared
- [ ] Backup taken
- [ ] Tested on staging

### Application
- [ ] Code changes deployed
- [ ] Environment variables updated
- [ ] Cache cleared (if needed)

### Monitoring
- [ ] Database metrics dashboard ready
- [ ] Query performance monitoring enabled
- [ ] Error tracking configured
```

### Production Migration

```bash
# 1. Take database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 2. Deploy application with migration
# Option A: Prisma migrate deploy
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma migrate deploy

# Option B: Manual SQL execution
psql $DATABASE_URL -f migration.sql

# 3. Run data migration (if separate)
DATABASE_URL=$PRODUCTION_DATABASE_URL npx ts-node scripts/migrate-data.ts

# 4. Verify
npx prisma db pull  # Verify schema
```

### Zero-Downtime Strategy

```yaml
# For backward-compatible changes:
1. Deploy new schema (additive only)
2. Deploy new application code
3. Run data migration
4. Deploy cleanup migration (if needed)

# For breaking changes:
1. Add new column/table (nullable)
2. Deploy code that writes to both old and new
3. Migrate existing data
4. Deploy code that reads from new
5. Remove old column/table
```

### Rollback Procedure

```bash
# If something goes wrong:

# 1. Revert application
git revert HEAD
vercel --prod

# 2. Rollback migration
npx prisma migrate resolve --rolled-back 20240115_add_user_roles

# Or manual rollback:
psql $DATABASE_URL -f rollback.sql

# 3. Restore from backup (last resort)
psql $DATABASE_URL < backup-20240115.sql
```

---

## PHASE 5: VERIFY & MONITOR

### Skills Used
- `/observability` - Database monitoring

### Post-Migration Verification

```sql
-- Verify schema
\d users

-- Check data integrity
SELECT COUNT(*) FROM users WHERE role IS NULL;

-- Verify constraints
SELECT * FROM information_schema.table_constraints
WHERE table_name = 'users';

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'users';
```

### Performance Monitoring

```sql
-- Monitor query performance
SELECT
  query,
  calls,
  mean_time,
  total_time
FROM pg_stat_statements
WHERE query LIKE '%users%'
ORDER BY mean_time DESC
LIMIT 10;

-- Check table statistics
SELECT
  relname,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE relname = 'users';
```

### Monitoring Checklist

```markdown
## Post-Migration Monitoring

### Immediate (0-1 hour)
- [ ] No migration errors
- [ ] Application responding normally
- [ ] No increased error rates

### Short-term (1-24 hours)
- [ ] Query performance stable
- [ ] No slow queries introduced
- [ ] Data integrity verified

### Long-term (1 week)
- [ ] Index usage as expected
- [ ] Table size reasonable
- [ ] No orphaned data
```

---

## WORKFLOW COMMAND

```bash
# Full database migration workflow
claude "Add user roles to the database:
1. Plan the schema change
2. Create Prisma migration
3. Write data migration script
4. Test on staging
5. Deploy to production with rollback plan"
```

---

## SUCCESS CRITERIA

- [ ] Schema design documented
- [ ] Migration scripts created
- [ ] Tested on staging
- [ ] Backup taken
- [ ] Zero-downtime deployment
- [ ] Data integrity verified
- [ ] Performance monitored

$ARGUMENTS
