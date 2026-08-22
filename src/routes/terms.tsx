import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "Terms of Use | Hope Beyond Scarcity";
const description = "The terms that govern use of the Hope Beyond Scarcity website and services.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Use" />
      <PlaceholderSection note="Full terms of use copy will be published here." />
    </>
  );
}
