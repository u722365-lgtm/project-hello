BEGIN;

CREATE TABLE IF NOT EXISTS public.whatsapp_send_rate_limit (
  user_id TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id)
);

COMMENT ON TABLE public.whatsapp_send_rate_limit IS 'Per-user daily-ish send windows for WhatsApp notifications.';
COMMIT;
