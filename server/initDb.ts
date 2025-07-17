import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function initializeDatabase() {
  console.log('🔍 Initializing database connection...');
  
  // Skip database setup if no DATABASE_URL is available
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.log('⚠️  DATABASE_URL not found. Application will run without database functionality.');
    console.log('💡 To enable full functionality, set up a PostgreSQL database in Replit.');
    return;
  }
  
  console.log('🔌 Connecting to database...');
  
  try {
    // Test database connection
    const result = await db.execute('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Only run migrations if database connection is successful
    const migrationsPath = join(process.cwd(), 'migrations');
    
    try {
      const migrations = await readdir(migrationsPath);
      console.log(`📁 Found ${migrations.length} migration files`);
      
      if (migrations.length > 0) {
        console.log('🚀 Running database migrations...');
        await migrate(db, { migrationsFolder: migrationsPath });
        console.log('✅ Database migrations completed successfully');
      }
    } catch (error) {
      console.log('⚠️  Migration skipped, database may need setup.');
    }
    
  } catch (error) {
    console.log('⚠️  Database connection failed. Application will run with limited functionality.');
    console.log('💡 To enable full functionality, set up a PostgreSQL database in Replit.');
  }
}