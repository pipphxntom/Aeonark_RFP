import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.log("🔧 DATABASE_URL not found - attempting auto-provisioning...");
  
  // Try to trigger database auto-provisioning
  import('./initDb').then(({ initializeDatabase }) => {
    initializeDatabase().catch(() => {
      console.error("❌ Auto-provisioning failed. Manual setup required:");
      console.log("1. Open Database tab in Replit");
      console.log("2. Click 'Create a database'");
      console.log("3. Select PostgreSQL");
      console.log("4. Restart your Repl");
    });
  });
  
  throw new Error("DATABASE_URL auto-provisioning in progress");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });