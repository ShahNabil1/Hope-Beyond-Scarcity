import { useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PROGRAM_BUCKET } from "@/components/programs/use-program-images";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image-compress";


/** Staff-only control that uploads additional photos into a program gallery. */
export function ProgramImageUploader({ programId, slug }: { programId: string; slug: string }) {
  const { hasAnyRole } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (!hasAnyRole(["admin", "editor"])) return null;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 15MB`);
          continue;
        }
        const { file: optimised } = await compressImage(file, "gallery");
        const ext = optimised.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${slug}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(PROGRAM_BUCKET).upload(path, optimised, {
          contentType: optimised.type,
          cacheControl: "31536000",
          upsert: false,
        });
        if (error) throw new Error(error.message);
        paths.push(path);

      }

      if (paths.length === 0) return;

      const { data: current, error: readError } = await supabase
        .from("programs")
        .select("gallery_images")
        .eq("id", programId)
        .maybeSingle();
      if (readError) throw new Error(readError.message);

      const next = [...(current?.gallery_images ?? []), ...paths];
      const { error: updateError } = await supabase
        .from("programs")
        .update({ gallery_images: next })
        .eq("id", programId);
      if (updateError) throw new Error(updateError.message);

      toast.success(`${paths.length} photo${paths.length > 1 ? "s" : ""} uploaded`);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border p-4">
      <p className="text-sm font-medium text-foreground">Staff: add program photos</p>
      <p className="mt-1 text-xs text-muted-foreground">
        JPG or PNG, up to 5MB each. New photos appear in this slideshow instantly.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <ImagePlus className="size-4" aria-hidden />
        )}
        {busy ? "Uploading…" : "Upload images"}
      </Button>
    </div>
  );
}
