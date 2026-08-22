import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "Refund Policy | Hope Beyond Scarcity";
const description = "Our donation refund and cancellation policy for one-time and monthly gifts.";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Refund Policy" />
      <PlaceholderSection note="Full refund policy copy will be published here." />
    </>
  );
}
