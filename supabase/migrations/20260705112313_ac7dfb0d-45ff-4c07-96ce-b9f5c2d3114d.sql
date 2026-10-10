
-- Add new profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS professional_badges TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';

-- Username uniqueness (case-insensitive) — only for non-null usernames
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles ((lower(username)))
  WHERE username IS NOT NULL;

-- Language check
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_language_check
  CHECK (preferred_language IN ('en','sw'));

-- Protect the "verified" column: only admins can toggle it.
-- We replace the existing self-update policy with a version that blocks changes to `verified`,
-- and add a separate admin-only policy that can change verified status.
CREATE OR REPLACE FUNCTION public.prevent_verified_self_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can change verified status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_verified_self_change ON public.profiles;
CREATE TRIGGER profiles_prevent_verified_self_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_verified_self_change();
