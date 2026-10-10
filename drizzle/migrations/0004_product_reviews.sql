CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (char_length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_reviews_product_idx ON public.product_reviews(product_id);
CREATE INDEX product_reviews_seller_idx ON public.product_reviews(seller_id);
GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Buyers review completed orders" ON public.product_reviews FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid() AND o.status = 'completed'
      AND o.seller_id = product_reviews.seller_id AND o.product_id IS NOT DISTINCT FROM product_reviews.product_id));
CREATE POLICY "Buyers edit own reviews" ON public.product_reviews FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Buyers delete own reviews" ON public.product_reviews FOR DELETE TO authenticated USING (buyer_id = auth.uid());
CREATE TRIGGER product_reviews_updated_at BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.lock_review_refs() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.order_id := OLD.order_id; NEW.product_id := OLD.product_id; NEW.seller_id := OLD.seller_id; NEW.buyer_id := OLD.buyer_id;
  RETURN NEW;
END $$;
CREATE TRIGGER product_reviews_lock BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.lock_review_refs();