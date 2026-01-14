# Local Development Template

## Overview
Comprehensive local development setup with Docker Compose, environment management, database seeding, and development utilities.

## Quick Start
```bash
# Clone and setup
git clone <repo> && cd <project>
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

## Docker Compose Development

### docker-compose.yml
```yaml
version: '3.8'

services:
  # Application
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run dev

  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 5

  # MailHog (Email testing)
  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"
      - "8025:8025"

  # pgAdmin (Database UI)
  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    profiles:
      - tools

  # Redis Commander (Redis UI)
  redis-commander:
    image: rediscommander/redis-commander:latest
    ports:
      - "8081:8081"
    environment:
      REDIS_HOSTS: local:redis:6379
    depends_on:
      - redis
    profiles:
      - tools

volumes:
  postgres_data:
  redis_data:
  minio_data:
  pgadmin_data:

networks:
  default:
    name: myapp-network
```

### Dockerfile.dev
```dockerfile
# Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

## Environment Management

### .env.example
```bash
# .env.example - Copy to .env and fill in values

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapp
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=uploads
S3_REGION=us-east-1

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@example.com

# External Services
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=

# Feature Flags
FEATURE_NEW_DASHBOARD=true
FEATURE_BETA_API=false
```

### scripts/setup-env.ts
```typescript
// scripts/setup-env.ts
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import crypto from 'crypto';

const ENV_FILE = '.env';
const ENV_EXAMPLE = '.env.example';

interface EnvVar {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
  generate?: 'secret' | 'uuid';
}

async function setupEnv(): Promise<void> {
  console.log('\n🔧 Environment Setup\n');

  // Check if .env exists
  if (fs.existsSync(ENV_FILE)) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>(resolve => {
      rl.question('.env file already exists. Overwrite? (y/N): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('Keeping existing .env file');
      return;
    }
  }

  // Read example file
  const exampleContent = fs.readFileSync(ENV_EXAMPLE, 'utf-8');
  const lines = exampleContent.split('\n');

  const envVars: EnvVar[] = [];
  let currentDescription = '';

  for (const line of lines) {
    if (line.startsWith('#')) {
      currentDescription = line.slice(1).trim();
      continue;
    }

    if (line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');

      envVars.push({
        key: key.trim(),
        value: value.trim(),
        description: currentDescription
      });

      currentDescription = '';
    }
  }

  // Generate secrets
  const processedVars = envVars.map(env => {
    if (env.key.includes('SECRET') && !env.value) {
      return {
        ...env,
        value: crypto.randomBytes(32).toString('hex')
      };
    }
    return env;
  });

  // Write .env file
  const envContent = processedVars
    .map(env => {
      const comment = env.description ? `# ${env.description}\n` : '';
      return `${comment}${env.key}=${env.value}`;
    })
    .join('\n\n');

  fs.writeFileSync(ENV_FILE, envContent);

  console.log('✅ .env file created');
  console.log('\nGenerated secrets for:');
  processedVars
    .filter(env => env.key.includes('SECRET'))
    .forEach(env => console.log(`  - ${env.key}`));

  console.log('\n⚠️  Remember to update the OAuth credentials if needed\n');
}

setupEnv().catch(console.error);
```

## Database Setup

### scripts/setup-db.ts
```typescript
// scripts/setup-db.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function setupDatabase(): Promise<void> {
  console.log('\n🗃️ Database Setup\n');

  try {
    // Check connection
    console.log('Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connected');

    // Run migrations
    console.log('\nRunning migrations...');
    execSync('npx prisma migrate dev', { stdio: 'inherit' });
    console.log('✅ Migrations complete');

    // Seed database
    console.log('\nSeeding database...');
    await seedDatabase();
    console.log('✅ Database seeded');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedDatabase(): Promise<void> {
  // Check if already seeded
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: await hashPassword('admin123')
    }
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Test User',
        role: 'USER',
        password: await hashPassword('user123')
      }
    }),
    prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'USER',
        password: await hashPassword('demo123')
      }
    })
  ]);
  console.log(`Created ${users.length} test users`);

  // Create sample data
  await createSampleData(admin.id);
}

async function createSampleData(userId: string): Promise<void> {
  // Create sample projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Sample Project 1',
        description: 'A sample project for testing',
        ownerId: userId,
        status: 'ACTIVE'
      }
    }),
    prisma.project.create({
      data: {
        name: 'Sample Project 2',
        description: 'Another sample project',
        ownerId: userId,
        status: 'ACTIVE'
      }
    })
  ]);
  console.log(`Created ${projects.length} sample projects`);
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 10);
}

setupDatabase();
```

### prisma/seed.ts
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...\n');

  // Clear existing data (optional)
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      return prisma.user.create({
        data: {
          email: faker.internet.email().toLowerCase(),
          name: faker.person.fullName(),
          password: await bcrypt.hash('password123', 10),
          role: faker.helpers.arrayElement(['USER', 'USER', 'USER', 'ADMIN']),
          avatar: faker.image.avatar(),
          createdAt: faker.date.past()
        }
      });
    })
  );

  console.log(`Created ${users.length} users`);

  // Create projects
  const projects = await Promise.all(
    users.slice(0, 5).flatMap(user =>
      Array.from({ length: faker.number.int({ min: 1, max: 3 }) }).map(() =>
        prisma.project.create({
          data: {
            name: faker.company.catchPhrase(),
            description: faker.lorem.paragraph(),
            ownerId: user.id,
            status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
            createdAt: faker.date.past()
          }
        })
      )
    )
  );

  console.log(`Created ${projects.length} projects`);

  // Create tasks
  const tasks = await Promise.all(
    projects.flatMap(project =>
      Array.from({ length: faker.number.int({ min: 3, max: 10 }) }).map(() =>
        prisma.task.create({
          data: {
            title: faker.lorem.sentence(),
            description: faker.lorem.paragraph(),
            projectId: project.id,
            assigneeId: faker.helpers.arrayElement(users).id,
            status: faker.helpers.arrayElement(['TODO', 'IN_PROGRESS', 'DONE']),
            priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
            dueDate: faker.date.future(),
            createdAt: faker.date.past()
          }
        })
      )
    )
  );

  console.log(`Created ${tasks.length} tasks`);

  console.log('\n✅ Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Development Scripts

### scripts/dev-setup.sh
```bash
#!/usr/bin/env bash
# scripts/dev-setup.sh - Complete development setup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "╔════════════════════════════════════════╗"
echo "║     Development Environment Setup      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  local missing=()

  command -v node >/dev/null 2>&1 || missing+=("node")
  command -v npm >/dev/null 2>&1 || missing+=("npm")
  command -v docker >/dev/null 2>&1 || missing+=("docker")
  command -v docker-compose >/dev/null 2>&1 || missing+=("docker-compose")

  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Missing required tools: ${missing[*]}"
    exit 1
  fi

  log_success "All prerequisites installed"
}

# Setup environment
setup_env() {
  log_info "Setting up environment..."

  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      cp .env.example .env
      log_success "Created .env from .env.example"

      # Generate secrets
      if command -v openssl >/dev/null 2>&1; then
        JWT_SECRET=$(openssl rand -hex 32)
        SESSION_SECRET=$(openssl rand -hex 32)

        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env 2>/dev/null || \
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env

        sed -i '' "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env 2>/dev/null || \
        sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env

        log_success "Generated secure secrets"
      fi
    else
      log_error ".env.example not found"
      exit 1
    fi
  else
    log_info ".env already exists"
  fi
}

# Install dependencies
install_deps() {
  log_info "Installing dependencies..."
  npm install
  log_success "Dependencies installed"
}

# Start services
start_services() {
  log_info "Starting Docker services..."
  docker-compose up -d db redis minio mailhog
  log_success "Services started"

  # Wait for services
  log_info "Waiting for services to be ready..."
  sleep 5

  # Check database
  until docker-compose exec -T db pg_isready -U postgres; do
    log_info "Waiting for database..."
    sleep 2
  done
  log_success "Database is ready"
}

# Setup database
setup_database() {
  log_info "Setting up database..."

  # Generate Prisma client
  npx prisma generate

  # Run migrations
  npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate dev

  # Seed database
  npx prisma db seed

  log_success "Database setup complete"
}

# Setup storage
setup_storage() {
  log_info "Setting up MinIO storage..."

  # Wait for MinIO
  until curl -s http://localhost:9000/minio/health/live >/dev/null; do
    sleep 2
  done

  # Create bucket using mc client (if available) or API
  if command -v mc >/dev/null 2>&1; then
    mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null || true
    mc mb local/uploads --ignore-existing 2>/dev/null || true
  fi

  log_success "Storage setup complete"
}

# Main
main() {
  check_prerequisites
  setup_env
  install_deps
  start_services
  setup_database
  setup_storage

  echo ""
  log_success "Development environment is ready!"
  echo ""
  echo "Available services:"
  echo "  App:          http://localhost:3000"
  echo "  Database:     postgresql://localhost:5432/myapp"
  echo "  Redis:        redis://localhost:6379"
  echo "  MinIO:        http://localhost:9000 (Console: 9001)"
  echo "  MailHog:      http://localhost:8025"
  echo ""
  echo "Run 'npm run dev' to start the development server"
  echo ""
}

main
```

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:all": "docker-compose up -d && npm run dev",
    "dev:setup": "./scripts/dev-setup.sh",

    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "docker:clean": "docker-compose down -v --remove-orphans",
    "docker:tools": "docker-compose --profile tools up -d",

    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",

    "setup": "npm run setup:env && npm run docker:up && npm run db:migrate && npm run db:seed",
    "setup:env": "ts-node scripts/setup-env.ts",
    "setup:db": "ts-node scripts/setup-db.ts",

    "clean": "rm -rf .next node_modules",
    "clean:all": "npm run clean && npm run docker:clean"
  }
}
```

## CLAUDE.md Integration

```markdown
## Local Development

### Quick Start
```bash
npm run setup          # Full setup
npm run dev            # Start server
```

### Services
- App: http://localhost:3000
- DB: postgresql://localhost:5432
- Redis: redis://localhost:6379
- MinIO: http://localhost:9000
- Mail: http://localhost:8025

### Docker Commands
```bash
npm run docker:up      # Start services
npm run docker:down    # Stop services
npm run docker:logs    # View logs
npm run docker:tools   # Start admin tools
```

### Database
```bash
npm run db:migrate     # Run migrations
npm run db:seed        # Seed data
npm run db:studio      # Open Prisma Studio
npm run db:reset       # Reset database
```

### Test Accounts
- admin@example.com / admin123
- user@example.com / user123
```

## AI Suggestions

1. **Auto-setup** - Detect and install prerequisites
2. **Service health** - Monitor service status
3. **Data fixtures** - Generate test data
4. **Environment sync** - Keep .env in sync
5. **Port management** - Handle port conflicts
6. **Log aggregation** - Unified logging
7. **Hot reload** - Faster development
8. **Mock services** - Offline development
9. **SSL setup** - Local HTTPS
10. **Multi-project** - Run multiple projects
