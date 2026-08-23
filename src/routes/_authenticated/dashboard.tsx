import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, Receipt, RefreshCw, ShieldCheck, UserRound } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { DonationsSection } from "@/components/dashboard/donations-section";
import { ProfileSection } from "@/components/dashboard/profile-section";
import { RecurringSection } from "@/components/dashboard/recurring-section";
import { SecuritySection } from "@/components/dashboard/security-section";
import { VolunteerSection } from "@/components/dashboard/volunteer-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

const title = "Donor & Volunteer Portal | Hope Beyond Scarcity";
const description =
  "Manage your Hope Beyond Scarcity profile, giving history, monthly donations, volunteer applications and account security.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DonorPortalPage,
});

const TABS = [
  { value: "profile", label: "Profile", icon: UserRound },
  { value: "donations", label: "Donations", icon: Receipt },
  { value: "monthly", label: "Monthly giving", icon: RefreshCw },
  { value: "volunteer", label: "Volunteer", icon: HeartHandshake },
  { value: "security", label: "Security", icon: ShieldCheck },
] as const;

function DonorPortalPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<string>("profile");

  return (
    <>
      <PageHero
        eyebrow="Donor & Volunteer Portal"
        title="Your account"
        description="Your profile, giving history, monthly support, volunteer work and account settings — all in one place."
      />

      <section className="mx-auto w-full max-w-5xl px-4 py-10 pb-28 sm:py-14 md:pb-14">
        {loading || !user ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <div className="-mx-4 hidden overflow-x-auto px-4 pb-2 md:block">
              <TabsList className="inline-flex h-auto w-max gap-1 p-1">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-2 whitespace-nowrap">
                    <tab.icon className="size-4" aria-hidden="true" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>


            <TabsContent value="profile" className="mt-6">
              <ProfileSection userId={user.id} email={user.email ?? ""} />
            </TabsContent>
            <TabsContent value="donations" className="mt-6">
              <DonationsSection userId={user.id} />
            </TabsContent>
            <TabsContent value="monthly" className="mt-6">
              <RecurringSection userId={user.id} />
            </TabsContent>
            <TabsContent value="volunteer" className="mt-6">
              <VolunteerSection userId={user.id} email={user.email ?? ""} />
            </TabsContent>
            <TabsContent value="security" className="mt-6">
              <SecuritySection email={user.email ?? ""} />
            </TabsContent>
          </Tabs>
        )}
      </section>
    </>
  );
}
