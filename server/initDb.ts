
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db } from './db';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function initializeDatabase() {
  console.log('🔍 Checking database status...');
  
  // Check if DATABASE_URL exists, if not, create PostgreSQL database
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found. Creating PostgreSQL database...');
    try {
      // Create PostgreSQL database using Replit's database service
      const response = await fetch('https://database-api.replit.com/api/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REPLIT_DB_URL || process.env.REPL_IDENTITY_KEY || 'dev'}`
        },
        body: JSON.stringify({
          type: 'postgresql',
          name: 'aeonrfp-db'
        })
      });
      
      if (response.ok) {
        const dbInfo = await response.json();
        console.log('✅ PostgreSQL database created successfully');
        console.log('🔄 Please restart your Repl to load the new DATABASE_URL');
        return;
      } else {
        console.log('⚠️  Automatic database creation failed. Please create manually:');
        console.log('1. Open Database tab in Replit');
        console.log('2. Click "Create a database"');
        console.log('3. Select PostgreSQL');
        console.log('4. Restart your Repl');
        return;
      }
    } catch (error) {
      console.log('⚠️  Could not auto-create database. Manual setup required:');
      console.log('1. Open Database tab in Replit');
      console.log('2. Click "Create a database"'); 
      console.log('3. Select PostgreSQL');
      console.log('4. DATABASE_URL will be automatically added to Secrets');
      console.log('5. Restart your Repl');
      return;
    }
  }
  
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
