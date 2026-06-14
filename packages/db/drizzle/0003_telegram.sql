-- Telegram entegrasyonu: danışanın bağladığı Telegram sohbet kimliği (chat id).
-- /start <userId> deep-link akışıyla doldurulur; bildirim worker'ı buraya mesaj atar.
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id varchar(32);
