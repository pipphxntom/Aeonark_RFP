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
  status: varchar("status").default("draft"), // draft, review, final, exported
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  rfps: many(rfps),
  proposals: many(proposals),
  templates: many(companyTemplates),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRfpSchema = createInsertSchema(rfps).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSmartMatchSchema = createInsertSchema(smartMatches).omit({ id: true, createdAt: true });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanyTemplateSchema = createInsertSchema(companyTemplates).omit({ id: true, createdAt: true });

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
