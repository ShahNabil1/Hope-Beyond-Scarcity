import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "Admin CMS | Hope Beyond Scarcity";
const description = "Internal content management for programs, news, events, and campaigns.";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <>
      <PageHero
        eyebrow="Staff Only"
        title="Admin content management"
        description="Publish stories, toggle the emergency appeal, and manage campaigns."
      />
      <PlaceholderSection note="Role-protected CMS will live here once Supabase Auth and roles are enabled." />
    </>
  );
}
