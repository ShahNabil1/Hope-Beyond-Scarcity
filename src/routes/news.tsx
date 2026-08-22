import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "News & Stories | Hope Beyond Scarcity";
const description =
  "Field updates, impact stories, and announcements from Hope Beyond Scarcity's work in Bangladesh and Canada.";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  return (
    <>
      <PageHero
        eyebrow="Newsroom"
        title="Stories from the field"
        description="Updates from the villages, clinics, and classrooms your generosity supports."
      />
      <PlaceholderSection note="Article grid powered by the CMS will live here." />
    </>
  );
}
