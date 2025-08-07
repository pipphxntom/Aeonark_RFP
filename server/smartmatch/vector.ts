/**
 * SmartMatch Vector Service - Handle embeddings and similarity calculations
 */

import { ModelProvider } from './models';
import type { EmbeddingVector, VectorSearchResult } from './types';

export class VectorService {
  /**
   * Generate embedding for text using the specified model
   */
  async getEmbedding(text: string, modelProvider: ModelProvider): Promise<EmbeddingVector> {
    try {
      const values = await modelProvider.generateEmbedding(text);
      return {
        values,
        dimension: values.length
      };
    } catch (error) {
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Find the most similar vectors from a collection
   */
  findSimilarVectors(
    queryVector: number[], 
    candidateVectors: Array<{id: number, embedding: number[], metadata?: any}>,
    limit: number = 5
  ): VectorSearchResult[] {
    const results: VectorSearchResult[] = [];

    for (const candidate of candidateVectors) {
      const similarity = this.calculateCosineSimilarity(queryVector, candidate.embedding);
      results.push({
        id: candidate.id,
        score: similarity,
        metadata: candidate.metadata || {}
      });
    }

    // Sort by similarity score (descending) and take top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Normalize a vector to unit length
   */
  normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  /**
   * Parse embedding from JSON string
   */
  parseEmbedding(embeddingJson: string): number[] {
    try {
      const parsed = JSON.parse(embeddingJson);
      return Array.isArray(parsed) ? parsed : parsed.values || [];
    } catch (error) {
      throw new Error('Invalid embedding format');
    }
  }
}