/**
 * SmartMatch Model Provider - Handle different LLM models
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ModelConfig } from './types';

export class ModelProvider {
  private model: string;
  private genAI?: GoogleGenerativeAI;
  
  constructor(model: string = 'gemini') {
    this.model = model;
    this.initializeProvider();
  }

  get name(): string {
    return this.model;
  }

  /**
   * Initialize the selected model provider
   */
  private initializeProvider() {
    switch (this.model) {
      case 'gemini':
        if (!process.env.GOOGLE_API_KEY) {
          throw new Error('Google API key not configured');
        }
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        break;
      case 'openai':
        throw new Error('OpenAI model deprecated. Please use Gemini instead.');
      case 'claude':
        // TODO: Add Claude API initialization
        throw new Error('Claude model not yet implemented');
      case 'deepseek':
        // TODO: Add DeepSeek API initialization
        throw new Error('DeepSeek model not yet implemented');
      default:
        throw new Error(`Unsupported model: ${this.model}`);
    }
  }

  /**
   * Generate text using the selected model
   */
  async generateText(prompt: string): Promise<string> {
    try {
      switch (this.model) {
        case 'gemini':
          return await this.generateGeminiText(prompt);
        default:
          throw new Error(`Text generation not implemented for ${this.model}`);
      }
    } catch (error) {
      throw new Error(`Text generation failed: ${error.message}`);
    }
  }

  /**
   * Generate embedding using the selected model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      switch (this.model) {
        case 'gemini':
          return await this.generateGeminiEmbedding(text);
        default:
          throw new Error(`Embedding generation not implemented for ${this.model}`);
      }
    } catch (error) {
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate text using Google Gemini
   */
  private async generateGeminiText(prompt: string): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini client not initialized');
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 150,
      },
    });

    const response = result.response;
    return response.text() || '';
  }

  /**
   * Generate embedding using Google Gemini
   * Note: Gemini doesn't have direct embedding API, so we use a simple hash-based approach
   */
  private async generateGeminiEmbedding(text: string): Promise<number[]> {
    // Simple hash-based embedding for compatibility
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(1536).fill(0); // Match OpenAI embedding dimension
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      vector[hash % 1536] += 1;
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
}