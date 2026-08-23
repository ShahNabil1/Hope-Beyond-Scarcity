import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  CalendarDays,
  CircleDollarSign,
  Repeat,

  HandHeart,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";

import { RequireRole } from "@/components/auth/require-role";
import { AdminShell, type AdminNavItem } from "@/components/admin/admin-shell";

const title = "Admin CMS | Hope Beyond Scarcity";
const description = "Internal content management for programs, news, events, and campaigns.";

const navItems: AdminNavItem[] = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard />, exact: true },
  { to: "/admin/programs", label: "Programs", icon: <HeartHandshake /> },
  { to: "/admin/news", label: "News", icon: <Newspaper /> },
  { to: "/admin/events", label: "Events", icon: <CalendarDays /> },
  { to: "/admin/volunteers", label: "Volunteer roles", icon: <HandHeart /> },
  { to: "/admin/members", label: "Members", icon: <Users /> },
  { to: "/admin/applications", label: "Applications", icon: <HandHeart /> },
  { to: "/admin/pitches", label: "Pitches", icon: <Lightbulb /> },
  { to: "/admin/donations", label: "Donations", icon: <CircleDollarSign /> },
  { to: "/admin/recurring", label: "Recurring gifts", icon: <Repeat /> },

  { to: "/admin/messages", label: "Messages", icon: <Inbox /> },
  { to: "/admin/settings", label: "Site settings", icon: <Settings /> },
];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <RequireRole roles={["admin", "editor"]}>
      <AdminShell items={navItems}>
        <Outlet />
      </AdminShell>
    </RequireRole>
  );
}
