// src/components/Profile/Profile.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { ProfileEditForm } from "./ProfileEditForm";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user || !user._id) {
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }
        const tenant = localStorage.getItem("tenantSlug");
        const r = await api.get(`/customers/${user._id}/profile`, {
          headers: tenant ? { "x-tenant-slug": tenant } : {},
        });
        if (!mounted) return;
        setProfile(r.data);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onSaved = (updated) => {
    setProfile(updated);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-[#8BCF5820] shadow-sm">
        <div className="text-sm text-gray-500">Loading profile…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-[#8BCF5820] shadow-sm">
        <div className="text-sm text-gray-600">No profile found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-[#8BCF5820] shadow-sm p-6">
      {/* Top: avatar + basic */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
          {profile?.profilePhoto?.url ? (
            <img
              src={profile.profilePhoto.url}
              alt="profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-2xl font-bold text-[#4A7856]">
              {profile.name ? profile.name.split(" ").map(n => n[0]).slice(0,2).join("") : "U"}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-bold text-[#2D2D2D]">{profile.name}</div>
              <div className="text-sm text-gray-600">{profile.phone}</div>
              <div className="text-sm text-gray-500">{profile.email || "—"}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-2 rounded-lg bg-[#8BCF58] text-white font-semibold shadow-sm hover:brightness-105 transition"
              >
                Edit Address
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Tenant: <span className="font-semibold text-[#4A7856]">{localStorage.getItem("tenantSlug") || "—"}</span>
          </div>
        </div>
      </div>

      <hr className="my-5 border-gray-100" />

      {/* Address block + photo upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-[#2D2D2D] mb-2">Address</h4>
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {profile.address?.line1 || "-"}
            {profile.address?.line2 ? `\n${profile.address.line2}` : ""}
            {` \n${profile.address?.city || ""} ${profile.address?.pincode || ""}`}
            {profile.address?.state ? `\n${profile.address.state}` : ""}
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-semibold text-[#2D2D2D] mb-2">Additional info</h4>
            <div className="text-sm text-gray-600">
              {profile.farmName ? <div><strong>Farm:</strong> {profile.farmName}</div> : null}
              {profile.soilType ? <div><strong>Soil:</strong> {profile.soilType}</div> : null}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#2D2D2D] mb-2">Profile Photo</h4>

          <div className="bg-[#FAFAF7] p-4 rounded-lg border border-gray-100">
            <ProfilePhotoUpload
              userId={profile._id}
              onUploaded={(photo) => setProfile((p) => ({ ...p, profilePhoto: photo }))}
            />
            <div className="mt-3 text-xs text-gray-500">
              Upload a clear photo for buyer trust. Max 2 MB recommended.
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="mt-6">
          <ProfileEditForm
            profile={profile}
            onSaved={onSaved}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {error && <div className="mt-4 text-sm text-[#B00020] bg-[#FFEDED] p-3 rounded-md">{error}</div>}
    </div>
  );
}
