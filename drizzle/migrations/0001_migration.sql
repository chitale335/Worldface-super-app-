DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by signed-in users" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public read media buckets" ON storage.objects;
CREATE POLICY "Owners can list their media files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = ANY (ARRAY['covers','stories','music','albums','apps','app-screenshots','marketplace'])
    AND owner_id = (select auth.uid()::text)
  );