import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { fetchRoles, landingPathForRoles } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a New Password | Hope Beyond Scarcity" },
      {
        name: "description",
        content: "Choose a new password for your Hope Beyond Scarcity account.",
      },
      { property: "og:title", content: "Set a New Password | Hope Beyond Scarcity" },
      {
        property: "og:description",
        content: "Finish resetting your Hope Beyond Scarcity account password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
    });
  }, []);

  async function onSubmit(values: z.infer<typeof schema>) {
    setSaving(true);
    const { data, error } = await supabase.auth.updateUser({ password: values.password });
    if (error || !data.user) {
      setSaving(false);
      toast.error(error?.message || "We couldn't update your password. Request a new link.");
      return;
    }
    const roles = await fetchRoles(data.user.id);
    toast.success("Password updated.");
    navigate({ to: landingPathForRoles(roles), replace: true });
  }

  return (
    <AuthShell
      title="Set a new password"
      description="Choose a strong password you haven't used before."
      footer={
        <Link to="/auth" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {!ready ? (
        <p className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
          This page needs a valid recovery link. If nothing happens, request a new reset code from{" "}
          <Link to="/auth/forgot-password" className="font-semibold text-primary hover:underline">
            Forgot password
          </Link>
          .
        </p>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" placeholder="At least 8 characters" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" placeholder="Re-enter your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={saving || !ready}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {saving ? "Saving…" : "Update password"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
