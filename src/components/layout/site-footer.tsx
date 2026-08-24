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
          {links.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {links.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20"
                >
                  <Icon className="size-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          ) : null}
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
              <span>{address}</span>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <a href={`mailto:${email}`} className="hover:underline">
                {email}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{phone}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 text-xs text-primary-foreground/70 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="order-2 md:order-1">
            &copy; {new Date().getFullYear()} Hope Beyond Scarcity. Canadian Not-for-Profit
            Corporation. Charitable registration pending.
          </p>

          <a
            href="https://brantatech.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="order-1 md:order-2 group inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-[11px] font-medium tracking-wide text-primary-foreground/80 transition-all hover:border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            aria-label="Website engineered by Branta Tech — visit brantatech.com"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/70 transition-shadow group-hover:shadow-emerald-400" />
              Crafted with care by
            </span>
            <span className="font-semibold text-primary-foreground">Branta Tech</span>
            <svg
              className="size-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>

          <nav className="order-3 flex flex-wrap gap-4 md:order-3" aria-label="Legal">
            <Link to="/terms" className="hover:text-primary-foreground">
              Terms of Use
            </Link>
            <Link to="/privacy" className="hover:text-primary-foreground">
              Privacy Policy
            </Link>
            <Link to="/refund" className="hover:text-primary-foreground">
              Refund Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
