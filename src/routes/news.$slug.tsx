import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Clock, MapPin, UserRound } from "lucide-react";

import { NewsEngagement } from "@/components/news/news-engagement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNewsPost } from "@/lib/content.functions";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }) => {
    const result = await getNewsPost({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Story unavailable | Hope Beyond Scarcity" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { post } = loaderData;
    const summary = post.headline ?? post.excerpt;
    return {
      meta: [
        { title: `${post.title} | Hope Beyond Scarcity` },
        { name: "description", content: summary.slice(0, 155) },
        { property: "og:title", content: post.title },
        { property: "og:description", content: summary.slice(0, 155) },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <ArticleFallback note="We couldn't load this story right now." />,
  notFoundComponent: () => <ArticleFallback note="This story is no longer available." />,
  component: ArticlePage,
});

function ArticleFallback({ note }: { note: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm text-muted-foreground">{note}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/news">Back to newsroom</Link>
      </Button>
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

function ArticlePage() {
  const { post, related } = Route.useLoaderData();
  const paragraphs = (post.body ?? "").split("\n\n").filter(Boolean);
  const gallery = (post.gallery_images ?? []).filter((src) => src && src !== post.cover_image_url);

  return (
    <article>
      {/* Article header */}
      <header className="border-b border-border bg-primary-soft">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
          <Link
            to="/news"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Newsroom
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge>{post.category}</Badge>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatDate(post.published_at)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              {post.read_minutes} min read
            </span>
            {post.location ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden />
                {post.location}
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            {post.title}
          </h1>
          {post.headline ? (
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.headline}</p>
          ) : null}
          {post.author_name ? (
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-foreground">
              <UserRound className="size-4 text-primary" aria-hidden />
              By {post.author_name}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        {post.cover_image_url ? (
          <figure className="overflow-hidden rounded-3xl border border-border bg-muted">
            <img
              src={post.cover_image_url}
              alt={post.title}
              width={1600}
              height={900}
              className="w-full object-cover"
            />
            <figcaption className="px-5 py-3 text-xs text-muted-foreground">
              {post.location ? `${post.location} — ` : ""}Hope Beyond Scarcity field team
            </figcaption>
          </figure>
        ) : null}

        {/* Body */}
        <div className="mt-8 space-y-5 text-[1.0625rem] leading-8 text-foreground">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph) => <p key={paragraph.slice(0, 32)}>{paragraph}</p>)
          ) : (
            <p>{post.excerpt}</p>
          )}
        </div>

        {/* Video */}
        {post.video_url ? (
          <div className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Watch
            </h2>
            <div className="mt-3 aspect-video overflow-hidden rounded-2xl border border-border bg-black">
              <iframe
                src={post.video_url}
                title={`${post.title} video`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            </div>
          </div>
        ) : null}

        {/* Gallery */}
        {gallery.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              From the field
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {gallery.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-2xl border border-border object-cover"
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Tags */}
        {(post.tags ?? []).length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {/* Donate CTA */}
        <div className="mt-10 rounded-2xl bg-primary-soft p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">Keep this work going</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Monthly gifts are what let us stay with a family long after the headline moves on.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/donate">Donate now</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/volunteer">Volunteer with us</Link>
            </Button>
          </div>
        </div>

        <NewsEngagement postId={post.id} />
      </div>

      {/* Related */}
      {related.length > 0 ? (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              More from the newsroom
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
                >
                  <Link
                    to="/news/$slug"
                    params={{ slug: item.slug }}
                    className="block aspect-[16/9] overflow-hidden bg-muted"
                  >
                    {item.cover_image_url ? (
                      <img
                        src={item.cover_image_url}
                        alt={item.title}
                        loading="lazy"
                        className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : null}
                  </Link>
                  <div className="p-5">
                    <Badge variant="secondary" className="w-fit">
                      {item.category}
                    </Badge>
                    <h3 className="mt-3 text-base font-semibold text-foreground">
                      <Link to="/news/$slug" params={{ slug: item.slug }} className="hover:text-primary">
                        {item.title}
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
