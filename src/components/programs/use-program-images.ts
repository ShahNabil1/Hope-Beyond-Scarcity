import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export const PROGRAM_BUCKET = "program-images";

const isAbsolute = (value: string) => /^(https?:)?\/\//.test(value) || value.startsWith("data:");

/**
 * Resolves a mix of absolute URLs and `program-images` storage paths into
 * displayable URLs. Storage objects are private, so paths get signed URLs.
 */
export function useProgramImages(sources: string[]) {
  const key = sources.join("|");
  const [urls, setUrls] = useState<string[]>(() => sources.filter(isAbsolute));

  useEffect(() => {
    let active = true;
    const list = key ? key.split("|").filter(Boolean) : [];
    const paths = list.filter((item) => !isAbsolute(item));

    if (paths.length === 0) {
      setUrls(list);
      return;
    }

    supabase.storage
      .from(PROGRAM_BUCKET)
      .createSignedUrls(paths, 60 * 60)
      .then(({ data }) => {
        if (!active) return;
        const signed = new Map<string, string>();
        (data ?? []).forEach((row) => {
          if (row.path && row.signedUrl) signed.set(row.path, row.signedUrl);
        });
        setUrls(list.map((item) => (isAbsolute(item) ? item : (signed.get(item) ?? ""))).filter(Boolean));
      });

    return () => {
      active = false;
    };
  }, [key]);

  return urls;
}
