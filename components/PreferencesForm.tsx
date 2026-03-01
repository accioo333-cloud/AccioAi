"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PROFESSIONS = [
  "Developer",
  "Designer",
  "Product Manager",
  "Marketer",
  "Entrepreneur",
  "Student",
  "Other"
];

const CATEGORIES = [
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "science", label: "Science" },
  { id: "ai_ml", label: "AI/ML" },
  { id: "design", label: "Design" },
  { id: "startups", label: "Startups" },
  { id: "finance", label: "Finance" },
  { id: "health", label: "Health" },
];

export default function PreferencesForm() {
  const router = useRouter();
  const [profession, setProfession] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleCategory = (categoryId: string) => {
    setCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (categories.length === 0) {
      setError("Please select at least one interest");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profession, content_categories: categories }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/feed");
      } else {
        setError(data.error?.message || "Failed to save preferences");
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
          Personalize Your Feed
        </h2>
        <p className="text-slate-600 text-sm">Tell us what you're interested in</p>
      </div>

      {/* Profession */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          What do you do?
        </label>
        <select
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          required
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
        >
          <option value="">Select your profession</option>
          {PROFESSIONS.map(prof => (
            <option key={prof} value={prof}>{prof}</option>
          ))}
        </select>
      </div>

      {/* Content Categories */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          What interests you? <span className="text-slate-500">(Select multiple)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`p-3 rounded-lg border-2 transition font-medium text-sm ${
                categories.includes(cat.id)
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

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
        {loading ? "Saving..." : "Continue to Feed"}
      </button>
    </form>
  );
}
