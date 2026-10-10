-- PAYOUT METHODS
CREATE TABLE public.payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('mpesa','airtel','mtn','bank','paypal','card','nexapay')),
  label text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  currency text NOT NULL DEFAULT 'KES',
  is_default boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_methods TO authenticated;
GRANT ALL ON public.payout_methods TO service_role;
ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY payout_methods_select_own ON public.payout_methods FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY payout_methods_insert_own ON public.payout_methods FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY payout_methods_update_own ON public.payout_methods FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY payout_methods_delete_own ON public.payout_methods FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER trg_payout_methods_updated BEFORE UPDATE ON public.payout_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PAYOUT REQUESTS
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  method_id uuid REFERENCES public.payout_methods(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','rejected','cancelled')),
  note text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY payout_requests_select_own ON public.payout_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY payout_requests_admin_update ON public.payout_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_payout_requests_updated BEFORE UPDATE ON public.payout_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REVENUE LOGS
CREATE TABLE public.creator_revenue_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL CHECK (source IN ('video','live','post','music','gift','ads','other')),
  amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  country text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.creator_revenue_logs TO authenticated;
GRANT ALL ON public.creator_revenue_logs TO service_role;
ALTER TABLE public.creator_revenue_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY creator_revenue_select_own ON public.creator_revenue_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_creator_revenue_user_date ON public.creator_revenue_logs (user_id, occurred_at DESC);

-- OTP CODES (backend only)
CREATE TABLE public.payout_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL,
  payload jsonb,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payout_otp_codes TO service_role;
ALTER TABLE public.payout_otp_codes ENABLE ROW LEVEL SECURITY;

-- SUMMARY HELPER
CREATE OR REPLACE FUNCTION public.payout_summary()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_earned', COALESCE((SELECT SUM(amount) FROM public.creator_revenue_logs WHERE user_id = auth.uid()), 0),
    'pending', COALESCE((SELECT SUM(amount) FROM public.payout_requests WHERE user_id = auth.uid() AND status IN ('pending','processing')), 0),
    'withdrawn', COALESCE((SELECT SUM(amount) FROM public.payout_requests WHERE user_id = auth.uid() AND status = 'paid'), 0),
    'available', GREATEST(
      COALESCE((SELECT SUM(amount) FROM public.creator_revenue_logs WHERE user_id = auth.uid()), 0)
      - COALESCE((SELECT SUM(amount) FROM public.payout_requests WHERE user_id = auth.uid() AND status IN ('pending','processing','paid')), 0), 0)
  );
$$;
