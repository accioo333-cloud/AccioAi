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
        window.location.href = "/";
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Complete Your Profile</h2>
      
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full Name"
        className="w-full p-3 border border-gray-300 rounded-lg"
        required
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Saving..." : "Complete Onboarding"}
      </button>
    </form>
  );
}
