import { v4 as uuidv4 } from "uuid";

/** =========================
 * Helpers
 * ========================*/
export const fmtCurrency = (amount?: number) => {
  if (typeof amount !== "number") return "";
  return amount.toLocaleString(undefined, { style: "currency", currency: "ZMW" });
};

export const acceptFor = (assetType: "IMAGE" | "VIDEO" | "PDF") =>
  assetType === "IMAGE"
    ? "image/*"
    : assetType === "VIDEO"
    ? "video/*"
    : "application/pdf";

export const generateUniqueId = () => {
  return uuidv4().replace(/-/g, "").substring(0, 25);
};
