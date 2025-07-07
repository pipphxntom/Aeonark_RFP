import {
  users,
  rfps,
  smartMatches,
  proposals,
  companyTemplates,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
  
  // Template operations
  createCompanyTemplate(template: InsertCompanyTemplate): Promise<CompanyTemplate>;
  getTemplatesByUser(userId: string): Promise<CompanyTemplate[]>;
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
}

export const storage = new DatabaseStorage();
