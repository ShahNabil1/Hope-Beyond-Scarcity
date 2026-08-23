import { createFileRoute, notFound } from "@tanstack/react-router";

import { LegalFallback, LegalPageView } from "@/components/legal/legal-page-view";
import { getLegalPage } from "@/lib/content.functions";

export const Route = createFileRoute("/legal/$slug")({
  loader: async ({ params }) => {
    const page = await getLegalPage({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Policy unavailable | Hope Beyond Scarcity" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.title} | Hope Beyond Scarcity`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.summary.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.summary.slice(0, 155) },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  errorComponent: () => <LegalFallback note="We couldn't load this policy right now." />,
  notFoundComponent: () => <LegalFallback note="This policy has not been published yet." />,
  component: LegalSlugPage,
});

function LegalSlugPage() {
  return <LegalPageView page={Route.useLoaderData()} />;
}
