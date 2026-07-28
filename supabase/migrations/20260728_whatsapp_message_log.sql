BEGIN;

CREATE TABLE IF NOT EXISTS public.whatsapp_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT NOT NULL CHECK (provider IN ('evolution','twilio')),
  instance_name TEXT,
  phone_number TEXT NOT NULL,
  message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('outbound','inbound')),
  category TEXT NOT NULL CHECK (category IN ('payment','launch','otp','support','system')),
  reference_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed','retrying')),
  provider_status TEXT,
  attempts INT NOT NULL DEFAULT 1,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_phone_number ON public.whatsapp_message_log (phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_reference_id ON public.whatsapp_message_log (reference_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_status ON public.whatsapp_message_log (status);

COMMENT ON TABLE public.whatsapp_message_log IS 'Audit log + retry state for all WhatsApp sends across Twilio and Evolution paths.';
COMMENT ON COLUMN public.whatsapp_message_log.category IS 'Business category: payment, launch, otp, support, system';
COMMIT;
