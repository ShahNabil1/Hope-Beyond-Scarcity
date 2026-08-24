import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Link for URLs that come from the CMS. Internal paths use the client router;
 * external URLs (or mailto/tel) fall back to a plain anchor.
 */
export function CmsLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string | undefined;
  children: ReactNode;
}) {
  const target = href?.trim() || "/";
  const isInternal = target.startsWith("/");

  if (!isInternal) {
    return (
      <a
        href={target}
        className={className}
        {...(target.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    // CMS-authored paths are not statically known to the router.
    <Link to={target as never} className={className}>
      {children}
    </Link>
  );
}
