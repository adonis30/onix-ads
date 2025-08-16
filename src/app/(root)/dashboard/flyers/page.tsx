"use client";

import { useEffect, useMemo, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { FaPlay, FaFilePdf, FaTh, FaList } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import CreateFlyerForm from "./components/createFlyerForm"; // adjust path if needed

interface Flyer {
  id: string;
  title: string;
  description: string;
  assetType: "IMAGE" | "VIDEO" | "PDF";
  originalUrl: string;
  cdnUrl?: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
  campaign: { id: string; name: string };
}

interface CampaignGroup {
  campaignId: string;
  campaignName: string;
  flyers: Flyer[];
}

export default function FlyerDashboard() {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({});
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("__all__");

  // Setup pdf.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore - version is available at runtime
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }, []);

  const fetchFlyers = () => {
    setLoading(true);
    fetch("/api/flyers")
      .then((res) => res.json())
      .then((data) => setFlyers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFlyers();
  }, []);

  // Unique campaigns for filter dropdown
  const campaigns = useMemo(
    () => [
      { id: "__all__", name: "All Campaigns" },
      ...Array.from(
        new Map(flyers.map((f) => [f.campaign.id, f.campaign])).values()
      ),
    ],
    [flyers]
  );

  // Apply campaign filter before grouping
  const filteredFlyers = useMemo(
    () =>
      selectedCampaignId === "__all__"
        ? flyers
        : flyers.filter((f) => f.campaign.id === selectedCampaignId),
    [flyers, selectedCampaignId]
  );

  // Generate thumbnails for PDFs (only once per flyer)
  useEffect(() => {
    filteredFlyers.forEach(async (flyer) => {
      if (flyer.assetType === "PDF" && !pdfThumbnails[flyer.id]) {
        setPdfLoading((prev) => ({ ...prev, [flyer.id]: true }));
        try {
          const data = await fetch(flyer.cdnUrl || flyer.originalUrl).then((res) =>
            res.arrayBuffer()
          );
          const pdf = await pdfjsLib.getDocument({ data }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, canvas, viewport }).promise;
          setPdfThumbnails((prev) => ({
            ...prev,
            [flyer.id]: canvas.toDataURL(),
          }));
        } catch (err) {
          console.error("PDF thumbnail error:", err);
        } finally {
          setPdfLoading((prev) => ({ ...prev, [flyer.id]: false }));
        }
      }
    });
    // We intentionally *don't* depend on pdfThumbnails to avoid retriggering for already-rendered items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredFlyers]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

  const handlePreview = (flyer: Flyer) => {
    window.open(flyer.cdnUrl || flyer.originalUrl, "_blank", "noopener,noreferrer");
  };

const handleDelete = async (flyerId: string) => {
  if (!confirm("Are you sure you want to delete this flyer?")) return;

  try {
    const res = await fetch(`/api/flyers/${flyerId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Delete failed");
    }

    alert("Flyer deleted successfully");

    // Refetch flyers to update state
    fetchFlyers();

    // Remove deleted flyer from state
    setFlyers((prev) => prev.filter((f) => f.id !== flyerId));
    
  } catch (err) {
    console.error(err);
    alert("Error deleting flyer: " + (err instanceof Error ? err.message : ""));
  }
};

  const groupedFlyers: CampaignGroup[] = filteredFlyers.reduce(
    (acc: CampaignGroup[], flyer) => {
      const existing = acc.find((g) => g.campaignId === flyer.campaign.id);
      if (existing) existing.flyers.push(flyer);
      else
        acc.push({
          campaignId: flyer.campaign.id,
          campaignName: flyer.campaign.name,
          flyers: [flyer],
        });
      return acc;
    },
    []
  );

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
          >
            Create New Flyer
          </button>

          {/* Campaign filter */}
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="px-3 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700"
            aria-label="Filter by campaign"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${
              viewMode === "grid"
                ? "bg-gray-700 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
            aria-label="Grid view"
            title="Grid view"
          >
            <FaTh />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${
              viewMode === "list"
                ? "bg-gray-700 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
            aria-label="List view"
            title="List view"
          >
            <FaList />
          </button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-lg p-6 shadow-xl w-full max-w-lg relative cursor-grab"
              drag
              dragConstraints={{ top: -100, bottom: 100, left: -100, right: 100 }}
              dragElastic={0.2}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-2 right-2 text-gray-300 hover:text-white text-xl font-bold"
                aria-label="Close"
              >
                &times;
              </button>
              <CreateFlyerForm
                onFlyerCreated={() => {
                  fetchFlyers();
                  setShowForm(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flyers */}
      {loading ? (
        <p className="text-gray-300">Loading flyers...</p>
      ) : filteredFlyers.length === 0 ? (
        <p className="text-gray-300">
          {selectedCampaignId === "__all__"
            ? "No flyers found."
            : "No flyers in this campaign."}
        </p>
      ) : (
        groupedFlyers.map((group) => (
          <div key={group.campaignId}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100">
                Campaign: {group.campaignName}
              </h2>
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                {group.flyers.length} item{group.flyers.length === 1 ? "" : "s"}
              </span>
            </div>

            {viewMode === "grid" ? (
              // --- GRID VIEW ---
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {group.flyers.map((flyer) => (
                  <div
                    key={flyer.id}
                    className="bg-gray-800 rounded-lg shadow hover:shadow-xl transition overflow-hidden group relative"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full h-40 bg-gray-700">
                      {flyer.assetType === "IMAGE" && (
                        <img
                          src={flyer.cdnUrl || flyer.originalUrl}
                          alt={flyer.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}

                      {flyer.assetType === "VIDEO" && (
                        <>
                          <video
                            src={flyer.cdnUrl || flyer.originalUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-white text-3xl">
                            <FaPlay />
                          </div>
                        </>
                      )}

                      {flyer.assetType === "PDF" && (
                        <>
                          {pdfThumbnails[flyer.id] ? (
                            <img
                              src={pdfThumbnails[flyer.id]}
                              alt="PDF thumbnail"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200">
                              <div className="animate-spin mb-2 border-4 border-t-blue-600 border-gray-400 w-8 h-8 rounded-full"></div>
                              Loading PDF...
                            </div>
                          )}
                          <div className="absolute top-2 left-2 text-white bg-red-600 px-1 rounded flex items-center gap-1">
                            <FaFilePdf /> PDF
                          </div>
                        </>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="font-semibold text-white truncate">{flyer.title}</p>
                      <p className="text-gray-300 text-sm truncate">{flyer.description}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handlePreview(flyer)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex-1"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleDelete(flyer.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm flex-1"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // --- LIST VIEW ---
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border border-gray-700 text-gray-300">
                  <thead className="bg-gray-800 text-gray-200">
                    <tr>
                      <th className="px-4 py-2">Preview</th>
                      <th className="px-4 py-2">Title</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Size</th>
                      <th className="px-4 py-2">Created</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.flyers.map((flyer) => (
                      <tr
                        key={flyer.id}
                        className="border-t border-gray-700 hover:bg-gray-800"
                      >
                        <td className="px-4 py-2">
                          {flyer.assetType === "IMAGE" && (
                            <img
                              src={flyer.cdnUrl || flyer.originalUrl}
                              alt={flyer.title}
                              className="w-16 h-16 object-cover rounded"
                              loading="lazy"
                            />
                          )}
                          {flyer.assetType === "VIDEO" && (
                            <video
                              src={flyer.cdnUrl || flyer.originalUrl}
                              className="w-16 h-16 object-cover rounded"
                              muted
                            />
                          )}
                          {flyer.assetType === "PDF" &&
                            (pdfThumbnails[flyer.id] ? (
                              <img
                                src={pdfThumbnails[flyer.id]}
                                alt="PDF thumbnail"
                                className="w-16 h-16 object-cover rounded"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xs">Loading...</span>
                            ))}
                        </td>
                        <td className="px-4 py-2">{flyer.title}</td>
                        <td className="px-4 py-2">{flyer.description}</td>
                        <td className="px-4 py-2">{flyer.assetType}</td>
                        <td className="px-4 py-2">{formatBytes(flyer.sizeBytes)}</td>
                        <td className="px-4 py-2">
                          {new Date(flyer.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => handlePreview(flyer)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleDelete(flyer.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
