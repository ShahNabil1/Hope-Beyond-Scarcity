import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Menu, UserRound } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/programs", label: "Programs" },
  { to: "/news", label: "News" },
  { to: "/events", label: "Events" },
  { to: "/volunteer", label: "Volunteer" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, roles, homePath, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 sm:gap-2.5"
          aria-label="Hope Beyond Scarcity home"
        >
          <BrandLogo className="size-9 shrink-0 sm:size-11" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
              Hope Beyond Scarcity
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-widest text-muted-foreground sm:block">
              Canadian Not-for-Profit
            </span>
          </span>
        </Link>


        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              activeProps={{ className: "text-primary bg-primary-soft" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:ml-4">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link to="/volunteer">Get Involved</Link>
          </Button>
          <Button asChild size="sm" className="shadow-sm sm:h-10 sm:px-4 sm:text-sm">
            <Link to="/donate">
              Donate<span className="hidden sm:inline">&nbsp;Now</span>
            </Link>
          </Button>



          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <UserRound className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user?.email}
                  <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    {roles.length ? roles.join(" · ") : "member"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={homePath}>
                    <LayoutDashboard className="size-4" />
                    {homePath === "/admin" ? "Admin CMS" : "Donor dashboard"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void handleSignOut()}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm">
              <nav className="mt-10 flex flex-col gap-1 px-4" aria-label="Mobile">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: link.to === "/" }}
                    activeProps={{ className: "text-primary bg-primary-soft" }}
                    className="rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-2">
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link to="/volunteer">Get Involved</Link>
                  </Button>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link to="/donate">Donate Now</Link>
                  </Button>
                  {isAuthenticated ? (
                    <>
                      <Button asChild variant="ghost" onClick={() => setOpen(false)}>
                        <Link to={homePath}>
                          {homePath === "/admin" ? "Admin CMS" : "Donor dashboard"}
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setOpen(false);
                          void handleSignOut();
                        }}
                      >
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <Button asChild variant="ghost" onClick={() => setOpen(false)}>
                      <Link to="/auth">Sign in</Link>
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
