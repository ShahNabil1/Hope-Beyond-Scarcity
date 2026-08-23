import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";

import { ProgramImageUploader } from "@/components/programs/program-image-uploader";
import { useProgramImages } from "@/components/programs/use-program-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type ProgramDetail = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description?: string | null;
  focus_area?: string | null;
  location?: string | null;
  impact_stat?: string | null;
  impact_label?: string | null;
  highlights?: string[] | null;
  image_url?: string | null;
  gallery_images?: string[] | null;
};

export function ProgramDetailDialog({ program }: { program: ProgramDetail }) {
  const [open, setOpen] = useState(false);
  const sources = [program.image_url, ...(program.gallery_images ?? [])].filter(
    (value): value is string => Boolean(value),
  );
  const images = useProgramImages(sources);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View all details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
        <div className="relative bg-muted">
          {images.length > 0 ? (
            <Carousel className="w-full" opts={{ loop: images.length > 1 }}>
              <CarouselContent>
                {images.map((src, index) => (
                  <CarouselItem key={src}>
                    <img
                      src={src}
                      alt={`${program.name} photo ${index + 1}`}
                      loading="lazy"
                      className="h-56 w-full object-cover sm:h-80"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 ? (
                <>
                  <CarouselPrevious className="left-3" />
                  <CarouselNext className="right-3" />
                </>
              ) : null}
            </Carousel>
          ) : (
            <div className="flex h-40 w-full flex-col items-center justify-center gap-2 text-muted-foreground sm:h-56">
              <ImageOff className="size-6" aria-hidden />
              <p className="text-xs">No photos uploaded yet</p>
            </div>
          )}
        </div>

        <div className="space-y-6 px-6 pb-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {program.focus_area ? <Badge variant="secondary">{program.focus_area}</Badge> : null}
              {program.location ? (
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {program.location}
                </span>
              ) : null}
            </div>
            <DialogTitle className="text-2xl">{program.name}</DialogTitle>
            <DialogDescription className="text-base">{program.summary}</DialogDescription>
          </DialogHeader>

          {program.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{program.description}</p>
          ) : null}

          {(program.highlights ?? []).length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-foreground">What your gift covers</h3>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                {(program.highlights ?? []).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {program.impact_stat ? (
            <div className="rounded-xl bg-primary-soft p-4">
              <p className="text-2xl font-bold text-primary">{program.impact_stat}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {program.impact_label ?? "Impact so far"}
              </p>
            </div>
          ) : null}

          <ProgramImageUploader programId={program.id} slug={program.slug} />

          <div className="flex flex-wrap gap-3">
            <Button asChild onClick={() => setOpen(false)}>
              <Link to="/donate">Fund this program</Link>
            </Button>
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link to="/volunteer">Volunteer with us</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
