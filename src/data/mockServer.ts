import { SOURCE_FILES } from "./sourceFiles";

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "USER" | "ADMIN" | "MODERATOR";
  isVerified: boolean;
  createdAt: string;
}

export interface MockCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string;
  website: string;
  isVerified: boolean;
  ownerId: string;
  createdAt: string;
}

export interface MockJob {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "REMOTE";
  location: string;
  salaryMin: number;
  salaryMax: number;
  isFeatured: boolean;
  isModerated: boolean;
  companyId: string;
  createdAt: string;
}

export interface MockApplication {
  id: string;
  status: "APPLIED" | "REVIEWED" | "INTERVIEWING" | "REJECTED" | "ACCEPTED";
  resumeUrl: string;
  coverLetter: string | null;
  userId: string;
  jobId: string;
  createdAt: string;
}

export interface QueueJob {
  id: string;
  queue: "email-queue" | "reports-queue";
  name: string;
  data: any;
  status: "waiting" | "active" | "completed" | "failed";
  progress: number;
  logs: string[];
  createdAt: string;
}

// In-Memory Database Store Model
export class MockDatabase {
  users: MockUser[] = [];
  companies: MockCompany[] = [];
  jobs: MockJob[] = [];
  applications: MockApplication[] = [];
  queueJobs: QueueJob[] = [];
  rateLimitHits: Record<string, number[]> = {}; // identifier: timestamps[]
  requestCount = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.requestCount = 0;
    this.rateLimitHits = {};
    this.queueJobs = [];
    
    // Seed Users
    this.users = [
      {
        id: "usr-admin-1",
        email: "engineering@techjobs.com",
        passwordHash: "$2b$12$hashedpasswordkey1",
        name: "Alex Devmaster (Admin)",
        role: "ADMIN",
        isVerified: true,
        createdAt: "2026-05-10T08:00:00Z"
      },
      {
        id: "usr-[applicant]-1",
        email: "candidate@gmail.com",
        passwordHash: "$2b$12$hashedpasswordkey2",
        name: "Sarah Jenkins",
        role: "USER",
        isVerified: true,
        createdAt: "2026-05-15T12:00:00Z"
      },
      {
        id: "usr-mod-1",
        email: "moderator@techjobs.com",
        passwordHash: "$2b$12$hashedpasswordkey3",
        name: "Mod Charlie",
        role: "MODERATOR",
        isVerified: true,
        createdAt: "2026-05-12T09:30:00Z"
      }
    ];

    // Seed Companies
    this.companies = [
      {
        id: "com-google",
        name: "Google Cloud",
        logoUrl: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=100&q=80",
        description: "Enterprise computing & scale platforms",
        website: "https://cloud.google.com",
        isVerified: true,
        ownerId: "usr-admin-1",
        createdAt: "2026-05-10T08:15:00Z"
      },
      {
        id: "com-stripe",
        name: "Stripe",
        logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80",
        description: "Financial infrastructure for the internet",
        website: "https://stripe.com",
        isVerified: true,
        ownerId: "usr-admin-1",
        createdAt: "2026-05-10T09:00:00Z"
      },
      {
        id: "com-vercel",
        name: "Vercel",
        logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80",
        description: "Frontend developer workflow optimization frameworks",
        website: "https://vercel.com",
        isVerified: false,
        ownerId: "usr-mod-1",
        createdAt: "2026-05-13T14:40:00Z"
      }
    ];

    // Seed Jobs
    this.jobs = [
      {
        id: "job-fastify-sr",
        title: "Senior Backend Engineer (Fastify & Redis)",
        description: "Looking for an expert to scale our sub-millisecond job search matching algorithm using sliding-window rate limiters, BullMQ, and PostgreSQL indexes.",
        requirements: ["5+ years experience styled Node.js", "Redis clusters database configurations", "Prisma ORM transactions knowledge"],
        type: "FULL_TIME",
        location: "London, UK (Hybrid)",
        salaryMin: 120000,
        salaryMax: 155000,
        isFeatured: true,
        isModerated: true,
        companyId: "com-stripe",
        createdAt: "2026-05-11T10:00:00Z"
      },
      {
        id: "job-nextjs",
        title: "Staff Frontend Developer (React 19 & Next.js)",
        description: "Craft stunning bento grids and motion responsive dashboard interfaces using global themes and minimal clutter templates.",
        requirements: ["Deep expertise with Tailwind CSS @theme extensions", "React Server Components design models"],
        type: "REMOTE",
        location: "Remote (Global)",
        salaryMin: 140000,
        salaryMax: 180000,
        isFeatured: false,
        isModerated: true,
        companyId: "com-vercel",
        createdAt: "2026-05-14T11:20:00Z"
      },
      {
        id: "job-k8s-infra",
        title: "Senior Site Reliability Architect (K8s & Docker)",
        description: "Deploy multi-tenant containers with robust health checks, high availability replicas, and automated failure recover pathways.",
        requirements: ["Production Docker compose stacks expertise", "CI/CD configuration triggers"],
        type: "CONTRACT",
        location: "Sunnyvale, CA, USA",
        salaryMin: 160000,
        salaryMax: 210000,
        isFeatured: true,
        isModerated: true,
        companyId: "com-google",
        createdAt: "2026-05-15T09:00:00Z"
      }
    ];

    // Seed Applications
    this.applications = [
      {
        id: "app-1",
        status: "INTERVIEWING",
        resumeUrl: "https://drive.google.com/recruits/resume_jenkins.pdf",
        coverLetter: "I thrive on building high-performance Node APIs and would love to help optimize stripe matching platforms.",
        userId: "usr-[applicant]-1",
        jobId: "job-fastify-sr",
        createdAt: "2026-05-16T15:30:00Z"
      }
    ];
  }

  // Sliding Window Rate Limiter
  checkRateLimit(identifier: string, windowMs: number, maxRequests: number): { allowed: boolean; count: number } {
    const now = Date.now();
    const clearBefore = now - windowMs;

    // Filter points in current sliding window
    if (!this.rateLimitHits[identifier]) {
      this.rateLimitHits[identifier] = [];
    }

    this.rateLimitHits[identifier] = this.rateLimitHits[identifier].filter(ts => ts > clearBefore);

    if (this.rateLimitHits[identifier].length >= maxRequests) {
      return { allowed: false, count: this.rateLimitHits[identifier].length };
    }

    // Record hits
    this.rateLimitHits[identifier].push(now);
    return { allowed: true, count: this.rateLimitHits[identifier].length };
  }

  // BullMQ simulated queue enqueue
  enqueue(queue: "email-queue" | "reports-queue", name: string, data: any): QueueJob {
    const job: QueueJob = {
      id: `job-q-${Math.floor(Math.random() * 100000)}`,
      queue,
      name,
      data,
      status: "waiting",
      progress: 0,
      logs: [`[Queue] Job queued inside Redis at status [waiting]`],
      createdAt: new Date().toISOString()
    };
    this.queueJobs.unshift(job); // Add to display top
    return job;
  }
}

// Global server instance
export const mockDb = new MockDatabase();

// Simulated API route executor mapping standard REST APIs
export function executeRestRequest(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body: any,
  headers: Record<string, string>,
  rateLimitConfig: { windowMs: number; maxGuest: number; maxAuthed: number }
): {
  status: number;
  headers: Record<string, string | number>;
  body: any;
  pinoLogs: string[];
} {
  mockDb.requestCount++;
  const reqId = `req-${mockDb.requestCount.toString().padStart(4, "0")}`;
  const timestamp = new Date().toISOString();
  const logs: string[] = [];

  const addLog = (msg: string, level = 30) => {
    logs.push(
      JSON.stringify({
        level,
        time: timestamp,
        reqId,
        msg
      })
    );
  };

  addLog(`Incoming payload: ${method} ${path}`);

  // 1. JWT auth retrieval
  let currentUser: MockUser | null = null;
  const authHeader = headers["authorization"] || headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const tokenString = authHeader.split(" ")[1];
      addLog(`Validating asymmetric JWT signatures via RS256 algorithm...`);
      // We simulate JWT with JSON values in the plain bearer
      const parsedToken = JSON.parse(atob(tokenString));
      const user = mockDb.users.find(u => u.email === parsedToken.email);
      if (user) {
        currentUser = user;
        addLog(`Asymmetrical verify pass. Logged in user user_id="${user.id}" as ROLE="${user.role}"`);
      } else {
        addLog(`Verification failed: user record not found in data store`, 40);
      }
    } catch {
      addLog(`JWT signature mismatch: token signature invalid or asymmetric format modified`, 40);
    }
  }

  // 2. Sliding window rate limits
  const ip = headers["x-forwarded-for"] || "127.0.0.1";
  const rateLimitId = currentUser ? `usr:${currentUser.id}` : `ip:${ip}`;
  const limit = currentUser ? rateLimitConfig.maxAuthed : rateLimitConfig.maxGuest;

  const rateCheck = mockDb.checkRateLimit(rateLimitId, rateLimitConfig.windowMs, limit);
  const respHeaders: Record<string, string | number> = {
    "X-RateLimit-Limit": limit,
    "X-RateLimit-Remaining": Math.max(0, limit - rateCheck.count),
    "X-RateLimit-Reset": Math.ceil((Date.now() + rateLimitConfig.windowMs) / 1000),
    "Content-Type": "application/json"
  };

  if (!rateCheck.allowed) {
    addLog(`Too many requests limit hit identifier="${rateLimitId}" current="${rateCheck.count}" limit="${limit}"`, 50);
    return {
      status: 429,
      headers: { ...respHeaders, "Retry-After": Math.ceil(rateLimitConfig.windowMs / 1000) },
      body: {
        error: "Too Many Requests",
        message: `API Rate limit exceeded. Limit is ${limit} requests per ${rateLimitConfig.windowMs / 60000} minutes.`,
        retryAfterMs: rateLimitConfig.windowMs
      },
      pinoLogs: logs
    };
  }

  // Helper matching paths
  const matchesPath = (routePattern: string) => {
    // Escape standard chars, replace parameters with regex catch-all groups
    const escaped = routePattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp("^" + escaped.replace(/\\:[a-zA-Z0-9_]+/g, "([^/]+)") + "$");
    return pattern.test(path);
  };

  const getPathParams = (routePattern: string): string[] => {
    const escaped = routePattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp("^" + escaped.replace(/\\:[a-zA-Z0-9_]+/g, "([^/]+)") + "$");
    const m = path.match(pattern);
    return m ? m.slice(1) : [];
  };

  // Route Handlers
  try {
    // REGISTER
    if (method === "POST" && path === "/api/auth/register") {
      const { email, password, name } = body || {};
      if (!email || !password || !name) {
        throw new Error("Missing register variables: email, password, name");
      }
      const collision = mockDb.users.find(u => u.email === email);
      if (collision) {
        addLog(`Conflict registry error: email="${email}" duplicate`, 40);
        return {
          status: 409,
          headers: respHeaders,
          body: { error: "Conflict", message: "Email has already matched with an active entity registration." },
          pinoLogs: logs
        };
      }

      const newUser: MockUser = {
        id: `usr-${Math.random().toString(36).substr(2, 9)}`,
        email,
        passwordHash: "$2b$12$hashedbcryptstretching",
        name,
        role: "USER",
        isVerified: false,
        createdAt: new Date().toISOString()
      };
      mockDb.users.push(newUser);
      addLog(`Successfully signed up User: email="${email}" user_id="${newUser.id}"`);

      // Queue welcome email via BullMQ
      mockDb.enqueue("email-queue", "Send Registration Welcome Email", {
        userEmail: email,
        name
      });
      addLog(`Enqueued Send Registration Welcome Email job in BullMQ secure client`);

      return {
        status: 201,
        headers: respHeaders,
        body: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        pinoLogs: logs
      };
    }

    // LOGIN
    if (method === "POST" && path === "/api/auth/login") {
      const { email, password } = body || {};
      const user = mockDb.users.find(u => u.email === email);
      if (!user) {
        addLog(`Identity fail: email="${email}" does not match record`, 40);
        return {
          status: 401,
          headers: respHeaders,
          body: { error: "Unauthorized", message: "Email or credentials mismatch" },
          pinoLogs: logs
        };
      }

      // Generate RS256 jwt base64 token mockup
      const mockPayload = { id: user.id, email: user.email, role: user.role };
      const accessToken = btoa(JSON.stringify(mockPayload));
      const refreshToken = `ref-${Math.random().toString(36).substr(2, 9)}-rot`;

      addLog(`Generated session with RS256 token rotate payload user_id="${user.id}"`);

      return {
        status: 200,
        headers: respHeaders,
        body: {
          accessToken: `Bearer.${accessToken}.signatures`,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        },
        pinoLogs: logs
      };
    }

    // JOBS CRUD
    if (method === "GET" && matchesPath("/api/jobs")) {
      addLog(`Fetching paginated jobs. Filters applied: searching="${body?.search || "None"}"`);
      // Simulate cursor based fetching
      const { search, limit = 10, cursor } = body || {};
      let filtered = [...mockDb.jobs];

      if (search) {
        filtered = filtered.filter(j =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Cursor simulation
      let startIndex = 0;
      if (cursor) {
        const found = filtered.findIndex(j => j.id === cursor);
        if (found !== -1) {
          startIndex = found + 1;
        }
      }

      const paginated = filtered.slice(startIndex, startIndex + Number(limit));
      const hasMore = filtered.length > startIndex + Number(limit);
      const nextCursor = hasMore ? paginated[paginated.length - 1].id : null;

      const items = paginated.map(job => {
        const comp = mockDb.companies.find(c => c.id === job.companyId);
        return {
          ...job,
          company: comp ? { id: comp.id, name: comp.name, logoUrl: comp.logoUrl, isVerified: comp.isVerified } : null
        };
      });

      return {
        status: 200,
        headers: respHeaders,
        body: {
          items,
          pagination: {
            nextCursor,
            hasMore
          }
        },
        pinoLogs: logs
      };
    }

    // GET SINGLE JOB
    if (method === "GET" && matchesPath("/api/jobs/:id")) {
      const [id] = getPathParams("/api/jobs/:id");
      const job = mockDb.jobs.find(j => j.id === id);
      if (!job) {
        addLog(`Jobs lookup NotFound error id="${id}"`, 40);
        return {
          status: 404,
          headers: respHeaders,
          body: { error: "Not Found", message: `Job Listing with identification '${id}' was not found.` },
          pinoLogs: logs
        };
      }
      const comp = mockDb.companies.find(c => c.id === job.companyId);
      return {
        status: 200,
        headers: respHeaders,
        body: {
          ...job,
          company: comp || null
        },
        pinoLogs: logs
      };
    }

    // POST CREATE JOB (Admin role required)
    if (method === "POST" && path === "/api/jobs") {
      if (!currentUser) throw new Error("Unauthorized");
      if (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR") {
        addLog(`Role validation failure: user is user_role="${currentUser.role}" missing ADMIN permissions`, 45);
        return {
          status: 403,
          headers: respHeaders,
          body: { error: "Forbidden", message: "Forbidden. You do not have sufficient permissions." },
          pinoLogs: logs
        };
      }

      const { title, description, companyId, salaryMin, salaryMax, type, location, requirements } = body || {};
      if (!title || !description || !companyId) {
        throw new Error("Missing parameters for job initialization");
      }

      const newJob: MockJob = {
        id: `job-${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        requirements: requirements || ["Vibrant collaborative drive"],
        type: type || "FULL_TIME",
        location: location || "Remote",
        salaryMin: Number(salaryMin) || 80000,
        salaryMax: Number(salaryMax) || 120000,
        isFeatured: false,
        isModerated: true,
        companyId,
        createdAt: new Date().toISOString()
      };

      mockDb.jobs.unshift(newJob);
      addLog(`Job created safely and listed job_id="${newJob.id}" company_id="${companyId}"`);
      return {
        status: 201,
        headers: respHeaders,
        body: newJob,
        pinoLogs: logs
      };
    }

    // APPLY TO JOB (Applicant User Role required)
    if (method === "POST" && path === "/api/applications") {
      if (!currentUser) {
        addLog(`Unauthorized user attempting to apply to jobs`, 40);
        return {
          status: 401,
          headers: respHeaders,
          body: { error: "Unauthorized", message: "Authentication required prior mapping permissions." },
          pinoLogs: logs
        };
      }

      const { jobId, resumeUrl, coverLetter } = body || {};
      if (!jobId || !resumeUrl) {
        throw new Error("Missing application variables: jobId, resumeUrl");
      }

      const existingApp = mockDb.applications.find(a => a.userId === currentUser!.id && a.jobId === jobId);
      if (existingApp) {
        addLog(`Conflict tracking: applicant has already applied to job_id="${jobId}"`, 40);
        return {
          status: 409,
          headers: respHeaders,
          body: { error: "Conflict", message: "You have already stored an active candidacy application for this listing." },
          pinoLogs: logs
        };
      }

      const newApp: MockApplication = {
        id: `app-${Math.random().toString(36).substr(2, 9)}`,
        status: "APPLIED",
        resumeUrl,
        coverLetter: coverLetter || null,
        userId: currentUser.id,
        jobId,
        createdAt: new Date().toISOString()
      };

      mockDb.applications.push(newApp);
      addLog(`Candidacy logged for job_id="${jobId}" application_id="${newApp.id}"`);

      // Queue notifications via BullMQ
      mockDb.enqueue("email-queue", "Notify Employer Application Received", {
        applicantEmail: currentUser.email,
        jobId,
        applicationId: newApp.id
      });

      return {
        status: 201,
        headers: respHeaders,
        body: newApp,
        pinoLogs: logs
      };
    }

    // PATCH UPDATE APPLICATION STATUS (Moderator & Admin)
    if (method === "PATCH" && matchesPath("/api/applications/:id/status")) {
      if (!currentUser) throw new Error("Unauthorized");
      if (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR") {
        return {
          status: 403,
          headers: respHeaders,
          body: { error: "Forbidden", message: "Forbidden. You do not have sufficient permissions." },
          pinoLogs: logs
        };
      }

      const [appId] = getPathParams("/api/applications/:id/status");
      const { status } = body || {};
      const app = mockDb.applications.find(a => a.id === appId);

      if (!app) {
        return {
          status: 404,
          headers: respHeaders,
          body: { error: "Not Found", message: `Application with identification '${appId}' was not found.` },
          pinoLogs: logs
        };
      }

      const previousStatus = app.status;
      app.status = status;
      addLog(`Application update app_id="${appId}" status shifted from "${previousStatus}" to "${status}"`);

      // Queue notification
      mockDb.enqueue("email-queue", "Send Application Status Update Notification", {
        applicationId: app.id,
        newStatus: status
      });

      return {
        status: 200,
        headers: respHeaders,
        body: app,
        pinoLogs: logs
      };
    }

    // DEFAULT ROUTE FALLBACK
    addLog(`Requested path matching fail. Route fallback triggered`, 40);
    return {
      status: 404,
      headers: respHeaders,
      body: { error: "Not Found", message: `Requested route ${method} ${path} is not found.` },
      pinoLogs: logs
    };

  } catch (err: any) {
    addLog(`Server Exception: ${err.message}`, 50);
    return {
      status: 400,
      headers: respHeaders,
      body: { error: "Bad Request", message: err.message },
      pinoLogs: logs
    };
  }
}
