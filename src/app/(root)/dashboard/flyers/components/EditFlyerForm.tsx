"use client";

import { useEffect, useState } from "react";

interface Flyer {
  id: string;
  title: string;
  description: string;
  assetType: "IMAGE" | "VIDEO" | "PDF";
  campaign: { id: string; name: string };
}

interface EditFlyerFormProps {
  flyer: Flyer;
  onFlyerUpdated: () => void;
  onCancel: () => void;
}

export default function EditFlyerForm({ flyer, onFlyerUpdated, onCancel }: EditFlyerFormProps) {
  const [title, setTitle] = useState(flyer.title);
  const [description, setDescription] = useState(flyer.description);
  const [assetType, setAssetType] = useState(flyer.assetType);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/flyers/${flyer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, assetType }),
      });
      if (!res.ok) throw new Error("Update failed");
      onFlyerUpdated();
    } catch (err) {
      console.error(err);
      alert("Error updating flyer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-300">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-2 bg-gray-900 text-white rounded"
        />
      </div>

      <div>
        <label className="block text-gray-300">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 bg-gray-900 text-white rounded"
        />
      </div>

      <div>
        <label className="block text-gray-300">Asset Type</label>
        <select
          value={assetType}
          onChange={(e) => setAssetType(e.target.value as Flyer["assetType"])}
          className="w-full p-2 bg-gray-900 text-white rounded"
        >
          <option value="IMAGE">Image</option>
          <option value="VIDEO">Video</option>
          <option value="PDF">PDF</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
        >
          {loading ? "Updating..." : "Update Flyer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
