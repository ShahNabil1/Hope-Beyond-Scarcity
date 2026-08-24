import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Prefer the locally cached session: it resolves synchronously-fast and
    // avoids a network round-trip on every client navigation into this subtree.
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) {
      return { user: sessionData.session.user };
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
