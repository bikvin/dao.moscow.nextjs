// src/lib/authHelpers.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Ensures the user is logged in and has ADMIN role.
 * Redirects to /login if not authorized.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  return session;
}
