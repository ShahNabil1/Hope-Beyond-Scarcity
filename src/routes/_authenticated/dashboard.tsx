import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHero } from "@/components/page-hero";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { passwordSchema } from "@/lib/password";
import { supabase } from "@/lib/supabase";

const title = "Donor Dashboard | Hope Beyond Scarcity";
const description =
  "Manage your Hope Beyond Scarcity supporter profile, contact details, and account password.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DonorDashboardPage,
});

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
});

const passwordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function DonorDashboardPage() {
  const { user, roles } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        profileForm.reset({
          fullName: data?.full_name ?? (user.user_metadata?.["full_name"] as string) ?? "",
        });
        setLoadingProfile(false);
      });
    return () => {
      active = false;
    };
  }, [user, profileForm]);

  async function saveProfile(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: values.fullName })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      toast.error(error.message || "Could not save your profile.");
      return;
    }
    toast.success("Profile updated.");
  }

  async function savePassword(values: z.infer<typeof passwordFormSchema>) {
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message || "Could not update your password.");
      return;
    }
    passwordForm.reset({ password: "", confirmPassword: "" });
    toast.success("Password updated.");
  }

  return (
    <>
      <PageHero
        eyebrow="Donor Portal"
        title="Your account"
        description="Keep your supporter details current. Giving history and tax receipts arrive with the next phase."
      />

      <section className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12 sm:py-16">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Signed in as <span className="font-medium text-foreground">{user?.email}</span>
              {roles.length ? (
                <>
                  {" · "}
                  <span className="uppercase tracking-wide">{roles.join(", ")}</span>
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProfile ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            ) : (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4" noValidate>
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input autoComplete="name" placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>Email address</FormLabel>
                    <Input value={user?.email ?? ""} readOnly disabled />
                  </div>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                    {savingProfile ? "Saving…" : "Save changes"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Choose a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(savePassword)} className="space-y-4" noValidate>
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          {...field}
                        />
                      </FormControl>
                      <PasswordStrength value={field.value} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          autoComplete="new-password"
                          placeholder="Re-enter your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {savingPassword ? "Updating…" : "Update password"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
