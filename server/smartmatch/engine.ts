/**
 * SmartMatch Engine - Core processing logic
 */

import { VectorService } from './vector';
import { ClauseService } from './clause';
import { ModelProvider } from './models';
import { storage } from '../storage';
import type { SmartMatchRequest, SmartMatchResponse, ClauseMatch, ProcessedQuery } from './types';

export class SmartMatchEngine {
  constructor(
    private vectorService: VectorService,
    private clauseService: ClauseService
  ) {}

  /**
   * Process a SmartMatch query and return ranked results
   */
  async processQuery(request: SmartMatchRequest, modelProvider: ModelProvider): Promise<SmartMatchResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Process and clean the query
      const processedQuery = await this.processInputQuery(request.query, modelProvider);
      
      // Step 2: Get embedding for the query
      const queryEmbedding = await this.vectorService.getEmbedding(processedQuery.cleanedText, modelProvider);
      
      // Step 3: Search for similar clauses
      const similarClauses = await this.clauseService.findSimilarClauses(
        request.userId, 
        queryEmbedding, 
        request.limit || 5
      );
      
      // Step 4: Generate explanations for each match
      const matches = await this.generateExplanations(similarClauses, processedQuery, modelProvider);
      
      // Step 5: Store the query and results
      const queryId = await this.storeQuery(request, processedQuery, queryEmbedding, matches, modelProvider.name);
      
      const processingTime = Date.now() - startTime;
      
      return {
        matches,
        queryId,
        processingTime,
        model: modelProvider.name
      };
    } catch (error) {
      throw new Error(`Query processing failed: ${error.message}`);
    }
  }

  /**
   * Process and clean the input query
   */
  private async processInputQuery(query: string, modelProvider: ModelProvider): Promise<ProcessedQuery> {
    // Clean the query text
    const cleanedText = query.trim().replace(/\s+/g, ' ');
    
    // Extract keywords using the LLM
    const keywordPrompt = `Extract 5-7 key terms from this query that would be useful for searching contract clauses: "${cleanedText}". Return only the terms separated by commas.`;
    const keywords = await modelProvider.generateText(keywordPrompt);
    
    // Categorize the query
    const categoryPrompt = `Categorize this query into one of these categories: security, compliance, pricing, timeline, technical, legal, general. Query: "${cleanedText}". Return only the category name.`;
    const category = await modelProvider.generateText(categoryPrompt);
    
    return {
      originalText: query,
      cleanedText,
      embedding: { values: [], dimension: 0 }, // Will be filled later
      keywords: keywords.split(',').map(k => k.trim()),
      categories: [category.trim()]
    };
  }

  /**
   * Generate explanations for each matched clause
   */
  private async generateExplanations(
    clauses: any[], 
    processedQuery: ProcessedQuery, 
    modelProvider: ModelProvider
  ): Promise<ClauseMatch[]> {
    const matches: ClauseMatch[] = [];
    
    for (const clause of clauses) {
      const explanationPrompt = `
        Query: "${processedQuery.originalText}"
        Clause: "${clause.title} - ${clause.body.substring(0, 200)}..."
        
        Explain in 1-2 sentences why this clause matches the query and how it addresses the requirement.
        Focus on specific connections between the query and clause content.
      `;
      
      const explanation = await modelProvider.generateText(explanationPrompt);
      
      matches.push({
        id: clause.id,
        title: clause.title,
        body: clause.body,
        category: clause.category || 'general',
        tags: clause.tags || [],
        similarityScore: clause.similarity_score,
        explanation: explanation.trim(),
        usageCount: clause.usage_count || 0
      });
    }
    
    return matches;
  }

  /**
   * Store the query and results in the database
   */
  private async storeQuery(
    request: SmartMatchRequest,
    processedQuery: ProcessedQuery,
    embedding: any,
    matches: ClauseMatch[],
    modelName: string
  ): Promise<number> {
    const queryRecord = await storage.createSmartMatchQuery({
      userId: request.userId,
      queryText: processedQuery.originalText,
      queryType: request.queryType,
      modelUsed: modelName,
      embedding: JSON.stringify(embedding),
      results: matches
    });
    
    return queryRecord.id;
  }
}