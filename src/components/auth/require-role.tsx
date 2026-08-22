import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/hooks/use-auth";

/**
 * Renders children only when the signed-in user holds one of the allowed roles.
 * The `_authenticated` layout already guarantees a session; this adds RBAC on top.
 */
export function RequireRole({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const { loading, hasAnyRole, homePath } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Checking your access…</span>
      </div>
    );
  }

  if (!hasAnyRole(roles)) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="size-10 text-destructive" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">Access restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is limited to Hope Beyond Scarcity staff. If you believe this is a mistake,
          contact your administrator.
        </p>
        <Button asChild className="mt-6">
          <Link to={homePath}>Go to my portal</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
