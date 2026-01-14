# Express.js API Template

## Overview
Production-ready Express.js REST API with TypeScript, Prisma ORM, JWT authentication, rate limiting, request validation with Zod, comprehensive error handling, OpenAPI documentation, and Docker deployment.

## Quick Start
```bash
# Create new project
mkdir my-api && cd my-api
npm init -y

# Or use this template
npx degit template/express-api my-api
cd my-api
npm install

# Setup environment
cp .env.example .env

# Setup database
npx prisma migrate dev

# Start development
npm run dev

# Build for production
npm run build
npm start
```

## Project Structure
```
my-api/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   ├── logger.ts
│   │   └── swagger.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   └── health.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── requestId.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   └── health.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── email.service.ts
│   │   └── token.service.ts
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   ├── user.schema.ts
│   │   └── common.schema.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── ApiError.ts
│   │   ├── catchAsync.ts
│   │   ├── password.ts
│   │   └── response.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── setup.ts
│   ├── helpers/
│   ├── unit/
│   └── integration/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Configuration Files

### package.json
```json
{
  "name": "express-api",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:push": "prisma db push",
    "prisma:seed": "tsx prisma/seed.ts",
    "prisma:studio": "prisma studio",
    "docker:build": "docker build -t express-api .",
    "docker:run": "docker-compose up -d"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "pino": "^8.17.0",
    "pino-http": "^8.6.0",
    "swagger-jsdoc": "^6.2.0",
    "swagger-ui-express": "^5.0.0",
    "uuid": "^9.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/compression": "^1.7.5",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.10.0",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.6",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.55.0",
    "pino-pretty": "^10.3.0",
    "prettier": "^3.1.0",
    "prisma": "^5.7.0",
    "supertest": "^6.3.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### .env.example
```bash
# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000

# Email (optional)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@example.com
```

### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String?
  role          Role      @default(USER)
  isVerified    Boolean   @default(false)
  verifyToken   String?
  resetToken    String?
  resetExpires  DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  tokens        Token[]

  @@map("users")
}

model Token {
  id        String    @id @default(cuid())
  token     String    @unique
  type      TokenType
  expires   DateTime
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime  @default(now())

  @@map("tokens")
}

enum Role {
  USER
  ADMIN
}

enum TokenType {
  ACCESS
  REFRESH
  VERIFY_EMAIL
  RESET_PASSWORD
}
```

## Source Files

### src/config/env.ts
```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('localhost'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  CORS_ORIGIN: z.string().default('*'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
```

### src/config/logger.ts
```typescript
import pino from 'pino';
import { env, isDevelopment } from './env';

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger;
```

### src/config/database.ts
```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('query', (e) => {
  logger.debug({ query: e.query, duration: e.duration }, 'Database query');
});

prisma.$on('error', (e) => {
  logger.error({ message: e.message }, 'Database error');
});

export { prisma };
export default prisma;
```

### src/app.ts
```typescript
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import routes from './routes';
import { setupSwagger } from './config/swagger';

const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request ID
app.use(requestIdMiddleware);

// Logging
app.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
  })
);

// Rate limiting
app.use(rateLimitMiddleware);

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use('/api', routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

### src/server.ts
```typescript
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
  logger.info(`📚 API docs available at http://${env.HOST}:${env.PORT}/api-docs`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    await prisma.$disconnect();
    logger.info('Database connection closed');

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled errors
process.on('unhandledRejection', (reason: Error) => {
  logger.error({ err: reason }, 'Unhandled Rejection');
  throw reason;
});

process.on('uncaughtException', (error: Error) => {
  logger.error({ err: error }, 'Uncaught Exception');
  process.exit(1);
});

export default server;
```

### src/utils/ApiError.ts
```typescript
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string[]>,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: Record<string, string[]>) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, undefined, false);
  }
}
```

### src/utils/catchAsync.ts
```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const catchAsync = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### src/utils/response.ts
```typescript
import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  statusCode = 200
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message?: string): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};
```

### src/middleware/error.middleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { isDevelopment } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });
    error = ApiError.badRequest('Validation failed', errors);
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        error = ApiError.conflict('A record with this value already exists');
        break;
      case 'P2025':
        error = ApiError.notFound('Record not found');
        break;
      default:
        error = ApiError.internal('Database error');
    }
  }

  // Default to 500 if not an ApiError
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : 'Internal server error';
  const errors = error instanceof ApiError ? error.errors : undefined;

  // Log error
  if (statusCode >= 500) {
    logger.error({ err: error, req: { method: req.method, url: req.url } }, message);
  } else {
    logger.warn({ err: error, req: { method: req.method, url: req.url } }, message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(isDevelopment && { stack: error.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route ${req.method} ${req.url} not found`));
};
```

### src/middleware/auth.middleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { UserService } from '../services/user.service';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';

export const authenticate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = TokenService.verifyAccessToken(token);

    const user = await UserService.findById(payload.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    req.user = user;
    next();
  }
);

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
};

export const optionalAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = TokenService.verifyAccessToken(token);
        const user = await UserService.findById(payload.userId);
        if (user) {
          req.user = user;
        }
      } catch {
        // Token invalid, continue without user
      }
    }

    next();
  }
);
```

### src/middleware/validate.middleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((e) => {
          const path = e.path.slice(1).join('.');
          if (!errors[path]) errors[path] = [];
          errors[path].push(e.message);
        });
        next(ApiError.badRequest('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
};
```

### src/middleware/rateLimit.middleware.ts
```typescript
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export const rateLimitMiddleware = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests());
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many login attempts'));
  },
});
```

### src/services/auth.service.ts
```typescript
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { TokenService } from './token.service';
import { ApiError } from '../utils/ApiError';

export class AuthService {
  static async register(email: string, password: string, name?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await TokenService.generateAuthTokens(user.id);

    return { user, tokens };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const tokens = await TokenService.generateAuthTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  static async refreshToken(refreshToken: string) {
    const payload = TokenService.verifyRefreshToken(refreshToken);

    const storedToken = await prisma.token.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.userId !== payload.userId) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Delete old refresh token
    await prisma.token.delete({ where: { id: storedToken.id } });

    // Generate new tokens
    const tokens = await TokenService.generateAuthTokens(storedToken.userId);

    return tokens;
  }

  static async logout(refreshToken: string) {
    await prisma.token.deleteMany({
      where: { token: refreshToken },
    });
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens
    await prisma.token.deleteMany({
      where: { userId, type: 'REFRESH' },
    });
  }
}
```

### src/services/token.service.ts
```typescript
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
}

export class TokenService {
  static generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'access' } as TokenPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRATION }
    );
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' } as TokenPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRATION }
    );
  }

  static async generateAuthTokens(userId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.token.create({
      data: {
        token: refreshToken,
        type: 'REFRESH',
        userId,
        expires: expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }
}
```

### src/services/user.service.ts
```typescript
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

export class UserService {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  static async update(id: string, data: { name?: string; email?: string }) {
    if (data.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing && existing.id !== id) {
        throw ApiError.conflict('Email already in use');
      }
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async delete(id: string) {
    await prisma.user.delete({ where: { id } });
  }
}
```

### src/schemas/auth.schema.ts
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
});
```

### src/controllers/auth.controller.ts
```typescript
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

export class AuthController {
  static register = catchAsync(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    const result = await AuthService.register(email, password, name);
    sendCreated(res, result, 'Registration successful');
  });

  static login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    sendSuccess(res, result, 'Login successful');
  });

  static refresh = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refreshToken(refreshToken);
    sendSuccess(res, tokens);
  });

  static logout = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await AuthService.logout(refreshToken);
    sendNoContent(res);
  });

  static me = catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, req.user);
  });

  static changePassword = catchAsync(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user!.id, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully');
  });
}
```

### src/routes/auth.routes.ts
```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);

router.post('/logout', validate(refreshTokenSchema), AuthController.logout);

router.get('/me', authenticate, AuthController.me);

router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

export default router;
```

### src/routes/index.ts
```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);

export default router;
```

## Docker Configuration

### Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp?schema=public
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## Testing

### tests/integration/auth.test.ts
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Auth API', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# Express API

## Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm test` - Run tests
- `npx prisma studio` - Open database GUI

## Architecture
- Controllers: Handle HTTP requests/responses
- Services: Business logic layer
- Middleware: Request processing pipeline
- Schemas: Zod validation schemas
- Routes: API endpoint definitions

## Key Patterns
- catchAsync wrapper for async error handling
- ApiError class for consistent error responses
- Token-based authentication with refresh tokens
- Request validation with Zod schemas
- Structured logging with Pino

## Database
- Prisma ORM with PostgreSQL
- Migrations in prisma/migrations/
- Run `npx prisma migrate dev` for development
- Run `npx prisma migrate deploy` for production

## API Documentation
- Swagger UI at /api-docs
- JSDoc annotations for endpoints
- OpenAPI 3.0 specification
```

## AI Suggestions

1. **Add request queuing** - Implement Bull/BullMQ for background job processing like email sending and heavy computations

2. **Implement caching layer** - Add Redis caching for frequently accessed data with cache invalidation strategies

3. **Add database connection pooling** - Configure PgBouncer or built-in Prisma connection pooling for high traffic

4. **Implement API versioning** - Add version prefixes (/v1/, /v2/) with version-specific route handling

5. **Add request tracing** - Implement OpenTelemetry for distributed tracing across microservices

6. **Implement webhook system** - Create outgoing webhook infrastructure for event notifications

7. **Add file upload handling** - Integrate Multer with S3/CloudStorage for secure file uploads with virus scanning

8. **Implement GraphQL layer** - Add optional GraphQL endpoint alongside REST using Apollo Server

9. **Add database query optimization** - Implement query analysis and N+1 detection with Prisma middleware

10. **Create API SDK generator** - Use OpenAPI spec to auto-generate client SDKs for TypeScript, Python, etc.
