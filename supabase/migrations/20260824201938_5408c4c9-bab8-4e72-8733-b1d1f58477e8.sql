CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  page_path text NOT NULL DEFAULT '/',
  page_title text,
  page_location text,
  referrer text,
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  user_id uuid,
  is_authenticated boolean NOT NULL DEFAULT false,
  country text,
  region text,
  city text,
  device_category text,
  browser text,
  os text,
  language text,
  screen_size text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read analytics"
ON public.analytics_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE INDEX analytics_events_created_at_idx ON public.analytics_events (created_at DESC);
CREATE INDEX analytics_events_event_name_idx ON public.analytics_events (event_name, created_at DESC);
CREATE INDEX analytics_events_page_path_idx ON public.analytics_events (page_path, created_at DESC);
CREATE INDEX analytics_events_session_idx ON public.analytics_events (session_id);
CREATE INDEX analytics_events_visitor_idx ON public.analytics_events (visitor_id);