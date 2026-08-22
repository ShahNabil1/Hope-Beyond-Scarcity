import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "Donate | Hope Beyond Scarcity";
const description =
  "Give once or monthly to deliver care packages, clean water, and health support to families living in scarcity.";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: DonatePage,
});

function DonatePage() {
  return (
    <>
      <PageHero
        eyebrow="Give Today"
        title="Turn generosity into a family's next chapter"
        description="Secure Canadian donations. Transparent reporting. Every dollar tracked from gift to village."
      />
      <PlaceholderSection note="Secure donation form, amount presets, and recurring giving will live here." />
    </>
  );
}
