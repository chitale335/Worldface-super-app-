ALTER TABLE public.wallet_transactions ADD COLUMN post_id UUID;
CREATE INDEX idx_wallet_tx_post ON public.wallet_transactions(post_id) WHERE post_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.gift_post(
  _post_id UUID,
  _amount BIGINT,
  _note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender_id UUID := auth.uid();
  _creator_id UUID;
  _sender_balance BIGINT;
  _tx_id UUID;
BEGIN
  IF _sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT user_id INTO _creator_id FROM public.posts WHERE id = _post_id;
  IF _creator_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  IF _creator_id = _sender_id THEN
    RAISE EXCEPTION 'Cannot gift your own post';
  END IF;

  SELECT balance INTO _sender_balance FROM public.wallets WHERE user_id = _sender_id FOR UPDATE;
  IF _sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender wallet not found';
  END IF;
  IF _sender_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE public.wallets SET balance = balance - _amount WHERE user_id = _sender_id;
  UPDATE public.wallets SET balance = balance + _amount WHERE user_id = _creator_id;

  INSERT INTO public.wallet_transactions (sender_id, recipient_id, amount, type, note, post_id)
  VALUES (_sender_id, _creator_id, _amount, 'gift', _note, _post_id)
  RETURNING id INTO _tx_id;

  RETURN _tx_id;
END;
$$;