"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { Plus, Rocket, Pause, CircleCheck, Pencil, Trash2 } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const tenantId = session?.user?.tenantId ?? "";
  const role = session?.user?.role ?? "";

  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isActive: true });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await apiFetch("/api/tenants/campaigns", { method: "GET" }, session ?? undefined);
      if (!res.ok) throw new Error(await res.text());
      const data: Campaign[] = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  async function createCampaign() {
    setSaving(true);
    try {
      const res = await apiFetch(
        "/api/tenants/campaigns",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
        session ?? undefined
      );
      if (!res.ok) throw new Error(await res.text());
      setOpen(false);
      setForm({ name: "", description: "", isActive: true });
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to create campaign");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res = await apiFetch(
        `/api/tenants/campaigns/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !isActive }),
        },
        session ?? undefined
      );
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to update campaign");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this campaign?")) return;
    try {
      const res = await apiFetch(`/api/tenants/campaigns/${id}`, { method: "DELETE" }, session ?? undefined);
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to delete campaign");
    }
  }

  return (
    <div className="bg-gray-900 min-h-screen p-8 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">📣 Campaigns</h1>
          <p className="text-gray-400 mt-1">Create and manage your marketing campaigns.</p>
        </div>

        {role === "ADMIN" && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        )}
      </div>

      {/* Create Modal */}
      {open && role === "ADMIN" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-gray-800 border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Create Campaign</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg bg-gray-900 text-gray-100 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Summer Promo"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg bg-gray-900 text-gray-100 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional details…"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="accent-blue-500"
                />
                Active
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                  onClick={createCampaign}
                  disabled={saving || !form.name.trim()}
                >
                  {saving ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-gray-400">Loading campaigns…</p>
      ) : items.length === 0 ? (
        <div className="text-gray-400 border border-dashed border-white/10 rounded-xl p-10 text-center">
          No campaigns yet. Click <span className="text-white">New Campaign</span> to create your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((c) => (
            <div
              key={c.id}
              className="rounded-xl bg-gray-800 border border-white/10 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">{c.name}</h3>
                  {c.description && (
                    <p className="text-sm text-gray-400">{c.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Created {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                    c.isActive
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  }`}
                >
                  {c.isActive ? (
                    <>
                      <Rocket className="w-3 h-3" /> Active
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3" /> Paused
                    </>
                  )}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={() => toggleActive(c.id, c.isActive)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5 text-sm"
                >
                  {c.isActive ? <Pause className="w-4 h-4" /> : <CircleCheck className="w-4 h-4" />}
                  {c.isActive ? "Pause" : "Activate"}
                </button>

                <button
                  onClick={() => alert("Edit dialog not implemented in this snippet")}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5 text-sm"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>

                <button
                  onClick={() => remove(c.id)}
                  className="ml-auto inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
