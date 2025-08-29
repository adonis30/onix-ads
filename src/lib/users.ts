export async function getUser(userId: string) {
  const res = await fetch(`/api/users/${userId}`, {
    headers: {
      "x-tenant-id": "TENANT_ID_FROM_CONTEXT",
      "x-user-role": "USER_OR_ADMIN", // usually from auth/session
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateUser(userId: string, data: any) {
  const res = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": "TENANT_ID_FROM_CONTEXT",
      "x-user-role": "ADMIN",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteUser(userId: string) {
  const res = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
    headers: {
      "x-tenant-id": "TENANT_ID_FROM_CONTEXT",
      "x-user-role": "ADMIN",
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
