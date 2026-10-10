
-- Restrict system_settings SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone reads system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated reads system settings" ON public.system_settings;

CREATE POLICY "Authenticated reads system settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.system_settings FROM anon;
