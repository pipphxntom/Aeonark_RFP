/**
 * Clause Service - Manages clause templates and sample data
 */

import { storage } from '../storage';
import { GeminiService } from './gemini';

export class ClauseService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Create sample clause templates for testing
   */
  async createSampleClauses(userId: string): Promise<void> {
    const sampleClauses = [
      {
        title: "ISO 27001 Certification",
        body: "Our company maintains ISO 27001 certification, demonstrating our commitment to information security management. This certification ensures we follow international standards for securing sensitive information through systematic risk management processes. We conduct regular audits and maintain comprehensive documentation of our security controls and procedures.",
        category: "Security & Compliance",
        tags: ["ISO27001", "security", "certification", "compliance", "audit"]
      },
      {
        title: "Data Protection and Privacy",
        body: "We implement robust data protection measures in full compliance with GDPR, CCPA, and other applicable privacy regulations. Our data handling processes include encryption at rest and in transit, access controls, data minimization principles, and regular security assessments. We maintain detailed records of data processing activities and can provide data subject rights fulfillment.",
        category: "Data Protection",
        tags: ["GDPR", "privacy", "data protection", "encryption", "compliance"]
      },
      {
        title: "24/7 Support Services",
        body: "Our dedicated support team provides round-the-clock assistance through multiple channels including phone, email, chat, and our customer portal. We maintain SLA response times of under 2 hours for critical issues and under 8 hours for standard requests. Our support team consists of certified professionals with deep product knowledge and escalation procedures for complex issues.",
        category: "Support Services",
        tags: ["24/7", "support", "SLA", "response time", "customer service"]
      },
      {
        title: "Cloud Infrastructure and Scalability",
        body: "Our solution is built on enterprise-grade cloud infrastructure with auto-scaling capabilities to handle varying workloads. We utilize AWS/Azure/GCP services with 99.9% uptime guarantee, distributed architecture for high availability, and disaster recovery procedures. Our infrastructure can scale from hundreds to millions of users with consistent performance.",
        category: "Technical Infrastructure",
        tags: ["cloud", "scalability", "uptime", "infrastructure", "performance"]
      },
      {
        title: "Integration Capabilities",
        body: "We provide comprehensive integration options including REST APIs, webhooks, SDK libraries, and pre-built connectors for popular enterprise systems. Our integration platform supports real-time data synchronization, batch processing, and custom middleware development. We offer detailed API documentation and developer support for seamless integration.",
        category: "Integration",
        tags: ["API", "integration", "SDK", "connectors", "real-time"]
      },
      {
        title: "Implementation and Onboarding",
        body: "Our structured implementation process includes project planning, system configuration, data migration, user training, and go-live support. We assign dedicated implementation managers and provide comprehensive training materials. Typical implementation timeline is 4-8 weeks depending on complexity, with milestone-based progress tracking and regular status updates.",
        category: "Implementation",
        tags: ["implementation", "onboarding", "training", "migration", "project management"]
      },
      {
        title: "Pricing and Contract Terms",
        body: "We offer flexible pricing models including per-user subscriptions, usage-based pricing, and enterprise volume discounts. Our contracts include transparent pricing with no hidden fees, flexible payment terms, and options for annual or multi-year commitments. We provide detailed cost breakdowns and can customize pricing based on specific requirements.",
        category: "Pricing",
        tags: ["pricing", "subscription", "volume discount", "contract", "payment terms"]
      },
      {
        title: "Backup and Disaster Recovery",
        body: "We maintain comprehensive backup and disaster recovery procedures with automated daily backups, geographically distributed storage, and tested recovery procedures. Our RPO (Recovery Point Objective) is 15 minutes and RTO (Recovery Time Objective) is 4 hours for critical systems. We conduct quarterly disaster recovery tests and maintain detailed recovery documentation.",
        category: "Business Continuity",
        tags: ["backup", "disaster recovery", "RPO", "RTO", "business continuity"]
      },
      {
        title: "Training and Documentation",
        body: "We provide comprehensive training programs including online courses, live webinars, certification programs, and on-site training sessions. Our documentation includes user manuals, administrator guides, API references, and video tutorials. We maintain a knowledge base with searchable articles and regularly update training materials based on product updates.",
        category: "Training",
        tags: ["training", "documentation", "certification", "knowledge base", "tutorials"]
      },
      {
        title: "Customization and Configuration",
        body: "Our platform offers extensive customization options through configuration panels, custom fields, workflow builders, and white-label branding. We support custom integrations, bespoke feature development, and tailored user interfaces. Our professional services team can assist with complex customizations and provide ongoing customization support.",
        category: "Customization",
        tags: ["customization", "configuration", "white-label", "workflow", "branding"]
      }
    ];

    for (const clause of sampleClauses) {
      try {
        // Generate embedding for the clause
        const embedding = await this.geminiService.generateEmbedding(clause.body);

        await storage.createClauseTemplate({
          userId,
          title: clause.title,
          body: clause.body,
          category: clause.category,
          tags: clause.tags,
          embedding: embedding.embedding,
          tokens: embedding.tokens,
          isActive: true,
          usageCount: Math.floor(Math.random() * 20) // Random usage count for demo
        });
      } catch (error) {
        console.error(`Error creating sample clause "${clause.title}":`, error);
        // Continue with other clauses
      }
    }
  }

  /**
   * Import clauses from text content
   */
  async importClauses(userId: string, textContent: string): Promise<number> {
    const sections = textContent.split('\n\n').filter(section => section.trim().length > 50);
    let importedCount = 0;

    for (const section of sections) {
      try {
        const lines = section.split('\n');
        const title = lines[0].trim();
        const body = lines.slice(1).join('\n').trim();

        if (title && body) {
          const embedding = await this.geminiService.generateEmbedding(body);
          
          await storage.createClauseTemplate({
            userId,
            title,
            body,
            category: 'Imported',
            tags: ['imported'],
            embedding: embedding.embedding,
            tokens: embedding.tokens,
            isActive: true,
            usageCount: 0
          });
          
          importedCount++;
        }
      } catch (error) {
        console.error('Error importing clause:', error);
        // Continue with other sections
      }
    }

    return importedCount;
  }

  /**
   * Generate clause suggestions based on query
   */
  async suggestClauses(userId: string, query: string): Promise<any[]> {
    // This could use Gemini to generate new clause suggestions
    // For now, return empty array
    return [];
  }
}