// src/lib/api.ts
export async function apiFetch(
  url: string,
  options: RequestInit = {},
  session?: { user?: { tenantId?: string; role?: string } }
) {
  const headers = {
    ...(options.headers || {}),
    "x-tenant-id": session?.user?.tenantId || "",
    "x-user-role": session?.user?.role || "",
    "Content-Type": "application/json",
  };

  return fetch(url, {
    ...options,
    headers,
  });
}