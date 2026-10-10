ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS escrow_status text NOT NULL DEFAULT 'released';
ALTER TABLE public.orders ADD CONSTRAINT orders_escrow_status_chk CHECK (escrow_status IN ('held','released','refunded'));

CREATE OR REPLACE FUNCTION public.place_order(_product_id uuid, _quantity integer DEFAULT 1, _note text DEFAULT NULL::text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _buyer uuid := auth.uid();
  _p public.products%ROWTYPE;
  _total bigint; _bal bigint; _tx uuid; _order uuid;
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
  IF _p.is_digital THEN
    UPDATE public.wallets SET balance = balance + _total WHERE user_id = _p.seller_id;
    INSERT INTO public.wallet_transactions (sender_id, recipient_id, amount, type, note)
    VALUES (_buyer, _p.seller_id, _total, 'transfer', 'Marketplace: ' || left(_p.title, 80)) RETURNING id INTO _tx;
  ELSE
    UPDATE public.products SET stock = stock - _quantity,
      status = CASE WHEN stock - _quantity <= 0 THEN 'sold_out' ELSE status END
    WHERE id = _p.id;
  END IF;

  INSERT INTO public.orders (buyer_id, seller_id, product_id, product_title, product_image, quantity, unit_price, total, status, note, transaction_id, escrow_status)
  VALUES (_buyer, _p.seller_id, _p.id, _p.title, _p.images[1], _quantity, _p.price, _total,
          CASE WHEN _p.is_digital THEN 'delivered' ELSE 'paid' END, left(_note, 500), _tx,
          CASE WHEN _p.is_digital THEN 'released' ELSE 'held' END)
  RETURNING id INTO _order;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (_buyer, CASE WHEN _p.is_digital THEN 'order.paid' ELSE 'order.escrow_held' END, 'order', _order::text,
          jsonb_build_object('total', _total, 'seller', _p.seller_id, 'tx', _tx));
  RETURN _order;
END $function$;

CREATE OR REPLACE FUNCTION public.update_order_status(_order_id uuid, _status text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _o public.orders%ROWTYPE;
  _tx uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF _uid = _o.seller_id THEN
    IF NOT ((_o.status = 'paid' AND _status IN ('shipped','refunded'))
         OR (_o.status = 'shipped' AND _status IN ('delivered','refunded'))
         OR (_o.status = 'delivered' AND _status = 'refunded')) THEN
      RAISE EXCEPTION 'Invalid status change';
    END IF;
  ELSIF _uid = _o.buyer_id THEN
    IF NOT ((_o.status IN ('shipped','delivered') AND _status = 'completed')
         OR (_o.status = 'paid' AND _status = 'cancelled' AND _o.escrow_status = 'held')) THEN
      RAISE EXCEPTION 'Invalid status change';
    END IF;
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF _status IN ('refunded','cancelled') THEN
    IF _o.escrow_status = 'held' THEN
      UPDATE public.wallets SET balance = balance + _o.total WHERE user_id = _o.buyer_id;
      INSERT INTO public.wallet_transactions (sender_id, recipient_id, amount, type, note)
      VALUES (NULL, _o.buyer_id, _o.total, 'transfer', 'Escrow refund: ' || left(_o.product_title, 80));
      UPDATE public.orders SET escrow_status = 'refunded' WHERE id = _order_id;
    ELSE
      IF (SELECT balance FROM public.wallets WHERE user_id = _o.seller_id FOR UPDATE) < _o.total THEN
        RAISE EXCEPTION 'Insufficient seller balance for refund';
      END IF;
      UPDATE public.wallets SET balance = balance - _o.total WHERE user_id = _o.seller_id;
      UPDATE public.wallets SET balance = balance + _o.total WHERE user_id = _o.buyer_id;
      INSERT INTO public.wallet_transactions (sender_id, recipient_id, amount, type, note)
      VALUES (_o.seller_id, _o.buyer_id, _o.total, 'transfer', 'Refund: ' || left(_o.product_title, 80));
      UPDATE public.orders SET escrow_status = 'refunded' WHERE id = _order_id;
    END IF;
    IF _o.product_id IS NOT NULL THEN
      UPDATE public.products SET stock = stock + _o.quantity,
        status = CASE WHEN status = 'sold_out' THEN 'active' ELSE status END
      WHERE id = _o.product_id AND NOT is_digital;
    END IF;
  ELSIF _status = 'completed' AND _o.escrow_status = 'held' THEN
    UPDATE public.wallets SET balance = balance + _o.total WHERE user_id = _o.seller_id;
    INSERT INTO public.wallet_transactions (sender_id, recipient_id, amount, type, note)
    VALUES (_o.buyer_id, _o.seller_id, _o.total, 'transfer', 'Escrow release: ' || left(_o.product_title, 80)) RETURNING id INTO _tx;
    UPDATE public.orders SET escrow_status = 'released', transaction_id = _tx WHERE id = _order_id;
  END IF;

  UPDATE public.orders SET status = _status WHERE id = _order_id;
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (_uid, 'order.' || _status, 'order', _order_id::text, jsonb_build_object('from', _o.status, 'escrow', _o.escrow_status));
END $function$;