import React, { useState } from "react";
import api from "../../services/api";

export function ProfileEditForm({ profile, onSaved, onCancel }) {
  const [addr, setAddr] = useState({
    line1: profile?.address?.line1 || "",
    line2: profile?.address?.line2 || "",
    city: profile?.address?.city || "",
    pincode: profile?.address?.pincode || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setError(null);

    // basic validation
    if (!addr.line1 || !addr.city) {
      setError("Please provide at least Address line 1 and City.");
      return;
    }

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user || !user._id) throw new Error("User missing from localStorage");

      const tenant = localStorage.getItem("tenantSlug");
      const r = await api.put(
        `/customers/${user._id}/profile`,
        { address: addr },
        { headers: tenant ? { "x-tenant-slug": tenant } : {} }
      );

      onSaved && onSaved(r.data);
    } catch (e) {
      console.error("Profile save failed", e);
      setError(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 bg-white rounded-2xl border border-[#8BCF5820] p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-[#2D2D2D] mb-3">Edit Address</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 1</label>
          <input
            value={addr.line1}
            onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
            placeholder="House / Street / Locality"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8BCF58] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 2</label>
          <input
            value={addr.line2}
            onChange={(e) => setAddr({ ...addr, line2: e.target.value })}
            placeholder="Landmark / Colony (optional)"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8BCF58] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
          <input
            value={addr.city}
            onChange={(e) => setAddr({ ...addr, city: e.target.value })}
            placeholder="City"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8BCF58] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
          <input
            value={addr.pincode}
            onChange={(e) => setAddr({ ...addr, pincode: e.target.value })}
            placeholder="PIN code"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8BCF58] outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-md bg-[#FFEDED] border border-[#F5C2C2] text-[#B00020] text-sm">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8BCF58] to-[#6BA840] text-white font-semibold shadow-md hover:brightness-95 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
