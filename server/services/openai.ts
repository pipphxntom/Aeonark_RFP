import OpenAI from "openai";
import type { Rfp, User } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface SmartMatchAnalysis {
  overallScore: number;
  industryMatch: number;
  servicesMatch: number;
  timelineMatch: number;
  certificationsMatch: number;
  details: {
    industryReason: string;
    servicesReason: string;
    timelineReason: string;
    certificationsReason: string;
    recommendations: string[];
  };
}

export interface ProposalContent {
  executiveSummary: string;
  scopeOfWork: string;
  timeline: string;
  legalTerms: string;
  pricing: {
    items: Array<{
      description: string;
      duration: string;
      amount: number;
    }>;
    total: number;
    currency: string;
  };
}

export async function analyzeRfpCompatibility(rfp: Rfp, user: User): Promise<SmartMatchAnalysis> {
  try {
    const prompt = `
      Analyze the compatibility between this RFP and the user's profile.
      
      RFP Details:
      - Title: ${rfp.title}
      - Description: ${rfp.description || "N/A"}
      - Content: ${rfp.extractedText?.substring(0, 2000) || "N/A"}
      
      User Profile:
      - Industry: ${user.industry || "N/A"}
      - Company Size: ${user.companySize || "N/A"}
      - Services Offered: ${user.servicesOffered?.join(", ") || "N/A"}
      
      Analyze compatibility in these areas and provide scores (0-100):
      1. Industry Match - How well does the user's industry align with RFP requirements?
      2. Services Match - How well do the user's services match what's needed?
      3. Timeline Match - Based on typical project timelines, how feasible is this?
      4. Certifications Match - Are there any certification gaps?
      
      Respond with JSON in this format:
      {
        "overallScore": number,
        "industryMatch": number,
        "servicesMatch": number,
        "timelineMatch": number,
        "certificationsMatch": number,
        "details": {
          "industryReason": "explanation",
          "servicesReason": "explanation", 
          "timelineReason": "explanation",
          "certificationsReason": "explanation",
          "recommendations": ["recommendation1", "recommendation2"]
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert RFP analyst. Analyze the compatibility between RFPs and company profiles, providing detailed scoring and recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      overallScore: Math.max(0, Math.min(100, analysis.overallScore || 0)),
      industryMatch: Math.max(0, Math.min(100, analysis.industryMatch || 0)),
      servicesMatch: Math.max(0, Math.min(100, analysis.servicesMatch || 0)),
      timelineMatch: Math.max(0, Math.min(100, analysis.timelineMatch || 0)),
      certificationsMatch: Math.max(0, Math.min(100, analysis.certificationsMatch || 0)),
      details: analysis.details || {
        industryReason: "Analysis not available",
        servicesReason: "Analysis not available",
        timelineReason: "Analysis not available", 
        certificationsReason: "Analysis not available",
        recommendations: []
      }
    };
  } catch (error) {
    console.error("Error analyzing RFP compatibility:", error);
    throw new Error("Failed to analyze RFP compatibility");
  }
}

export async function generateProposal(rfp: Rfp, user: User): Promise<ProposalContent> {
  try {
    const prompt = `
      Generate a professional proposal based on this RFP and user profile.
      
      RFP Details:
      - Title: ${rfp.title}
      - Description: ${rfp.description || "N/A"}
      - Content: ${rfp.extractedText?.substring(0, 3000) || "N/A"}
      - Deadline: ${rfp.deadline || "N/A"}
      
      User Profile:
      - Industry: ${user.industry || "N/A"}
      - Company Size: ${user.companySize || "N/A"}
      - Services Offered: ${user.servicesOffered?.join(", ") || "N/A"}
      - Tone Preference: ${user.tonePreference || "Professional"}
      
      Generate a comprehensive proposal with these sections:
      1. Executive Summary - Compelling overview highlighting key value propositions
      2. Scope of Work - Detailed breakdown of deliverables and phases
      3. Timeline - Realistic project timeline with milestones
      4. Legal Terms - Standard terms and conditions
      5. Pricing - Itemized pricing with clear descriptions
      
      Use a ${user.tonePreference || "professional"} tone throughout.
      
      Respond with JSON in this format:
      {
        "executiveSummary": "detailed executive summary",
        "scopeOfWork": "comprehensive scope description",
        "timeline": "detailed timeline with phases",
        "legalTerms": "standard legal terms and conditions",
        "pricing": {
          "items": [
            {
              "description": "service description",
              "duration": "time period", 
              "amount": number
            }
          ],
          "total": number,
          "currency": "USD"
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert proposal writer with 15+ years of experience. Create compelling, professional proposals that win business."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const proposalData = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      executiveSummary: proposalData.executiveSummary || "Executive summary not generated",
      scopeOfWork: proposalData.scopeOfWork || "Scope of work not generated",
      timeline: proposalData.timeline || "Timeline not generated",
      legalTerms: proposalData.legalTerms || "Legal terms not generated",
      pricing: proposalData.pricing || {
        items: [],
        total: 0,
        currency: "USD"
      }
    };
  } catch (error) {
    console.error("Error generating proposal:", error);
    throw new Error("Failed to generate proposal");
  }
}

export async function regenerateSection(
  sectionType: 'executiveSummary' | 'scopeOfWork' | 'timeline' | 'legalTerms',
  rfp: Rfp,
  user: User,
  currentContent: string
): Promise<string> {
  try {
    const sectionPrompts = {
      executiveSummary: "Generate a compelling executive summary that highlights key value propositions and competitive advantages.",
      scopeOfWork: "Create a detailed scope of work with clear deliverables, phases, and success criteria.",
      timeline: "Develop a realistic project timeline with key milestones and dependencies.",
      legalTerms: "Write standard legal terms and conditions appropriate for this type of engagement."
    };

    const prompt = `
      Regenerate the ${sectionType} section for this proposal.
      
      Current content to improve upon:
      ${currentContent}
      
      RFP context:
      - Title: ${rfp.title}
      - Key requirements: ${rfp.extractedText?.substring(0, 1000) || "N/A"}
      
      User profile:
      - Industry: ${user.industry || "N/A"}
      - Services: ${user.servicesOffered?.join(", ") || "N/A"}
      - Tone: ${user.tonePreference || "Professional"}
      
      Task: ${sectionPrompts[sectionType]}
      
      Make it more compelling and specific than the current version.
      Respond with just the improved content, no JSON wrapper.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert proposal writer. Improve the given section to be more compelling and specific."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
    });

    return response.choices[0].message.content || currentContent;
  } catch (error) {
    console.error("Error regenerating section:", error);
    throw new Error("Failed to regenerate section");
  }
}
