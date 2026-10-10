DROP POLICY IF EXISTS "Authenticated reads system settings" ON public.system_settings;
CREATE POLICY "Admins read system settings" ON public.system_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Members public" ON public.cultural_group_members;
CREATE POLICY "Members visible to signed-in users" ON public.cultural_group_members FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);