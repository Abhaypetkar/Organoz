// src/components/Profile/ProfilePhotoUpload.jsx
import React, { useState, useRef } from "react";
import api from "../../services/api";

export function ProfilePhotoUpload({ userId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setUploading(true);

    try {
      const tenant = localStorage.getItem("tenantSlug");
      const fd = new FormData();
      fd.append("photo", f);

      // Let axios/browser set Content-Type (boundary). Provide tenant header.
      const r = await api.put(`/customers/${userId}/profile/photo`, fd, {
        headers: tenant ? { "x-tenant-slug": tenant } : {},
      });

      onUploaded && onUploaded(r.data.profilePhoto);
    } catch (e) {
      console.error("Photo upload failed", e);
      setError(e?.response?.data?.message || e.message || "Upload failed");
    } finally {
      setUploading(false);
      // reset input so same file can be re-uploaded if needed
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-3">
      <label
        className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
        htmlFor={`pf-upload-${userId}`}
      >
        <svg
          className="w-4 h-4 text-[#4A7856]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4v8z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11l2 2 4-4" />
        </svg>

        <span className="text-sm font-medium text-[#2D2D2D]">
          {uploading ? "Uploading…" : "Upload Photo"}
        </span>
      </label>

      <input
        id={`pf-upload-${userId}`}
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
      />

      {error && (
        <div className="mt-2 text-sm text-[#B00020] bg-[#FFEDED] border border-[#F5C2C2] px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        Tip: Use a clear headshot. File &lt; 2MB recommended.
      </div>
    </div>
  );
}
