ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS social_facebook text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_instagram text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_linkedin text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_youtube text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_x text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_tiktok text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_whatsapp text NOT NULL DEFAULT '';