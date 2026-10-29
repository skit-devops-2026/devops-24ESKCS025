import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORY_MAP, type Complaint } from "@/lib/complaints";
import { PageShell, PageHeading, SkeletonList, EmptyState, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — HostelFix" },
      {
        name: "description",
        content: "Live statistics for hostel complaints: pending, in progress and resolved issues.",
      },
      { property: "og:title", content: "Dashboard — HostelFix" },
      {
        property: "og:description",
        content: "Track hostel complaint activity with charts and recent updates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary-glow)",
  "var(--muted-foreground)",
];

function Dashboard() {
  const { isAdmin, profile, user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["complaints", isAdmin ? "all" : user?.id],
    queryFn: async () => {
      let query = supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isAdmin && user?.id) {
        query = query.eq("student_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Complaint[];
    },
  });

  const list = data ?? [];
  const stats = [
    { label: "Total", value: list.length, icon: ClipboardList, tone: "text-primary bg-primary/10" },
    {
      label: "Pending",
      value: list.filter((c) => c.status === "pending").length,
      icon: Clock,
      tone: "text-warning bg-warning/10",
    },
    {
      label: "In progress",
      value: list.filter((c) => c.status === "in_progress").length,
      icon: AlertTriangle,
      tone: "text-info bg-info/10",
    },
    {
      label: "Resolved",
      value: list.filter((c) => c.status === "resolved").length,
      icon: CheckCircle2,
      tone: "text-success bg-success/10",
    },
  ];

  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      name: d.toLocaleString("en", { month: "short" }),
      count: 0,
    };
  });
  list.forEach((c) => {
    const d = new Date(c.created_at);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.count += 1;
  });

  const byCategory = Object.entries(
    list.reduce<Record<string, number>>((acc, c) => {
      acc[c.category] = (acc[c.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([k, v]) => ({ name: CATEGORY_MAP[k]?.label ?? k, value: v }));

  return (
    <PageShell>
      <PageHeading
        title={isAdmin ? "Admin overview" : `Hi, ${profile?.name?.split(" ")[0] ?? "there"}`}
        subtitle={
          isAdmin
            ? "Every complaint across all hostel blocks, at a glance."
            : "Your complaint activity and current status."
        }
        action={
          !isAdmin && (
            <Button asChild>
              <Link to="/complaints/new">
                <Plus className="size-4" /> New complaint
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${s.tone}`}>
                <s.icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold">{isLoading ? "—" : s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="glass rounded-2xl p-5 lg:col-span-3">
          <h2 className="font-display text-base font-semibold">Complaints per month</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-display text-base font-semibold">By category</h2>
          <div className="mt-4 h-64">
            {byCategory.length === 0 ? (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--popover-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {byCategory.map((c, i) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                {c.name} · {c.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Recent activity</h2>
          <Link
            to="/complaints"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <SkeletonList rows={3} />
        ) : list.length === 0 ? (
          <EmptyState
            title="No complaints yet"
            description="When a complaint is raised it will appear here with its live status."
            action={
              !isAdmin && (
                <Button asChild>
                  <Link to="/complaints/new">Raise your first complaint</Link>
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {list.slice(0, 5).map((c) => {
              const Icon = CATEGORY_MAP[c.category]?.icon ?? ClipboardList;
              return (
                <Link
                  key={c.id}
                  to="/complaints/$id"
                  params={{ id: c.id }}
                  className="glass flex items-center gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {CATEGORY_MAP[c.category]?.label} ·{" "}
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
