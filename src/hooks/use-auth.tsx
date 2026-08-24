import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type AppRole = "admin" | "editor" | "donor";

export type AuthState = {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  /** Route a user should land on after signing in, based on their role. */
  homePath: "/admin" | "/dashboard";
  refreshRoles: () => Promise<AppRole[]>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error || !data) return [];
  return data.map((row) => row.role as AppRole);
}

export function landingPathForRoles(roles: AppRole[]): "/admin" | "/dashboard" {
  return roles.includes("admin") || roles.includes("editor") ? "/admin" : "/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession?.user) {
        setRoles([]);
        setLoading(false);
        return;
      }
      // Roles are unknown until fetched — stay in `loading` so consumers never
      // act on an empty role list (which would redirect admins to /dashboard).
      setLoading(true);
      // Defer the Supabase call out of the auth callback to avoid deadlocks.
      setTimeout(() => {
        fetchRoles(nextSession.user.id)
          .then((next) => {
            if (active) setRoles(next);
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        const next = await fetchRoles(data.session.user.id);
        if (active) setRoles(next);
      }
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const refreshRoles = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return [];
    const next = await fetchRoles(userId);
    setRoles(next);
    return next;
  }, [session?.user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setSession(null);
  }, []);

  const value = useMemo<AuthState>(() => {
    const hasRole = (role: AppRole) => roles.includes(role);
    return {
      user: session?.user ?? null,
      session,
      roles,
      loading,
      isAuthenticated: Boolean(session?.user),
      hasRole,
      hasAnyRole: (list: AppRole[]) => list.some(hasRole),
      homePath: landingPathForRoles(roles),
      refreshRoles,
      signOut,
    };
  }, [session, roles, loading, refreshRoles, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
