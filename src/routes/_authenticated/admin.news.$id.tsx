import { createFileRoute } from "@tanstack/react-router";

import { ContentEditorPage } from "@/components/admin/content-editor";

export const Route = createFileRoute("/_authenticated/admin/news/$id")({
  component: NewsEditor,
});

function NewsEditor() {
  const { id } = Route.useParams();
  return <ContentEditorPage table="news_posts" id={id} backTo="/admin/news" />;
}
