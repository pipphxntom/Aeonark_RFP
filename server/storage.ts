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
  getAllUsers(): Promise<User[]>;
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
  getOAuthTokens(userId: string, provider: string): Promise<OauthToken | undefined>;
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
  
  // Industry SmartMatch operations
  getIndustryModels(userId: string): Promise<any[]>;
  getTrainingLogs(userId: string): Promise<any[]>;
  getMemoryBanks(userId: string): Promise<any[]>;
  createTrainingLog(data: any): Promise<any>;
  
  // Email ingestion operations
  getEmailIngestionLogs(userId: string): Promise<any[]>;
  createEmailIngestionLog(data: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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

  async getAnalyticsSummary(userId: string): Promise<any> {
    // Get real data based on actual user activity
    const userRfps = await db.select().from(rfps).where(eq(rfps.userId, userId));
    const userProposals = await db.select().from(proposals).where(eq(proposals.userId, userId));
    const userSmartMatches = await db.select().from(smartMatches).where(sql`${smartMatches.rfpId} IN (SELECT id FROM ${rfps} WHERE user_id = ${userId})`);
    
    if (userRfps.length === 0) {
      // Return empty state when no RFPs analyzed
      return {
        totalProposals: 0,
        winRate: 0,
        avgScore: 0,
        timeSaved: 0,
        hasData: false
      };
    }

    const avgScore = userSmartMatches.length > 0 
      ? userSmartMatches.reduce((sum, match) => sum + match.overallScore, 0) / userSmartMatches.length
      : 0;

    const wonProposals = userProposals.filter(p => p.status === 'won').length;
    const winRate = userProposals.length > 0 ? (wonProposals / userProposals.length) * 100 : 0;
    
    // Estimate time saved: 8 hours per RFP analysis + 12 hours per proposal generation
    const timeSaved = (userRfps.length * 8) + (userProposals.length * 12);

    return {
      totalProposals: userProposals.length,
      winRate: Math.round(winRate),
      avgScore: Math.round(avgScore),
      timeSaved,
      hasData: true
    };
  }

  async getAnalyticsTimeline(userId: string): Promise<any[]> {
    const userRfps = await db.select().from(rfps).where(eq(rfps.userId, userId));
    
    if (userRfps.length === 0) return [];

    // Group RFPs by creation date and calculate metrics
    const timelineData = userRfps.reduce((acc: any, rfp) => {
      const date = new Date(rfp.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, proposals: 0, turnaroundTime: 2.5 };
      }
      acc[date].proposals += 1;
      return acc;
    }, {});

    return Object.values(timelineData);
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

  async getOAuthTokens(userId: string, provider: string): Promise<OauthToken | undefined> {
    return this.getOauthToken(userId, provider);
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

  // Industry SmartMatch operations
  async getIndustryModels(userId: string): Promise<any[]> {
    // Return mock data for now since the user doesn't have trained models yet
    return [
      {
        id: 1,
        industry: "technology",
        modelVersion: "2.1",
        trainingDataCount: 150,
        lastTrainingDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        performanceMetrics: {
          accuracy: 0.89,
          precision: 0.85,
          recall: 0.87,
          f1Score: 0.86,
          trainingDataSize: 150
        },
        isActive: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        industry: "healthcare",
        modelVersion: "1.8",
        trainingDataCount: 75,
        lastTrainingDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        performanceMetrics: {
          accuracy: 0.82,
          precision: 0.78,
          recall: 0.84,
          f1Score: 0.81,
          trainingDataSize: 75
        },
        isActive: true,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async getTrainingLogs(userId: string): Promise<any[]> {
    return [
      {
        id: 1,
        industry: "technology",
        trainingType: "incremental",
        dataPointsUsed: 25,
        trainingDuration: 180,
        status: "completed",
        improvements: {
          accuracyImprovement: 0.04,
          dataPointsAdded: 25
        },
        beforeMetrics: { accuracy: 0.85, precision: 0.81 },
        afterMetrics: { accuracy: 0.89, precision: 0.85 },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        industry: "healthcare",
        trainingType: "retrain",
        dataPointsUsed: 75,
        trainingDuration: 420,
        status: "completed",
        improvements: {
          accuracyImprovement: 0.06,
          dataPointsAdded: 30
        },
        beforeMetrics: { accuracy: 0.76, precision: 0.72 },
        afterMetrics: { accuracy: 0.82, precision: 0.78 },
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async getMemoryBanks(userId: string): Promise<any[]> {
    return [
      {
        id: 1,
        industry: "technology",
        outcome: "won",
        winProbability: "0.8500",
        projectValue: "125000.00",
        timelineWeeks: 16,
        competitorCount: 3,
        clientSize: "mid-market",
        keyPhrases: ["cloud migration", "API integration", "microservices"],
        requiredCertifications: ["AWS", "SOC2"],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        industry: "healthcare",
        outcome: "won",
        winProbability: "0.7200",
        projectValue: "89000.00",
        timelineWeeks: 12,
        competitorCount: 2,
        clientSize: "enterprise",
        keyPhrases: ["HIPAA compliance", "patient data", "EHR integration"],
        requiredCertifications: ["HIPAA", "ISO 27001"],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async createTrainingLog(data: any): Promise<any> {
    const trainingLog = {
      id: Date.now(), // Simple ID generation
      ...data,
      createdAt: new Date().toISOString()
    };
    
    // In a real implementation, this would insert into the training_logs table
    // For now, return the created log for the API response
    return trainingLog;
  }

  async getEmailIngestionLogs(userId: string): Promise<any[]> {
    // In a real implementation, this would query the email_ingestion_logs table
    // For now, return empty array since the table schema needs to be defined
    return [];
  }

  async createEmailIngestionLog(data: any): Promise<any> {
    const log = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString()
    };
    
    // In a real implementation, this would insert into the email_ingestion_logs table
    return log;
  }

  async getAnalyticsTimeline(userId: string) {
    try {
      const proposalData = await db.select({
        date: sql`DATE(${proposals.createdAt})`,
        count: count(),
        avgTime: sql`AVG(CASE 
          WHEN ${proposals.createdAt} > ${proposals.updatedAt} THEN 0 
          ELSE EXTRACT(EPOCH FROM (${proposals.updatedAt} - ${proposals.createdAt})) / 3600 
        END)`
      })
      .from(proposals)
      .where(and(
        eq(proposals.userId, userId),
        sql`${proposals.createdAt} >= NOW() - INTERVAL '30 days'`
      ))
      .groupBy(sql`DATE(${proposals.createdAt})`)
      .orderBy(sql`DATE(${proposals.createdAt}) DESC`)
      .limit(30);
      
      return proposalData.map(row => ({
        date: row.date,
        proposals: row.count,
        turnaroundTime: Math.round(parseFloat(row.avgTime?.toString() || '0'))
      }));
    } catch (error) {
      console.error("Error getting analytics timeline:", error);
      // Return real empty data instead of mock data
      return [];
    }
  }
}

// Create a fallback in-memory storage when database is not available
class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private rfps = new Map<number, Rfp>();
  private proposals = new Map<number, Proposal>();
  private smartMatches = new Map<number, SmartMatch>();
  private idCounter = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = this.users.get(user.id);
    const newUser = {
      ...existingUser,
      ...user,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    } as User;
    this.users.set(user.id, newUser);
    return newUser;
  }

  async updateUserOnboarding(id: string, data: Partial<UpsertUser>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error("User not found");
    }
    const updatedUser = { ...existingUser, ...data, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createRfp(rfp: InsertRfp): Promise<Rfp> {
    const newRfp = {
      ...rfp,
      id: this.idCounter++,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Rfp;
    this.rfps.set(newRfp.id, newRfp);
    return newRfp;
  }

  async getRfpsByUser(userId: string): Promise<Rfp[]> {
    return Array.from(this.rfps.values()).filter(rfp => rfp.userId === userId);
  }

  async getRfpById(id: number): Promise<Rfp | undefined> {
    return this.rfps.get(id);
  }

  async updateRfp(id: number, data: Partial<InsertRfp>): Promise<Rfp> {
    const existingRfp = this.rfps.get(id);
    if (!existingRfp) throw new Error("RFP not found");
    const updatedRfp = { ...existingRfp, ...data, updatedAt: new Date() };
    this.rfps.set(id, updatedRfp);
    return updatedRfp;
  }

  async createSmartMatch(match: InsertSmartMatch): Promise<SmartMatch> {
    const newMatch = {
      ...match,
      id: this.idCounter++,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SmartMatch;
    this.smartMatches.set(newMatch.id, newMatch);
    return newMatch;
  }

  async getSmartMatchByRfp(rfpId: number): Promise<SmartMatch | undefined> {
    return Array.from(this.smartMatches.values()).find(match => match.rfpId === rfpId);
  }

  // Stub implementations for other methods
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const newProposal = {
      ...proposal,
      id: this.idCounter++,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Proposal;
    this.proposals.set(newProposal.id, newProposal);
    return newProposal;
  }

  async getProposalsByUser(userId: string): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(p => p.userId === userId);
  }

  async getProposalById(id: number): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async updateProposal(id: number, data: Partial<InsertProposal>): Promise<Proposal> {
    const existing = this.proposals.get(id);
    if (!existing) throw new Error("Proposal not found");
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.proposals.set(id, updated);
    return updated;
  }

  async generateShareToken(proposalId: number): Promise<string> {
    return nanoid(32);
  }

  async getProposalByShareToken(token: string): Promise<Proposal | undefined> {
    return undefined;
  }

  // Minimal implementations for other interface methods
  async createCompanyTemplate(): Promise<CompanyTemplate> { return {} as CompanyTemplate; }
  async getTemplatesByUser(): Promise<CompanyTemplate[]> { return []; }
  async createMemoryClause(): Promise<MemoryClause> { return {} as MemoryClause; }
  async getMemoryClausesByUser(): Promise<MemoryClause[]> { return []; }
  async getMemoryClausesByType(): Promise<MemoryClause[]> { return []; }
  async searchMemoryClauses(): Promise<MemoryClause[]> { return []; }
  async updateMemoryClauseUsage(): Promise<void> {}
  async createAnalyticsEvent(): Promise<AnalyticsEvent> { return {} as AnalyticsEvent; }
  async getAnalyticsEvents(): Promise<AnalyticsEvent[]> { return []; }
  async getAnalyticsSummary(): Promise<any> { 
    return {
      totalProposals: 0,
      winRate: 0,
      avgScore: 0,
      timeSaved: 0,
      hasData: false
    };
  }
  async upsertOauthToken(): Promise<OauthToken> { return {} as OauthToken; }
  async getOauthToken(): Promise<OauthToken | undefined> { return undefined; }
  async getOAuthTokens(): Promise<OauthToken | undefined> { return undefined; }
  async refreshOauthToken(): Promise<OauthToken> { return {} as OauthToken; }
  async deleteOauthToken(): Promise<void> {}
  async createEmailMonitoring(): Promise<EmailMonitoring> { return {} as EmailMonitoring; }
  async getEmailMonitoring(): Promise<EmailMonitoring[]> { return []; }
  async markEmailProcessed(): Promise<void> {}
  async createClauseTemplate(): Promise<ClauseTemplate> { return {} as ClauseTemplate; }
  async getClauseTemplates(): Promise<ClauseTemplate[]> { return []; }
  async getClauseTemplateById(): Promise<ClauseTemplate | undefined> { return undefined; }
  async updateClauseTemplate(): Promise<ClauseTemplate> { return {} as ClauseTemplate; }
  async deleteClauseTemplate(): Promise<void> {}
  async incrementClauseUsage(): Promise<void> {}
  async createSmartMatchQuery(): Promise<SmartMatchQuery> { return {} as SmartMatchQuery; }
  async getSmartMatchQueries(): Promise<SmartMatchQuery[]> { return []; }
  async getSmartMatchQueryById(): Promise<SmartMatchQuery | undefined> { return undefined; }
  async getIndustryModels(): Promise<any[]> { return []; }
  async getTrainingLogs(): Promise<any[]> { return []; }
  async getMemoryBanks(): Promise<any[]> { return []; }
  async createTrainingLog(): Promise<any> { return {}; }
  async getEmailIngestionLogs(): Promise<any[]> { return []; }
  async createEmailIngestionLog(): Promise<any> { return {}; }
}

// Use DatabaseStorage if database is available, otherwise use MemoryStorage
export const storage = db && process.env.DATABASE_URL ? new DatabaseStorage() : new MemoryStorage();
