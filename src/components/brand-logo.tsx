import { cn } from "@/lib/utils";

/** The official Hope Beyond Scarcity mark (from the uploaded brand icon pack). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/web-app-manifest-512x512.png"
      alt="Hope Beyond Scarcity logo"
      width={512}
      height={512}
      className={cn("size-10 object-contain", className)}
    />
  );
}
