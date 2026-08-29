import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { MEDIA_BUCKET as BUCKET, mediaUrl } from "@/lib/media";
import { compressImage, formatBytes, type CompressPreset } from "@/lib/image-compress";

export { mediaUrl };

/** Folders whose images are small marks rather than full-width photography. */
function presetForFolder(folder: string): CompressPreset {
  if (/partner|logo|icon|avatar/i.test(folder)) return "icon";
  if (/gallery/i.test(folder)) return "gallery";
  return "banner";
}

async function uploadFile(file: File, folder: string, preset?: CompressPreset) {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image`);
  if (file.size > 15 * 1024 * 1024) throw new Error(`${file.name} is larger than 15MB`);

  const result = await compressImage(file, preset ?? presetForFolder(folder));
  const upload = result.file;
  if (upload.size > 5 * 1024 * 1024) {
    throw new Error(`${file.name} is still larger than 5MB after optimising`);
  }

  const ext = upload.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, upload, {
    contentType: upload.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return { path, result };
}


export function ImageInput({
  value,
  folder,
  onChange,
  preset,
  contain,
}: {
  value: string;
  folder: string;
  onChange: (next: string) => void;
  preset?: CompressPreset;
  contain?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setInfo(null);
    try {
      const { path, result } = await uploadFile(file, folder, preset);
      onChange(path);
      setInfo(
        result.changed
          ? `Optimised ${formatBytes(result.originalBytes)} → ${formatBytes(result.bytes)}${
              result.width ? ` · ${result.width}×${result.height}px` : ""
            }`
          : `Uploaded · ${formatBytes(result.bytes)}`,
      );
      toast.success(
        result.changed
          ? `Image optimised — ${formatBytes(result.originalBytes)} → ${formatBytes(result.bytes)}`
          : "Image uploaded",
      );
    } catch (error) {
      setInfo(null);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const previewSrc = localPreview ?? (value ? mediaUrl(value) : null);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste an image URL or upload a file"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        </Button>
      </div>
      {previewSrc ? (
        <div className="space-y-1">
          <div className="relative overflow-hidden rounded-lg border bg-muted/40">
            <img
              src={previewSrc}
              alt="Selected media preview"
              className={`h-32 w-full ${contain ? "object-contain p-3" : "object-cover"}`}
              loading="lazy"
            />
            {busy ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            ) : null}
            {value ? (
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => {
                  onChange("");
                  setInfo(null);
                }}
                className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>
          {info ? <p className="text-xs text-muted-foreground">{info}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function GalleryInput({
  value,
  folder,
  onChange,
  preset,
}: {
  value: string[];
  folder: string;
  onChange: (next: string[]) => void;
  preset?: CompressPreset;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const paths: string[] = [];
      let saved = 0;
      for (const file of Array.from(files)) {
        try {
          const { path, result } = await uploadFile(file, folder, preset);
          paths.push(path);
          saved += result.originalBytes - result.bytes;
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Upload failed");
        }
      }
      if (paths.length) {
        onChange([...value, ...paths]);
        toast.success(`${paths.length} image${paths.length > 1 ? "s" : ""} added`, {
          description: saved > 0 ? `${formatBytes(saved)} saved by optimising` : undefined,
        });
      }

    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {value.map((item, index) => (
          <div key={`${item}-${index}`} className="relative">
            <img
              src={mediaUrl(item)}
              alt={`Gallery item ${index + 1}`}
              className="size-24 rounded-lg object-cover"
              loading="lazy"
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {busy ? "Uploading…" : "Add images"}
      </Button>
    </div>
  );
}
