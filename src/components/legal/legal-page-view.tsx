import { Link } from "@tanstack/react-router";

import { LegalBody } from "@/components/legal/legal-body";
import { PageHero } from "@/components/page-hero";

export type LegalPageData = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  effective_date: string | null;
  updated_at: string;
};

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export function LegalPageView({ page }: { page: LegalPageData }) {
  const effective = formatDate(page.effective_date) ?? formatDate(page.updated_at);

  return (
    <>
      <PageHero eyebrow="Legal" title={page.title} description={page.summary} />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        {effective ? (
          <p className="mb-8 text-sm text-muted-foreground">Effective {effective}</p>
        ) : null}
        <LegalBody body={page.body} />
        <div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          <Link to="/refund" className="text-primary hover:underline">
            Refund Policy
          </Link>
          <Link to="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
        </div>
      </section>
    </>
  );
}

export function LegalFallback({ note }: { note: string }) {
  return (
    <>
      <PageHero eyebrow="Legal" title="Policy unavailable" />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">{note}</p>
      </section>
    </>
  );
}
