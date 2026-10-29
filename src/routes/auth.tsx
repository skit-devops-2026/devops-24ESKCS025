import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Building2, Mail, Lock, User2, Phone, DoorClosed, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HOSTEL_BLOCKS } from "@/lib/complaints";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HostelFix Complaint Desk" },
      {
        name: "description",
        content:
          "Sign in or create your HostelFix account to raise and track hostel maintenance complaints.",
      },
      { property: "og:title", content: "Sign in — HostelFix Complaint Desk" },
      {
        property: "og:description",
        content: "Secure student and admin access to the hostel complaint management system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  roomNumber: z.string().trim().max(20).optional(),
  hostelBlock: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(20).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roomNumber: "",
    hostelBlock: "",
    phone: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              name: form.name.trim(),
              room_number: form.roomNumber.trim(),
              hostel_block: form.hostelBlock,
              phone: form.phone.trim(),
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Welcome to HostelFix!");
          navigate({ to: "/dashboard", replace: true });
        } else {
          toast.success("Account created successfully. You can now sign in.");
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        toast.success("Signed in successfully");
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aurora-bg flex min-h-screen items-center justify-center px-4 py-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md rounded-3xl p-7 sm:p-9"
      >
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <span className="font-display text-xl font-bold">
            Hostel<span className="gradient-text">Fix</span>
          </span>
        </Link>

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-secondary/70 p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mode === m ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative">{m === "login" ? "Sign in" : "Register"}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  className="pl-9"
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="Aarav Sharma"
                  maxLength={80}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                className="pl-9"
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
                placeholder="you@campus.edu"
                maxLength={255}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                required
                className="pl-9"
                value={form.password}
                onChange={(e) => set("password")(e.target.value)}
                placeholder="••••••••"
                maxLength={72}
              />
            </div>
          </div>

          {mode === "signup" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Hostel block</Label>
                <Select value={form.hostelBlock} onValueChange={set("hostelBlock")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select block" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOSTEL_BLOCKS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <div className="relative">
                  <DoorClosed className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="room"
                    className="pl-9"
                    value={form.roomNumber}
                    onChange={(e) => set("roomNumber")(e.target.value)}
                    placeholder="B-204"
                    maxLength={20}
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    className="pl-9"
                    value={form.phone}
                    onChange={(e) => set("phone")(e.target.value)}
                    placeholder="+91 98765 43210"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Protected by secure token-based authentication and role-based access.
        </p>
      </motion.div>
    </div>
  );
}
