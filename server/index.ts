import express, { type Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from './initDb';
import { autoProvisionDatabase, waitForDatabase } from './auto-provision';

// Load environment variables from .env file
config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize database on startup
// initializeDatabase().catch(console.error);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;

    async function startServer() {
  try {
    // Auto-provision database if needed
    if (!process.env.DATABASE_URL) {
      console.log('🔧 No DATABASE_URL found - starting auto-provisioning...');

      const provisioned = await autoProvisionDatabase();
      if (provisioned) {
        console.log('⏳ Waiting for database to be ready...');
        const ready = await waitForDatabase();

        if (!ready) {
          console.log('⚠️  Auto-provisioning timed out. Manual setup required.');
          console.log('1. Open Database tab → Create PostgreSQL database');
          console.log('2. Restart this Repl');
          process.exit(1);
        }
      }
    }

    try {
      await initializeDatabase();
    } catch (error) {
      console.log('⚠️  Database initialization failed. Continuing with limited functionality.');
      console.log('💡 To enable full functionality, set up a PostgreSQL database in Replit.');
    }

    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

  startServer();
})();