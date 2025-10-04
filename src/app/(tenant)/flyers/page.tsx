// src/app/%28tenant%29/flyers/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  List,
  Grid,
  X,
  Plus,
  FileText,
  CreditCard,
  BadgeDollarSign,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Flyer, Campaign, FlyerForm, FlyerFormField } from "@/lib/types";
import { fmtCurrency, acceptFor } from "@/lib/helpers";

/** =========================
 * Component
 * ========================*/
export default function FlyerDashboard() {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNewFlyerModal, setShowNewFlyerModal] = useState(false);
  const [activeFlyer, setActiveFlyer] = useState<Flyer | null>(null);
  const [activeFormFlyer, setActiveFormFlyer] = useState<Flyer | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, any>[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const { data: session } = useSession();
  const role = session ? (session.user as any)?.role : null;
  const tanantId = session ? (session.user as any)?.tenantId : null;

  const [newFlyerData, setNewFlyerData] = useState<{
    title: string;
    description: string;
    assetType: "IMAGE" | "VIDEO" | "PDF";
    file: File | null;
    campaignId: string;
    isFree: boolean;
    price: string;
    cover: File | null;
    form: FlyerForm;
  }>({
    title: "",
    description: "",
    assetType: "IMAGE",
    file: null,
    campaignId: "",
    isFree: false,
    price: "",
    cover: null,
    form: { name: "", fields: [] },
  });

  /** =========================
   * Effects — Fetch data
   * ========================*/
  useEffect(() => {
    const fetchFlyers = async () => {
      try {
        const res = await fetch("/api/flyers", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch flyers");
        const data = await res.json();
        setFlyers(data);
      } catch (err) {
        console.error(err);
        setFlyers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFlyers();
  }, []);


  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch("/api/tenants/campaigns", {
          headers: {
            "x-tenant-id": tanantId || "",
            "x-user-role": role || "",
          },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch campaigns");
        const data = await res.json();
        setCampaigns(data);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        setCampaigns([]);
      }
    };
    fetchCampaigns();
  }, []);

  /** =========================
   * Handlers
   * ========================*/
  const handleOpenFlyer = (flyer: Flyer) => setActiveFlyer(flyer);

  const handleOpenFormModal = async (flyer: Flyer) => {
    if (!flyer.form) return;
    setActiveFormFlyer(flyer);
    try {
      const res = await fetch(`/api/flyers/${flyer.id}/submissions`);
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const data = await res.json();
      setSubmissions(data);
    } catch {
      setSubmissions([]);
    }
  };

  const handleSubmitForm = async (formData: Record<string, any>) => {
    if (!activeFormFlyer) return;
    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/flyers/${activeFormFlyer.id}/submit-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Form submission failed");
      alert("Form submitted successfully!");
      setSubmissions((prev) => [...prev, formData]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submission error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDownloadQRCode = (flyer: Flyer) => {
    if (!flyer.qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = flyer.qrCodeUrl;
    link.download = `${flyer.title}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyShortcode = (flyer: Flyer) => {
    if (!flyer.shortcode) return;
    navigator.clipboard.writeText(flyer.shortcode);
    alert(`Shortcode copied: ${flyer.shortcode}`);
  };

  const handleAddFormField = () => {
    setNewFlyerData((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        fields: [
          ...prev.form.fields,
          { name: "", type: "text", required: false },
        ],
      },
    }));
  };

  const normalizedPrice = useMemo(() => {
    const n = Math.round(Number(newFlyerData.price));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [newFlyerData.price]);

  const handleCreateFlyer = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Basic validation ---
    if (!newFlyerData.title.trim()) return alert("Title is required.");
    if (!newFlyerData.file) return alert("Please upload a flyer file.");
    if (!newFlyerData.campaignId) return alert("Please select a campaign.");

    const isFree = newFlyerData.isFree; // true = free, false = paid
    const normalizedPrice = newFlyerData.price ? parseFloat(newFlyerData.price) : 0;

    // --- Paid flyer validation ---
    if (!isFree && normalizedPrice <= 0) {
      return alert("Please enter a valid price for paid flyers.");
    }

    if (!isFree && newFlyerData.assetType === "PDF" && !newFlyerData.cover) {
      return alert("Please upload a cover image for paid PDF flyers.");
    }

    // --- Prepare FormData ---
    const formData = new FormData();
    formData.append("title", newFlyerData.title);
    if (newFlyerData.description) formData.append("description", newFlyerData.description);
    formData.append("assetType", newFlyerData.assetType);
    formData.append("file", newFlyerData.file!);
    formData.append("campaignId", newFlyerData.campaignId);
    formData.append("isFree", isFree ? "true" : "false");

    // Append price info if paid
    if (!isFree) {
      formData.append("price", normalizedPrice.toString());
      formData.append("currency", "ZMW");
    }

    // Append cover if exists
    if (newFlyerData.cover) formData.append("cover", newFlyerData.cover);

    try {
      const res = await fetch("/api/flyers", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to upload flyer");

      const created: Flyer[] = await res.json();
      setFlyers((prev) => [...created, ...prev]);

      setShowNewFlyerModal(false);
      setNewFlyerData(resetNewFlyerData());
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload error");
    }
  };



  // --- Helper reset function ---
  const resetNewFlyerData = (): {
    title: string;
    description: string;
    assetType: "IMAGE" | "VIDEO" | "PDF";
    file: File | null;
    campaignId: string;
    isFree: boolean;
    price: string;
    cover: File | null;
    form: FlyerForm;
  } => ({
    title: "",
    description: "",
    assetType: "IMAGE",
    file: null,
    campaignId: "",
    isFree: false,
    price: "",
    cover: null,
    form: { name: "", fields: [] },
  });

  const handleBuyNow = async (flyer: Flyer) => {
    if (!flyer.isPaid || !flyer.priceCents) return;
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flyerId: flyer.id,
          amountCents: flyer.priceCents,
        }),
      });
      if (res.ok) {
        const { checkoutUrl } = await res.json();
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }
      }
      alert(
        `Mock checkout: charging ${fmtCurrency(flyer.priceCents)} for "${flyer.title
        }"`
      );
    } catch {
      alert(
        `Mock checkout: charging ${fmtCurrency(flyer.priceCents)} for "${flyer.title
        }"`
      );
    }
  };

  const PaidBadge: React.FC<{ flyer: Flyer }> = ({ flyer }) =>
    flyer.isPaid ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-xs">
        <BadgeDollarSign size={14} />
        {fmtCurrency(flyer.priceCents)}
      </span>
    ) : null;

  /** =========================
   * Render
   * ========================*/
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">📢 Flyer Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewFlyerModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold"
          >
            <Plus size={18} /> New Flyer
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition ${viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300"
                }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition ${viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300"
                }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Flyers grid/list */}
      {loading ? (
        <div className="text-gray-300">Loading…</div>
      ) : flyers.length === 0 ? (
        <div className="text-gray-400">
          No flyers yet. Click “New Flyer” to create one.
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {flyers.map((flyer) => (
            <motion.div
              key={flyer.id}
              className="bg-gray-900 text-white rounded-xl shadow-md p-4 flex flex-col md:flex-row md:items-center relative hover:shadow-lg hover:shadow-blue-500/20 transition-all"
              whileHover={{ scale: 1.01 }}
            >
              {(flyer.coverUrl || flyer.cdnUrl) && (
                <img
                  src={flyer.coverUrl || flyer.cdnUrl}
                  alt={flyer.title}
                  className={`${viewMode === "grid" ? "w-full h-40" : "w-32 h-32"
                    } object-cover rounded-lg mb-4 md:mb-0 md:mr-4`}
                />
              )}
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{flyer.title}</h3>
                  <PaidBadge flyer={flyer} />
                </div>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                  {flyer.description}
                </p>
                <p className="text-xs text-gray-400">
                  📌 Campaign: {flyer.campaign?.name}
                </p>

                {flyer.qrCodeUrl && (
                  <div className="flex items-center gap-2 mt-2">
                    <img
                      src={flyer.qrCodeUrl}
                      alt="QR code"
                      className="w-16 h-16 object-contain border border-gray-600 rounded"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleDownloadQRCode(flyer)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                      >
                        Download QR
                      </button>
                      {flyer.shortcode && (
                        <button
                          onClick={() => handleCopyShortcode(flyer)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                        >
                          Copy Shortcode
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleOpenFlyer(flyer)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
                  >
                    Preview
                  </button>
                  {flyer.form && (
                    <button
                      onClick={() => handleOpenFormModal(flyer)}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded flex items-center gap-1"
                    >
                      <FileText size={14} /> Form
                    </button>
                  )}
                  {/* DELETE BUTTON */}
                  <button
                    onClick={async () => {
                      if (
                        !confirm(
                          `Are you sure you want to delete "${flyer.title}"?`
                        )
                      )
                        return;
                      try {
                        const res = await fetch(`/api/flyers/${flyer.id}`, {
                          method: "DELETE",
                        });
                        if (!res.ok) throw new Error("Failed to delete flyer");
                        setFlyers((prev) =>
                          prev.filter((f) => f.id !== flyer.id)
                        );
                      } catch (err) {
                        alert(
                          err instanceof Error ? err.message : "Delete error"
                        );
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {/* =========================
          Preview Modal (with paywall)
         ========================= */}
      <AnimatePresence>
        {activeFlyer && (
          <motion.div
            key="previewModal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-xl p-6 shadow-xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto border border-gray-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button
                onClick={() => setActiveFlyer(null)}
                className="absolute top-3 right-3 text-gray-300 hover:text-white"
                aria-label="Close"
              >
                <X size={22} />
              </button>

              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {activeFlyer.title}
                  </h2>
                  <p className="text-gray-300">{activeFlyer.description}</p>
                </div>
                <PaidBadge flyer={activeFlyer} />
              </div>

              {/* Paywall logic for PDF ebooks */}
              {activeFlyer.assetType === "PDF" &&
                activeFlyer.isPaid &&
                !activeFlyer.hasPurchased ? (
                <div className="space-y-4">
                  {activeFlyer.coverUrl ? (
                    <img
                      src={activeFlyer.coverUrl}
                      alt="Ebook cover"
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 rounded-lg border border-dashed border-gray-700 grid place-items-center text-gray-400">
                      Ebook cover not available
                    </div>
                  )}

                  <div className="rounded-lg border border-gray-700 p-4 bg-gray-800/50">
                    <p className="text-gray-200 font-medium mb-2">
                      This is a paid ebook. Purchase to unlock the full PDF.
                    </p>
                    <button
                      onClick={() => handleBuyNow(activeFlyer)}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
                    >
                      <CreditCard size={16} />
                      Buy Now {fmtCurrency(activeFlyer.priceCents)}
                    </button>
                  </div>
                </div>
              ) : (
                // unlocked or free
                <>
                  {activeFlyer.assetType === "IMAGE" && activeFlyer.cdnUrl && (
                    <img
                      src={activeFlyer.cdnUrl}
                      alt={activeFlyer.title}
                      className="w-full rounded-lg"
                    />
                  )}
                  {activeFlyer.assetType === "VIDEO" && activeFlyer.cdnUrl && (
                    <video
                      src={activeFlyer.cdnUrl}
                      controls
                      className="w-full rounded-lg"
                    />
                  )}
                  {activeFlyer.assetType === "PDF" && activeFlyer.cdnUrl && (
                    <iframe
                      src={activeFlyer.cdnUrl}
                      className="w-full h-[70vh] rounded-lg"
                    />
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================
          New Flyer Modal (with paid ebook controls)
         ========================= */}
      <AnimatePresence>
        {showNewFlyerModal && (
          <motion.div
            key="newFlyerModal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-xl p-6 shadow-xl w-full max-w-2xl relative border border-gray-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button
                onClick={() => setShowNewFlyerModal(false)}
                className="absolute top-3 right-3 text-gray-300 hover:text-white"
              >
                <X size={22} />
              </button>

              <h2 className="text-xl font-bold text-white mb-4">
                ➕ Add New Flyer
              </h2>

              <form onSubmit={handleCreateFlyer} className="space-y-6">
                {/* Basics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 block mb-1">Title</label>
                    <input
                      type="text"
                      value={newFlyerData.title}
                      onChange={(e) =>
                        setNewFlyerData({ ...newFlyerData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 block mb-1">Campaign</label>
                    <select
                      value={newFlyerData.campaignId}
                      onChange={(e) =>
                        setNewFlyerData({ ...newFlyerData, campaignId: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700"
                      required
                    >
                      <option value="">-- Select Campaign --</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-gray-300 block mb-1">Description</label>
                    <textarea
                      value={newFlyerData.description}
                      onChange={(e) =>
                        setNewFlyerData({ ...newFlyerData, description: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700"
                      required
                    />
                  </div>
                </div>

                {/* Asset */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-gray-300 block mb-1">Asset Type</label>
                    <select
                      value={newFlyerData.assetType}
                      onChange={(e) =>
                        setNewFlyerData({
                          ...newFlyerData,
                          assetType: e.target.value as typeof newFlyerData.assetType,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700"
                    >
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                      <option value="PDF">PDF</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-gray-300 block mb-1">Upload File</label>
                    <input
                      type="file"
                      accept={acceptFor(newFlyerData.assetType)}
                      onChange={(e) =>
                        setNewFlyerData({
                          ...newFlyerData,
                          file: e.target.files ? e.target.files[0] : null,
                        })
                      }
                      className="w-full text-gray-300"
                      required
                    />
                  </div>
                </div>

                {/* Monetization */}
                <div className="rounded-lg border border-gray-700 p-4 bg-gray-800/40">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      id="isPaid"
                      type="checkbox"
                      checked={!newFlyerData.isFree} // Checked if flyer is paid
                      onChange={(e) =>
                        setNewFlyerData({ ...newFlyerData, isFree: !e.target.checked })
                      }
                    />
                    <label htmlFor="isPaid" className="text-gray-200 font-medium">
                      This is a paid flyer (ebook)
                    </label>
                  </div>

                  {!newFlyerData.isFree && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-gray-300 block mb-1">Price (ZMW)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={newFlyerData.price}
                          onChange={(e) =>
                            setNewFlyerData({ ...newFlyerData, price: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700"
                          placeholder="e.g. 9.99"
                          required
                        />
                        {newFlyerData.price && (
                          <p className="text-xs text-gray-400 mt-1">
                            You’ll charge {fmtCurrency(parseFloat(newFlyerData.price))}.
                          </p>
                        )}
                      </div>

                      {newFlyerData.assetType === "PDF" && (
                        <div className="md:col-span-2">
                          <label className="text-gray-300 block mb-1">
                            Upload Cover Image (required for paid PDF)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setNewFlyerData({
                                ...newFlyerData,
                                cover: e.target.files ? e.target.files[0] : null,
                              })
                            }
                            className="w-full text-gray-300"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            The cover will be public; the full PDF stays locked until purchase.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Builder (optional) */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-end gap-3">
                      <h3 className="text-gray-300 font-semibold">Attach a Form (optional)</h3>
                      <input
                        type="text"
                        placeholder="Form Name"
                        value={newFlyerData.form.name}
                        onChange={(e) =>
                          setNewFlyerData({
                            ...newFlyerData,
                            form: { ...newFlyerData.form, name: e.target.value },
                          })
                        }
                        className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFormField}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Field
                    </button>
                  </div>

                  {newFlyerData.form.fields.length === 0 ? (
                    <p className="text-sm text-gray-500">No fields yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {newFlyerData.form.fields.map((field, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            placeholder="Field Name"
                            value={field.name}
                            onChange={(e) => {
                              const fields = [...newFlyerData.form.fields];
                              fields[idx].name = e.target.value;
                              setNewFlyerData({
                                ...newFlyerData,
                                form: { ...newFlyerData.form, fields },
                              });
                            }}
                            className="flex-1 min-w-[150px] px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => {
                              const fields = [...newFlyerData.form.fields];
                              fields[idx].type = e.target.value as FlyerFormField["type"];
                              setNewFlyerData({
                                ...newFlyerData,
                                form: { ...newFlyerData.form, fields },
                              });
                            }}
                            className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="email">Email</option>
                            <option value="textarea">Textarea</option>
                            <option value="select">Select</option>
                          </select>
                          <label className="flex items-center gap-1 text-gray-300">
                            <input
                              type="checkbox"
                              checked={!!field.required}
                              onChange={(e) => {
                                const fields = [...newFlyerData.form.fields];
                                fields[idx].required = e.target.checked;
                                setNewFlyerData({
                                  ...newFlyerData,
                                  form: { ...newFlyerData.form, fields },
                                });
                              }}
                            />
                            Required
                          </label>
                          {field.type === "select" && (
                            <input
                              type="text"
                              placeholder="Options (comma-separated)"
                              value={(field.options || []).join(",")}
                              onChange={(e) => {
                                const fields = [...newFlyerData.form.fields];
                                const opts = e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                fields[idx].options = opts;
                                setNewFlyerData({
                                  ...newFlyerData,
                                  form: { ...newFlyerData.form, fields },
                                });
                              }}
                              className="flex-1 min-w-[200px] px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const fields = newFlyerData.form.fields.filter((_, i) => i !== idx);
                              setNewFlyerData({
                                ...newFlyerData,
                                form: { ...newFlyerData.form, fields },
                              });
                            }}
                            className="text-red-300 hover:text-red-200 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Upload Flyer
                </button>
              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================
          Lead Form Modal (existing)
         ========================= */}
      <AnimatePresence>
        {activeFormFlyer && activeFormFlyer.form && (
          <motion.div
            key="formModal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-lg p-6 shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto border border-gray-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button
                onClick={() => setActiveFormFlyer(null)}
                className="absolute top-2 right-2 text-gray-300 hover:text-white text-xl font-bold"
              >
                &times;
              </button>

              <h2 className="text-xl font-semibold text-white mb-4">
                {activeFormFlyer.form.name}
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData: Record<string, any> = {};
                  activeFormFlyer.form!.fields.forEach((f) => {
                    const input = e.currentTarget.elements.namedItem(f.name) as
                      | HTMLInputElement
                      | HTMLSelectElement
                      | HTMLTextAreaElement;
                    formData[f.name] = input?.value ?? "";
                  });
                  handleSubmitForm(formData);
                }}
                className="space-y-4"
              >
                {activeFormFlyer.form.fields.map((field) => {
                  const baseClass =
                    "px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none";
                  switch (field.type) {
                    case "textarea":
                      return (
                        <div key={field.name} className="flex flex-col">
                          <label className="text-gray-200 mb-1">
                            {field.name} {field.required ? "*" : ""}
                          </label>
                          <textarea
                            name={field.name}
                            required={field.required}
                            className={baseClass + " min-h-[60px]"}
                          />
                        </div>
                      );
                    case "select":
                      return (
                        <div key={field.name} className="flex flex-col">
                          <label className="text-gray-200 mb-1">
                            {field.name} {field.required ? "*" : ""}
                          </label>
                          <select
                            name={field.name}
                            required={field.required}
                            className={baseClass}
                          >
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    default:
                      return (
                        <div key={field.name} className="flex flex-col">
                          <label className="text-gray-200 mb-1">
                            {field.name} {field.required ? "*" : ""}
                          </label>
                          <input
                            name={field.name}
                            type={field.type}
                            required={field.required}
                            className={baseClass}
                          />
                        </div>
                      );
                  }
                })}

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {formSubmitting ? "Submitting..." : "Submit"}
                </button>
              </form>

              {submissions.length > 0 && (
                <div className="mt-6 text-gray-300">
                  <h3 className="text-white font-semibold mb-2">
                    Previous Submissions
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {submissions.map((sub, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-800 p-2 rounded text-sm"
                      >
                        {activeFormFlyer.form?.fields.map((f) => (
                          <div key={f.name}>
                            <span className="font-semibold">{f.name}:</span>{" "}
                            {sub[f.name]}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
