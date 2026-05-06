ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent';

CREATE INDEX IF NOT EXISTS idx_messages_twilio_sid ON public.messages (twilio_sid);