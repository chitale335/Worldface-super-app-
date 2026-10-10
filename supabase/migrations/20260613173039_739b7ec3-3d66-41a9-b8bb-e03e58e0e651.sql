
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'verified_creator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'artist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business';
