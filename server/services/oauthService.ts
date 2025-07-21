import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { storage } from '../storage';
import type { InsertOauthToken, OauthToken } from '../../shared/schema';

// Default development OAuth credentials - these work for all clones
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dev-google-client-id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'dev-google-client-secret';
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || 'dev-slack-client-id';
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || 'dev-slack-client-secret';

export interface OAuthProvider {
  name: string;
  getAuthUrl(userId: string): string;
  exchangeCodeForTokens(code: string, state: string): Promise<OauthToken>;
  refreshTokens(refreshToken: string): Promise<OauthToken>;
  getUserInfo(accessToken: string): Promise<any>;
}

class GoogleOAuthProvider implements OAuthProvider {
  name = 'gmail';
  private oauth2Client: OAuth2Client | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const hasRealCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
    
    // Determine correct redirect URI based on environment
    let redirectUri = 'http://localhost:5000/api/auth/google/callback';
    
    if (process.env.REPLIT_DOMAINS) {
      // For published Replit apps, use the domain from REPLIT_DOMAINS and add protocol
      redirectUri = `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`;
    } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      // For development in Replit, construct the webview URL
      redirectUri = `https://${process.env.REPL_SLUG}--5000--${process.env.REPL_OWNER}.replit.app/api/auth/google/callback`;
    }
    
    console.log(`🔧 Google OAuth redirect URI: ${redirectUri}`);
    console.log(`🔧 Google Client ID: ${GOOGLE_CLIENT_ID?.substring(0, 12)}...`);
    
    // Validate Client ID format
    if (hasRealCredentials && GOOGLE_CLIENT_ID) {
      if (!GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com')) {
        console.error('❌ INVALID Google Client ID format! Must end with .apps.googleusercontent.com');
        console.error(`   Current: ${GOOGLE_CLIENT_ID.substring(0, 20)}...`);
        this.isConfigured = false;
        return;
      }
    }
    
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    
    if (hasRealCredentials) {
      this.isConfigured = true;
      console.log('Gmail OAuth integration enabled with real credentials');
      console.log('⚠️  CRITICAL: Add this EXACT redirect URI to Google Cloud Console:');
      console.log(`   ${redirectUri}`);
      console.log('⚠️  CRITICAL: Verify Client ID in Google Cloud Console matches:');
      console.log(`   ${GOOGLE_CLIENT_ID?.substring(0, 12)}...`);
    } else {
      this.isConfigured = false;
      console.log('Gmail OAuth integration disabled - using development defaults. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for production use.');
    }
  }

  getAuthUrl(userId: string): string {
    if (!this.isConfigured || !this.oauth2Client) {
      throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Replit Secrets.');
    }

    const state = this.generateState(userId);

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      state,
      prompt: 'consent',
      include_granted_scopes: true
    });
  }

  async exchangeCodeForTokens(code: string, state: string): Promise<OauthToken> {
    if (!this.isConfigured || !this.oauth2Client) {
      throw new Error('Google OAuth credentials not configured');
    }

    const userId = this.verifyState(state);

    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    const tokenData: InsertOauthToken = {
      userId,
      provider: 'gmail',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope || null,
      tokenData: {
        token_type: tokens.token_type,
        id_token: tokens.id_token
      }
    };

    return await storage.upsertOauthToken(tokenData);
  }

  async refreshTokens(refreshToken: string): Promise<OauthToken> {
    if (!this.isConfigured || !this.oauth2Client) {
      throw new Error('Google OAuth credentials not configured');
    }

    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    // Update in database would be handled by the calling function
    throw new Error('Method should be called through storage.refreshOauthToken');
  }

  async getUserInfo(accessToken: string): Promise<any> {
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return data;
  }

  private generateState(userId: string): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    const payload = `${userId}:${timestamp}:${random}`;
    const signature = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'fallback-secret')
      .update(payload)
      .digest('hex');

    return Buffer.from(`${payload}:${signature}`).toString('base64');
  }

  private verifyState(state: string): string {
    const decoded = Buffer.from(state, 'base64').toString();
    const [userId, timestamp, random, signature] = decoded.split(':');

    if (!userId || !timestamp || !random || !signature) {
      throw new Error('Invalid state parameter');
    }

    const payload = `${userId}:${timestamp}:${random}`;
    const expectedSignature = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'fallback-secret')
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid state signature');
    }

    // Check if state is not too old (30 minutes)
    const stateAge = Date.now() - parseInt(timestamp);
    if (stateAge > 30 * 60 * 1000) {
      throw new Error('State parameter expired');
    }

    return userId;
  }
}

class SlackOAuthProvider implements OAuthProvider {
  name = 'slack';
  private isConfigured: boolean = false;

  constructor() {
    const hasRealCredentials = process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET;
    
    if (hasRealCredentials) {
      this.isConfigured = true;
      console.log('Slack OAuth integration enabled with real credentials');
    } else {
      this.isConfigured = false;
      console.log('Slack OAuth integration disabled - using development defaults. Set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET for production use.');
    }
  }

  getAuthUrl(userId: string): string {
    if (!this.isConfigured) {
      throw new Error('Slack OAuth credentials not configured. Please set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET in Replit Secrets.');
    }

    const state = this.generateState(userId);
    const scopes = [
      'channels:read',
      'files:read',
      'chat:write',
      'users:read',
      'team:read'
    ].join(',');

    const params = new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      scope: scopes,
      state,
      redirect_uri: `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/api/auth/slack/callback`
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, state: string): Promise<OauthToken> {
    if (!this.isConfigured) {
      throw new Error('Slack OAuth credentials not configured');
    }

    const userId = this.verifyState(state);

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID!,
        client_secret: SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/api/auth/slack/callback`
      })
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack OAuth error: ${data.error}`);
    }

    const tokenData: InsertOauthToken = {
      userId,
      provider: 'slack',
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: null, // Slack tokens don't expire
      scope: data.scope,
      tokenData: {
        team: data.team,
        authed_user: data.authed_user,
        bot_user_id: data.bot_user_id
      }
    };

    return await storage.upsertOauthToken(tokenData);
  }

  async refreshTokens(refreshToken: string): Promise<OauthToken> {
    // Slack tokens don't typically expire, but if refresh is needed:
    throw new Error('Slack tokens do not require refresh');
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://slack.com/api/auth.test', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data;
  }

  private generateState(userId: string): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    const payload = `${userId}:${timestamp}:${random}`;
    const signature = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'fallback-secret')
      .update(payload)
      .digest('hex');

    return Buffer.from(`${payload}:${signature}`).toString('base64');
  }

  private verifyState(state: string): string {
    const decoded = Buffer.from(state, 'base64').toString();
    const [userId, timestamp, random, signature] = decoded.split(':');

    if (!userId || !timestamp || !random || !signature) {
      throw new Error('Invalid state parameter');
    }

    const payload = `${userId}:${timestamp}:${random}`;
    const expectedSignature = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'fallback-secret')
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid state signature');
    }

    const stateAge = Date.now() - parseInt(timestamp);
    if (stateAge > 30 * 60 * 1000) {
      throw new Error('State parameter expired');
    }

    return userId;
  }
}

// Initialize providers safely
const gmailProvider = new GoogleOAuthProvider();
const slackProvider = new SlackOAuthProvider();

export const oauthProviders = {
  gmail: gmailProvider,
  slack: slackProvider
};

// Export a function to check if a provider is configured
export function isProviderConfigured(provider: string): boolean {
  switch (provider) {
    case 'gmail':
      return (gmailProvider as any).isConfigured;
    case 'slack':
      return (slackProvider as any).isConfigured;
    default:
      return false;
  }
}

export async function getValidToken(userId: string, provider: string): Promise<string | null> {
  const token = await storage.getOauthToken(userId, provider);

  if (!token) {
    return null;
  }

  // Check if token is expired
  if (token.expiresAt && new Date() >= token.expiresAt) {
    if (token.refreshToken && provider === 'gmail') {
      try {
        const refreshed = await oauthProviders.gmail.refreshTokens(token.refreshToken);
        return refreshed.accessToken;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    } else {
      return null;
    }
  }

  return token.accessToken;
}