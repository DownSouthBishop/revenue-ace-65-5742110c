
-- Owner UPDATE/DELETE on missed_calls
CREATE POLICY "Owners can update missed calls" ON public.missed_calls
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = missed_calls.client_id AND clients.owner_id = auth.uid()));

-- Owner UPDATE on messages
CREATE POLICY "Owners can update messages" ON public.messages
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = messages.client_id AND clients.owner_id = auth.uid()));

-- Owner full control on opt_outs
CREATE POLICY "Owners insert opt outs" ON public.opt_outs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = opt_outs.client_id AND clients.owner_id = auth.uid()));

-- Owner full control on scheduled_messages
CREATE POLICY "Owners insert scheduled" ON public.scheduled_messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = scheduled_messages.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Owners update scheduled" ON public.scheduled_messages
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = scheduled_messages.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Owners delete scheduled" ON public.scheduled_messages
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = scheduled_messages.client_id AND clients.owner_id = auth.uid()));

-- Cap + forwarding settings
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS daily_sms_cap integer NOT NULL DEFAULT 200;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS forward_timeout_seconds integer NOT NULL DEFAULT 18;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS sms_consent_text text DEFAULT 'By providing your number you consent to receive SMS related to your inquiry. Reply STOP to opt out.';

-- Push subscriptions (browser web-push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_client_sent ON public.messages(client_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_missed_calls_client_called ON public.missed_calls(client_id, called_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_pending ON public.scheduled_messages(status, send_at);
CREATE INDEX IF NOT EXISTS idx_opt_outs_lookup ON public.opt_outs(client_id, caller_number);
