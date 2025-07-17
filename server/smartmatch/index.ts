/**
 * SmartMatch Engine - Main Interface
 * Handles AI-powered clause matching with embeddings and similarity analysis
 */

import { storage } from '../storage';
import { GeminiService } from './gemini';
import { ClauseService } from './clause';
import type { InsertSmartMatchQuery, InsertClauseTemplate } from '@shared/schema';

export interface SmartMatchRequest {
  query: string;
  userId: string;
  queryType: 'text' | 'pdf';
  model: 'gemini' | 'openai' | 'claude' | 'deepseek';
  limit?: number;
}

export interface ClauseMatch {
  id: number;
  title: string;
  body: string;
  category: string;
  tags: string[];
  similarityScore: number;
  explanation: string;
  usageCount: number;
  confidence: number;
}

export interface SmartMatchResponse {
  matches: ClauseMatch[];
  queryId: number;
  processingTime: number;
  model: string;
  insights: string;
  totalClauses: number;
}

export class SmartMatch {
  private geminiService: GeminiService;
  private clauseService: ClauseService;

  constructor() {
    this.geminiService = new GeminiService();
    this.clauseService = new ClauseService();
  }

  /**
   * Main SmartMatch function - processes query and returns ranked matches
   */
  async match(request: SmartMatchRequest): Promise<SmartMatchResponse> {
    const startTime = Date.now();
    
    try {
      // Store the query
      const queryRecord = await storage.createSmartMatchQuery({
        userId: request.userId,
        queryText: request.query,
        queryType: request.queryType,
        model: request.model,
        embedding: [] // Will be populated after processing
      });

      // Get all clause templates for the user
      const clauses = await storage.getClauseTemplates(request.userId);
      
      if (clauses.length === 0) {
        // Auto-create sample clauses if none exist
        await this.clauseService.createSampleClauses(request.userId);
        const newClauses = await storage.getClauseTemplates(request.userId);
        
        if (newClauses.length === 0) {
          throw new Error('No clause templates available for matching');
        }
        
        clauses.push(...newClauses);
      }

      // Analyze each clause for similarity
      const matches: ClauseMatch[] = [];
      
      for (const clause of clauses) {
        try {
          const analysis = await this.geminiService.analyzeSimilarity(
            request.query,
            clause.title,
            clause.body
          );

          matches.push({
            id: clause.id,
            title: clause.title,
            body: clause.body,
            category: clause.category,
            tags: clause.tags || [],
            similarityScore: analysis.score,
            explanation: analysis.explanation,
            usageCount: clause.usageCount,
            confidence: analysis.confidence
          });
        } catch (error) {
          console.error(`Error analyzing clause ${clause.id}:`, error);
          // Continue with other clauses
        }
      }

      // Sort by similarity score (descending)
      matches.sort((a, b) => b.similarityScore - a.similarityScore);

      // Limit results
      const limit = request.limit || 5;
      const topMatches = matches.slice(0, limit);

      // Generate insights
      const insights = await this.geminiService.generateInsights(request.query, topMatches);

      // Update usage count for selected clauses
      for (const match of topMatches.slice(0, 3)) { // Top 3 matches
        await storage.incrementClauseUsage(match.id);
      }

      const processingTime = Date.now() - startTime;

      return {
        matches: topMatches,
        queryId: queryRecord.id,
        processingTime,
        model: request.model,
        insights,
        totalClauses: clauses.length
      };

    } catch (error) {
      console.error('SmartMatch error:', error);
      throw new Error(`SmartMatch processing failed: ${error.message}`);
    }
  }

  /**
   * Add a new clause template
   */
  async addClauseTemplate(
    userId: string,
    title: string,
    body: string,
    category: string,
    tags: string[]
  ): Promise<void> {
    // Generate embedding for the clause
    const embedding = await this.geminiService.generateEmbedding(body);

    await storage.createClauseTemplate({
      userId,
      title,
      body,
      category,
      tags,
      embedding: embedding.embedding,
      tokens: embedding.tokens,
      isActive: true,
      usageCount: 0
    });
  }

  /**
   * Get all clause templates for a user
   */
  async getClauseTemplates(userId: string) {
    return await storage.getClauseTemplates(userId);
  }

  /**
   * Update a clause template
   */
  async updateClauseTemplate(
    id: number,
    title: string,
    body: string,
    category: string,
    tags: string[]
  ): Promise<void> {
    // Regenerate embedding for updated content
    const embedding = await this.geminiService.generateEmbedding(body);

    await storage.updateClauseTemplate(id, {
      title,
      body,
      category,
      tags,
      embedding: embedding.embedding,
      tokens: embedding.tokens,
      updatedAt: new Date()
    });
  }

  /**
   * Delete a clause template (mark as inactive)
   */
  async deleteClauseTemplate(id: number): Promise<void> {
    await storage.deleteClauseTemplate(id);
  }

  /**
   * Get query history for a user
   */
  async getQueryHistory(userId: string) {
    return await storage.getSmartMatchQueries(userId);
  }
}