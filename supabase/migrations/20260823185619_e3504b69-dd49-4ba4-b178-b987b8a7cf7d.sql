-- PROGRAMS
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  summary text NOT NULL,
  description text,
  focus_area text,
  location text,
  icon text,
  impact_stat text,
  impact_label text,
  highlights text[] NOT NULL DEFAULT '{}',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active programs" ON public.programs FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Staff can view all programs" ON public.programs FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can insert programs" ON public.programs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can update programs" ON public.programs FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can delete programs" ON public.programs FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NEWS
CREATE TABLE public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'Update',
  author_name text,
  location text,
  cover_image_url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_posts TO authenticated;
GRANT ALL ON public.news_posts TO service_role;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active news" ON public.news_posts FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Staff can view all news" ON public.news_posts FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can insert news" ON public.news_posts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can update news" ON public.news_posts FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can delete news" ON public.news_posts FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_news_posts_updated_at BEFORE UPDATE ON public.news_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'Community',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  timezone text NOT NULL DEFAULT 'America/Toronto',
  venue text,
  city text,
  is_virtual boolean NOT NULL DEFAULT false,
  capacity integer,
  registration_url text,
  cover_image_url text,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active events" ON public.events FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Staff can view all events" ON public.events FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can update events" ON public.events FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can delete events" ON public.events FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VOLUNTEER ROLES
CREATE TABLE public.volunteer_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL,
  description text,
  interest_area text NOT NULL DEFAULT 'general',
  commitment text,
  location text,
  is_remote boolean NOT NULL DEFAULT false,
  skills text[] NOT NULL DEFAULT '{}',
  spots_available integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.volunteer_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_roles TO authenticated;
GRANT ALL ON public.volunteer_roles TO service_role;
ALTER TABLE public.volunteer_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active volunteer roles" ON public.volunteer_roles FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Staff can view all volunteer roles" ON public.volunteer_roles FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can insert volunteer roles" ON public.volunteer_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can update volunteer roles" ON public.volunteer_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "Staff can delete volunteer roles" ON public.volunteer_roles FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_volunteer_roles_updated_at BEFORE UPDATE ON public.volunteer_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DEMO CONTENT
INSERT INTO public.programs (slug, name, summary, description, focus_area, location, icon, impact_stat, impact_label, highlights, sort_order) VALUES
('family-care-packages','Family Care Packages','Month-long food, hygiene, and newborn supplies delivered to families living through the hardest weeks of the year.','Each package is assembled with local partners and covers 30 days of rice, lentils, oil, soap, sanitary supplies, and newborn essentials. Families are identified by community health workers, not outsiders, so support reaches the households that quietly go without.','Relief','Khulna & Barishal, Bangladesh','package','1,240','packages delivered since 2024',ARRAY['30 days of staple food for a family of five','Hygiene and maternal newborn kits','Delivered by local partners within 72 hours'],1),
('community-health-clinics','Community Health Clinics','Mobile clinics bringing maternal care, medicine, and follow-up visits to villages far from any hospital.','Our mobile clinic teams run monthly visits with a doctor, midwife, and pharmacist. The focus is on the months after a crisis: prenatal check-ups, nutrition monitoring, and chronic medication that usually stops when funding leaves.','Health','Rural Bangladesh','heart','8,600','patient visits funded',ARRAY['Monthly maternal and child check-ups','Free essential medication','Referral support for emergency cases'],2),
('education-support','Education Support','School fees, uniforms, and tutoring so a family crisis never becomes a child dropping out.','We cover the full year of schooling costs for children at risk of leaving classrooms after a family loses income. Every scholarship includes tutoring and a termly check-in with teachers and guardians.','Education','Bangladesh & Peru','book','410','children kept in school',ARRAY['Full-year fees, books, and uniforms','After-school tutoring circles','Termly progress reviews with families'],3),
('clean-water-access','Clean Water Access','Deep tube wells and filtration for communities where the nearest safe water is hours away.','Working with village water committees, we install and maintain deep tube wells and household filters. Committees are trained and funded for three years of maintenance so the well still works long after the ribbon cutting.','Water','Coastal Bangladesh','droplet','22','wells built and maintained',ARRAY['Deep tube wells built with village committees','Three-year maintenance funding','Household filtration for saline-affected areas'],4);

INSERT INTO public.news_posts (slug, title, excerpt, body, category, author_name, location, published_at, is_featured, sort_order) VALUES
('monsoon-response-khulna','Monsoon response reaches 180 families in Khulna','When the embankment gave way, our partners had care packages moving within 48 hours. Here is what that week looked like.','The water came in the night. By morning, 180 households in three unions had lost their stored rice and most of their bedding. Our local partners had packages staged in Khulna city, and the first trucks moved before the roads were fully clear.

What matters now is the months that follow. Each family receiving a package has also been added to the community health clinic list, so the same names are seen again in September, not just in the first emotional week.','Field Update','Rajasree Karim','Khulna, Bangladesh','2026-08-04 09:00:00+00',true,1),
('lilibet-scholarship-cohort','Meet the 2026 scholarship cohort','Forty-one children returned to classrooms this term who were, six months ago, about to leave for good.','Every scholarship starts with a teacher noticing an empty chair. This term, forty-one children came back — most of them after a parent lost work or a family member fell ill.

The cohort receives full fees, books, uniforms, and a place in the after-school tutoring circle. Guardians meet our partner team once a term, which is where we hear what is actually going wrong before it becomes a dropout.','Story','Lilibet Andrade','Toronto, Canada','2026-07-18 14:00:00+00',false,2),
('water-committee-training','Twenty-two wells, three years of maintenance funding','Building a well is the easy part. We spent this quarter making sure they still work in 2029.','A well that fails in year two is worse than no well at all, because the community stops looking for alternatives. This quarter we finished maintenance training with twenty-two village water committees and funded their spare parts through 2029.

Each committee now has a named caretaker, a small tool kit, and a phone number that reaches someone who can actually help.','Program Update','Field Team','Coastal Bangladesh','2026-06-29 11:00:00+00',false,3),
('annual-transparency-report','Where every dollar went in 2025','Our first full transparency report is published: program spend, overhead, and what we would do differently.','Eighty-four cents of every dollar reached programs in 2025. The rest covered payment processing, compliance for our Canadian not-for-profit registration, and the part-time coordination that keeps field reporting honest.

We are publishing the parts we got wrong too — including two months where care package delivery slipped because we under-budgeted transport during the monsoon.','Announcement','Board of Directors','Toronto, Canada','2026-05-12 16:00:00+00',false,4);

INSERT INTO public.events (slug, title, summary, description, event_type, starts_at, ends_at, venue, city, is_virtual, capacity, registration_url, is_featured, sort_order) VALUES
('care-package-packing-september','Care Package Packing Night','Two hours, one warehouse, three hundred family packages headed for Khulna before the next rains.','Bring friends. We provide the gloves, the checklists, and the pizza. No experience needed — volunteers are paired with a team lead for the whole shift.','Volunteer Drive','2026-09-12 22:30:00+00','2026-09-13 01:00:00+00','Scarborough Community Warehouse','Toronto, ON',false,60,'/volunteer',true,1),
('fall-fundraising-dinner','Hope Beyond Scarcity Fall Dinner','An evening with the field team, families we support, and the people funding the months after the headlines.','A seated dinner with live reporting from our Bangladesh partners, a short program on the 2027 clean water expansion, and a silent auction supporting the scholarship fund.','Fundraiser','2026-10-04 23:00:00+00','2026-10-05 02:30:00+00','Harbourfront Event Hall','Toronto, ON',false,220,'/donate',false,2),
('field-report-webinar','Live Field Report: Monsoon Season Review','A one-hour online briefing with the Khulna clinic team, open to all donors and volunteers.','Join our program leads on video from Khulna for a candid review of monsoon response: what reached families in time, what did not, and what changes for next year.','Webinar','2026-09-25 23:00:00+00','2026-09-26 00:00:00+00',NULL,'Online',true,500,'/contact',false,3),
('winter-clothing-drive','Winter Warmth Collection Drive','Drop-off weekend for new blankets, thermals, and children''s outerwear for northern district families.','Collection runs Saturday and Sunday. New items only, please — our partners distribute directly to households identified by community health workers.','Community','2026-11-14 15:00:00+00','2026-11-15 22:00:00+00','Danforth Community Centre','Toronto, ON',false,NULL,'/contact',false,4);

INSERT INTO public.volunteer_roles (slug, title, summary, description, interest_area, commitment, location, is_remote, skills, spots_available, sort_order) VALUES
('packing-crew','Care Package Packing Crew','Assemble and quality-check family packages at our Toronto warehouse nights.','You will work in a team of six, assembling month-long family packages against a checklist and preparing pallets for shipment. Training takes ten minutes and happens on the night.','events','One evening per month, 2.5 hours','Scarborough, Toronto',false,ARRAY['Teamwork','Attention to detail'],24,1),
('translation-support','Field Report Translation','Translate Bangla and Spanish field reports into clear English for donors.','Our partner teams write in Bangla and Spanish. You will turn those reports into plain English updates that donors actually read — usually two to three short documents a month.','communications','2-4 hours per month','Remote',true,ARRAY['Bangla or Spanish fluency','Clear written English'],6,2),
('event-host','Event Host & Community Ambassador','Represent Hope Beyond Scarcity at community events, mosques, churches, and campus fairs.','You will run an information table, answer questions about where donations go, and sign up new monthly donors. We provide materials, talking points, and a briefing call.','events','Occasional weekends','Greater Toronto Area',false,ARRAY['Public speaking','Comfort with fundraising conversations'],12,3),
('grant-writing','Grant Research & Writing','Help us find and win the institutional funding that keeps programs running past year one.','Research Canadian foundation and government grant opportunities, then support drafting applications alongside our board. Prior grant experience is welcome but not required.','fundraising','4-6 hours per month','Remote',true,ARRAY['Research','Persuasive writing'],4,4),
('clinic-logistics-advisor','Clinic Logistics Advisor','Pro-bono advisory for medical supply chain and mobile clinic scheduling.','A skills-based role for healthcare, pharmacy, or logistics professionals. You will review our mobile clinic routing and medication procurement quarterly and flag risks.','skills','Quarterly review calls','Remote',true,ARRAY['Healthcare or logistics background'],3,5);