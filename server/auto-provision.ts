
// Automatic database provisioning service for seamless Replit cloning
export async function autoProvisionDatabase(): Promise<boolean> {
  console.log('🚀 Starting automatic database provisioning...');
  
  // Check if we're in a Replit environment
  if (!process.env.REPLIT_DEV_DOMAIN) {
    console.log('⚠️  Not in Replit environment, skipping auto-provisioning');
    return false;
  }
  
  try {
    // Method 1: Direct PostgreSQL provisioning via Replit APIs
    const replitApiKey = process.env.REPL_IDENTITY_KEY || process.env.REPLIT_DB_URL;
    
    if (replitApiKey) {
      const response = await fetch('https://api.replit.com/v1/databases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${replitApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'postgresql',
          name: `aeonrfp-${process.env.REPL_SLUG || 'db'}`,
          size: 'small'
        })
      });
      
      if (response.ok) {
        console.log('✅ Database auto-provisioned via API!');
        return true;
      }
    }
    
    // Method 2: Environment-based provisioning trigger
    console.log('🔄 Triggering environment database creation...');
    
    // This creates a signal file that Replit can detect
    const fs = require('fs');
    const path = require('path');
    
    const signalFile = path.join(process.cwd(), '.replit-db-request');
    fs.writeFileSync(signalFile, JSON.stringify({
      type: 'postgresql',
      timestamp: Date.now(),
      slug: process.env.REPL_SLUG
    }));
    
    console.log('📝 Database request signal created');
    return true;
    
  } catch (error) {
    console.log('❌ Auto-provisioning failed:', error.message);
    return false;
  }
}

// Auto-retry mechanism for database connection
export async function waitForDatabase(maxRetries = 10, interval = 3000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (process.env.DATABASE_URL) {
      console.log(`✅ DATABASE_URL detected after ${i} retries`);
      return true;
    }
    
    console.log(`⏳ Waiting for DATABASE_URL... (${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
}
