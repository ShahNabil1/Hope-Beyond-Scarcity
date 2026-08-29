import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";

const title = "About Us | Hope Beyond Scarcity";
const description =
  "Rajasree Roy and Lilibet Yang founded Hope Beyond Scarcity to fund the months after one-time generosity runs out — walking with families in Bangladesh and Peru toward lasting change.";

export const Route = createFileRoute("/about")({
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
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Story"
        title="Hope begins with people who refuse to look away"
        description="Founded in Toronto by Rajasree Roy and Lilibet Yang, Hope Beyond Scarcity exists to fund the months after one-time generosity runs out."
      />

      {/* Lead */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="text-xl leading-relaxed text-foreground sm:text-2xl">
          Two girls. Two countries. The same quiet realization: that what decides
          whether a community holds together is often smaller than anyone expects —
          a broken pump, a check that arrives on schedule or doesn't, a visitor who
          comes once and never again.
        </p>
        <p className="mt-6 text-base text-muted-foreground">
          This is the story of how Rajasree Roy and Lilibet Yang compared notes and decided to
          fund the months after that.
        </p>
      </section>

      {/* Rajasree Roy */}
      <section className="bg-primary-soft">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Founder
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                Rajasree Roy
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Toronto, Ontario
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                Toronto
              </div>
            </div>
            <div className="space-y-5 text-lg leading-relaxed text-foreground/90">
              <p>
                Rajasree Roy grew up in Toronto. Bangladesh was her mother's voice
                on Sunday calls and her grandmother's stories — a place she knew by ear,
                not by sight.
              </p>
              <p>
                She went for the first time at fourteen, staying with an aunt who
                taught at a primary school that had gone three months without classes. The
                only water pump had broken, and there was no money to fix it until the next
                year's budget came through. Kids just stopped showing up.
              </p>
              <p>
                The school reopened days before Rajasree Roy flew home, once her aunt scraped
                together enough to send someone to buy the part herself.
              </p>
              <p className="border-l-2 border-primary pl-5 text-xl font-medium text-foreground">
                Rajasree Roy couldn't stop thinking about how small the gap was. A part. A bit
                of cash on the right day. None of it was fate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lilibet Yang */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5 text-lg leading-relaxed text-foreground/90 lg:order-2">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Founder
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                Lilibet Yang
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Toronto, Ontario
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                Toronto
              </div>
            </div>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-foreground/90 lg:order-1">
            <p>
              Lilibet Yang grew up in Toronto. Her godmother, Karen, is a missionary in Peru who
              has spent years caring for orphaned children.
            </p>
            <p>
              When Lilibet Yang was nine, she visited and spent the trip at the home
              Karen runs. She remembers one boy, maybe five or six, who beat her at a card
              game she never learned the rules to and refused to explain, just laughing
              every time she lost.
            </p>
            <p className="border-l-2 border-primary pl-5 text-xl font-medium text-foreground">
              That was the whole friendship — a game neither of them could name, for a
              week — and it was enough to leave a mark.
            </p>
          </div>
        </div>
      </section>

      {/* The convergence */}
      <section className="bg-primary-deep text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            Comparing Notes
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            They landed on the same thing
          </h2>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-primary-foreground/90">
            <p>
              Both places already had people doing the work — teachers, aunts, Karen
              herself — long before either of them showed up. What decided whether that
              work held together was smaller than they expected: a broken pump, a support
              check that arrived on schedule or didn't, a visitor who came once and never
              again.
            </p>
            <p className="text-xl font-medium text-primary-foreground">
              One-time generosity is easy, and for about a month it looks exactly like the
              real thing.
            </p>
          </div>
        </div>
      </section>

      {/* Mission statement */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <HeartHandshake className="mx-auto size-10 text-primary" aria-hidden="true" />
        <p className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Hope Beyond Scarcity exists to fund the months after that.
        </p>
        <p className="mt-4 text-base text-muted-foreground">
          A Canadian not-for-profit corporation, based in Toronto, walking with families in
          Bangladesh and Peru beyond scarcity — one sustained month at a time.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/donate">
              Donate Now
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/volunteer">Get Involved</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
