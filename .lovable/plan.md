# Reliable SSR Loading and Cache Invalidation

## Goal
Keep every public page visually complete during reload, preserve fast repeat navigation, and ensure CMS updates replace old cached content without a stale flash.

## Changes
1. **Fix blank first paint**
   - Make homepage reveal wrappers render visible in SSR/first paint instead of outputting opacity-zero content before JavaScript hydrates.
   - Keep subtle motion as progressive enhancement, with reduced-motion support.

2. **Use SSR as the source of truth**
   - Await critical public queries in route loaders so homepage, programs, news, events, and volunteer content is present in the initial HTML.
   - Set Router preload freshness to `0` so TanStack Query—not a second router cache—controls freshness.
   - Keep stable, branded pending/error layouts so navigation never collapses to an empty page.

3. **Correct persisted-cache behavior**
   - Never let localStorage hydration replace fresher SSR data.
   - Restore persisted public data only when the in-memory/SSR query is empty, then revalidate it.
   - Tighten persistence lifetime and continue excluding all account, donation, dashboard, and admin data.
   - Check the server content version before trusting stored data; discard mismatched cache atomically and synchronize invalidation across tabs.

4. **Make every CMS publish invalidate correctly**
   - Bump `site_settings.content_version` inside every public-content create, edit, delete, publish/unpublish, feature, and reorder server mutation.
   - Return the new version to the CMS and clear/invalidate the exact affected public query keys immediately.
   - Keep admin list invalidation separate from public cache invalidation.

5. **Performance and accessibility verification**
   - Preload the homepage LCP image and give critical imagery stable dimensions.
   - Verify hard reload and client navigation for homepage and all database-backed public routes at desktop and mobile sizes.
   - Verify the rendered page is nonblank before hydration, CMS changes invalidate old content, and browser console/network show no new errors.

## Technical Notes
- TanStack Query remains the single runtime cache owner.
- Hard reloads receive fresh SSR-rendered content; client navigations use cached data with background revalidation.
- Persisted cache is fallback acceleration only, never allowed to overwrite server-rendered truth.
