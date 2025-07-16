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
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

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

// SmartMatch analysis results
export const smartMatches = pgTable("smart_matches", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").notNull().references(() => rfps.id),
  overallScore: integer("overall_score").notNull(),
  industryMatch: integer("industry_match").notNull(),
  servicesMatch: integer("services_match").notNull(),
  timelineMatch: integer("timeline_match").notNull(),
  certificationsMatch: integer("certifications_match").notNull(),
  analysisDetails: jsonb("analysis_details"),
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
