import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, HOSTEL_BLOCKS } from "@/lib/complaints";
import { PageShell, PageHeading } from "@/components/ui-kit";
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

export const Route = createFileRoute("/_authenticated/complaints/new")({
  head: () => ({
    meta: [
      { title: "Submit a complaint — HostelFix" },
      {
        name: "description",
        content:
          "Report an electrical, plumbing, internet, furniture, cleanliness or water issue in your hostel room.",
      },
      { property: "og:title", content: "Submit a complaint — HostelFix" },
      {
        property: "og:description",
        content: "Raise a hostel maintenance complaint with an optional photo in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewComplaint,
});

const schema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().trim().min(10, "Describe the issue in a bit more detail").max(1500),
  category: z.string().min(1, "Pick a category"),
});

function NewComplaint() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    hostelBlock: profile?.hostel_block ?? "",
    roomNumber: profile?.room_number ?? "",
  });

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        hostelBlock: f.hostelBlock || profile.hostel_block || "",
        roomNumber: f.roomNumber || profile.room_number || "",
      }));
    }
  }, [profile]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      let imagePath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("complaint-images")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        imagePath = path;
      }
      const { error } = await supabase.from("complaints").insert({
        student_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category as never,
        hostel_block: form.hostelBlock || null,
        room_number: form.roomNumber.trim() || null,
        image_path: imagePath,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Complaint submitted");
      navigate({ to: "/complaints" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit complaint");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell className="max-w-3xl">
      <PageHeading
        title="Submit a complaint"
        subtitle="Give the warden the details they need to fix it fast."
      />
      <form onSubmit={submit} className="glass space-y-5 rounded-3xl p-6 sm:p-8">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            maxLength={120}
            placeholder="Ceiling fan not working in room B-204"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
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
            <Label>Hostel block</Label>
            <Select
              value={form.hostelBlock}
              onValueChange={(v) => setForm({ ...form, hostelBlock: v })}
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
            <Label htmlFor="room">Room number</Label>
            <Input
              id="room"
              value={form.roomNumber}
              maxLength={20}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            rows={5}
            maxLength={1500}
            value={form.description}
            placeholder="What is wrong, since when, and anything the technician should know."
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Photo (optional)</Label>
          {preview ? (
            <div className="relative w-fit">
              <img
                src={preview}
                alt="Complaint preview"
                className="h-40 rounded-xl object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-destructive text-destructive-foreground"
                aria-label="Remove image"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
              <ImagePlus className="size-6" />
              Click to upload an image (max 5MB)
              <input type="file" accept="image/*" className="hidden" onChange={pick} />
            </label>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Submit complaint
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate({ to: "/complaints" })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
