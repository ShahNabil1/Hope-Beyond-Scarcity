import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Droplet, HeartHandshake, Package } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPrograms } from "@/lib/content.functions";

const title = "Programs | Hope Beyond Scarcity";
const description =
  "Care packages, community health clinics, education support, and clean water programs that help families thrive.";

const icons: Record<string, typeof Package> = {
  package: Package,
  heart: HeartHandshake,
  book: BookOpen,
  droplet: Droplet,
};

export const Route = createFileRoute("/programs")({
  loader: () => getPrograms(),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <ProgramsFallback note="We couldn't load our programs right now. Please refresh in a moment." />
  ),
  notFoundComponent: () => <ProgramsFallback note="No programs are published yet." />,
  component: ProgramsPage,
});

function ProgramsFallback({ note }: { note: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
    </section>
  );
}

function ProgramsPage() {
  const programs = Route.useLoaderData() ?? [];

  return (
    <>
      <PageHero
        eyebrow="What We Do"
        title="Programs built with communities, not for them"
        description="Every program is designed with local leaders so support lasts long after the trucks leave."
      />

      {programs.length === 0 ? (
        <ProgramsFallback note="New programs are being published shortly." />
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-6 md:grid-cols-2">
            {programs.map((program) => {
              const Icon = icons[program.icon ?? "package"] ?? Package;
              return (
                <article
                  key={program.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    {program.focus_area ? (
                      <Badge variant="secondary">{program.focus_area}</Badge>
                    ) : null}
                  </div>

                  <h2 className="mt-5 text-xl font-semibold text-foreground sm:text-2xl">
                    {program.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    {program.summary}
                  </p>
                  {program.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {program.description}
                    </p>
                  ) : null}

                  {(program.highlights ?? []).length > 0 ? (
                    <ul className="mt-5 space-y-2 text-sm text-foreground">
                      {(program.highlights ?? []).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
                    <div>
                      {program.impact_stat ? (
                        <p className="text-2xl font-bold text-primary">{program.impact_stat}</p>
                      ) : null}
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {program.impact_label ?? program.location}
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link to="/donate">Fund this program</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 rounded-2xl bg-primary-soft p-8 text-center sm:p-10">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Want to help design the next program?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Volunteers, clinicians, and community partners shape everything we build. Tell us
              where you can help.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/volunteer">Get involved</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Talk to our team</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
