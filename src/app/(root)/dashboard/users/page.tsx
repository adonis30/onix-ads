"use client";

import { useEffect, useState } from "react";
import CreateUserForm from "./components/createUserForm";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { User as UserIcon, Mail, Shield, Trash2, Loader2, UserPlus } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant?: { id: string; name: string };
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const tenantId = session?.user?.tenantId ?? "";
  const userRole = session?.user?.role ?? "";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.tenantId && session?.user?.role) {
      fetchUsers();
    }
  }, [status, session]);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch("/api/tenants/users", { method: "GET" }, session ?? undefined);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-8 space-y-8 bg-gray-900 min-h-screen">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <UserIcon className="w-7 h-7 text-blue-400" />
          Users
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage user roles and access within your tenant.
        </p>
      </header>

      {/* Create User Section */}
      {userRole === "ADMIN" && (
        <div className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg border border-gray-700 transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-400" />
            Create New User
          </h2>
          <CreateUserForm tenantId={tenantId} onUserCreated={fetchUsers} />
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="ml-2 text-gray-400">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <p className="text-gray-400 italic">No users found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg border border-gray-700 transition-shadow space-y-4"
            >
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-400" />
                  {user.name}
                </h2>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {user.email}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Role Selector */}
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <select
                    value={user.role}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      try {
                        const res = await fetch(`/api/tenants/users/${user.id}`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            "x-tenant-id": tenantId,
                            "x-user-role": "ADMIN",
                          },
                          body: JSON.stringify({ role: newRole }),
                        });
                        if (!res.ok) throw new Error("Failed to update role");
                        fetchUsers();
                      } catch (err) {
                        console.error(err);
                        alert("Error updating role");
                      }
                    }}
                    className="text-sm px-2 py-1 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                {/* Delete Button */}
                <button
                  onClick={async () => {
                    if (!confirm(`Delete user ${user.name}?`)) return;
                    try {
                      const res = await fetch(`/api/users/${user.id}`, {
                        method: "DELETE",
                        headers: {
                          "x-tenant-id": tenantId,
                          "x-user-role": "ADMIN",
                        },
                      });
                      if (!res.ok) throw new Error("Failed to delete user");
                      fetchUsers();
                    } catch (err) {
                      console.error(err);
                      alert("Error deleting user");
                    }
                  }}
                  className="text-sm px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
