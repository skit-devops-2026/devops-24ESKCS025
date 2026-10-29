import type { Complaint } from "@/lib/complaints";

const authListeners: Array<(event: string, session: any) => void> = [];

function notifyAuthListeners(event: string, session: any) {
  authListeners.forEach((fn) => {
    try {
      fn(event, session);
    } catch (e) {
      console.warn("Auth listener warning:", e);
    }
  });
}

function getStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem("hostelfix_session");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session: any) {
  if (typeof window === "undefined") return;
  if (!session) {
    localStorage.removeItem("hostelfix_session");
  } else {
    localStorage.setItem("hostelfix_session", JSON.stringify(session));
  }
}

async function apiRequest(endpoint: string, options?: RequestInit) {
  const session = getStoredSession();
  const headers = new Headers(options?.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (session?.access_token) {
    headers.set("authorization", `Bearer ${session.access_token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  return await res.json();
}

export const localAuth = {
  async getSession() {
    const session = getStoredSession();
    return { data: { session }, error: null };
  },

  async getUser() {
    const session = getStoredSession();
    if (!session?.user) {
      return { data: { user: null }, error: { message: "No active session" } };
    }
    return { data: { user: session.user }, error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    authListeners.push(callback);
    const session = getStoredSession();
    setTimeout(() => {
      callback(session ? "INITIAL_SESSION" : "SIGNED_OUT", session);
    }, 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const idx = authListeners.indexOf(callback);
            if (idx >= 0) authListeners.splice(idx, 1);
          },
        },
      },
    };
  },

  async signInWithPassword({ email, password }: { email: string; password?: string }) {
    try {
      if (typeof window !== "undefined") {
        const res = await apiRequest("/api/local/auth/signin", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        if (res.error) throw new Error(res.error.message || "Failed to sign in");
        setStoredSession(res.data.session);
        notifyAuthListeners("SIGNED_IN", res.data.session);
        return { data: res.data, error: null };
      }
      return { data: { user: null, session: null }, error: null };
    } catch (err: any) {
      return {
        data: { user: null, session: null },
        error: { message: err?.message || "Sign in failed" },
      };
    }
  },

  async signUp({ email, password, options }: { email: string; password?: string; options?: any }) {
    try {
      if (typeof window !== "undefined") {
        const res = await apiRequest("/api/local/auth/signup", {
          method: "POST",
          body: JSON.stringify({ email, password, options }),
        });
        if (res.error) throw new Error(res.error.message || "Failed to create account");
        setStoredSession(res.data.session);
        notifyAuthListeners("SIGNED_IN", res.data.session);
        return { data: res.data, error: null };
      }
      return { data: { user: null, session: null }, error: null };
    } catch (err: any) {
      return {
        data: { user: null, session: null },
        error: { message: err?.message || "Sign up failed" },
      };
    }
  },

  async signOut() {
    try {
      if (typeof window !== "undefined") {
        await apiRequest("/api/local/auth/signout", { method: "POST" });
      }
    } catch {
      // ignore
    }
    setStoredSession(null);
    notifyAuthListeners("SIGNED_OUT", null);
    return { error: null };
  },
};

class LocalQueryBuilder {
  private table: "complaints" | "profiles" | "user_roles";
  private action: "select" | "insert" | "update" | "delete" = "select";
  private filters: Array<{ col: string; op: "eq" | "in"; val: any }> = [];
  private orderConfig: { col: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private singleMode: "single" | "maybeSingle" | null = null;
  private payload: any = null;

  constructor(table: "complaints" | "profiles" | "user_roles") {
    this.table = table;
  }

  select(_cols?: string) {
    if (this.action === "insert" || this.action === "update" || this.action === "delete") {
      return this;
    }
    this.action = "select";
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, op: "eq", val });
    return this;
  }

  in(col: string, vals: any[]) {
    this.filters.push({ col, op: "in", val: vals });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderConfig = { col, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = "single";
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }

  insert(data: any) {
    this.action = "insert";
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = "update";
    this.payload = data;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  async then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    try {
      let outcome: { data: any; error: any };
      if (typeof window !== "undefined") {
        outcome = await apiRequest("/api/local/query", {
          method: "POST",
          body: JSON.stringify({
            table: this.table,
            action: this.action,
            filters: this.filters,
            order: this.orderConfig,
            limit: this.limitCount,
            single: this.singleMode === "single",
            maybeSingle: this.singleMode === "maybeSingle",
            payload: this.payload,
          }),
        });
      } else {
        outcome = { data: this.singleMode ? null : [], error: null };
      }
      return Promise.resolve(outcome).then(onfulfilled, onrejected);
    } catch (err: any) {
      const fallback = { data: null, error: { message: err?.message || "Query failed" } };
      return Promise.resolve(fallback).then(onfulfilled, onrejected);
    }
  }
}

export const localStorageProvider = {
  from(_bucket: string) {
    return {
      async upload(path: string, file: File) {
        return new Promise<{ data: { path: string } | null; error: any }>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            try {
              const base64 = reader.result as string;
              if (typeof window !== "undefined") {
                await apiRequest("/api/local/storage/upload", {
                  method: "POST",
                  body: JSON.stringify({ path, base64 }),
                });
              }
              resolve({ data: { path }, error: null });
            } catch (err: any) {
              resolve({ data: { path }, error: null });
            }
          };
          reader.onerror = (err) => resolve({ data: null, error: err });
        });
      },

      async createSignedUrl(path: string, _expiresIn: number) {
        try {
          if (typeof window !== "undefined") {
            const res = await apiRequest(`/api/local/storage/file/${encodeURIComponent(path)}`);
            if (res.data?.signedUrl) return { data: res.data, error: null };
          }
        } catch {
          // ignore
        }
        return {
          data: {
            signedUrl:
              "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
          },
          error: null,
        };
      },

      getPublicUrl(path: string) {
        return {
          data: {
            publicUrl: `/api/local/storage/file/${encodeURIComponent(path)}`,
          },
        };
      },
    };
  },
};

export const localSupabase = {
  auth: localAuth,
  from(table: string) {
    return new LocalQueryBuilder(table as any);
  },
  storage: localStorageProvider,
};
