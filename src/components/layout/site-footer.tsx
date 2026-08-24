import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { BrandLogo } from "@/components/brand-logo";
import { getSiteSettings } from "@/lib/content.functions";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";

const columns = [
  {
    title: "Explore",
    links: [
      { to: "/about", label: "About Us" },
      { to: "/programs", label: "Programs" },
      { to: "/news", label: "News" },
      { to: "/events", label: "Events" },
    ],
  },
  {
    title: "Get Involved",
    links: [
      { to: "/donate", label: "Donate" },
      { to: "/volunteer", label: "Volunteer" },
      { to: "/dashboard", label: "Donor Dashboard" },
      { to: "/contact", label: "Contact" },
    ],
  },
] as const;

const socials = [
  { key: "social_facebook", label: "Facebook", Icon: Facebook },
  { key: "social_instagram", label: "Instagram", Icon: Instagram },
  { key: "social_linkedin", label: "LinkedIn", Icon: Linkedin },
  { key: "social_youtube", label: "YouTube", Icon: Youtube },
  { key: "social_x", label: "X (Twitter)", Icon: Twitter },
  { key: "social_tiktok", label: "TikTok", Icon: Music2 },
  { key: "social_whatsapp", label: "WhatsApp", Icon: MessageCircle },
] as const;

export function SiteFooter() {
  const fetchSettings = useServerFn(getSiteSettings);
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });

  const links = socials
    .map((s) => ({ ...s, href: (settings?.[s.key] ?? "").trim() }))
    .filter((s) => s.href.length > 0);

  const address = settings?.contact_address?.trim() || "Toronto, Ontario, Canada";
  const email = settings?.contact_email?.trim() || "info@hopebeyondscarcity.com";
  const phone = settings?.contact_phone?.trim() || "Phone number coming soon";

  return (
    <footer className="mt-24 border-t border-border bg-primary-deep text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <BrandLogo className="size-12" />
          <h2 className="mt-3 text-lg font-bold">Hope Beyond Scarcity</h2>
          <p className="mt-3 max-w-xs text-sm text-primary-foreground/75">
            A Canadian Not-for-Profit Corporation working alongside families to build dignity,
            health, and lasting hope beyond scarcity.
          </p>
          <div className="mt-5 flex gap-2">
            {socials.map(({ label, Icon }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20"
              >
                <Icon className="size-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-primary-foreground/85 transition-colors hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
            Head Office
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/85">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Toronto, Ontario, Canada</span>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <a href="mailto:info@hopebeyondscarcity.com" className="hover:underline">
                info@hopebeyondscarcity.com
              </a>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Phone number coming soon</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-primary-foreground/70 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} Hope Beyond Scarcity. Canadian Not-for-Profit
            Corporation. Charitable registration pending.
          </p>
          <nav className="flex flex-wrap gap-4" aria-label="Legal">
            <Link to="/terms" className="hover:text-primary-foreground">
              Terms of Use
            </Link>
            <Link to="/privacy" className="hover:text-primary-foreground">
              Privacy Policy
            </Link>
            <Link to="/refund" className="hover:text-primary-foreground">
              Refund Policy
            </Link>
            <Link to="/admin" className="hover:text-primary-foreground">
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
