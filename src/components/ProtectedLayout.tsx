// src/components/ProtectedLayout.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ProtectedLayoutProps {
  allowedRoles: string[];
  children: ReactNode;
  redirectPath?: string;
}

export default function ProtectedLayout({
  allowedRoles,
  children,
  redirectPath = "/login",
}: ProtectedLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // wait for session

    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      router.push(redirectPath);
    }
  }, [session, status, router, allowedRoles, redirectPath]);

  if (status === "loading" || !session?.user) {
    return <div>Loading...</div>; // or a spinner
  }

  return <>{children}</>;
}
