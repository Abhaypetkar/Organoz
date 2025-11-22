// src/pages/CustomerDashboard.jsx
import React, { useState } from "react";
import ProductList from "../components/Products/ProductList";
import Orders from "../components/Orders/Orders";
import Farms from "../components/Farms/Farms";
import Profile from "../components/Profile/Profile";
import Cscore from "../components/Cscore/Cscore";

const TABS = ["Products", "Orders", "Farms", "Cscore", "Profile"];

export default function CustomerDashboard() {
  const [active, setActive] = useState("Products");
  const [cart, setCart] = useState({}); // keyed by product._id -> { product, qty }
  const [highlightedProductId, setHighlightedProductId] = useState(null);

  const addToCart = (arg) => {
    // arg can be product or { product, qty }
    const product = arg.product || arg;
    const qtyToAdd = Number(arg.qty || 1);

    setCart((prev) => {
      const next = { ...prev };
      const id = product._id;
      const prevItem = next[id] || { qty: 0, product };
      const newQty = Math.min(prevItem.qty + qtyToAdd, product.stock ?? 9999);
      next[id] = { product, qty: newQty };
      return next;
    });

    // highlight the added product and optionally switch tab
    setHighlightedProductId(product._id);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const clearCart = () => setCart({});

  // passed to ProductList/ProductDetail to switch to Orders tab
  const goToCart = () => {
    setActive("Orders");
  };

  // computed summary
  const cartItemCount = Object.values(cart).reduce((s, it) => s + (it.qty || 0), 0);
  const cartTotal = Object.values(cart).reduce((s, it) => s + (it.qty || 0) * (it.product.pricePerUnit || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#2D2D2D]">Customer Dashboard</h1>
            <p className="text-sm text-gray-600">Shop local, support farmers, eat fresh.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-gray-100 shadow-sm">
              <div className="text-sm text-gray-500">Items</div>
              <div className="font-semibold text-[#2D2D2D]">{cartItemCount}</div>
              <div className="text-sm text-gray-400">•</div>
              <div className="text-sm text-gray-500">Total</div>
              <div className="font-semibold text-[#4A7856]">₹ {cartTotal.toFixed(0)}</div>
            </div>

            <button
              onClick={() => setActive("Orders")}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8BCF58] to-[#6BA840] text-white font-bold shadow-md hover:brightness-105 transition"
            >
              View Cart
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-4 border border-[#8BCF5820] mb-6 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            {TABS.map((t) => {
              const isActive = t === active;
              return (
                <button
                  key={t}
                  onClick={() => setActive(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#f0fff4] border-2 border-[#4A7856] text-[#2D2D2D] shadow-sm"
                      : "bg-transparent text-gray-600 hover:bg-white/60"
                  }`}
                >
                  {t}
                </button>
              );
            })}

            <div className="ml-auto text-sm text-gray-500">Tenant: <span className="font-semibold text-[#4A7856]">{localStorage.getItem("tenantSlug") || "—"}</span></div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[420px]">
          {active === "Products" && (
            <ProductList
              onAddToCart={addToCart}
              cart={cart}
              goToCart={goToCart}
              highlightedProductId={highlightedProductId}
              onClearHighlight={() => setHighlightedProductId(null)}
            />
          )}

          {active === "Orders" && (
            <Orders
              cart={cart}
              onRemoveFromCart={removeFromCart}
              clearCart={clearCart}
              highlightedProductId={highlightedProductId}
              onClearHighlight={() => setHighlightedProductId(null)}
            />
          )}

          {active === "Farms" && <Farms />}

          {active === "Cscore" && <Cscore />}

          {active === "Profile" && <Profile />}
        </div>
      </div>
    </div>
  );
}
