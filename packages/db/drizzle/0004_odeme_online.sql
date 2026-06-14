-- Online ödeme: ödeme kaydına gateway sağlayıcı + işlem referansı eklenir.
-- method="kart" + provider dolu => online (kart) ödeme; provider null => elden/havale.
ALTER TABLE odeme ADD COLUMN IF NOT EXISTS provider varchar(20);
--> statement-breakpoint
ALTER TABLE odeme ADD COLUMN IF NOT EXISTS provider_ref varchar(120);
--> statement-breakpoint
-- Danışanın kendi ödemesini online (demo) kapatması: odeme RLS WITH CHECK yalnız
-- eğitmen/admin'e UPDATE izni verir. Bu yüzden ödeme onayı; sahiplik + referansı
-- KENDİ İÇİNDE doğrulayan SECURITY DEFINER fonksiyonla yapılır (egitmen_has_conflict
-- / user_has_active_consent deseni). Fonksiyon yalnızca demo-referansı eşleşen, çağıran
-- danışana ait ödemeyi "paid" yapar; başka satıra dokunamaz.
GRANT SELECT, UPDATE ON odeme TO shifahub_definer;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION confirm_demo_payment(
  p_odeme uuid,
  p_user uuid,
  p_ref varchar
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner uuid;
  v_status payment_status;
  v_expected varchar;
BEGIN
  SELECT danisan_id, status INTO v_owner, v_status FROM odeme WHERE id = p_odeme;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_owner <> p_user THEN RETURN false; END IF;
  v_expected := 'demo_' || substr(replace(p_odeme::text, '-', ''), 1, 12);
  IF p_ref <> v_expected THEN RETURN false; END IF;
  IF v_status = 'paid' THEN RETURN true; END IF;
  UPDATE odeme
     SET paid_amount = amount,
         status = 'paid',
         method = 'kart',
         provider = 'demo',
         provider_ref = p_ref,
         paid_at = now(),
         updated_at = now()
   WHERE id = p_odeme;
  RETURN true;
END;
$$;
--> statement-breakpoint
ALTER FUNCTION confirm_demo_payment(uuid, uuid, varchar) OWNER TO shifahub_definer;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION confirm_demo_payment(uuid, uuid, varchar) TO shifahub_app;
