
-- Remove permissive anon policies and use service_role in edge functions instead
DROP POLICY IF EXISTS "Anon can insert missed calls" ON public.missed_calls;
DROP POLICY IF EXISTS "Anon can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Anon can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anon can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anon can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Anon can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Anon can upsert system health" ON public.system_health;
DROP POLICY IF EXISTS "Anon can update system health" ON public.system_health;

-- Add service_role bypass policies (service_role bypasses RLS by default, but let's be explicit)
-- Edge functions will use SUPABASE_SERVICE_ROLE_KEY
-- Add owner insert policy for system_health
CREATE POLICY "Owners can insert system health" ON public.system_health
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = system_health.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Owners can update system health" ON public.system_health
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = system_health.client_id AND clients.owner_id = auth.uid()));

-- Add delete policies for conversations and referrals
CREATE POLICY "Owners can delete conversations" ON public.conversations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = conversations.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Owners can delete referrals" ON public.referrals
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = referrals.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Owners can delete missed calls" ON public.missed_calls
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = missed_calls.client_id AND clients.owner_id = auth.uid()));
