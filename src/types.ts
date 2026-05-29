export interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description: string;
  tags: ("Auth" | "Jobs" | "Companies" | "Applications" | "Admin")[];
  requestBody?: {
    schema: Record<string, string>;
    defaultValues: Record<string, any>;
  };
  headers?: Record<string, string>;
  responseSamples?: Record<number, any>;
}

export const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/api/auth/register",
    summary: "Register new account",
    description: "Inserts a new user record into the Postgres database. Utilizes bcrypt with 12 rounds of salt-stretching. Places an action mailer job inside BullMQ email-queue.",
    tags: ["Auth"],
    requestBody: {
      schema: {
        email: "Unique registered email (Zod: email)",
        password: "Bcrypt hash origin source (Zod: min 8 length)",
        name: "Display full name (Zod: min 2 length)"
      },
      defaultValues: {
        email: "candidate@gmail.com",
        password: "secure_password_123",
        name: "Sarah Jenkins"
      }
    },
    responseSamples: {
      201: {
        id: "usr_b9x8f0y",
        email: "candidate@gmail.com",
        name: "Sarah Jenkins",
        role: "USER",
        createdAt: "2026-05-28T14:04:00Z"
      },
      409: {
        error: "Conflict",
        message: "Email has already matched with an active entity registration."
      }
    }
  },
  {
    method: "POST",
    path: "/api/auth/login",
    summary: "Create Session (Login)",
    description: "Validates credential integrity. Generates an asymmetric RS256 Bearer Token (15m expiry) and creates a rotational sliding refresh UUID token cached safely inside Redis (7d TTL).",
    tags: ["Auth"],
    requestBody: {
      schema: {
        email: "User email",
        password: "Raw password"
      },
      defaultValues: {
        email: "candidate@gmail.com",
        password: "secure_password_123"
      }
    },
    responseSamples: {
      200: {
        accessToken: "Bearer.eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "ref-9x2m4-rot",
        user: {
          id: "usr_b9x8f0y",
          email: "candidate@gmail.com",
          name: "Sarah Jenkins",
          role: "USER"
        }
      },
      401: {
        error: "Unauthorized",
        message: "Email or credentials mismatch"
      }
    }
  },
  {
    method: "GET",
    path: "/api/jobs",
    summary: "Retrieve paginated job listings",
    description: "Provides cursor-based cursor list lookups supporting options like location containing filters, types matching, minimum salary bounds, and search criteria.",
    tags: ["Jobs"],
    requestBody: {
      schema: {
        search: "Full-text index fuzzy search query (Optional)",
        limit: "Page limit constraints (default 10) (Optional)",
        cursor: "Previous sequence record pointer ID (Optional)"
      },
      defaultValues: {
        search: "Fastify",
        limit: 10,
        cursor: ""
      }
    },
    responseSamples: {
      200: {
        items: [
          {
            id: "job-fastify-sr",
            title: "Senior Backend Engineer (Fastify & Redis)",
            description: "Looking for an expert...",
            type: "FULL_TIME",
            salaryMin: 120000,
            company: {
              id: "com-stripe",
              name: "Stripe",
              logoUrl: "...",
              isVerified: true
            }
          }
        ],
        pagination: {
          nextCursor: "job-nextjs",
          hasMore: true
        }
      }
    }
  },
  {
    method: "GET",
    path: "/api/jobs/:id",
    summary: "Get single job details",
    description: "Returns highly deep metadata metrics related to specified job posting including embedded relational owner verification states.",
    tags: ["Jobs"],
    requestBody: {
      schema: {
        id: "Job record primary identifier uuid"
      },
      defaultValues: {
        id: "job-fastify-sr"
      }
    },
    responseSamples: {
      200: {
        id: "job-fastify-sr",
        title: "Senior Backend Engineer",
        description: "...",
        companyId: "com-stripe",
        company: {
          id: "com-stripe",
          name: "Stripe",
          isVerified: true
        }
      },
      404: {
        error: "Not Found",
        message: "Job Listing with identification '...' was not found."
      }
    }
  },
  {
    method: "POST",
    path: "/api/jobs",
    summary: "Create Job listing (Admin required)",
    description: "Creates an official recruitment listing. Requires user identity verification and claims matching role level is USER_ROLE='ADMIN' | 'MODERATOR'.",
    tags: ["Jobs", "Admin"],
    requestBody: {
      schema: {
        title: "Job Title",
        description: "Detailed description of tasks",
        companyId: "Sponsoring company id",
        salaryMin: "Floor boundary",
        salaryMax: "Ceiling boundary",
        type: "FULL_TIME | PART_TIME | CONTRACT | REMOTE",
        location: "City, State or Region"
      },
      defaultValues: {
        title: "Principal Firebase Architect",
        description: "Scale high volume serverless databases mapping clean security filters.",
        companyId: "com-google",
        salaryMin: 180000,
        salaryMax: 220000,
        type: "REMOTE",
        location: "Remote (San Francisco)"
      }
    },
    responseSamples: {
      201: {
        id: "job-f9s2m7",
        title: "Principal Firebase Architect",
        isModerated: true,
        companyId: "com-google"
      }
    }
  },
  {
    method: "POST",
    path: "/api/applications",
    summary: "Submit Application",
    description: "Registers candidate candidacy for an active job listings. Strictly verifies that users do not generate multiple duplicates. Places a job inside BullMQ worker line to notify employers.",
    tags: ["Applications"],
    requestBody: {
      schema: {
        jobId: "Target vacancy id",
        resumeUrl: "PDF/DOCX storage path link",
        coverLetter: "Dynamic overview motivations (Optional)"
      },
      defaultValues: {
        jobId: "job-fastify-sr",
        resumeUrl: "https://drive.google.com/recruits/resume_jenkins.pdf",
        coverLetter: "I thrive on building high-performance Node APIs and would love to help optimize stripe matching platforms."
      }
    },
    responseSamples: {
      201: {
        id: "app-3a8f",
        status: "APPLIED",
        userId: "usr-jenkins",
        jobId: "job-fastify-sr",
        createdAt: "2026-05-28T14:04:00Z"
      },
      409: {
        error: "Conflict",
        message: "You have already stored an active candidacy application for this listing."
      }
    }
  },
  {
    method: "PATCH",
    path: "/api/applications/:id/status",
    summary: "Review / Update Application status (Admin / Mod)",
    description: "Allows recruiters, moderators or admins to update the application status (APPLIED, REVIEWED, INTERVIEWING, REJECTED, ACCEPTED). Automatically triggers a welcome or rejection notification worker thread.",
    tags: ["Applications", "Admin"],
    requestBody: {
      schema: {
        id: "Application ID to update",
        status: "REVIEWED | INTERVIEWING | REJECTED | ACCEPTED"
      },
      defaultValues: {
        id: "app-1",
        status: "INTERVIEWING"
      }
    },
    responseSamples: {
      200: {
        id: "app-1",
        status: "INTERVIEWING",
        userId: "usr-[applicant]-1",
        jobId: "job-fastify-sr"
      }
    }
  }
];
