import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import {
  ABOUT_FALLBACK,
  aboutPageQueryOptions,
  richTextToPlain,
  type Founder,
} from "@/lib/about-content";

export const Route = createFileRoute("/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(aboutPageQueryOptions),
  head: ({ loaderData }) => {
    const title = loaderData?.seo_title || ABOUT_FALLBACK.seo_title;
    const description = loaderData?.seo_description || ABOUT_FALLBACK.seo_description;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: AboutPage,
});

function isInternal(url: string) {
  return url.startsWith("/") && !url.startsWith("//");
}

function CtaButton({
  label,
  url,
  variant,
  icon,
}: {
  label: string;
  url: string;
  variant?: "outline";
  icon?: boolean;
}) {
  if (!label || !url) return null;
  const inner = (
    <>
      {label}
      {icon ? <ArrowRight className="size-4" /> : null}
    </>
  );
  return (
    <Button asChild size="lg" variant={variant}>
      {isInternal(url) ? (
        <Link to={url}>{inner}</Link>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      )}
    </Button>
  );
}

const richClass =
  "space-y-5 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:m-0 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6";

function FounderSection({ founder, index }: { founder: Founder; index: number }) {
  const flipped = index % 2 === 1;
  const hasStory = richTextToPlain(founder.story).length > 0;
  const aside = (
    <div className="lg:sticky lg:top-24 lg:self-start">
      {founder.image_url ? (
        <img
          src={founder.image_url}
          alt={founder.name}
          loading="lazy"
          className="mb-6 aspect-square w-40 rounded-2xl object-cover shadow-md"
        />
      ) : null}
      {founder.role ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {founder.role}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">{founder.name}</h2>
      {founder.location ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          {founder.location}
        </div>
      ) : null}
    </div>
  );
  const body = (
    <div className="space-y-5 text-lg leading-relaxed text-foreground/90">
      {hasStory ? (
        <div className={richClass} dangerouslySetInnerHTML={{ __html: founder.story }} />
      ) : null}
      {founder.quote ? (
        <p className="border-l-2 border-primary pl-5 text-xl font-medium text-foreground">
          {founder.quote}
        </p>
      ) : null}
    </div>
  );
  return (
    <section className={flipped ? "" : "bg-primary-soft"}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div
          className={
            flipped ? "grid gap-12 lg:grid-cols-[1fr_280px]" : "grid gap-12 lg:grid-cols-[280px_1fr]"
          }
        >
          <div className={flipped ? "lg:order-2" : ""}>{aside}</div>
          <div className={flipped ? "lg:order-1" : ""}>{body}</div>
        </div>
      </div>
    </section>
  );
}

function AboutPage() {
  const { data } = useSuspenseQuery(aboutPageQueryOptions);
  const c = data ?? ABOUT_FALLBACK;
  const founders = c.founders.filter((f) => f.visible);
  const convergenceHasBody = richTextToPlain(c.convergence.body).length > 0;

  return (
    <>
      <PageHero eyebrow={c.hero.eyebrow} title={c.hero.title} description={c.hero.description} />

      {c.intro.visible && (c.intro.lead || c.intro.sub) ? (
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          {c.intro.lead ? (
            <p className="whitespace-pre-line text-xl leading-relaxed text-foreground sm:text-2xl">
              {c.intro.lead}
            </p>
          ) : null}
          {c.intro.sub ? (
            <p className="mt-6 whitespace-pre-line text-base text-muted-foreground">{c.intro.sub}</p>
          ) : null}
        </section>
      ) : null}

      {founders.map((founder, i) => (
        <FounderSection key={founder.id} founder={founder} index={i} />
      ))}

      {c.convergence.visible ? (
        <section className="bg-primary-deep text-primary-foreground">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:py-24">
            {c.convergence.eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
                {c.convergence.eyebrow}
              </p>
            ) : null}
            {c.convergence.title ? (
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {c.convergence.title}
              </h2>
            ) : null}
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-primary-foreground/90">
              {convergenceHasBody ? (
                <div
                  className={`${richClass} [&_a]:text-primary-foreground`}
                  dangerouslySetInnerHTML={{ __html: c.convergence.body }}
                />
              ) : null}
              {c.convergence.highlight ? (
                <p className="text-xl font-medium text-primary-foreground">
                  {c.convergence.highlight}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {c.mission.visible ? (
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <HeartHandshake className="mx-auto size-10 text-primary" aria-hidden="true" />
          {c.mission.statement ? (
            <p className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {c.mission.statement}
            </p>
          ) : null}
          {c.mission.body ? (
            <p className="mt-4 text-base text-muted-foreground">{c.mission.body}</p>
          ) : null}
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <CtaButton label={c.mission.primary_label} url={c.mission.primary_url} icon />
            <CtaButton
              label={c.mission.secondary_label}
              url={c.mission.secondary_url}
              variant="outline"
            />
          </div>
        </section>
      ) : null}
    </>
  );
}
