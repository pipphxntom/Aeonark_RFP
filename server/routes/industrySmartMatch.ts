import { Router, Request, Response } from "express";
import { z } from "zod";
import { industrySmartMatch } from "../services/industrySmartMatch";
import { db } from "../db";
import { users, rfps, industryMemoryBanks, industryModels } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Schema for storing historical data
const historicalDataSchema = z.object({
  industry: z.string().min(1),
  rfpText: z.string().min(10),
  proposalText: z.string().min(10),
  outcome: z.enum(['won', 'lost', 'pending']),
  winProbability: z.number().min(0).max(1).optional(),
  projectValue: z.number().positive().optional(),
  timelineWeeks: z.number().positive().optional(),
  competitorCount: z.number().min(0).optional(),
  clientSize: z.enum(['enterprise', 'mid-market', 'small']).optional(),
  feedbackNotes: z.string().optional()
});

// Schema for triggering training
const trainingTriggerSchema = z.object({
  industry: z.string().min(1),
  trainingType: z.enum(['initial', 'incremental', 'retrain']).default('incremental')
});

/**
 * Store historical RFP and proposal data for industry-specific learning
 */
router.post('/memory-bank', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = historicalDataSchema.parse(req.body);
    
    const memoryBank = await industrySmartMatch.storeHistoricalData({
      userId,
      ...data
    });

    res.json({
      success: true,
      message: 'Historical data stored successfully',
      memoryBankId: memoryBank.id,
      trainingTriggered: memoryBank.id > 0 // Training may have been triggered
    });

  } catch (error) {
    console.error('Error storing historical data:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to store historical data' });
  }
});

/**
 * Perform industry-specific RFP analysis
 */
router.post('/analyze/:rfpId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rfpId = parseInt(req.params.rfpId);
    if (isNaN(rfpId)) {
      return res.status(400).json({ message: 'Invalid RFP ID' });
    }

    // Get RFP and user data
    const [rfp] = await db
      .select()
      .from(rfps)
      .where(and(eq(rfps.id, rfpId), eq(rfps.userId, userId)))
      .limit(1);

    if (!rfp) {
      return res.status(404).json({ message: 'RFP not found' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Perform industry-specific analysis
    const enhancedMatch = await industrySmartMatch.analyzeRfpWithIndustryContext(rfp, user);

    res.json({
      success: true,
      analysis: {
        matchId: enhancedMatch.id,
        overallScore: enhancedMatch.overallScore,
        industry: enhancedMatch.industry,
        modelVersion: enhancedMatch.modelVersion,
        industrySpecificScores: enhancedMatch.industrySpecificScores,
        confidenceLevel: parseFloat(enhancedMatch.confidenceLevel || '0'),
        insights: {
          riskFactors: enhancedMatch.riskFactors,
          successPredictors: enhancedMatch.successPredictors,
          recommendedStrategy: enhancedMatch.recommendedStrategy,
          competitiveAnalysis: enhancedMatch.competitiveAnalysis
        },
        similarHistoricalRfps: enhancedMatch.similarHistoricalRfps
      }
    });

  } catch (error) {
    console.error('Error performing industry analysis:', error);
    res.status(500).json({ message: 'Failed to perform industry-specific analysis' });
  }
});

/**
 * Trigger model training
 */
router.post('/train', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { industry, trainingType } = trainingTriggerSchema.parse(req.body);
    
    // Get or create model
    const model = await industrySmartMatch.getOrCreateIndustryModel(userId, industry);
    
    // Trigger training
    if (trainingType === 'incremental') {
      await industrySmartMatch.triggerIncrementalTraining(userId, industry, model.id);
    }

    res.json({
      success: true,
      message: `${trainingType} training triggered for ${industry} industry`,
      modelId: model.id
    });

  } catch (error) {
    console.error('Error triggering training:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to trigger training' });
  }
});

/**
 * Get training logs for transparency
 */
router.get('/training-logs', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const industry = req.query.industry as string;
    
    const logs = await industrySmartMatch.getTrainingLogs(userId, industry);

    res.json({
      success: true,
      trainingLogs: logs.map(log => ({
        id: log.id,
        industry: log.industry,
        trainingType: log.trainingType,
        dataPointsUsed: log.dataPointsUsed,
        trainingDuration: log.trainingDuration,
        status: log.status,
        improvements: log.improvements,
        beforeMetrics: log.beforeMetrics,
        afterMetrics: log.afterMetrics,
        createdAt: log.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching training logs:', error);
    res.status(500).json({ message: 'Failed to fetch training logs' });
  }
});

/**
 * Get model performance metrics
 */
router.get('/model-metrics/:industry', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const industry = req.params.industry;
    
    const metrics = await industrySmartMatch.getModelMetrics(userId, industry);

    res.json({
      success: true,
      industry,
      metrics
    });

  } catch (error) {
    console.error('Error fetching model metrics:', error);
    res.status(500).json({ message: 'Failed to fetch model metrics' });
  }
});

/**
 * Get memory bank data for the user
 */
router.get('/memory-bank', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const industry = req.query.industry as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    
    let query = db
      .select({
        id: industryMemoryBanks.id,
        industry: industryMemoryBanks.industry,
        outcome: industryMemoryBanks.outcome,
        winProbability: industryMemoryBanks.winProbability,
        projectValue: industryMemoryBanks.projectValue,
        timelineWeeks: industryMemoryBanks.timelineWeeks,
        competitorCount: industryMemoryBanks.competitorCount,
        clientSize: industryMemoryBanks.clientSize,
        keyPhrases: industryMemoryBanks.keyPhrases,
        requiredCertifications: industryMemoryBanks.requiredCertifications,
        createdAt: industryMemoryBanks.createdAt
      })
      .from(industryMemoryBanks)
      .where(eq(industryMemoryBanks.userId, userId))
      .limit(limit);

    if (industry) {
      query = query.where(and(
        eq(industryMemoryBanks.userId, userId),
        eq(industryMemoryBanks.industry, industry)
      ));
    }

    const memoryBankData = await query;

    // Get summary statistics
    const winRate = memoryBankData.length > 0 
      ? memoryBankData.filter(item => item.outcome === 'won').length / memoryBankData.length
      : 0;

    const avgProjectValue = memoryBankData.length > 0
      ? memoryBankData
          .filter(item => item.projectValue)
          .reduce((sum, item) => sum + parseFloat(item.projectValue || '0'), 0) / memoryBankData.length
      : 0;

    res.json({
      success: true,
      memoryBank: memoryBankData,
      statistics: {
        totalEntries: memoryBankData.length,
        winRate: Number((winRate * 100).toFixed(1)),
        avgProjectValue: Number(avgProjectValue.toFixed(2)),
        industries: [...new Set(memoryBankData.map(item => item.industry))]
      }
    });

  } catch (error) {
    console.error('Error fetching memory bank:', error);
    res.status(500).json({ message: 'Failed to fetch memory bank data' });
  }
});

/**
 * Get available industry models for the user
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const models = await db
      .select({
        id: industryModels.id,
        industry: industryModels.industry,
        modelVersion: industryModels.modelVersion,
        trainingDataCount: industryModels.trainingDataCount,
        lastTrainingDate: industryModels.lastTrainingDate,
        performanceMetrics: industryModels.performanceMetrics,
        isActive: industryModels.isActive,
        createdAt: industryModels.createdAt
      })
      .from(industryModels)
      .where(eq(industryModels.userId, userId));

    res.json({
      success: true,
      models
    });

  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ message: 'Failed to fetch industry models' });
  }
});

export default router;