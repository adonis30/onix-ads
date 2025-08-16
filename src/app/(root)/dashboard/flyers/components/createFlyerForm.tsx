"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import * as pdfjsLib from "pdfjs-dist";

interface CreateFlyerFormProps {
  onFlyerCreated: () => void;
}

interface UploadFile {
  file: File;
  preview: string;
  progress: number;
}

export default function CreateFlyerForm({ onFlyerCreated }: CreateFlyerFormProps) {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    fetch("/api/tenants/campaigns", {
      headers: {
        "x-tenant-id": session.user.tenantId,
        "x-user-role": session.user.role,
      },
    })
      .then((res) => res.json())
      .then((data) => setCampaigns(data));
  }, [session]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (files.length === 0) return alert("Please add at least one file.");
  setLoading(true);

  // Clone files array to update progress individually
  const updatedFiles = [...files];

  for (let i = 0; i < files.length; i++) {
    const fileData = files[i];
    const formData = new FormData();

    // Append form fields
    const target = e.target as any;
    formData.append("title", target.title.value);
    formData.append("description", target.description.value);
    formData.append("campaignId", target.campaignId.value);
    formData.append("assetType", target.assetType.value);
    formData.append("file", fileData.file);

    try {
      // Use XMLHttpRequest for upload with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/flyers");

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            updatedFiles[i].progress = percent;
            setFiles([...updatedFiles]);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(xhr.responseText);
        };

        xhr.onerror = () => reject(xhr.responseText);
        xhr.send(formData);
      });
    } catch (err) {
      console.error(err);
      alert(`Error uploading ${fileData.file.name}`);
    }
  }

  // Reset form and state
  setLoading(false);
  setFiles([]);
  onFlyerCreated();
};


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title & Description */}
      <div className="space-y-2">
        <label className="block text-gray-200 font-medium">Title</label>
        <input
          name="title"
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-gray-200 font-medium">Description</label>
        <textarea
          name="description"
          className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Campaign & Asset Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-200 font-medium">Campaign</label>
          <select
            name="campaignId"
            required
            className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-200 font-medium">Asset Type</label>
          <select
            name="assetType"
            required
            className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="PDF">PDF</option>
          </select>
        </div>
      </div>

      {/* Drag & Drop */}
      <div
        ref={dropRef}
        className="relative w-full p-6 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition"
      >
        Drag & Drop files here or click to browse
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && setFiles([...files, ...Array.from(e.target.files).map(f => ({file: f, preview: URL.createObjectURL(f), progress: 0}))])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Files Preview */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
          {files.map((f, i) => (
            <div key={i} className="relative bg-gray-800 p-2 rounded-lg border border-gray-700 group">
              {f.preview && <img src={f.preview} className="w-full h-24 object-cover rounded" />}
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-xs text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                {f.file.name} • {formatBytes(f.file.size)}
              </div>
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition"
      >
        {loading ? "Uploading..." : "Upload Flyer(s)"}
      </button>
    </form>
  );
}
