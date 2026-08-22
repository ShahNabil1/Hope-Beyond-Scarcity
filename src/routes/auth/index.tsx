import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info, Loader2 } from "lucide-react";
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
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { fetchRoles, landingPathForRoles, useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign In | Hope Beyond Scarcity" },
      {
        name: "description",
        content:
          "Sign in to your Hope Beyond Scarcity account to manage donations, receipts and your supporter profile.",
      },
      { property: "og:title", content: "Sign In | Hope Beyond Scarcity" },
      {
        property: "og:description",
        content: "Access your donor portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignInPage,
});

const signInSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(72),
});

function SignInPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, homePath } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: homePath, replace: true });
    }
  }, [loading, isAuthenticated, homePath, navigate]);

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error || !data.user) {
      setSubmitting(false);
      toast.error(
        error?.message?.toLowerCase().includes("invalid")
          ? "Invalid credentials. Please check your email and password."
          : (error?.message ?? "Unable to sign in. Please try again."),
      );
      return;
    }

    const roles = await fetchRoles(data.user.id);
    toast.success("Welcome back.");
    navigate({ to: landingPathForRoles(roles), replace: true });
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) {
      setGoogleLoading(false);
      toast.error(error.message || "Google sign-in is unavailable right now.");
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Access your donor portal."
      footer={
        <>
          New to Hope Beyond Scarcity?{" "}
          <Link to="/auth/sign-up" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleMark />
        )}
        Continue with Google
      </Button>

    </AuthShell>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.93l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.28a12 12 0 0 0 0 10.73l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.2 15.24 0 12 0A12 12 0 0 0 1.28 6.63l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}
