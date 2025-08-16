import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import type { AuthOptions } from "next-auth";

export default async function Home() {
  // Cast authOptions so TypeScript is happy
  const session = await getServerSession(authOptions as AuthOptions);

  // Redirect based on session
  if (session?.user) {
    redirect("/dashboard"); // logged-in users
  } else {
    redirect("/login"); // guests
  }

  return null; // never rendered because of redirect
}
