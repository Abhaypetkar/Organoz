// src/components/FarmerOrders/FarmerOrders.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function FarmerOrders({ farmerId: propFarmerId, onError }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  const getFarmerId = () => {
    if (propFarmerId) return propFarmerId;
    try {
      const auth =
        JSON.parse(localStorage.getItem("authUser") || "null") ||
        JSON.parse(localStorage.getItem("user") || "null");
      return auth?._id || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const farmerId = getFarmerId();
        if (!farmerId) {
          setOrders([]);
          setLoading(false);
          return;
        }
        const tenant = localStorage.getItem("tenantSlug");
        const r = await api.get(`/orders?farmerId=${farmerId}`, {
          headers: tenant ? { "x-tenant-slug": tenant } : {},
        });
        if (!mounted) return;
        setOrders(Array.isArray(r.data) ? r.data : []);
      } catch (e) {
        console.error("FarmerOrders load failed:", e);
        const msg = e?.response?.data?.message || e.message || "Failed to load orders";
        setError(msg);
        onError && onError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [propFarmerId, onError]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    const prev = [...orders];
    setOrders(prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));

    try {
      const tenant = localStorage.getItem("tenantSlug");
      const payload = { status: newStatus, actor: `farmer:${getFarmerId()}` };
      const r = await api.put(`/orders/${orderId}/status`, payload, {
        headers: tenant ? { "x-tenant-slug": tenant } : {},
      });
      setOrders(prev.map((o) => (o._id === orderId ? r.data : o)));
    } catch (e) {
      console.error("Status update failed:", e);
      setOrders(prev);
      const msg = e?.response?.data?.message || e.message || "Status update failed";
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderActions = (order) => {
    const s = order.status || "placed";
    const actions = [];

    if (s === "placed") {
      actions.push({ label: "Confirm", status: "confirmed", color: "#4A7856" });
      actions.push({ label: "Reject", status: "rejected", color: "#B00020" });
    } else if (s === "confirmed") {
      actions.push({ label: "Pack", status: "packed", color: "#FF8C00" });
      actions.push({ label: "Ship", status: "shipped", color: "#2563EB" });
    } else if (s === "packed") {
      actions.push({ label: "Ship", status: "shipped", color: "#2563EB" });
    } else if (s === "shipped") {
      actions.push({ label: "Deliver", status: "delivered", color: "#4A7856" });
    }

    return actions.map((a) => (
      <button
        key={a.status}
        disabled={updatingId === order._id}
        onClick={() => updateStatus(order._id, a.status)}
        className="ml-2 px-3 py-1.5 rounded-md text-sm font-semibold transition disabled:opacity-50"
        style={{
          background: a.color,
          color: "#fff",
        }}
      >
        {updatingId === order._id ? "..." : a.label}
      </button>
    ));
  };

  if (loading)
    return <div className="text-center py-6 text-gray-500">Loading orders…</div>;
  if (error)
    return (
      <div className="bg-[#FFEDED] border border-[#F5C2C2] text-[#B00020] px-4 py-3 rounded-md">
        {error}
      </div>
    );
  if (!orders.length)
    return <div className="text-gray-600">No orders yet.</div>;

  return (
    <div className="grid gap-4">
      {orders.map((o) => (
        <OrderRow
          key={o._1d ? o._1d : o._id}
          order={o}
          renderActions={renderActions}
          updatingId={updatingId}
        />
      ))}
    </div>
  );
}

/* OrderRow - presentational, Tailwind-styled */
function OrderRow({ order, renderActions, updatingId }) {
  const [open, setOpen] = useState(false);
  const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : "";

  const customerName = order.customerName || order.address?.name || "Customer";
  const customerPhone =
    order.customerPhone || order.address?.phone || order.address?.mobile || "—";

  const total = typeof order.total === "number" ? order.total : order.total || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm text-gray-500">Order</div>
              <div className="text-lg font-bold text-[#2D2D2D]">#{String(order._id).slice(-6)}</div>
            </div>

            <div className="text-right md:text-left">
              <div className="text-sm text-gray-500">Placed</div>
              <div className="text-sm text-gray-700">{created}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="rounded-full w-10 h-10 bg-[#8BCF5820] flex items-center justify-center font-bold text-[#4A7856]">
              {customerName.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-[#2D2D2D]">{customerName}</div>
              <div className="text-xs text-gray-500">📞 {customerPhone}</div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 text-right md:text-left">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-lg font-bold text-[#2D2D2D]">₹ {total}</div>
          <div className="text-xs text-gray-500 mt-1">Status: <span className="font-semibold">{order.status}</span></div>

          <div className="mt-3 flex items-center justify-end">
            <button
              onClick={() => setOpen((v) => !v)}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm mr-2"
            >
              {open ? "Hide" : "Details"}
            </button>

            {renderActions(order)}
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-4 border-t border-dashed border-gray-100 pt-4 space-y-4">
          <div>
            <div className="text-sm font-semibold text-[#2D2D2D] mb-2">Items</div>
            <div className="space-y-2">
              {order.items?.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm text-gray-700">
                  <div>{it.name} × {it.qty}</div>
                  <div>₹ { (it.qty * (it.pricePerUnit || 0)).toFixed(0) }</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#2D2D2D] mb-2">Shipping & Contact</div>
            <div className="text-sm text-gray-700 space-y-1">
              <div><strong>{customerName}</strong></div>
              <div>📞 {customerPhone}</div>

              <div className="mt-2 whitespace-pre-line">
                {order.address?.line1 || order.address?.street || "-"}{order.address?.line1 || order.address?.street ? "\n" : ""}
                {order.address?.line2 ? order.address.line2 + "\n" : ""}
                {(order.address?.city || "") + (order.address?.pincode ? " " + order.address.pincode : "")}{order.address?.state ? "\n" + order.address.state : ""}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#2D2D2D] mb-2">History</div>
            <div className="space-y-2 text-sm text-gray-600">
              {(order.history || []).map((h, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>{h.status}</div>
                  <div className="text-xs text-gray-500">{h.at ? new Date(h.at).toLocaleString() : ""}</div>
                </div>
              ))}
              {!(order.history || []).length && <div className="text-xs text-gray-500">No history available.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
