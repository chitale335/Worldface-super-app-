
-- Public read for the user-facing buckets
CREATE POLICY "Public read media buckets"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('covers','stories','music','albums','apps','app-screenshots','marketplace'));

-- Authenticated upload (folder = auth.uid())
CREATE POLICY "Users upload to own folder media buckets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('covers','stories','music','albums','apps','app-screenshots','marketplace')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own files media buckets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('covers','stories','music','albums','apps','app-screenshots','marketplace')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own files media buckets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('covers','stories','music','albums','apps','app-screenshots','marketplace')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Private buckets: documents, backups (owner-only)
CREATE POLICY "Users access own documents"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id IN ('documents','backups')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('documents','backups')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
