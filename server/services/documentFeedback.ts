import { db } from '../db';
import { insertRfpSchema } from '@shared/schema';

export interface DocumentFeedback {
  rfpId: number;
  userId: string;
  feedback: 'correct' | 'incorrect';
  reason?: string;
  suggestedType?: string;
}

export interface RejectedDocument {
  id: number;
  fileName: string;
  documentType: string;
  userId: string;
  rejectionReason: string;
  createdAt: Date;
}

export class DocumentFeedbackService {
  
  /**
   * Mark a SmartMatch suggestion as incorrect
   */
  async markIncorrectSuggestion(feedback: DocumentFeedback): Promise<void> {
    try {
      // Log the feedback for future improvements
      console.log(`📝 User feedback: RFP ${feedback.rfpId} marked as ${feedback.feedback}`);
      
      if (feedback.feedback === 'incorrect') {
        // Get the RFP to mark it as rejected
        const rfps = await db.query.rfps.findMany({
          where: (rfps, { eq, and }) => and(
            eq(rfps.id, feedback.rfpId),
            eq(rfps.userId, feedback.userId)
          )
        });
        
        if (rfps.length > 0) {
          const rfp = rfps[0];
          
          // Store rejected document for retraining
          await this.storeRejectedDocument({
            fileName: rfp.title,
            documentType: 'RFP', // Current type
            userId: feedback.userId,
            rejectionReason: feedback.reason || 'User marked as incorrect suggestion',
            createdAt: new Date()
          });
          
          // Update RFP status to rejected
          await db.update(db.rfps)
            .set({ 
              status: 'rejected',
              metadata: {
                ...rfp.metadata,
                userFeedback: feedback,
                rejectedAt: new Date().toISOString()
              }
            })
            .where(db.rfps.id.eq(feedback.rfpId));
        }
      }
    } catch (error) {
      console.error('Failed to process document feedback:', error);
      throw new Error('Failed to save feedback');
    }
  }
  
  /**
   * Store rejected documents for future model improvement
   */
  private async storeRejectedDocument(rejected: Omit<RejectedDocument, 'id'>): Promise<void> {
    // In a production system, this would go to a dedicated rejected_documents table
    // For now, we'll log it for manual review
    console.log('🚫 Document rejected and logged for retraining:', {
      fileName: rejected.fileName,
      type: rejected.documentType,
      reason: rejected.rejectionReason,
      userId: rejected.userId
    });
    
    // TODO: Implement proper storage in rejected_documents table
    // This would help retrain the classification model
  }
  
  /**
   * Get user's feedback history for analysis
   */
  async getUserFeedbackHistory(userId: string): Promise<any[]> {
    try {
      const rejectedRfps = await db.query.rfps.findMany({
        where: (rfps, { eq, and }) => and(
          eq(rfps.userId, userId),
          eq(rfps.status, 'rejected')
        ),
        columns: {
          id: true,
          title: true,
          documentType: true,
          createdAt: true,
          metadata: true
        }
      });
      
      return rejectedRfps.map(rfp => ({
        rfpId: rfp.id,
        fileName: rfp.title,
        type: rfp.documentType,
        rejectedAt: rfp.createdAt,
        feedback: rfp.metadata?.userFeedback || null
      }));
    } catch (error) {
      console.error('Failed to get feedback history:', error);
      return [];
    }
  }
  
  /**
   * Get rejection statistics for improving the classifier
   */
  async getRejectionStats(): Promise<any> {
    try {
      const rejectedCount = await db.query.rfps.findMany({
        where: (rfps, { eq }) => eq(rfps.status, 'rejected')
      });
      
      const totalCount = await db.query.rfps.findMany({});
      
      return {
        totalDocuments: totalCount.length,
        rejectedDocuments: rejectedCount.length,
        rejectionRate: rejectedCount.length / Math.max(totalCount.length, 1),
        mostCommonRejectionReasons: this.analyzeRejectionReasons(rejectedCount)
      };
    } catch (error) {
      console.error('Failed to get rejection stats:', error);
      return {
        totalDocuments: 0,
        rejectedDocuments: 0,
        rejectionRate: 0,
        mostCommonRejectionReasons: []
      };
    }
  }
  
  private analyzeRejectionReasons(rejectedDocs: any[]): Array<{reason: string, count: number}> {
    const reasonCounts = new Map<string, number>();
    
    rejectedDocs.forEach(doc => {
      const feedback = doc.metadata?.userFeedback;
      const reason = feedback?.reason || 'No reason provided';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });
    
    return Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 reasons
  }
}

export const documentFeedbackService = new DocumentFeedbackService();