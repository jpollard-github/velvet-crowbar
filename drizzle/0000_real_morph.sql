CREATE TYPE "public"."entry_kind" AS ENUM('translation', 'essay', 'observation', 'autopsy', 'manifesto', 'fragment');--> statement-breakpoint
CREATE TYPE "public"."entry_visibility" AS ENUM('private', 'draft', 'public');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"kind" "entry_kind" NOT NULL,
	"visibility" "entry_visibility" DEFAULT 'private' NOT NULL,
	"title" text NOT NULL,
	"deck" text,
	"polite_sentence" text,
	"translation" text,
	"system_underneath" text,
	"useful_principle" text,
	"body" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"source_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"publication_reviewed_at" timestamp with time zone,
	"publication_reviewed_by" text,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "entries_public_requires_review" CHECK ("entries"."visibility" <> 'public' OR ("entries"."publication_reviewed_at" IS NOT NULL AND "entries"."publication_reviewed_by" IS NOT NULL AND "entries"."published_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "entry_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"visibility" "entry_visibility" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_publication_reviewed_by_user_id_fk" FOREIGN KEY ("publication_reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_revisions" ADD CONSTRAINT "entry_revisions_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entries_slug_unique" ON "entries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "entries_public_kind_published_idx" ON "entries" USING btree ("visibility","kind","published_at");--> statement-breakpoint
CREATE INDEX "entries_tags_idx" ON "entries" USING gin ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX "entry_revisions_entry_number_unique" ON "entry_revisions" USING btree ("entry_id","revision_number");--> statement-breakpoint
CREATE INDEX "entry_revisions_entry_idx" ON "entry_revisions" USING btree ("entry_id","revision_number");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");