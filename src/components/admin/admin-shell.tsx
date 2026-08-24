import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronLeft, LogOut, Menu, Sparkles } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export type AdminNavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
  group?: string;
};

const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 } as const;

function NavList({
  items,
  collapsed = false,
  onNavigate,
}: {
  items: AdminNavItem[];
  collapsed?: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, AdminNavItem[]>();
    for (const item of items) {
      const key = item.group ?? "";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <nav className="flex flex-col gap-5" aria-label="Admin">
      {groups.map(([group, groupItems]) => (
        <div key={group || "main"} className="flex flex-col gap-1">
          {group && !collapsed ? (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              {group}
            </p>
          ) : null}
          {group && collapsed ? <div className="mx-3 mb-1 h-px bg-border" /> : null}

          {groupItems.map((item) => {
            const link = (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                preload="intent"
                activeOptions={{ exact: item.exact ?? false }}
                activeProps={{
                  className:
                    "bg-gradient-to-r from-primary/15 to-accent/10 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
                }}
                inactiveProps={{
                  className: "text-muted-foreground hover:bg-muted hover:text-foreground",
                }}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:translate-x-0.5",
                  collapsed && "justify-center px-0",
                )}
              >
                <span className="[&>svg]:size-4 [&>svg]:transition-transform group-hover:[&>svg]:scale-110">
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (!collapsed) return link;
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({
  items,
  collapsed,
  onNavigate,
}: {
  items: AdminNavItem[];
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <Link
        to="/admin"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2.5 rounded-xl px-2 py-2",
          collapsed && "justify-center px-0",
        )}
      >
        <BrandLogo className="size-9 shrink-0" />
        {!collapsed && (
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold text-foreground">
              Hope Beyond Scarcity
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Admin CMS
            </span>
          </span>
        )}
      </Link>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <NavList items={items} collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      {!collapsed ? (
        <div className="rounded-2xl bg-gradient-to-br from-primary/12 via-accent/10 to-transparent p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Sparkles className="size-3.5 text-accent" /> Live site
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Changes publish instantly to visitors.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-2 w-full gap-2 bg-background/70">
            <Link to="/" onClick={onNavigate}>
              <ArrowLeft className="size-3.5" /> Back to site
            </Link>
          </Button>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="icon" variant="outline" className="mx-auto">
              <Link to="/" onClick={onNavigate} aria-label="Back to site">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Back to site</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function AdminShell({ items, children }: { items: AdminNavItem[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem("hbs-admin-sidebar");
    if (stored === "collapsed") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem("hbs-admin-sidebar", prev ? "expanded" : "collapsed");
      return !prev;
    });
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  const activeLabel =
    [...items]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => (item.exact ? pathname === item.to : pathname.startsWith(item.to)))?.label ??
    "Overview";

  return (
    <TooltipProvider delayDuration={120}>
      <div className="relative min-h-screen bg-muted/40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-accent/5 to-transparent"
        />

        <div className="relative flex min-h-screen">
          <motion.aside
            initial={false}
            animate={{ width: collapsed ? 76 : 256 }}
            transition={spring}
            className="sticky top-0 hidden h-screen shrink-0 border-r border-border/70 bg-background/80 p-3 backdrop-blur-xl lg:block"
          >
            <SidebarBody items={items} collapsed={collapsed} />
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="absolute -right-3.5 top-20 flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-md transition hover:scale-110 hover:text-primary"
            >
              <ChevronLeft
                className={cn("size-4 transition-transform duration-300", collapsed && "rotate-180")}
              />
            </button>
          </motion.aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden" aria-label="Admin menu">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4">
                  <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                  <SidebarBody items={items} collapsed={false} onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Admin CMS
                </p>
                <p className="truncate text-sm font-semibold text-foreground">{activeLabel}</p>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <div className="hidden text-right sm:block">
                  <p className="max-w-[180px] truncate text-xs font-medium text-foreground">
                    {user?.email}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                    {roles.length ? roles.join(" · ") : "staff"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Sign out"
                  onClick={() => void handleSignOut()}
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            </header>

            <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="mx-auto w-full max-w-6xl"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "mb-6 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-background via-background to-primary/5 p-5 shadow-sm",
      )}
    >
      <div>
        <h1 className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </motion.div>
  );
}
