-- Geri bildirim: danışan memnuniyet puanı (1-5) + yorum. Opsiyonel egitmen_id.
CREATE TABLE IF NOT EXISTS "geri_bildirim" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "danisan_id" uuid NOT NULL,
  "egitmen_id" uuid,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "geri_bildirim" ADD CONSTRAINT "geri_bildirim_danisan_id_users_id_fk" FOREIGN KEY ("danisan_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "geri_bildirim" ADD CONSTRAINT "geri_bildirim_egitmen_id_users_id_fk" FOREIGN KEY ("egitmen_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geri_bildirim_danisan_idx" ON "geri_bildirim" USING btree ("danisan_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geri_bildirim_egitmen_idx" ON "geri_bildirim" USING btree ("egitmen_id");
--> statement-breakpoint
-- App rolune yetki (default privileges'a ek olarak acik grant).
GRANT SELECT, INSERT, UPDATE, DELETE ON "geri_bildirim" TO shifahub_app;
--> statement-breakpoint
-- RLS: danisan kendi yazar/gorur, egitmen hakkindakini gorur, admin hepsini.
ALTER TABLE "geri_bildirim" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "geri_bildirim" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "geri_bildirim_rls" ON "geri_bildirim" FOR ALL
  USING (danisan_id = app_current_user_id() OR egitmen_id = app_current_user_id() OR app_is_admin())
  WITH CHECK (danisan_id = app_current_user_id() OR app_is_admin());
