// src/components/Orders/Orders.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";

/**
 * Beautiful Orders component — Tailwind + ORGANOZ palette
 * - Polished cart panel
 * - Sticky mobile checkout bar
 * - Elegant previous orders cards with thumbnails, status badge & timeline
 * - Preserves original behaviour and API calls
 */

export default function Orders({ cart = {}, onRemoveFromCart, clearCart }) {
  const [orders, setOrders] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) {
          if (mounted) {
            setOrders([]);
            setLoadingOrders(false);
          }
          return;
        }
        const tenant = localStorage.getItem("tenantSlug");
        const res = await api.get(`/orders?customerId=${user._id}`, {
          headers: tenant ? { "x-tenant-slug": tenant } : {},
        });
        if (!mounted) return;
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.warn("fetch orders failed", e);
        if (mounted) setOrders([]);
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    }
    loadOrders();
    return () => {
      mounted = false;
    };
  }, []);

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce(
    (s, it) => s + (it.qty * (it.product.pricePerUnit || 0)),
    0
  );

  const formatINR = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v);

  const placeOrder = async () => {
    setError(null);
    if (cartItems.length === 0) {
      setError("Cart is empty");
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user) return (window.location.href = "/customer/login");
      const tenant = localStorage.getItem("tenantSlug");

      // Use profile address if available
      let address = {};
      try {
        const prof = await api.get(`/customers/${user._id}/profile`, {
          headers: tenant ? { "x-tenant-slug": tenant } : {},
        });
        address = prof.data?.address || {};
      } catch (e) {
        address = {};
      }

      // Build payload
      const payload = {
        customerId: user._id,
        tenantSlug: tenant,
        items: cartItems.map((ci) => ({
          productId: ci.product._id,
          qty: ci.qty,
        })),
        total: cartTotal,
        address,
      };

      setPlacing(true);
      const res = await api.post("/orders", payload, {
        headers: tenant ? { "x-tenant-slug": tenant } : {},
      });
      const created = res.data;
      setOrders((prev) => [created, ...(prev || [])]);
      clearCart && clearCart();
    } catch (e) {
      console.error("place order error", e);
      setError(e?.response?.data?.message || e.message || "Order failed");
    } finally {
      setPlacing(false);
    }
  };

  // UI helpers
  const toggleExpand = (id) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusColor = (s) => {
    const st = (s || "").toLowerCase();
    if (st === "placed") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (st === "confirmed") return "bg-[#eff9f1] text-[#2f6b44] border-[#cfe8d0]";
    if (st === "packed") return "bg-[#fff7e6] text-[#b45f00] border-[#ffe6b8]";
    if (st === "shipped") return "bg-[#e8f0ff] text-[#1f59d6] border-[#d7e5ff]";
    if (st === "delivered") return "bg-[#ecfff2] text-[#0b8a55] border-[#dff5e6]";
    if (st === "rejected") return "bg-[#ffeef0] text-[#b00020] border-[#ffd6db]";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Header + cart summary */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-[#2D2D2D]">Orders & Checkout</h3>
          <p className="text-sm text-gray-500">Review your cart and past purchases</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500">Items</div>
            <div className="font-semibold text-[#2D2D2D]">{cartItems.length}</div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="text-sm text-gray-500">Total</div>
            <div className="font-semibold text-[#4A7856]">{formatINR(cartTotal)}</div>
          </div>

          <button
            onClick={placeOrder}
            disabled={placing || cartItems.length === 0}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8BCF58] to-[#6BA840] text-white font-semibold shadow-md hover:brightness-95 disabled:opacity-60"
          >
            {placing ? "Placing…" : "Place Order"}
          </button>
        </div>
      </div>

      {/* Cart panel */}
      <div className="bg-white rounded-2xl border border-[#8BCF5820] shadow-sm p-4">
        {cartItems.length === 0 ? (
          <div className="text-sm text-gray-600">Your cart is empty. Add fresh produce to get started.</div>
        ) : (
          <div className="grid gap-3">
            {cartItems.map((ci) => (
              <div
                key={ci.product._id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#FAFAF7] border border-[#FAFAF7] hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                    {ci.product.photos?.[0] ? (
                      <img src={ci.product.photos[0].url} alt={ci.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No img</div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-[#2D2D2D]">{ci.product.name}</div>
                    <div className="text-xs text-gray-500">Qty: {ci.qty} • {ci.product.unit || 'unit'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="font-semibold text-sm text-[#2D2D2D]">{formatINR(ci.qty * (ci.product.pricePerUnit || 0))}</div>
                  <button
                    onClick={() => onRemoveFromCart && onRemoveFromCart(ci.product._id)}
                    className="text-xs text-[#4A7856] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="text-sm font-semibold">Total</div>
              <div className="text-lg font-extrabold text-[#2D2D2D]">{formatINR(cartTotal)}</div>
            </div>

            {error && <div className="text-sm text-[#B00020] bg-[#FFEDED] px-3 py-2 rounded-md">{error}</div>}
          </div>
        )}
      </div>

      {/* Sticky mobile checkout bar */}
      <div className="fixed left-0 right-0 bottom-4 px-4 sm:hidden z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between bg-white rounded-full px-4 py-3 border border-gray-100 shadow-lg">
          <div>
            <div className="text-xs text-gray-500">Cart</div>
            <div className="font-semibold text-[#2D2D2D]">{cartItems.length} items • {formatINR(cartTotal)}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={placeOrder}
              disabled={placing || cartItems.length === 0}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#8BCF58] to-[#6BA840] text-white font-semibold shadow-md"
            >
              {placing ? "Placing…" : "Checkout"}
            </button>
          </div>
        </div>
      </div>

      {/* Previous Orders */}
      <div>
        <h4 className="text-xl font-bold text-[#2D2D2D] mb-4">Previous Orders</h4>

        {loadingOrders ? (
          <div className="p-6 rounded-lg bg-white border border-gray-100 text-sm text-gray-500">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-6 rounded-lg bg-white border border-gray-100 text-sm text-gray-600">No orders yet</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const expanded = expandedOrderIds.has(o._id);
              return (
                <div key={o._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#FAFAF7] flex items-center justify-center text-[#4A7856] font-bold text-lg">
                        #{String(o._id).slice(-4)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-[#2D2D2D]">Order #{String(o._id).slice(-6)}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(o.status)}`}>{o.status || 'placed'}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{new Date(o.createdAt || o._createdAt || Date.now()).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-extrabold text-[#2D2D2D]">{formatINR(o.total || 0)}</div>
                      <div className="text-sm text-gray-500 mt-2 flex items-center gap-2 justify-end">
                        <button
                          onClick={() => toggleExpand(o._id)}
                          className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                        >
                          {expanded ? "Hide details" : "View details"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <div className={`mt-4 transition-all ${expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                    <div className="grid gap-3">
                      {o.items?.map((it, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 bg-[#FAFAF7] p-3 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                              {it.photoUrl ? (
                                <img src={it.photoUrl} alt={it.name} className="w-full h-full object-cover" />
                              ) : it.productPhotos?.[0]?.url ? (
                                <img src={it.productPhotos[0].url} alt={it.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                              )}
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-[#2D2D2D]">{it.name || "Product"}</div>
                              <div className="text-xs text-gray-500">Qty: {it.qty} • {it.unit || ''}</div>
                              <div className="text-xs text-gray-500 mt-1">Farmer: <span className="font-medium text-[#2D2D2D]">{it.farmerName || it.farmer || "—"}</span></div>
                            </div>
                          </div>

                          <div className="text-sm font-semibold">{formatINR((it.pricePerUnit || it.price || 0) * (it.qty || 1))}</div>
                        </div>
                      ))}

                      {/* Shipping & address */}
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <div className="text-sm font-semibold text-[#2D2D2D]">Shipping</div>
                        <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                          {o.address ? (
                            `${o.address.line1 || o.address.street || "-"}${o.address.line2 ? `\n${o.address.line2}` : ""}\n${o.address.city || ""} ${o.address.pincode || ""}${o.address.state ? `\n${o.address.state}` : ""}`
                          ) : "No address provided"}
                        </div>
                      </div>

                      {/* Timeline / history */}
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <div className="text-sm font-semibold text-[#2D2D2D] mb-2">History</div>
                        <div className="space-y-2">
                          {(o.history || []).length === 0 && <div className="text-xs text-gray-500">No history available.</div>}
                          {(o.history || []).map((h, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#4A7856]" />
                              <div className="text-sm text-gray-700 flex-1">{h.status}</div>
                              <div className="text-xs text-gray-400">{h.at ? new Date(h.at).toLocaleString() : ""}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
