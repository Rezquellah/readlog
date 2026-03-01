"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/supabase/env";

interface AuthContextValue {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSupabaseConfigured = Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const getConfigError = useCallback(
    () =>
      new Error(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and Vercel project settings, then redeploy.",
      ),
    [],
  );

  const normalizeAuthError = useCallback(
    (error: unknown) => {
      if (!isSupabaseConfigured) {
        return getConfigError();
      }

      if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
        return new Error(
          "Could not reach Supabase Auth. Check your internet connection, verify NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, and confirm the Supabase project is active.",
        );
      }

      if (error instanceof Error) {
        return error;
      }

      return new Error("Authentication request failed.");
    },
    [getConfigError, isSupabaseConfigured],
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured, supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        throw getConfigError();
      }

      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },
    [getConfigError, isSupabaseConfigured, normalizeAuthError, supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        throw getConfigError();
      }

      try {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          throw error;
        }
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },
    [getConfigError, isSupabaseConfigured, normalizeAuthError, supabase],
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      throw getConfigError();
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      throw normalizeAuthError(error);
    }
  }, [getConfigError, isSupabaseConfigured, normalizeAuthError, supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      supabase,
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [isLoading, session, signIn, signOut, signUp, supabase, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
