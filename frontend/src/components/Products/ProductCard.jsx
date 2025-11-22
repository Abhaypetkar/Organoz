import React from "react";

function getPrice(p) {
  return p?.pricePerUnit ?? p?.price ?? null;
}

export default function ProductCard({ p }) {
  const img = p.photos?.[0]?.url || null;
  const price = getPrice(p);

  return (
    <div
      className="
        bg-white rounded-xl shadow-sm border border-[#8BCF5820]
        hover:shadow-md hover:-translate-y-1 transition p-4 cursor-pointer
        flex flex-col gap-3
      "
    >
      {/* Product Image */}
      <div className="w-full h-40 rounded-lg overflow-hidden bg-[#FAFAF7]">
        {img ? (
          <img
            src={img}
            alt={p.name}
            className="w-full h-full object-cover hover:scale-105 transition"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Category Badge */}
      <div>
        <span className="inline-block text-xs px-3 py-1 rounded-full bg-[#f0fff4] text-[#4A7856] border border-[#4A785620]">
          {p.category || "Uncategorized"}
        </span>
      </div>

      {/* Name + Unit */}
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-[#2D2D2D] text-lg leading-tight">
          {p.name}
        </h3>
        <span className="text-sm text-gray-500">{p.unit || "unit"}</span>
      </div>

      {/* Price */}
      <div className="text-xl font-extrabold text-[#4A7856]">
        {price !== null ? `₹ ${price}` : "Price N/A"}
      </div>

      {/* Stock */}
      <div className="text-sm text-gray-600">
        Stock: <span className="font-semibold">{p.stock ?? "—"}</span>
      </div>

      {/* Farmer Name */}
      <div className="text-sm text-gray-600">
        👨‍🌾 Farmer:{" "}
        <span className="font-semibold text-[#2D2D2D]">
          {p.farmerName || "—"}
        </span>
      </div>
    </div>
  );
}
