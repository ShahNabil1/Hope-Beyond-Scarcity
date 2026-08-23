import { createFileRoute } from "@tanstack/react-router";

import { ContentManager } from "@/components/admin/content-manager";

export const Route = createFileRoute("/_authenticated/admin/programs")({
  component: () => <ContentManager table="programs" />,
});
