/** =========================
 * Types
 * ========================*/
export interface FlyerFormField {
  name: string;
  type: "text" | "number" | "email" | "textarea" | "select";
  required?: boolean;
  options?: string[];
}

 export interface FlyerForm {
  name: string;
  fields: FlyerFormField[];
}

 export interface Flyer {
  id: string;
  title: string;
  description: string;
  assetType: "IMAGE" | "VIDEO" | "PDF";
  originalUrl: string;
  cdnUrl?: string;
  coverUrl?: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
  campaign: { id: string; name: string };
  qrCodeUrl?: string;
  shortcode?: string;
  form?: FlyerForm;
  isPaid?: boolean;
  priceCents?: number;
  hasPurchased?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
}

export type LencoStatus = "pending" | "successful" | "failed" | "otp-required" | "pay-offline";
export type LencoBearer = "merchant" | "customer";

export interface LencoMobileMoneyDetails {
  country: string;
  phone: string;
  operator: string;
  accountName?: string | null;
  operatorTransactionId?: string | null;
}

export interface LencoPaymentData {
  id: string;
  initiatedAt: string;
  completedAt?: string | null;
  amount: string;
  fee?: string | null;
  bearer: LencoBearer;
  currency: string;
  reference: string;
  lencoReference: string;
  type: "mobile-money";
  status: LencoStatus;
  source: "api";
  reasonForFailure?: string | null;
  settlementStatus?: "pending" | "settled" | null;
  settlement?: null;
  mobileMoneyDetails?: LencoMobileMoneyDetails | null;
  bankAccountDetails?: null;
  cardDetails?: null;
}

export interface LencoResponse {
  status: boolean;
  message: string;
  data: LencoPaymentData;
}
