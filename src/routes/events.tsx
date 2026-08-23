import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, Users, Video } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEvents } from "@/lib/content.functions";

const title = "Events | Hope Beyond Scarcity";
const description =
  "Fundraisers, distribution drives, and community gatherings hosted by Hope Beyond Scarcity.";

export const Route = createFileRoute("/events")({
  loader: () => getEvents(),
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
    <EventsFallback note="We couldn't load the event calendar right now. Please refresh in a moment." />
  ),
  notFoundComponent: () => <EventsFallback note="No events are scheduled yet." />,
  component: EventsPage,
});

function EventsFallback({ note }: { note: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
    </section>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Toronto",
});
const timeFmt = new Intl.DateTimeFormat("en-CA", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Toronto",
});

function EventsPage() {
  const events = Route.useLoaderData();
  const now = Date.now();
  const upcoming = events.filter((event) => new Date(event.starts_at).getTime() >= now);
  const past = events.filter((event) => new Date(event.starts_at).getTime() < now).reverse();

  return (
    <>
      <PageHero
        eyebrow="Gather With Us"
        title="Upcoming events and distribution drives"
        description="Join us in Toronto or on the ground for the next chapter of this work."
      />

      {events.length === 0 ? (
        <EventsFallback note="New events are being scheduled shortly." />
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing on the calendar right now — check back soon.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {upcoming.map((event) => {
                const start = new Date(event.starts_at);
                return (
                  <article
                    key={event.id}
                    className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md sm:flex-row sm:p-8"
                  >
                    <div className="flex w-full shrink-0 flex-row items-center gap-4 rounded-xl bg-primary-soft p-4 text-primary sm:w-28 sm:flex-col sm:gap-0 sm:text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                        {start.toLocaleString("en-CA", {
                          month: "short",
                          timeZone: "America/Toronto",
                        })}
                      </p>
                      <p className="text-3xl font-bold leading-none sm:mt-1">
                        {start.toLocaleString("en-CA", {
                          day: "numeric",
                          timeZone: "America/Toronto",
                        })}
                      </p>
                      <p className="text-xs sm:mt-1">
                        {start.toLocaleString("en-CA", {
                          year: "numeric",
                          timeZone: "America/Toronto",
                        })}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{event.event_type}</Badge>
                        {event.is_featured ? <Badge>Featured</Badge> : null}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-foreground sm:text-xl">
                        {event.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">{event.summary}</p>
                      {event.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {event.description}
                        </p>
                      ) : null}

                      <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <div className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden />
                          {dateFmt.format(start)}
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5" aria-hidden />
                          {timeFmt.format(start)}
                          {event.ends_at ? ` – ${timeFmt.format(new Date(event.ends_at))}` : ""} ET
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          {event.is_virtual ? (
                            <Video className="size-3.5" aria-hidden />
                          ) : (
                            <MapPin className="size-3.5" aria-hidden />
                          )}
                          {[event.venue, event.city].filter(Boolean).join(", ")}
                        </div>
                        {event.capacity ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Users className="size-3.5" aria-hidden />
                            {event.capacity} spots
                          </div>
                        ) : null}
                      </dl>
                    </div>

                    <div className="flex items-end sm:items-center">
                      {event.registration_url ? (
                        <Button asChild className="w-full sm:w-auto">
                          <a href={event.registration_url}>Register</a>
                        </Button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {past.length > 0 ? (
            <>
              <h2 className="mt-14 text-lg font-semibold text-foreground sm:text-xl">Past events</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {past.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-border bg-muted/40 p-5 text-sm"
                  >
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {dateFmt.format(new Date(event.starts_at))}
                    </p>
                    <h3 className="mt-2 font-semibold text-foreground">{event.title}</h3>
                    <p className="mt-1 text-muted-foreground">{event.summary}</p>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          <div className="mt-12 rounded-2xl bg-primary-soft p-8 text-center sm:p-10">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Can't make it in person?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              A monthly gift keeps care packages, clinics, and classrooms funded all year.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/donate">Donate now</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/volunteer">Volunteer with us</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
