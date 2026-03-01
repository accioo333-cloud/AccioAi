"use client";

import { useState } from "react";

export default function OnboardingForm() {
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to preferences page
        window.location.href = "/onboarding/preferences";
      } else {
        setError(data.error?.message || "Failed to complete onboarding");
      }
    } catch {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-orange-500 bg-clip-text text-transparent">
          Welcome to AccioAI
        </h2>
        <p className="text-slate-600 text-sm">Let's personalize your experience</p>
      </div>
      
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full Name"
        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
        required
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-orange-500 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-orange-600 transition font-medium shadow-md hover:shadow-lg disabled:bg-slate-400"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
