import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "About Us | Hope Beyond Scarcity";
const description =
  "Meet Rajasree and Lilibet and learn how Hope Beyond Scarcity, a Canadian not-for-profit, walks with families beyond scarcity.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Story"
        title="Hope begins with people who refuse to look away"
        description="Founded in Toronto by Rajasree and Lilibet, Hope Beyond Scarcity partners with villages to deliver dignity-first care."
      />
      <PlaceholderSection note="Founder story, governance, board, and annual reports will live here." />
    </>
  );
}
