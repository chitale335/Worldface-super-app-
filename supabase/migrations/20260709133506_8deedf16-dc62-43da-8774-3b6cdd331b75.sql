
DROP POLICY IF EXISTS "Anyone read invite by token" ON public.community_invites;
REVOKE SELECT ON public.community_invites FROM anon;

CREATE POLICY "Staff read community invites"
ON public.community_invites FOR SELECT
TO authenticated
USING (public.is_community_staff(community_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.get_community_invite_by_token(_token text)
RETURNS public.community_invites
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.community_invites
  WHERE token = _token
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_invite_by_token(text) TO anon, authenticated;
