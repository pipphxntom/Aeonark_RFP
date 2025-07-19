import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from '../storage';

interface ClassificationResult {
  isValidRFP: boolean;
  documentType: string;
  confidence: number;
  filterReason?: string;
  classification: {
    category: string;
    subcategory: string;
    industry: string;
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedValue: string;
    deadline: string | null;
    requirements: string[];
    eligibility: string[];
  };
  languagePatterns: string[];
  metadataTags: string[];
}

export class DocumentClassifier {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  /**
   * Classify and validate if document is a legitimate RFP
   */
  async classifyDocument(rfpId: number, content: string, fileName: string): Promise<ClassificationResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        You are an expert document classifier specializing in RFP (Request for Proposal) validation.
        
        Analyze this document content and classify it:
        
        File Name: "${fileName}"
        Content: "${content.substring(0, 3000)}"
        
        Determine:
        1. Is this a legitimate RFP/RFQ/tender document?
        2. What type of document is this?
        3. Extract key business intelligence
        
        Consider these RED FLAGS that indicate NOT an RFP:
        - Marketing materials or brochures
        - Internal company documents
        - Academic papers or research
        - News articles or press releases
        - Product manuals or technical documentation
        - Personal documents or invoices
        - Generic templates without specific requirements
        
        RFP INDICATORS:
        - Specific project requirements and scope
        - Submission deadlines and procedures
        - Evaluation criteria and scoring
        - Budget information or value estimates
        - Legal terms and conditions
        - Vendor qualification requirements
        - Timeline and milestones
        
        Respond with JSON in this exact format:
        {
          "isValidRFP": true/false,
          "documentType": "rfp|rfq|tender|marketing|manual|other",
          "confidence": 0.95,
          "filterReason": "reason if not valid RFP",
          "classification": {
            "category": "government|corporate|nonprofit|academic",
            "subcategory": "it_services|construction|consulting|supplies|etc",
            "industry": "technology|healthcare|finance|construction|etc",
            "complexity": "low|medium|high",
            "priority": "low|medium|high|urgent",
            "estimatedValue": "under_50k|50k_250k|250k_1m|over_1m|unknown",
            "deadline": "YYYY-MM-DD or null",
            "requirements": ["requirement1", "requirement2"],
            "eligibility": ["eligibility1", "eligibility2"]
          },
          "languagePatterns": ["formal", "technical", "legal"],
          "metadataTags": ["tag1", "tag2", "tag3"]
        }
      `;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
        },
      });

      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return this.createFallbackClassification(content, fileName);
      }

      const classification = JSON.parse(jsonMatch[0]);
      
      // Validate and clean the classification
      const validatedResult: ClassificationResult = {
        isValidRFP: Boolean(classification.isValidRFP),
        documentType: classification.documentType || 'other',
        confidence: Math.max(0, Math.min(1, classification.confidence || 0.5)),
        filterReason: classification.filterReason,
        classification: {
          category: classification.classification?.category || 'unknown',
          subcategory: classification.classification?.subcategory || 'unknown',
          industry: classification.classification?.industry || 'unknown',
          complexity: ['low', 'medium', 'high'].includes(classification.classification?.complexity) 
            ? classification.classification.complexity : 'medium',
          priority: ['low', 'medium', 'high', 'urgent'].includes(classification.classification?.priority)
            ? classification.classification.priority : 'medium',
          estimatedValue: classification.classification?.estimatedValue || 'unknown',
          deadline: classification.classification?.deadline,
          requirements: Array.isArray(classification.classification?.requirements) 
            ? classification.classification.requirements : [],
          eligibility: Array.isArray(classification.classification?.eligibility)
            ? classification.classification.eligibility : []
        },
        languagePatterns: Array.isArray(classification.languagePatterns) 
          ? classification.languagePatterns : [],
        metadataTags: Array.isArray(classification.metadataTags)
          ? classification.metadataTags : []
      };

      // Additional validation rules
      validatedResult.isValidRFP = this.validateRFPCriteria(validatedResult, content);

      // Store classification result
      await storage.createDocumentClassification({
        rfpId,
        documentType: validatedResult.documentType,
        isValidRFP: validatedResult.isValidRFP,
        classification: validatedResult.classification,
        filterReason: validatedResult.filterReason,
        languagePatterns: validatedResult.languagePatterns,
        metadataTags: validatedResult.metadataTags,
        confidenceScore: validatedResult.confidence.toString()
      });

      return validatedResult;

    } catch (error) {
      console.error('Document classification error:', error);
      return this.createFallbackClassification(content, fileName);
    }
  }

  /**
   * Extract structured metadata from RFP content
   */
  async extractMetadata(content: string): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        Extract structured metadata from this RFP document:
        
        "${content.substring(0, 2000)}"
        
        Extract and return JSON with:
        {
          "title": "project title",
          "organization": "issuing organization",
          "location": "project location",
          "budget": "budget information",
          "timeline": "project timeline",
          "keyDeadlines": ["deadline1", "deadline2"],
          "technicalRequirements": ["req1", "req2"],
          "qualifications": ["qual1", "qual2"],
          "evaluationCriteria": ["criteria1", "criteria2"],
          "contactInfo": "contact information",
          "keywords": ["keyword1", "keyword2"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {};
    } catch (error) {
      console.error('Metadata extraction error:', error);
      return {};
    }
  }

  /**
   * Intelligent document filtering
   */
  async shouldProcessDocument(content: string, fileName: string): Promise<{ shouldProcess: boolean; reason: string; confidence: number }> {
    const classification = await this.classifyDocument(0, content, fileName); // Temp rfpId for classification
    
    if (!classification.isValidRFP) {
      return {
        shouldProcess: false,
        reason: classification.filterReason || 'Document does not appear to be a valid RFP',
        confidence: classification.confidence
      };
    }

    // Additional quality checks
    const qualityScore = this.calculateDocumentQuality(content);
    
    if (qualityScore < 0.3) {
      return {
        shouldProcess: false,
        reason: 'Document quality too low - insufficient content or structure',
        confidence: qualityScore
      };
    }

    return {
      shouldProcess: true,
      reason: 'Document passes all validation criteria',
      confidence: classification.confidence
    };
  }

  /**
   * Generate fit score based on user profile
   */
  async calculateFitScore(classification: ClassificationResult, userProfile: any): Promise<number> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        Calculate compatibility score between this RFP and user profile:
        
        RFP Classification:
        - Industry: ${classification.classification.industry}
        - Category: ${classification.classification.category}
        - Complexity: ${classification.classification.complexity}
        - Requirements: ${classification.classification.requirements.join(', ')}
        
        User Profile:
        - Industry: ${userProfile.industry}
        - Services: ${userProfile.servicesOffered?.join(', ')}
        - Company Size: ${userProfile.companySize}
        
        Return a fit score from 0-100 based on:
        1. Industry alignment
        2. Service capability match
        3. Company size appropriateness
        4. Complexity handling ability
        
        Return only the number (0-100).
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const score = parseInt(response.trim()) || 50;
      
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Fit score calculation error:', error);
      return 50; // Default moderate fit
    }
  }

  // Helper methods
  private validateRFPCriteria(classification: ClassificationResult, content: string): boolean {
    // Additional validation beyond AI classification
    const rfpIndicators = [
      /proposal/i,
      /request.{1,10}proposal/i,
      /rfp/i,
      /tender/i,
      /bid/i,
      /submission/i,
      /deadline/i,
      /requirements/i,
      /evaluation/i,
      /criteria/i
    ];

    const indicatorCount = rfpIndicators.filter(pattern => pattern.test(content)).length;
    const hasStructure = content.length > 500 && content.split('\n').length > 10;
    
    return classification.confidence > 0.7 && indicatorCount >= 3 && hasStructure;
  }

  private calculateDocumentQuality(content: string): number {
    const factors = {
      length: Math.min(content.length / 1000, 1) * 0.3,
      structure: (content.split('\n').length / 50) * 0.2,
      complexity: (content.split(' ').length / 500) * 0.3,
      formatting: (content.match(/\d+\./g)?.length || 0) / 10 * 0.2
    };

    return Math.min(Object.values(factors).reduce((sum, val) => sum + val, 0), 1);
  }

  private createFallbackClassification(content: string, fileName: string): ClassificationResult {
    // Simple keyword-based fallback classification
    const isLikelyRFP = /rfp|proposal|tender|bid|request/i.test(content + fileName);
    
    return {
      isValidRFP: isLikelyRFP,
      documentType: isLikelyRFP ? 'rfp' : 'other',
      confidence: 0.3,
      filterReason: isLikelyRFP ? undefined : 'Fallback classification - manual review recommended',
      classification: {
        category: 'unknown',
        subcategory: 'unknown',
        industry: 'unknown',
        complexity: 'medium',
        priority: 'medium',
        estimatedValue: 'unknown',
        deadline: null,
        requirements: [],
        eligibility: []
      },
      languagePatterns: ['unknown'],
      metadataTags: ['fallback_classification']
    };
  }
}