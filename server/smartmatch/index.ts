/**
 * SmartMatch Engine - Main Interface
 * Handles AI-powered clause matching with embeddings and similarity analysis
 */

import { storage } from '../storage';
import { GeminiService } from './gemini';
import { ClauseService } from './clause';
import { VectorDatabase } from './vectorDatabase';
import { DocumentClassifier } from './documentClassifier';
import { FeedbackEngine } from './feedbackEngine';
import { EmailIngestionService } from './emailIngestion';
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
  private vectorDB: VectorDatabase;
  private classifier: DocumentClassifier;
  private feedbackEngine: FeedbackEngine;
  private emailIngestion: EmailIngestionService;

  constructor() {
    this.geminiService = new GeminiService();
    this.clauseService = new ClauseService();
    this.vectorDB = new VectorDatabase();
    this.classifier = new DocumentClassifier();
    this.feedbackEngine = new FeedbackEngine();
    this.emailIngestion = new EmailIngestionService();
    
    // Initialize vector database
    this.vectorDB.initialize().catch(console.error);
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

  /**
   * Import clauses from document content
   */
  async importClauses(userId: string, content: string): Promise<number> {
    return await this.clauseService.importClauses(userId, content);
  }

  /**
   * Enhanced RFP Analysis with Deep Intelligence
   */
  async analyzeRFPDeep(rfpId: number, userId: string, content: string): Promise<{
    classification: any;
    vectorIndex: boolean;
    fitScore: number;
    strategicInsights: string[];
    recommendedActions: string[];
    confidence: number;
  }> {
    try {
      // Get user profile for personalized analysis
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Step 1: Classify the document
      console.log('Classifying RFP document...');
      const classification = await this.classifier.classifyDocument(rfpId, content, '');
      
      if (!classification.isValidRFP) {
        return {
          classification,
          vectorIndex: false,
          fitScore: 0,
          strategicInsights: ['Document rejected: ' + classification.filterReason],
          recommendedActions: ['Upload a valid RFP document'],
          confidence: classification.confidence
        };
      }

      // Step 2: Calculate personalized fit score
      console.log('Calculating fit score...');
      const fitScore = await this.classifier.calculateFitScore(classification, user);

      // Step 3: Index in vector database
      console.log('Indexing in vector database...');
      await this.vectorDB.indexRFP(rfpId, content, {
        sectionType: 'full_document',
        industry: classification.classification.industry,
        category: classification.classification.category,
        complexity: classification.classification.complexity,
        estimatedValue: classification.classification.estimatedValue,
        keywords: classification.metadataTags
      });

      // Step 4: Find similar historical RFPs
      console.log('Finding similar RFPs...');
      const similarRFPs = await this.vectorDB.searchSimilarRFPs(content, {
        industry: classification.classification.industry
      }, 5);

      // Step 5: Generate strategic insights using historical patterns
      console.log('Generating strategic insights...');
      const historicalPatterns = await this.vectorDB.getHistoricalPatterns(
        classification.classification.industry, 
        userId
      );

      const strategicInsights = await this.generateStrategicInsights(
        classification,
        similarRFPs,
        historicalPatterns,
        fitScore
      );

      // Step 6: Generate recommended actions
      const recommendedActions = await this.generateRecommendedActions(
        classification,
        fitScore,
        historicalPatterns
      );

      return {
        classification,
        vectorIndex: true,
        fitScore,
        strategicInsights,
        recommendedActions,
        confidence: classification.confidence
      };

    } catch (error) {
      console.error('Deep RFP analysis error:', error);
      throw error;
    }
  }

  /**
   * Process user feedback and improve future matches
   */
  async processFeedback(userId: string, smartMatchId: number, feedbackData: {
    rating: number;
    feedbackType: string;
    comments?: string;
    improvedScore?: number;
  }): Promise<any> {
    return await this.feedbackEngine.processFeedback(userId, smartMatchId, feedbackData);
  }

  /**
   * Get personalized recommendations based on user history
   */
  async getPersonalizedRecommendations(userId: string): Promise<string[]> {
    return await this.feedbackEngine.generatePersonalizedRecommendations(userId);
  }

  /**
   * Trigger email ingestion for automated document discovery
   */
  async ingestEmailsForUser(userId: string, provider?: string): Promise<any> {
    return await this.emailIngestion.ingestEmails(userId, provider);
  }

  /**
   * Get email ingestion status and activity
   */
  async getEmailIngestionStatus(userId: string): Promise<any> {
    return await this.emailIngestion.getIngestionStatus(userId);
  }

  /**
   * Search for similar RFPs using vector similarity
   */
  async findSimilarRFPs(query: string, filters: any = {}, limit: number = 10): Promise<any[]> {
    return await this.vectorDB.searchSimilarRFPs(query, filters, limit);
  }

  /**
   * Get comprehensive analytics for SmartMatch performance
   */
  async getAnalytics(userId: string): Promise<{
    totalMatches: number;
    averageScore: number;
    topCategories: string[];
    recentActivity: any[];
    improvementSuggestions: string[];
  }> {
    try {
      const userFeedback = await storage.getSmartmatchFeedbackByUser(userId);
      const smartMatches = await storage.getSmartMatchesByUser(userId);
      const patterns = await this.feedbackEngine.analyzeFeedbackPatterns();

      const totalMatches = smartMatches.length;
      const averageScore = totalMatches > 0 
        ? smartMatches.reduce((sum, match) => sum + match.overallScore, 0) / totalMatches
        : 0;

      // Extract top categories from matches
      const categories = smartMatches.map(match => 
        match.analysisDetails?.classification?.category || 'unknown'
      );
      const categoryCount = categories.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category);

      const recentActivity = smartMatches
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      const improvementSuggestions = await this.feedbackEngine.generatePersonalizedRecommendations(userId);

      return {
        totalMatches,
        averageScore,
        topCategories,
        recentActivity,
        improvementSuggestions
      };
    } catch (error) {
      console.error('Analytics generation error:', error);
      return {
        totalMatches: 0,
        averageScore: 0,
        topCategories: [],
        recentActivity: [],
        improvementSuggestions: []
      };
    }
  }

  // Helper methods for strategic analysis
  private async generateStrategicInsights(
    classification: any,
    similarRFPs: any[],
    historicalPatterns: any,
    fitScore: number
  ): Promise<string[]> {
    const insights: string[] = [];

    // Fit score insights
    if (fitScore >= 80) {
      insights.push('🎯 Excellent match - this RFP aligns perfectly with your capabilities');
    } else if (fitScore >= 60) {
      insights.push('✅ Good match - consider strengthening specific areas for better positioning');
    } else if (fitScore >= 40) {
      insights.push('⚠️ Moderate match - evaluate if strategic partnerships could improve your position');
    } else {
      insights.push('❌ Low match - this RFP may not be worth pursuing given current capabilities');
    }

    // Historical pattern insights
    if (historicalPatterns.patterns?.successRate > 70) {
      insights.push(`📈 Strong track record in ${classification.classification.industry} with ${historicalPatterns.patterns.successRate.toFixed(1)}% success rate`);
    }

    // Competition insights based on similar RFPs
    if (similarRFPs.length > 3) {
      insights.push(`🔍 Found ${similarRFPs.length} similar RFPs - analyze successful approaches from past wins`);
    }

    // Complexity insights
    const complexity = classification.classification.complexity;
    if (complexity === 'high') {
      insights.push('🎓 High complexity project - ensure technical team capacity and expertise alignment');
    } else if (complexity === 'low') {
      insights.push('⚡ Low complexity project - opportunity for quick win and relationship building');
    }

    return insights;
  }

  private async generateRecommendedActions(
    classification: any,
    fitScore: number,
    historicalPatterns: any
  ): Promise<string[]> {
    const actions: string[] = [];

    // Actions based on fit score
    if (fitScore < 60) {
      actions.push('Update company profile to better reflect current capabilities');
      actions.push('Consider strategic partnerships to fill capability gaps');
    }

    // Actions based on classification
    const requirements = classification.classification.requirements || [];
    if (requirements.length > 0) {
      actions.push('Review and address each requirement in your proposal');
      actions.push('Gather supporting documentation for compliance requirements');
    }

    // Actions based on historical success
    if (historicalPatterns.patterns?.commonFactors?.length > 0) {
      actions.push(`Emphasize your strengths in: ${historicalPatterns.patterns.commonFactors.slice(0, 3).join(', ')}`);
    }

    // Time-sensitive actions
    if (classification.classification.deadline) {
      actions.push('Mark calendar deadline and create submission timeline');
    }

    actions.push('Run SmartMatch query to find relevant proposal clauses');
    actions.push('Analyze competitor landscape in this industry segment');

    return actions;
  }
}