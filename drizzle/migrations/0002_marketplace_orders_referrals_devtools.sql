CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- STORES
CREATE TABLE public.stores (
  owner_id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stores_name_len CHECK (char_length(name) BETWEEN 2 AND 80),
  CONSTRAINT stores_slug_fmt CHECK (slug ~ '^[a-z0-9-]{3,40}$')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users view stores" ON public.stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners create store" ON public.stores FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update store" ON public.stores FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete store" ON public.stores FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER stores_updated BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price bigint NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  location text,
  images text[] NOT NULL DEFAULT '{}',
  stock integer NOT NULL DEFAULT 1,
  is_digital boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_title_len CHECK (char_length(title) BETWEEN 2 AND 120),
  CONSTRAINT products_desc_len CHECK (char_length(description) <= 4000),
  CONSTRAINT products_price_pos CHECK (price > 0 AND price <= 100000000),
  CONSTRAINT products_stock_nonneg CHECK (stock >= 0),
  CONSTRAINT products_status_v CHECK (status IN ('active','hidden','sold_out'))
);
CREATE INDEX products_seller_idx ON public.products(seller_id);
CREATE INDEX products_active_idx ON public.products(status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View active or own products" ON public.products FOR SELECT TO authenticated USING (status <> 'hidden' OR seller_id = auth.uid());
CREATE POLICY "Sellers create products" ON public.products FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers update products" ON public.products FOR UPDATE TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers delete products" ON public.products FOR DELETE TO authenticated USING (seller_id = auth.uid());
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_title text NOT NULL,
  product_image text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price bigint NOT NULL,
  total bigint NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  note text,
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_v CHECK (status IN ('pending','paid','shipped','delivered','completed','cancelled','refunded'))
);
CREATE INDEX orders_buyer_idx ON public.orders(buyer_id, created_at DESC);
CREATE INDEX orders_seller_idx ON public.orders(seller_id, created_at DESC);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyer or seller views order" ON public.orders FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Place order: atomic wallet debit + seller credit
CREATE OR REPLACE FUNCTION public.place_order(_product_id uuid, _quantity integer DEFAULT 1, _note text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _buyer uuid := auth.uid();
  _p public.products%ROWTYPE;
  _total bigint;
  _bal bigint;
  _tx uuid;
  _order uuid;
BEGIN
  IF _buyer IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 100 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  SELECT * INTO _p FROM public.products WHERE id = _product_id FOR UPDATE;
  IF NOT FOUND OR _p.status <> 'active' THEN RAISE EXCEPTION 'Product not available'; END IF;
  IF _p.seller_id = _buyer THEN RAISE EXCEPTION 'You cannot buy your own product'; END IF;
  IF NOT _p.is_digital AND _p.stock < _quantity THEN RAISE EXCEPTION 'Not enough stock'; END IF;
  _total := _p.price * _quantity;
  SELECT balance INTO _bal FROM public.wallets WHERE user_id = _buyer FOR UPDATE;
  IF _bal IS NULL THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF _bal < _total THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE user_id = _p.seller_id) THEN RAISE EXCEPTION 'Seller wallet not found'; END IF;

  UPDATE public.wallets SET balance = balance - _total WHERE user_id = _buyer;
  UPDATE public.wallets SET balance = balance + _total WHERE user_id = _p.seller_id;
  INSERT INTO public.wallet_transactions (sender_id, recipient_id, amount, type, note)
  VALUES (_buyer, _p.seller_id, _total, 'transfer', 'Marketplace: ' || left(_p.title, 80)) RETURNING id INTO _tx;

  IF NOT _p.is_digital THEN
    UPDATE public.products SET stock = stock - _quantity,
      status = CASE WHEN stock - _quantity <= 0 THEN 'sold_out' ELSE status END
    WHERE id = _p.id;
  END IF;

  INSERT INTO public.orders (buyer_id, seller_id, product_id, product_title, product_image, quantity, unit_price, total, status, note, transaction_id)
  VALUES (_buyer, _p.seller_id, _p.id, _p.title, _p.images[1], _quantity, _p.price, _total,
          CASE WHEN _p.is_digital THEN 'delivered' ELSE 'paid' END, left(_note, 500), _tx)
  RETURNING id INTO _order;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (_buyer, 'order.paid', 'order', _order::text, jsonb_build_object('total', _total, 'seller', _p.seller_id, 'tx', _tx));
  RETURN _order;
END $$;
REVOKE ALL ON FUNCTION public.place_order(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(uuid, integer, text) TO authenticated;

-- Update order status with role-based transitions
CREATE OR REPLACE FUNCTION public.update_order_status(_order_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _o public.orders%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF _uid = _o.seller_id THEN
    IF NOT ((_o.status = 'paid' AND _status IN ('shipped','refunded'))
         OR (_o.status = 'shipped' AND _status = 'delivered')
         OR (_o.status = 'delivered' AND _status = 'refunded')) THEN
      RAISE EXCEPTION 'Invalid status change';
    END IF;
  ELSIF _uid = _o.buyer_id THEN
    IF NOT (_o.status IN ('shipped','delivered') AND _status = 'completed') THEN
      RAISE EXCEPTION 'Invalid status change';
    END IF;
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF _status = 'refunded' THEN
    IF (SELECT balance FROM public.wallets WHERE user_id = _o.seller_id FOR UPDATE) < _o.total THEN
      RAISE EXCEPTION 'Insufficient seller balance for refund';
    END IF;
    UPDATE public.wallets SET balance = balance - _o.total WHERE user_id = _o.seller_id;
    UPDATE public.wallets SET balance = balance + _o.total WHERE user_id = _o.buyer_id;
    INSERT INTO public.wallet_transactions (sender_id, recipient_id, amount, type, note)
    VALUES (_o.seller_id, _o.buyer_id, _o.total, 'transfer', 'Refund: ' || left(_o.product_title, 80));
  END IF;

  UPDATE public.orders SET status = _status WHERE id = _order_id;
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (_uid, 'order.' || _status, 'order', _order_id::text, jsonb_build_object('from', _o.status));
END $$;
REVOKE ALL ON FUNCTION public.update_order_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text) TO authenticated;

-- REFERRALS
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  code text NOT NULL,
  reward bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX referrals_referrer_idx ON public.referrals(referrer_id);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrer or referred views referral" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE OR REPLACE FUNCTION public.claim_referral(_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _prefix text;
  _referrer uuid;
  _reward bigint := 20;
  _created timestamptz;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _code IS NULL OR upper(_code) !~ '^WF-[0-9A-F]{8}$' THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = _uid) THEN RETURN false; END IF;
  SELECT created_at INTO _created FROM public.profiles WHERE user_id = _uid;
  IF _created IS NULL OR _created < now() - interval '7 days' THEN RETURN false; END IF;
  _prefix := lower(substr(upper(_code), 4));
  SELECT user_id INTO _referrer FROM public.profiles
    WHERE substr(replace(user_id::text, '-', ''), 1, 8) = _prefix LIMIT 1;
  IF _referrer IS NULL OR _referrer = _uid THEN RETURN false; END IF;
  INSERT INTO public.referrals (referrer_id, referred_id, code, reward) VALUES (_referrer, _uid, upper(_code), _reward);
  UPDATE public.wallets SET balance = balance + _reward WHERE user_id = _referrer;
  INSERT INTO public.wallet_transactions (sender_id, recipient_id, amount, type, note)
  VALUES (NULL, _referrer, _reward, 'welcome_bonus', 'Referral reward');
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;

-- API KEYS
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT api_keys_name_len CHECK (char_length(name) BETWEEN 1 AND 60)
);
CREATE INDEX api_keys_user_idx ON public.api_keys(user_id);
GRANT SELECT ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view api keys" ON public.api_keys FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_api_key(_name text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  _uid uuid := auth.uid();
  _raw text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF (SELECT count(*) FROM public.api_keys WHERE user_id = _uid AND revoked_at IS NULL) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 active keys';
  END IF;
  _raw := 'wf_live_' || encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.api_keys (user_id, name, prefix, key_hash)
  VALUES (_uid, left(trim(_name), 60), left(_raw, 14), encode(extensions.digest(_raw, 'sha256'), 'hex'));
  INSERT INTO public.audit_logs (actor_id, action, entity_type, metadata) VALUES (_uid, 'api_key.created', 'api_key', jsonb_build_object('name', _name));
  RETURN _raw;
END $$;
REVOKE ALL ON FUNCTION public.create_api_key(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_api_key(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_api_key(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.api_keys SET revoked_at = now() WHERE id = _id AND user_id = auth.uid() AND revoked_at IS NULL;
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id) VALUES (auth.uid(), 'api_key.revoked', 'api_key', _id::text);
END $$;
REVOKE ALL ON FUNCTION public.revoke_api_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_api_key(uuid) TO authenticated;

-- WEBHOOKS
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{order.created,order.paid,payment.received}',
  secret text NOT NULL DEFAULT ('whsec_' || encode(extensions.gen_random_bytes(24), 'hex')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhooks_url_https CHECK (url ~ '^https://[^\s]{4,500}$')
);
CREATE INDEX webhooks_user_idx ON public.webhooks(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks TO authenticated;
GRANT ALL ON public.webhooks TO service_role;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view webhooks" ON public.webhooks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners create webhooks" ON public.webhooks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners update webhooks" ON public.webhooks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners delete webhooks" ON public.webhooks FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER webhooks_updated BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status_code integer,
  response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX webhook_deliveries_hook_idx ON public.webhook_deliveries(webhook_id, created_at DESC);
GRANT SELECT ON public.webhook_deliveries TO authenticated;
GRANT ALL ON public.webhook_deliveries TO service_role;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view deliveries" ON public.webhook_deliveries FOR SELECT TO authenticated USING (user_id = auth.uid());