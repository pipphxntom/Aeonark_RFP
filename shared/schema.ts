import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
// Sessions table managed by connect-pg-simple middleware
// Removed to prevent constraint conflicts with session store

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Onboarding fields
  industry: varchar("industry"),
  companySize: varchar("company_size"),
  servicesOffered: text("services_offered").array(),
  tonePreference: varchar("tone_preference"),
  isOnboardingComplete: boolean("is_onboarding_complete").default(false),
});

// RFP documents table
export const rfps = pgTable("rfps", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  extractedText: text("extracted_text"),
  deadline: timestamp("deadline"),
  status: varchar("status").default("uploaded"), // uploaded, analyzed, generated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SmartMatch analysis results with enhanced intelligence
export const smartMatches = pgTable("smart_matches", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").notNull().references(() => rfps.id),
  overallScore: integer("overall_score").notNull(),
  industryMatch: integer("industry_match").notNull(),
  servicesMatch: integer("services_match").notNull(),
  timelineMatch: integer("timeline_match").notNull(),
  certificationsMatch: integer("certifications_match").notNull(),
  technicalFit: integer("technical_fit").notNull().default(0),
  strategicAlignment: integer("strategic_alignment").notNull().default(0),
  recentRelevance: integer("recent_relevance").notNull().default(0),
  analysisDetails: jsonb("analysis_details"),
  vectorEmbedding: text("vector_embedding").array(),
  extractedMetadata: jsonb("extracted_metadata"),
  feedbackScore: integer("feedback_score").default(0),
  userFeedback: jsonb("user_feedback"),
  confidenceLevel: decimal("confidence_level", { precision: 3, scale: 2 }).default("0.5"),
  modelVersion: varchar("model_version").default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vector index for RFP embeddings
export const rfpVectorIndex = pgTable("rfp_vector_index", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").notNull().references(() => rfps.id),
  sectionType: varchar("section_type").notNull(), // scope, deadline, eligibility, evaluation
  content: text("content").notNull(),
  vectorEmbedding: text("vector_embedding").array(),
  metadata: jsonb("metadata"),
  industry: varchar("industry"),
  location: varchar("location"),
  budgetRange: varchar("budget_range"),
  keywords: text("keywords").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document classification and filtering
export const documentClassifications = pgTable("document_classifications", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").notNull().references(() => rfps.id),
  documentType: varchar("document_type").notNull(),
  isValidRFP: boolean("is_valid_rfp").notNull(),
  classification: jsonb("classification"),
  filterReason: text("filter_reason"),
  languagePatterns: text("language_patterns").array(),
  metadataTags: text("metadata_tags").array(),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// User feedback and learning system
export const smartmatchFeedback = pgTable("smartmatch_feedback", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  smartMatchId: integer("smart_match_id").notNull().references(() => smartMatches.id),
  feedbackType: varchar("feedback_type").notNull(), // upvote, downvote, rating
  rating: integer("rating"), // 1-5 star rating
  comments: text("comments"),
  improvedScore: integer("improved_score"),
  contextualData: jsonb("contextual_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Historical proposal memory bank
export const proposalMemoryBank = pgTable("proposal_memory_bank", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  proposalId: integer("proposal_id").references(() => proposals.id),
  rfpId: integer("rfp_id").references(() => rfps.id),
  outcome: varchar("outcome").notNull(), // won, lost, pending
  domain: varchar("domain").notNull(),
  industry: varchar("industry").notNull(),
  projectValue: decimal("project_value", { precision: 12, scale: 2 }),
  successFactors: text("success_factors").array(),
  templateContent: text("template_content"),
  vectorEmbedding: text("vector_embedding").array(),
  tags: text("tags").array(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Learning weights and model updates
export const smartmatchLearningWeights = pgTable("smartmatch_learning_weights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: varchar("category").notNull(), // industry, services, timeline, certifications
  weight: decimal("weight", { precision: 4, scale: 3 }).notNull().default("1.0"),
  adjustmentReason: text("adjustment_reason"),
  previousWeight: decimal("previous_weight", { precision: 4, scale: 3 }),
  feedbackCount: integer("feedback_count").default(0),
  lastAdjusted: timestamp("last_adjusted").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email ingestion tracking
export const emailIngestionLogs = pgTable("email_ingestion_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(), // gmail, outlook
  messageId: text("message_id").notNull(),
  subject: text("subject"),
  sender: text("sender"),
  attachmentCount: integer("attachment_count").default(0),
  documentsExtracted: integer("documents_extracted").default(0),
  classificationResults: jsonb("classification_results"),
  processedAt: timestamp("processed_at").defaultNow(),
});

// Industry-specific memory banks and training data
export const industryMemoryBanks = pgTable("industry_memory_banks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  industry: varchar("industry").notNull(),
  rfpText: text("rfp_text").notNull(),
  proposalText: text("proposal_text").notNull(),
  outcome: varchar("outcome").notNull(), // "won", "lost", "pending"
  winProbability: decimal("win_probability", { precision: 5, scale: 4 }),
  keyPhrases: text("key_phrases").array(),
  requiredCertifications: text("required_certifications").array(),
  projectValue: decimal("project_value", { precision: 12, scale: 2 }),
  timelineWeeks: integer("timeline_weeks"),
  competitorCount: integer("competitor_count"),
  clientSize: varchar("client_size"), // "enterprise", "mid-market", "small"
  embedding: text("embedding"), // Vector embedding for semantic similarity
  feedbackNotes: text("feedback_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Industry-specific scoring weights and models
export const industryModels = pgTable("industry_models", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  industry: varchar("industry").notNull(),
  modelVersion: varchar("model_version").notNull().default("1.0"),
  scoringWeights: jsonb("scoring_weights").notNull(), // Dynamic weights for different criteria
  trainingDataCount: integer("training_data_count").default(0),
  lastTrainingDate: timestamp("last_training_date"),
  performanceMetrics: jsonb("performance_metrics"), // Accuracy, precision, recall
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training logs and performance tracking
export const trainingLogs = pgTable("training_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  industry: varchar("industry").notNull(),
  modelId: integer("model_id").notNull().references(() => industryModels.id),
  trainingType: varchar("training_type").notNull(), // "initial", "incremental", "retrain"
  dataPointsUsed: integer("data_points_used"),
  trainingDuration: integer("training_duration_seconds"),
  beforeMetrics: jsonb("before_metrics"),
  afterMetrics: jsonb("after_metrics"),
  improvements: jsonb("improvements"),
  status: varchar("status").notNull().default("completed"), // "running", "completed", "failed"
  errorLogs: text("error_logs"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced smart matches with industry-specific insights
export const enhancedSmartMatches = pgTable("enhanced_smart_matches", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").notNull().references(() => rfps.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  industry: varchar("industry").notNull(),
  modelVersion: varchar("model_version").notNull(),
  overallScore: integer("overall_score").notNull(),
  industrySpecificScores: jsonb("industry_specific_scores").notNull(),
  similarHistoricalRfps: jsonb("similar_historical_rfps"), // Array of similar RFP IDs with similarity scores
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 4 }),
  riskFactors: jsonb("risk_factors"),
  successPredictors: jsonb("success_predictors"),
  recommendedStrategy: jsonb("recommended_strategy"),
  competitiveAnalysis: jsonb("competitive_analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feature extraction and preprocessing results
export const extractedFeatures = pgTable("extracted_features", {
  id: serial("id").primaryKey(),
  memoryBankId: integer("memory_bank_id").notNull().references(() => industryMemoryBanks.id),
  featureType: varchar("feature_type").notNull(), // "key_phrase", "certification", "requirement"
  featureValue: text("feature_value").notNull(),
  importance: decimal("importance", { precision: 5, scale: 4 }),
  frequency: integer("frequency").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clause templates for SmartMatch
export const clauseTemplates = pgTable("clause_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: varchar("category"), // security, compliance, pricing, etc.
  tags: text("tags").array(),
  embedding: text("embedding"), // JSON string of vector embedding
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SmartMatch query results
export const smartMatchQueries = pgTable("smart_match_queries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  queryText: text("query_text").notNull(),
  queryType: varchar("query_type").notNull(), // text, pdf
  modelUsed: varchar("model_used").notNull(), // openai, claude, gemini, deepseek
  embedding: text("embedding"), // JSON string of query embedding
  results: jsonb("results"), // matched clauses with scores
  createdAt: timestamp("created_at").defaultNow(),
});

// Generated proposals
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").notNull().references(() => rfps.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  executiveSummary: text("executive_summary"),
  scopeOfWork: text("scope_of_work"),
  pricing: jsonb("pricing"),
  timeline: text("timeline"),
  legalTerms: text("legal_terms"),
  status: varchar("status").default("draft"), // draft, review, final, exported, submitted, won, rejected
  sections: jsonb("sections"), // Section editing status and metadata
  shareToken: varchar("share_token"), // For secure sharing
  lastEditedBy: varchar("last_edited_by"),
  exportFormat: varchar("export_format"), // pdf, docx
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company templates
export const companyTemplates = pgTable("company_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  templateContent: text("template_content").notNull(),
  placeholders: text("placeholders").array(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Memory engine clauses for reuse
export const memoryClauses = pgTable("memory_clauses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  proposalId: integer("proposal_id").references(() => proposals.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type").notNull(), // legal_clause, scope_item, pricing_item, etc
  tags: text("tags").array(),
  projectContext: text("project_context"),
  tone: varchar("tone"), // formal, casual, technical
  winRate: integer("win_rate").default(0), // Success rate when this clause was used
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics tracking
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  proposalId: integer("proposal_id").references(() => proposals.id),
  eventType: varchar("event_type").notNull(), // upload, draft_generated, edited, exported, submitted, won, rejected
  eventData: jsonb("event_data"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// OAuth tokens for external integrations
export const oauthTokens = pgTable("oauth_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(), // "gmail", "slack", "outlook"
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  tokenData: jsonb("token_data"), // Additional provider-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email monitoring for RFP detection
export const emailMonitoring = pgTable("email_monitoring", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(),
  messageId: varchar("message_id").notNull(),
  subject: text("subject"),
  sender: text("sender"),
  attachmentCount: integer("attachment_count").default(0),
  isRfp: boolean("is_rfp").default(false),
  matchScore: integer("match_score"),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  rfps: many(rfps),
  proposals: many(proposals),
  templates: many(companyTemplates),
  memoryClauses: many(memoryClauses),
  analyticsEvents: many(analyticsEvents),
  oauthTokens: many(oauthTokens),
  emailMonitoring: many(emailMonitoring),
  clauseTemplates: many(clauseTemplates),
  smartMatchQueries: many(smartMatchQueries),
  industryMemoryBanks: many(industryMemoryBanks),
  industryModels: many(industryModels),
  trainingLogs: many(trainingLogs),
  enhancedSmartMatches: many(enhancedSmartMatches),
}));

export const rfpsRelations = relations(rfps, ({ one, many }) => ({
  user: one(users, {
    fields: [rfps.userId],
    references: [users.id],
  }),
  smartMatch: one(smartMatches),
  proposals: many(proposals),
}));

export const smartMatchesRelations = relations(smartMatches, ({ one }) => ({
  rfp: one(rfps, {
    fields: [smartMatches.rfpId],
    references: [rfps.id],
  }),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  rfp: one(rfps, {
    fields: [proposals.rfpId],
    references: [rfps.id],
  }),
  user: one(users, {
    fields: [proposals.userId],
    references: [users.id],
  }),
}));

export const companyTemplatesRelations = relations(companyTemplates, ({ one }) => ({
  user: one(users, {
    fields: [companyTemplates.userId],
    references: [users.id],
  }),
}));

export const memoryClausesRelations = relations(memoryClauses, ({ one }) => ({
  user: one(users, {
    fields: [memoryClauses.userId],
    references: [users.id],
  }),
  proposal: one(proposals, {
    fields: [memoryClauses.proposalId],
    references: [proposals.id],
  }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
  proposal: one(proposals, {
    fields: [analyticsEvents.proposalId],
    references: [proposals.id],
  }),
}));

export const oauthTokensRelations = relations(oauthTokens, ({ one }) => ({
  user: one(users, {
    fields: [oauthTokens.userId],
    references: [users.id],
  }),
}));

export const emailMonitoringRelations = relations(emailMonitoring, ({ one }) => ({
  user: one(users, {
    fields: [emailMonitoring.userId],
    references: [users.id],
  }),
}));

export const clauseTemplatesRelations = relations(clauseTemplates, ({ one }) => ({
  user: one(users, {
    fields: [clauseTemplates.userId],
    references: [users.id],
  }),
}));

export const smartMatchQueriesRelations = relations(smartMatchQueries, ({ one }) => ({
  user: one(users, {
    fields: [smartMatchQueries.userId],
    references: [users.id],
  }),
}));

export const industryMemoryBanksRelations = relations(industryMemoryBanks, ({ one, many }) => ({
  user: one(users, { fields: [industryMemoryBanks.userId], references: [users.id] }),
  extractedFeatures: many(extractedFeatures),
}));

export const industryModelsRelations = relations(industryModels, ({ one, many }) => ({
  user: one(users, { fields: [industryModels.userId], references: [users.id] }),
  trainingLogs: many(trainingLogs),
  enhancedSmartMatches: many(enhancedSmartMatches),
}));

export const trainingLogsRelations = relations(trainingLogs, ({ one }) => ({
  user: one(users, { fields: [trainingLogs.userId], references: [users.id] }),
  model: one(industryModels, { fields: [trainingLogs.modelId], references: [industryModels.id] }),
}));

export const enhancedSmartMatchesRelations = relations(enhancedSmartMatches, ({ one }) => ({
  rfp: one(rfps, { fields: [enhancedSmartMatches.rfpId], references: [rfps.id] }),
  user: one(users, { fields: [enhancedSmartMatches.userId], references: [users.id] }),
}));

export const extractedFeaturesRelations = relations(extractedFeatures, ({ one }) => ({
  memoryBank: one(industryMemoryBanks, { fields: [extractedFeatures.memoryBankId], references: [industryMemoryBanks.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRfpSchema = createInsertSchema(rfps).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSmartMatchSchema = createInsertSchema(smartMatches).omit({ id: true, createdAt: true });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanyTemplateSchema = createInsertSchema(companyTemplates).omit({ id: true, createdAt: true });
export const insertMemoryClauseSchema = createInsertSchema(memoryClauses).omit({ id: true, createdAt: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, timestamp: true });
export const insertOauthTokenSchema = createInsertSchema(oauthTokens).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailMonitoringSchema = createInsertSchema(emailMonitoring).omit({ id: true, createdAt: true });
export const insertClauseTemplateSchema = createInsertSchema(clauseTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSmartMatchQuerySchema = createInsertSchema(smartMatchQueries).omit({ id: true, createdAt: true });
export const insertIndustryMemoryBankSchema = createInsertSchema(industryMemoryBanks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIndustryModelSchema = createInsertSchema(industryModels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingLogSchema = createInsertSchema(trainingLogs).omit({ id: true, createdAt: true });
export const insertEnhancedSmartMatchSchema = createInsertSchema(enhancedSmartMatches).omit({ id: true, createdAt: true });
export const insertExtractedFeatureSchema = createInsertSchema(extractedFeatures).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRfp = z.infer<typeof insertRfpSchema>;
export type Rfp = typeof rfps.$inferSelect;
export type InsertSmartMatch = z.infer<typeof insertSmartMatchSchema>;
export type SmartMatch = typeof smartMatches.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;
export type InsertCompanyTemplate = z.infer<typeof insertCompanyTemplateSchema>;
export type CompanyTemplate = typeof companyTemplates.$inferSelect;
export type InsertMemoryClause = z.infer<typeof insertMemoryClauseSchema>;
export type MemoryClause = typeof memoryClauses.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertOauthToken = z.infer<typeof insertOauthTokenSchema>;
export type OauthToken = typeof oauthTokens.$inferSelect;
export type InsertEmailMonitoring = z.infer<typeof insertEmailMonitoringSchema>;
export type EmailMonitoring = typeof emailMonitoring.$inferSelect;
export type InsertClauseTemplate = z.infer<typeof insertClauseTemplateSchema>;
export type ClauseTemplate = typeof clauseTemplates.$inferSelect;
export type InsertSmartMatchQuery = z.infer<typeof insertSmartMatchQuerySchema>;
export type SmartMatchQuery = typeof smartMatchQueries.$inferSelect;
export type InsertIndustryMemoryBank = z.infer<typeof insertIndustryMemoryBankSchema>;
export type IndustryMemoryBank = typeof industryMemoryBanks.$inferSelect;
export type InsertIndustryModel = z.infer<typeof insertIndustryModelSchema>;
export type IndustryModel = typeof industryModels.$inferSelect;
export type InsertTrainingLog = z.infer<typeof insertTrainingLogSchema>;
export type TrainingLog = typeof trainingLogs.$inferSelect;
export type InsertEnhancedSmartMatch = z.infer<typeof insertEnhancedSmartMatchSchema>;
export type EnhancedSmartMatch = typeof enhancedSmartMatches.$inferSelect;
export type InsertExtractedFeature = z.infer<typeof insertExtractedFeatureSchema>;
export type ExtractedFeature = typeof extractedFeatures.$inferSelect;
