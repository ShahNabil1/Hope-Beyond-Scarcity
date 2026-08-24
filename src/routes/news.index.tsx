import { useMemo, useState } from "react";
import { mediaUrl } from "@/lib/media";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock, MapPin, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { newsQueryOptions } from "@/lib/public-content";

const title = "Newsroom | Hope Beyond Scarcity";
const description =
  "Field updates, impact stories, and announcements from Hope Beyond Scarcity's work in Bangladesh and Canada.";

export const Route = createFileRoute("/news/")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(newsQueryOptions);
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <NewsFallback note="We couldn't load the newsroom right now. Please refresh in a moment." />
  ),
  notFoundComponent: () => <NewsFallback note="No stories are published yet." />,
  component: NewsIndexPage,
});

function NewsFallback({ note }: { note: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
    </section>
  );
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function NewsIndexPage() {
  const posts = useSuspenseQuery(newsQueryOptions).data ?? [];
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((post) => post.category)))],
    [posts],
  );

  const filtered = useMemo(
    () => (category === "All" ? posts : posts.filter((post) => post.category === category)),
    [posts, category],
  );

  const [lead, ...rest] = filtered;

  if (posts.length === 0) {
    return <NewsFallback note="New stories are being published shortly." />;
  }

  return (
    <>
      {/* Masthead */}
      <section className="border-b border-border bg-primary-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Newsroom</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Stories from the field
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Reporting from the villages, clinics, and classrooms your generosity supports — plus the
              numbers behind it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  category === item
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Lead story */}
        {lead ? (
          <article className="grid gap-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:grid-cols-2">
            <Link
              to="/news/$slug"
              params={{ slug: lead.slug }}
              className="group relative block aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto lg:h-full"
            >
              {lead.cover_image_url ? (
                <img
                  src={mediaUrl(lead.cover_image_url)}
                  alt={lead.title}
                  width={1600}
                  height={900}
                  className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : null}
              {lead.video_url ? (
                <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground">
                  <PlayCircle className="size-3.5" aria-hidden /> Video
                </span>
              ) : null}
            </Link>
            <div className="flex flex-col justify-center p-6 sm:p-9">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{lead.category}</Badge>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {formatDate(lead.published_at)}
                </span>
                {lead.location ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden />
                    {lead.location}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                <Link to="/news/$slug" params={{ slug: lead.slug }} className="hover:text-primary">
                  {lead.title}
                </Link>
              </h2>
              <p className="mt-3 text-base text-muted-foreground">{lead.headline ?? lead.excerpt}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button asChild>
                  <Link to="/news/$slug" params={{ slug: lead.slug }}>
                    Read the full story
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden />
                  {lead.read_minutes} min read
                </span>
              </div>
            </div>
          </article>
        ) : null}

        {/* Latest grid */}
        {rest.length > 0 ? (
          <>
            <div className="mt-14 flex items-center gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Latest stories
              </h2>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <article
                  key={post.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Link
                    to="/news/$slug"
                    params={{ slug: post.slug }}
                    className="block aspect-[16/9] overflow-hidden bg-muted"
                  >
                    {post.cover_image_url ? (
                      <img
                        src={mediaUrl(post.cover_image_url)}
                        alt={post.title}
                        loading="lazy"
                        width={1600}
                        height={900}
                        className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : null}
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <Badge variant="secondary" className="w-fit">
                      {post.category}
                    </Badge>
                    <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground">
                      <Link to="/news/$slug" params={{ slug: post.slug }} className="hover:text-primary">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {formatDate(post.published_at)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden />
                        {post.read_minutes} min
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        <div className="mt-14 rounded-3xl bg-primary-soft p-8 text-center sm:p-10">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Every story here started with a monthly donor
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Predictable giving is what lets us stay through the months after a crisis.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/donate">Give monthly</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/programs">See our programs</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
