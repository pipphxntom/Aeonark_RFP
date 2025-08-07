# Supabase Database Setup Guide

## Current Issue
You're using the Supabase project dashboard URL instead of the database connection string.

## Correct Setup Steps

1. **Go to your Supabase project dashboard**
   - Visit: https://supabase.com/dashboard/projects
   - Select your project: wezavcxzvpdsdbvjtknw

2. **Navigate to Database Settings**
   - Click "Settings" in the left sidebar
   - Click "Database"

3. **Get the Connection String**
   - Look for "Connection string" section
   - Select **"Transaction"** mode (this uses the pooler)
   - Copy the connection string that looks like:
   ```
   postgresql://postgres.wezavcxzvpdsdbvjtknw:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

4. **Important Notes**
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - The URL should start with `postgresql://`
   - The URL should include port `:6543` (pooler, not :5432)
   - The host should end with `pooler.supabase.com`

## Current vs Correct Format

❌ **Wrong** (what you're using now):
```
https://wezavcxzvpdsdbvjtknw.supabase.co
```

✅ **Correct** (what you should use):
```
postgresql://postgres.wezavcxzvpdsdbvjtknw:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## After Updating DATABASE_URL
Once you provide the correct connection string, I'll be able to:
- Set up all database tables automatically
- Enable persistent sessions
- Test the full OTP authentication flow
- Verify all features are working