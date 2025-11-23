"use client"

import { useEffect, useState } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import VillageSelector from "./components/VillageSelector"
import ApplyModal from "./components/ApplyModal"
import FarmerApply from "./pages/FarmerApply"
import FarmerLogin from "./pages/FarmerLogin"
import FarmerDashboard from "./pages/FarmerDashboard"
import CustomerLogin from "./pages/CustomerLogin"
import CustomerRegister from "./pages/CustomerRegister"
import CustomerDashboard from "./pages/CustomerDashboard"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import "./styles.css"
import api from "./services/api"

export default function App() {
  const [applyOpen, setApplyOpen] = useState(false)
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  const [status, setStatus] = useState("loading")

  // AUTO-REDIRECT FARMER SUBDOMAIN TO /apply
  useEffect(() => {
    try {
      const host = window.location.hostname.toLowerCase()
      const sub = host.split(".")[0]
      if (sub === "farmer" && window.location.pathname === "/") {
        navigate("/apply")
      }
    } catch {}
  }, [navigate])

  function maybeRedirectBuyerLogin() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null")
      if (user) return
      const pathname = (window.location.pathname || "/").toLowerCase()
      const skipPrefixes = ["/farmer", "/apply", "/admin"]
      const isFarmerPath = skipPrefixes.some((pref) => pathname.startsWith(pref))
      const isCustomerPath = pathname.startsWith("/customer")
      if (!isFarmerPath && !isCustomerPath) {
        navigate("/", { replace: true })
      }
    } catch {}
  }

  // TENANT DETECTION
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const qDev = urlParams.get("dev")
    const qTenant = urlParams.get("tenant")
    if (qTenant) {
      localStorage.setItem("tenantSlug", qTenant)
      urlParams.delete("tenant")
      if (qDev) urlParams.delete("dev")
      const base = window.location.origin + window.location.pathname
      window.history.replaceState({}, "", base + (urlParams.toString() ? "?" + urlParams.toString() : ""))
    }
    const stored = localStorage.getItem("tenantSlug")
    let slug = qTenant || stored || null
    if (!slug) {
      try {
        const host = (window.location.hostname || "").toLowerCase()
        const parts = host.split(".")
        if (parts.length >= 3 && !host.includes("localhost") && !host.startsWith("127.")) {
          slug = parts[0]
          localStorage.setItem("tenantSlug", slug)
        }
      } catch {}
    }
    if (!slug) {
      slug = "puntamba"
      localStorage.setItem("tenantSlug", slug)
    }
    setStatus("loading")
    api
      .get("/tenant/info")
      .then((res) => {
        setTenant(res.data)
        setStatus("ready")
        maybeRedirectBuyerLogin()
      })
      .catch(() => {
        setTenant({ name: slug.charAt(0).toUpperCase() + slug.slice(1), slug })
        setStatus("ready")
        maybeRedirectBuyerLogin()
      })
  }, [navigate])

  function onChooseTenant(slug) {
    localStorage.setItem("tenantSlug", slug)
    setStatus("loading")
    api
      .get("/tenant/info")
      .then((res) => {
        setTenant(res.data)
        setStatus("ready")
        maybeRedirectBuyerLogin()
      })
      .catch(() => {
        setTenant({ name: slug, slug })
        setStatus("ready")
        maybeRedirectBuyerLogin()
      })
  }

  function goCategory(id) {
    navigate(`/category/${id}`)
  }

  const HomePage = (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF7] via-[#FAFAF7] to-[#F0F7F0] text-[#2D2D2D]">
      {/* Header */}
<header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E8E8E0] shadow-sm">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

    {/* Logo */}
    <div
      className="flex items-center gap-3 cursor-pointer group"
      onClick={() => navigate("/")}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#8BCF58] to-[#6BA03E] text-white font-bold text-xl shadow-lg group-hover:shadow-xl transition">
        O
      </div>
      <div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-[#4A7856] to-[#8BCF58] bg-clip-text text-transparent">
          ORGANOZ
        </h1>
        <div className="text-xs text-[#4A7856]/70 font-medium">Fresh Farm Direct</div>
      </div>
    </div>

    {/* Buttons */}
    <div className="flex items-center gap-3">
      {/* Contact Us (WhatsApp) */}
      <button
        onClick={() =>
          window.open(
            "https://wa.me/918237519798?text=" +
              encodeURIComponent("Hi, I want to know more about Organoz."),
            "_blank"
          )
        }
        className="px-4 py-2 rounded-lg text-sm font-medium border border-[#4A7856]/40 text-[#4A7856] hover:bg-[#f3f8f4] transition duration-300"
      >
        Contact Us
      </button>

      {/* Customer Login */}
      <button
        onClick={() => navigate("/customer/login")}
        className="px-4 py-2 rounded-lg text-sm font-medium border border-[#4A7856] text-[#4A7856] hover:bg-[#f3f8f4] transition duration-300"
      >
        Customer Login
      </button>

      {/* Apply Button */}
      <button
        onClick={() => setApplyOpen(true)}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8BCF58] to-[#6BA03E] text-white font-semibold shadow-lg hover:shadow-xl transition duration-300"
      >
        Apply
      </button>
    </div>
  </div>
</header>


      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium bg-[#8BCF5820] text-[#4A7856] border border-[#8BCF58]/30">
              <span className="inline-block w-2 h-2 bg-[#8BCF58] rounded-full"></span>
              Trusted by 10,000+ Families
            </div>
            <h2 className="text-5xl lg:text-6xl font-black leading-tight text-[#2D2D2D]">
              Pure Food.{" "}
              <span className="bg-gradient-to-r from-[#8BCF58] to-[#4A7856] bg-clip-text text-transparent">
                Proven Source.
              </span>
              <span className="text-5xl lg:text-6xl font-black leading-tight text-[#2D2D2D]">
                              Now in_
                            </span>
                <span className="bg-gradient-to-r from-[#8BCF58] to-[#4A7856] bg-clip-text text-transparent">
                                                           Puntamba
                                                        </span>
            </h2>
            <p className="text-lg text-[#555] leading-relaxed max-w-lg">
              Direct-from-farm organic produce with full traceability, real farmers, and zero middlemen. Know exactly
              where your food comes from.
            </p>
            <div className="flex flex-wrap gap-3 items-center pt-4">
              <button
                onClick={() => navigate("/customer/register")}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#8BCF58] to-[#6BA03E] text-white font-semibold shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105"
              >
                Shop Fresh Now
              </button>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="px-6 py-3 rounded-lg border-2 border-[#8BCF58] text-[#4A7856] bg-white hover:bg-[#f7fbf6] font-semibold transition duration-300"
              >
                Learn More
              </button>
            </div>
            <div className="flex flex-wrap gap-4 pt-6">
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-md border border-[#E8E8E0]">
                <span className="text-xl">✓</span>
                <div>
                  <span className="font-bold text-[#4A7856]">100%</span>{" "}
                  <span className="text-sm text-gray-600">Chemical-free</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-md border border-[#E8E8E0]">
                <span className="text-xl">📍</span>
                <div>
                  <span className="font-bold text-[#4A7856]">GPS</span>{" "}
                  <span className="text-sm text-gray-600">Verified</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-md border border-[#E8E8E0]">
                <span className="text-xl">⭐</span>
                <div>
                  <span className="font-bold text-[#4A7856]">C-Score</span>{" "}
                  <span className="text-sm text-gray-600">Rated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Village Selector + Cards */}
          <div className="flex flex-col gap-6">
            {/* Village Selector Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-[#E8E8E0]">
              <h3 className="text-lg font-bold mb-4 text-[#2D2D2D]">Your Village</h3>
              {status === "loading" && <div className="text-sm text-gray-500 animate-pulse">Checking village...</div>}
              {status === "no-tenant" && (
                <>
                  <p className="text-sm text-gray-600 mb-3">Select your village:</p>
                  <VillageSelector onChoose={onChooseTenant} />
                </>
              )}
              {status === "ready" && tenant && (
                <>
                  <div className="mb-4 p-3 bg-[#F0F7F0] rounded-lg">
                    <div className="text-xs text-gray-500 font-medium">Current Village</div>
                    <div className="text-lg font-bold text-[#4A7856]">{tenant.name || tenant.slug}</div>
                    <div className="text-xs text-gray-400 mt-1">({tenant.slug})</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        localStorage.removeItem("tenantSlug")
                        window.location.reload()
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => navigate("/farmer/login")}
                      className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#8BCF58] to-[#6BA03E] text-white text-sm font-medium shadow-md hover:shadow-lg transition"
                    >
                      Farmer Login
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1 bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="h-48 bg-gradient-to-br from-[#8BCF58]/10 to-[#4A7856]/10 overflow-hidden">
                  <img
                    src="https://res.cloudinary.com/dhndaywnu/image/upload/v1763806359/organoz-products/691e9bde-1763806351079-858557085.jpg"
                    alt="Banana"
                    className="w-full h-full object-cover hover:scale-110 transition duration-500"
                  />
                </div>
                <div className="p-4">
                  <div className="font-bold text-[#2D2D2D]">Fresh Banana</div>
                  <div className="text-xs text-gray-500 mt-1">जाडाला पिकलेले • Hand-picked</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
                <div className="font-bold text-[#2D2D2D] text-sm mb-2">Verified Farmer</div>
                <div className="text-xs text-gray-500 mb-3">Harish Petkar • GPS confirmed</div>
                <div className="w-full h-24 rounded-lg overflow-hidden border border-[#E8E8E0]">
                  <iframe
                    title="Farm map"
                    src="https://www.google.com/maps?q=19.747939,74.608250&z=15&output=embed"
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full border-0"
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs text-gray-600">
                  <span>
                    <span className="font-bold text-[#4A7856]">92</span> C-Score
                  </span>
                  <a
                    href="https://goo.gl/maps/4otHT3Cdno7qY12h7?g_st=aw"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8BCF58] font-medium hover:underline"
                  >
                    Open Map
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
                <div className="font-bold text-[#2D2D2D] text-sm">Natural Ripening</div>
                <div className="text-xs text-gray-500 mt-1">No chemicals • No wax coating</div>
                <div className="mt-4 inline-block px-3 py-1 bg-[#8BCF58]/10 text-[#4A7856] text-xs font-bold rounded-full">
                  ✓ Verified
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#E8E8E0]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="text-sm font-bold text-[#8BCF58] uppercase tracking-wider">About Organoz</div>
            <h3 className="text-4xl font-black text-[#2D2D2D]">Rebuilding Trust Between Farms & Families</h3>
            <p className="text-lg text-gray-700 leading-relaxed">
              We connect conscious consumers to verified organic farmers using technology to prove what's on your plate
              is truly clean, local, and fair-traded.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-4 items-start">
                <div className="text-2xl">🌾</div>
                <div>
                  <div className="font-bold text-[#2D2D2D]">Real Farmer Profiles</div>
                  <div className="text-sm text-gray-600">Every product linked to verified growers</div>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="text-2xl">📍</div>
                <div>
                  <div className="font-bold text-[#2D2D2D]">GPS-Backed Farms</div>
                  <div className="text-sm text-gray-600">Location proof + harvest photos</div>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="text-2xl">💰</div>
                <div>
                  <div className="font-bold text-[#2D2D2D]">Fair Pricing</div>
                  <div className="text-sm text-gray-600">Farmers earn more, no middleman margins</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Flow Diagram */}
          <div className="bg-gradient-to-br from-[#F0F7F0] to-white p-8 rounded-2xl border border-[#8BCF58]/20">
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-md">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8BCF58] to-[#6BA03E] text-white flex items-center justify-center font-bold text-lg">
                  🚜
                </div>
                <div>
                  <div className="font-bold text-[#2D2D2D]">Farmer Grows</div>
                  <div className="text-xs text-gray-600">Verified organic</div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="text-2xl text-[#8BCF58]">↓</div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-md">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4A7856] to-[#2D5A3D] text-white flex items-center justify-center font-bold text-lg">
                  📦
                </div>
                <div>
                  <div className="font-bold text-[#2D2D2D]">Organoz Delivers</div>
                  <div className="text-xs text-gray-600">Same day, fresh supply</div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="text-2xl text-[#8BCF58]">↓</div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-md">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FFF27C] to-[#FFE44D] text-[#2D2D2D] flex items-center justify-center font-bold text-lg">
                  👨‍👩‍👧
                </div>
                <div>
                  <div className="font-bold text-[#2D2D2D]">You Enjoy Fresh</div>
                  <div className="text-xs text-gray-600">Traceable quality</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="text-sm font-bold text-[#8BCF58] uppercase tracking-wider mb-2">Why Choose Us</div>
          <h3 className="text-4xl font-black text-[#2D2D2D]">Experience the Organoz Difference</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "👁️", title: "Total Transparency", desc: "Farm photos, C-Score™, real-time harvest data" },
            { icon: "✨", title: "Peak Freshness", desc: "Short routes = crunchier veggies & juicier fruits" },
            { icon: "🤝", title: "Farmer-First", desc: "Fair prices & direct support to growers" },
            { icon: "🛡️", title: "Safe & Certified", desc: "Verified checks & continuous monitoring" },
          ].map((benefit, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-md border border-[#E8E8E0] hover:shadow-lg hover:-translate-y-1 transition duration-300"
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h4 className="font-bold text-[#2D2D2D] mb-2">{benefit.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[#E8E8E0]">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="text-sm font-bold text-[#8BCF58] uppercase tracking-wider mb-2">Shop</div>
            <h3 className="text-4xl font-black text-[#2D2D2D]">Organic Essentials</h3>
          </div>
          <button className="text-[#8BCF58] font-bold hover:text-[#6BA03E] transition">View all →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { id: "vegetables", emoji: "🥬", name: "Vegetables", desc: "Fresh & Seasonal" },
            { id: "fruits", emoji: "🍎", name: "Fruits", desc: "Naturally Sweet" },
            { id: "dairy", emoji: "🥛", name: "Dairy", desc: "Farm Fresh" },
            { id: "grains", emoji: "🌾", name: "Grains", desc: "Stone Milled" },
            { id: "oils", emoji: "🫒", name: "Oils", desc: "Cold Pressed" },
            { id: "more", emoji: "✨", name: "More", desc: "Coming Soon" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => goCategory(cat.id)}
              className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition duration-300 border border-[#E8E8E0]"
            >
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <div className="font-bold text-sm text-[#2D2D2D]">{cat.name}</div>
              <div className="text-xs text-gray-500 mt-1">{cat.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-[#8BCF58] to-[#6BA03E] rounded-3xl py-16 px-8 text-center text-white shadow-2xl">
          <h3 className="text-4xl font-black mb-3">Ready to Taste Verified Organic?</h3>
          <p className="text-lg opacity-95 max-w-2xl mx-auto mb-8">
            Join thousands of families getting traceable, farmer-powered food at their doorstep.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate("/customer/register")}
              className="px-8 py-3 rounded-lg bg-white text-[#4A7856] font-bold shadow-lg hover:shadow-xl hover:scale-105 transition duration-300"
            >
              Start Shopping Now
            </button>
            <button
              onClick={() => navigate("/apply")}
              className="px-8 py-3 rounded-lg border-2 border-white text-white font-bold hover:bg-white/10 transition duration-300"
            >
              Become Partner Farmer
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2D2D2D] text-white py-8 border-t border-[#E8E8E0]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm opacity-75">
            © {new Date().getFullYear()} ORGANOZ — Fresh Farm Direct • Farmer First Movement
          </p>
        </div>
      </footer>

      <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} />
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={HomePage} />
      <Route path="/farmer/apply" element={<FarmerApply />} />
      <Route path="/apply" element={<FarmerApply />} />
      <Route path="/farmer/login" element={<FarmerLogin />} />
      <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer/register" element={<CustomerRegister />} />
      <Route path="/customer/dashboard" element={<CustomerDashboard />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
    </Routes>
  )
}
