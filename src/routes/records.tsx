import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Database,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Server,
  Filter,
} from "lucide-react";
import { mernApi, type MernRecord } from "@/lib/mern-api";
import { CATEGORIES, HOSTEL_BLOCKS } from "@/lib/complaints";
import { PageShell, PageHeading, Loader, EmptyState, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Maintenance Records — HostelFix" },
      {
        name: "description",
        content:
          "Manage hostel maintenance records connected live to the Express & MongoDB backend.",
      },
    ],
  }),
  component: MernRecordsPage,
});

function MernRecordsPage() {
  const [records, setRecords] = useState<MernRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverHealth, setServerHealth] = useState<{
    online: boolean;
    mongodb: "connected" | "disconnected";
  }>({ online: false, mongodb: "disconnected" });

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "electrical",
    hostelBlock: "Block A",
    roomNumber: "101",
    studentName: "Resident Student",
    priority: "medium",
  });

  const checkHealth = async () => {
    const health = await mernApi.checkHealth();
    setServerHealth(health);
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      await checkHealth();
      const data = await mernApi.getRecords({
        category: filterCategory,
        status: filterStatus,
      });
      setRecords(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to MERN backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filterCategory, filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Please enter both title and description");
      return;
    }

    setSubmitting(true);
    try {
      const created = await mernApi.createRecord(form);
      toast.success("Maintenance record saved successfully!");
      setRecords((prev) => [created, ...prev]);
      setForm({
        title: "",
        description: "",
        category: "electrical",
        hostelBlock: "Block A",
        roomNumber: "101",
        studentName: "Resident Student",
        priority: "medium",
      });
    } catch (err: any) {
      toast.error(err.message || "Could not save maintenance record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: MernRecord["status"]) => {
    try {
      const updated = await mernApi.updateRecord(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setRecords((prev) => prev.map((r) => (r._id === id ? updated : r)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update maintenance record");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this maintenance record?")) return;
    try {
      await mernApi.deleteRecord(id);
      toast.success("Maintenance record deleted");
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record");
    }
  };

  return (
    <PageShell>
      <PageHeading
        title="Maintenance Records"
        subtitle="Live maintenance tracking and resolution powered by Express & MongoDB."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecords}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Backend & MongoDB Status Bar */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="glass flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid size-10 place-items-center rounded-xl ${
                serverHealth.online
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              <Server className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Express Backend (Node.js)</p>
              <p className="text-sm font-semibold">
                {serverHealth.online ? "Online (Port 5000)" : "Offline / Unreachable"}
              </p>
            </div>
          </div>
          <span
            className={`size-2.5 rounded-full ${
              serverHealth.online ? "bg-success animate-pulse" : "bg-destructive"
            }`}
          />
        </div>

        <div className="glass flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid size-10 place-items-center rounded-xl ${
                serverHealth.mongodb === "connected"
                  ? "bg-success/15 text-success"
                  : "bg-warning/15 text-warning"
              }`}
            >
              <Database className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                MongoDB Database (Mongoose)
              </p>
              <p className="text-sm font-semibold">
                {serverHealth.mongodb === "connected" ? "Connected" : "Not Connected"}
              </p>
            </div>
          </div>
          <span
            className={`size-2.5 rounded-full ${
              serverHealth.mongodb === "connected" ? "bg-success" : "bg-warning"
            }`}
          />
        </div>
      </div>

      {!serverHealth.online && (
        <div className="mb-8 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning">Express Backend is not currently running</p>
              <p className="mt-1 text-xs text-muted-foreground">
                To start the Express + MongoDB server, open a new PowerShell terminal and run:
              </p>
              <code className="mt-2 block rounded bg-background/80 px-3 py-1.5 font-mono text-xs text-foreground">
                npm run server
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Create Record Form & Records List */}
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Form: Create Record in MongoDB */}
        <div className="glass h-fit rounded-3xl p-6 sm:p-7">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Plus className="size-4" />
            </span>
            <h2 className="font-display text-lg font-bold">Add Maintenance Record</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs">
                Title *
              </Label>
              <Input
                id="title"
                required
                placeholder="e.g. Water purifier filter replaced"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">
                Description *
              </Label>
              <Textarea
                id="description"
                required
                rows={3}
                placeholder="Detailed notes on maintenance performed..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={1500}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="text-xs">
                      Low
                    </SelectItem>
                    <SelectItem value="medium" className="text-xs">
                      Medium
                    </SelectItem>
                    <SelectItem value="high" className="text-xs">
                      High
                    </SelectItem>
                    <SelectItem value="urgent" className="text-xs">
                      Urgent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Block</Label>
                <Select
                  value={form.hostelBlock}
                  onValueChange={(v) => setForm({ ...form, hostelBlock: v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Block" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOSTEL_BLOCKS.map((b) => (
                      <SelectItem key={b} value={b} className="text-xs">
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="room" className="text-xs">
                  Room
                </Label>
                <Input
                  id="room"
                  className="h-9 text-xs"
                  placeholder="e.g. B-204"
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="student" className="text-xs">
                Reported By / Student
              </Label>
              <Input
                id="student"
                className="h-9 text-xs"
                placeholder="Student Name"
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2 mt-2"
              disabled={submitting || !serverHealth.online}
            >
              <Plus className="size-4" />
              {submitting ? "Saving to MongoDB..." : "Save Record (POST /api/records)"}
            </Button>
          </form>
        </div>

        {/* Records Display Section */}
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Filter className="size-4" />
              <span>Filter Records:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Categories
                  </SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="pending" className="text-xs">
                    Pending
                  </SelectItem>
                  <SelectItem value="in_progress" className="text-xs">
                    In Progress
                  </SelectItem>
                  <SelectItem value="resolved" className="text-xs">
                    Resolved
                  </SelectItem>
                  <SelectItem value="rejected" className="text-xs">
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Records List */}
          {loading ? (
            <Loader label="Fetching maintenance records..." />
          ) : records.length === 0 ? (
            <EmptyState
              title="No maintenance records found"
              description="Use the form on the left to log a new maintenance or repair record."
            />
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <motion.div
                  key={record._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass group relative rounded-2xl p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium capitalize text-secondary-foreground">
                          {record.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {record.hostelBlock} · Room {record.roomNumber}
                        </span>
                        <StatusBadge status={record.status} />
                      </div>
                      <h3 className="mt-1.5 font-display text-base font-semibold leading-snug">
                        {record.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {record.description}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(record._id)}
                      title="Delete record from MongoDB"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>
                        By: <strong className="text-foreground">{record.studentName}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(record.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Quick status update control */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">Update Status:</span>
                      <select
                        value={record.status}
                        onChange={(e) =>
                          handleStatusChange(record._id, e.target.value as MernRecord["status"])
                        }
                        className="rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
