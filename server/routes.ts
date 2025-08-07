import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupSimpleAuth, isAuthenticated as simpleIsAuthenticated, getCurrentUser } from "./simpleAuth";
import { insertRfpSchema, insertSmartMatchSchema, insertProposalSchema } from "@shared/schema";
import { generateProposal, analyzeRfpCompatibility, regenerateSection } from "./services/openai";
import { processUploadedFile } from "./services/fileProcessor";
import { sendEmail, generateOtpEmail } from "./services/emailService";
import { SmartMatch } from "./smartmatch";
import { PdfService } from "./smartmatch/pdf";
import { documentFeedbackService } from "./services/documentFeedback";
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
  // Try to setup full auth, fall back to simple auth if it fails
  try {
    await setupAuth(app);
    console.log('✅ Full authentication system initialized');
  } catch (error) {
    console.log('⚠️  Full auth failed, using simple authentication');
    await setupSimpleAuth(app);
  }

  // OTP Authentication routes
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send email with OTP
      let emailSent = false;
      if (process.env.TITAN_MAIL_PASSWORD) {
        emailSent = await sendEmail({
          to: email,
          subject: "Your AeonRFP Login Code",
          html: generateOtpEmail(otp)
        });
      }
      
      if (!emailSent) {
        // Fallback: log OTP in development
        console.log(`📧 OTP for ${email}: ${otp} (Email service unavailable)`);
      }
      
      // Store OTP in session (in production, use Redis or database)
      req.session.otpData = {
        email,
        otp,
        createdAt: Date.now(),
        attempts: 0
      };
      
      res.json({ 
        success: true, 
        message: emailSent ? "OTP sent to your email" : "OTP generated (check server logs)",
        // In development, include OTP in response for testing when email fails
        ...(process.env.NODE_ENV === 'development' && !emailSent && { otp })
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }
      
      const otpData = req.session.otpData;

      
      if (!otpData || otpData.email !== email) {
        return res.status(400).json({ message: "Invalid OTP session" });
      }
      
      // Check if OTP has expired (10 minutes)
      if (Date.now() - otpData.createdAt > 10 * 60 * 1000) {
        delete req.session.otpData;
        return res.status(400).json({ message: "OTP has expired" });
      }
      
      // Check if too many attempts
      if (otpData.attempts >= 3) {
        delete req.session.otpData;
        return res.status(400).json({ message: "Too many failed attempts" });
      }
      
      // Verify OTP
      if (otpData.otp !== otp) {
        otpData.attempts += 1;
        return res.status(400).json({ message: "Invalid OTP" });
      }
      
      // OTP verified successfully - create user session
      const mockUser = {
        claims: {
          sub: `otp-user-${email.replace('@', '-').replace('.', '-')}`,
          email: email,
          name: email.split('@')[0]
        }
      };
      
      // Create or update user in database (with fallback for connection issues)
      try {
        await storage.upsertUser({
          id: mockUser.claims.sub,
          email: mockUser.claims.email,
          firstName: mockUser.claims.name,
          lastName: null,
          profileImageUrl: null,
          industry: null,
          companySize: null,
          servicesOffered: [],
          tonePreference: "professional",
          isOnboardingComplete: false
        });
      } catch (dbError) {
        console.log("Database unavailable, continuing with session-only auth");
        // Store user data in session as fallback
        mockUser.claims.isOnboardingComplete = false;
      }
      
      // Create session
      req.session.user = mockUser;
      delete req.session.otpData;
      
      res.json({ 
        success: true, 
        message: "OTP verified successfully",
        user: mockUser
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user;
      try {
        user = await storage.getUser(userId);
      } catch (dbError) {
        // Fallback to session data when database is unavailable
        console.log("Database unavailable, using session data");
        user = {
          id: req.user.claims.sub,
          email: req.user.claims.email,
          firstName: req.user.claims.name || req.user.claims.email.split('@')[0],
          lastName: null,
          profileImageUrl: null,
          industry: null,
          companySize: null,
          servicesOffered: [],
          tonePreference: "professional",
          isOnboardingComplete: req.user.claims.isOnboardingComplete || false
        };
      }
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
      
      let user;
      try {
        // Try to update user in database
        user = await storage.updateUserOnboarding(userId, {
          industry,
          companySize,
          servicesOffered,
          tonePreference,
          isOnboardingComplete: true,
        });
      } catch (dbError) {
        console.log("Database unavailable during onboarding, using session fallback");
        // Update session data as fallback
        req.user.claims.industry = industry;
        req.user.claims.companySize = companySize;
        req.user.claims.servicesOffered = servicesOffered;
        req.user.claims.tonePreference = tonePreference;
        req.user.claims.isOnboardingComplete = true;
        
        // Return session-based user data
        user = {
          id: userId,
          email: req.user.claims.email,
          firstName: req.user.claims.name || req.user.claims.email.split('@')[0],
          lastName: null,
          profileImageUrl: null,
          industry,
          companySize,
          servicesOffered,
          tonePreference,
          isOnboardingComplete: true
        };
      }

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

      // Process the uploaded file with enhanced document classification
      const processedFile = await processUploadedFile(file);
      
      // Only reject clearly invalid documents (invoices, resumes)
      if (!processedFile.isValidRFP && (processedFile.documentType === 'Invoice' || processedFile.documentType === 'Resume')) {
        return res.status(400).json({
          error: "Invalid Document Type",
          message: processedFile.rejectionReason || `This appears to be a ${processedFile.documentType.toLowerCase()}, not a valid RFP document.`,
          documentType: processedFile.documentType,
          confidence: processedFile.confidence,
          fitScore: processedFile.fitScore,
          classification: processedFile.classification,
          suggestions: [
            "Please upload a Request for Proposal (RFP) or Request for Quotation (RFQ) document",
            "Ensure the document contains sections like scope of work, deliverables, and evaluation criteria",
            "Remove any invoice, receipt, or non-RFP documents from your upload"
          ]
        });
      }

      // Warn if fit score is low but document was accepted
      if (processedFile.fitScore < 40) {
        console.warn(`⚠️ Low fit score (${processedFile.fitScore}) for document: ${processedFile.title}`);
      }
      
      // Create RFP record with enhanced metadata
      const rfpData = {
        userId,
        title: processedFile.title || file.originalname,
        fileName: file.originalname,
        fileUrl: file.path,
        fileSize: file.size,
        extractedText: processedFile.extractedText,
        documentType: processedFile.documentType,
        status: "uploaded" as const,
        metadata: {
          classification: processedFile.classification,
          fitScore: processedFile.fitScore,
          confidence: processedFile.confidence,
          extractedSections: processedFile.classification.extractedSections,
          validationPassed: true,
          processedAt: new Date().toISOString()
        }
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

      try {
        // Analyze RFP compatibility using AI
        const analysis = await analyzeRfpCompatibility(rfp, user);
        
        // Save SmartMatch results  
        const smartMatch = await storage.createSmartMatch({
          rfpId,
          overallScore: analysis.overallScore,
          industryMatch: analysis.breakdown.industryMatch,
          servicesMatch: analysis.breakdown.serviceMatch,
          timelineMatch: analysis.breakdown.timelineAlignment,
          certificationsMatch: analysis.breakdown.certifications,
          analysisDetails: {
            verdict: analysis.verdict,
            breakdown: analysis.breakdown,
            details: analysis.details,
            documentSummary: analysis.documentSummary,
          },
        });

        await storage.updateRfp(rfpId, { status: "analyzed" });

        res.json(smartMatch);
      } catch (analysisError) {
        // Handle document type errors specifically
        if (analysisError.message && analysisError.message.includes("Document Type Error")) {
          return res.status(400).json({
            error: "Invalid Document Type",
            message: analysisError.message.replace("Document Type Error: ", ""),
            suggestion: "Please upload a valid Request for Proposal document for analysis."
          });
        }
        throw analysisError;
      }
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
      const timelineData = await storage.getAnalyticsTimeline(userId);
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

  // Enhanced SmartMatch Intelligence Routes
  const smartMatch = new SmartMatch();

  // Deep RFP Analysis
  app.post('/api/smartmatch/analyze-deep', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { rfpId, content } = req.body;

      if (!rfpId || !content) {
        return res.status(400).json({ message: "RFP ID and content are required" });
      }

      const analysis = await smartMatch.analyzeRFPDeep(rfpId, userId, content);
      res.json(analysis);
    } catch (error) {
      console.error("Error in deep RFP analysis:", error);
      res.status(500).json({ message: "Failed to analyze RFP" });
    }
  });

  // Submit feedback for SmartMatch learning
  app.post('/api/smartmatch/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { smartMatchId, rating, feedbackType, comments, improvedScore } = req.body;

      if (!smartMatchId || !rating || !feedbackType) {
        return res.status(400).json({ message: "SmartMatch ID, rating, and feedback type are required" });
      }

      const result = await smartMatch.processFeedback(userId, smartMatchId, {
        rating,
        feedbackType,
        comments,
        improvedScore
      });

      res.json(result);
    } catch (error) {
      console.error("Error processing feedback:", error);
      res.status(500).json({ message: "Failed to process feedback" });
    }
  });

  // Get personalized recommendations
  app.get('/api/smartmatch/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recommendations = await smartMatch.getPersonalizedRecommendations(userId);
      res.json({ recommendations });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Vector similarity search
  app.post('/api/smartmatch/search-similar', isAuthenticated, async (req: any, res) => {
    try {
      const { query, filters, limit } = req.body;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results = await smartMatch.findSimilarRFPs(query, filters || {}, limit || 10);
      res.json({ results });
    } catch (error) {
      console.error("Error in similarity search:", error);
      res.status(500).json({ message: "Failed to search similar RFPs" });
    }
  });

  // Email ingestion routes
  app.post('/api/smartmatch/ingest-emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { provider } = req.body;

      const result = await smartMatch.ingestEmailsForUser(userId, provider);
      res.json(result);
    } catch (error) {
      console.error("Error ingesting emails:", error);
      res.status(500).json({ message: "Failed to ingest emails" });
    }
  });

  app.get('/api/smartmatch/email-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await smartMatch.getEmailIngestionStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Error getting email status:", error);
      res.status(500).json({ message: "Failed to get email status" });
    }
  });

  // SmartMatch analytics
  app.get('/api/smartmatch/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await smartMatch.getAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error getting SmartMatch analytics:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // OAuth Integration Routes
  // Debug endpoint to show exact OAuth URLs being generated
  app.get("/api/debug/oauth-config", (req, res) => {
    // Same logic as in oauthService.ts
    let redirectUri = 'http://localhost:5000/api/auth/google/callback';
    
    if (process.env.REPLIT_DOMAINS) {
      redirectUri = `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`;
    } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      redirectUri = `https://${process.env.REPL_SLUG}--5000--${process.env.REPL_OWNER}.replit.app/api/auth/google/callback`;
    }

    res.json({
      message: "📋 COPY THIS EXACT URI TO GOOGLE CLOUD CONSOLE",
      redirectUri,
      instructions: [
        "1. Go to https://console.cloud.google.com/",
        "2. Navigate to APIs & Services → Credentials", 
        "3. Edit your OAuth 2.0 Client ID",
        "4. Add the redirectUri above to 'Authorized redirect URIs'",
        "5. Save and wait 2 minutes for propagation"
      ],
      environment: {
        REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
        REPL_SLUG: process.env.REPL_SLUG,
        REPL_OWNER: process.env.REPL_OWNER
      }
    });
  });

  app.post("/api/oauth/connect", isAuthenticated, async (req, res) => {
    try {
      const { provider } = req.body;
      const userId = req.user!.claims.sub;
      
      if (!['gmail', 'slack'].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider" });
      }

      const { oauthProviders, isProviderConfigured } = await import('./services/oauthService');
      
      // Check if provider is configured
      if (!isProviderConfigured(provider)) {
        const missingVars = provider === 'gmail' 
          ? ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
          : ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'];
        
        return res.status(400).json({ 
          error: `${provider} OAuth not configured`, 
          message: `Please set ${missingVars.join(' and ')} in Replit Secrets to enable ${provider} integration.`,
          missingVariables: missingVars
        });
      }

      const authUrl = oauthProviders[provider as keyof typeof oauthProviders].getAuthUrl(userId);
      
      res.json({ authUrl });
    } catch (error) {
      console.error("Error initiating OAuth:", error);
      res.status(500).json({ error: "Failed to initiate OAuth" });
    }
  });

  app.get("/api/auth/:provider/callback", async (req, res) => {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).send("Missing code or state parameter");
      }

      if (!['google', 'slack'].includes(provider)) {
        return res.status(400).send("Invalid provider");
      }

      const { oauthProviders } = await import('./services/oauthService');
      const providerName = provider === 'google' ? 'gmail' : provider;
      const token = await oauthProviders[providerName as keyof typeof oauthProviders].exchangeCodeForTokens(code as string, state as string);
      
      // Redirect to frontend with success  
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000';
      res.redirect(`${baseUrl}/?connected=${provider}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000';
      res.redirect(`${baseUrl}/?error=oauth_failed`);
    }
  });

  app.get("/api/oauth/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.claims.sub;
      const { isProviderConfigured } = await import('./services/oauthService');
      
      const gmailToken = await storage.getOauthToken(userId, 'gmail');
      const slackToken = await storage.getOauthToken(userId, 'slack');
      
      res.json({
        gmail: {
          connected: !!gmailToken,
          email: gmailToken?.tokenData?.email || null,
          configured: isProviderConfigured('gmail')
        },
        slack: {
          connected: !!slackToken,
          team: slackToken?.tokenData?.team?.name || null,
          configured: isProviderConfigured('slack')
        }
      });
    } catch (error) {
      console.error("Error getting OAuth status:", error);
      res.status(500).json({ error: "Failed to get OAuth status" });
    }
  });

  app.delete("/api/oauth/disconnect/:provider", isAuthenticated, async (req, res) => {
    try {
      const { provider } = req.params;
      const userId = req.user!.claims.sub;
      
      if (!['gmail', 'slack'].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider" });
      }

      await storage.deleteOauthToken(userId, provider);
      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting OAuth:", error);
      res.status(500).json({ error: "Failed to disconnect OAuth" });
    }
  });

  // Gmail Integration Routes
  app.get('/api/gmail/emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gmailService } = await import('./services/gmailService');
      
      const emails = await gmailService.fetchEmailsWithAttachments(userId, 20);
      const emailSummaries = [];
      
      for (const email of emails) {
        const summary = await gmailService.generateEmailSummary(email);
        emailSummaries.push(summary);
      }
      
      // Sort by RFP probability and recency
      emailSummaries.sort((a, b) => {
        if (a.isRfp !== b.isRfp) return b.isRfp ? 1 : -1;
        return b.confidence - a.confidence;
      });
      
      res.json({ emails: emailSummaries });
    } catch (error) {
      console.error("Error fetching Gmail emails:", error);
      res.status(500).json({ message: "Failed to fetch emails from Gmail" });
    }
  });

  app.post('/api/gmail/emails/:messageId/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId } = req.params;
      const { gmailService } = await import('./services/gmailService');
      
      const emails = await gmailService.fetchEmailsWithAttachments(userId, 50);
      const email = emails.find(e => e.id === messageId);
      
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      const summary = await gmailService.generateEmailSummary(email);
      res.json(summary);
    } catch (error) {
      console.error("Error generating email summary:", error);
      res.status(500).json({ message: "Failed to generate email summary" });
    }
  });

  app.post('/api/gmail/emails/:messageId/create-rfp', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId } = req.params;
      const { gmailService } = await import('./services/gmailService');
      
      const rfp = await gmailService.createRfpFromEmail(userId, messageId);
      console.log('✅ RFP created successfully from email:', rfp.id);
      res.json({ 
        success: true, 
        rfp,
        message: "RFP created successfully from email attachment" 
      });
    } catch (error) {
      console.error("Error creating RFP from email:", error);
      res.status(500).json({ message: "Failed to create RFP from email" });
    }
  });

  app.get('/api/gmail/emails/:messageId/attachments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId } = req.params;
      const { gmailService } = await import('./services/gmailService');
      
      const emails = await gmailService.fetchEmailsWithAttachments(userId, 50);
      const email = emails.find(e => e.id === messageId);
      
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      res.json({ attachments: email.attachments });
    } catch (error) {
      console.error("Error fetching email attachments:", error);
      res.status(500).json({ message: "Failed to fetch email attachments" });
    }
  });

  // SmartMatch API Routes
  app.post('/api/smartmatch', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { query, model = 'gemini', limit = 5 } = req.body;
      
      let queryText = query;
      let queryType = 'text';
      
      // Handle file upload if provided
      if (req.file) {
        const pdfService = new PdfService();
        
        // Validate file type
        if (!await pdfService.validatePdfFile(req.file.path)) {
          return res.status(400).json({ error: 'Invalid file type. Only PDF files are supported.' });
        }
        
        // Extract text from PDF
        const extractedText = await pdfService.extractTextFromPdf(req.file.path);
        queryText = pdfService.cleanExtractedText(extractedText);
        queryType = 'pdf';
        
        // Clean up uploaded file
        await require('fs').promises.unlink(req.file.path);
      }
      
      if (!queryText) {
        return res.status(400).json({ error: 'Query text or file is required' });
      }
      
      // Initialize SmartMatch engine
      const smartMatch = new SmartMatch();
      
      // Process the query
      const result = await smartMatch.match({
        query: queryText,
        userId,
        queryType: queryType as 'text' | 'pdf',
        model: model as 'openai' | 'claude' | 'gemini' | 'deepseek',
        limit: parseInt(limit)
      });
      
      res.json(result);
    } catch (error) {
      console.error('SmartMatch error:', error);
      res.status(500).json({ error: 'Failed to process SmartMatch query', details: error.message });
    }
  });

  // Clause template management routes
  app.get('/api/smartmatch/clauses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const smartMatch = new SmartMatch();
      
      const clauses = await smartMatch.getClauseTemplates(userId);
      res.json(clauses);
    } catch (error) {
      console.error('Error fetching clause templates:', error);
      res.status(500).json({ error: 'Failed to fetch clause templates' });
    }
  });

  app.post('/api/smartmatch/clauses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, body, category, tags } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
      }
      
      const smartMatch = new SmartMatch();
      await smartMatch.addClauseTemplate(userId, title, body, category, tags);
      
      res.json({ success: true, message: 'Clause template created successfully' });
    } catch (error) {
      console.error('Error creating clause template:', error);
      res.status(500).json({ error: 'Failed to create clause template' });
    }
  });

  app.post('/api/smartmatch/sample-clauses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const smartMatch = new SmartMatch();
      
      // Create sample clauses for testing
      const { ClauseService } = await import('./smartmatch/clause');
      const clauseService = new ClauseService();
      await clauseService.createSampleClauses(userId);
      
      res.json({ success: true, message: 'Sample clauses created successfully' });
    } catch (error) {
      console.error('Error creating sample clauses:', error);
      res.status(500).json({ error: 'Failed to create sample clauses' });
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

  // Email Integration Routes
  app.post('/api/integrations/:platform/connect', isAuthenticated, async (req: any, res) => {
    try {
      const { platform } = req.params;
      const userId = req.user.claims.sub;
      
      // Mock connection for development
      // In production, this would handle OAuth flows for each platform
      const connectionData = {
        platform,
        userId,
        connected: true,
        connectedAt: new Date().toISOString()
      };
      
      res.json({ success: true, connection: connectionData });
    } catch (error) {
      console.error(`Error connecting to ${req.params.platform}:`, error);
      res.status(500).json({ message: "Failed to connect integration" });
    }
  });

  app.get('/api/integrations/:platform/auth', isAuthenticated, async (req: any, res) => {
    try {
      const { platform } = req.params;
      
      // Mock OAuth redirect for development
      // In production, this would redirect to actual OAuth providers
      const redirectUrls = {
        slack: 'https://slack.com/oauth/v2/authorize',
        gmail: 'https://accounts.google.com/o/oauth2/auth',
        outlook: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
      };
      
      res.json({ 
        authUrl: redirectUrls[platform as keyof typeof redirectUrls] || '#',
        message: `Redirecting to ${platform} OAuth...`
      });
    } catch (error) {
      console.error(`Error getting auth URL for ${req.params.platform}:`, error);
      res.status(500).json({ message: "Failed to get auth URL" });
    }
  });

  app.get('/api/integrations/emails/scan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Mock email scanning for development
      // In production, this would connect to actual email APIs
      const mockEmails = [
        {
          id: '1',
          subject: 'RFP: Software Development Services for Digital Transformation',
          sender: 'procurement@techcorp.com',
          summary: 'TechCorp is seeking a development partner for a 6-month digital transformation project. Requirements include modern web application development, cloud migration, and API integration. Budget range: $150K-$200K.',
          isRfp: true,
          confidence: 0.95,
          timestamp: '2 hours ago'
        },
        {
          id: '2',
          subject: 'Consulting Opportunity - Healthcare Platform',
          sender: 'partnerships@healthsys.org',
          summary: 'HealthSys is looking for consulting services to design and implement a patient management platform. Project involves system architecture, security compliance, and training. Timeline: 4 months.',
          isRfp: true,
          confidence: 0.87,
          timestamp: '5 hours ago'
        },
        {
          id: '3',
          subject: 'Partnership Inquiry',
          sender: 'business@startup.io',
          summary: 'General partnership inquiry from a startup looking to explore collaboration opportunities. No specific project details or budget mentioned.',
          isRfp: false,
          confidence: 0.23,
          timestamp: '1 day ago'
        }
      ];
      
      res.json({ emails: mockEmails });
    } catch (error) {
      console.error("Error scanning emails:", error);
      res.status(500).json({ message: "Failed to scan emails" });
    }
  });

  // Industry AI endpoints (standalone page)
  app.get('/api/industry-ai/models', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Return mock industry models data
      const models = [
        {
          id: 1,
          industry: 'technology',
          version: '2.1',
          status: 'active',
          accuracy: 0.942,
          precision: 0.891,
          dataPoints: 247,
          lastTrained: new Date('2025-07-15'),
        },
        {
          id: 2,
          industry: 'healthcare',
          version: '1.8',
          status: 'active',
          accuracy: 0.887,
          precision: 0.834,
          dataPoints: 189,
          lastTrained: new Date('2025-07-12'),
        },
        {
          id: 3,
          industry: 'finance',
          version: '1.5',
          status: 'training',
          accuracy: 0.823,
          precision: 0.791,
          dataPoints: 156,
          lastTrained: new Date('2025-07-08'),
        }
      ];

      res.json(models);
    } catch (error) {
      console.error('Error fetching industry models:', error);
      res.status(500).json({ message: 'Failed to fetch industry models' });
    }
  });

  app.get('/api/industry-ai/training-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Return mock training logs
      const logs = [
        {
          id: 1,
          industry: 'technology',
          trainingType: 'incremental',
          status: 'completed',
          dataPointsUsed: 45,
          trainingDuration: 1820, // seconds
          improvements: {
            accuracyImprovement: 0.047,
            dataPointsAdded: 45
          },
          afterMetrics: {
            accuracy: 0.942
          },
          createdAt: new Date('2025-07-15T14:30:00Z'),
        },
        {
          id: 2,
          industry: 'healthcare',
          trainingType: 'full-retrain',
          status: 'running',
          dataPointsUsed: 189,
          trainingDuration: 0,
          improvements: null,
          afterMetrics: null,
          createdAt: new Date('2025-07-20T20:15:00Z'),
        }
      ];

      res.json(logs);
    } catch (error) {
      console.error('Error fetching training logs:', error);
      res.status(500).json({ message: 'Failed to fetch training logs' });
    }
  });

  app.get('/api/industry-ai/memory-banks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Return mock memory bank data based on winning proposals
      const memoryBanks = [
        {
          id: 1,
          industry: 'technology',
          outcome: 'won',
          projectValue: '150000',
          timelineWeeks: 12,
          winProbability: '0.87',
          clientSize: 'enterprise',
          competitorCount: 4,
          keyPhrases: ['cloud migration', 'scalability', 'security', 'DevOps'],
          requiredCertifications: ['AWS Certified', 'SOC 2', 'ISO 27001'],
          createdAt: new Date('2025-07-01'),
        },
        {
          id: 2,
          industry: 'healthcare',
          outcome: 'won',
          projectValue: '75000',
          timelineWeeks: 8,
          winProbability: '0.92',
          clientSize: 'mid-market',
          competitorCount: 3,
          keyPhrases: ['HIPAA compliance', 'EHR integration', 'data analytics'],
          requiredCertifications: ['HIPAA', 'HL7 FHIR'],
          createdAt: new Date('2025-06-15'),
        },
        {
          id: 3,
          industry: 'finance',
          outcome: 'lost',
          projectValue: '200000',
          timelineWeeks: 16,
          winProbability: '0.65',
          clientSize: 'enterprise',
          competitorCount: 6,
          keyPhrases: ['regulatory compliance', 'risk management', 'audit trail'],
          requiredCertifications: ['SOX', 'PCI DSS', 'GDPR'],
          createdAt: new Date('2025-05-30'),
        }
      ];

      res.json(memoryBanks);
    } catch (error) {
      console.error('Error fetching memory banks:', error);
      res.status(500).json({ message: 'Failed to fetch memory banks' });
    }
  });

  app.post('/api/industry-ai/train', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { industry, modelType, comments } = req.body;
      
      const trainingLog = {
        id: Date.now(),
        industry,
        trainingType: modelType,
        status: 'running',
        dataPointsUsed: Math.floor(Math.random() * 100) + 20,
        trainingDuration: 0,
        improvements: null,
        afterMetrics: null,
        createdAt: new Date(),
        comments
      };

      res.json(trainingLog);
    } catch (error) {
      console.error('Error starting training:', error);
      res.status(500).json({ message: 'Failed to start training' });
    }
  });

  // SmartMatch Industry AI API Routes (for compatibility)
  app.get('/api/smartmatch/industry-models', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const models = await storage.getIndustryModels(userId);
      res.json(models);
    } catch (error) {
      console.error("Error fetching industry models:", error);
      res.status(500).json({ message: "Failed to fetch industry models" });
    }
  });

  app.get('/api/smartmatch/training-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logs = await storage.getTrainingLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching training logs:", error);
      res.status(500).json({ message: "Failed to fetch training logs" });
    }
  });

  app.get('/api/smartmatch/memory-banks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memoryBanks = await storage.getMemoryBanks(userId);
      res.json(memoryBanks);
    } catch (error) {
      console.error("Error fetching memory banks:", error);
      res.status(500).json({ message: "Failed to fetch memory banks" });
    }
  });

  app.post('/api/smartmatch/train-model', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { industry } = req.body;
      
      // Create a training log entry
      const trainingLog = await storage.createTrainingLog({
        userId,
        industry,
        trainingType: "manual",
        dataPointsUsed: 50,
        trainingDuration: 120,
        status: "completed",
        beforeMetrics: { accuracy: 0.75, precision: 0.72 },
        afterMetrics: { accuracy: 0.82, precision: 0.79 },
        improvements: { accuracyImprovement: 0.07, dataPointsAdded: 10 }
      });

      res.json({ success: true, trainingLog });
    } catch (error) {
      console.error("Error training model:", error);
      res.status(500).json({ message: "Failed to train model" });
    }
  });

  // Industry-specific SmartMatch routes
  app.use('/api/industry-smartmatch', isAuthenticated, (await import('./routes/industrySmartMatch')).default);

  // Document Feedback Routes
  app.post('/api/rfps/:id/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const rfpId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { feedback, reason, suggestedType } = req.body;
      
      if (!['correct', 'incorrect'].includes(feedback)) {
        return res.status(400).json({ message: "Invalid feedback type" });
      }
      
      // Verify ownership
      const rfp = await storage.getRfpById(rfpId);
      if (!rfp || rfp.userId !== userId) {
        return res.status(404).json({ message: "RFP not found" });
      }
      
      await documentFeedbackService.markIncorrectSuggestion({
        rfpId,
        userId,
        feedback: feedback as 'correct' | 'incorrect',
        reason,
        suggestedType
      });
      
      res.json({ 
        success: true, 
        message: feedback === 'incorrect' ? 
          "Thank you for the feedback. This document has been marked for review and will help improve our classification." :
          "Thank you for confirming the classification accuracy!"
      });
    } catch (error) {
      console.error("Error processing document feedback:", error);
      res.status(500).json({ message: "Failed to process feedback" });
    }
  });
  
  app.get('/api/feedback/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await documentFeedbackService.getUserFeedbackHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching feedback history:", error);
      res.status(500).json({ message: "Failed to fetch feedback history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
