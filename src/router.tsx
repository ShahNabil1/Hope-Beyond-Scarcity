import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { BrandLoader } from "./components/ui/brand-loader";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 40,
    // TanStack Query is the single cache owner. A second router freshness
    // window can otherwise prevent a newly invalidated query from refetching.
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 300,
    defaultPendingMinMs: 300,
    defaultPendingComponent: () => (
      <div className="grid min-h-[50vh] place-items-center">
        <BrandLoader size="lg" />
      </div>
    ),
  });

  return router;
};
