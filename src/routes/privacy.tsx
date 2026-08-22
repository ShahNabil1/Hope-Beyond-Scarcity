import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "Privacy Policy | Hope Beyond Scarcity";
const description =
  "How Hope Beyond Scarcity collects, protects, and uses donor and visitor information.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <PlaceholderSection note="Full privacy policy copy will be published here." />
    </>
  );
}
