// src/lib/webhook.ts
import crypto from "crypto";

export function verifyLemonWebhookSignature(rawBody: string, signatureHeader: string | null) {
  if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
    throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET is not set");
  }
  if (!signatureHeader) return false;

  // LemonSqueezy's docs: they provide HMAC-SHA256 signature of the raw body using the webhook secret.
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const computed = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  // Some providers put base64 / hex — match exact header style. We'll compare hex-to-hex.
  // Accept either exact match or "sha256=" prefix style.
  if (signatureHeader === computed) return true;
  if (signatureHeader === `sha256=${computed}`) return true;

  // In case header is base64 of digest:
  const computedB64 = Buffer.from(computed, "hex").toString("base64");
  if (signatureHeader === computedB64) return true;
  if (signatureHeader === `sha256=${computedB64}`) return true;

  return false;
}
