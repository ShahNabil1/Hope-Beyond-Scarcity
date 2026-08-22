import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "Volunteer | Hope Beyond Scarcity";
const description =
  "Give your time, skills, or voice. Volunteer with Hope Beyond Scarcity in Canada or with our field partners.";

export const Route = createFileRoute("/volunteer")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: VolunteerPage,
});

function VolunteerPage() {
  return (
    <>
      <PageHero
        eyebrow="Get Involved"
        title="Your hands make hope tangible"
        description="From packing care kits in Toronto to translating field reports, there is a place for you."
      />
      <PlaceholderSection note="Volunteer application form and role listings will live here." />
    </>
  );
}
