// src/components/Products/ProductList.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import ProductCard from "./ProductCard";
import ProductDetail from "./ProductDetail";

export default function ProductList({ onAddToCart, cart, goToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // product currently open
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const tenant = localStorage.getItem("tenantSlug") || "";
        setLoading(true);
        const r = await api.get("/customer/products", {
          headers: tenant ? { "x-tenant-slug": tenant } : {},
        });
        if (!mounted) return;
        setProducts(Array.isArray(r.data) ? r.data : []);
        setError(null);
      } catch (e) {
        console.warn("ProductList load failed", e);
        if (!mounted) return;
        setError("Failed to load products");
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const s = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [products]);

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        if (category && category !== "All" && p.category !== category) return false;
        if (query && query.trim()) {
          const q = query.trim().toLowerCase();
          return (
            (p.name || "").toLowerCase().includes(q) ||
            (p.category || "").toLowerCase().includes(q) ||
            (p.description || "").toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [products, query, category]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-[#8BCF5820] shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-[#FFEDED] border border-[#F5C2C2] text-[#B00020] rounded-md">
        {error}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-[#8BCF5820] shadow-sm text-center text-gray-600">
        No products found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-[#2D2D2D]">Products</h3>
          <div className="text-sm text-gray-500">{filtered.length} items</div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products or categories..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8BCF58] outline-none"
            />
          </div>

          <button
            onClick={() => goToCart && goToCart()}
            className="ml-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#8BCF58] to-[#6BA840] text-white font-semibold shadow-md hover:brightness-95 transition"
          >
            View Cart
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                active
                  ? "bg-[#f0fff4] border-2 border-[#4A7856] text-[#2D2D2D]"
                  : "bg-white border border-gray-100 text-gray-600 hover:shadow-sm"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div
            key={p._id}
            onClick={() => setSelected(p)}
            className="cursor-pointer"
          >
            <ProductCard p={p} />
          </div>
        ))}
      </div>

      {/* Product detail modal / drawer */}
      {selected && (
        <ProductDetail
          product={selected}
          onClose={() => setSelected(null)}
          onAddToCart={(prod) => {
            onAddToCart && onAddToCart(prod);
          }}
          isInCart={Boolean(cart && cart[selected._id])}
          goToCart={goToCart}
        />
      )}
    </div>
  );
}
