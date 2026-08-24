import { createFileRoute } from "@tanstack/react-router";

import { ContentEditorPage } from "@/components/admin/content-editor";

export const Route = createFileRoute("/_authenticated/admin/news/new")({
  component: () => <ContentEditorPage table="news_posts" backTo="/admin/news" />,
});
