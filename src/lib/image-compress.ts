/**
 * Client-side image resizing + compression for CMS uploads.
 *
 * Large camera/press images (5–10 MB) are downscaled to a sensible maximum
 * dimension and re-encoded as WebP before they ever reach storage, so the
 * public site ships far fewer bytes while staying visually crisp.
 */

export type CompressPreset = "icon" | "banner" | "gallery";

const PRESETS: Record<CompressPreset, { maxDim: number; quality: number }> = {
  /** Logos, partner marks, avatars. */
  icon: { maxDim: 512, quality: 0.9 },
  /** Hero / campaign / cover banners. */
  banner: { maxDim: 1920, quality: 0.82 },
  /** Program & news gallery shots. */
  gallery: { maxDim: 1600, quality: 0.82 },
};

/** Formats we never touch (vector or animated). */
const PASSTHROUGH = ["image/svg+xml", "image/gif", "image/avif"];

function supportsType(type: string) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(type).startsWith(`data:${type}`);
  } catch {
    return false;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });
}

export type CompressResult = {
  file: File;
  originalBytes: number;
  bytes: number;
  width: number;
  height: number;
  changed: boolean;
};

/**
 * Returns a resized/compressed copy of `file`. If anything goes wrong — or the
 * result would be bigger than the original — the original file is returned so
 * uploads never fail because of optimisation.
 */
export async function compressImage(
  file: File,
  preset: CompressPreset = "banner",
): Promise<CompressResult> {
  const original = {
    file,
    originalBytes: file.size,
    bytes: file.size,
    width: 0,
    height: 0,
    changed: false,
  };

  if (typeof document === "undefined") return original;
  if (!file.type.startsWith("image/") || PASSTHROUGH.includes(file.type)) return original;

  const { maxDim, quality } = PRESETS[preset];

  try {
    const source = await loadBitmap(file);
    const sw = "width" in source ? source.width : 0;
    const sh = "height" in source ? source.height : 0;
    if (!sw || !sh) return original;

    const scale = Math.min(1, maxDim / Math.max(sw, sh));
    const width = Math.max(1, Math.round(sw * scale));
    const height = Math.max(1, Math.round(sh * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
    if ("close" in source) source.close();

    const type = supportsType("image/webp") ? "image/webp" : "image/jpeg";
    // JPEG has no alpha — keep PNG when the source may be transparent.
    const outType = type === "image/jpeg" && file.type === "image/png" ? "image/png" : type;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outType, quality),
    );
    if (!blob || blob.size >= file.size) {
      return { ...original, width: sw, height: sh };
    }

    const ext = outType === "image/webp" ? "webp" : outType === "image/png" ? "png" : "jpg";
    const base = file.name.replace(/\.[^./\\]+$/, "") || "image";
    return {
      file: new File([blob], `${base}.${ext}`, { type: outType, lastModified: Date.now() }),
      originalBytes: file.size,
      bytes: blob.size,
      width,
      height,
      changed: true,
    };
  } catch {
    return original;
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
