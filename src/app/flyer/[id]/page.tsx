"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type FlyerData = {
  id: string;
  cdnUrl: string | null;
  assetType: "IMAGE" | "VIDEO" | "PDF";
};

export default function FlyerViewerPage() {
  const { id } = useParams();
  const [flyer, setFlyer] = useState<FlyerData | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/flyers/${id}`)
      .then((res) => res.json())
      .then((data) => setFlyer(data))
      .catch(console.error);
  }, [id]);

  if (!flyer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading flyer...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-5xl w-full h-full bg-white rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
        {flyer.assetType === "IMAGE" && (
          <img
            src={flyer.cdnUrl ?? ""}
            alt="Flyer"
            className="w-full h-full object-contain"
          />
        )}
        {flyer.assetType === "PDF" && (
          <iframe src={flyer.cdnUrl ?? ""} className="w-full h-full" />
        )}
        {flyer.assetType === "VIDEO" && (
          <video
            src={flyer.cdnUrl ?? ""}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
