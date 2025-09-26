"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiFetchJson } from "@/lib/api"; // ✅ use apiFetchJson

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export default function CampaignsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false); // for create modal
  const [editing, setEditing] = useState<Campaign | null>(null); // for edit modal
  const [deleting, setDeleting] = useState<Campaign | null>(null); // for delete modal

  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [session]); // ✅ wait for session

  async function load() {
    if (!session) return;
    try {
      const data = await apiFetchJson<Campaign[]>(
        "/api/tenants/campaigns",
        {},
        session
      );
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign() {
    if (!session) return;
    setSaving(true);
    try {
      await apiFetchJson<Campaign>(
        "/api/tenants/campaigns",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
        session
      );

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

  async function updateCampaign() {
    if (!editing || !session) return;
    setSaving(true);
    try {
      await apiFetchJson<Campaign>(
        `/api/tenants/campaigns/${editing.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(form),
        },
        session
      );

      setEditing(null);
      setForm({ name: "", description: "", isActive: true });
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to update campaign");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCampaign() {
    if (!deleting || !session) return;
    try {
      await apiFetchJson<Campaign>(
        `/api/tenants/campaigns/${deleting.id}`,
        { method: "DELETE" },
        session
      );
      setDeleting(null);
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to delete campaign");
    }
  }

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm({ name: "", description: "", isActive: true });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Campaigns</h1>
        {role === "TENANT_ADMIN" && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <p className="text-gray-400">No campaigns yet.</p>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-white/10 bg-gray-800 p-4 shadow-sm flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-medium text-white">{c.name}</h3>
                <p className="text-gray-400 text-sm">{c.description}</p>
                <p
                  className={`mt-1 text-xs font-medium ${
                    c.isActive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {c.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              {role === "TENANT_ADMIN" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setForm({
                        name: c.name,
                        description: c.description ?? "",
                        isActive: c.isActive,
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5 text-sm"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleting(c)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-red-400 hover:bg-red-500/10 text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ✅ Modals unchanged (they now call apiFetchJson correctly) */}
      {(open || editing) && role === "TENANT_ADMIN" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-gray-800 border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editing ? "Edit Campaign" : "Create Campaign"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="rounded border-gray-600"
                />
                <label className="text-sm text-gray-300">Active</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                onClick={editing ? updateCampaign : createCampaign}
                disabled={saving || !form.name.trim()}
              >
                {saving
                  ? editing
                    ? "Updating…"
                    : "Creating…"
                  : editing
                  ? "Update"
                  : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && role === "TENANT_ADMIN" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-gray-800 border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              Delete Campaign
            </h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-red-400">
                {deleting.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white"
                onClick={deleteCampaign}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
