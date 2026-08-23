CREATE TABLE public.legal_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  effective_date date,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.legal_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_pages TO authenticated;
GRANT ALL ON public.legal_pages TO service_role;

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published legal pages"
  ON public.legal_pages FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Staff can insert legal pages"
  ON public.legal_pages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update legal pages"
  ON public.legal_pages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins can delete legal pages"
  ON public.legal_pages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_legal_pages_updated_at
  BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.legal_pages (slug, title, summary, effective_date, sort_order, body) VALUES
('privacy',
 'Privacy Policy',
 'How Hope Beyond Scarcity collects, protects, and uses donor and visitor information.',
 CURRENT_DATE,
 1,
 '<p>Hope Beyond Scarcity is a Canadian Not-for-Profit Corporation based in Toronto, Ontario. This Privacy Policy explains how we collect, use, disclose, and safeguard personal information when you visit hopebeyondscarcity.com, donate, volunteer, or create an account.</p>
<h2>Information we collect</h2>
<ul>
<li><strong>Account information:</strong> full name, email address, password (stored only as a secure hash), and optional phone number or location.</li>
<li><strong>Donation information:</strong> gift amount, currency (CAD), frequency, and receipt history. Card numbers are never stored on our servers; payments are processed by Stripe.</li>
<li><strong>Volunteer information:</strong> areas of interest, availability, and the messages you send us.</li>
<li><strong>Technical information:</strong> device, browser, and anonymized usage data used to keep the site secure and fast.</li>
</ul>
<h2>How we use your information</h2>
<ul>
<li>To process donations and issue official receipts.</li>
<li>To manage your account, recurring gifts, and volunteer applications.</li>
<li>To send program updates, appeals, and impact reports you have asked to receive.</li>
<li>To meet Canadian legal, accounting, and charitable reporting requirements.</li>
</ul>
<h2>Google sign-in</h2>
<p>If you sign in with Google, we receive only your name, email address, and profile photo from your Google account. We use this information solely to create and authenticate your Hope Beyond Scarcity account. We never sell it, and we never request access to your Gmail, Drive, contacts, or any other Google data.</p>
<h2>Sharing</h2>
<p>We do not sell, rent, or trade personal information. We share data only with service providers who help us operate: Stripe (payments), Supabase (secure database and authentication), Resend (transactional email), and Cloudflare (security). Each is bound by contract to protect your information.</p>
<h2>Retention and security</h2>
<p>Donation records are retained for the period required by the Canada Revenue Agency. All data is encrypted in transit and at rest, with role-based access limited to authorized staff.</p>
<h2>Your rights</h2>
<p>You may request access to, correction of, or deletion of your personal information at any time from your dashboard or by contacting us. Deleting your account removes your profile data; donation records required for tax reporting are retained in anonymized form.</p>
<h2>Children</h2>
<p>Our services are intended for people aged 18 and over. We do not knowingly collect personal information from children.</p>
<h2>Contact</h2>
<p>Hope Beyond Scarcity, Toronto, Ontario, Canada. Email: hopebeyond904@gmail.com</p>'),
('terms',
 'Terms of Service',
 'The terms that govern your use of the Hope Beyond Scarcity website, account, and donation services.',
 CURRENT_DATE,
 2,
 '<p>These Terms of Service govern your use of the Hope Beyond Scarcity website and services. By creating an account, donating, or volunteering, you agree to these terms.</p>
<h2>About us</h2>
<p>Hope Beyond Scarcity is a Not-for-Profit Corporation incorporated in Canada and operating from Toronto, Ontario. Our mission is to fund the months after crisis for children and families living with scarcity.</p>
<h2>Your account</h2>
<ul>
<li>You must be at least 18 years old and provide accurate information.</li>
<li>You are responsible for keeping your password and one-time verification codes confidential.</li>
<li>You must accept our Privacy Policy, Terms of Service, and Refund Policy before an account is created.</li>
<li>We may suspend or terminate accounts used for fraud, abuse, or unlawful activity.</li>
</ul>
<h2>Donations</h2>
<ul>
<li>All transactions are processed in Canadian Dollars (CAD) through Stripe.</li>
<li>One-time gifts may be made as a guest; monthly recurring gifts require an account.</li>
<li>Recurring gifts continue until you cancel them from your dashboard or by contacting us.</li>
<li>Official receipts are issued by email; issuance of tax receipts depends on our registered charitable status at the time of the gift.</li>
</ul>
<h2>Volunteering</h2>
<p>Submitting a volunteer application does not create an employment relationship. Placements depend on screening, availability, and program need.</p>
<h2>Acceptable use</h2>
<p>You agree not to disrupt the service, attempt unauthorized access, scrape data, upload malicious code, or post unlawful, hateful, or misleading content in comments and community features. We may moderate or remove any content at our discretion.</p>
<h2>Intellectual property</h2>
<p>All site content, stories, photographs, and branding belong to Hope Beyond Scarcity or its contributors and may not be reused without written permission.</p>
<h2>Disclaimer and liability</h2>
<p>The site is provided "as is". To the fullest extent permitted by law, Hope Beyond Scarcity is not liable for indirect or consequential damages arising from your use of the site.</p>
<h2>Changes and governing law</h2>
<p>We may update these terms; material changes will be posted here with a new effective date. These terms are governed by the laws of the Province of Ontario and the applicable laws of Canada.</p>
<h2>Contact</h2>
<p>Questions? Email hopebeyond904@gmail.com</p>'),
('refund',
 'Refund & Cancellation Policy',
 'How to cancel a monthly gift or request a refund on a donation to Hope Beyond Scarcity.',
 CURRENT_DATE,
 3,
 '<p>We are grateful for every gift. We also understand that mistakes happen and circumstances change. This policy explains how refunds and cancellations work.</p>
<h2>One-time donations</h2>
<p>If you made an error — a duplicate gift, an incorrect amount, or an unauthorized charge — contact us within <strong>30 days</strong> of the transaction and we will refund the full amount to the original payment method. Refunds usually appear within 5 to 10 business days depending on your bank.</p>
<h2>Monthly recurring gifts</h2>
<ul>
<li>You can cancel a monthly gift at any time from your dashboard under "Recurring gifts", or by emailing us.</li>
<li>Cancellation stops all future charges. The current billing period is not prorated.</li>
<li>A charge made in error on a recurring gift can be refunded if reported within 30 days.</li>
</ul>
<h2>Tax receipts</h2>
<p>If a receipt has already been issued for a donation that is later refunded, the receipt is cancelled and a corrected record is kept in our files as required by the Canada Revenue Agency.</p>
<h2>Designated gifts</h2>
<p>Gifts designated to a specific program are used for that program. If a program is fully funded or cannot proceed, we will redirect your gift to the area of greatest need and notify you where practical.</p>
<h2>How to request a refund</h2>
<p>Email hopebeyond904@gmail.com with the donor name, donation date, and amount. We respond to every request within 5 business days.</p>
<h2>Contact</h2>
<p>Hope Beyond Scarcity, Toronto, Ontario, Canada.</p>');