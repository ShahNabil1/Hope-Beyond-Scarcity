import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The public events page is archived. Event data is kept in the database, but
 * the route now permanently redirects to the sponsors page that replaced it.
 */
export const Route = createFileRoute("/events")({
  beforeLoad: () => {
    throw redirect({ to: "/sponsors", replace: true, statusCode: 301 });
  },
  head: () => ({
    meta: [
      { title: "Sponsors | Hope Beyond Scarcity" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => null,
});
