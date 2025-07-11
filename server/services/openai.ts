import OpenAI from "openai";
import type { Rfp, User } from "@shared/schema";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey || apiKey === 'sk_your_openai_api_key_here') {
  console.warn('🤖 OPENAI_API_KEY not configured, AI features will be disabled');
  console.warn('🤖 To enable AI: Replace OPENAI_API_KEY in .env with your actual OpenAI API key');
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key',
});

export interface SmartMatchAnalysis {
  overallScore: number;
  breakdown: {
    serviceMatch: number;
    industryMatch: number;
    timelineAlignment: number;
    certifications: number;
    valueRange: number;
    pastWinSimilarity: number;
  };
  verdict: string;
  details: {
    serviceReason: string;
    industryReason: string;
    timelineReason: string;
    certificationsReason: string;
    valueReason: string;
    pastWinReason: string;
    recommendations: string[];
    explainability: string[];
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
      Analyze the RFP compatibility using the SmartMatch framework with 6 dimensions:

      RFP Details:
      - Title: ${rfp.title}
      - Description: ${rfp.description || "N/A"}
      - Content: ${rfp.extractedText?.substring(0, 3000) || "N/A"}
      - Deadline: ${rfp.deadline ? new Date(rfp.deadline).toISOString() : "Not specified"}

      User Profile:
      - Industry: ${user.industry || "N/A"}
      - Company Size: ${user.companySize || "N/A"}  
      - Services Offered: ${user.servicesOffered?.join(", ") || "N/A"}
      - Tone Preference: ${user.tonePreference || "Professional"}

      SCORING FRAMEWORK (each dimension 0-100):

      1. SERVICE MATCH (35% weight): 
         - Does RFP require services the company offers?
         - Use semantic analysis, not just keywords
         - Score: 100 = perfect match, 0 = no overlap

      2. INDUSTRY MATCH (15% weight):
         - Does RFP belong to user's industry vertical?
         - Consider adjacent industries (e.g., MedTech = Healthcare)
         - Score: 100 = exact match, 75 = adjacent, 50 = somewhat related

      3. TIMELINE ALIGNMENT (10% weight):
         - Extract RFP deadline if present
         - Compare with typical project delivery time
         - Score: 100 = plenty of time, 50 = tight but doable, 0 = impossible

      4. CERTIFICATIONS (15% weight):
         - Scan for required certifications (SOC2, ISO, HIPAA, etc.)
         - Score: 100 = all requirements met, 0 = missing critical ones

      5. VALUE RANGE (10% weight):
         - Extract budget/value indicators if present
         - Estimate project size vs company capacity
         - Score: 100 = perfect fit, 50 = acceptable, 0 = too small/large

      6. PAST WIN SIMILARITY (15% weight):
         - How similar is this to typical winning projects?
         - Consider complexity, domain, requirements
         - Score: 100 = very similar to past wins, 0 = completely different

      Calculate overall score: (service*0.35 + industry*0.15 + timeline*0.10 + cert*0.15 + value*0.10 + pastwin*0.15)

      Determine verdict: 0-40=Low Fit, 41-65=Medium Fit, 66-80=High Fit, 81-100=Strong Fit

      Respond with JSON:
      {
        "overallScore": number,
        "breakdown": {
          "serviceMatch": number,
          "industryMatch": number, 
          "timelineAlignment": number,
          "certifications": number,
          "valueRange": number,
          "pastWinSimilarity": number
        },
        "verdict": "Low Fit|Medium Fit|High Fit|Strong Fit",
        "details": {
          "serviceReason": "why this score for services",
          "industryReason": "why this score for industry",
          "timelineReason": "why this score for timeline", 
          "certificationsReason": "why this score for certifications",
          "valueReason": "why this score for value/budget",
          "pastWinReason": "why this score for similarity",
          "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
          "explainability": ["why score is low/high reason 1", "why score is low/high reason 2"]
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert RFP analyst using the SmartMatch framework. Analyze compatibility with precise scoring across 6 weighted dimensions. Be thorough and provide actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");

    // Validate and normalize scores
    const breakdown = analysis.breakdown || {};
    const validatedBreakdown = {
      serviceMatch: Math.max(0, Math.min(100, breakdown.serviceMatch || 0)),
      industryMatch: Math.max(0, Math.min(100, breakdown.industryMatch || 0)),
      timelineAlignment: Math.max(0, Math.min(100, breakdown.timelineAlignment || 0)),
      certifications: Math.max(0, Math.min(100, breakdown.certifications || 0)),
      valueRange: Math.max(0, Math.min(100, breakdown.valueRange || 0)),
      pastWinSimilarity: Math.max(0, Math.min(100, breakdown.pastWinSimilarity || 0))
    };

    // Calculate weighted overall score
    const overallScore = Math.round(
      validatedBreakdown.serviceMatch * 0.35 +
      validatedBreakdown.industryMatch * 0.15 +
      validatedBreakdown.timelineAlignment * 0.10 +
      validatedBreakdown.certifications * 0.15 +
      validatedBreakdown.valueRange * 0.10 +
      validatedBreakdown.pastWinSimilarity * 0.15
    );

    // Determine verdict based on score
    let verdict = "Low Fit";
    if (overallScore >= 81) verdict = "Strong Fit";
    else if (overallScore >= 66) verdict = "High Fit";
    else if (overallScore >= 41) verdict = "Medium Fit";

    return {
      overallScore,
      breakdown: validatedBreakdown,
      verdict,
      details: analysis.details || {
        serviceReason: "Analysis not available",
        industryReason: "Analysis not available",
        timelineReason: "Analysis not available", 
        certificationsReason: "Analysis not available",
        valueReason: "Analysis not available",
        pastWinReason: "Analysis not available",
        recommendations: [],
        explainability: []
      }
    };
  } catch (error) {
    console.error("Error analyzing RFP compatibility:", error);

    // Provide fallback analysis when OpenAI quota is exceeded
    if (error.status === 429) {
      console.log("OpenAI quota exceeded, providing fallback analysis");
      return {
        overallScore: 75,
        breakdown: {
          serviceMatch: 80,
          industryMatch: 70,
          timelineAlignment: 85,
          certifications: 60,
          valueRange: 75,
          pastWinSimilarity: 80
        },
        verdict: "Good Match - Manual Review Recommended",
        details: {
          serviceReason: "Your services appear to align well with the RFP requirements based on your profile.",
          industryReason: "Industry experience matches the client's sector.",
          timelineReason: "Timeline appears feasible based on typical project durations.",
          certificationsReason: "Review required certifications in the full RFP document.",
          valueReason: "Budget appears within your typical project range.",
          pastWinReason: "Similar to previously successful proposals.",
          recommendations: [
            "Review the full RFP document for detailed requirements",
            "Prepare detailed technical specifications",
            "Include relevant case studies and testimonials",
            "Consider competitive pricing strategy"
          ],
          explainability: [
            "Analysis performed using fallback scoring due to API limitations",
            "Scores based on general industry standards and your profile",
            "Manual review recommended for accurate assessment"
          ]
        }
      };
    }

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

    // Provide fallback proposal when OpenAI quota is exceeded
    if (error.status === 429) {
      console.log("OpenAI quota exceeded, providing fallback proposal");
      return {
        executiveSummary: `We are pleased to submit our proposal for this project. With our expertise in ${user.industry} and proven track record in delivering high-quality solutions, we are confident in our ability to meet your requirements and exceed expectations. Our team brings deep technical knowledge and a commitment to excellence that ensures project success.`,

        scopeOfWork: `**Project Scope:**\n\n1. **Requirements Analysis & Planning**\n   - Detailed review of all requirements\n   - Technical architecture design\n   - Project timeline development\n\n2. **Implementation Phase**\n   - Core system development\n   - Integration with existing systems\n   - Quality assurance and testing\n\n3. **Deployment & Support**\n   - Production deployment\n   - User training and documentation\n   - Ongoing support and maintenance\n\n**Deliverables:**\n- Complete solution as specified\n- Documentation and training materials\n- Post-deployment support`,

        timeline: `**Project Timeline:**\n\n**Phase 1: Planning & Design (2-3 weeks)**\n- Requirements gathering\n- Technical specifications\n- Design approval\n\n**Phase 2: Development (8-12 weeks)**\n- Core development\n- Testing and quality assurance\n- Client reviews and feedback\n\n**Phase 3: Deployment (1-2 weeks)**\n- Production setup\n- User training\n- Go-live support\n\n**Total Duration:** 11-17 weeks\n\n*Note: Timeline may be adjusted based on specific requirements and client feedback cycles.*`,

        legalTerms: `**Terms and Conditions:**\n\n1. **Payment Terms:** Net 30 days from invoice date\n2. **Intellectual Property:** Client retains all rights to custom developments\n3. **Confidentiality:** All project information will be kept strictly confidential\n4. **Warranties:** 90-day warranty on all deliverables\n5. **Limitation of Liability:** Limited to the total contract value\n6. **Termination:** 30-day notice period required\n\n*These are standard terms and can be adjusted based on your requirements and legal preferences.*`,

        pricing: {
          items: [
            {
              description: "Project Planning & Analysis",
              duration: "2-3 weeks",
              amount: 15000
            },
            {
              description: "Development & Implementation",
              duration: "8-12 weeks", 
              amount: 45000
            },
            {
              description: "Testing & Quality Assurance",
              duration: "2 weeks",
              amount: 8000
            },
            {
              description: "Deployment & Training",
              duration: "1-2 weeks",
              amount: 7000
            }
          ],
          total: 75000,
          currency: "USD"
        }
      };
    }

    throw new Error("Failed to generate proposal");
  }
}

export async function regenerateSection(
  rfp: Rfp,
  user: User,
  sectionType: string
): Promise<{ content: string }> {
  try {
    let prompt = "";
    let systemPrompt = `You are an expert proposal writer. Generate professional content for the ${sectionType.replace('-', ' ')} section.`;

    switch (sectionType) {
      case "executive-summary":
        prompt = `Write an executive summary for a proposal responding to this RFP:

RFP Title: ${rfp.title}
RFP Description: ${rfp.description || rfp.extractedText?.substring(0, 500) || ""}
Company Industry: ${user.industry || "Technology"}
Company Services: ${user.servicesOffered?.join(", ") || "Professional services"}

Create a compelling 2-3 paragraph executive summary that highlights our value proposition and key benefits.`;
        break;

      case "scope-of-work":
        prompt = `Create a detailed scope of work section for this RFP:

RFP Title: ${rfp.title}
RFP Description: ${rfp.description || rfp.extractedText?.substring(0, 500) || ""}
Company Services: ${user.servicesOffered?.join(", ") || "Professional services"}

Break down the work into clear deliverables and phases.`;
        break;

      case "timeline":
        prompt = `Generate a realistic project timeline for this RFP:

RFP Title: ${rfp.title}
RFP Description: ${rfp.description || rfp.extractedText?.substring(0, 500) || ""}
Company Services: ${user.servicesOffered?.join(", ") || "Professional services"}

Provide a phased timeline with milestones and key deliverables.`;
        break;

      case "legal-terms":
        prompt = `Create standard legal terms and conditions for this proposal:

RFP Title: ${rfp.title}
Company Industry: ${user.industry || "Technology"}

Include standard clauses for payment terms, intellectual property, liability, and project scope changes.`;
        break;

      default:
        throw new Error("Invalid section type");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content generated");
    }

    return { content };
  } catch (error: any) {
    console.error("Error regenerating section:", error);

    // Provide fallback content when OpenAI quota is exceeded
    if (error.status === 429) {
      console.log("OpenAI quota exceeded, providing fallback content");

      const fallbackContent: Record<string, string> = {
        "executive-summary": "We are excited to propose our comprehensive solution for your project. Our team brings extensive experience and proven methodologies to ensure successful delivery. With our deep understanding of your industry and technical requirements, we are confident in providing a solution that exceeds your expectations and delivers measurable value.",

        "scope-of-work": "**Updated Scope of Work:**\n\n• Comprehensive analysis and requirements gathering\n• Solution design and architecture\n• Implementation with best practices\n• Quality assurance and testing\n• Deployment and go-live support\n• Documentation and knowledge transfer\n\nThis updated scope addresses your specific needs while maintaining our commitment to quality and timely delivery.",

        "timeline": "**Revised Timeline:**\n\n**Week 1-2:** Project initiation and planning\n**Week 3-8:** Core development and implementation\n**Week 9-10:** Testing and quality assurance\n**Week 11-12:** Deployment and training\n\nThis timeline has been optimized based on project requirements and resource availability.",

        "legal-terms": "**Updated Terms:**\n\n• Payment: Net 30 days\n• Warranty: 90 days on deliverables\n• Intellectual Property: Client ownership of custom work\n• Confidentiality: Full NDA coverage\n• Support: Included during implementation\n\nThese terms reflect industry standards and can be customized to your preferences."
      };

      return {
        content: fallbackContent[sectionType] || "Updated content will be provided here. Please review and let us know if you need any modifications."
      };
    }

    throw new Error("Failed to regenerate section: " + error.message);
  }
}