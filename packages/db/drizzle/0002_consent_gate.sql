-- KVKK consent-gate: tedavi/tahlil (saglik verisi) olusturmadan once danisanin
-- 'saglik_verisi_isleme' acik rizasi dogrulanir. Ancak RLS, egitmenin danisan
-- kvkk_consent satirini gormesini engeller (policy: user_id = current_user OR admin).
-- egitmen_has_conflict deseni: yalnizca BOOLEAN donduren, satir sizdirmayan
-- SECURITY DEFINER fonksiyon (BYPASSRLS rol sahipli shifahub_definer).
GRANT SELECT ON kvkk_consent TO shifahub_definer;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION user_has_active_consent(
  p_user uuid,
  p_purpose varchar
) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM kvkk_consent kc
    WHERE kc.user_id = p_user
      AND kc.purpose = p_purpose
      AND kc.status = 'active'
      AND (kc.expires_at IS NULL OR kc.expires_at > now())
  )
$$;
--> statement-breakpoint
ALTER FUNCTION user_has_active_consent(uuid, varchar) OWNER TO shifahub_definer;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION user_has_active_consent(uuid, varchar) TO shifahub_app;
