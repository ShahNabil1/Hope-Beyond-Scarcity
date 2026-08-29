import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, HandHeart, MapPin, Sparkles } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sponsorsQueryOptions } from "@/lib/public-content";

const title = "Sponsors | Hope Beyond Scarcity";
const description =
  "The companies, foundations, and giving circles whose sponsorship keeps Hope Beyond Scarcity programs running in Toronto and the field.";

const SITE_URL = "https://hopebeyondscarcity.com";

export const Route = createFileRoute("/sponsors")({
  loader: ({ context }) => context.queryClient.ensureQueryData(sponsorsQueryOptions),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/sponsors` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/sponsors` }],
  }),
  errorComponent: () => (
    <SponsorsFallback note="We couldn't load our sponsors right now. Please refresh in a moment." />
  ),
  notFoundComponent: () => <SponsorsFallback note="Sponsor profiles are being added shortly." />,
  component: SponsorsPage,
});

function SponsorsFallback({ note }: { note: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
    </section>
  );
}

function SponsorsPage() {
  const sponsors = useSuspenseQuery(sponsorsQueryOptions).data ?? [];
  const featured = sponsors.filter((s) => s.is_featured);
  const rest = sponsors.filter((s) => !s.is_featured);

  return (
    <>
      <PageHero
        eyebrow="Stand With Us"
        title="Our sponsors"
        description="Sponsorship covers the quiet costs — logistics, clinics, storage — so every public donation reaches a family."
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/contact">Become a sponsor</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/donate">Donate instead</Link>
          </Button>
        </div>
      </PageHero>

      {sponsors.length === 0 ? (
        <SponsorsFallback note="Sponsor profiles are being added shortly." />
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          {featured.length > 0 ? (
            <>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">Lead sponsors</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {featured.map((sponsor) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} featured />
                ))}
              </div>
            </>
          ) : null}

          {rest.length > 0 ? (
            <>
              <h2
                className={`text-lg font-semibold text-foreground sm:text-xl ${featured.length ? "mt-14" : ""}`}
              >
                Supporting sponsors
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((sponsor) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} />
                ))}
              </div>
            </>
          ) : null}

          <div className="mt-14 rounded-2xl border border-border bg-primary-soft p-6 sm:p-10">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Sponsor a program for 2027
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Corporate, foundation, and family sponsorships are matched to a specific program with
              reporting on every dollar. Reach out and we'll send the sponsorship package.
            </p>
            <Button asChild className="mt-5">
              <Link to="/contact">Talk to our team</Link>
            </Button>
          </div>
        </section>
      )}
    </>
  );
}

type Sponsor = {
  id: string;
  name: string;
  tier: string;
  summary: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  contribution_label: string | null;
  location: string | null;
  since_year: string | null;
  is_featured: boolean;
};

function SponsorCard({ sponsor, featured = false }: { sponsor: Sponsor; featured?: boolean }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-7">
      <div className="flex items-start gap-4">
        {sponsor.logo_url ? (
          <img
            src={sponsor.logo_url}
            alt={`${sponsor.name} logo`}
            loading="lazy"
            className="size-14 shrink-0 rounded-xl border border-border bg-background object-contain p-1.5"
          />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <HandHeart className="size-6" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={featured ? "default" : "secondary"}>{sponsor.tier}</Badge>
            {sponsor.since_year ? (
              <span className="text-xs text-muted-foreground">Since {sponsor.since_year}</span>
            ) : null}
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground sm:text-lg">{sponsor.name}</h3>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{sponsor.summary}</p>
      {featured && sponsor.description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sponsor.description}</p>
      ) : null}

      <dl className="mt-4 grid gap-2 text-xs text-muted-foreground">
        {sponsor.contribution_label ? (
          <div className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5" aria-hidden />
            {sponsor.contribution_label}
          </div>
        ) : null}
        {sponsor.location ? (
          <div className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            {sponsor.location}
          </div>
        ) : null}
      </dl>

      {sponsor.website_url ? (
        <a
          href={sponsor.website_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Visit website
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </article>
  );
}
