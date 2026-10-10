
-- Create private contacts table
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_country_code TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_contacts TO authenticated;
GRANT ALL ON public.profile_contacts TO service_role;

ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own contacts" ON public.profile_contacts;
CREATE POLICY "Owner reads own contacts" ON public.profile_contacts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner inserts own contacts" ON public.profile_contacts;
CREATE POLICY "Owner inserts own contacts" ON public.profile_contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner updates own contacts" ON public.profile_contacts;
CREATE POLICY "Owner updates own contacts" ON public.profile_contacts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner deletes own contacts" ON public.profile_contacts;
CREATE POLICY "Owner deletes own contacts" ON public.profile_contacts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS profile_contacts_updated_at ON public.profile_contacts;
CREATE TRIGGER profile_contacts_updated_at
BEFORE UPDATE ON public.profile_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate any existing values then drop the exposed columns
INSERT INTO public.profile_contacts (user_id, phone_country_code, phone_number)
SELECT user_id, phone_country_code, phone_number
FROM public.profiles
WHERE phone_country_code IS NOT NULL OR phone_number IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS phone_country_code,
  DROP COLUMN IF EXISTS phone_number;
