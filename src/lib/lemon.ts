// src/lib/lemon.ts
export const LEMON_API = "https://api.lemonsqueezy.com/v1";

export async function lemonFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${LEMON_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LemonSqueezy API error ${res.status}: ${txt}`);
  }
  return res.json();
}
