"use client";

import { useState, useEffect } from "react";
import { Plan } from "@prisma/client";
import { Dialog } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { fetcher } from "@/lib/fetcher";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  domain?: string;
  _count?: { users: number }; // optional to avoid runtime errors
}


export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    plan: "FREE" as Plan,
    primaryColor: "#1E88E5",
    accentColor: "#FFC107",
    logoUrl: "",
    domain: "",
  });

  // Fetch tenants
  async function loadTenants() {
    setLoading(true);
    try {
      const data = await fetcher<Tenant[]>("/api/super/tenants");
      setTenants(data);
    } catch {
      toast.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  // Columns for DataGrid
  const columns: GridColDef<Tenant>[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "slug", headerName: "Slug", flex: 1 },
    { field: "plan", headerName: "Plan", flex: 1 },
    {
      field: "users",
      headerName: "Users",
      flex: 0.5,
      valueGetter: (params) => (params as any).row?._count?.users ?? 0,
    },
    { field: "domain", headerName: "Domain", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      renderCell: () => <Button size="sm">View</Button>,
    },
  ];



  // Handle create tenant
  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    console.log("Creating tenant:", form);

    try {
      const res = await fetch("/api/super/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create tenant");
      toast.success("Tenant created successfully");
      setOpenModal(false);
      setForm({
        name: "",
        slug: "",
        plan: "FREE",
        primaryColor: "#1E88E5",
        accentColor: "#FFC107",
        logoUrl: "",
        domain: "",
      });
      loadTenants();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <Button onClick={() => setOpenModal(true)}>+ New Tenant</Button>
      </div>

      <div className="h-[600px] w-full">
        <DataGrid
          rows={tenants}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      {/* Create Tenant Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <form
          onSubmit={handleCreateTenant}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md z-10 flex flex-col gap-4"
        >
          <h2 className="text-xl font-bold mb-4">Create Tenant</h2>

          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
          />

          <Select
            value={form.plan}
            onValueChange={(val) => setForm({ ...form, plan: val as Plan })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Plan" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Plan).map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <label className="block text-sm mb-1">Primary Color</label>
            <Input
              type="color"
              value={form.primaryColor}
              onChange={(e) =>
                setForm({ ...form, primaryColor: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Accent Color</label>
            <Input
              type="color"
              value={form.accentColor}
              onChange={(e) =>
                setForm({ ...form, accentColor: e.target.value })
              }
            />
          </div>

          <Input
            placeholder="Logo URL"
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />
          <Input
            placeholder="Domain"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
          />

          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpenModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
