import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNews } from "@/lib/content.functions";

const title = "News & Stories | Hope Beyond Scarcity";
const description =
  "Field updates, impact stories, and announcements from Hope Beyond Scarcity's work in Bangladesh and Canada.";

export const Route = createFileRoute("/news")({
  loader: () => getNews(),
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
  component: NewsPage,
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function NewsPage() {
  const posts = Route.useLoaderData();
  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow="Newsroom"
        title="Stories from the field"
        description="Updates from the villages, clinics, and classrooms your generosity supports."
      />

      {posts.length === 0 ? (
        <NewsFallback note="New stories are being published shortly." />
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          {featured ? (
            <article className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{featured.category}</Badge>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {formatDate(featured.published_at)}
                </span>
                {featured.location ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden />
                    {featured.location}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 max-w-3xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 max-w-3xl text-base text-muted-foreground">{featured.excerpt}</p>
              {featured.body ? (
                <div className="mt-5 max-w-3xl space-y-4 text-sm leading-relaxed text-foreground">
                  {featured.body.split("\n\n").map((paragraph) => (
                    <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
              {featured.author_name ? (
                <p className="mt-6 text-xs uppercase tracking-wide text-muted-foreground">
                  By {featured.author_name}
                </p>
              ) : null}
            </article>
          ) : null}

          {rest.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <article
                  key={post.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
                >
                  <Badge variant="secondary" className="w-fit">
                    {post.category}
                  </Badge>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{post.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {formatDate(post.published_at)}
                    </span>
                    {post.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" aria-hidden />
                        {post.location}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <div className="mt-12 rounded-2xl bg-primary-soft p-8 text-center sm:p-10">
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
      )}
    </>
  );
}
