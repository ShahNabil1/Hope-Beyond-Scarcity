import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "Events | Hope Beyond Scarcity";
const description =
  "Fundraisers, distribution drives, and community gatherings hosted by Hope Beyond Scarcity.";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <>
      <PageHero
        eyebrow="Gather With Us"
        title="Upcoming events and distribution drives"
        description="Join us in Toronto or on the ground for the next chapter of this work."
      />
      <PlaceholderSection note="Event calendar and registration flow will live here." />
    </>
  );
}
