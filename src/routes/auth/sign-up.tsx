import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/sign-up")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create Account | Hope Beyond Scarcity" },
      {
        name: "description",
        content:
          "Create a Hope Beyond Scarcity supporter account to track donations, receipts and campaign updates.",
      },
      { property: "og:title", content: "Create Account | Hope Beyond Scarcity" },
      {
        property: "og:description",
        content: "Join Hope Beyond Scarcity and support families beyond one-time generosity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUpPage,
});

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name").max(100),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be less than 72 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
    acceptPrivacy: z.literal(true, { errorMap: () => ({ message: "You must accept the Privacy Policy" }) }),
    acceptRefund: z.literal(true, { errorMap: () => ({ message: "You must accept the Refund Policy" }) }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpValues = z.input<typeof signUpSchema>;

const consents = [
  { name: "acceptTerms", label: "Terms of Service", to: "/terms" },
  { name: "acceptPrivacy", label: "Privacy Policy", to: "/privacy" },
  { name: "acceptRefund", label: "Refund Policy", to: "/refund" },
] as const;

function SignUpPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    // All three policy checkboxes are strictly unchecked by default.
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
      acceptPrivacy: false,
      acceptRefund: false,
    },
  });

  const values = form.watch();
  const allConsentsChecked =
    values.acceptTerms === true && values.acceptPrivacy === true && values.acceptRefund === true;

  async function onSubmit(raw: SignUpValues) {
    const parsed = signUpSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please review the form.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setSubmitting(false);

    if (error) {
      toast.error(
        error.message.toLowerCase().includes("already")
          ? "An account with this email already exists. Try signing in instead."
          : error.message,
      );
      return;
    }

    setSentTo(parsed.data.email);
    if (data.session) {
      toast.success("Account created. Welcome to Hope Beyond Scarcity.");
    } else {
      toast.success("Account created — check your email to confirm it.");
    }
  }

  if (sentTo) {
    return (
      <AuthShell
        title="Check your email"
        description={`We sent a confirmation link to ${sentTo}.`}
        footer={
          <Link to="/auth" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Click the link in that email to activate your account. You can close this tab — the link
            brings you right back.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      description="Join a community funding the months after one-time generosity."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
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
                <FormLabel>Password</FormLabel>
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
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" placeholder="Re-enter your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            {consents.map((consent) => (
              <FormField
                key={consent.name}
                control={form.control}
                name={consent.name}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        I have read and agree to the{" "}
                        <Link to={consent.to} className="font-semibold text-primary hover:underline">
                          {consent.label}
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={submitting || !allConsentsChecked}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {submitting ? "Creating account…" : "Create account"}
          </Button>
          {!allConsentsChecked ? (
            <p className="text-center text-xs text-muted-foreground">
              Please accept all three policies to continue.
            </p>
          ) : null}
        </form>
      </Form>
    </AuthShell>
  );
}
