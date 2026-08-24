import { Link, useCanGoBack, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";

/**
 * Compact navigation bar shown on every non-home page below the header.
 * Gives small screens (where the footer is hidden) an obvious way back.
 */
export function PageBackBar() {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const label = pathname
    .split("/")
    .filter(Boolean)
    .slice(-1)[0]
    ?.replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="sticky top-[4.5rem] z-40 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:hidden">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-2 px-3 sm:px-6">
        <button
          type="button"
          onClick={() => (canGoBack ? router.history.back() : router.navigate({ to: "/" }))}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          aria-label="Go back"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </button>
        {label ? (
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
            {label}
          </span>
        ) : (
          <span className="flex-1" />
        )}
        <Link
          to="/"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          aria-label="Go to home page"
        >
          <Home className="size-4" aria-hidden="true" />
          Home
        </Link>
      </div>
    </div>
  );
}
