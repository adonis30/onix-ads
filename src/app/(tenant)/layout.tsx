"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  FolderIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  BellIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

type Tenant = {
  id: string;
  name: string;
  logoUrl: string | null;
};

// Define nav links along with allowed roles
const navLinks = [
  { href: "/dashboard", label: "Home", icon: HomeIcon, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "EDITOR", "VIEWER"] },
  { href: "/users", label: "Users", icon: UsersIcon, roles: ["SUPER_ADMIN", "TENANT_ADMIN"] },
  { href: "/analytics", label: "Analytics", icon: ChartBarIcon, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "EDITOR"] },
  { href: "/projects", label: "Projects", icon: FolderIcon, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "EDITOR"] },
  { href: "/campaigns", label: "Campaigns", icon: FolderIcon, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "EDITOR"] },
  { href: "/flyers", label: "Flyers", icon: FolderIcon, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "EDITOR"] },
  { href: "/teams", label: "Teams", icon: UserGroupIcon, roles: ["SUPER_ADMIN", "TENANT_ADMIN"] },
  { href: "/settings", label: "Settings", icon: Cog6ToothIcon, roles: ["SUPER_ADMIN", "TENANT_ADMIN"] },
  { href: "/notifications", label: "Notifications", icon: BellIcon, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "EDITOR", "VIEWER"] },
  { href: "/billings", label: "Billing", icon: CreditCardIcon, roles: ["SUPER_ADMIN", "TENANT_ADMIN"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch tenant details from API
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch("/api/tenants");
        if (res.ok) {
          const tenants: Tenant[] = await res.json();
          if (tenants.length > 0) {
            setTenant(tenants[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch tenant:", error);
      }
    };

    fetchTenant();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p className="text-lg font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  const userRole = session?.user?.role;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={`${tenant.name} logo`}
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-gray-700 flex items-center justify-center">
              <span className="text-lg font-bold text-white">🏢</span>
            </div>
          )}
          <h2 className="text-xl font-bold tracking-tight">{tenant?.name ?? "Dashboard"}</h2>
        </div>

        <nav className="flex-1 space-y-1">
          {navLinks
            .filter(link => link.roles.includes(userRole!)) // Only show links allowed for this role
            .map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "group flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-md text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon
                    className={clsx(
                      "h-5 w-5",
                      isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                    )}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              );
            })}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-700 text-sm text-gray-400">
          <div className="mb-2">
            Signed in as{" "}
            <span className="text-white font-medium">{session?.user?.email}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left px-4 py-2 rounded-md bg-gray-800 hover:bg-red-600 hover:text-white text-gray-300 transition-all duration-200"
          >
            🚪 Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 bg-gray-950 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Here’s what’s happening across your campaigns.
          </p>
        </header>

        {children}
      </main>
    </div>
  );
}
