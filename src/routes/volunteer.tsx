import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, Users } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { volunteerRolesQueryOptions } from "@/lib/public-content";

const title = "Volunteer | Hope Beyond Scarcity";
const description =
  "Give your time, skills, or voice. Volunteer with Hope Beyond Scarcity in Canada or with our field partners.";

export const Route = createFileRoute("/volunteer")({
  loader: ({ context }) => context.queryClient.ensureQueryData(volunteerRolesQueryOptions),
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
    <VolunteerFallback note="We couldn't load volunteer roles right now. Please refresh in a moment." />
  ),
  notFoundComponent: () => <VolunteerFallback note="No volunteer roles are open yet." />,
  component: VolunteerPage,
});

function VolunteerFallback({ note }: { note: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
    </section>
  );
}

const steps = [
  { title: "Apply", body: "Send a short application from your donor & volunteer dashboard." },
  { title: "Chat", body: "A team member calls within a week to match you with a role." },
  { title: "Onboard", body: "Short briefing, materials, and a team lead for your first shift." },
];

function VolunteerPage() {
  const roles = useSuspenseQuery(volunteerRolesQueryOptions).data ?? [];

  return (
    <>
      <PageHero
        eyebrow="Get Involved"
        title="Your hands make hope tangible"
        description="From packing care kits in Toronto to translating field reports, there is a place for you."
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <h2 className="mt-3 text-base font-semibold text-foreground">{step.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-lg font-semibold text-foreground sm:text-xl">Open roles</h2>
        {roles.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No roles are open right now — new opportunities are posted regularly.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {roles.map((role) => (
              <article
                key={role.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md sm:p-8"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{role.interest_area}</Badge>
                  {role.is_remote ? <Badge variant="outline">Remote</Badge> : null}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-foreground sm:text-xl">
                  {role.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{role.summary}</p>
                {role.description ? (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {role.description}
                  </p>
                ) : null}

                {(role.skills ?? []).length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {(role.skills ?? []).map((skill) => (
                      <li
                        key={skill}
                        className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <dl className="mt-5 grid gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-2">
                  {role.commitment ? (
                    <div className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden />
                      {role.commitment}
                    </div>
                  ) : null}
                  {role.location ? (
                    <div className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" aria-hidden />
                      {role.location}
                    </div>
                  ) : null}
                  {role.spots_available ? (
                    <div className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden />
                      {role.spots_available} spots open
                    </div>
                  ) : null}
                </dl>

                <Button asChild size="sm" className="mt-5 w-full sm:w-auto">
                  <Link to="/dashboard">Apply for this role</Link>
                </Button>
              </article>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-primary-soft p-8 text-center sm:p-10">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Not sure where you fit?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Tell us what you are good at and we will find the place where it matters most.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/contact">Contact our team</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/events">See upcoming events</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
