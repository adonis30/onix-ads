import type { Session } from "next-auth";

/**
 * Build the absolute base URL for API requests.
 * Works in both server and browser environments.
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";

  const host =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "localhost:3000";

  const protocol =
    host.startsWith("localhost") || host.includes("127.0.0.1")
      ? "http"
      : "https";

  return `${protocol}://${host}`;
}

/**
 * Generic authenticated fetch for your multi-tenant APIs.
 * Automatically injects `x-tenant-id` and `x-user-role` headers.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
  session?: Session | null
): Promise<Response> {
  if (!session?.user?.tenantId) {
    throw new Error("Tenant ID missing from session");
  }

  const method = (options.method?.toUpperCase() ?? "GET") as
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE";

  const headers: HeadersInit = {
    ...(options.headers || {}),
    "x-tenant-id": session.user.tenantId,
    "x-user-role": session.user.role || "",
    ...(method !== "GET" && method !== "DELETE"
      ? { "Content-Type": "application/json" }
      : {}),
  };

  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;


  const res = await fetch(fullUrl, {
    ...options,
    method,
    headers,
    cache: "no-store", // ✅ ensures up-to-date data
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[apiFetch] Error ${res.status}:`, errorText);
    throw new Error(errorText || "Request failed");
  }

  return res;
}

/**
 * Convenience wrapper to return parsed JSON data.
 */
export async function apiFetchJson<T>(
  url: string,
  options: RequestInit = {},
  session?: Session | null
): Promise<T> {
  const res = await apiFetch(url, options, session);
  return res.json() as Promise<T>;
}
