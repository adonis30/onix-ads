"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type QRData = {
  id: string;
  imageUrl: string;
};

type LinkData = {
  id: string;
  slug: string;
  qr: QRData | null;
};

type FlyerData = {
  id: string;
  title: string;
  description?: string;
  cdnUrl: string | null;
  assetType: "IMAGE" | "VIDEO" | "PDF";
  links: LinkData[];
};

export default function FlyerViewerPage() {
  const { id } = useParams();
  const [flyer, setFlyer] = useState<FlyerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchFlyer() {
      try {
        const res = await fetch(`/api/flyers/${id}`);
        const data: FlyerData = await res.json();

        // Track view
        await fetch(`/api/flyers/${id}/track`, { method: "POST" });

        setFlyer(data);
      } catch (err) {
        console.error("Failed to load flyer", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFlyer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-xl animate-pulse">Loading flyer...</p>
      </div>
    );
  }

  if (!flyer) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-xl">Flyer not found.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Flyer Asset */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
          {flyer.assetType === "IMAGE" && (
            <img
              src={flyer.cdnUrl ?? ""}
              alt={flyer.title}
              className="w-full h-full object-contain rounded-lg"
            />
          )}
          {flyer.assetType === "PDF" && (
            <iframe
              src={flyer.cdnUrl ?? ""}
              className="w-full h-full rounded-lg border"
              title={flyer.title}
            />
          )}
          {flyer.assetType === "VIDEO" && (
            <video
              src={flyer.cdnUrl ?? ""}
              controls
              autoPlay
              className="w-full h-full object-contain rounded-lg"
            />
          )}
        </div>

        {/* QR Code / Info */}
        <div className="w-full md:w-1/3 bg-gray-50 p-6 flex flex-col justify-between mt-4 md:mt-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{flyer.title}</h1>
            {flyer.description && (
              <p className="text-gray-600 mb-4">{flyer.description}</p>
            )}
            {flyer.links.length > 0 && flyer.links[0].qr && (
              <div className="flex flex-col items-center mt-4 md:mt-0">
                <p className="text-gray-700 mb-2">Scan QR Code:</p>
                <img
                  src={flyer.links[0].qr.imageUrl}
                  alt="Flyer QR Code"
                  className="w-32 h-32 object-contain"
                />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-6 md:mt-4 text-center md:text-left">
            Powered by Onix-Ads
          </p>
        </div>
      </div>
    </div>
  );
}
