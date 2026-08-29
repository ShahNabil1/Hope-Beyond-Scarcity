CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  tier text NOT NULL DEFAULT 'Community',
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  contribution_label text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  since_year text NOT NULL DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sponsors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active sponsors" ON public.sponsors
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Staff can view all sponsors" ON public.sponsors
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can insert sponsors" ON public.sponsors
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can update sponsors" ON public.sponsors
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can delete sponsors" ON public.sponsors
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sponsors (name, slug, tier, summary, description, website_url, contribution_label, location, since_year, is_featured, sort_order) VALUES
('Maple Leaf Giving Circle','maple-leaf-giving-circle','Founding','A Toronto donor circle underwriting our monthly family care packages.','Maple Leaf Giving Circle covers the recurring cost of care package logistics so every public donation can go straight to food, hygiene, and school supplies.','','Underwrites monthly logistics','Toronto, ON','2024',true,1),
('Harbourfront Health Group','harbourfront-health-group','Gold','Funds free health camps and medical supplies for field clinics.','Harbourfront Health Group sponsors quarterly health camps, supplying medicines, diagnostics, and volunteer clinician hours alongside our local partners.','','Sponsors 4 health camps a year','Toronto, ON','2025',true,2),
('Riverside Logistics Co-op','riverside-logistics-co-op','Silver','Donated freight and warehousing for seasonal distribution drives.','Riverside Logistics Co-op moves and stores donated goods at no cost during our winter and monsoon response drives.','','Freight & storage in kind','Mississauga, ON','2025',false,3),
('Bengal Health Collective','bengal-health-collective','Silver','On-the-ground medical partner supporting maternal and newborn care.','Bengal Health Collective provides clinicians and community health workers who identify households and follow up after each distribution.','','Clinical staffing support','Khulna, Bangladesh','2024',false,4),
('Northside Family Foundation','northside-family-foundation','Community','Matches first-time donor gifts during our year-end appeal.','Northside Family Foundation matches new donor gifts dollar for dollar each December, doubling the reach of the winter appeal.','','Year-end match partner','Ottawa, ON','2026',false,5);