# Admin / CMS Panel — 4 Phases

A staff-only control centre at `/admin` (Admin + Editor roles) where you can run the whole site: content, people, applications, appeals and money. Built in four phases so each one is usable as soon as it ships.

## Phase 1 — Admin shell + Emergency Appeal scheduler

- New `/admin` layout: left sidebar navigation (Overview, Programs, News, Events, Volunteering, People, Applications, Messages, Donations, Settings), responsive drawer on mobile, role-gated to Admin/Editor.
- Overview dashboard: totals for donations this month, active recurring gifts, new donors, pending volunteer applications, unread contact messages, published content counts.
- Emergency Appeal manager: headline, message, CTA label/link, on/off, plus **start date & end date scheduler** — the site banner shows only inside that window. Backed by a new `site_settings` table.
- Contact page content becomes editable (address, email, phone, office hours, map link, intro copy) and the public `/contact` page reads it.

## Phase 2 — Content management (Programs, News, Events, Volunteer roles)

For each content type: searchable/filterable list, create, edit, delete, duplicate, activate/deactivate, feature toggle, drag-free sort order field.

- Rich editor forms with every field the public pages use (summary, body, tags, category, dates, location, links, stats).
- Image handling: cover image upload + multi-image gallery upload with reorder/remove, using Supabase Storage (extends the existing `program-images` bucket pattern to news/events).
- Video and external link fields (registration URL, video URL) with validation.
- Live "view on site" links and unpublished preview.
- News comment moderation: approve/hide/delete comments, view reactions per story.

## Phase 3 — People & applications

- **Members**: all signed-in donors/volunteers — search, view profile, lifetime giving, role badges, promote/demote roles (Admin only), deactivate.
- **Volunteer applications**: list with status pipeline (new → reviewing → approved → declined), admin notes, assign to a role, email the applicant.
- **Contact messages**: inbox with read/replied status, reply by email, archive.
- CSV export on each list.

## Phase 4 — Donations & finance

- All payments: one-time and recurring, filterable by date range, status, environment (test/live), donor.
- Donation detail: Stripe session/payment intent, amount, donor, receipt status, resend PDF receipt.
- Recurring gifts: subscription status, next charge, amount, cancel-at-period-end, invoice history (A–Z) with hosted invoice and PDF links pulled from Stripe.
- Finance summary: monthly totals, recurring MRR, top donors, CSV export for bookkeeping.

## Technical notes

- Data access via `createServerFn` in `*.functions.ts` files with an admin-role middleware check (never trusting the client); Stripe reads reuse `src/lib/stripe.server.ts` and `src/lib/portal.server.ts`.
- New tables: `site_settings` (singleton, includes emergency banner window), `contact_messages`. Both with RLS: public insert for messages, staff-only read/write; `site_settings` public read of active values only.
- Existing tables get admin write policies via `has_role(auth.uid(),'admin'|'editor')`.
- All admin routes live under `src/routes/_authenticated/admin/` and are `noindex`.
