
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/New_York';

CREATE TABLE IF NOT EXISTS public.opt_outs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  caller_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, caller_number)
);
ALTER TABLE public.opt_outs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view opt outs" ON public.opt_outs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = opt_outs.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Owners delete opt outs" ON public.opt_outs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = opt_outs.client_id AND clients.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  caller_number text NOT NULL,
  body text NOT NULL,
  step_label text,
  send_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scheduled_messages_due_idx ON public.scheduled_messages (status, send_at);
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view scheduled" ON public.scheduled_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = scheduled_messages.client_id AND clients.owner_id = auth.uid()));

ALTER TABLE public.missed_calls ADD COLUMN IF NOT EXISTS call_sid text;
CREATE UNIQUE INDEX IF NOT EXISTS missed_calls_call_sid_unique ON public.missed_calls(call_sid) WHERE call_sid IS NOT NULL;
ALTER TABLE public.missed_calls ADD COLUMN IF NOT EXISTS recording_url text;
ALTER TABLE public.missed_calls ADD COLUMN IF NOT EXISTS transcript text;

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS twilio_number_sid text;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
