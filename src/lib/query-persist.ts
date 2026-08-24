import { useEffect } from "react";
import {
  dehydrate,
  hydrate,
  type DehydratedState,
  type QueryClient,
} from "@tanstack/react-query";

import type { ContentTable } from "@/lib/admin-content";

import { getContentVersion } from "@/lib/content.functions";

/**
 * Public content query keys that are safe to persist to localStorage.
 * Anything user-specific (dashboard, admin, donations) is deliberately excluded.
 */
const PERSISTED_KEYS = [
  "home-content",
  "site-settings",
  "programs",
  "news",
  "events",
  "volunteer-roles",
  "legal-pages",
];

/** Bump to drop every persisted cache after a shape change (code-side schema). */
const SCHEMA_VERSION = "v2";
const STORAGE_KEY = "hbs-query-cache";
/** Mirrors the server `site_settings.content_version` — shared across tabs. */
export const CONTENT_VERSION_KEY = "hbs-content-version";
const MAX_AGE = 60 * 60 * 1000;

function isPublicKey(key: readonly unknown[]) {
  return PERSISTED_KEYS.includes(String(key[0]));
}

function readLocalVersion(): string | null {
  try {
    return window.localStorage.getItem(CONTENT_VERSION_KEY);
  } catch {
    return null;
  }
}

function writeLocalVersion(version: string) {
  try {
    window.localStorage.setItem(CONTENT_VERSION_KEY, version);
  } catch {
    // ignore
  }
}

/** Cache key = code schema version + server content version. */
function cacheKeyFor(version: string | null) {
  return `hbs-public-${SCHEMA_VERSION}-${version ?? "0"}`;
}

/**
 * Persists public content queries so returning visitors get an instant paint,
 * while every mount still revalidates in the background — so CMS edits appear
 * immediately without hammering the database on each navigation.
 *
 * Invalidation is versioned: the server exposes `content_version`, which is
 * bumped on every publish (or manually from admin settings). Any browser whose
 * stored version differs throws its cache away, so tabs and devices converge.
 */
export function usePersistedPublicCache(queryClient: QueryClient) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const drop = () => {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      queryClient.invalidateQueries({
        predicate: (query) => isPublicKey(query.queryKey),
      });
    };

    // Check the server version before trusting browser storage. SSR data is
    // always authoritative and persisted data only fills genuinely empty keys.
    void (async () => {
      try {
        const remote = await getContentVersion();
        if (cancelled) return;
        const next = String(remote.version ?? 1);
        const current = readLocalVersion();
        writeLocalVersion(next);
        if (current !== null && current !== next) {
          drop();
          return;
        }

        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          buster?: string;
          savedAt?: number;
          state?: DehydratedState;
        };
        const fresh =
          parsed.buster === cacheKeyFor(next) &&
          typeof parsed.savedAt === "number" &&
          Date.now() - parsed.savedAt < MAX_AGE;
        if (!fresh || !parsed.state) {
          window.localStorage.removeItem(STORAGE_KEY);
          return;
        }

        const missingQueries = parsed.state.queries.filter(
          (query) => queryClient.getQueryState(query.queryKey) === undefined,
        );
        if (missingQueries.length) {
          hydrate(queryClient, { ...parsed.state, queries: missingQueries });
          await queryClient.invalidateQueries({
            predicate: (query) => missingQueries.some((saved) => saved.queryHash === query.queryHash),
          });
        }
      } catch {
        // SSR content remains visible if version validation is unavailable.
      }
    })();


    // 3. Cross-tab invalidation: another tab cleared or bumped the cache
    const onStorage = (event: StorageEvent) => {
      if (event.key === CONTENT_VERSION_KEY || (event.key === STORAGE_KEY && !event.newValue)) {
        drop();
      }
    };
    window.addEventListener("storage", onStorage);

    // 4. Save (throttled)
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      try {
        const state = dehydrate(queryClient, {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" && isPublicKey(query.queryKey),
        });
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            buster: cacheKeyFor(readLocalVersion()),
            savedAt: Date.now(),
            state,
          }),
        );
      } catch {
        // Quota exceeded / private mode — caching stays in-memory.
      }
    };

    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, 1000);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
      unsubscribe();
    };
  }, [queryClient]);
}

/**
 * Clears the persisted public cache in this browser (used after a CMS publish).
 * Passing the new server version keeps this tab in sync and, via the `storage`
 * event, notifies every other open tab too.
 */
export function clearPersistedPublicCache(version?: number | string) {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.setItem(
      CONTENT_VERSION_KEY,
      String(version ?? Date.now()),
    );
  } catch {
    // ignore
  }
}

const PUBLIC_KEYS_BY_TABLE: Record<ContentTable, string[]> = {
  programs: ["programs"],
  news_posts: ["news"],
  events: ["events"],
  volunteer_roles: ["volunteer-roles"],
  legal_pages: ["legal-pages"],
  impact_stats: ["home-content"],
  partners: ["home-content"],
};

/** Immediately removes stale public data after any successful CMS mutation. */
export async function invalidatePublicContent(
  queryClient: QueryClient,
  table: ContentTable,
  version?: number | string,
) {
  clearPersistedPublicCache(version);
  await Promise.all(
    PUBLIC_KEYS_BY_TABLE[table].map((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    ),
  );
}
