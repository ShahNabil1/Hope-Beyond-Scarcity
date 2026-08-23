ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}';

DROP POLICY IF EXISTS "Anyone can read program images" ON storage.objects;
CREATE POLICY "Anyone can read program images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'program-images');

DROP POLICY IF EXISTS "Staff can upload program images" ON storage.objects;
CREATE POLICY "Staff can upload program images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'program-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));

DROP POLICY IF EXISTS "Staff can update program images" ON storage.objects;
CREATE POLICY "Staff can update program images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'program-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')))
WITH CHECK (bucket_id = 'program-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));

DROP POLICY IF EXISTS "Staff can delete program images" ON storage.objects;
CREATE POLICY "Staff can delete program images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'program-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));