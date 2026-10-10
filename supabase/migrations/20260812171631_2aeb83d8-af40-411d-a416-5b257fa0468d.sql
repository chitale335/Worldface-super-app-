DROP POLICY IF EXISTS "View non-secret or joined communities" ON public.communities;

CREATE POLICY "View open or joined communities"
ON public.communities
FOR SELECT
USING (
  type NOT IN ('secret'::community_type, 'private'::community_type)
  OR public.is_community_member(id, auth.uid())
  OR owner_id = auth.uid()
);