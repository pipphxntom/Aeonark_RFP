/**
 * Gemini AI Service for SmartMatch
 * Handles text embeddings and similarity analysis using Google's Gemini API
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export interface SimilarityAnalysis {
  score: number;
  explanation: string;
  confidence: number;
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  /**
   * Generate embeddings for text using Gemini
   * Note: Gemini doesn't have a direct embeddings API, so we'll simulate it
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      // For now, we'll create a hash-based embedding simulation
      // In a real implementation, you'd use a proper embedding model
      const embedding = this.textToVector(text);
      
      return {
        embedding,
        tokens: Math.ceil(text.length / 4) // Rough token estimate
      };
    } catch (error) {
      console.error('Gemini embedding error:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Analyze similarity between query and clause using Gemini
   */
  async analyzeSimilarity(query: string, clauseTitle: string, clauseBody: string): Promise<SimilarityAnalysis> {
    try {
      const prompt = `
You are an expert at analyzing clause similarity for RFP responses. 

Query: "${query}"

Clause Title: "${clauseTitle}"
Clause Body: "${clauseBody}"

Analyze how well this clause matches the query. Consider:
1. Semantic similarity and relevance
2. Contextual appropriateness 
3. Coverage of the query's intent
4. Practical applicability

Respond with JSON in this exact format:
{
  "score": 0.85,
  "explanation": "This clause directly addresses the query about...",
  "confidence": 0.9
}

Score should be 0.0-1.0 where 1.0 is perfect match.
Confidence should be 0.0-1.0 indicating how certain you are.
`;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      });

      const response = result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      return {
        score: Math.max(0, Math.min(1, analysis.score || 0)),
        explanation: analysis.explanation || "No explanation provided",
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5))
      };
    } catch (error) {
      console.error('Gemini similarity analysis error:', error);
      
      // Fallback to simple text matching
      const similarity = this.calculateFallbackSimilarity(query, clauseTitle, clauseBody);
      return {
        score: similarity,
        explanation: "Fallback similarity calculation based on keyword matching",
        confidence: 0.3
      };
    }
  }

  /**
   * Generate insights for SmartMatch results
   */
  async generateInsights(query: string, matches: any[]): Promise<string> {
    try {
      const prompt = `
You are an RFP analysis expert. Based on the following query and clause matches, provide strategic insights.

Query: "${query}"

Top Matches:
${matches.map((match, i) => `
${i + 1}. ${match.title} (${Math.round(match.similarityScore * 100)}% match)
   Category: ${match.category}
   Usage: ${match.usageCount} times
   Tags: ${match.tags.join(', ')}
`).join('')}

Provide insights covering:
1. Query analysis and interpretation
2. Coverage assessment of available clauses
3. Recommendations for improving responses
4. Potential gaps or missing information
5. Strategic suggestions for RFP success

Keep it concise but actionable.
`;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      });

      return result.response.text();
    } catch (error) {
      console.error('Gemini insights generation error:', error);
      return "Unable to generate insights at this time. The clause matching results above provide the core analysis.";
    }
  }

  /**
   * Simple text-to-vector conversion for basic similarity
   */
  private textToVector(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(100).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      vector[hash % 100] += 1;
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }
    
    return vector;
  }

  /**
   * Simple hash function for text
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Fallback similarity calculation using keyword matching
   */
  private calculateFallbackSimilarity(query: string, title: string, body: string): number {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const titleWords = new Set(title.toLowerCase().split(/\s+/));
    const bodyWords = new Set(body.toLowerCase().split(/\s+/));
    
    let matches = 0;
    let totalWords = queryWords.size;
    
    queryWords.forEach(word => {
      if (titleWords.has(word)) {
        matches += 2; // Title matches are worth more
      } else if (bodyWords.has(word)) {
        matches += 1;
      }
    });
    
    return Math.min(1.0, matches / (totalWords * 2));
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < Math.min(vecA.length, vecB.length); i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}