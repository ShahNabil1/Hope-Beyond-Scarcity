import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

const BUCKET = "program-images";

/** Public URL for a stored object, served through the media proxy route. */
export function mediaUrl(value: string) {
  if (!value) return "";
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:") || value.startsWith("/")) {
    return value;
  }
  return `/api/public/media/${BUCKET}/${value}`;
}

async function uploadFile(file: File, folder: string) {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image`);
  if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is larger than 5MB`);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export function ImageInput({
  value,
  folder,
  onChange,
}: {
  value: string;
  folder: string;
  onChange: (next: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadFile(file, folder));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

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
      {value ? (
        <img
          src={mediaUrl(value)}
          alt="Selected media preview"
          className="h-32 w-full rounded-lg object-cover"
          loading="lazy"
        />
      ) : null}
    </div>
  );
}

export function GalleryInput({
  value,
  folder,
  onChange,
}: {
  value: string[];
  folder: string;
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        try {
          paths.push(await uploadFile(file, folder));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Upload failed");
        }
      }
      if (paths.length) {
        onChange([...value, ...paths]);
        toast.success(`${paths.length} image${paths.length > 1 ? "s" : ""} added`);
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
