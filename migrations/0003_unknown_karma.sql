CREATE TABLE "enhanced_smart_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfp_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"industry" varchar NOT NULL,
	"model_version" varchar NOT NULL,
	"overall_score" integer NOT NULL,
	"industry_specific_scores" jsonb NOT NULL,
	"similar_historical_rfps" jsonb,
	"confidence_level" numeric(5, 4),
	"risk_factors" jsonb,
	"success_predictors" jsonb,
	"recommended_strategy" jsonb,
	"competitive_analysis" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "extracted_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"memory_bank_id" integer NOT NULL,
	"feature_type" varchar NOT NULL,
	"feature_value" text NOT NULL,
	"importance" numeric(5, 4),
	"frequency" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "industry_memory_banks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"industry" varchar NOT NULL,
	"rfp_text" text NOT NULL,
	"proposal_text" text NOT NULL,
	"outcome" varchar NOT NULL,
	"win_probability" numeric(5, 4),
	"key_phrases" text[],
	"required_certifications" text[],
	"project_value" numeric(12, 2),
	"timeline_weeks" integer,
	"competitor_count" integer,
	"client_size" varchar,
	"embedding" text,
	"feedback_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "industry_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"industry" varchar NOT NULL,
	"model_version" varchar DEFAULT '1.0' NOT NULL,
	"scoring_weights" jsonb NOT NULL,
	"training_data_count" integer DEFAULT 0,
	"last_training_date" timestamp,
	"performance_metrics" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"industry" varchar NOT NULL,
	"model_id" integer NOT NULL,
	"training_type" varchar NOT NULL,
	"data_points_used" integer,
	"training_duration_seconds" integer,
	"before_metrics" jsonb,
	"after_metrics" jsonb,
	"improvements" jsonb,
	"status" varchar DEFAULT 'completed' NOT NULL,
	"error_logs" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "enhanced_smart_matches" ADD CONSTRAINT "enhanced_smart_matches_rfp_id_rfps_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_smart_matches" ADD CONSTRAINT "enhanced_smart_matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_features" ADD CONSTRAINT "extracted_features_memory_bank_id_industry_memory_banks_id_fk" FOREIGN KEY ("memory_bank_id") REFERENCES "public"."industry_memory_banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_memory_banks" ADD CONSTRAINT "industry_memory_banks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_models" ADD CONSTRAINT "industry_models_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_logs" ADD CONSTRAINT "training_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_logs" ADD CONSTRAINT "training_logs_model_id_industry_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."industry_models"("id") ON DELETE no action ON UPDATE no action;