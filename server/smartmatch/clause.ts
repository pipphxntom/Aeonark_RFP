/**
 * SmartMatch Clause Service - Handle clause template operations
 */

import { storage } from '../storage';
import { VectorService } from './vector';
import { ModelProvider } from './models';
import type { EmbeddingVector, VectorSearchResult } from './types';
import type { InsertClauseTemplate } from '@shared/schema';

export class ClauseService {
  private vectorService: VectorService;

  constructor() {
    this.vectorService = new VectorService();
  }

  /**
   * Create a new clause template with embedding
   */
  async createClauseTemplate(
    userId: string, 
    title: string, 
    body: string, 
    category?: string, 
    tags?: string[]
  ): Promise<void> {
    try {
      // Generate embedding for the clause
      const modelProvider = new ModelProvider('openai');
      const embedding = await this.vectorService.getEmbedding(
        `${title} ${body}`, 
        modelProvider
      );

      // Create clause template
      const clauseData: InsertClauseTemplate = {
        userId,
        title,
        body,
        category: category || 'general',
        tags: tags || [],
        embedding: JSON.stringify(embedding.values),
        usageCount: 0,
        isActive: true
      };

      await storage.createClauseTemplate(clauseData);
    } catch (error) {
      throw new Error(`Failed to create clause template: ${error.message}`);
    }
  }

  /**
   * Find similar clauses based on query embedding
   */
  async findSimilarClauses(
    userId: string, 
    queryEmbedding: EmbeddingVector, 
    limit: number = 5
  ): Promise<any[]> {
    try {
      // Get all clause templates for the user
      const allClauses = await storage.getClauseTemplates(userId);
      
      if (allClauses.length === 0) {
        return [];
      }

      // Prepare candidate vectors
      const candidateVectors = allClauses
        .filter(clause => clause.isActive && clause.embedding)
        .map(clause => ({
          id: clause.id,
          embedding: this.vectorService.parseEmbedding(clause.embedding),
          metadata: {
            title: clause.title,
            body: clause.body,
            category: clause.category,
            tags: clause.tags,
            usage_count: clause.usageCount
          }
        }));

      // Find most similar clauses
      const similarResults = this.vectorService.findSimilarVectors(
        queryEmbedding.values,
        candidateVectors,
        limit
      );

      // Convert results to clause format
      return similarResults.map(result => ({
        id: result.id,
        title: result.metadata.title,
        body: result.metadata.body,
        category: result.metadata.category,
        tags: result.metadata.tags,
        usage_count: result.metadata.usage_count,
        similarity_score: Math.round(result.score * 100) / 100 // Round to 2 decimal places
      }));
    } catch (error) {
      throw new Error(`Failed to find similar clauses: ${error.message}`);
    }
  }

  /**
   * Get all clause templates for a user
   */
  async getClauseTemplates(userId: string): Promise<any[]> {
    try {
      return await storage.getClauseTemplates(userId);
    } catch (error) {
      throw new Error(`Failed to get clause templates: ${error.message}`);
    }
  }

  /**
   * Update clause usage count
   */
  async incrementUsageCount(clauseId: number): Promise<void> {
    try {
      await storage.incrementClauseUsage(clauseId);
    } catch (error) {
      throw new Error(`Failed to update clause usage: ${error.message}`);
    }
  }

  /**
   * Create sample clause templates for testing
   */
  async createSampleClauses(userId: string): Promise<void> {
    const sampleClauses = [
      {
        title: "ISO27001 Compliance Statement",
        body: "Yes, we are ISO27001 certified. Our company maintains comprehensive information security management systems in accordance with ISO/IEC 27001:2013 standards. This certification demonstrates our commitment to protecting sensitive information and maintaining the highest security standards.",
        category: "compliance",
        tags: ["security", "certification", "ISO27001", "compliance"]
      },
      {
        title: "Data Protection and Privacy Policy",
        body: "We adhere to strict data protection regulations including GDPR and CCPA. All personal data is processed lawfully, fairly, and transparently. We implement appropriate technical and organizational measures to ensure data security and privacy.",
        category: "security",
        tags: ["privacy", "GDPR", "CCPA", "data protection"]
      },
      {
        title: "Project Timeline and Milestones",
        body: "Our standard project delivery timeline is 8-12 weeks from project initiation. We provide detailed milestone schedules with regular progress updates and maintain flexibility to accommodate client requirements.",
        category: "timeline",
        tags: ["project management", "timeline", "milestones", "delivery"]
      },
      {
        title: "Technical Architecture and Stack",
        body: "We utilize modern cloud-native technologies including React, Node.js, and PostgreSQL. Our architecture follows microservices patterns with container orchestration for scalability and reliability.",
        category: "technical",
        tags: ["architecture", "cloud", "scalability", "modern stack"]
      },
      {
        title: "Pricing and Cost Structure",
        body: "Our pricing model is based on project scope and complexity. We provide transparent fixed-price quotes with no hidden fees. Additional features and scope changes are handled through formal change requests.",
        category: "pricing",
        tags: ["pricing", "cost", "fixed-price", "transparent"]
      }
    ];

    for (const clause of sampleClauses) {
      await this.createClauseTemplate(
        userId,
        clause.title,
        clause.body,
        clause.category,
        clause.tags
      );
    }
  }
}