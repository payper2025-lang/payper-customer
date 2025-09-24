"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Table } from "@/utils/types";

interface Profile {
  id: string;
  name: string;
  email: string;
  balance: number;
  address?: string;
  phone?: string;
  created_at?: string;
  table_id?: string;
  qr_id?: any;
  table?: Table;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setQrId: (qrId: string, userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabaseClient = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getUserProfile = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*, qr_id(*), table:tables!table_id(*)")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setQrId = useCallback(async (qrId: string, userId?: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          qr_id: qrId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update QR ID");
    } catch (error) {
      console.error("Error setting QR ID:", error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabaseClient.auth.signOut();
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }, [router, supabaseClient.auth]);

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      setSession(data.session);
      setUser(data.user);

      if (data.user) {
        const profile = await getUserProfile(data.user.id);
        console.log('session refresh profile ------>', profile)
        setProfile(profile);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getUserProfile]);

  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(setProfile);
    }
  }, [user, getUserProfile]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("profiles_realtime_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async () => {
          try {
            const profile = await getUserProfile(user.id);
            setProfile(profile);
          } catch (error) {
            console.error("Error fetching updated profile:", error);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to changes for user ${user.id}`);
        }
        if (err) {
          console.error("Subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, getUserProfile]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (event === "SIGNED_IN") {
        const redirectTo = localStorage.getItem("redirectTo") || "/menu";
        const qrId = localStorage.getItem("qrId");

        if (qrId && session?.user?.id) {
          await setQrId(qrId, session.user.id);
          localStorage.removeItem("qrId");
        }

        const isNewUser =
          Date.now() -
            (new Date(session?.user?.created_at || 0).getTime() || 0) <
          5000;

        if (isNewUser && session?.user?.email) {
          try {
            await fetch("/api/mails", {
              method: "POST",
              body: JSON.stringify({
                email: session.user.email,
                type: "sign_up",
                userName: session.user.user_metadata?.name,
              }),
            });
          } catch (error) {
            console.error("Error sending welcome email:", error);
          }
        }

        localStorage.removeItem("redirectTo");
        if (window.location.pathname === "/login") {
          router.push(redirectTo);
        }
      }

      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setQrId]);

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      isLoading,
      signOut,
      refreshSession,
      setQrId,
    }),
    [user, profile, session, isLoading, signOut, refreshSession, setQrId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
