"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
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

const navLinks = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/users", label: "Users", icon: UsersIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: ChartBarIcon },
  { href: "/dashboard/projects", label: "Projects", icon: FolderIcon },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: FolderIcon },
  { href: "/dashboard/flyers", label: "Flyers", icon: FolderIcon },
  { href: "/dashboard/teams", label: "Teams", icon: UserGroupIcon },
  { href: "/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
  { href: "/dashboard/notifications", label: "Notifications", icon: BellIcon },
  { href: "/dashboard/billings", label: "Billing", icon: CreditCardIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p className="text-lg font-medium animate-pulse">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-8 tracking-tight">📊 Dashboard</h2>

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
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-md text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon
                  className={clsx(
                    "h-5 w-5",
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-white"
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
            <span className="text-white font-medium">
              {session?.user?.email}
            </span>
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
