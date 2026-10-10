-- Admin role system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "User roles viewable by everyone"
  ON public.user_roles FOR SELECT USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Founder content (singleton, key/value style for bio sections)
CREATE TABLE public.founder_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  body TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founder content viewable by everyone"
  ON public.founder_content FOR SELECT USING (true);

CREATE POLICY "Admins can manage founder content"
  ON public.founder_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Founder songs/discography
CREATE TABLE public.founder_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  year TEXT,
  type TEXT,
  url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Songs viewable by everyone"
  ON public.founder_songs FOR SELECT USING (true);

CREATE POLICY "Admins can manage songs"
  ON public.founder_songs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Founder social links
CREATE TABLE public.founder_socials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  handle TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.founder_socials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Socials viewable by everyone"
  ON public.founder_socials FOR SELECT USING (true);

CREATE POLICY "Admins can manage socials"
  ON public.founder_socials FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Founder code templates
CREATE TABLE public.founder_code_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'tsx',
  code TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_code_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates viewable by everyone"
  ON public.founder_code_templates FOR SELECT USING (true);

CREATE POLICY "Admins can manage templates"
  ON public.founder_code_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
