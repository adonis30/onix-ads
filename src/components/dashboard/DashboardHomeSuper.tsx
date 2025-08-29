import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import DashboardLayout from "@/components/ProtectedLayout";
import { hasRole } from "@/lib/rbac";
import { UserRole } from "@prisma/client";

export default async function SuperDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, UserRole.SUPER_ADMIN)) redirect("/login");

  return (
    <DashboardLayout allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Super Admin Dashboard</h2>
        <p className="text-gray-400">
          Welcome, {session.user.name || session.user.email}! Manage tenants, users, and billing here.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-white">Tenants</h3>
            <p className="text-gray-400 mt-1">View and manage all tenants.</p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-white">Users</h3>
            <p className="text-gray-400 mt-1">Manage user roles and permissions.</p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-white">Billing</h3>
            <p className="text-gray-400 mt-1">View subscriptions and payments.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
