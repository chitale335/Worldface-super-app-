
-- ============ ENUMS ============
CREATE TYPE public.community_type AS ENUM (
  'public','private','secret','business','school','fan_club','gaming','marketplace','local','verified_org'
);
CREATE TYPE public.community_member_role AS ENUM (
  'owner','admin','moderator','editor','expert','member','guest'
);
CREATE TYPE public.community_member_status AS ENUM ('active','pending','banned');

-- ============ COMMUNITIES ============
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,60}$'),
  description TEXT,
  cover_url TEXT,
  avatar_url TEXT,
  type public.community_type NOT NULL DEFAULT 'public',
  category TEXT,
  language TEXT,
  country TEXT,
  city TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  monthly_price_coins BIGINT NOT NULL DEFAULT 0 CHECK (monthly_price_coins >= 0),
  member_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  rules TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_communities_type ON public.communities(type);
CREATE INDEX idx_communities_country ON public.communities(country);
CREATE INDEX idx_communities_category ON public.communities(category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT SELECT ON public.communities TO anon;
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- ============ MEMBERS ============
CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.community_member_role NOT NULL DEFAULT 'member',
  status public.community_member_status NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);
CREATE INDEX idx_cm_user ON public.community_members(user_id);
CREATE INDEX idx_cm_community ON public.community_members(community_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY DEFINER HELPERS ============
CREATE OR REPLACE FUNCTION public.is_community_member(_community_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = _community_id AND user_id = _user_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_community_role(_community_id UUID, _user_id UUID)
RETURNS public.community_member_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.community_members
  WHERE community_id = _community_id AND user_id = _user_id AND status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_view_community(_community_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = _community_id AND (
      c.type IN ('public','business','school','fan_club','gaming','marketplace','local','verified_org')
      OR c.type = 'private'
      OR (_user_id IS NOT NULL AND public.is_community_member(c.id, _user_id))
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_community_posts(_community_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = _community_id AND (
      c.type IN ('public','business','school','fan_club','gaming','marketplace','local','verified_org')
      OR (_user_id IS NOT NULL AND public.is_community_member(c.id, _user_id))
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_staff(_community_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = _community_id AND user_id = _user_id AND status = 'active'
      AND role IN ('owner','admin','moderator')
  );
$$;

-- ============ COMMUNITY POLICIES ============
CREATE POLICY "View non-secret or joined communities"
ON public.communities FOR SELECT
USING (
  type <> 'secret'
  OR (auth.uid() IS NOT NULL AND public.is_community_member(id, auth.uid()))
);

CREATE POLICY "Authenticated users create communities"
ON public.communities FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners and admins update community"
ON public.communities FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR public.get_community_role(id, auth.uid()) IN ('admin'))
WITH CHECK (owner_id = auth.uid() OR public.get_community_role(id, auth.uid()) IN ('admin'));

CREATE POLICY "Owner deletes community"
ON public.communities FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- ============ MEMBER POLICIES ============
CREATE POLICY "Members visible to community viewers"
ON public.community_members FOR SELECT
USING (
  user_id = auth.uid()
  OR public.can_view_community_posts(community_id, auth.uid())
);

CREATE POLICY "Users join public/business-style communities"
ON public.community_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_id
      AND c.type IN ('public','business','school','fan_club','gaming','marketplace','local','verified_org')
  )
);

CREATE POLICY "Staff manage members"
ON public.community_members FOR UPDATE
TO authenticated
USING (public.is_community_staff(community_id, auth.uid()))
WITH CHECK (public.is_community_staff(community_id, auth.uid()));

CREATE POLICY "Members leave or staff removes"
ON public.community_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_community_staff(community_id, auth.uid())
);

-- ============ POSTS ============
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  media_types TEXT[] NOT NULL DEFAULT '{}',
  poll JSONB,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_announcement BOOLEAN NOT NULL DEFAULT false,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cp_community ON public.community_posts(community_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT SELECT ON public.community_posts TO anon;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View posts of viewable communities"
ON public.community_posts FOR SELECT
USING (public.can_view_community_posts(community_id, auth.uid()));

CREATE POLICY "Members create posts"
ON public.community_posts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_community_member(community_id, auth.uid()));

CREATE POLICY "Author or staff update posts"
ON public.community_posts FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_community_staff(community_id, auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_community_staff(community_id, auth.uid()));

CREATE POLICY "Author or staff delete posts"
ON public.community_posts FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_community_staff(community_id, auth.uid()));

-- ============ POST LIKES ============
CREATE TABLE public.community_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.community_post_likes TO authenticated;
GRANT ALL ON public.community_post_likes TO service_role;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View likes on viewable posts"
ON public.community_post_likes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.community_posts p
  WHERE p.id = post_id AND public.can_view_community_posts(p.community_id, auth.uid())
));

CREATE POLICY "Members like posts"
ON public.community_post_likes FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.id = post_id AND public.is_community_member(p.community_id, auth.uid())
  )
);

CREATE POLICY "Unlike own like"
ON public.community_post_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============ COMMENTS ============
CREATE TABLE public.community_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  parent_comment_id UUID REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cpc_post ON public.community_post_comments(post_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_post_comments TO authenticated;
GRANT SELECT ON public.community_post_comments TO anon;
GRANT ALL ON public.community_post_comments TO service_role;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View comments on viewable posts"
ON public.community_post_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.community_posts p
  WHERE p.id = post_id AND public.can_view_community_posts(p.community_id, auth.uid())
));

CREATE POLICY "Members comment"
ON public.community_post_comments FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.id = post_id AND public.is_community_member(p.community_id, auth.uid())
  )
);

CREATE POLICY "Author updates own comment"
ON public.community_post_comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Author or staff delete comment"
ON public.community_post_comments FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.id = post_id AND public.is_community_staff(p.community_id, auth.uid())
  )
);

-- ============ JOIN REQUESTS ============
CREATE TABLE public.community_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_join_requests TO authenticated;
GRANT ALL ON public.community_join_requests TO service_role;
ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester or staff view requests"
ON public.community_join_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_community_staff(community_id, auth.uid()));

CREATE POLICY "Users create own request"
ON public.community_join_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff update requests"
ON public.community_join_requests FOR UPDATE
TO authenticated
USING (public.is_community_staff(community_id, auth.uid()))
WITH CHECK (public.is_community_staff(community_id, auth.uid()));

CREATE POLICY "Requester or staff delete request"
ON public.community_join_requests FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_community_staff(community_id, auth.uid()));

-- ============ INVITES ============
CREATE TABLE public.community_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_invites TO authenticated;
GRANT SELECT ON public.community_invites TO anon;
GRANT ALL ON public.community_invites TO service_role;
ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read invite by token"
ON public.community_invites FOR SELECT
USING (true);

CREATE POLICY "Staff create invites"
ON public.community_invites FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid() AND public.is_community_staff(community_id, auth.uid()));

CREATE POLICY "Staff delete invites"
ON public.community_invites FOR DELETE
TO authenticated
USING (public.is_community_staff(community_id, auth.uid()));

-- ============ TRIGGERS ============
-- Assign owner as first member
CREATE OR REPLACE FUNCTION public.handle_new_community()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_new_community
AFTER INSERT ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.handle_new_community();

-- Member count maintenance
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE public.communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'active' AND OLD.status <> 'active' THEN
      UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
    ELSIF OLD.status = 'active' AND NEW.status <> 'active' THEN
      UPDATE public.communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = NEW.community_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_cm_count
AFTER INSERT OR UPDATE OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- Post count maintenance
CREATE OR REPLACE FUNCTION public.update_community_post_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET post_count = post_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.community_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_cp_count
AFTER INSERT OR DELETE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.update_community_post_count();

-- Post like count maintenance
CREATE OR REPLACE FUNCTION public.update_cp_like_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_cpl_count
AFTER INSERT OR DELETE ON public.community_post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_cp_like_count();

-- Comment count maintenance
CREATE OR REPLACE FUNCTION public.update_cp_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_cpc_count
AFTER INSERT OR DELETE ON public.community_post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_cp_comment_count();

-- updated_at
CREATE TRIGGER trg_communities_updated BEFORE UPDATE ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cp_updated BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cpc_updated BEFORE UPDATE ON public.community_post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;
