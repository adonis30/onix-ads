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
  Cog6ToothIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navLinks = [
  { href: "/admin", label: "Home", icon: HomeIcon },
  { href: "/tenants", label: "Tenants", icon: UsersIcon },
/*   { href: "/analytics", label: "Analytics", icon: ChartBarIcon }, */
  { href: "/admin-settings", label: "Settings", icon: Cog6ToothIcon },
 /*  { href: "/notifications", label: "Notifications", icon: BellIcon }, */
  { href: "/admin-billings", label: "Billing", icon: ChartBarIcon },
  { href: "/admin-users", label: "Users", icon: UsersIcon },
/*   { href: "/projects", label: "Projects", icon: ChartBarIcon }, */
  { href: "/admin-campaigns", label: "Campaigns", icon: ChartBarIcon },
  { href: "/admin-flyers", label: "Flyers", icon: ChartBarIcon },
  { href: "/admin-forms", label: "Forms", icon: ChartBarIcon },
  { href: "/admin-teams", label: "Teams", icon: UsersIcon },
];

export default function SuperDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p className="text-lg font-medium animate-pulse">
          Loading super admin dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white relative">
      {/* Collapse button pinned outside sidebar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={clsx(
          "absolute top-4 transition-all duration-300 z-20 p-2 rounded-md bg-gray-800 hover:bg-gray-700",
          collapsed ? "left-20" : "left-72"
        )}
      >
        {collapsed ? (
          <Bars3Icon className="h-6 w-6 text-gray-200" />
        ) : (
          <XMarkIcon className="h-6 w-6 text-gray-200" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-gray-900 border-r border-gray-800 p-4 flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo + App Name */}
        <div className="flex items-center gap-2 mb-8">
          <img
            src="/logo.png"
            alt="App Logo"
            className="h-8 w-8 rounded-md"
          />
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight">Onixy</span>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "group flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-purple-500 shadow-md text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon
                  className={clsx(
                    "h-5 w-5 flex-shrink-0",
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-white"
                  )}
                />
                {!collapsed && (
                  <span className="text-sm font-medium">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-gray-700 text-sm text-gray-400">
          {!collapsed && (
            <div className="mb-2">
              Signed in as{" "}
              <span className="text-white font-medium">
                {session?.user?.email}
              </span>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={clsx(
              "w-full text-left px-4 py-2 rounded-md bg-gray-800 hover:bg-red-600 hover:text-white text-gray-300 transition-all duration-200",
              collapsed && "flex items-center justify-center px-0"
            )}
          >
            🚪 {!collapsed && "Log out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 bg-gray-950 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome Super Admin 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage tenants, users, and system-wide analytics here.
          </p>
        </header>

        {children}
      </main>
    </div>
  );
}
