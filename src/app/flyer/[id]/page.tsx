"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Download, Link2, Eye, QrCode } from "lucide-react";

type QRData = { id: string; imageUrl: string; };
type LinkData = { id: string; slug: string; qr: QRData | null; };
type FlyerData = {
  id: string; title: string; description?: string;
  cdnUrl: string | null; assetType: "IMAGE" | "VIDEO" | "PDF"; links: LinkData[];
};
type Metrics = { totals: { views: number; scans: number; downloads: number }; series: { kind: string; count: number }[] };

export default function FlyerViewerPage() {
  const { id } = useParams();
  const [flyer, setFlyer] = useState<FlyerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [copied, setCopied] = useState(false);

  const shortUrl = useMemo(() => {
    if (!flyer?.id) return null;
    return `${process.env.NEXT_PUBLIC_APP_BASE_URL || ""}/flyer/${flyer.id}`;
  }, [flyer?.id]);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res = await fetch(`/api/flyers/${id}`);
        if (!res.ok) throw new Error("Failed to fetch flyer");
        const data: FlyerData = await res.json();

        // Fire-and-forget view
        fetch(`/api/flyers/${id}/track`, { method: "POST" }).catch(() => {});
        setFlyer(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Metrics: initial + refresh every 15s
  useEffect(() => {
    if (!id) return;
    let timer: any;

    const load = async () => {
      try {
        const r = await fetch(`/api/flyers/${id}/metrics`);
        if (r.ok) setMetrics(await r.json());
      } catch {}
    };

    load();
    timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [id]);

  const handleCopy = async () => {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    // mark share/copy as a VIEW with source
    fetch(`/api/flyers/${id}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "VIEW", source: "copy" }),
    }).catch(() => {});
  };

  const handleDownloadQR = () => {
    fetch(`/api/flyers/${id}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "DOWNLOAD", source: "qr-download" }),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-800">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.6 }} className="text-lg">
          Loading flyer…
        </motion.div>
      </div>
    );
  }

  if (!flyer) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-800">
        <p className="text-lg">Flyer not found.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-7xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3">

        {/* Preview */}
        <div className="md:col-span-2 bg-gray-50 p-6 flex items-center justify-center">
          {flyer.assetType === "IMAGE" && flyer.cdnUrl && (
            <motion.img whileHover={{ scale: 1.02 }} src={flyer.cdnUrl} alt="Flyer"
              className="max-h-[78vh] w-full object-contain rounded-xl shadow" />
          )}
          {flyer.assetType === "PDF" && flyer.cdnUrl && (
            <iframe src={flyer.cdnUrl} className="w-full h-[78vh] rounded-xl shadow" />
          )}
          {flyer.assetType === "VIDEO" && flyer.cdnUrl && (
            <video src={flyer.cdnUrl} controls className="max-h-[78vh] w-full object-contain rounded-xl shadow" />
          )}
        </div>

        {/* Right rail */}
        <div className="md:col-span-1 p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{flyer.title}</h1>
            {flyer.description && <p className="text-gray-600 mt-2">{flyer.description}</p>}
          </div>

          {/* QR & actions */}
          {flyer.links[0]?.qr && (
            <div className="border rounded-2xl p-4">
              <p className="text-sm text-gray-700 mb-3 font-medium">Scan QR</p>
              <img src={flyer.links[0].qr.imageUrl} alt="QR" className="w-40 h-40 object-contain rounded-lg shadow mx-auto" />
              <div className="flex gap-3 mt-4">
                {shortUrl && (
                  <button
                    onClick={handleCopy}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                  >
                    <Link2 size={18} />
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                )}
                <a
                    href={flyer.links[0].qr.imageUrl}
                    download
                    onClick={handleDownloadQR}
                    className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition"
                >
                  <Download size={18} />
                  QR
                </a>
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="border rounded-2xl p-4">
            <p className="text-sm text-gray-700 mb-3 font-medium">Performance (last 30d)</p>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard icon={<Eye size={18} />} label="Views" value={metrics?.totals.views ?? 0} />
              <MetricCard icon={<QrCode size={18} />} label="Scans" value={metrics?.totals.scans ?? 0} />
              <MetricCard icon={<Download size={18} />} label="Downloads" value={metrics?.totals.downloads ?? 0} />
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">Powered by Onix-Ads</p>
        </div>
      </motion.div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border p-3 flex flex-col items-center">
      <div className="mb-1">{icon}</div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
