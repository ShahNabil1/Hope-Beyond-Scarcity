import { createFileRoute, notFound } from "@tanstack/react-router";

import { LegalFallback, LegalPageView } from "@/components/legal/legal-page-view";
import { getLegalPage } from "@/lib/content.functions";

export const Route = createFileRoute("/refund")({
  loader: async () => {
    const page = await getLegalPage({ data: { slug: "refund" } });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.title ?? "Refund Policy"} | Hope Beyond Scarcity`;
    const description =
      loaderData?.summary ??
      "Our donation refund and cancellation policy for one-time and monthly gifts.";
    return {
      meta: [
        { title },
        { name: "description", content: description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: description.slice(0, 155) },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  errorComponent: () => <LegalFallback note="We couldn't load this policy right now." />,
  notFoundComponent: () => <LegalFallback note="This policy has not been published yet." />,
  component: RefundPage,
});

function RefundPage() {
  return <LegalPageView page={Route.useLoaderData()} />;
}
