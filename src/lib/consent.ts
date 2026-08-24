/**
 * Cookie consent store (PIPEDA / Québec Law 25 aligned).
 *
 * - Nothing but strictly-necessary storage runs before the visitor decides.
 * - The choice is versioned so a policy change can re-prompt.
 * - Changes are broadcast in-tab and across tabs so trackers stop instantly.
 */
export const CONSENT_STORAGE_KEY = "hbs.cookie-consent.v1";
export const CONSENT_VERSION = 1;
/** Re-ask after 12 months, as recommended by Canadian privacy guidance. */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export type ConsentCategory = "necessary" | "performance" | "functional" | "advertising" | "social";

export type ConsentState = {
  version: number;
  updatedAt: string;
  necessary: true;
  performance: boolean;
  functional: boolean;
  advertising: boolean;
  social: boolean;
};

export const OPTIONAL_CATEGORIES: Exclude<ConsentCategory, "necessary">[] = [
  "performance",
  "functional",
  "advertising",
  "social",
];

export const CATEGORY_COPY: Record<
  ConsentCategory,
  { title: string; description: string; alwaysOn?: boolean }
> = {
  necessary: {
    title: "Strictly necessary cookies",
    description:
      "Required for the site to work — signing in, keeping your donation session secure, remembering this cookie choice and protecting our forms from abuse. These cannot be switched off.",
    alwaysOn: true,
  },
  performance: {
    title: "Performance & analytics cookies",
    description:
      "Let us count visits and traffic sources so we can measure and improve the site. All information is aggregated and anonymous — we never sell it.",
  },
  functional: {
    title: "Functional cookies",
    description:
      "Enable enhanced features and personalisation, such as remembering your preferred content, saved form details and cached pages for faster loading.",
  },
  advertising: {
    title: "Advertising cookies",
    description:
      "May be set by our advertising partners to show you relevant fundraising appeals on other sites. They do not store directly identifying information.",
  },
  social: {
    title: "Social media & content sharing cookies",
    description:
      "Set by social platforms so you can share our stories with your networks. If you turn these off, some sharing tools may not work.",
  },
};

export const DENY_ALL: ConsentState = {
  version: CONSENT_VERSION,
  updatedAt: new Date(0).toISOString(),
  necessary: true,
  performance: false,
  functional: false,
  advertising: false,
  social: false,
};

export function acceptAllState(): ConsentState {
  return {
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    necessary: true,
    performance: true,
    functional: true,
    advertising: true,
    social: true,
  };
}

export function rejectAllState(): ConsentState {
  return { ...DENY_ALL, updatedAt: new Date().toISOString() };
}

/**
 * Pre-selected state shown in the preferences UI before a decision exists.
 * Every optional category appears enabled; visitors can switch them off.
 * This is a UI default only — nothing runs until the choice is confirmed.
 */
export function defaultDraftState(): ConsentState {
  return acceptAllState();
}

export const CONSENT_EVENT = "hbs:consent-change";

let cached: ConsentState | null = null;

function isFresh(state: ConsentState): boolean {
  const ts = Date.parse(state.updatedAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < CONSENT_MAX_AGE_MS;
}

/** Returns the stored decision, or `null` when the visitor has not chosen yet. */
export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed?.version !== CONSENT_VERSION || typeof parsed.updatedAt !== "string") return null;
    const state: ConsentState = {
      version: CONSENT_VERSION,
      updatedAt: parsed.updatedAt,
      necessary: true,
      performance: Boolean(parsed.performance),
      functional: Boolean(parsed.functional),
      advertising: Boolean(parsed.advertising),
      social: Boolean(parsed.social),
    };
    if (!isFresh(state)) return null;
    cached = state;
    return state;
  } catch {
    return null;
  }
}

/** Effective permissions before a decision is made: everything optional is denied. */
export function effectiveConsent(): ConsentState {
  return readConsent() ?? DENY_ALL;
}

export function hasConsentFor(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  return effectiveConsent()[category];
}

export function writeConsent(next: ConsentState): ConsentState {
  const state: ConsentState = { ...next, version: CONSENT_VERSION, necessary: true };
  cached = state;
  if (typeof window === "undefined") return state;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable in private mode — keep the in-memory choice */
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
  return state;
}

export function clearConsent(): void {
  cached = null;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: DENY_ALL }));
}

/** Subscribes to consent changes in this tab and in other tabs. */
export function onConsentChange(listener: (state: ConsentState) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const local = (event: Event) => listener((event as CustomEvent<ConsentState>).detail);
  const cross = (event: StorageEvent) => {
    if (event.key !== CONSENT_STORAGE_KEY) return;
    cached = null;
    listener(effectiveConsent());
  };
  window.addEventListener(CONSENT_EVENT, local);
  window.addEventListener("storage", cross);
  return () => {
    window.removeEventListener(CONSENT_EVENT, local);
    window.removeEventListener("storage", cross);
  };
}

/**
 * Best-effort removal of analytics/ads cookies when consent is withdrawn so the
 * "off" choice is real rather than cosmetic.
 */
export function purgeNonEssentialCookies(): void {
  if (typeof document === "undefined") return;
  const prefixes = ["_ga", "_gid", "_gcl", "_gat", "_fbp", "_fbc", "__utm"];
  const host = window.location.hostname;
  const domains = [host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !prefixes.some((p) => name.startsWith(p))) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
    }
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}
