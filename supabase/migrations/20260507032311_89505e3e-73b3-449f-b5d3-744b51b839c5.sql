-- 1. Column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_number TEXT UNIQUE;

-- 2. Generator function
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _candidate TEXT;
  _exists BOOLEAN;
BEGIN
  LOOP
    _candidate := 'NX-' || lpad((floor(random() * 100000000))::bigint::text, 8, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE account_number = _candidate) INTO _exists;
    IF NOT _exists THEN
      RETURN _candidate;
    END IF;
  END LOOP;
END;
$$;

-- 3. Backfill existing rows
UPDATE public.profiles
SET account_number = public.generate_account_number()
WHERE account_number IS NULL;

-- 4. Trigger to assign on insert
CREATE OR REPLACE FUNCTION public.assign_account_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_number IS NULL THEN
    NEW.account_number := public.generate_account_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_account_number ON public.profiles;
CREATE TRIGGER trg_assign_account_number
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_account_number();