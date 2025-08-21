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
        console.log("Fetching flyer data for ID:", id);
        const res = await fetch(`/api/flyers/${id}`);
        if (!res.ok) throw new Error(`Failed to fetch flyer: ${res.statusText}`);

        const data: FlyerData = await res.json();
        console.log("Fetched flyer data:", data);

        // Track view asynchronously
        fetch(`/api/flyers/${id}/track`, { method: "POST" }).catch(console.error);

        // Normalize URLs to fix double slashes
        if (data.cdnUrl) {
          data.cdnUrl = data.cdnUrl.replace(/\/\//g, "/").replace("https:/", "https://");
        }
        data.links = data.links.map((link) => {
          if (link.qr && link.qr.imageUrl) {
            link.qr.imageUrl = link.qr.imageUrl.replace(/\/\//g, "/").replace("https:/", "https://");
          }
          return link;
        });

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
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Flyer Asset */}
        <div className="flex-1 bg-white flex items-center justify-center p-4">
          {flyer.assetType === "IMAGE" && flyer.cdnUrl && (
            <img
              src={flyer.cdnUrl}
              alt="Flyer"
              className="w-full h-full object-contain rounded-lg shadow"
            />
          )}
          {flyer.assetType === "PDF" && flyer.cdnUrl && (
            <iframe
              src={flyer.cdnUrl}
              className="w-full h-full rounded-lg shadow"
            />
          )}
          {flyer.assetType === "VIDEO" && flyer.cdnUrl && (
            <video
              src={flyer.cdnUrl}
              controls
              autoPlay
              className="w-full h-full object-contain rounded-lg shadow"
            />
          )}
        </div>

        {/* QR Code / Info */}
        <div className="w-full md:w-1/3 bg-gray-50 p-6 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{flyer.title}</h1>
            {flyer.description && (
              <p className="text-gray-600 mb-6">{flyer.description}</p>
            )}
            {flyer.links.length > 0 && flyer.links[0].qr && (
              <div className="flex flex-col items-center mt-4">
                <p className="text-gray-700 mb-2">Scan QR Code:</p>
                <img
                  src={flyer.links[0].qr.imageUrl}
                  alt="Flyer QR Code"
                  className="w-40 h-40 object-contain rounded-md shadow-md"
                />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-6 text-center md:text-left">
            Powered by Onix-Ads
          </p>
        </div>
      </div>
    </div>
  );
}
