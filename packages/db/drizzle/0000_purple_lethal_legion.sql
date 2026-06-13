CREATE TYPE "public"."user_role" AS ENUM('danisan', 'egitmen', 'admin', 'tabip');--> statement-breakpoint
CREATE TYPE "public"."blood_type" AS ENUM('A_pozitif', 'A_negatif', 'B_pozitif', 'B_negatif', 'AB_pozitif', 'AB_negatif', 'O_pozitif', 'O_negatif');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('erkek', 'kadin');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('requested', 'confirmed', 'reminded', 'arrived', 'treated', 'completed', 'cancelled', 'no_show', 'ertelendi');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('randevu_hatirlatma', 'randevu_onay', 'randevu_iptal', 'tedavi_ozeti', 'tahlil_sonucu', 'mesaj', 'egitmen_onay', 'sistem', 'kvkk');--> statement-breakpoint
CREATE TYPE "public"."stock_category" AS ENUM('kupa', 'suluk', 'sarf', 'bitkisel', 'igne', 'diger');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('nakit', 'kart', 'havale', 'eft');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'pending', 'partial', 'free');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'consent_granted', 'consent_revoked');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."complaint_priority" AS ENUM('1', '2', '3', '4');--> statement-breakpoint
CREATE TYPE "public"."care_relationship_status" AS ENUM('active', 'ended');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'danisan' NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone_last4" varchar(4),
	"phone_encrypted" "bytea",
	"tc_kimlik_encrypted" "bytea",
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"is_phone_verified" boolean DEFAULT false NOT NULL,
	"is_mfa_enabled" boolean DEFAULT false NOT NULL,
	"mfa_secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "danisan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tc_kimlik_encrypted" "bytea",
	"birth_date" date,
	"gender" "gender",
	"blood_type" "blood_type",
	"occupation" varchar(100),
	"address" text,
	"city" varchar(50),
	"emergency_contact" varchar(100),
	"emergency_phone" varchar(20),
	"chronic_diseases" jsonb DEFAULT '[]'::jsonb,
	"allergies" jsonb DEFAULT '[]'::jsonb,
	"current_medications" jsonb DEFAULT '[]'::jsonb,
	"previous_surgeries" jsonb DEFAULT '[]'::jsonb,
	"family_history" jsonb DEFAULT '[]'::jsonb,
	"previous_treatments" jsonb DEFAULT '[]'::jsonb,
	"main_complaints" jsonb DEFAULT '[]'::jsonb,
	"height" integer,
	"weight" integer,
	"smoking_status" boolean DEFAULT false NOT NULL,
	"alcohol_status" boolean DEFAULT false NOT NULL,
	"pregnancy_status" boolean DEFAULT false NOT NULL,
	"notes" text,
	"profile_image_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "egitmen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"certificate_number" varchar(50),
	"certificate_issuer" varchar(200),
	"certificate_date" timestamp,
	"certificate_file_url" varchar(500),
	"specialties" jsonb DEFAULT '[]'::jsonb,
	"clinic_name" varchar(200),
	"clinic_address" text,
	"clinic_city" varchar(50),
	"clinic_phone" varchar(20),
	"supervising_physician_id" uuid,
	"supervising_physician_name" varchar(100),
	"approval_status" "approval_status" DEFAULT 'pending',
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"default_session_duration" varchar(10) DEFAULT '60',
	"working_days" jsonb DEFAULT '[1,2,3,4,5]'::jsonb,
	"working_hours_start" varchar(5) DEFAULT '09:00',
	"working_hours_end" varchar(5) DEFAULT '18:00',
	"bio" text,
	"profile_image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "randevu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"danisan_id" uuid NOT NULL,
	"egitmen_id" uuid NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"end_at" timestamp,
	"status" "appointment_status" DEFAULT 'requested' NOT NULL,
	"status_changed_at" timestamp,
	"hijri_date" varchar(30),
	"is_sunnah_day" boolean DEFAULT false,
	"treatment_type" varchar(50),
	"complaints" text,
	"notes" text,
	"cancelled_by" uuid,
	"cancel_reason" text,
	"reminder_24h_sent" boolean DEFAULT false NOT NULL,
	"reminder_1h_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tedavi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"danisan_id" uuid NOT NULL,
	"egitmen_id" uuid NOT NULL,
	"randevu_id" uuid,
	"protokol_id" uuid,
	"treatment_type" varchar(50) NOT NULL,
	"session_number" integer DEFAULT 1,
	"treatment_date" timestamp NOT NULL,
	"complaints" jsonb DEFAULT '[]'::jsonb,
	"findings" text,
	"vital_signs" jsonb,
	"applied_treatment" text,
	"treatment_details" jsonb,
	"before_notes" text,
	"after_notes" text,
	"before_image_urls" jsonb DEFAULT '[]'::jsonb,
	"after_image_urls" jsonb DEFAULT '[]'::jsonb,
	"recommendations" text,
	"next_session_date" timestamp,
	"next_session_notes" text,
	"contraindications" jsonb DEFAULT '[]'::jsonb,
	"side_effects" text,
	"patient_feedback" text,
	"body_area" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tahlil" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"danisan_id" uuid NOT NULL,
	"egitmen_id" uuid,
	"test_date" timestamp NOT NULL,
	"test_type" varchar(100) NOT NULL,
	"lab_name" varchar(200),
	"values" jsonb DEFAULT '[]'::jsonb,
	"file_url" varchar(500),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mesaj" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bildirim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"action_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stok" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" "stock_category" NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"unit" varchar(20) DEFAULT 'adet' NOT NULL,
	"minimum_level" integer DEFAULT 5,
	"unit_price" numeric(10, 2),
	"batch_number" varchar(50),
	"expiry_date" date,
	"supplier" varchar(200),
	"location" varchar(100),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stok_hareket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stok_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(10) NOT NULL,
	"quantity" integer NOT NULL,
	"reason" varchar(200),
	"tedavi_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "odeme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"danisan_id" uuid NOT NULL,
	"egitmen_id" uuid NOT NULL,
	"tedavi_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"method" "payment_method",
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"receipt_number" varchar(50),
	"notes" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" "audit_action" NOT NULL,
	"table_name" varchar(50),
	"record_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kvkk_consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "consent_status" DEFAULT 'active' NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"expires_at" timestamp,
	"ip_address" varchar(45),
	"user_agent" text,
	"is_digitally_signed" boolean DEFAULT false NOT NULL,
	"signature_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "komplikasyon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"danisan_id" uuid NOT NULL,
	"egitmen_id" uuid NOT NULL,
	"tedavi_id" uuid,
	"severity" integer NOT NULL,
	"type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"image_urls" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"follow_up_24h" text,
	"follow_up_48h" text,
	"follow_up_1w" text,
	"resolved_at" timestamp,
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protokol" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"danisan_id" uuid NOT NULL,
	"egitmen_id" uuid NOT NULL,
	"title" varchar(200),
	"status" varchar(20) DEFAULT 'active',
	"complaints" jsonb DEFAULT '[]'::jsonb,
	"supporting_treatments" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_slot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"egitmen_id" uuid NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"reason" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "musaitlik" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"egitmen_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"slot_duration" integer DEFAULT 60 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_relationship" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"danisan_id" uuid NOT NULL,
	"egitmen_id" uuid NOT NULL,
	"status" "care_relationship_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "care_rel_unique" UNIQUE("danisan_id","egitmen_id")
);
--> statement-breakpoint
ALTER TABLE "danisan" ADD CONSTRAINT "danisan_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "egitmen" ADD CONSTRAINT "egitmen_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "randevu" ADD CONSTRAINT "randevu_danisan_id_users_id_fk" FOREIGN KEY ("danisan_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "randevu" ADD CONSTRAINT "randevu_egitmen_id_users_id_fk" FOREIGN KEY ("egitmen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tedavi" ADD CONSTRAINT "tedavi_danisan_id_users_id_fk" FOREIGN KEY ("danisan_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tedavi" ADD CONSTRAINT "tedavi_egitmen_id_users_id_fk" FOREIGN KEY ("egitmen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tahlil" ADD CONSTRAINT "tahlil_danisan_id_users_id_fk" FOREIGN KEY ("danisan_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mesaj" ADD CONSTRAINT "mesaj_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mesaj" ADD CONSTRAINT "mesaj_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bildirim" ADD CONSTRAINT "bildirim_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stok_hareket" ADD CONSTRAINT "stok_hareket_stok_id_stok_id_fk" FOREIGN KEY ("stok_id") REFERENCES "public"."stok"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stok_hareket" ADD CONSTRAINT "stok_hareket_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odeme" ADD CONSTRAINT "odeme_danisan_id_users_id_fk" FOREIGN KEY ("danisan_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odeme" ADD CONSTRAINT "odeme_egitmen_id_users_id_fk" FOREIGN KEY ("egitmen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kvkk_consent" ADD CONSTRAINT "kvkk_consent_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "komplikasyon" ADD CONSTRAINT "komplikasyon_danisan_id_users_id_fk" FOREIGN KEY ("danisan_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "komplikasyon" ADD CONSTRAINT "komplikasyon_egitmen_id_users_id_fk" FOREIGN KEY ("egitmen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "komplikasyon" ADD CONSTRAINT "komplikasyon_tedavi_id_tedavi_id_fk" FOREIGN KEY ("tedavi_id") REFERENCES "public"."tedavi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protokol" ADD CONSTRAINT "protokol_danisan_id_users_id_fk" FOREIGN KEY ("danisan_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protokol" ADD CONSTRAINT "protokol_egitmen_id_users_id_fk" FOREIGN KEY ("egitmen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_slot" ADD CONSTRAINT "blocked_slot_egitmen_id_users_id_fk" FOREIGN KEY ("egitmen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "musaitlik" ADD CONSTRAINT "musaitlik_egitmen_id_users_id_fk" FOREIGN KEY ("egitmen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_relationship" ADD CONSTRAINT "care_relationship_danisan_id_users_id_fk" FOREIGN KEY ("danisan_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_relationship" ADD CONSTRAINT "care_relationship_egitmen_id_users_id_fk" FOREIGN KEY ("egitmen_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "danisan_user_id_idx" ON "danisan" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "egitmen_user_id_idx" ON "egitmen" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "randevu_danisan_id_idx" ON "randevu" USING btree ("danisan_id");--> statement-breakpoint
CREATE INDEX "randevu_egitmen_id_idx" ON "randevu" USING btree ("egitmen_id");--> statement-breakpoint
CREATE INDEX "tedavi_danisan_idx" ON "tedavi" USING btree ("danisan_id");--> statement-breakpoint
CREATE INDEX "tedavi_egitmen_idx" ON "tedavi" USING btree ("egitmen_id");--> statement-breakpoint
CREATE INDEX "tedavi_randevu_idx" ON "tedavi" USING btree ("randevu_id");--> statement-breakpoint
CREATE INDEX "tahlil_danisan_id_idx" ON "tahlil" USING btree ("danisan_id");--> statement-breakpoint
CREATE INDEX "tahlil_egitmen_id_idx" ON "tahlil" USING btree ("egitmen_id");--> statement-breakpoint
CREATE INDEX "mesaj_sender_id_idx" ON "mesaj" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "mesaj_receiver_id_idx" ON "mesaj" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "bildirim_user_id_idx" ON "bildirim" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stok_hareket_stok_idx" ON "stok_hareket" USING btree ("stok_id");--> statement-breakpoint
CREATE INDEX "stok_hareket_user_idx" ON "stok_hareket" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stok_hareket_tedavi_idx" ON "stok_hareket" USING btree ("tedavi_id");--> statement-breakpoint
CREATE INDEX "odeme_danisan_id_idx" ON "odeme" USING btree ("danisan_id");--> statement-breakpoint
CREATE INDEX "odeme_egitmen_id_idx" ON "odeme" USING btree ("egitmen_id");--> statement-breakpoint
CREATE INDEX "odeme_tedavi_id_idx" ON "odeme" USING btree ("tedavi_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_table_name_idx" ON "audit_log" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "kvkk_consent_user_id_idx" ON "kvkk_consent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "kvkk_consent_user_id_purpose_idx" ON "kvkk_consent" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE INDEX "komplikasyon_danisan_idx" ON "komplikasyon" USING btree ("danisan_id");--> statement-breakpoint
CREATE INDEX "komplikasyon_egitmen_idx" ON "komplikasyon" USING btree ("egitmen_id");--> statement-breakpoint
CREATE INDEX "komplikasyon_tedavi_idx" ON "komplikasyon" USING btree ("tedavi_id");--> statement-breakpoint
CREATE INDEX "protokol_danisan_id_idx" ON "protokol" USING btree ("danisan_id");--> statement-breakpoint
CREATE INDEX "protokol_egitmen_id_idx" ON "protokol" USING btree ("egitmen_id");--> statement-breakpoint
CREATE INDEX "blocked_slot_egitmen_id_idx" ON "blocked_slot" USING btree ("egitmen_id");--> statement-breakpoint
CREATE INDEX "musaitlik_egitmen_id_idx" ON "musaitlik" USING btree ("egitmen_id");--> statement-breakpoint
CREATE INDEX "care_rel_danisan_idx" ON "care_relationship" USING btree ("danisan_id");--> statement-breakpoint
CREATE INDEX "care_rel_egitmen_idx" ON "care_relationship" USING btree ("egitmen_id");