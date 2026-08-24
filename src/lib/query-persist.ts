import { useEffect } from "react";
import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";

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

/** Bump to drop every persisted cache after a shape change. */
const CACHE_BUSTER = "hbs-public-v1";
const STORAGE_KEY = "hbs-query-cache";
const MAX_AGE = 24 * 60 * 60 * 1000;

function isPublicKey(key: readonly unknown[]) {
  return PERSISTED_KEYS.includes(String(key[0]));
}

/**
 * Persists public content queries so returning visitors get an instant paint,
 * while every mount still revalidates in the background — so CMS edits appear
 * immediately without hammering the database on each navigation.
 */
export function usePersistedPublicCache(queryClient: QueryClient) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Restore
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          buster?: string;
          savedAt?: number;
          state?: unknown;
        };
        const fresh =
          parsed.buster === CACHE_BUSTER &&
          typeof parsed.savedAt === "number" &&
          Date.now() - parsed.savedAt < MAX_AGE;
        if (fresh && parsed.state) {
          hydrate(queryClient, parsed.state);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Corrupt or unavailable storage — fall back to network only.
    }

    // 2. Save (throttled)
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      try {
        const state = dehydrate(queryClient, {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" && isPublicKey(query.queryKey),
        });
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ buster: CACHE_BUSTER, savedAt: Date.now(), state }),
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
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [queryClient]);
}

/** Clears the persisted public cache (used after a CMS publish). */
export function clearPersistedPublicCache() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
