import {
  users,
  rfps,
  smartMatches,
  proposals,
  companyTemplates,
  memoryClauses,
  analyticsEvents,
  oauthTokens,
  emailMonitoring,
  clauseTemplates,
  smartMatchQueries,
  type User,
  type UpsertUser,
  type InsertRfp,
  type Rfp,
  type InsertSmartMatch,
  type SmartMatch,
  type InsertProposal,
  type Proposal,
  type InsertCompanyTemplate,
  type CompanyTemplate,
  type InsertMemoryClause,
  type MemoryClause,
  type InsertAnalyticsEvent,
  type AnalyticsEvent,
  type InsertOauthToken,
  type OauthToken,
  type InsertEmailMonitoring,
  type EmailMonitoring,
  type InsertClauseTemplate,
  type ClauseTemplate,
  type InsertSmartMatchQuery,
  type SmartMatchQuery,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserOnboarding(id: string, data: Partial<UpsertUser>): Promise<User>;
  
  // RFP operations
  createRfp(rfp: InsertRfp): Promise<Rfp>;
  getRfpsByUser(userId: string): Promise<Rfp[]>;
  getRfpById(id: number): Promise<Rfp | undefined>;
  updateRfp(id: number, data: Partial<InsertRfp>): Promise<Rfp>;
  
  // SmartMatch operations
  createSmartMatch(match: InsertSmartMatch): Promise<SmartMatch>;
  getSmartMatchByRfp(rfpId: number): Promise<SmartMatch | undefined>;
  
  // Proposal operations
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposalsByUser(userId: string): Promise<Proposal[]>;
  getProposalById(id: number): Promise<Proposal | undefined>;
  updateProposal(id: number, data: Partial<InsertProposal>): Promise<Proposal>;
  generateShareToken(proposalId: number): Promise<string>;
  getProposalByShareToken(token: string): Promise<Proposal | undefined>;
  
  // Template operations
  createCompanyTemplate(template: InsertCompanyTemplate): Promise<CompanyTemplate>;
  getTemplatesByUser(userId: string): Promise<CompanyTemplate[]>;
  
  // Memory clause operations
  createMemoryClause(clause: InsertMemoryClause): Promise<MemoryClause>;
  getMemoryClausesByUser(userId: string): Promise<MemoryClause[]>;
  getMemoryClausesByType(userId: string, type: string): Promise<MemoryClause[]>;
  searchMemoryClauses(userId: string, query: string): Promise<MemoryClause[]>;
  updateMemoryClauseUsage(id: number): Promise<void>;
  
  // Analytics operations
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEvents(userId: string, eventType?: string): Promise<AnalyticsEvent[]>;
  getAnalyticsSummary(userId: string): Promise<{
    totalProposals: number;
    winRate: number;
    avgScore: number;
    timeSaved: number;
  }>;
  
  // OAuth operations
  upsertOauthToken(token: InsertOauthToken): Promise<OauthToken>;
  getOauthToken(userId: string, provider: string): Promise<OauthToken | undefined>;
  refreshOauthToken(userId: string, provider: string, newTokens: Partial<InsertOauthToken>): Promise<OauthToken>;
  deleteOauthToken(userId: string, provider: string): Promise<void>;
  
  // Email monitoring operations
  createEmailMonitoring(monitoring: InsertEmailMonitoring): Promise<EmailMonitoring>;
  getEmailMonitoring(userId: string, provider?: string): Promise<EmailMonitoring[]>;
  markEmailProcessed(id: number): Promise<void>;
  
  // SmartMatch clause operations
  createClauseTemplate(template: InsertClauseTemplate): Promise<ClauseTemplate>;
  getClauseTemplates(userId: string): Promise<ClauseTemplate[]>;
  getClauseTemplateById(id: number): Promise<ClauseTemplate | undefined>;
  updateClauseTemplate(id: number, data: Partial<InsertClauseTemplate>): Promise<ClauseTemplate>;
  deleteClauseTemplate(id: number): Promise<void>;
  incrementClauseUsage(id: number): Promise<void>;
  
  // SmartMatch query operations
  createSmartMatchQuery(query: InsertSmartMatchQuery): Promise<SmartMatchQuery>;
  getSmartMatchQueries(userId: string): Promise<SmartMatchQuery[]>;
  getSmartMatchQueryById(id: number): Promise<SmartMatchQuery | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          industry: userData.industry,
          companySize: userData.companySize,
          servicesOffered: userData.servicesOffered,
          tonePreference: userData.tonePreference,
          isOnboardingComplete: userData.isOnboardingComplete,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserOnboarding(id: string, data: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // RFP operations
  async createRfp(rfp: InsertRfp): Promise<Rfp> {
    const [newRfp] = await db.insert(rfps).values(rfp).returning();
    return newRfp;
  }

  async getRfpsByUser(userId: string): Promise<Rfp[]> {
    return await db.select().from(rfps).where(eq(rfps.userId, userId)).orderBy(desc(rfps.createdAt));
  }

  async getRfpById(id: number): Promise<Rfp | undefined> {
    const [rfp] = await db.select().from(rfps).where(eq(rfps.id, id));
    return rfp;
  }

  async updateRfp(id: number, data: Partial<InsertRfp>): Promise<Rfp> {
    const [rfp] = await db
      .update(rfps)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rfps.id, id))
      .returning();
    return rfp;
  }

  // SmartMatch operations
  async createSmartMatch(match: InsertSmartMatch): Promise<SmartMatch> {
    const [smartMatch] = await db.insert(smartMatches).values(match).returning();
    return smartMatch;
  }

  async getSmartMatchByRfp(rfpId: number): Promise<SmartMatch | undefined> {
    const [match] = await db.select().from(smartMatches).where(eq(smartMatches.rfpId, rfpId));
    return match;
  }

  // Proposal operations
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [newProposal] = await db.insert(proposals).values(proposal).returning();
    return newProposal;
  }

  async getProposalsByUser(userId: string): Promise<Proposal[]> {
    return await db.select().from(proposals).where(eq(proposals.userId, userId)).orderBy(desc(proposals.createdAt));
  }

  async getProposalById(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  }

  async updateProposal(id: number, data: Partial<InsertProposal>): Promise<Proposal> {
    const [proposal] = await db
      .update(proposals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return proposal;
  }

  // Template operations
  async createCompanyTemplate(template: InsertCompanyTemplate): Promise<CompanyTemplate> {
    const [newTemplate] = await db.insert(companyTemplates).values(template).returning();
    return newTemplate;
  }

  async getTemplatesByUser(userId: string): Promise<CompanyTemplate[]> {
    return await db.select().from(companyTemplates).where(eq(companyTemplates.userId, userId));
  }

  async generateShareToken(proposalId: number): Promise<string> {
    const token = nanoid(32);
    await db.update(proposals)
      .set({ shareToken: token })
      .where(eq(proposals.id, proposalId));
    return token;
  }

  async getProposalByShareToken(token: string): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.shareToken, token));
    return proposal;
  }

  // Memory clause operations
  async createMemoryClause(clause: InsertMemoryClause): Promise<MemoryClause> {
    const [created] = await db.insert(memoryClauses).values(clause).returning();
    return created;
  }

  async getMemoryClausesByUser(userId: string): Promise<MemoryClause[]> {
    return await db.select().from(memoryClauses)
      .where(eq(memoryClauses.userId, userId))
      .orderBy(desc(memoryClauses.usageCount));
  }

  async getMemoryClausesByType(userId: string, type: string): Promise<MemoryClause[]> {
    return await db.select().from(memoryClauses)
      .where(and(eq(memoryClauses.userId, userId), eq(memoryClauses.type, type)))
      .orderBy(desc(memoryClauses.usageCount));
  }

  async searchMemoryClauses(userId: string, query: string): Promise<MemoryClause[]> {
    return await db.select().from(memoryClauses)
      .where(and(
        eq(memoryClauses.userId, userId),
        like(memoryClauses.content, `%${query}%`)
      ))
      .orderBy(desc(memoryClauses.usageCount));
  }

  async updateMemoryClauseUsage(id: number): Promise<void> {
    await db.update(memoryClauses)
      .set({ usageCount: sql`${memoryClauses.usageCount} + 1` })
      .where(eq(memoryClauses.id, id));
  }

  // Analytics operations
  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [created] = await db.insert(analyticsEvents).values(event).returning();
    return created;
  }

  async getAnalyticsEvents(userId: string, eventType?: string): Promise<AnalyticsEvent[]> {
    const conditions = [eq(analyticsEvents.userId, userId)];
    if (eventType) {
      conditions.push(eq(analyticsEvents.eventType, eventType));
    }
    return await db.select().from(analyticsEvents)
      .where(and(...conditions))
      .orderBy(desc(analyticsEvents.timestamp));
  }

  async getAnalyticsSummary(userId: string): Promise<{
    totalProposals: number;
    winRate: number;
    avgScore: number;
    timeSaved: number;
  }> {
    const [proposalCount] = await db.select({ count: count() })
      .from(proposals)
      .where(eq(proposals.userId, userId));

    const wonProposals = await db.select({ count: count() })
      .from(proposals)
      .where(and(eq(proposals.userId, userId), eq(proposals.status, "won")));

    const submittedProposals = await db.select({ count: count() })
      .from(proposals)
      .where(and(eq(proposals.userId, userId), eq(proposals.status, "submitted")));

    const matches = await db.select().from(smartMatches)
      .innerJoin(rfps, eq(smartMatches.rfpId, rfps.id))
      .where(eq(rfps.userId, userId));

    const avgScore = matches.length > 0 
      ? matches.reduce((sum, match) => sum + match.smart_matches.overallScore, 0) / matches.length 
      : 0;

    const totalSubmitted = submittedProposals[0].count + wonProposals[0].count;
    const winRate = totalSubmitted > 0 ? (wonProposals[0].count / totalSubmitted) * 100 : 0;
    
    // Estimate time saved: ~8 hours per proposal on average
    const timeSaved = proposalCount[0].count * 8;

    return {
      totalProposals: proposalCount[0].count,
      winRate: Math.round(winRate * 100) / 100,
      avgScore: Math.round(avgScore * 100) / 100,
      timeSaved,
    };
  }

  // OAuth operations
  async upsertOauthToken(token: InsertOauthToken): Promise<OauthToken> {
    const existing = await db
      .select()
      .from(oauthTokens)
      .where(and(eq(oauthTokens.userId, token.userId), eq(oauthTokens.provider, token.provider)))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(oauthTokens)
        .set({
          ...token,
          updatedAt: new Date()
        })
        .where(eq(oauthTokens.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(oauthTokens)
        .values(token)
        .returning();
      return created;
    }
  }

  async getOauthToken(userId: string, provider: string): Promise<OauthToken | undefined> {
    const [token] = await db
      .select()
      .from(oauthTokens)
      .where(and(eq(oauthTokens.userId, userId), eq(oauthTokens.provider, provider)))
      .limit(1);
    
    return token;
  }

  async refreshOauthToken(userId: string, provider: string, newTokens: Partial<InsertOauthToken>): Promise<OauthToken> {
    const [updated] = await db
      .update(oauthTokens)
      .set({
        ...newTokens,
        updatedAt: new Date()
      })
      .where(and(eq(oauthTokens.userId, userId), eq(oauthTokens.provider, provider)))
      .returning();
    
    return updated;
  }

  async deleteOauthToken(userId: string, provider: string): Promise<void> {
    await db
      .delete(oauthTokens)
      .where(and(eq(oauthTokens.userId, userId), eq(oauthTokens.provider, provider)));
  }

  // Email monitoring operations
  async createEmailMonitoring(monitoring: InsertEmailMonitoring): Promise<EmailMonitoring> {
    const [created] = await db
      .insert(emailMonitoring)
      .values(monitoring)
      .returning();
    
    return created;
  }

  async getEmailMonitoring(userId: string, provider?: string): Promise<EmailMonitoring[]> {
    const query = db
      .select()
      .from(emailMonitoring)
      .where(eq(emailMonitoring.userId, userId));

    if (provider) {
      query.where(and(eq(emailMonitoring.userId, userId), eq(emailMonitoring.provider, provider)));
    }

    return await query.orderBy(desc(emailMonitoring.createdAt));
  }

  async markEmailProcessed(id: number): Promise<void> {
    await db
      .update(emailMonitoring)
      .set({ processed: true })
      .where(eq(emailMonitoring.id, id));
  }

  // SmartMatch clause operations
  async createClauseTemplate(template: InsertClauseTemplate): Promise<ClauseTemplate> {
    const [created] = await db
      .insert(clauseTemplates)
      .values(template)
      .returning();
    return created;
  }

  async getClauseTemplates(userId: string): Promise<ClauseTemplate[]> {
    return await db
      .select()
      .from(clauseTemplates)
      .where(and(eq(clauseTemplates.userId, userId), eq(clauseTemplates.isActive, true)))
      .orderBy(desc(clauseTemplates.createdAt));
  }

  async getClauseTemplateById(id: number): Promise<ClauseTemplate | undefined> {
    const [template] = await db
      .select()
      .from(clauseTemplates)
      .where(eq(clauseTemplates.id, id));
    return template;
  }

  async updateClauseTemplate(id: number, data: Partial<InsertClauseTemplate>): Promise<ClauseTemplate> {
    const [updated] = await db
      .update(clauseTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clauseTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteClauseTemplate(id: number): Promise<void> {
    await db
      .update(clauseTemplates)
      .set({ isActive: false })
      .where(eq(clauseTemplates.id, id));
  }

  async incrementClauseUsage(id: number): Promise<void> {
    await db
      .update(clauseTemplates)
      .set({ usageCount: sql`${clauseTemplates.usageCount} + 1` })
      .where(eq(clauseTemplates.id, id));
  }

  // SmartMatch query operations
  async createSmartMatchQuery(query: InsertSmartMatchQuery): Promise<SmartMatchQuery> {
    const [created] = await db
      .insert(smartMatchQueries)
      .values(query)
      .returning();
    return created;
  }

  async getSmartMatchQueries(userId: string): Promise<SmartMatchQuery[]> {
    return await db
      .select()
      .from(smartMatchQueries)
      .where(eq(smartMatchQueries.userId, userId))
      .orderBy(desc(smartMatchQueries.createdAt));
  }

  async getSmartMatchQueryById(id: number): Promise<SmartMatchQuery | undefined> {
    const [query] = await db
      .select()
      .from(smartMatchQueries)
      .where(eq(smartMatchQueries.id, id));
    return query;
  }
}

export const storage = new DatabaseStorage();
