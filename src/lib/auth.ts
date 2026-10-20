import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { bearer } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(process.env.AUTH_DB_NAME || "hireloop");

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL,

  emailAndPassword: { 
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
    },
  },

  database: mongodbAdapter(db, {
    client,
  }),

  plugins: [
    bearer(),
  ],

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Whitelist permitted self-registration roles: seeker or recruiter.
          // Block privilege escalation to "admin" at registration.
          const allowedRoles = ["seeker", "recruiter"];
          const requestedRole = (user as any).role;
          const role = allowedRoles.includes(requestedRole) ? requestedRole : "seeker";

          return {
            data: {
              ...user,
              role,
              status: "active",
              plan: "Free",
            },
          };
        },
      },
      update: {
        before: async (user) => {
          // Prevent ordinary users from modifying role, status, or plan through user profile updates
          const safeData = { ...user };
          delete (safeData as any).role;
          delete (safeData as any).status;
          delete (safeData as any).plan;
          return { data: safeData };
        },
      },
    },
    session: {
      create: {
        before: async (session, ctx) => {
          if (!ctx) return;
          const user = await ctx.context.internalAdapter.findUserById(session.userId);
          if (user && (user as any).status === "suspended") {
            throw APIError.from("FORBIDDEN", {
              message: "Your account has been suspended. Please contact support.",
              code: "ACCOUNT_SUSPENDED",
            });
          }
        },
      },
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "seeker",
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
      },
      plan: {
        type: "string",
        required: false,
        defaultValue: "Free",
      },
      resumeUrl: {
        type: "string",
        required: false,
      },
      skills: {
        type: "string",
        required: false,
      },
      headline: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      companyId: {
        type: "string",
        required: false,
      },
    },
  },
});