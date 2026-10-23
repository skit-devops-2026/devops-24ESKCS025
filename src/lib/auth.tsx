import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  name: string;
  email: string;
  room_number: string | null;
  hostel_block: string | null;
  phone: string | null;
};

type AuthValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (userId: string) => {
    try {
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,name,email,room_number,hostel_block,phone")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      setProfile((p as Profile) ?? null);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    } catch (e) {
      console.warn("Could not load user profile:", e);
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        if (s?.user) {
          setTimeout(() => void load(s.user.id), 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      });
      if (sub?.subscription) {
        unsubscribe = () => sub.subscription.unsubscribe();
      }
    } catch (err) {
      console.warn("Auth state change subscription warning:", err);
    }

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data?.session ?? null);
        if (data?.session?.user) await load(data.session.user.id);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Auth getSession error:", err);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isAdmin,
        loading,
        refreshProfile: async () => {
          if (session?.user) await load(session.user.id);
        },
        signOut: async () => {
          await supabase.auth.signOut();
          setProfile(null);
          setIsAdmin(false);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
