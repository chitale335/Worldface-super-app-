-- Community Planning ("Mipango ya Jamii")
-- Plans/events owned by a community. Optional monetisation is wired into the
-- existing community earnings system, and creating a paid plan requires the
-- creator to accept the Terms & Conditions.

CREATE TABLE IF NOT EXISTS public.community_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 140),
  description TEXT,
  plan_type TEXT NOT NULL DEFAULT 'event' CHECK (plan_type IN ('event', 'meetup', 'project', 'challenge')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  location TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  ticket_price NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (ticket_price >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  -- earning category recorded through record_community_earning() when the plan completes
  earnings_type TEXT,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_plans_community
  ON public.community_plans(community_id, starts_at DESC);

CREATE TABLE IF NOT EXISTS public.community_plan_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.community_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp TEXT NOT NULL DEFAULT 'going' CHECK (rsvp IN ('going', 'maybe', 'declined')),
  is_organizer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_plan_participants_plan
  ON public.community_plan_participants(plan_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_plans TO authenticated;
GRANT SELECT ON public.community_plans TO anon;
GRANT ALL ON public.community_plans TO service_role;
ALTER TABLE public.community_plans ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_plan_participants TO authenticated;
GRANT ALL ON public.community_plan_participants TO service_role;
ALTER TABLE public.community_plan_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View plans of viewable communities" ON public.community_plans FOR SELECT
  USING (public.can_view_community_posts(community_id, auth.uid()));

CREATE POLICY "Members create plans" ON public.community_plans FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_community_member(community_id, auth.uid()));

CREATE POLICY "Organizers update plans" ON public.community_plans FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "Organizers delete plans" ON public.community_plans FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "View participants of viewable plans" ON public.community_plan_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.community_plans p
    WHERE p.id = plan_id AND public.can_view_community_posts(p.community_id, auth.uid())
  ));

CREATE POLICY "Members rsvp to plans" ON public.community_plan_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own rsvp" ON public.community_plan_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users remove their own rsvp" ON public.community_plan_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_community_plan() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_community_plan ON public.community_plans;
CREATE TRIGGER trg_touch_community_plan
  BEFORE UPDATE ON public.community_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_community_plan();
