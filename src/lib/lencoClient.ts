// src/lib/lencoClient.ts
import axios from "axios";

const LENCO_BASE_URL = process.env.LENCO_BASE_URL || "https://sandbox.lenco.co/access/v2";
const LENCO_SECRET_KEY = process.env.LENCO_SECRET_KEY;

if (!LENCO_SECRET_KEY) throw new Error("LENCO_SECRET_KEY is not set");

export const lenco = {
  client: axios.create({
    baseURL: LENCO_BASE_URL,
    headers: {
      Authorization: `Bearer ${LENCO_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  }),

  createTransfer: async ({
  amount,
  phone,
  operator,
  reason,
  reference,
  currency = "ZMW",
  bearer = "merchant"
}: {
  amount: number;
  phone: string;
  operator: string;
  reason: string;
  reference: string;
  currency?: string;
  bearer?: "merchant" | "customer";
}) => {
  const res = await lenco.client.post("/collections/mobile-money", {
    amount,
    phone,
    operator,
    reason,
    reference,
    currency,
    bearer,
  });
  return res.data;
},


 submitOtp: async ({ reference, otp }: { reference: string; otp: string }) => {
  try {
    const res = await lenco.client.post("/collections/otp/submit", {
      reference,
      otp,
    });
    return res.data; // Contains status, message, etc.
  } catch (err: any) {
    console.error("Lenco OTP submission error:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "OTP submission failed");
  }
},

  getCollectionStatus: async (reference: string) => {
    const res = await lenco.client.get(`/collections/status/${reference}`);
    return res.data;
  },

  getAccounts: async () => {
    const res = await lenco.client.get("/accounts");
    return res.data;
  },

  getBalance: async (accountId: string) => {
    const res = await lenco.client.get(`/accounts/${accountId}/balance`);
    return res.data;
  },
};
