CREATE TABLE "document_classifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfp_id" integer NOT NULL,
	"document_type" varchar NOT NULL,
	"is_valid_rfp" boolean NOT NULL,
	"classification" jsonb,
	"filter_reason" text,
	"language_patterns" text[],
	"metadata_tags" text[],
	"confidence_score" numeric(3, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_ingestion_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"message_id" text NOT NULL,
	"subject" text,
	"sender" text,
	"attachment_count" integer DEFAULT 0,
	"documents_extracted" integer DEFAULT 0,
	"classification_results" jsonb,
	"processed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "proposal_memory_bank" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"proposal_id" integer,
	"rfp_id" integer,
	"outcome" varchar NOT NULL,
	"domain" varchar NOT NULL,
	"industry" varchar NOT NULL,
	"project_value" numeric(12, 2),
	"success_factors" text[],
	"template_content" text,
	"vector_embedding" text[],
	"tags" text[],
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rfp_vector_index" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfp_id" integer NOT NULL,
	"section_type" varchar NOT NULL,
	"content" text NOT NULL,
	"vector_embedding" text[],
	"metadata" jsonb,
	"industry" varchar,
	"location" varchar,
	"budget_range" varchar,
	"keywords" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "smartmatch_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"smart_match_id" integer NOT NULL,
	"feedback_type" varchar NOT NULL,
	"rating" integer,
	"comments" text,
	"improved_score" integer,
	"contextual_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "smartmatch_learning_weights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"category" varchar NOT NULL,
	"weight" numeric(4, 3) DEFAULT '1.0' NOT NULL,
	"adjustment_reason" text,
	"previous_weight" numeric(4, 3),
	"feedback_count" integer DEFAULT 0,
	"last_adjusted" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "smart_matches" ADD COLUMN "technical_fit" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "smart_matches" ADD COLUMN "strategic_alignment" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "smart_matches" ADD COLUMN "recent_relevance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "smart_matches" ADD COLUMN "vector_embedding" text[];--> statement-breakpoint
ALTER TABLE "smart_matches" ADD COLUMN "extracted_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "smart_matches" ADD COLUMN "feedback_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "smart_matches" ADD COLUMN "user_feedback" jsonb;--> statement-breakpoint
ALTER TABLE "smart_matches" ADD COLUMN "confidence_level" numeric(3, 2) DEFAULT '0.5';--> statement-breakpoint
ALTER TABLE "smart_matches" ADD COLUMN "model_version" varchar DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE "smart_matches" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "document_classifications" ADD CONSTRAINT "document_classifications_rfp_id_rfps_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_ingestion_logs" ADD CONSTRAINT "email_ingestion_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_memory_bank" ADD CONSTRAINT "proposal_memory_bank_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_memory_bank" ADD CONSTRAINT "proposal_memory_bank_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_memory_bank" ADD CONSTRAINT "proposal_memory_bank_rfp_id_rfps_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfp_vector_index" ADD CONSTRAINT "rfp_vector_index_rfp_id_rfps_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smartmatch_feedback" ADD CONSTRAINT "smartmatch_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smartmatch_feedback" ADD CONSTRAINT "smartmatch_feedback_smart_match_id_smart_matches_id_fk" FOREIGN KEY ("smart_match_id") REFERENCES "public"."smart_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smartmatch_learning_weights" ADD CONSTRAINT "smartmatch_learning_weights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;