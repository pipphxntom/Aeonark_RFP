import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from '../storage';

interface FeedbackAnalysis {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  specificIssues: string[];
  suggestedImprovements: string[];
  confidenceLevel: number;
  actionableInsights: string[];
}

interface LearningUpdate {
  category: string;
  weightAdjustment: number;
  reason: string;
  impact: 'low' | 'medium' | 'high';
}

export class FeedbackEngine {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  /**
   * Process user feedback and update model weights
   */
  async processFeedback(userId: string, smartMatchId: number, feedbackData: {
    rating: number;
    feedbackType: string;
    comments?: string;
    improvedScore?: number;
    contextualData?: any;
  }): Promise<FeedbackAnalysis> {
    try {
      // Store the feedback
      await storage.createSmartmatchFeedback({
        userId,
        smartMatchId,
        feedbackType: feedbackData.feedbackType,
        rating: feedbackData.rating,
        comments: feedbackData.comments,
        improvedScore: feedbackData.improvedScore,
        contextualData: feedbackData.contextualData
      });

      // Analyze feedback content
      const analysis = await this.analyzeFeedback(feedbackData);

      // Update learning weights based on feedback
      const learningUpdates = await this.calculateLearningUpdates(userId, smartMatchId, feedbackData, analysis);
      
      // Apply weight adjustments
      for (const update of learningUpdates) {
        await this.updateLearningWeights(userId, update);
      }

      // Update global model if significant feedback
      if (feedbackData.rating <= 2 || feedbackData.rating >= 4) {
        await this.updateGlobalModel(feedbackData, analysis);
      }

      return analysis;
    } catch (error) {
      console.error('Feedback processing error:', error);
      throw error;
    }
  }

  /**
   * Analyze feedback content using AI
   */
  private async analyzeFeedback(feedbackData: any): Promise<FeedbackAnalysis> {
    if (!feedbackData.comments) {
      return this.createBasicAnalysis(feedbackData.rating);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        Analyze this user feedback about an RFP matching system:
        
        Rating: ${feedbackData.rating}/5
        Comments: "${feedbackData.comments}"
        Feedback Type: ${feedbackData.feedbackType}
        
        Provide analysis in JSON format:
        {
          "overallSentiment": "positive|negative|neutral",
          "specificIssues": ["issue1", "issue2"],
          "suggestedImprovements": ["improvement1", "improvement2"],
          "confidenceLevel": 0.85,
          "actionableInsights": ["insight1", "insight2"]
        }
        
        Focus on:
        1. Accuracy issues with matching
        2. Missing features or capabilities
        3. User experience problems
        4. Suggestions for better results
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          overallSentiment: analysis.overallSentiment || 'neutral',
          specificIssues: Array.isArray(analysis.specificIssues) ? analysis.specificIssues : [],
          suggestedImprovements: Array.isArray(analysis.suggestedImprovements) ? analysis.suggestedImprovements : [],
          confidenceLevel: Math.max(0, Math.min(1, analysis.confidenceLevel || 0.5)),
          actionableInsights: Array.isArray(analysis.actionableInsights) ? analysis.actionableInsights : []
        };
      }
      
      return this.createBasicAnalysis(feedbackData.rating);
    } catch (error) {
      console.error('Feedback analysis error:', error);
      return this.createBasicAnalysis(feedbackData.rating);
    }
  }

  /**
   * Calculate learning weight adjustments
   */
  private async calculateLearningUpdates(userId: string, smartMatchId: number, feedbackData: any, analysis: FeedbackAnalysis): Promise<LearningUpdate[]> {
    const updates: LearningUpdate[] = [];
    
    // Get current SmartMatch data
    const smartMatch = await storage.getSmartMatchById(smartMatchId);
    if (!smartMatch) return updates;

    const ratingDelta = feedbackData.rating - 3; // Centered around neutral (3)
    const adjustmentFactor = ratingDelta * 0.1; // Max 20% adjustment

    // Adjust weights based on specific feedback
    if (analysis.specificIssues.some(issue => issue.toLowerCase().includes('industry'))) {
      updates.push({
        category: 'industry',
        weightAdjustment: adjustmentFactor,
        reason: 'User feedback indicated industry matching issues',
        impact: Math.abs(adjustmentFactor) > 0.1 ? 'high' : 'medium'
      });
    }

    if (analysis.specificIssues.some(issue => issue.toLowerCase().includes('service'))) {
      updates.push({
        category: 'services',
        weightAdjustment: adjustmentFactor,
        reason: 'User feedback indicated service matching issues',
        impact: Math.abs(adjustmentFactor) > 0.1 ? 'high' : 'medium'
      });
    }

    if (analysis.specificIssues.some(issue => issue.toLowerCase().includes('timeline'))) {
      updates.push({
        category: 'timeline',
        weightAdjustment: adjustmentFactor,
        reason: 'User feedback indicated timeline matching issues',
        impact: Math.abs(adjustmentFactor) > 0.1 ? 'high' : 'medium'
      });
    }

    // If no specific issues mentioned, adjust all categories slightly
    if (updates.length === 0) {
      const categories = ['industry', 'services', 'timeline', 'certifications'];
      for (const category of categories) {
        updates.push({
          category,
          weightAdjustment: adjustmentFactor * 0.5, // Smaller adjustment
          reason: 'General feedback without specific category issues',
          impact: 'low'
        });
      }
    }

    return updates;
  }

  /**
   * Update learning weights for a user
   */
  private async updateLearningWeights(userId: string, update: LearningUpdate): Promise<void> {
    try {
      // Get current weight
      const currentWeights = await storage.getLearningWeights(userId, update.category);
      let currentWeight = 1.0;
      
      if (currentWeights.length > 0) {
        currentWeight = Number(currentWeights[0].weight);
      }

      const newWeight = Math.max(0.1, Math.min(2.0, currentWeight + update.weightAdjustment));

      // Store the updated weight
      await storage.createLearningWeight({
        userId,
        category: update.category,
        weight: newWeight.toString(),
        adjustmentReason: update.reason,
        previousWeight: currentWeight.toString(),
        feedbackCount: 1
      });

      console.log(`Updated ${update.category} weight for user ${userId}: ${currentWeight} → ${newWeight}`);
    } catch (error) {
      console.error('Weight update error:', error);
    }
  }

  /**
   * Update global model based on feedback patterns
   */
  private async updateGlobalModel(feedbackData: any, analysis: FeedbackAnalysis): Promise<void> {
    try {
      // Aggregate feedback patterns for global improvements
      const feedbackPatterns = await this.analyzeFeedbackPatterns();
      
      // This would integrate with a more sophisticated ML pipeline
      // For now, we'll log the insights for model improvement
      console.log('Global model update insights:', {
        feedbackCount: feedbackPatterns.totalFeedback,
        commonIssues: feedbackPatterns.commonIssues,
        improvementAreas: feedbackPatterns.improvementAreas
      });
    } catch (error) {
      console.error('Global model update error:', error);
    }
  }

  /**
   * Analyze feedback patterns across all users
   */
  async analyzeFeedbackPatterns(): Promise<{
    totalFeedback: number;
    averageRating: number;
    commonIssues: string[];
    improvementAreas: string[];
    positivePatterns: string[];
  }> {
    try {
      const allFeedback = await storage.getAllSmartmatchFeedback();
      
      if (allFeedback.length === 0) {
        return {
          totalFeedback: 0,
          averageRating: 0,
          commonIssues: [],
          improvementAreas: [],
          positivePatterns: []
        };
      }

      const totalRating = allFeedback.reduce((sum, f) => sum + (f.rating || 0), 0);
      const averageRating = totalRating / allFeedback.length;

      // Analyze common themes in comments
      const allComments = allFeedback
        .filter(f => f.comments)
        .map(f => f.comments!)
        .join(' ');

      const patterns = await this.extractPatterns(allComments);

      return {
        totalFeedback: allFeedback.length,
        averageRating,
        commonIssues: patterns.issues,
        improvementAreas: patterns.improvements,
        positivePatterns: patterns.positives
      };
    } catch (error) {
      console.error('Pattern analysis error:', error);
      return {
        totalFeedback: 0,
        averageRating: 0,
        commonIssues: [],
        improvementAreas: [],
        positivePatterns: []
      };
    }
  }

  /**
   * Generate personalized recommendations based on feedback history
   */
  async generatePersonalizedRecommendations(userId: string): Promise<string[]> {
    try {
      const userFeedback = await storage.getSmartmatchFeedbackByUser(userId);
      const userWeights = await storage.getAllLearningWeights(userId);

      if (userFeedback.length === 0) {
        return [
          'Continue using the system to improve personalized recommendations',
          'Provide feedback on match results to enhance accuracy',
          'Consider updating your company profile for better matching'
        ];
      }

      const avgRating = userFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / userFeedback.length;
      const recommendations: string[] = [];

      if (avgRating < 3) {
        recommendations.push('Your matching accuracy could be improved - consider updating your company profile');
        recommendations.push('Review and adjust your service offerings to better match available RFPs');
      } else if (avgRating > 4) {
        recommendations.push('Great job! Your profile is well-optimized for RFP matching');
        recommendations.push('Consider exploring RFPs in adjacent industries for growth opportunities');
      }

      // Add weight-based recommendations
      const lowWeights = userWeights.filter(w => Number(w.weight) < 0.8);
      if (lowWeights.length > 0) {
        recommendations.push(`Consider improving your ${lowWeights[0].category} capabilities for better matches`);
      }

      return recommendations;
    } catch (error) {
      console.error('Recommendation generation error:', error);
      return ['Unable to generate personalized recommendations at this time'];
    }
  }

  // Helper methods
  private createBasicAnalysis(rating: number): FeedbackAnalysis {
    const sentiment = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
    
    return {
      overallSentiment: sentiment,
      specificIssues: rating <= 2 ? ['Low satisfaction rating'] : [],
      suggestedImprovements: rating <= 3 ? ['Improve matching accuracy', 'Enhance user experience'] : [],
      confidenceLevel: 0.3,
      actionableInsights: ['Continue gathering feedback for better analysis']
    };
  }

  private async extractPatterns(text: string): Promise<{
    issues: string[];
    improvements: string[];
    positives: string[];
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        Analyze this collected feedback text and extract common patterns:
        
        "${text.substring(0, 2000)}"
        
        Return JSON with:
        {
          "issues": ["common issue 1", "common issue 2"],
          "improvements": ["suggested improvement 1", "improvement 2"],
          "positives": ["positive pattern 1", "positive pattern 2"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { issues: [], improvements: [], positives: [] };
    } catch (error) {
      console.error('Pattern extraction error:', error);
      return { issues: [], improvements: [], positives: [] };
    }
  }
}