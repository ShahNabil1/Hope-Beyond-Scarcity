import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ContentManager } from "@/components/admin/content-manager";

export const Route = createFileRoute("/_authenticated/admin/news/")({
  component: NewsAdmin,
});

function NewsAdmin() {
  const navigate = useNavigate();
  return (
    <ContentManager
      table="news_posts"
      onNew={() => navigate({ to: "/admin/news/new" })}
      onEdit={(row) => navigate({ to: "/admin/news/$id", params: { id: String(row["id"]) } })}
    />
  );
}
