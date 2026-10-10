
-- 1. Wallet accounts: drop permissive policy
DROP POLICY IF EXISTS "Authenticated users view wallet accounts" ON public.wallet_accounts;

-- 2. Posts: add WITH CHECK + trigger guarding immutable metric columns
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.prevent_post_metric_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.like_count IS DISTINCT FROM OLD.like_count
     OR NEW.view_count IS DISTINCT FROM OLD.view_count
     OR NEW.comment_count IS DISTINCT FROM OLD.comment_count
     OR NEW.share_count IS DISTINCT FROM OLD.share_count
     OR NEW.is_trending IS DISTINCT FROM OLD.is_trending
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify engagement metrics or ownership on posts';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_post_metric_tampering ON public.posts;
CREATE TRIGGER prevent_post_metric_tampering
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  WHEN (current_setting('role', true) <> 'service_role')
  EXECUTE FUNCTION public.prevent_post_metric_tampering();

-- 3. Post comments: same treatment
DROP POLICY IF EXISTS "Users can update their own comments" ON public.post_comments;
CREATE POLICY "Users can update their own comments"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.prevent_comment_metric_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.like_count IS DISTINCT FROM OLD.like_count
     OR NEW.post_id IS DISTINCT FROM OLD.post_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.parent_comment_id IS DISTINCT FROM OLD.parent_comment_id THEN
    RAISE EXCEPTION 'Cannot modify like count, post, parent, or ownership on comments';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_comment_metric_tampering ON public.post_comments;
CREATE TRIGGER prevent_comment_metric_tampering
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  WHEN (current_setting('role', true) <> 'service_role')
  EXECUTE FUNCTION public.prevent_comment_metric_tampering();
