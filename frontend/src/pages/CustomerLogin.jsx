import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function CustomerLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    if (!phone || !password) {
      return alert("Please enter phone and password");
    }
    setBusy(true);
    try {
      const tenantSlug = localStorage.getItem("tenantSlug");
      const res = await api.post(
        "/users/login",
        { phone, password, tenantSlug },
        { headers: { "x-tenant-slug": tenantSlug } }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const role = res.data.user?.role || "buyer";

      if (role === "farmer") navigate("/farmer/dashboard", { replace: true });
      else navigate("/customer/dashboard", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Login failed";
      alert("Login error: " + msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#8BCF5820] p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#8BCF58] to-[#6BA840] text-white text-2xl font-extrabold shadow-md">
            O
          </div>
          <h2 className="text-3xl font-black mt-2 text-[#2D2D2D]">ORGANOZ</h2>
          <p className="text-sm text-[#4A7856] font-medium">
            Freshness-First Organic Marketplace
          </p>
        </div>

        {/* Form Title */}
        <h3 className="text-xl font-bold text-[#2D2D2D] mb-6 text-center">
          Customer Login
        </h3>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#8BCF58] outline-none transition"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#8BCF58] outline-none transition"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center text-sm">
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#8BCF58] to-[#6BA840] text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>

            <a
              href="/customer/forgot-password"
              className="text-[#4A7856] font-semibold hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </form>

        {/* Register */}
        <div className="mt-6 text-center text-sm">
          <span className="text-[#2D2D2D]">Don't have an account?</span>{" "}
          <a
            href="/customer/register"
            className="text-[#8BCF58] font-bold hover:underline"
          >
            Register
          </a>
        </div>

        {/* Tenant Info */}
        <div className="mt-6 text-center text-xs text-gray-500">
          Tenant selected:{" "}
          <span className="font-semibold text-[#4A7856]">
            {localStorage.getItem("tenantSlug") || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
