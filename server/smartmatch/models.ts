/**
 * SmartMatch Model Provider - Handle different LLM models
 */

import OpenAI from 'openai';
import type { ModelConfig } from './types';

export class ModelProvider {
  private model: string;
  private openai?: OpenAI;
  
  constructor(model: string = 'openai') {
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
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        break;
      case 'claude':
        // TODO: Add Claude API initialization
        throw new Error('Claude model not yet implemented');
      case 'gemini':
        // TODO: Add Gemini API initialization
        throw new Error('Gemini model not yet implemented');
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
        case 'openai':
          return await this.generateOpenAIText(prompt);
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
        case 'openai':
          return await this.generateOpenAIEmbedding(text);
        default:
          throw new Error(`Embedding generation not implemented for ${this.model}`);
      }
    } catch (error) {
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate text using OpenAI
   */
  private async generateOpenAIText(prompt: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.3,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  }
}