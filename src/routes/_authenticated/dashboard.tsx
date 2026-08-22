import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "Donor Dashboard | Hope Beyond Scarcity";
const description =
  "Track your giving history, manage monthly donations, and download tax receipts in one secure place.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DonorDashboardPage,
});

function DonorDashboardPage() {
  return (
    <>
      <PageHero
        eyebrow="Donor Portal"
        title="Your giving, clearly accounted for"
        description="Sign-in, receipts, and recurring gift management arrive in the next phase."
      />
      <PlaceholderSection note="Authenticated donor dashboard will live here once Supabase Auth is enabled." />
    </>
  );
}
