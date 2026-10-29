import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Trash2, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, CATEGORY_MAP, HOSTEL_BLOCKS, STATUSES, type Complaint } from "@/lib/complaints";
import { PageShell, Loader, StatusBadge } from "@/components/ui-kit";
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

export const Route = createFileRoute("/_authenticated/complaints/$id")({
  head: () => ({
    meta: [
      { title: "Complaint details — HostelFix" },
      {
        name: "description",
        content: "View the full history, photo and current status of a hostel complaint.",
      },
      { property: "og:title", content: "Complaint details — HostelFix" },
      {
        property: "og:description",
        content: "Complaint status, admin remarks and assigned maintenance staff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComplaintDetail,
});

function ComplaintDetail() {
  const { id } = Route.useParams();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: complaint, isLoading } = useQuery({
    queryKey: ["complaint", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Complaint;
    },
  });

  const [edit, setEdit] = useState({
    title: "",
    description: "",
    category: "other",
    hostelBlock: "",
    roomNumber: "",
  });
  const [admin, setAdmin] = useState({ status: "pending", remarks: "", assignedTo: "" });

  useEffect(() => {
    if (!complaint) return;
    setEdit({
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      hostelBlock: complaint.hostel_block ?? "",
      roomNumber: complaint.room_number ?? "",
    });
    setAdmin({
      status: complaint.status,
      remarks: complaint.remarks ?? "",
      assignedTo: complaint.assigned_to ?? "",
    });
    if (complaint.image_path) {
      supabase.storage
        .from("complaint-images")
        .createSignedUrl(complaint.image_path, 3600)
        .then(({ data }) => setImageUrl(data?.signedUrl ?? null));
    }
  }, [complaint]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["complaint", id] });
    await queryClient.invalidateQueries({ queryKey: ["complaints"] });
  };

  const saveStudent = async () => {
    if (edit.title.trim().length < 5 || edit.description.trim().length < 10) {
      toast.error("Add a longer title and description");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("complaints")
      .update({
        title: edit.title.trim(),
        description: edit.description.trim(),
        category: edit.category as never,
        hostel_block: edit.hostelBlock || null,
        room_number: edit.roomNumber.trim() || null,
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Complaint updated");
  };

  const saveAdmin = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("complaints")
      .update({
        status: admin.status as never,
        remarks: admin.remarks.trim() || null,
        assigned_to: admin.assignedTo.trim() || null,
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Complaint updated");
  };

  const remove = async () => {
    if (!confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return;
    const { error } = await supabase.from("complaints").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Complaint deleted");
    navigate({ to: "/complaints" });
  };

  if (isLoading) return <Loader label="Loading complaint" />;
  if (!complaint)
    return (
      <PageShell className="max-w-3xl">
        <p className="text-muted-foreground">This complaint no longer exists.</p>
      </PageShell>
    );

  const Icon = CATEGORY_MAP[complaint.category]?.icon;
  const canEdit = !isAdmin && complaint.student_id === user?.id && complaint.status === "pending";

  return (
    <PageShell className="max-w-4xl">
      <Link
        to="/complaints"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to complaints
      </Link>

      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-bold sm:text-2xl">
                {complaint.title}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {CATEGORY_MAP[complaint.category]?.label}
                {complaint.hostel_block ? ` · ${complaint.hostel_block}` : ""}
                {complaint.room_number ? ` · Room ${complaint.room_number}` : ""} · raised{" "}
                {new Date(complaint.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {complaint.description}
        </p>

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Complaint attachment"
            loading="lazy"
            className="mt-5 max-h-80 rounded-2xl object-cover"
          />
        )}

        {(complaint.assigned_to || complaint.remarks) && (
          <div className="mt-6 rounded-2xl bg-secondary/60 p-4 text-sm">
            {complaint.assigned_to && (
              <p className="flex items-center gap-2">
                <UserCog className="size-4 text-primary" />
                Assigned to <strong>{complaint.assigned_to}</strong>
              </p>
            )}
            {complaint.remarks && (
              <p className="mt-2 text-muted-foreground">
                <strong className="text-foreground">Admin remarks:</strong> {complaint.remarks}
              </p>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <section className="glass mt-6 space-y-4 rounded-3xl p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold">Edit complaint</h2>
          <p className="text-sm text-muted-foreground">
            You can edit while the complaint is still pending.
          </p>
          <div className="space-y-2">
            <Label htmlFor="e-title">Title</Label>
            <Input
              id="e-title"
              maxLength={120}
              value={edit.title}
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={edit.category} onValueChange={(v) => setEdit({ ...edit, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Block</Label>
              <Select
                value={edit.hostelBlock}
                onValueChange={(v) => setEdit({ ...edit, hostelBlock: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
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
              <Label htmlFor="e-room">Room</Label>
              <Input
                id="e-room"
                maxLength={20}
                value={edit.roomNumber}
                onChange={(e) => setEdit({ ...edit, roomNumber: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-desc">Description</Label>
            <Textarea
              id="e-desc"
              rows={4}
              maxLength={1500}
              value={edit.description}
              onChange={(e) => setEdit({ ...edit, description: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveStudent} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save changes
            </Button>
            <Button variant="destructive" onClick={remove}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="glass mt-6 space-y-4 rounded-3xl p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold">Admin actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={admin.status} onValueChange={(v) => setAdmin({ ...admin, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned">Assign maintenance staff</Label>
              <Input
                id="assigned"
                maxLength={80}
                placeholder="e.g. Ramesh (Electrician)"
                value={admin.assignedTo}
                onChange={(e) => setAdmin({ ...admin, assignedTo: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              rows={3}
              maxLength={800}
              value={admin.remarks}
              onChange={(e) => setAdmin({ ...admin, remarks: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveAdmin} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Update complaint
            </Button>
            <Button variant="destructive" onClick={remove}>
              <Trash2 className="size-4" /> Delete complaint
            </Button>
          </div>
        </section>
      )}
    </PageShell>
  );
}
