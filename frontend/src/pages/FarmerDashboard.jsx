import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ProductUpload from "./ProductUpload";
import ProductEdit from "./ProductEdit";
import FarmerOrders from "../components/FarmerOrders/FarmerOrders";

/* prettier-ignore */
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
        active
          ? "bg-white border-2 border-[#4A7856] shadow-sm text-[#2D2D2D]"
          : "bg-transparent border border-transparent text-gray-600 hover:bg-white/60 hover:shadow-sm"
      }`}
    >
      {children}
    </button>
  );
}

export default function FarmerDashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [trust, setTrust] = useState(null);

  const [myProducts, setMyProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("authToken");
    const tenant = localStorage.getItem("tenantSlug");

    if (!token) {
      const loginPath = tenant
        ? `/farmer/login?tenant=${encodeURIComponent(tenant)}`
        : "/farmer/login";
      navigate(loginPath, { replace: true });
      return;
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (tenant) api.defaults.headers.common["x-tenant-slug"] = tenant;

    const fetchProductsForFarmer = async (farmerId) => {
      if (!farmerId) return [];
      try {
        const fid = String(farmerId).trim();
        if (!fid) return [];
        const res = await api.get(
          `/products/by-farmer-no-tenant?farmerId=${encodeURIComponent(fid)}`
        );
        let prods = res.data || [];

        if ((!prods || prods.length === 0)) {
          try {
            const allRes = await api.get("/products");
            const all = allRes.data || [];
            prods = all.filter((p) => String(p.farmerId) === String(farmerId));
          } catch (e) {
            // ignore fallback error
          }
        }

        return prods;
      } catch (e) {
        console.warn("[DEBUG] fetchProductsForFarmer failed", e);
        return [];
      }
    };

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        let storedUser = null;
        try {
          storedUser = JSON.parse(localStorage.getItem("authUser") || "null");
        } catch (e) {
          storedUser = null;
        }

        if (storedUser && storedUser._id) {
          try {
            const profileRes = await api.get(`/users/${storedUser._id}`);
            if (!isMounted) return;
            setProfile(profileRes.data);
            localStorage.setItem("authUser", JSON.stringify(profileRes.data));
            storedUser = profileRes.data;
          } catch (e) {
            storedUser = null;
          }
        }

        if (!storedUser) {
          try {
            let meRes = null;
            try {
              meRes = await api.get("/auth/me");
            } catch (e) {
              meRes = await api.get("/users/me");
            }
            if (meRes && meRes.data) {
              if (!isMounted) return;
              setProfile(meRes.data);
              localStorage.setItem("authUser", JSON.stringify(meRes.data));
              storedUser = meRes.data;
            }
          } catch (e) {
            storedUser = JSON.parse(localStorage.getItem("authUser") || "null");
          }
        }

        // stubbed orders & trust (kept for compatibility)
        const ordersReq = Promise.resolve({ data: [] });
        const trustReq = Promise.resolve({
          data: { score: 75, breakdown: { consistency: 80, quality: 70 } },
        });
        const [ordersRes, trustRes] = await Promise.allSettled([
          ordersReq,
          trustReq,
        ]);
        if (!isMounted) return;
        if (ordersRes.status === "fulfilled")
          setOrders(ordersRes.value.data || []);
        if (trustRes.status === "fulfilled")
          setTrust(trustRes.value.data || null);

        const farmerId =
          (storedUser && storedUser._id) || (profile && profile._id) || null;

        if (farmerId) {
          const prods = await fetchProductsForFarmer(farmerId);
          if (isMounted) {
            setMyProducts(prods);
            if (prods && prods.length) setTab("products");
          }
        } else {
          if (isMounted) setMyProducts([]);
        }
      } catch (err) {
        if (isMounted)
          setError(err?.response?.data?.message || "Failed to load dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const getDisplayName = () => {
    if (profile?.name) return profile.name;
    try {
      const saved = JSON.parse(localStorage.getItem("authUser"));
      return saved?.name || "Farmer";
    } catch {
      return "Farmer";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("tenantSlug");
    window.location.href = "/";
  };

  const handleDeleteProduct = async (id) => {
    const ok = window.confirm("Delete this product? This will remove images too.");
    if (!ok) return;
    try {
      await api.delete(`/products/${id}`);
      setMyProducts((prev) => (prev || []).filter((p) => p._id !== id));
      if (editingProductId === id) setEditingProductId(null);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  const handleProductSaved = (updated) => {
    setMyProducts((prev) => (prev || []).map((p) => (p._id === updated._id ? updated : p)));
    setEditingProductId(null);
  };

  const renderProfile = () => {
    if (!profile)
      return <div className="text-sm text-gray-600">No profile available.</div>;

    return (
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#8BCF58] to-[#6BA840] flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              {profile.name ? profile.name.split(" ").map(n=>n[0]).slice(0,2).join("") : "F"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#2D2D2D]">{profile.name}</h2>
              <div className="text-sm text-gray-500">Farmer • {profile.farmName || "Independent"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-500">Tenant</div>
              <div className="font-semibold text-[#4A7856]">{localStorage.getItem("tenantSlug") || "—"}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-500">Contact</div>
            <div className="font-semibold text-[#2D2D2D]">{profile.phone}</div>
            <div className="text-sm text-gray-600 mt-2">{profile.email || "—"}</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-500">Address</div>
            <div className="text-sm text-gray-700 mt-2">
              {profile.address?.line1 || "—"} <br />
              {profile.address?.city || ""} {profile.address?.pincode || ""}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProducts = () => {
    return (
      <div className="grid gap-6">
        <ProductUpload
          onUploaded={(p) => {
            setMyProducts((prev) => [p, ...(prev || [])]);
            setTab("products");
          }}
        />

        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Your recent product posts</h4>
          <div className="text-sm text-gray-500">{myProducts?.length || 0} items</div>
        </div>

        {myProducts.length === 0 && <div className="text-sm text-gray-600">No products yet. Add one to get started</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myProducts.map((p) => (
            <div key={p._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col">
              <div className="flex gap-4">
                <div className="w-36 h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {p.photos?.[0] ? (
                    <img src={p.photos[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold text-[#2D2D2D]">{p.name}</div>
                      <div className="text-sm text-gray-500 mt-1">Category: {p.category || "—"}</div>
                      <div className="text-sm text-gray-500 mt-2">Posted: {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm font-bold text-[#4A7856]">₹{p.pricePerUnit}</div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setEditingProductId(p._id)}
                          className="px-3 py-2 rounded-md bg-[#8BCF58] text-white text-sm font-semibold hover:brightness-95 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="px-3 py-2 rounded-md bg-[#FFECEC] text-[#B00020] text-sm font-semibold hover:bg-[#ffdede] transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {p.photos?.map((ph, i) => (
                      <img key={i} src={ph.url} alt={`photo-${i}`} className="w-16 h-12 object-cover rounded-md" />
                    ))}
                  </div>
                </div>
              </div>

              {editingProductId === p._id && (
                <div className="mt-4">
                  <ProductEdit
                    product={p}
                    onSaved={handleProductSaved}
                    onCancel={() => setEditingProductId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrust = () => {
    if (!trust) return <div className="text-sm text-gray-600">No trust score yet.</div>;

    return (
      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">C-Score</div>
            <div className="text-4xl font-extrabold text-[#2D2D2D]">{trust.score}/100</div>
            <div className="text-sm text-gray-500 mt-1">Overall quality rating</div>
          </div>

          <div className="grid gap-3">
            {Object.entries(trust.breakdown || {}).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <div className="w-28 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full" style={{ width: `${v}%`, background: "#8BCF58" }} />
                </div>
                <div className="text-sm text-gray-700 font-semibold">{k}</div>
                <div className="ml-2 text-sm text-gray-600">{v}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const localSpecPath = "/mnt/data/f0e56614-fc53-4e91-ab4b-e3f0d0e248ad.pdf";

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#2D2D2D]">Farmer Dashboard</h1>
            <div className="text-sm text-gray-600">Welcome back, <span className="font-semibold text-[#4A7856]">{getDisplayName()}</span> 👋</div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={localSpecPath}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-[#4A7856] hover:underline"
            >
              View ORGANOZ Spec (PDF)
            </a>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium hover:shadow-sm"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Tabs + quick stats */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>Profile</TabButton>
            <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>Orders</TabButton>
            <TabButton active={tab === "products"} onClick={() => setTab("products")}>My Products</TabButton>
            <TabButton active={tab === "trust"} onClick={() => setTab("trust")}>Trust Score</TabButton>
          </div>

          <div className="flex gap-4">
            <div className="px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
              <div className="text-sm text-gray-500">Products</div>
              <div className="font-bold text-lg text-[#2D2D2D]">{myProducts?.length || 0}</div>
            </div>
            <div className="px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
              <div className="text-sm text-gray-500">Orders</div>
              <div className="font-bold text-lg text-[#2D2D2D]">{orders?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-[#8BCF5820] min-h-[420px]">
          {loading && <div className="text-center py-20 text-gray-500">Loading your dashboard...</div>}

          {error && <div className="mb-4 rounded-lg bg-[#FFEDED] border border-[#F5C2C2] px-4 py-3 text-sm text-[#B00020]">{error}</div>}

          {!loading && !error && (
            <>
              {tab === "profile" && renderProfile()}
              {tab === "orders" && <FarmerOrders orders={orders} />}
              {tab === "products" && renderProducts()}
              {tab === "trust" && renderTrust()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
