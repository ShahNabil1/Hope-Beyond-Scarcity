import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "Programs | Hope Beyond Scarcity";
const description =
  "Care packages, community health clinics, education support, and clean water programs that help families thrive.";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ProgramsPage,
});

function ProgramsPage() {
  return (
    <>
      <PageHero
        eyebrow="What We Do"
        title="Programs built with communities, not for them"
        description="Every program is designed with local leaders so support lasts long after the trucks leave."
      />
      <PlaceholderSection note="Program detail cards, outcomes, and field reports will live here." />
    </>
  );
}
