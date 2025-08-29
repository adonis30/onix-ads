// app/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login"); // guest
  }

  // Redirect based on role
  switch (session.user.role) {
    case "SUPER_ADMIN":
      redirect("/admin");
      break; // prevent fall-through
    case "TENANT_ADMIN":
    case "EDITOR":
    case "VIEWER":
      redirect("/dashboard");
      break;
    default:
      redirect("/login"); // fallback
  }

  return null; // never rendered because of redirect
}
