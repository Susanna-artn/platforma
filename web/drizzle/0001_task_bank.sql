CREATE TYPE "public"."answer_type" AS ENUM('number', 'expression', 'roots', 'interval', 'tuple', 'quantity', 'digits', 'steps');--> statement-breakpoint
CREATE TYPE "public"."exam" AS ENUM('oge', 'ege_base', 'ege_profile', 'ege');--> statement-breakpoint
CREATE TYPE "public"."subject" AS ENUM('math', 'physics');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"subject" "subject" NOT NULL,
	"grade" smallint NOT NULL,
	"topic_id" uuid NOT NULL,
	"exam" "exam",
	"exam_task_number" smallint,
	"exam_part" smallint,
	"difficulty" smallint NOT NULL,
	"status" "task_status" DEFAULT 'draft' NOT NULL,
	"statement" text NOT NULL,
	"answer_type" "answer_type" NOT NULL,
	"answer" jsonb NOT NULL,
	"solution" text,
	"criteria" jsonb,
	"max_score" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "tasks_code_unique" UNIQUE("code"),
	CONSTRAINT "tasks_grade_range" CHECK ("tasks"."grade" between 9 and 11),
	CONSTRAINT "tasks_difficulty_range" CHECK ("tasks"."difficulty" between 1 and 3),
	CONSTRAINT "tasks_exam_part" CHECK ("tasks"."exam_part" is null or "tasks"."exam_part" in (1, 2)),
	CONSTRAINT "tasks_exam_fields_need_exam" CHECK ("tasks"."exam" is not null or ("tasks"."exam_task_number" is null and "tasks"."exam_part" is null))
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"subject" "subject" NOT NULL,
	"section" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_filter_idx" ON "tasks" USING btree ("subject","grade","status");--> statement-breakpoint
CREATE INDEX "tasks_topic_idx" ON "tasks" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "topics_subject_idx" ON "topics" USING btree ("subject","section","name");