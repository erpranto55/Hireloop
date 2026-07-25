import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(process.env.AUTH_DB_NAME || "hireloop");

export const auth = betterAuth({
  emailAndPassword: { 
    enabled: true, 
  }, 

  database: mongodbAdapter(db, {
    // Optional: if you don't provide a client, database transactions won't be enabled.
    client
  }),

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