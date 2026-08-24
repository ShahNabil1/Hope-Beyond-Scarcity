
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_badge text NOT NULL DEFAULT 'Canadian Not-for-Profit Corporation',
  ADD COLUMN IF NOT EXISTS hero_title text NOT NULL DEFAULT 'Every child deserves hope beyond scarcity',
  ADD COLUMN IF NOT EXISTS hero_subtitle text NOT NULL DEFAULT 'We walk with families in under-served villages — delivering care packages, health support and education so children can grow up with dignity, safety and possibility.',
  ADD COLUMN IF NOT EXISTS hero_primary_label text NOT NULL DEFAULT 'Donate Now',
  ADD COLUMN IF NOT EXISTS hero_primary_url text NOT NULL DEFAULT '/donate',
  ADD COLUMN IF NOT EXISTS hero_secondary_label text NOT NULL DEFAULT 'Get Involved',
  ADD COLUMN IF NOT EXISTS hero_secondary_url text NOT NULL DEFAULT '/volunteer',
  ADD COLUMN IF NOT EXISTS hero_trust_note text NOT NULL DEFAULT 'Secure giving. Transparent reporting. 100% of field costs published annually.',
  ADD COLUMN IF NOT EXISTS hero_image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS mission_eyebrow text NOT NULL DEFAULT 'Our Mission',
  ADD COLUMN IF NOT EXISTS mission_title text NOT NULL DEFAULT 'It started with two women and one refusal to look away',
  ADD COLUMN IF NOT EXISTS mission_body_1 text NOT NULL DEFAULT 'Rajasree and Lilibet met over a shared conviction: scarcity is not destiny. What began as a handful of care packages sent from Toronto to a single Bangladeshi village has grown into a community-led movement.',
  ADD COLUMN IF NOT EXISTS mission_body_2 text NOT NULL DEFAULT 'Today, Hope Beyond Scarcity works shoulder-to-shoulder with local leaders, mothers and clinicians — because lasting change is built by the people who live there.',
  ADD COLUMN IF NOT EXISTS mission_cta_label text NOT NULL DEFAULT 'Read our story',
  ADD COLUMN IF NOT EXISTS mission_cta_url text NOT NULL DEFAULT '/about',
  ADD COLUMN IF NOT EXISTS mission_image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS impact_eyebrow text NOT NULL DEFAULT 'Live Impact',
  ADD COLUMN IF NOT EXISTS impact_title text NOT NULL DEFAULT 'Generosity, measured in real lives',
  ADD COLUMN IF NOT EXISTS impact_intro text NOT NULL DEFAULT 'Every number below is a family reached, a clinic opened, a school bag filled — verified by our field team and published in our annual transparency report.',
  ADD COLUMN IF NOT EXISTS campaign_eyebrow text NOT NULL DEFAULT 'Campaign Spotlight',
  ADD COLUMN IF NOT EXISTS campaign_title text NOT NULL DEFAULT 'August 2026 Care Package Distribution',
  ADD COLUMN IF NOT EXISTS campaign_body text NOT NULL DEFAULT 'This month our field team travels to six Bangladeshi villages with family care packages containing rice, hygiene kits, school supplies and clean-water tablets. Our goal: 1,200 packages before the monsoon peak.',
  ADD COLUMN IF NOT EXISTS campaign_goal_label text NOT NULL DEFAULT 'Goal',
  ADD COLUMN IF NOT EXISTS campaign_goal_value text NOT NULL DEFAULT '1,200 packages',
  ADD COLUMN IF NOT EXISTS campaign_cost_label text NOT NULL DEFAULT 'Cost per family',
  ADD COLUMN IF NOT EXISTS campaign_cost_value text NOT NULL DEFAULT '$50 CAD',
  ADD COLUMN IF NOT EXISTS campaign_primary_label text NOT NULL DEFAULT 'Fund a care package',
  ADD COLUMN IF NOT EXISTS campaign_primary_url text NOT NULL DEFAULT '/donate',
  ADD COLUMN IF NOT EXISTS campaign_secondary_label text NOT NULL DEFAULT 'See the program',
  ADD COLUMN IF NOT EXISTS campaign_secondary_url text NOT NULL DEFAULT '/programs',
  ADD COLUMN IF NOT EXISTS campaign_image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS campaign_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS partners_heading text NOT NULL DEFAULT 'Supported by partners who show up',
  ADD COLUMN IF NOT EXISTS cta_title text NOT NULL DEFAULT 'Be the reason a child stops going without',
  ADD COLUMN IF NOT EXISTS cta_body text NOT NULL DEFAULT 'Whether you give, volunteer or share our story — you become part of a family''s turning point.',
  ADD COLUMN IF NOT EXISTS cta_primary_label text NOT NULL DEFAULT 'Donate Now',
  ADD COLUMN IF NOT EXISTS cta_primary_url text NOT NULL DEFAULT '/donate',
  ADD COLUMN IF NOT EXISTS cta_secondary_label text NOT NULL DEFAULT 'Get Involved',
  ADD COLUMN IF NOT EXISTS cta_secondary_url text NOT NULL DEFAULT '/volunteer';

CREATE TABLE IF NOT EXISTS public.impact_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT 'sparkles',
  value integer NOT NULL DEFAULT 0,
  suffix text NOT NULL DEFAULT '',
  display text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.impact_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.impact_stats TO authenticated;
GRANT ALL ON public.impact_stats TO service_role;
ALTER TABLE public.impact_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active impact stats" ON public.impact_stats
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Staff can view all impact stats" ON public.impact_stats
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can insert impact stats" ON public.impact_stats
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can update impact stats" ON public.impact_stats
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can delete impact stats" ON public.impact_stats
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active partners" ON public.partners
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Staff can view all partners" ON public.partners
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can insert partners" ON public.partners
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can update partners" ON public.partners
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can delete partners" ON public.partners
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

INSERT INTO public.impact_stats (icon, value, suffix, display, label, caption, sort_order)
VALUES
  ('map-pin', 24, '', '24', 'Villages Supported', 'Active field partnerships', 1),
  ('package', 8400, '+', '8,400+', 'Care Packages Distributed', 'Rice, hygiene & school kits', 2),
  ('users', 3100, '', '3,100', 'Children Reached', 'Nutrition & education support', 3),
  ('stethoscope', 12, '', '12', 'Health Camps Hosted', 'Free clinics with local doctors', 4);

INSERT INTO public.partners (name, sort_order) VALUES
  ('Prioom Nath''s Clinic Initiative', 1),
  ('Toronto Community Trust', 2),
  ('Riverside Volunteers Guild', 3),
  ('Bengal Health Collective', 4),
  ('Maple Leaf Giving Circle', 5),
  ('Hope Logistics Partners', 6);
