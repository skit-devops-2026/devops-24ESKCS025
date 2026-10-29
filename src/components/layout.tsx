import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Building2, Menu, Moon, Sun, X, LogOut, LayoutDashboard, User2 } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const links = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/complaints", label: isAdmin ? "All Complaints" : "My Complaints" },
        ...(isAdmin ? [{ to: "/students", label: "Students" }] : []),
        { to: "/records", label: "Maintenance Records" },
        { to: "/profile", label: "Profile" },
      ]
    : [{ to: "/records", label: "Maintenance Records" }];

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass border-x-0 border-t-0">
        <nav className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Building2 className="size-5" />
            </span>
            <span className="truncate font-display text-lg font-bold tracking-tight">
              Hostel<span className="gradient-text">Fix</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  path === l.to && "bg-secondary text-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="ml-1 grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            {user ? (
              <div className="ml-2 flex items-center gap-2">
                <span className="hidden max-w-32 truncate text-sm text-muted-foreground lg:block">
                  {profile?.name || user.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="size-4" /> Sign out
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="ml-2">
                <Link to="/auth">Get started</Link>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="grid size-9 place-items-center rounded-lg text-muted-foreground"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              className="grid size-9 place-items-center rounded-lg text-muted-foreground"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 pb-4">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ))}
                {user ? (
                  <Button variant="outline" onClick={signOut} className="mt-2">
                    <LogOut className="size-4" /> Sign out
                  </Button>
                ) : (
                  <Button asChild className="mt-2">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Get started
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </span>
            <span className="font-display text-lg font-bold">
              Hostel<span className="gradient-text">Fix</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A modern complaint desk for hostel residents and wardens — report, track and resolve
            issues without paperwork.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Product</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 hover:text-foreground"
              >
                <LayoutDashboard className="size-3.5" /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/complaints" className="hover:text-foreground">
                Complaints
              </Link>
            </li>
            <li>
              <Link to="/records" className="hover:text-foreground">
                Maintenance Records
              </Link>
            </li>
            <li>
              <Link to="/profile" className="inline-flex items-center gap-2 hover:text-foreground">
                <User2 className="size-3.5" /> Profile
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Categories covered</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Electrical · Plumbing · Internet · Furniture · Cleanliness · Water · Other
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} HostelFix. Built for campus living.
      </div>
    </footer>
  );
}
