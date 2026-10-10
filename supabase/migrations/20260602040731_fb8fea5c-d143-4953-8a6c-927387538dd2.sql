-- Fix: any authenticated user could join any conversation
DROP POLICY IF EXISTS "Authenticated users can add participants" ON public.conversation_participants;

CREATE POLICY "Users can only add themselves as participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Safe RPC to start a direct conversation between caller and another user
CREATE OR REPLACE FUNCTION public.start_direct_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  existing_conv uuid;
  new_conv uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF other_user_id IS NULL OR other_user_id = me THEN
    RAISE EXCEPTION 'Invalid other user';
  END IF;

  -- Look for existing 1:1 conversation containing both users
  SELECT cp1.conversation_id INTO existing_conv
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = me AND cp2.user_id = other_user_id
  LIMIT 1;

  IF existing_conv IS NOT NULL THEN
    RETURN existing_conv;
  END IF;

  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO new_conv;
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (new_conv, me), (new_conv, other_user_id);

  RETURN new_conv;
END;
$$;

REVOKE ALL ON FUNCTION public.start_direct_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_direct_conversation(uuid) TO authenticated;
