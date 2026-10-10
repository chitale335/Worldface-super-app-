-- 1. Creator stats table
CREATE TABLE public.creator_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  xp BIGINT NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  total_coins_received BIGINT NOT NULL DEFAULT 0,
  total_likes_received BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator stats are viewable by everyone"
ON public.creator_stats FOR SELECT USING (true);

CREATE TRIGGER update_creator_stats_updated_at
BEFORE UPDATE ON public.creator_stats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Badges catalog
CREATE TYPE public.badge_requirement AS ENUM ('posts', 'likes_received', 'coins_received', 'level', 'followers');

CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type public.badge_requirement NOT NULL,
  requirement_value BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
ON public.badges FOR SELECT USING (true);

-- 3. User badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone"
ON public.user_badges FOR SELECT USING (true);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_creator_stats_xp ON public.creator_stats(xp DESC);
CREATE INDEX idx_creator_stats_coins ON public.creator_stats(total_coins_received DESC);

-- 4. Seed badges
INSERT INTO public.badges (slug, name, description, icon, requirement_type, requirement_value) VALUES
  ('first_post', 'First Post', 'Published your first post', '🎬', 'posts', 1),
  ('rising_star', 'Rising Star', 'Reached level 5', '⭐', 'level', 5),
  ('popular', 'Popular', 'Received 100 likes', '❤️', 'likes_received', 100),
  ('viral', 'Viral', 'Received 1,000 likes', '🔥', 'likes_received', 1000),
  ('big_earner', 'Big Earner', 'Received 500 coins in gifts', '💰', 'coins_received', 500),
  ('coin_king', 'Coin King', 'Received 10,000 coins in gifts', '👑', 'coins_received', 10000),
  ('prolific', 'Prolific', 'Published 10 posts', '✍️', 'posts', 10),
  ('legendary', 'Legendary', 'Reached level 25', '🏆', 'level', 25);

-- 5. Helper: ensure stats row exists
CREATE OR REPLACE FUNCTION public.ensure_creator_stats(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.creator_stats (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 6. Award badges based on current stats
CREATE OR REPLACE FUNCTION public.check_and_award_badges(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _stats RECORD;
  _post_count BIGINT;
  _follower_count BIGINT;
  _badge RECORD;
  _qualifies BOOLEAN;
BEGIN
  SELECT * INTO _stats FROM public.creator_stats WHERE user_id = _user_id;
  IF _stats IS NULL THEN RETURN; END IF;

  SELECT COUNT(*) INTO _post_count FROM public.posts WHERE user_id = _user_id;
  SELECT COUNT(*) INTO _follower_count FROM public.follows WHERE following_id = _user_id;

  FOR _badge IN SELECT * FROM public.badges LOOP
    _qualifies := CASE _badge.requirement_type
      WHEN 'posts' THEN _post_count >= _badge.requirement_value
      WHEN 'likes_received' THEN _stats.total_likes_received >= _badge.requirement_value
      WHEN 'coins_received' THEN _stats.total_coins_received >= _badge.requirement_value
      WHEN 'level' THEN _stats.level >= _badge.requirement_value
      WHEN 'followers' THEN _follower_count >= _badge.requirement_value
      ELSE FALSE
    END;

    IF _qualifies THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (_user_id, _badge.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- 7. Add XP to a user, recompute level, award badges
CREATE OR REPLACE FUNCTION public.award_xp(_user_id UUID, _xp_delta BIGINT, _likes_delta BIGINT DEFAULT 0, _coins_delta BIGINT DEFAULT 0)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_xp BIGINT;
  _new_level INTEGER;
BEGIN
  PERFORM public.ensure_creator_stats(_user_id);

  UPDATE public.creator_stats
  SET xp = xp + GREATEST(_xp_delta, 0),
      total_likes_received = total_likes_received + _likes_delta,
      total_coins_received = total_coins_received + _coins_delta
  WHERE user_id = _user_id
  RETURNING xp INTO _new_xp;

  _new_level := FLOOR(SQRT(_new_xp::numeric / 50)) + 1;

  UPDATE public.creator_stats
  SET level = _new_level
  WHERE user_id = _user_id AND level <> _new_level;

  PERFORM public.check_and_award_badges(_user_id);
END;
$$;

-- 8. Trigger: post creation -> 10 XP
CREATE OR REPLACE FUNCTION public.xp_on_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.award_xp(NEW.user_id, 10);
  RETURN NEW;
END;
$$;

CREATE TRIGGER xp_on_post_insert
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.xp_on_post();

-- 9. Trigger: like received -> creator gets 2 XP + 1 like
CREATE OR REPLACE FUNCTION public.xp_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _creator UUID;
BEGIN
  SELECT user_id INTO _creator FROM public.posts WHERE id = NEW.post_id;
  IF _creator IS NOT NULL AND _creator <> NEW.user_id THEN
    PERFORM public.award_xp(_creator, 2, 1, 0);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER xp_on_like_insert
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.xp_on_like();

-- 10. Trigger: comment received -> creator gets 3 XP
CREATE OR REPLACE FUNCTION public.xp_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _creator UUID;
BEGIN
  SELECT user_id INTO _creator FROM public.posts WHERE id = NEW.post_id;
  IF _creator IS NOT NULL AND _creator <> NEW.user_id THEN
    PERFORM public.award_xp(_creator, 3);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER xp_on_comment_insert
AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.xp_on_comment();

-- 11. Trigger: gift received -> creator gets 1 XP per coin + coin total
CREATE OR REPLACE FUNCTION public.xp_on_gift()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'gift' AND NEW.sender_id IS NOT NULL AND NEW.sender_id <> NEW.recipient_id THEN
    PERFORM public.award_xp(NEW.recipient_id, NEW.amount, 0, NEW.amount);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER xp_on_gift_insert
AFTER INSERT ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.xp_on_gift();