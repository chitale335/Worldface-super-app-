-- Wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id);

-- No direct insert/update/delete policies — only via security definer functions

CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('transfer', 'welcome_bonus', 'gift');

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID,
  recipient_id UUID NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  type public.transaction_type NOT NULL DEFAULT 'transfer',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_tx_recipient ON public.wallet_transactions(recipient_id, created_at DESC);
CREATE INDEX idx_wallet_tx_sender ON public.wallet_transactions(sender_id, created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.wallet_transactions FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Function: create wallet for new user with welcome bonus
CREATE OR REPLACE FUNCTION public.handle_new_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 1000);
  INSERT INTO public.wallet_transactions (recipient_id, amount, type, note)
  VALUES (NEW.id, 1000, 'welcome_bonus', 'Welcome to NexaPay! Here are 1000 coins to get started.');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_wallet
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_wallet();

-- Backfill wallets for existing users
INSERT INTO public.wallets (user_id, balance)
SELECT id, 1000 FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.wallets)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.wallet_transactions (recipient_id, amount, type, note)
SELECT u.id, 1000, 'welcome_bonus', 'Welcome to NexaPay! Here are 1000 coins to get started.'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallet_transactions t
  WHERE t.recipient_id = u.id AND t.type = 'welcome_bonus'
);

-- Atomic transfer function
CREATE OR REPLACE FUNCTION public.transfer_coins(
  _recipient_id UUID,
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
  _sender_balance BIGINT;
  _tx_id UUID;
BEGIN
  IF _sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _sender_id = _recipient_id THEN
    RAISE EXCEPTION 'Cannot send coins to yourself';
  END IF;
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE user_id = _recipient_id) THEN
    RAISE EXCEPTION 'Recipient wallet not found';
  END IF;

  SELECT balance INTO _sender_balance FROM public.wallets WHERE user_id = _sender_id FOR UPDATE;
  IF _sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender wallet not found';
  END IF;
  IF _sender_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE public.wallets SET balance = balance - _amount WHERE user_id = _sender_id;
  UPDATE public.wallets SET balance = balance + _amount WHERE user_id = _recipient_id;

  INSERT INTO public.wallet_transactions (sender_id, recipient_id, amount, type, note)
  VALUES (_sender_id, _recipient_id, _amount, 'transfer', _note)
  RETURNING id INTO _tx_id;

  RETURN _tx_id;
END;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;