"use client";

import { useState } from "react";

interface Props {
  tenantId: string;
  onUserCreated?: () => void;
}

export default function CreateUserForm({ tenantId, onUserCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/tenants/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-role": "ADMIN",
        },
        body: JSON.stringify({ name, email, role }),
      });

      if (!res.ok) throw new Error("Failed to create user");

      setName("");
      setEmail("");
      setRole("USER");

      if (onUserCreated) onUserCreated();

      alert("✅ User created successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6 shadow-md max-w-md"
    >
      <h2 className="text-xl font-semibold text-white">Create New User</h2>

      <div className="space-y-2">
        <label className="block text-sm text-gray-400">Name</label>
        <input
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-400">Email</label>
        <input
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-400">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
