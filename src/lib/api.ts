import type { Session } from "next-auth";

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  session?: Session | null
): Promise<Response> {
  if (!session?.user?.tenantId) {
    throw new Error("Tenant ID missing from session");
  }

  const method = options.method?.toUpperCase() ?? "GET";

  const headers: HeadersInit = {
    ...(options.headers || {}),
    "x-tenant-id": session.user.tenantId,
    "x-user-role": session.user.role || "",
    ...(method !== "GET" && method !== "DELETE"
      ? { "Content-Type": "application/json" }
      : {}),
  };

  console.log(`[apiFetch] ${method} ${url}`, { headers });

  const res = await fetch(url, {
    ...options,
    method,
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[apiFetch] Error ${res.status}:`, errorText);
    throw new Error(errorText || "Request failed");
  }

  return res;
}

export async function apiFetchJson<T>(
  url: string,
  options: RequestInit = {},
  session?: any
): Promise<T> {
  const res = await apiFetch(url, options, session);
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
