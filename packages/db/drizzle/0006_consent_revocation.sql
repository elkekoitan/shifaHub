-- KVKK açık rıza geri çekme otomasyonu (PRD 27.3): danışan 'saglik_verisi_isleme'
-- rızasını çektiğinde bekleyen randevuları iptal et + bakım ilişkilerini sonlandır.
-- Danışan rolü randevu/care_relationship RLS WITH CHECK ile bunları doğrudan
-- güncelleyemez; bu yüzden sahiplik kendi içinde kapılanan SECURITY DEFINER fonksiyon
-- (confirm_demo_payment / user_has_active_consent deseni). Yalnızca ÇAĞIRAN kullanıcının
-- kendi (p_user) satırlarına dokunur.
GRANT SELECT, UPDATE ON randevu TO shifahub_definer;
--> statement-breakpoint
GRANT SELECT, UPDATE ON care_relationship TO shifahub_definer;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION apply_consent_revocation(p_user uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_randevu int := 0;
  v_care int := 0;
BEGIN
  -- Gelecekteki/bekleyen randevuları iptal et (arrived/treated/completed dokunulmaz).
  UPDATE randevu
     SET status = 'cancelled',
         status_changed_at = now(),
         cancelled_by = p_user,
         cancel_reason = 'KVKK açık rıza geri çekildi',
         updated_at = now()
   WHERE danisan_id = p_user
     AND status IN ('requested', 'confirmed', 'reminded', 'ertelendi');
  GET DIAGNOSTICS v_randevu = ROW_COUNT;

  -- Aktif bakım ilişkilerini sonlandır (eğitmen klinik veri erişimi kapanır).
  UPDATE care_relationship
     SET status = 'ended',
         updated_at = now()
   WHERE danisan_id = p_user
     AND status = 'active';
  GET DIAGNOSTICS v_care = ROW_COUNT;

  RETURN jsonb_build_object('cancelledRandevu', v_randevu, 'endedCare', v_care);
END;
$$;
--> statement-breakpoint
ALTER FUNCTION apply_consent_revocation(uuid) OWNER TO shifahub_definer;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION apply_consent_revocation(uuid) TO shifahub_app;
