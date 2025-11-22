// src/components/Farms/Farms.jsx
import React, { useState } from "react";

export default function Farms() {
  const [msg, setMsg] = useState("Hey, can I know more about Organoz Farms?");

  const phone = "8237519798"; // WA contact number

  const openWhatsApp = () => {
    const text = encodeURIComponent(msg.trim());
    const url = `https://wa.me/91${phone}?text=${text}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-white rounded-2xl border border-[#8BCF5820] shadow-sm p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8BCF58] to-[#6BA840] text-white flex items-center justify-center font-bold text-2xl">
          F
        </div>

        <div>
          <h3 className="text-2xl font-extrabold text-[#2D2D2D]">Farms — Coming Soon</h3>
          <p className="text-sm text-gray-600 mt-2 max-w-2xl">
            Organoz Farms will let you connect deeper with the land and the people who grow your food. Soon you'll be able to
            rent a mini-plot, choose crops, and work with a dedicated farmer — with complete traceability and daily updates.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="p-4 bg-[#FAFAF7] rounded-lg border border-white/80">
          <div className="font-semibold text-[#2D2D2D]">Grow What You Want</div>
          <div className="text-sm text-gray-600 mt-2">
            Rent a minimum <strong>5m × 5m</strong> plot and pick your crop. A dedicated farmer will grow it exactly how you want.
          </div>
        </div>

        <div className="p-4 bg-[#FAFAF7] rounded-lg border border-white/80">
          <div className="font-semibold text-[#2D2D2D]">Daily Geo-tagged Photos</div>
          <div className="text-sm text-gray-600 mt-2">
            Get real-time, GPS-verified photos and growth updates of your exact plot.
          </div>
        </div>

        <div className="p-4 bg-[#FAFAF7] rounded-lg border border-white/80">
          <div className="font-semibold text-[#2D2D2D]">One-to-One Farmer Support</div>
          <div className="text-sm text-gray-600 mt-2">
            Your rented plot is cared for by a single dedicated farmer. Ask, interact & guide anytime.
          </div>
        </div>

        <div className="p-4 bg-[#FAFAF7] rounded-lg border border-white/80">
          <div className="font-semibold text-[#2D2D2D]">Transparent & Fair</div>
          <div className="text-sm text-gray-600 mt-2">
            Clear rental pricing, fair farmer payouts, and verified organic growing.
          </div>
        </div>
      </div>

      {/* --- WhatsApp interaction section --- */}
      <div className="mt-6 p-4 bg-[#FAFAF7] rounded-xl border border-[#8BCF5820]">
        <div className="text-sm text-gray-700 mb-2 font-semibold">Ask More / Get Early Access</div>
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-[#8BCF58] text-sm"
          placeholder="Type your message…"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          <button
            onClick={openWhatsApp}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#8BCF58] to-[#6BA840] text-white font-semibold shadow-md hover:brightness-95 transition"
          >
            Know More on WhatsApp
          </button>

          <button
            onClick={openWhatsApp}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition"
          >
            Get Notified
          </button>
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        <strong>Note:</strong> This feature is launching soon. Early access is limited by region & season.
      </div>
    </div>
  );
}
