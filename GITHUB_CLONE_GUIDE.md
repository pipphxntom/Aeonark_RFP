# GitHub Clone & Replit Setup Guide

## How Secrets Work When Cloning

When you push your code to GitHub and clone it to a new Replit environment, here's what happens:

### ✅ **What Works Automatically**
- **Code & Database**: All your code and database schema transfers perfectly
- **OTP Email System**: Works automatically (uses RESEND_API_KEY from Replit Secrets)
- **Basic App Functions**: Authentication, onboarding, proposal generation all work
- **OAuth Development Mode**: Gmail/Slack integrations show "Not Configured" but don't break the app

### ❌ **What Needs Manual Setup**
- **Replit Secrets**: Need to be re-added manually in each new environment
- **OAuth Redirect URIs**: Need to be updated for the new domain

## Step-by-Step Clone Process

### 1. Push to GitHub (Current Environment)
```bash
git add .
git commit -m "AeonRFP production ready"
git push origin main
```

### 2. Clone to New Replit
1. Create new Replit project
2. Import from GitHub repository
3. The app will start but integrations won't work yet

### 3. Add Required Secrets (New Environment)
In your new Replit, go to Secrets tab and add:

**Essential Secrets (Required)**:
- `RESEND_API_KEY`: Your Resend email API key
- `OPENAI_API_KEY`: Your OpenAI API key
- `SESSION_SECRET`: Any secure random string

**Optional Secrets (For OAuth)**:
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `SLACK_CLIENT_ID`: Your Slack app client ID
- `SLACK_CLIENT_SECRET`: Your Slack app client secret

### 4. Update OAuth Redirect URIs (If Using OAuth)
1. Get your new Replit domain
2. Update Google Cloud Console redirect URI to new domain
3. Update Slack app redirect URI to new domain

## What I've Built For Easy Cloning

### **Development Fallbacks**
- OAuth integrations work in "development mode" without real credentials
- App functions normally even without Gmail/Slack connections
- Clear error messages guide users to set up missing secrets

### **Automatic Detection**
- System detects when real vs development credentials are used
- Shows appropriate status messages
- No crashes or errors when credentials are missing

### **Documentation**
- Complete setup guides for all integrations
- Exact steps for each OAuth provider
- Clear instructions for secret management

## Testing Results

The Gmail OAuth integration is working correctly with your real credentials. The system:
- Generates proper OAuth URLs
- Handles authentication flow correctly
- Shows connection status accurately
- Falls back gracefully when credentials are missing

## Recommendation

For the smoothest experience across clones:

1. **Keep Essential Secrets**: Always add RESEND_API_KEY, OPENAI_API_KEY, SESSION_SECRET
2. **OAuth is Optional**: The app works perfectly without OAuth integrations
3. **Set Up OAuth Only When Needed**: Add OAuth credentials only for production use
4. **Use Development Mode**: Let integrations show "Not Configured" during development

This way, every clone works immediately with just the essential secrets, and you can add OAuth later when ready for production.