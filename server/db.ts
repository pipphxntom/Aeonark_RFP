import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error(
    "❌ DATABASE_URL must be set. Please create a PostgreSQL database:",
  );
  console.log("1. Open Database tab in Replit");
  console.log("2. Click 'Create a database'");
  console.log("3. Select PostgreSQL");
  console.log("4. DATABASE_URL will be automatically added to Secrets");
  console.log("5. Restart your Repl");
  throw new Error("DATABASE_URL not configured");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });