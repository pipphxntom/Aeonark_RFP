import type { Express } from "express";
import session from "express-session";
import MemoryStore from "memorystore";

// Simple authentication system for development/fallback
export function setupSimpleAuth(app: Express) {
  console.log('🔐 Setting up simple authentication system');
  
  // Session configuration
  const memoryStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'aeonrfp-fallback-session-secret-2025',
    store: new memoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
      ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow HTTP in development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  // Simple authentication middleware
  app.use((req, res, next) => {
    // For development, auto-authenticate users
    if (!req.session.user && req.path.startsWith('/api/') && !req.path.includes('/auth/')) {
      // Create a default user for development
      req.session.user = {
        id: 'dev-user-' + Date.now(),
        email: 'developer@aeonrfp.com',
        firstName: 'Developer',
        lastName: 'User',
        isOnboardingComplete: true,
        industry: 'technology',
        companySize: 'startup',
        servicesOffered: ['web development', 'consulting'],
        tonePreference: 'professional'
      };
      console.log('🔧 Auto-authenticated development user');
    }
    next();
  });

  return Promise.resolve();
}

// Simple auth check middleware
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session?.user) {
    return next();
  }
  
  // For non-API routes, redirect to home
  if (!req.path.startsWith('/api/')) {
    return res.redirect('/');
  }
  
  // For API routes, return unauthorized
  return res.status(401).json({ message: 'Authentication required' });
}

export function getCurrentUser(req: any) {
  return req.session?.user;
}