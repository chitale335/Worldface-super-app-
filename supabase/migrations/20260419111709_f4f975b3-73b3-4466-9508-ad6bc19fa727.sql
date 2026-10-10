-- 1. Fix broken conversations SELECT policy
DROP POLICY IF EXISTS "Users can see conversations they participate in" ON public.conversations;
CREATE POLICY "Users can see conversations they participate in"
ON public.conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
  )
);

-- 2. Lock down hashtags update policy (only allow use_count via server-side functions)
DROP POLICY IF EXISTS "Authenticated users can update hashtag counts" ON public.hashtags;

-- 3. Restrict post_hashtags to post owners only
DROP POLICY IF EXISTS "Authenticated users can tag posts" ON public.post_hashtags;
DROP POLICY IF EXISTS "Authenticated users can untag posts" ON public.post_hashtags;

CREATE POLICY "Post owners can tag their posts"
ON public.post_hashtags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_hashtags.post_id AND posts.user_id = auth.uid()
  )
);

CREATE POLICY "Post owners can untag their posts"
ON public.post_hashtags FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_hashtags.post_id AND posts.user_id = auth.uid()
  )
);

-- 4. Avatar storage delete policy
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 5. Realtime channel authorization
-- Users can only subscribe to channels they own (notifications, wallet, messages)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only join their own private channels"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  -- Allow access to topics that include the user's own UID
  realtime.topic() LIKE '%' || (auth.uid())::text || '%'
  -- Or public post-gift channels (post-gifts-<post_id>)
  OR realtime.topic() LIKE 'post-gifts-%'
  -- Or messages/comments that already have RLS enforcement at the table level via postgres_changes
  OR realtime.topic() LIKE 'messages%'
  OR realtime.topic() LIKE 'comments%'
);

CREATE POLICY "Users can broadcast to their own channels"
ON realtime.messages FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE '%' || (auth.uid())::text || '%'
  OR realtime.topic() LIKE 'post-gifts-%'
);