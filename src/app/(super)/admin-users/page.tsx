"use client";

import { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { toast } from "react-hot-toast";
import { Dialog } from "@headlessui/react";
import { UserRole } from "@prisma/client";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Tenant {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  tenant?: Tenant | null;
}

interface UserRow extends User {
  tenantName: string; // flattened for DataGrid
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: UserRole;
    tenantId: string;
  }>({
    name: "",
    email: "",
    password: "",
    role: UserRole.VIEWER,
    tenantId: "",
  });

  // Load users
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const data = await fetcher<User[]>("/api/super/users");
        const rows: UserRow[] = data.map((u) => ({
          ...u,
          tenantName: u.tenant?.name ?? "—",
        }));
        setUsers(rows);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  // Load tenants for dropdown
  useEffect(() => {
    async function loadTenants() {
      try {
        const data = await fetcher<Tenant[]>("/api/super/tenants");
        setTenants(data);
      } catch {
        toast.error("Failed to load tenants");
      }
    }
    loadTenants();
  }, []);

  const columns: GridColDef<UserRow>[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "role", headerName: "Role", flex: 1 },
    { field: "tenantName", headerName: "Tenant", flex: 1.5 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: () => <Button size="sm">Edit</Button>,
    },
  ];

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/super/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create user");

      toast.success("User created successfully");
      setOpenModal(false);
      setForm({ name: "", email: "", password: "", role: UserRole.VIEWER, tenantId: "" });

      // refresh user list
      const updated = await fetcher<User[]>("/api/super/users");
      const rows: UserRow[] = updated.map((u) => ({
        ...u,
        tenantName: u.tenant?.name ?? "—",
      }));
      setUsers(rows);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setOpenModal(true)}>+ New User</Button>
      </div>

      <div className="h-[600px] w-full">
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      {/* Create User Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md z-10 flex flex-col gap-4">
            <h2 className="text-xl font-bold mb-4">Create User</h2>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <Input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />

              {/* Role Dropdown */}
              <select
                className="bg-gray-100 dark:bg-gray-700 text-black dark:text-white p-2 rounded"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {/* Tenant Dropdown */}
              <select
                className="bg-gray-100 dark:bg-gray-700 text-black dark:text-white p-2 rounded"
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
              >
                <option value="">— No Tenant —</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => setOpenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
