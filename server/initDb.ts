
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db } from './db';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function initializeDatabase() {
  console.log('🔍 Checking database status...');
  
  try {
    // Check if migrations directory exists
    const migrationsPath = join(process.cwd(), 'migrations');
    
    try {
      const migrations = await readdir(migrationsPath);
      console.log(`📁 Found ${migrations.length} migration files`);
      
      if (migrations.length > 0) {
        console.log('🚀 Running database migrations...');
        await migrate(db, { migrationsFolder: migrationsPath });
        console.log('✅ Database migrations completed successfully');
      } else {
        console.log('⚠️  No migrations found. Run `npm run db:generate` first.');
      }
    } catch (error) {
      console.log('⚠️  No migrations directory found. Database schema may not be initialized.');
      console.log('💡 Run `npm run db:generate && npm run db:migrate` to set up the database.');
    }
    
    // Test database connection
    const result = await db.execute('SELECT NOW()');
    console.log('✅ Database connection successful');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
