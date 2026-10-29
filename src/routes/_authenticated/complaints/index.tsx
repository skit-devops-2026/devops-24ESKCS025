import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Plus, Search, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, CATEGORY_MAP, HOSTEL_BLOCKS, STATUSES, type Complaint } from "@/lib/complaints";
import { PageShell, PageHeading, SkeletonList, EmptyState, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/complaints/")({
  head: () => ({
    meta: [
      { title: "Complaints — HostelFix" },
      {
        name: "description",
        content: "Search, filter and track hostel complaints by category, block, status and date.",
      },
      { property: "og:title", content: "Complaints — HostelFix" },
      {
        property: "og:description",
        content: "Every hostel complaint with live status, filters and search.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComplaintsPage,
});

const PAGE_SIZE = 8;

function ComplaintsPage() {
  const { isAdmin, user } = useAuth();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [block, setBlock] = useState("all");
  const [from, setFrom] = useState("");
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (status !== "all" && c.status !== status) return false;
      if (block !== "all" && c.hostel_block !== block) return false;
      if (from && new Date(c.created_at) < new Date(from)) return false;
      if (
        term &&
        !`${c.title} ${c.description} ${c.assigned_to ?? ""} ${c.room_number ?? ""}`
          .toLowerCase()
          .includes(term)
      )
        return false;
      return true;
    });
  }, [data, q, category, status, block, from]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <PageShell>
      <PageHeading
        title={isAdmin ? "All complaints" : "My complaints"}
        subtitle={`${filtered.length} complaint${filtered.length === 1 ? "" : "s"} found`}
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

      <div className="glass mb-6 grid gap-3 rounded-2xl p-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search complaints…"
            value={q}
            maxLength={100}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-3 lg:col-span-1 lg:grid-cols-1 xl:grid-cols-2">
          <Select
            value={block}
            onValueChange={(v) => {
              setBlock(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All blocks</SelectItem>
              {HOSTEL_BLOCKS.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonList />
      ) : slice.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="No complaints match your filters. Try clearing the search or raising a new complaint."
          action={
            !isAdmin && (
              <Button asChild>
                <Link to="/complaints/new">Raise a complaint</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {slice.map((c, i) => {
            const Icon = CATEGORY_MAP[c.category]?.icon ?? ClipboardList;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % PAGE_SIZE) * 0.04 }}
              >
                <Link
                  to="/complaints/$id"
                  params={{ id: c.id }}
                  className="glass block h-full rounded-2xl p-5 transition-transform hover:-translate-y-1"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="truncate font-semibold">{c.title}</h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {c.description}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {CATEGORY_MAP[c.category]?.label}
                        {c.hostel_block ? ` · ${c.hostel_block}` : ""}
                        {c.room_number ? ` · Room ${c.room_number}` : ""} ·{" "}
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {current} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </PageShell>
  );
}
