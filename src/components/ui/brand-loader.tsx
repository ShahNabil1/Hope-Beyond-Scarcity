import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Global branded loading mark — the Hope Beyond Scarcity logo with a soft
 * breathing halo. Use this anywhere the app is waiting on data.
 */
export function BrandLoader({
  label,
  className,
  size = "md",
}: {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "size-8" : size === "lg" ? "size-20" : "size-12";
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-10", className)}>
      <div className="relative grid place-items-center">
        <span
          aria-hidden
          className={cn(
            "absolute rounded-full bg-primary/15 blur-xl motion-safe:animate-ping",
            size === "lg" ? "size-24" : size === "sm" ? "size-10" : "size-16",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute rounded-full border-2 border-primary/30 border-t-primary motion-safe:animate-spin",
            size === "lg" ? "size-24" : size === "sm" ? "size-10" : "size-16",
          )}
        />
        <BrandLogo className={cn(dims, "relative motion-safe:animate-pulse")} />
      </div>
      <p className="text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
        {label ?? "Loading…"}
      </p>
    </div>
  );
}

/**
 * Branded skeleton block: shimmer rows with the Hope Beyond Scarcity mark
 * watermarked in the middle, so every loading surface feels the same.
 */
export function BrandSkeleton({
  rows = 4,
  className,
  label,
}: {
  rows?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <BrandLoader label={label} />
      </div>
    </div>
  );
}
