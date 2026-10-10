
-- Phase 2: Media, Stories, Featured Song

-- Gallery
CREATE TABLE public.profile_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
  caption TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_gallery TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_gallery TO authenticated;
GRANT ALL ON public.profile_gallery TO service_role;
ALTER TABLE public.profile_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gallery public read" ON public.profile_gallery FOR SELECT USING (true);
CREATE POLICY "Gallery owner insert" ON public.profile_gallery FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Gallery owner update" ON public.profile_gallery FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Gallery owner delete" ON public.profile_gallery FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX profile_gallery_user_idx ON public.profile_gallery (user_id, position);

-- Stories
CREATE TABLE public.profile_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
  caption TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_stories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_stories TO authenticated;
GRANT ALL ON public.profile_stories TO service_role;
ALTER TABLE public.profile_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stories public read active" ON public.profile_stories FOR SELECT USING (expires_at > now());
CREATE POLICY "Stories owner insert" ON public.profile_stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Stories owner delete" ON public.profile_stories FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX profile_stories_user_idx ON public.profile_stories (user_id, expires_at DESC);

-- Featured song
CREATE TABLE public.profile_featured_song (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_featured_song TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_featured_song TO authenticated;
GRANT ALL ON public.profile_featured_song TO service_role;
ALTER TABLE public.profile_featured_song ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Featured song public read" ON public.profile_featured_song FOR SELECT USING (true);
CREATE POLICY "Featured song owner upsert" ON public.profile_featured_song FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Featured song owner update" ON public.profile_featured_song FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Featured song owner delete" ON public.profile_featured_song FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_featured_song_updated BEFORE UPDATE ON public.profile_featured_song FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
