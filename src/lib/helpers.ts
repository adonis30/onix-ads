/** =========================
 * Helpers
 * ========================*/
export const fmtCurrency = (cents?: number) => {
  if (typeof cents !== "number") return "";
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "ZMW" });
};

 export const acceptFor = (assetType: "IMAGE" | "VIDEO" | "PDF") =>
  assetType === "IMAGE" ? "image/*" : assetType === "VIDEO" ? "video/*" : "application/pdf";
