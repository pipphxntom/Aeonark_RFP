/**
 * SmartMatch Engine - Main entry point
 * Intelligently matches user queries to relevant clause templates using vector embeddings
 */

import { SmartMatchEngine } from './engine';
import { ModelProvider } from './models';
import { VectorService } from './vector';
import { ClauseService } from './clause';
import type { SmartMatchRequest, SmartMatchResponse } from './types';

export class SmartMatch {
  private engine: SmartMatchEngine;
  private vectorService: VectorService;
  private clauseService: ClauseService;

  constructor() {
    this.vectorService = new VectorService();
    this.clauseService = new ClauseService();
    this.engine = new SmartMatchEngine(this.vectorService, this.clauseService);
  }

  /**
   * Main entry point for SmartMatch queries
   */
  async match(request: SmartMatchRequest): Promise<SmartMatchResponse> {
    try {
      // Validate request
      if (!request.query || !request.userId) {
        throw new Error('Query and userId are required');
      }

      // Initialize the selected model
      const modelProvider = new ModelProvider(request.model || 'openai');
      
      // Process the query through the engine
      const result = await this.engine.processQuery(request, modelProvider);
      
      return result;
    } catch (error) {
      throw new Error(`SmartMatch processing failed: ${error.message}`);
    }
  }

  /**
   * Add a new clause template to the system
   */
  async addClauseTemplate(userId: string, title: string, body: string, category?: string, tags?: string[]): Promise<void> {
    await this.clauseService.createClauseTemplate(userId, title, body, category, tags);
  }

  /**
   * Get all clause templates for a user
   */
  async getClauseTemplates(userId: string): Promise<any[]> {
    return await this.clauseService.getClauseTemplates(userId);
  }
}

export * from './types';
export { SmartMatchEngine } from './engine';
export { ModelProvider } from './models';
export { VectorService } from './vector';
export { ClauseService } from './clause';