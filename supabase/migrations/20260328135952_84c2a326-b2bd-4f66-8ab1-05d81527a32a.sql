
-- Profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  role text DEFAULT 'agency_owner',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  industry text DEFAULT 'general',
  avg_job_value numeric DEFAULT 300,
  respondfall_number text,
  business_number text,
  booking_link text,
  google_review_link text,
  sms_template text DEFAULT 'Hey, {business_name} here — sorry we missed you! Book here: {booking_link}. Reply STOP.',
  send_delay_seconds int DEFAULT 5,
  blackout_start int DEFAULT 22,
  blackout_end int DEFAULT 7,
  twilio_sid text,
  system_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own clients" ON public.clients
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own clients" ON public.clients
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own clients" ON public.clients
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Missed calls table
CREATE TABLE public.missed_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  caller_number text NOT NULL,
  called_at timestamptz DEFAULT now(),
  sequence_triggered boolean DEFAULT false,
  voicemail_url text
);

ALTER TABLE public.missed_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view missed calls" ON public.missed_calls
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = missed_calls.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Service role can insert missed calls" ON public.missed_calls
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = missed_calls.client_id AND clients.owner_id = auth.uid()));

-- Allow edge functions (anon) to insert missed calls
CREATE POLICY "Anon can insert missed calls" ON public.missed_calls
  FOR INSERT TO anon WITH CHECK (true);

-- Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  caller_number text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body text NOT NULL,
  step_label text,
  ai_generated boolean DEFAULT false,
  sent_at timestamptz DEFAULT now(),
  twilio_sid text
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view messages" ON public.messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = messages.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Owners can insert messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = messages.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Anon can insert messages" ON public.messages
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Owners can delete messages" ON public.messages
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = messages.client_id AND clients.owner_id = auth.uid()));

-- Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  caller_number text NOT NULL,
  status text DEFAULT 'active',
  intent text,
  urgency text,
  appt_confirmed boolean DEFAULT false,
  sequence_step int DEFAULT 0,
  last_reply_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, caller_number)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = conversations.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Owners can update conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = conversations.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Owners can insert conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = conversations.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Anon can insert conversations" ON public.conversations
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update conversations" ON public.conversations
  FOR UPDATE TO anon USING (true);

-- Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  referrer_number text,
  referred_name text,
  referral_code text UNIQUE,
  status text DEFAULT 'sms_sent',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = referrals.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Owners can insert referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = referrals.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Anon can insert referrals" ON public.referrals
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update referrals" ON public.referrals
  FOR UPDATE TO anon USING (true);

-- System health table
CREATE TABLE public.system_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  last_webhook_ping timestamptz,
  last_successful_send timestamptz,
  consecutive_failures int DEFAULT 0,
  last_error text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view system health" ON public.system_health
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = system_health.client_id AND clients.owner_id = auth.uid()));

CREATE POLICY "Anon can upsert system health" ON public.system_health
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update system health" ON public.system_health
  FOR UPDATE TO anon USING (true);

-- Enable realtime for messages and missed_calls
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missed_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
