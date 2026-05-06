
-- Drop any leftover anon policies (idempotent)
DROP POLICY IF EXISTS "Anon can insert missed calls" ON public.missed_calls;
DROP POLICY IF EXISTS "Anon can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Anon can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anon can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anon can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Anon can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Anon can upsert system_health" ON public.system_health;
DROP POLICY IF EXISTS "Anon can update system_health" ON public.system_health;
DROP POLICY IF EXISTS "Anon can insert system_health" ON public.system_health;

-- Service role write policies (edge functions)
CREATE POLICY "Service role writes missed_calls" ON public.missed_calls
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role writes messages" ON public.messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role writes conversations" ON public.conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role writes referrals" ON public.referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role writes system_health" ON public.system_health
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages scheduled_messages" ON public.scheduled_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Schema gaps
ALTER TABLE public.missed_calls ADD COLUMN IF NOT EXISTS voicemail_transcript text;
ALTER TABLE public.scheduled_messages ADD COLUMN IF NOT EXISTS to_number text;

-- Backfill to_number from caller_number for existing rows
UPDATE public.scheduled_messages SET to_number = caller_number WHERE to_number IS NULL;
