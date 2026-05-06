-- Revoke EXECUTE on SECURITY DEFINER helpers from client-facing roles.
-- These functions are only meant to be called by triggers or RLS policies
-- (which run as the function owner), never directly via the API.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- Restrictive policy: even if some other policy ever permitted INSERT on user_roles
-- for authenticated users, this RESTRICTIVE policy denies it. Only service_role
-- (which bypasses RLS) and the existing admin policy may grant roles.
DROP POLICY IF EXISTS "No self-grant role" ON public.user_roles;
CREATE POLICY "No self-grant role"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

-- Document service_role-only write tables for future maintainers.
COMMENT ON TABLE public.usage_counters IS 'Writes via service_role only (stripe-webhook, sequence-runner). Authenticated users may SELECT their own row.';
COMMENT ON TABLE public.webhook_events IS 'Writes via service_role only (idempotency log for stripe-webhook). Not exposed to clients.';