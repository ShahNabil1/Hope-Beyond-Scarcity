import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-muted/40 px-4 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="mb-6 flex flex-col items-center gap-2 text-center">
          <BrandLogo className="size-14" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Hope Beyond Scarcity
          </span>
        </Link>

        <Card className="border-border/70 shadow-lg">
          <CardHeader className="space-y-1.5">
            <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {footer ? <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          Secured with encrypted, Canadian-standard data practices.
        </p>
      </div>
    </div>
  );
}
