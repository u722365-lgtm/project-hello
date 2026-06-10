-- WhatsApp QR (WhatsApp Web-style) connection support
ALTER TABLE public.whatsapp_links
  ADD COLUMN IF NOT EXISTS connection_type TEXT NOT NULL DEFAULT 'twilio',
  ADD COLUMN IF NOT EXISTS instance_name TEXT,
  ADD COLUMN IF NOT EXISTS qr_status TEXT,
  ADD COLUMN IF NOT EXISTS wa_jid TEXT;

COMMENT ON COLUMN public.whatsapp_links.connection_type IS 'twilio = OTP via Twilio sandbox; qr = Evolution API / WhatsApp Web QR';
COMMENT ON COLUMN public.whatsapp_links.instance_name IS 'Evolution API instance id (st-{userId})';
COMMENT ON COLUMN public.whatsapp_links.qr_status IS 'pending | scanned | connected | expired | disconnected';

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_links_instance_name
  ON public.whatsapp_links (instance_name)
  WHERE instance_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_links_connection_type
  ON public.whatsapp_links (connection_type);
