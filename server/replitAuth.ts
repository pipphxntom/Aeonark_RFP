import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  console.warn("REPLIT_DOMAINS not provided, using fallback authentication");
}

const getOidcConfig = memoize(
  async () => {
    try {
      const issuerUrl = process.env.ISSUER_URL || "https://replit.com";
      const replId = process.env.REPL_ID || "mock-repl-id";
      
      return await client.discovery(
        new URL(issuerUrl),
        replId
      );
    } catch (error) {
      console.warn("OAuth discovery failed, using fallback config:", error.message);
      // Return a fallback config for development
      return {
        authorization_endpoint: "https://replit.com/auth",
        token_endpoint: "https://replit.com/token", 
        issuer: process.env.ISSUER_URL || "https://replit.com",
      };
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  let sessionStore;
  
  // Use PostgreSQL session store if DATABASE_URL is available and valid, otherwise use memory store
  if (false && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder') && process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.includes('localhost')) {
    console.log('🔐 Using PostgreSQL session store');
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "user_sessions", // Use different table name to avoid conflicts
      schemaName: "public"
    });
  } else {
    console.log('🔐 Using in-memory session store (sessions will not persist)');
    const memoryStore = MemoryStore(session);
    sessionStore = new memoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
      ttl: sessionTtl,
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  try {
    for (const domain of process.env
      .REPLIT_DOMAINS!.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }
  } catch (error) {
    console.warn("Failed to setup OAuth strategies, using mock auth:", error.message);
    // For development, we'll add a simple mock route that creates a proper user session
    app.get("/api/login", async (req, res) => {
      try {
        // Mock successful login - create a demo user session
        const mockUser = {
          claims: {
            sub: "demo-user-123",
            email: "demo@aeonrfp.com",
            name: "Demo User"
          }
        };
        
        // Create or update the user in the database
        await storage.upsertUser({
          id: mockUser.claims.sub,
          email: mockUser.claims.email,
          name: mockUser.claims.name,
          isOnboardingComplete: false,
          industry: "",
          companySize: "",
          servicesOffered: [],
          tonePreference: "professional"
        });
        
        req.session.user = mockUser;
        res.redirect("/");
      } catch (error) {
        console.error("Error creating mock user:", error);
        res.status(500).json({ message: "Failed to create demo user" });
      }
    });
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", async (req, res) => {
    req.logout(async () => {
      try {
        const config = await getOidcConfig();
        // Only try to build end session URL if we have a proper OAuth config
        if (config && typeof config === 'object' && 'authorization_endpoint' in config && !config.authorization_endpoint.includes('mock')) {
          res.redirect(
            client.buildEndSessionUrl(config, {
              client_id: process.env.REPL_ID!,
              post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
            }).href
          );
        } else {
          // For mock/development mode, just redirect to home
          res.redirect('/');
        }
      } catch (error) {
        console.warn("Error during logout, redirecting to home:", error.message);
        res.redirect('/');
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Handle mock authentication for development
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
