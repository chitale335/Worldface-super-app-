
DROP POLICY IF EXISTS "Chat media is publicly readable" ON storage.objects;

CREATE POLICY "Chat media readable by uploader or conversation participants"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.conversation_participants cp
        ON cp.conversation_id = m.conversation_id
      WHERE cp.user_id = auth.uid()
        AND m.media_url LIKE '%' || storage.objects.name
    )
  )
);
