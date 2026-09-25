CREATE TYPE "public"."role" AS ENUM('admin', 'teacher', 'student', 'parent');--> statement-breakpoint
CREATE TABLE "parent_student" (
	"parent_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parent_student_parent_id_student_id_pk" PRIMARY KEY("parent_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"grade" smallint NOT NULL,
	"parent_consent_at" timestamp with time zone,
	"parent_consent_marked_by" uuid,
	CONSTRAINT "grade_range" CHECK ("student_profiles"."grade" between 9 and 11)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"login" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"first_name" text NOT NULL,
	"last_initial" varchar(1) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"session_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_login_unique" UNIQUE("login")
);
--> statement-breakpoint
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_parent_consent_marked_by_users_id_fk" FOREIGN KEY ("parent_consent_marked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;