-- ============ COMMUNITY EARNINGS TYPES ============
-- Enum for earnings types per community
CREATE TYPE public.community_earnings_type AS ENUM (
  'membership_fee',      -- Subscription/membership fees
  'post_ads',           -- Ad revenue from posts
  'sponsored_post',     -- Sponsored post payments
  'gift_tips',          -- Tips from community members
  'marketplace_sales',  -- Sales from marketplace within group
  'premium_content',    -- Premium content access fees
  'event_tickets',      -- Event/livestream ticket sales
  'creator_fund',       -- Revenue from creator fund
  'merchandise',        -- Merchandise sales
  'donations',          -- Direct donations
  'referral_bonus',     -- Referral commissions
  'challenge_rewards'   -- Rewards from challenges/competitions
);

-- ============ COMMUNITY EARNINGS TRACKING ============
CREATE TABLE public.community_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  earnings_type public.community_earnings_type NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  description TEXT,
  source_id UUID,                    -- Link to post, event, marketplace item, etc.
  source_type TEXT,                  -- 'post', 'event', 'marketplace_item', 'challenge', etc.
  is_processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_earnings_community ON public.community_earnings(community_id);
CREATE INDEX idx_community_earnings_user ON public.community_earnings(user_id);
CREATE INDEX idx_community_earnings_type ON public.community_earnings(earnings_type);
CREATE INDEX idx_community_earnings_created ON public.community_earnings(created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_earnings TO authenticated;
GRANT SELECT ON public.community_earnings TO anon;
GRANT ALL ON public.community_earnings TO service_role;
ALTER TABLE public.community_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Community members view community earnings"
ON public.community_earnings FOR SELECT
TO authenticated
USING (
  public.is_community_member(community_id, auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Users insert their own earnings"
ON public.community_earnings FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_community_member(community_id, auth.uid())
);

CREATE POLICY "Staff update earnings"
ON public.community_earnings FOR UPDATE
TO authenticated
USING (
  public.is_community_staff(community_id, auth.uid())
  OR user_id = auth.uid()
);

-- ============ COMMUNITY EARNINGS SUMMARY ============
CREATE TABLE public.community_earnings_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL UNIQUE REFERENCES public.communities(id) ON DELETE CASCADE,
  total_earned DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_available DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (total_available >= 0),
  total_withdrawn DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (total_withdrawn >= 0),
  total_pending DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (total_pending >= 0),
  earnings_by_type JSONB NOT NULL DEFAULT '{}',  -- {membership_fee: 1000, post_ads: 500, ...}
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_earnings_summary_community ON public.community_earnings_summary(community_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_earnings_summary TO authenticated;
GRANT SELECT ON public.community_earnings_summary TO anon;
GRANT ALL ON public.community_earnings_summary TO service_role;
ALTER TABLE public.community_earnings_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community admins view summary"
ON public.community_earnings_summary FOR SELECT
TO authenticated
USING (
  public.is_community_staff(community_id, auth.uid())
  OR community_id IN (SELECT id FROM public.communities WHERE owner_id = auth.uid())
);

-- ============ COMMUNITY EARNINGS DISTRIBUTION ============
CREATE TABLE public.community_earnings_distribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  earnings_type public.community_earnings_type NOT NULL,
  share_percentage DECIMAL(5, 2) NOT NULL CHECK (share_percentage >= 0 AND share_percentage <= 100),
  distribution_status TEXT NOT NULL DEFAULT 'active' CHECK (distribution_status IN ('active', 'paused', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_earnings_distribution_community ON public.community_earnings_distribution(community_id);
CREATE INDEX idx_earnings_distribution_recipient ON public.community_earnings_distribution(recipient_user_id);
CREATE UNIQUE INDEX idx_earnings_distribution_unique ON public.community_earnings_distribution(community_id, recipient_user_id, earnings_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_earnings_distribution TO authenticated;
GRANT SELECT ON public.community_earnings_distribution TO anon;
GRANT ALL ON public.community_earnings_distribution TO service_role;
ALTER TABLE public.community_earnings_distribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only staff configure distributions"
ON public.community_earnings_distribution FOR ALL
TO authenticated
USING (
  public.is_community_staff(community_id, auth.uid())
);

-- ============ HELPER FUNCTIONS ============

-- Record earnings and update summary
CREATE OR REPLACE FUNCTION public.record_community_earning(
  _community_id UUID,
  _user_id UUID,
  _earnings_type public.community_earnings_type,
  _amount DECIMAL,
  _currency TEXT DEFAULT 'KES',
  _description TEXT DEFAULT NULL,
  _source_id UUID DEFAULT NULL,
  _source_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _earning_id UUID;
BEGIN
  -- Insert earning
  INSERT INTO public.community_earnings (
    community_id, user_id, earnings_type, amount, currency, description, source_id, source_type
  ) VALUES (
    _community_id, _user_id, _earnings_type, _amount, _currency, _description, _source_id, _source_type
  )
  RETURNING id INTO _earning_id;

  -- Update summary
  INSERT INTO public.community_earnings_summary (community_id, total_earned, earnings_by_type)
  VALUES (
    _community_id,
    _amount,
    jsonb_build_object(_earnings_type::text, _amount)
  )
  ON CONFLICT (community_id) DO UPDATE SET
    total_earned = community_earnings_summary.total_earned + _amount,
    earnings_by_type = community_earnings_summary.earnings_by_type || 
      jsonb_build_object(
        _earnings_type::text,
        COALESCE((community_earnings_summary.earnings_by_type ->> _earnings_type::text)::DECIMAL, 0) + _amount
      ),
    last_updated = now(),
    updated_at = now();

  RETURN _earning_id;
END;
$$;

-- Get earnings summary for a community
CREATE OR REPLACE FUNCTION public.get_community_earnings_summary(_community_id UUID)
RETURNS TABLE (
  total_earned DECIMAL,
  total_available DECIMAL,
  total_withdrawn DECIMAL,
  total_pending DECIMAL,
  earnings_by_type JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ces.total_earned,
    ces.total_available,
    ces.total_withdrawn,
    ces.total_pending,
    ces.earnings_by_type
  FROM public.community_earnings_summary ces
  WHERE ces.community_id = _community_id;
END;
$$;

-- Update trigger for timestamps
CREATE TRIGGER update_community_earnings_timestamp
BEFORE UPDATE ON public.community_earnings
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_community_earnings_summary_timestamp
BEFORE UPDATE ON public.community_earnings_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_community_earnings_distribution_timestamp
BEFORE UPDATE ON public.community_earnings_distribution
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();
