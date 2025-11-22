import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function FarmerLogin() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tenantSlug = localStorage.getItem("tenantSlug");

      if (!tenantSlug) {
        setError("Tenant missing. Please select village first.");
        setLoading(false);
        return;
      }

      const res = await api.post("/users/login", {
        phone,
        password,
        tenantSlug,
      });

      // IMPORTANT — SAVE EXACTLY WHAT BACKEND RETURNS
      localStorage.setItem("authToken", res.data.token);
      localStorage.setItem("authUser", JSON.stringify(res.data.user));
      localStorage.setItem("tenantSlug", tenantSlug);

      // Set headers globally for next requests
      api.defaults.headers.common["Authorization"] = "Bearer " + res.data.token;
      api.defaults.headers.common["x-tenant-slug"] = tenantSlug;

      navigate("/farmer/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Login failed"
      );
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#8BCF5820] p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#8BCF58] to-[#6BA840] text-white text-2xl font-extrabold shadow-md">
            F
          </div>
          <h2 className="text-2xl font-black mt-3 text-[#2D2D2D]">Farmer Login</h2>
          <p className="text-sm text-gray-600 mt-1">Use your registered phone number</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-[#FFEDED] border border-[#F5C2C2] px-4 py-3 text-sm text-[#B00020]">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#8BCF58] outline-none transition"
              placeholder="Enter mobile number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#8BCF58] outline-none transition"
              placeholder="Enter password"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#8BCF58] to-[#6BA840] text-white font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <a
              href="/farmer/forgot-password"
              className="text-[#4A7856] font-semibold hover:underline"
            >
              Forgot?
            </a>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Tenant: <span className="font-semibold text-[#4A7856]">{localStorage.getItem("tenantSlug") || "—"}</span>
        </div>
      </div>
    </div>
  );
}
