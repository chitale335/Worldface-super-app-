
-- 1b: hide account_number from anon (column-level)
REVOKE SELECT (account_number) ON public.profiles FROM anon;

-- 2a: user_roles visible to owner + admins only
DROP POLICY IF EXISTS "User roles viewable by everyone" ON public.user_roles;
REVOKE SELECT ON public.user_roles FROM anon;
CREATE POLICY "Users see own roles, admins see all"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 3a: lock realtime messages topic to conversation participants
DROP POLICY IF EXISTS "Users can only join their own private channels" ON realtime.messages;
CREATE POLICY "Users can only join their own private channels"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE '%' || (auth.uid())::text || '%')
  OR (realtime.topic() LIKE 'post-gifts-%')
  OR (realtime.topic() LIKE 'comments%')
  OR (
    realtime.topic() LIKE 'messages:%'
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.user_id = auth.uid()
        AND cp.conversation_id::text = split_part(realtime.topic(), ':', 2)
    )
  )
);
