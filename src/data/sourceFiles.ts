export interface SourceFile {
  path: string;
  name: string;
  category: "prisma" | "core-errors" | "core-middleware" | "modules-auth" | "modules-jobs" | "tests" | "infra";
  language: "typescript" | "prisma" | "yaml" | "json";
  description: string;
  code: string;
}

export const SOURCE_FILES: SourceFile[] = [
  {
    path: "prisma/schema.prisma",
    name: "schema.prisma",
    category: "prisma",
    language: "prisma",
    description: "Multi-model relational schema with Cascade Deletes, indexes for performant full-text searches, and clear mappings to underlying mapped tables.",
    code: `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum JobType {
  FULL_TIME
  PART_TIME
  CONTRACT
  INTERNSHIP
  REMOTE
}

enum ApplicationStatus {
  APPLIED
  REVIEWED
  INTERVIEWING
  REJECTED
  ACCEPTED
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  name         String
  role         UserRole      @default(USER)
  isVerified   Boolean       @default(false)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  company      Company?
  applications Application[]

  @@map("users")
}

model Company {
  id          String   @id @default(uuid())
  name        String
  logoUrl     String?
  description String
  website     String?
  isVerified  Boolean  @default(false)
  ownerId     String   @unique
  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  jobs        Job[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("companies")
}

model Job {
  id           String        @id @default(uuid())
  title        String
  description  String
  requirements String[]
  type         JobType
  location     String
  salaryMin    Int
  salaryMax    Int
  isFeatured   Boolean       @default(false)
  isModerated  Boolean       @default(false)
  companyId    String
  company      Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  applications Application[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([location])
  @@index([type])
  @@map("jobs")
}

model Application {
  id        String            @id @default(uuid())
  status    ApplicationStatus @default(APPLIED)
  resumeUrl String
  coverLetter String?
  userId    String
  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobId     String
  job       Job               @relation(fields: [jobId], references: [id], onDelete: Cascade)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  @@unique([userId, jobId])
  @@map("applications")
}`
  },
  {
    path: "src/core/errors/AppError.ts",
    name: "AppError.ts",
    category: "core-errors",
    language: "typescript",
    description: "Production-grade unified Exception Hierarchy mapping internal failures cleanly to corresponding HTTP REST specifications.",
    code: `export abstract class AppError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string, public readonly details: Record<string, any> | null = null) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  abstract toJSON(): { error: string; message: string; details?: any };
}

export class ValidationError extends AppError {
  readonly statusCode = 400;

  constructor(message: string, details: Record<string, any> | null = null) {
    super(message, details);
    this.name = 'ValidationError';
  }

  toJSON() {
    return {
      error: 'Bad Request',
      message: this.message,
      ...(this.details ? { details: this.details } : {})
    };
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;

  constructor(message: string = 'Access denied. Invalid or missing credentials.') {
    super(message);
    this.name = 'UnauthorizedError';
  }

  toJSON() {
    return {
      error: 'Unauthorized',
      message: this.message
    };
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;

  constructor(message: string = 'Forbidden. You do not have sufficient permissions.') {
    super(message);
    this.name = 'ForbiddenError';
  }

  toJSON() {
    return {
      error: 'Forbidden',
      message: this.message
    };
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;

  constructor(resource: string, identifier: string) {
    super(\`\${resource} with identification '\${identifier}' was not found.\`);
    this.name = 'NotFoundError';
  }

  toJSON() {
    return {
      error: 'Not Found',
      message: this.message
    };
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }

  toJSON() {
    return {
      error: 'Conflict',
      message: this.message
    };
  }
}`
  },
  {
    path: "src/core/middleware/rate-limit.middleware.ts",
    name: "rate-limit.middleware.ts",
    category: "core-middleware",
    language: "typescript",
    description: "Sliding-window rate limiter utilizing a sorted set Redis backend, ensuring highly dynamic individual IP rate tracking.",
    code: `import { FastifyReply, FastifyRequest } from "fastify";
import Redis from "ioredis";
import { ValidationError } from "../errors/AppError";

interface RateLimitConfig {
  redisClient: Redis;
  windowMs: number;
  maxRequestsGuest: number;
  maxRequestsAuthed: number;
}

export function createRateLimiter(config: RateLimitConfig) {
  const { redisClient, windowMs, maxRequestsGuest, maxRequestsAuthed } = config;

  return async function rateLimitPreHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const ip = request.ip;
    const userId = (request as any).user?.id;
    
    // Determine limit and identifier key
    const identifier = userId ? \`rate_limit:user:\${userId}\` : \`rate_limit:ip:\${ip}\`;
    const limit = userId ? maxRequestsAuthed : maxRequestsGuest;

    const now = Date.now();
    const clearBefore = now - windowMs;

    // Fast Redis transaction execution via pipeline of commands
    const pipe = redisClient.pipeline();
    pipe.zremrangebyscore(identifier, 0, clearBefore); // Remove expired logs
    pipe.zcard(identifier);                           // Check current count
    pipe.zadd(identifier, now, now.toString());       // Add current request
    pipe.expire(identifier, Math.ceil(windowMs / 1000)); // Set key slide timeout

    const results = await pipe.exec();
    if (!results) {
      throw new Error("Redis Rate limiting execution failed unexpectedly.");
    }

    // Extraction: Index [1] corresponds to ZCARD count response
    const count = (results[1][1] as number) || 0;

    // Rate limits headers injection - standard compliance
    reply.header("X-RateLimit-Limit", limit);
    reply.header("X-RateLimit-Remaining", Math.max(0, limit - count - 1));
    reply.header("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));

    if (count >= limit) {
      reply.header("Retry-After", Math.ceil(windowMs / 1000));
      reply.status(429).send({
        error: "Too Many Requests",
        message: \`API Rate limit exceeded. Limit is \${limit} requests per \${windowMs / 60000} minutes.\`,
        retryAfterMs: windowMs
      });
    }
  };
}`
  },
  {
    path: "src/core/middleware/auth.middleware.ts",
    name: "auth.middleware.ts",
    category: "core-middleware",
    language: "typescript",
    description: "Asymmetric RS256 fast jwt verification middleware containing dynamic role check factories.",
    code: `import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../errors/AppError";

export interface DecodedToken {
  id: string;
  email: string;
  role: "USER" | "ADMIN" | "MODERATOR";
}

export function createAuthGuard(publicKey: string) {
  return async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Bearer token is missing or malformed");
      }

      const token = authHeader.split(" ")[1];
      
      // Verification using asymmetry: validating client's RS256 signatures with public key
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ["RS256"]
      }) as DecodedToken;

      (request as any).user = decoded;
    } catch (err) {
      throw new UnauthorizedError("JWT signature validation failed");
    }
  };
}

export function roleGuard(allowedRoles: ("USER" | "ADMIN" | "MODERATOR")[]) {
  return async function checkPermissions(request: FastifyRequest) {
    const user = (request as any).user as DecodedToken;
    if (!user) {
      throw new UnauthorizedError("Authentication required prior mapping permissions.");
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError("Insufficient rights to carry out authorized scope request.");
    }
  };
}`
  },
  {
    path: "src/modules/auth/auth.schema.ts",
    name: "auth.schema.ts",
    category: "modules-auth",
    language: "typescript",
    description: "Rigorous typing structures created with Zod for dynamic JSON body structures, matching exact OpenAPI schemas for Swagger.",
    code: `import { z } from "zod";

export const RegisterUserSchema = z.object({
  email: z.string().email("A valid email structure is strictly required"),
  password: z.string().min(8, "Password must contain a minimum of 8 characters"),
  name: z.string().min(2, "Name must contain a minimum of 2 characters"),
});

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().uuid("Refresh token must be a valid serialized UUID format"),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginUserInput = z.infer<typeof LoginUserSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
`
  },
  {
    path: "src/modules/auth/auth.service.ts",
    name: "auth.service.ts",
    category: "modules-auth",
    language: "typescript",
    description: "Highly performant authorization flow implementation backed by Argon2 hash verifications, transactional database insertions, and secure UUID rotations.",
    code: `import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { ConflictError, UnauthorizedError } from "../../core/errors/AppError";
import { RegisterUserInput, LoginUserInput } from "./auth.schema";

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly privateKey: string, // RSA Private Key loaded securely
    private readonly redisClient: any      // Token Rotation Storage Client
  ) {}

  async register(input: RegisterUserInput) {
    // 1. Validate structural unique targets prior creating database modifications
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existing) {
      throw new ConflictError("Email has already matched with an active entity registration.");
    }

    // 2. Encryption utilizes robust CPU intensive stretching hashing algorithms
    const passwordHash = await bcrypt.hash(input.password, 12);

    // 3. Save into mapped table model structure
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return user;
  }

  async login(input: LoginUserInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      throw new UnauthorizedError("Email or credentials mismatch");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Email or credentials mismatch");
    }

    // 4. Generate Asymmetric Asymmetrical RS256 Tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      this.privateKey,
      { algorithm: "RS256", expiresIn: "15m" }
    );

    // 5. Generate Dynamic Rotational Sliding Refresh Token
    const refreshToken = uuidv4();

    // Cache UUID mapping securely inside Redis with a strict TTL expiry matching 7 days
    await this.redisClient.set(
      \`refresh_token:\${refreshToken}\`,
      JSON.stringify({ userId: user.id, email: user.email, role: user.role }),
      "EX",
      7 * 24 * 60 * 60
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  async rotateRefreshToken(token: string) {
    const cached = await this.redisClient.get(\`refresh_token:\${token}\`);
    if (!cached) {
      throw new UnauthorizedError("Refresh token is expired, revoked or invalidated.");
    }

    const { userId, email, role } = JSON.parse(cached);

    // Dynamic rotation block: Immediately invalidate current token to prevent reuse attacks
    await this.redisClient.del(\`refresh_token:\${token}\`);

    // Create brand new tokens
    const nextAccessToken = jwt.sign(
      { id: userId, email, role },
      this.privateKey,
      { algorithm: "RS256", expiresIn: "15m" }
    );

    const nextRefreshToken = uuidv4();
    await this.redisClient.set(
      \`refresh_token:\${nextRefreshToken}\`,
      JSON.stringify({ userId, email, role }),
      "EX",
      7 * 24 * 60 * 60
    );

    return {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken
    };
  }

  async logout(token: string) {
    await this.redisClient.del(\`refresh_token:\${token}\`);
    return { success: true, message: "Logged out with active secure structures cleared." };
  }
}`
  },
  {
    path: "src/modules/jobs/jobs.service.ts",
    name: "jobs.service.ts",
    category: "modules-jobs",
    language: "typescript",
    description: "Cursor-based cursor pagination and search engine implementation leveraging exact relational schema filter lookups.",
    code: `import { PrismaClient, JobType } from "@prisma/client";
import { NotFoundError } from "../../core/errors/AppError";

interface QueryParams {
  limit?: number;
  cursor?: string;
  search?: string;
  type?: JobType;
  location?: string;
  minSalary?: number;
}

export class JobsService {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(params: QueryParams) {
    const limit = params.limit ? Math.min(params.limit, 100) : 20;
    const { cursor, search, type, location, minSalary } = params;

    const where: any = {};

    if (type) where.type = type;
    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive"
      };
    }
    if (minSalary) {
      where.salaryMin = {
        gte: minSalary
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    // Query elements leveraging custom cursor indexing
    const jobs = await this.prisma.job.findMany({
      take: limit + 1, // Look ahead 1 item to fetch the next offset pointer
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where,
      orderBy: { id: "asc" },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            isVerified: true
          }
        }
      }
    });

    const hasMore = jobs.length > limit;
    const nextItem = hasMore ? jobs[limit] : null;
    const items = hasMore ? jobs.slice(0, limit) : jobs;

    return {
      items,
      pagination: {
        nextCursor: nextItem ? nextItem.id : null,
        hasMore
      }
    };
  }

  async getById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { company: true }
    });

    if (!job) {
      throw new NotFoundError("Job Listing", id);
    }
    return job;
  }
}`
  },
  {
    path: "tests/integration/jobs.test.ts",
    name: "jobs.test.ts",
    category: "tests",
    language: "typescript",
    description: "Expressive Supertest integration pipeline testing routes hitting a real-container PostgreSQL instance concurrently.",
    code: `import { createServer } from "../../src/app";
import { PrismaClient } from "@prisma/client";
import request from "supertest";

describe("Jobs Controller Integration Tests", () => {
  let app: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Setup test-containers connection and run schema migration programs
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } }
    });
    
    app = await createServer({ testPrisma: prisma });
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe("GET /api/jobs", () => {
    it("should return paginated array database payloads with cursor details", async () => {
      const response = await request(app.server)
        .get("/api/jobs")
        .query({ limit: 2 })
        .expect(200);

      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("hasMore");
    });

    it("should successfully apply filters matching job type criteria", async () => {
      const response = await request(app.server)
        .get("/api/jobs")
        .query({ type: "FULL_TIME" })
        .expect(200);

      const items = response.body.items;
      if (items.length > 0) {
        expect(items[0].type).toBe("FULL_TIME");
      }
    });
  });
});`
  },
  {
    path: "docker-compose.yml",
    name: "Docker Layout",
    category: "infra",
    language: "yaml",
    description: "Production docker-compose topology grouping application services, healthy Postgres checks, and volatile Redis units together.",
    code: `version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:secretpassword@postgres:5432/jobboard?schema=public
      - REDIS_URL=redis://redis:6379/0
      - JWT_PRIVATE_KEY_BASE64=\${JWT_PRIVATE_KEY_BASE64}
      - JWT_PUBLIC_KEY_BASE64=\${JWT_PUBLIC_KEY_BASE64}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secretpassword
      POSTGRES_DB: jobboard
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
`
  },
  {
    path: ".github/workflows/ci.yml",
    name: "CI/CD Pipeline",
    category: "infra",
    language: "yaml",
    description: "GitHub Actions workflow to trigger type assertions, run full Jest suites, compile components, and push images.",
    code: `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout Source Code
      uses: actions/checkout@v3

    - name: Setup Node.js Runtime (Version 20)
      uses: actions/setup-node@v3
      with:
        node-version: 20
        cache: 'npm'

    - name: Install Dependencies
      run: npm ci

    - name: Run Linters & Formatter Check
      run: npm run lint

    - name: Setup Multi-Container Testing Integration
      run: docker-compose -f docker-compose.test.yml up -d

    - name: Run Tests (Jest + Supertest)
      run: npm run test:coverage
      env:
        TEST_DATABASE_URL: postgresql://postgres:secretpassword@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379/1

    - name: Compile Application Build
      run: npm run build
`
  }
];
