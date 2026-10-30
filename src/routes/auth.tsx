import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Building2,
  Mail,
  Lock,
  User2,
  Phone,
  DoorClosed,
  Loader2,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
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
      { title: "Sign in — HostelFix Complaint & Maintenance Desk" },
      {
        name: "description",
        content:
          "Sign in as Head Warden or Resident Student to manage complaints, maintenance records, and asset inventory.",
      },
      { property: "og:title", content: "Sign in — HostelFix" },
      {
        property: "og:description",
        content: "Role-based access for Head Wardens and Resident Students.",
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
  role: z.enum(["admin", "student"]),
  roomNumber: z.string().trim().max(20).optional(),
  hostelBlock: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(20).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [targetRole, setTargetRole] = useState<"admin" | "student">("admin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roomNumber: "",
    hostelBlock: "Block A",
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
        const parsed = signUpSchema.safeParse({ ...form, role: targetRole });
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
              role: targetRole,
              room_number: targetRole === "student" ? form.roomNumber.trim() : "Warden Office",
              hostel_block: form.hostelBlock,
              phone: form.phone.trim(),
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success(
            targetRole === "admin"
              ? "Welcome, Head Warden!"
              : "Welcome to HostelFix, Resident Student!",
          );
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
        toast.success(
          targetRole === "admin" ? "Signed in as Head Warden" : "Signed in as Resident Student",
        );
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

        {/* Tab 1: Sign in vs Register */}
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

        {/* Role Portal Selector: Head Warden vs Resident Student */}
        <div className="mb-6 space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {mode === "login" ? "Sign in as" : "Account Role"}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTargetRole("admin");
                if (mode === "login" && !form.email) {
                  setForm((f) => ({ ...f, email: "admin@campus.edu" }));
                }
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                targetRole === "admin"
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <ShieldCheck className="size-4 shrink-0" />
              <span>Head Warden</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetRole("student");
                if (mode === "login" && (!form.email || form.email === "admin@campus.edu")) {
                  setForm((f) => ({ ...f, email: "student@campus.edu" }));
                }
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                targetRole === "student"
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <GraduationCap className="size-4 shrink-0" />
              <span>Student</span>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {targetRole === "admin"
              ? "👑 Full administrator authority to create/edit maintenance records and asset inventory."
              : "🎓 Resident student portal to submit and track maintenance complaints."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">
                {targetRole === "admin" ? "Warden Name" : "Student Full Name"}
              </Label>
              <div className="relative">
                <User2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  className="pl-9"
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder={targetRole === "admin" ? "Dr. K. S. Rathore (Head Warden)" : "Aarav Sharma"}
                  maxLength={80}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">
              {targetRole === "admin" ? "Head Warden Email" : "Student Email"}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                className="pl-9"
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
                placeholder={targetRole === "admin" ? "admin@campus.edu" : "student@campus.edu"}
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
                <Label>{targetRole === "admin" ? "Assigned Hostel Block" : "Hostel Block"}</Label>
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
                <Label htmlFor="room">
                  {targetRole === "admin" ? "Office Location" : "Room Number"}
                </Label>
                <div className="relative">
                  <DoorClosed className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="room"
                    className="pl-9"
                    value={form.roomNumber}
                    onChange={(e) => set("roomNumber")(e.target.value)}
                    placeholder={targetRole === "admin" ? "Warden Office 101" : "B-204"}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">Contact Phone</Label>
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

          <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin mr-2" />}
            {mode === "login"
              ? targetRole === "admin"
                ? "Sign in as Head Warden"
                : "Sign in as Student"
              : targetRole === "admin"
              ? "Register as Head Warden"
              : "Register as Student"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Protected by token authentication and role-based access control.
        </p>
      </motion.div>
    </div>
  );
}
