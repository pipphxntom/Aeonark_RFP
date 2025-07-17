import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check if we have a DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not found. Please add it to your Secrets.');
  console.log('💡 Add DATABASE_URL to the Secrets tab in Replit');
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });