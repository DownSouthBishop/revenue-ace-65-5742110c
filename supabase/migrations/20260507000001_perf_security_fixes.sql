-- ============================================================
-- Performance: add indexes on hot query paths
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_missed_calls_client_id
  ON public.missed_calls (client_id);

CREATE INDEX IF NOT EXISTS idx_missed_calls_called_at
  ON public.missed_calls (called_at DESC);

CREATE INDEX IF NOT EXISTS idx_missed_calls_call_sid
  ON public.missed_calls (call_sid)
  WHERE call_sid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_client_id
  ON public.messages (client_id);

CREATE INDEX IF NOT EXISTS idx_messages_sent_at
  ON public.messages (sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_caller_number
  ON public.messages (client_id, caller_number);

CREATE INDEX IF NOT EXISTS idx_messages_direction
  ON public.messages (client_id, direction);

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_due
  ON public.scheduled_messages (status, send_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_opt_outs_lookup
  ON public.opt_outs (client_id, caller_number);

CREATE INDEX IF NOT EXISTS idx_usage_counters_lookup
  ON public.usage_counters (user_id, metric, period_start);

-- ============================================================
-- Security: remove overly-permissive anon INSERT policies.
-- Edge functions use service_role key which bypasses RLS
-- entirely — these anon policies are unnecessary and dangerous.
-- Any authenticated webhook flow uses service_role, not anon.
-- ============================================================

DROP POLICY IF EXISTS "Anon can insert missed calls" ON public.missed_calls;
DROP POLICY IF EXISTS "Anon can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Anon can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anon can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anon can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Anon can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Anon can upsert system health" ON public.system_health;
DROP POLICY IF EXISTS "Anon can update system health" ON public.system_health;

-- ============================================================
-- Reliability: atomic usage counter increment.
-- Replaces the read-then-write pattern in twilio-webhook
-- which has a race condition under concurrent calls.
-- Call via: SELECT increment_usage_counter(...)
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_user_id    uuid,
  p_client_id  uuid,
  p_metric     text,
  p_period_start timestamptz,
  p_period_end   timestamptz
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.usage_counters
    (user_id, client_id, metric, period_start, period_end, count, updated_at)
  VALUES
    (p_user_id, p_client_id, p_metric, p_period_start, p_period_end, 1, now())
  ON CONFLICT (user_id, metric, period_start)
  DO UPDATE SET
    count      = public.usage_counters.count + 1,
    updated_at = now();
$$;

-- Only service_role (edge functions) should call this directly.
-- Revoke from client-facing roles.
REVOKE EXECUTE ON FUNCTION public.increment_usage_counter(uuid, uuid, text, timestamptz, timestamptz)
  FROM anon, authenticated;
