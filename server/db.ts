import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check if we have a DATABASE_URL, otherwise setup for development mode
if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not found. Application will run in development mode.');
  console.log('💡 To fully test the application, please:');
  console.log('   1. Go to the Database tab in Replit');
  console.log('   2. Create a PostgreSQL database');
  console.log('   3. Restart the application');
  
  // Set a placeholder URL that will be caught by connection error handling
  process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });