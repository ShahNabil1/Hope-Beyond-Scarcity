DROP POLICY "Anyone can read published legal pages" ON public.legal_pages;

CREATE POLICY "Anyone can read published legal pages"
  ON public.legal_pages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can read all legal pages"
  ON public.legal_pages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));