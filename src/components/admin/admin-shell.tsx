import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type AdminNavItem = { to: string; label: string; icon: ReactNode; exact?: boolean };

function NavList({ items, onNavigate }: { items: AdminNavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeOptions={{ exact: item.exact ?? false }}
          activeProps={{ className: "bg-primary/10 text-primary" }}
          inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <span className="[&>svg]:size-4">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminShell({
  items,
  children,
}: {
  items: AdminNavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <aside className="hidden w-56 shrink-0 lg:block">
        <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Admin
        </p>
        <NavList items={items} />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Menu className="size-4" /> Admin menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SheetTitle className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Admin
              </SheetTitle>
              <NavList items={items} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-3")}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
