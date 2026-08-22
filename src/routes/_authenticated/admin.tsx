import { createFileRoute } from "@tanstack/react-router";

import { RequireRole } from "@/components/auth/require-role";
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
    <RequireRole roles={["admin", "editor"]}>
      <PageHero
        eyebrow="Staff Only"
        title="Admin content management"
        description="Publish stories, toggle the emergency appeal, and manage campaigns."
      />
      <PlaceholderSection note="Role-protected CMS modules will live here. Visible to Admin and Editor roles only." />
    </RequireRole>
  );
}
