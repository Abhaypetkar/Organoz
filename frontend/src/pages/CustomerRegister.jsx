import React, { useState } from "react";
import api from "../services/api";

export default function CustomerRegister() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!name || !phone) {
      alert("Name and phone are required");
      return false;
    }
    if (!password || password.length < 6) {
      alert("Password required (min 6 chars)");
      return false;
    }
    if (password !== confirm) {
      alert("Password and confirm password do not match");
      return false;
    }
    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const tenantSlug = localStorage.getItem("tenantSlug");

      const payload = {
        name,
        phone,
        email,
        role: "buyer",
        password,
      };

      await api.post("/users/register", payload, {
        headers: { "x-tenant-slug": tenantSlug },
      });

      alert("Registered successfully. You can now login.");
      window.location.href = "/customer/login";
    } catch (err) {
      alert("Register error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
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

        {/* Title */}
        <h3 className="text-xl font-bold text-[#2D2D2D] mb-6 text-center">
          Create Your Account
        </h3>

        <form onSubmit={onSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Full Name</label>
            <input
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#8BCF58] outline-none transition"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Phone Number</label>
            <input
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#8BCF58] outline-none transition"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Email (optional)</label>
            <input
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#8BCF58] outline-none transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#8BCF58] outline-none transition"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#8BCF58] outline-none transition"
              required
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8BCF58] to-[#6BA840] text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Login Redirect */}
        <div className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <a href="/customer/login" className="text-[#8BCF58] font-bold hover:underline">
            Login
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
