ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS read_minutes integer NOT NULL DEFAULT 3;

CREATE TABLE IF NOT EXISTS public.news_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('heart', 'hope', 'clap', 'pray')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

GRANT SELECT ON public.news_reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_reactions TO authenticated;
GRANT ALL ON public.news_reactions TO service_role;
ALTER TABLE public.news_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions" ON public.news_reactions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users insert own reaction" ON public.news_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reaction" ON public.news_reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reaction" ON public.news_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.news_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Supporter',
  author_avatar_url text,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 2 AND 2000),
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_comments_post ON public.news_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_reactions_post ON public.news_reactions(post_id);

GRANT SELECT ON public.news_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_comments TO authenticated;
GRANT ALL ON public.news_comments TO service_role;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible comments" ON public.news_comments
  FOR SELECT TO anon, authenticated USING (is_hidden = false);
CREATE POLICY "Staff can read all comments" ON public.news_comments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Signed-in users can comment" ON public.news_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users edit own comment" ON public.news_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users or staff delete comment" ON public.news_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_news_comments_updated_at BEFORE UPDATE ON public.news_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.news_posts
SET headline = COALESCE(headline, excerpt),
    read_minutes = GREATEST(2, LEAST(12, COALESCE(char_length(body), 900) / 900 + 2))
WHERE headline IS NULL;