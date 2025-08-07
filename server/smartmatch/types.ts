/**
 * SmartMatch Engine Type Definitions
 */

export interface SmartMatchRequest {
  query: string;
  userId: string;
  queryType: 'text' | 'pdf';
  model?: 'openai' | 'claude' | 'gemini' | 'deepseek';
  limit?: number;
}

export interface SmartMatchResponse {
  matches: ClauseMatch[];
  queryId: number;
  processingTime: number;
  model: string;
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
}

export interface EmbeddingVector {
  values: number[];
  dimension: number;
}

export interface ModelConfig {
  name: string;
  apiKey: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface VectorSearchResult {
  id: number;
  score: number;
  metadata: Record<string, any>;
}

export interface ProcessedQuery {
  originalText: string;
  cleanedText: string;
  embedding: EmbeddingVector;
  keywords: string[];
  categories: string[];
}