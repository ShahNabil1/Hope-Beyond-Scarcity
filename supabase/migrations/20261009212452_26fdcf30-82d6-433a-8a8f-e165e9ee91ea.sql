CREATE TABLE public.about_page (
  id text PRIMARY KEY DEFAULT 'default',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.about_page TO anon, authenticated;
GRANT INSERT, UPDATE ON public.about_page TO authenticated;
GRANT ALL ON public.about_page TO service_role;
ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;
CREATE POLICY "about_page_public_read" ON public.about_page FOR SELECT TO anon, authenticated USING (id = 'default');
CREATE POLICY "about_page_staff_insert" ON public.about_page FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "about_page_staff_update" ON public.about_page FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE TRIGGER update_about_page_updated_at BEFORE UPDATE ON public.about_page
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.about_page (id, content) VALUES ('default', $json${
  "seo_title": "About Us | Hope Beyond Scarcity",
  "seo_description": "Rajasree Roy and Lilibet Yang founded Hope Beyond Scarcity in Toronto to fund the months after one-time generosity runs out and walk with families toward lasting change.",
  "hero": {
    "eyebrow": "Our Story",
    "title": "Hope begins with people who refuse to look away",
    "description": "Founded in Toronto by Rajasree Roy and Lilibet Yang, Hope Beyond Scarcity exists to fund the months after one-time generosity runs out."
  },
  "intro": {
    "visible": true,
    "lead": "Two girls. Two countries. The same quiet realization: that what decides whether a community holds together is often smaller than anyone expects — a broken pump, a check that arrives on schedule or doesn't, a visitor who comes once and never again.",
    "sub": "This is the story of how Rajasree Roy and Lilibet Yang compared notes and decided to fund the months after that."
  },
  "founders": [
    {
      "id": "rajasree-roy",
      "visible": true,
      "name": "Rajasree Roy",
      "role": "Founder",
      "location": "Toronto, Ontario",
      "image_url": "",
      "story": "<p>Rajasree Roy grew up in Toronto. Bangladesh was her mother's voice on Sunday calls and her grandmother's stories — a place she knew by ear, not by sight.</p><p>She went for the first time at fourteen, staying with an aunt who taught at a primary school that had gone three months without classes. The only water pump had broken, and there was no money to fix it until the next year's budget came through. Kids just stopped showing up.</p><p>The school reopened days before Rajasree Roy flew home, once her aunt scraped together enough to send someone to buy the part herself.</p>",
      "quote": "Rajasree Roy couldn't stop thinking about how small the gap was. A part. A bit of cash on the right day. None of it was fate."
    },
    {
      "id": "lilibet-yang",
      "visible": true,
      "name": "Lilibet Yang",
      "role": "Founder",
      "location": "Toronto, Ontario",
      "image_url": "",
      "story": "<p>Lilibet Yang grew up in Toronto. Her godmother, Karen, is a missionary in Peru who has spent years caring for orphaned children.</p><p>When Lilibet Yang was nine, she visited and spent the trip at the home Karen runs. She remembers one boy, maybe five or six, who beat her at a card game she never learned the rules to and refused to explain, just laughing every time she lost.</p>",
      "quote": "That was the whole friendship — a game neither of them could name, for a week — and it was enough to leave a mark."
    }
  ],
  "convergence": {
    "visible": true,
    "eyebrow": "Comparing Notes",
    "title": "They landed on the same thing",
    "body": "<p>Both places already had people doing the work — teachers, aunts, Karen herself — long before either of them showed up. What decided whether that work held together was smaller than they expected: a broken pump, a support check that arrived on schedule or didn't, a visitor who came once and never again.</p>",
    "highlight": "One-time generosity is easy, and for about a month it looks exactly like the real thing."
  },
  "mission": {
    "visible": true,
    "statement": "Hope Beyond Scarcity exists to fund the months after that.",
    "body": "A Canadian not-for-profit corporation, based in Toronto, walking with families beyond scarcity — one sustained month at a time.",
    "primary_label": "Donate Now",
    "primary_url": "/donate",
    "secondary_label": "Get Involved",
    "secondary_url": "/volunteer"
  }
}$json$::jsonb)
ON CONFLICT (id) DO NOTHING;