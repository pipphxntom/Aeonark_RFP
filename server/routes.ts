import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertRfpSchema, insertSmartMatchSchema, insertProposalSchema } from "@shared/schema";
import { generateProposal, analyzeRfpCompatibility, regenerateSection } from "./services/openai";
import { processUploadedFile } from "./services/fileProcessor";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Onboarding routes
  app.post('/api/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { industry, companySize, servicesOffered, tonePreference } = req.body;
      
      const user = await storage.updateUserOnboarding(userId, {
        industry,
        companySize,
        servicesOffered,
        tonePreference,
        isOnboardingComplete: true,
      });

      res.json(user);
    } catch (error) {
      console.error("Error updating onboarding:", error);
      res.status(500).json({ message: "Failed to update onboarding" });
    }
  });

  // RFP routes
  app.post('/api/rfps/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Process the uploaded file
      const { title, extractedText } = await processUploadedFile(file);
      
      // Create RFP record
      const rfpData = {
        userId,
        title: title || file.originalname,
        fileName: file.originalname,
        fileUrl: file.path,
        fileSize: file.size,
        extractedText,
        status: "uploaded" as const,
      };

      const rfp = await storage.createRfp(rfpData);
      res.json(rfp);
    } catch (error) {
      console.error("Error uploading RFP:", error);
      res.status(500).json({ message: "Failed to upload RFP" });
    }
  });

  app.get('/api/rfps', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rfps = await storage.getRfpsByUser(userId);
      res.json(rfps);
    } catch (error) {
      console.error("Error fetching RFPs:", error);
      res.status(500).json({ message: "Failed to fetch RFPs" });
    }
  });

  app.get('/api/rfps/:id', isAuthenticated, async (req: any, res) => {
    try {
      const rfpId = parseInt(req.params.id);
      const rfp = await storage.getRfpById(rfpId);
      
      if (!rfp) {
        return res.status(404).json({ message: "RFP not found" });
      }

      // Check if user owns this RFP
      if (rfp.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(rfp);
    } catch (error) {
      console.error("Error fetching RFP:", error);
      res.status(500).json({ message: "Failed to fetch RFP" });
    }
  });

  // SmartMatch routes
  app.post('/api/rfps/:id/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rfpId = parseInt(req.params.id);
      
      const rfp = await storage.getRfpById(rfpId);
      if (!rfp || rfp.userId !== userId) {
        return res.status(404).json({ message: "RFP not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Analyze RFP compatibility using AI
      const analysis = await analyzeRfpCompatibility(rfp, user);
      
      // Save SmartMatch results
      const smartMatch = await storage.createSmartMatch({
        rfpId,
        overallScore: analysis.overallScore,
        industryMatch: analysis.industryMatch,
        servicesMatch: analysis.servicesMatch,
        timelineMatch: analysis.timelineMatch,
        certificationsMatch: analysis.certificationsMatch,
        analysisDetails: analysis.details,
      });

      await storage.updateRfp(rfpId, { status: "analyzed" });

      res.json(smartMatch);
    } catch (error) {
      console.error("Error analyzing RFP:", error);
      res.status(500).json({ message: "Failed to analyze RFP" });
    }
  });

  app.get('/api/rfps/:id/smartmatch', isAuthenticated, async (req: any, res) => {
    try {
      const rfpId = parseInt(req.params.id);
      const smartMatch = await storage.getSmartMatchByRfp(rfpId);
      
      if (!smartMatch) {
        return res.status(404).json({ message: "SmartMatch analysis not found" });
      }

      res.json(smartMatch);
    } catch (error) {
      console.error("Error fetching SmartMatch:", error);
      res.status(500).json({ message: "Failed to fetch SmartMatch" });
    }
  });

  // Proposal generation routes
  app.post('/api/rfps/:id/generate-proposal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rfpId = parseInt(req.params.id);
      
      const rfp = await storage.getRfpById(rfpId);
      if (!rfp || rfp.userId !== userId) {
        return res.status(404).json({ message: "RFP not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate proposal using AI
      const proposalContent = await generateProposal(rfp, user);
      
      // Save proposal
      const proposal = await storage.createProposal({
        rfpId,
        userId,
        title: `Proposal for ${rfp.title}`,
        executiveSummary: proposalContent.executiveSummary,
        scopeOfWork: proposalContent.scopeOfWork,
        pricing: proposalContent.pricing,
        timeline: proposalContent.timeline,
        legalTerms: proposalContent.legalTerms,
        status: "draft",
      });

      await storage.updateRfp(rfpId, { status: "generated" });

      res.json(proposal);
    } catch (error) {
      console.error("Error generating proposal:", error);
      res.status(500).json({ message: "Failed to generate proposal" });
    }
  });

  app.get('/api/proposals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const proposals = await storage.getProposalsByUser(userId);
      res.json(proposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.get('/api/proposals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposalById(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      // Check if user owns this proposal
      if (proposal.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(proposal);
    } catch (error) {
      console.error("Error fetching proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  app.put('/api/proposals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingProposal = await storage.getProposalById(proposalId);
      if (!existingProposal || existingProposal.userId !== userId) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      const { executiveSummary, scopeOfWork, pricing, timeline, legalTerms, status } = req.body;
      
      const proposal = await storage.updateProposal(proposalId, {
        executiveSummary,
        scopeOfWork,
        pricing,
        timeline,
        legalTerms,
        status,
      });

      res.json(proposal);
    } catch (error) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ message: "Failed to update proposal" });
    }
  });

  // Proposal Editor Routes
  app.patch('/api/proposals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const updateData = req.body;

      // Verify ownership
      const proposal = await storage.getProposalById(proposalId);
      if (!proposal || proposal.userId !== userId) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      const updated = await storage.updateProposal(proposalId, updateData);
      
      // Track analytics event
      await storage.createAnalyticsEvent({
        userId,
        proposalId,
        eventType: "edited",
        eventData: { section: Object.keys(updateData)[0] }
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ message: "Failed to update proposal" });
    }
  });

  app.post('/api/proposals/:id/regenerate', isAuthenticated, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { sectionType } = req.body;

      const proposal = await storage.getProposalById(proposalId);
      if (!proposal || proposal.userId !== userId) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      const rfp = await storage.getRfpById(proposal.rfpId);
      const user = await storage.getUser(userId);
      
      if (!rfp || !user) {
        return res.status(404).json({ message: "Required data not found" });
      }

      // Generate new content for the specific section
      const newContent = await regenerateSection(rfp, user, sectionType);
      
      const updateData: any = {};
      if (sectionType === "executive-summary") updateData.executiveSummary = newContent.content;
      else if (sectionType === "scope-of-work") updateData.scopeOfWork = newContent.content;
      else if (sectionType === "timeline") updateData.timeline = newContent.content;
      else if (sectionType === "legal-terms") updateData.legalTerms = newContent.content;

      const updated = await storage.updateProposal(proposalId, updateData);

      // Track analytics event
      await storage.createAnalyticsEvent({
        userId,
        proposalId,
        eventType: "regenerated",
        eventData: { section: sectionType }
      });

      res.json(updated);
    } catch (error) {
      console.error("Error regenerating section:", error);
      res.status(500).json({ message: "Failed to regenerate section" });
    }
  });

  app.post('/api/proposals/:id/share', isAuthenticated, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const proposal = await storage.getProposalById(proposalId);
      if (!proposal || proposal.userId !== userId) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      const shareToken = await storage.generateShareToken(proposalId);
      const shareUrl = `${req.protocol}://${req.hostname}/share/${shareToken}`;

      res.json({ shareToken, shareUrl });
    } catch (error) {
      console.error("Error sharing proposal:", error);
      res.status(500).json({ message: "Failed to share proposal" });
    }
  });

  // Memory Clauses Routes
  app.get('/api/memory-clauses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, search } = req.query;

      let clauses;
      if (search) {
        clauses = await storage.searchMemoryClauses(userId, search as string);
      } else if (type) {
        clauses = await storage.getMemoryClausesByType(userId, type as string);
      } else {
        clauses = await storage.getMemoryClausesByUser(userId);
      }

      res.json(clauses);
    } catch (error) {
      console.error("Error fetching memory clauses:", error);
      res.status(500).json({ message: "Failed to fetch memory clauses" });
    }
  });

  app.post('/api/memory-clauses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clauseData = { ...req.body, userId };

      const clause = await storage.createMemoryClause(clauseData);
      res.json(clause);
    } catch (error) {
      console.error("Error creating memory clause:", error);
      res.status(500).json({ message: "Failed to create memory clause" });
    }
  });

  app.patch('/api/memory-clauses/:id/use', isAuthenticated, async (req: any, res) => {
    try {
      const clauseId = parseInt(req.params.id);
      await storage.updateMemoryClauseUsage(clauseId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating clause usage:", error);
      res.status(500).json({ message: "Failed to update clause usage" });
    }
  });

  // Analytics Routes
  app.get('/api/analytics/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summary = await storage.getAnalyticsSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  app.get('/api/analytics/timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { range = "30d" } = req.query;
      
      // Mock data for timeline - replace with real implementation
      const timelineData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        proposals: Math.floor(Math.random() * 5),
        turnaroundTime: Math.floor(Math.random() * 8) + 2
      }));

      res.json(timelineData);
    } catch (error) {
      console.error("Error fetching timeline data:", error);
      res.status(500).json({ message: "Failed to fetch timeline data" });
    }
  });

  app.get('/api/analytics/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.query;
      
      const events = await storage.getAnalyticsEvents(userId, type as string);
      res.json(events);
    } catch (error) {
      console.error("Error fetching analytics events:", error);
      res.status(500).json({ message: "Failed to fetch analytics events" });
    }
  });

  // Public sharing route (no auth required)
  app.get('/share/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const proposal = await storage.getProposalByShareToken(token);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      // Return a public view of the proposal
      res.json({
        title: proposal.title,
        executiveSummary: proposal.executiveSummary,
        scopeOfWork: proposal.scopeOfWork,
        timeline: proposal.timeline,
        pricing: proposal.pricing,
        createdAt: proposal.createdAt
      });
    } catch (error) {
      console.error("Error fetching shared proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
