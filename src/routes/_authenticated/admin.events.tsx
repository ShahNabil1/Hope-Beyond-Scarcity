import { createFileRoute } from "@tanstack/react-router";

import { ContentManager } from "@/components/admin/content-manager";

export const Route = createFileRoute("/_authenticated/admin/events")({
  component: () => <ContentManager table="events" />,
});
