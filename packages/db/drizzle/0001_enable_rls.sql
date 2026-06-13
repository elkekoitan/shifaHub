-- KVKK uyum katmani: pgcrypto + RLS + non-superuser app rolu.
-- pgp_sym_* sifreleme anahtari ASLA DB'de durmaz; her istekte transaction-local
-- GUC 'app.enc_key' uzerinden gelir (bkz. rls.ts setSessionContext).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint

-- RLS uygulama rolu: superuser DEGIL, BYPASSRLS DEGIL. Superuser/owner RLS'i
-- baypaslar (FORCE bile olsa); bu yuzden uygulama her zaman bu rol uzerinden
-- (dogrudan login ya da SET LOCAL ROLE ile) sorgu calistirmali.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shifahub_app') THEN
    CREATE ROLE shifahub_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT;
  END IF;
END $$;
--> statement-breakpoint

GRANT USAGE ON SCHEMA public TO shifahub_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO shifahub_app;
--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO shifahub_app;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO shifahub_app;
--> statement-breakpoint

-- Yardimci fonksiyonlar (SECURITY INVOKER, STABLE): GUC'lari guvenli okur.
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid
  LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_is_admin() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_role', true), '') = 'admin'
$$;
--> statement-breakpoint
-- Egitmenin bir danisana aktif bakim iliskisi var mi?
CREATE OR REPLACE FUNCTION app_has_care(target_danisan uuid) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM care_relationship cr
    WHERE cr.danisan_id = target_danisan
      AND cr.egitmen_id = app_current_user_id()
      AND cr.status = 'active'
  )
$$;
--> statement-breakpoint

-- ========================= care_relationship =========================
ALTER TABLE care_relationship ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE care_relationship FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY care_rel_rls ON care_relationship FOR ALL
  USING (danisan_id = app_current_user_id() OR egitmen_id = app_current_user_id() OR app_is_admin())
  WITH CHECK (egitmen_id = app_current_user_id() OR app_is_admin());
--> statement-breakpoint

-- ========================= danisan =========================
ALTER TABLE danisan ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE danisan FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY danisan_rls ON danisan FOR ALL
  USING (
    user_id = app_current_user_id()
    OR app_is_admin()
    OR app_has_care(user_id)
  )
  WITH CHECK (user_id = app_current_user_id() OR app_is_admin());
--> statement-breakpoint

-- ========================= randevu =========================
ALTER TABLE randevu ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE randevu FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY randevu_rls ON randevu FOR ALL
  USING (danisan_id = app_current_user_id() OR egitmen_id = app_current_user_id() OR app_is_admin())
  WITH CHECK (danisan_id = app_current_user_id() OR egitmen_id = app_current_user_id() OR app_is_admin());
--> statement-breakpoint

-- ========================= tedavi =========================
ALTER TABLE tedavi ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE tedavi FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tedavi_rls ON tedavi FOR ALL
  USING (danisan_id = app_current_user_id() OR egitmen_id = app_current_user_id() OR app_is_admin())
  WITH CHECK (egitmen_id = app_current_user_id() OR app_is_admin());
--> statement-breakpoint

-- ========================= tahlil =========================
ALTER TABLE tahlil ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE tahlil FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tahlil_rls ON tahlil FOR ALL
  USING (danisan_id = app_current_user_id() OR app_has_care(danisan_id) OR app_is_admin())
  WITH CHECK (app_has_care(danisan_id) OR app_is_admin());
--> statement-breakpoint

-- ========================= odeme =========================
ALTER TABLE odeme ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE odeme FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY odeme_rls ON odeme FOR ALL
  USING (danisan_id = app_current_user_id() OR egitmen_id = app_current_user_id() OR app_is_admin())
  WITH CHECK (egitmen_id = app_current_user_id() OR app_is_admin());
--> statement-breakpoint

-- ========================= komplikasyon =========================
ALTER TABLE komplikasyon ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE komplikasyon FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY komplikasyon_rls ON komplikasyon FOR ALL
  USING (danisan_id = app_current_user_id() OR egitmen_id = app_current_user_id() OR app_is_admin())
  WITH CHECK (egitmen_id = app_current_user_id() OR app_is_admin());
--> statement-breakpoint

-- ========================= protokol =========================
ALTER TABLE protokol ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE protokol FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY protokol_rls ON protokol FOR ALL
  USING (danisan_id = app_current_user_id() OR egitmen_id = app_current_user_id() OR app_is_admin())
  WITH CHECK (egitmen_id = app_current_user_id() OR app_is_admin());
--> statement-breakpoint

-- ========================= mesaj =========================
ALTER TABLE mesaj ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE mesaj FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY mesaj_rls ON mesaj FOR ALL
  USING (sender_id = app_current_user_id() OR receiver_id = app_current_user_id() OR app_is_admin())
  WITH CHECK (sender_id = app_current_user_id() OR app_is_admin());
--> statement-breakpoint

-- ========================= bildirim =========================
ALTER TABLE bildirim ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE bildirim FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
-- Okuma/guncelleme sahibe; insert sistem/worker (admin context) tarafindan.
CREATE POLICY bildirim_rls ON bildirim FOR ALL
  USING (user_id = app_current_user_id() OR app_is_admin())
  WITH CHECK (app_is_admin());
--> statement-breakpoint

-- ========================= kvkk_consent =========================
ALTER TABLE kvkk_consent ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE kvkk_consent FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY kvkk_consent_rls ON kvkk_consent FOR ALL
  USING (user_id = app_current_user_id() OR app_is_admin())
  WITH CHECK (user_id = app_current_user_id() OR app_is_admin());
--> statement-breakpoint

-- ========================= audit_log (append-only) =========================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY audit_select ON audit_log FOR SELECT USING (app_is_admin());
--> statement-breakpoint
CREATE POLICY audit_insert ON audit_log FOR INSERT WITH CHECK (true);
--> statement-breakpoint
-- UPDATE/DELETE policy YOK -> FORCE RLS ile audit_log salt-ekleme (append-only).
GRANT EXECUTE ON FUNCTION app_current_user_id(), app_is_admin(), app_has_care(uuid) TO shifahub_app;
--> statement-breakpoint

-- ========================= Randevu cakisma kontrolu =========================
-- Cift-rezervasyon kontrolu RLS altinda calismaz: bir danisan, ayni egitmenin
-- BASKA danisanlarla olan randevularini goremez (RLS gizler), bu yuzden cakismayi
-- tespit edemez. Cozum: yalnizca BOOLEAN donduren, satir sizdirmayan bir
-- SECURITY DEFINER fonksiyon (BYPASSRLS rol sahipli).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shifahub_definer') THEN
    CREATE ROLE shifahub_definer NOLOGIN NOSUPERUSER BYPASSRLS NOINHERIT;
  END IF;
END $$;
--> statement-breakpoint
GRANT shifahub_definer TO CURRENT_USER;
--> statement-breakpoint
GRANT SELECT ON randevu TO shifahub_definer;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION egitmen_has_conflict(
  p_egitmen uuid,
  p_start timestamp,
  p_end timestamp,
  p_exclude uuid DEFAULT NULL
) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM randevu r
    WHERE r.egitmen_id = p_egitmen
      AND r.status NOT IN ('cancelled', 'no_show')
      AND r.scheduled_at < p_end
      AND r.end_at > p_start
      AND (p_exclude IS NULL OR r.id <> p_exclude)
  )
$$;
--> statement-breakpoint
ALTER FUNCTION egitmen_has_conflict(uuid, timestamp, timestamp, uuid) OWNER TO shifahub_definer;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION egitmen_has_conflict(uuid, timestamp, timestamp, uuid) TO shifahub_app;
