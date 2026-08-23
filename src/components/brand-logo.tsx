import { cn } from "@/lib/utils";
import brandLogo from "@/assets/brand-logo.png";

/** The official Hope Beyond Scarcity mark (transparent background). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src={brandLogo}
      alt="Hope Beyond Scarcity logo"
      width={340}
      height={303}
      className={cn("size-10 object-contain", className)}
    />
  );
}
