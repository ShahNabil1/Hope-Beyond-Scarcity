export const MEDIA_BUCKET = "program-images";

/**
 * Resolves a CMS media value to a displayable URL. Absolute URLs pass through;
 * storage object paths are served through the public media proxy route.
 */
export function mediaUrl(value: string | null | undefined): string {
  if (!value) return "";
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:") || value.startsWith("/")) {
    return value;
  }
  return `/api/public/media/${MEDIA_BUCKET}/${value}`;
}
