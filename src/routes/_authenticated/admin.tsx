import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Repeat,

  HandHeart,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  Newspaper,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

import { RequireRole } from "@/components/auth/require-role";
import { AdminShell, type AdminNavItem } from "@/components/admin/admin-shell";

const title = "Admin CMS | Hope Beyond Scarcity";
const description = "Internal content management for programs, news, events, and campaigns.";

const navItems: AdminNavItem[] = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard />, exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: <BarChart3 /> },
  { to: "/admin/programs", label: "Programs", icon: <HeartHandshake />, group: "Content" },
  { to: "/admin/news", label: "News", icon: <Newspaper />, group: "Content" },
  { to: "/admin/events", label: "Events", icon: <CalendarDays />, group: "Content" },
  { to: "/admin/volunteers", label: "Volunteer roles", icon: <HandHeart />, group: "Content" },
  { to: "/admin/legal", label: "Legal pages", icon: <ScrollText />, group: "Content" },
  { to: "/admin/members", label: "Members", icon: <Users />, group: "People" },
  { to: "/admin/applications", label: "Applications", icon: <HandHeart />, group: "People" },
  { to: "/admin/pitches", label: "Pitches", icon: <Lightbulb />, group: "People" },
  { to: "/admin/messages", label: "Messages", icon: <Inbox />, group: "People" },
  { to: "/admin/donations", label: "Donations", icon: <CircleDollarSign />, group: "Finance" },
  { to: "/admin/recurring", label: "Recurring gifts", icon: <Repeat />, group: "Finance" },
  { to: "/admin/settings", label: "Site settings", icon: <Settings />, group: "System" },
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
