import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check if we have a DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not found. Application will run with limited functionality.');
  console.log('💡 Add DATABASE_URL to the Secrets tab in Replit to enable full functionality');
}

// Create a fallback for when DATABASE_URL is not available
let pool: Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    db = drizzle(pool, { schema });
  } catch (error) {
    console.error('⚠️  Failed to create database connection:', error);
    pool = null;
    db = null;
  }
} else {
  // Create a mock database object for when no DATABASE_URL is available
  db = {
    execute: async () => ({ rows: [] }),
    select: () => ({ 
      from: () => ({ 
        where: () => ({ 
          limit: () => Promise.resolve([]) 
        }) 
      }) 
    }),
    insert: () => ({ 
      values: () => ({ 
        returning: () => Promise.resolve([]) 
      }) 
    }),
    update: () => ({ 
      set: () => ({ 
        where: () => ({ 
          returning: () => Promise.resolve([]) 
        }) 
      }) 
    }),
    delete: () => ({ 
      where: () => Promise.resolve([]) 
    })
  };
}

export { pool, db };