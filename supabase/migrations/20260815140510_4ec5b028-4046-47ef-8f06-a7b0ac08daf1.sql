-- Premium flags on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_until timestamptz;

-- AI consents: user permission per AI capability
CREATE TABLE IF NOT EXISTS public.ai_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scope)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_consents TO authenticated;
GRANT ALL ON public.ai_consents TO service_role;
ALTER TABLE public.ai_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai consents" ON public.ai_consents FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI memory (only written when the user granted the 'memory' scope)
CREATE TABLE IF NOT EXISTS public.ai_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL DEFAULT 'core',
  kind text NOT NULL DEFAULT 'fact',
  content text NOT NULL,
  importance int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memories TO authenticated;
GRANT ALL ON public.ai_memories TO service_role;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai memories" ON public.ai_memories FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ai_memories_user_idx ON public.ai_memories (user_id, created_at DESC);

-- AI safety log
CREATE TABLE IF NOT EXISTS public.ai_safety_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  verdict text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_safety_logs TO authenticated;
GRANT ALL ON public.ai_safety_logs TO service_role;
ALTER TABLE public.ai_safety_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own safety logs" ON public.ai_safety_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Proposed AI actions: AI never executes, user must approve
CREATE TABLE IF NOT EXISTS public.ai_action_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_action_requests TO authenticated;
GRANT ALL ON public.ai_action_requests TO service_role;
ALTER TABLE public.ai_action_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai actions" ON public.ai_action_requests FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- In-app ads
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  media_url text,
  cta_label text NOT NULL DEFAULT 'Learn more',
  cta_route text,
  objective text NOT NULL DEFAULT 'awareness',
  placement text NOT NULL DEFAULT 'app_open',
  priority int NOT NULL DEFAULT 5,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  currency text NOT NULL DEFAULT 'KES',
  budget_total numeric(12,2) NOT NULL DEFAULT 0,
  spend numeric(12,2) NOT NULL DEFAULT 0,
  cpm numeric(12,2) NOT NULL DEFAULT 0,
  ai_estimate jsonb,
  status text NOT NULL DEFAULT 'draft',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  impressions int NOT NULL DEFAULT 0,
  clicks int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_campaigns TO authenticated;
GRANT ALL ON public.ad_campaigns TO service_role;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage campaigns" ON public.ad_campaigns FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "active campaigns readable" ON public.ad_campaigns FOR SELECT TO authenticated
  USING (status = 'active' AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

CREATE TABLE IF NOT EXISTS public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ad_events TO authenticated;
GRANT ALL ON public.ad_events TO service_role;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users log own ad events" ON public.ad_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners read ad events" ON public.ad_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.ad_campaigns c WHERE c.id = campaign_id AND c.owner_id = auth.uid()
  ));
CREATE INDEX IF NOT EXISTS ad_events_campaign_idx ON public.ad_events (campaign_id, created_at DESC);

-- Metrics counter (definer so counters update without exposing UPDATE on campaigns)
CREATE OR REPLACE FUNCTION public.record_ad_event(_campaign_id uuid, _event text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF _event NOT IN ('impression','click','dismiss') THEN RAISE EXCEPTION 'Invalid event'; END IF;

  INSERT INTO public.ad_events (campaign_id, user_id, event) VALUES (_campaign_id, auth.uid(), _event);

  IF _event = 'impression' THEN
    UPDATE public.ad_campaigns
       SET impressions = impressions + 1,
           spend = LEAST(budget_total, spend + (cpm / 1000.0)),
           updated_at = now()
     WHERE id = _campaign_id;
  ELSIF _event = 'click' THEN
    UPDATE public.ad_campaigns SET clicks = clicks + 1, updated_at = now() WHERE id = _campaign_id;
  END IF;

  UPDATE public.ad_campaigns SET status = 'completed'
   WHERE id = _campaign_id AND budget_total > 0 AND spend >= budget_total AND status = 'active';
END;
$$;
REVOKE ALL ON FUNCTION public.record_ad_event(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_ad_event(uuid, text) TO authenticated;