import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export default async function Home() {
  // Cast authOptions so TypeScript is happy
  const session = await getServerSession(authOptions);

  // Redirect based on session
  if (session?.user) {
    redirect("/dashboard"); // logged-in users
  } else {
    redirect("/login"); // guests
  }

  return null; // never rendered because of redirect
}
