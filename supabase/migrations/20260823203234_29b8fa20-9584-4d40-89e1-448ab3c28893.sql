CREATE TABLE public.site_settings (
  id text PRIMARY KEY DEFAULT 'default',
  emergency_active boolean NOT NULL DEFAULT false,
  emergency_headline text NOT NULL DEFAULT 'Emergency Appeal',
  emergency_message text NOT NULL DEFAULT '',
  emergency_cta_label text NOT NULL DEFAULT 'Give now',
  emergency_cta_url text NOT NULL DEFAULT '/donate',
  emergency_starts_at timestamptz,
  emergency_ends_at timestamptz,
  contact_intro text NOT NULL DEFAULT '',
  contact_address text NOT NULL DEFAULT 'Toronto, Ontario, Canada',
  contact_email text NOT NULL DEFAULT 'info@hopebeyondscarcity.com',
  contact_phone text NOT NULL DEFAULT '',
  contact_hours text NOT NULL DEFAULT '',
  contact_map_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_public_read" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "site_settings_staff_write" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (id, emergency_active, emergency_headline, emergency_message, contact_intro, contact_hours, contact_phone)
VALUES (
  'default',
  true,
  'Emergency Appeal',
  'Monsoon flooding has displaced families in southern Bangladesh. Every $50 delivers a family care package this week.',
  'Head office: Toronto, Ontario, Canada. We reply to every message within two business days.',
  'Monday to Friday, 9:00am – 5:00pm ET',
  ''
);

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT 'General enquiry',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_messages_public_insert" ON public.contact_messages
  FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_messages_staff_read" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "contact_messages_staff_update" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "contact_messages_staff_delete" ON public.contact_messages
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();