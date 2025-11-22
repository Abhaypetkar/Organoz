// src/components/Products/ProductDetail.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * ProductDetail (Tailwind + ORGANOZ palette)
 * - image carousel
 * - quantity selector (min 1, max = stock)
 * - Add to cart => calls onAddToCart({ product, qty })
 * - Go to cart uses parent goToCart or router fallback
 *
 * Preserves original behaviour and props.
 */

function getPrice(p) {
  return p?.pricePerUnit ?? p?.price ?? null;
}

function Carousel({ photos = [] }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (i >= photos.length) setI(0);
  }, [photos.length, i]);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-80 rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400">No image</div>
      </div>
    );
  }

  const prev = () => setI((idx) => (idx - 1 + photos.length) % photos.length);
  const next = () => setI((idx) => (idx + 1) % photos.length);

  return (
    <div className="relative w-full h-80 rounded-lg overflow-hidden bg-black">
      <img
        src={photos[i].url}
        alt={`img-${i}`}
        className="w-full h-full object-cover transition-transform duration-300"
      />

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-md hover:bg-black/50"
            aria-label="Previous image"
          >
            ‹
          </button>

          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-md hover:bg-black/50"
            aria-label="Next image"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={`text-white text-[10px] ${idx === i ? "opacity-100" : "opacity-40"}`}
              >
                ●
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductDetail({ product, onClose, onAddToCart, isInCart, goToCart }) {
  const navigate = useNavigate();
  const photos = (product?.photos && product.photos.length) ? product.photos.slice(0, 6) : [{ url: "/placeholder.png" }];
  const price = getPrice(product);

  const [qty, setQty] = React.useState(1);
  React.useEffect(() => {
    setQty(1);
  }, [product?._id]);

  const inc = () => setQty((q) => Math.min(q + 1, product?.stock ?? 9999));
  const dec = () => setQty((q) => Math.max(1, q - 1));
  const onQtyChange = (v) => {
    const n = Number(v) || 1;
    setQty(Math.max(1, Math.min(n, product?.stock ?? 9999)));
  };

  const [addedLocal, setAddedLocal] = React.useState(false);
  React.useEffect(() => {
    if (!isInCart) setAddedLocal(false);
  }, [isInCart]);

  const handleAddClick = () => {
    onAddToCart && onAddToCart({ product, qty });
    setAddedLocal(true);
  };

  const handleGoToCart = () => {
    if (typeof goToCart === "function") {
      try {
        goToCart();
        onClose && onClose();
        return;
      } catch (e) {
        console.warn("goToCart threw", e);
      }
    }
    try {
      navigate("/customer/orders");
      onClose && onClose();
      return;
    } catch (e) {}
    window.location.href = "/customer/orders";
  };

  const shownAsInCart = Boolean(isInCart) || addedLocal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-lg font-extrabold text-[#2D2D2D]">{product?.name}</div>
            <div className="text-sm text-gray-500">{product?.category || ""} • Stock: {product?.stock ?? "—"}</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <Carousel photos={photos} />

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="text-2xl font-extrabold text-[#4A7856]">{price !== null ? `₹ ${price}` : "Price N/A"}</div>
            <div className="text-sm text-gray-600 mt-2">{product?.description || "No description"}</div>
            <div className="text-sm text-gray-600 mt-3">Farmer: <span className="font-semibold text-[#2D2D2D]">{product?.farmerName || "—"}</span></div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm text-gray-600">Quantity</label>

            <div className="flex items-center gap-2">
              <button
                onClick={dec}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:shadow-sm"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                value={qty}
                onChange={(e) => onQtyChange(e.target.value)}
                className="w-20 text-center px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8BCF58] outline-none"
              />
              <button
                onClick={inc}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:shadow-sm"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <div className="mt-3">
              {!shownAsInCart ? (
                <button
                  onClick={handleAddClick}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#8BCF58] to-[#6BA840] text-white font-bold shadow-md hover:brightness-105 transition-transform active:scale-95"
                >
                  Add {qty > 1 ? `${qty} to cart` : "to cart"}
                </button>
              ) : (
                <button
                  onClick={handleGoToCart}
                  className="w-full px-4 py-3 rounded-xl bg-[#2563eb] text-white font-bold shadow-md hover:brightness-105 transition-transform active:scale-95"
                >
                  Go to cart
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-2">Min 1 • Max {product?.stock ?? 6} • Max 6 images</div>
          </div>
        </div>
      </div>
    </div>
  );
}
