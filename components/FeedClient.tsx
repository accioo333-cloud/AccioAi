"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

interface ContentCard {
  id: string;
  title: string;
  content: string;
  category: string;
  difficulty_level: string;
  estimated_time_minutes: number;
  created_at: string;
}

export default function FeedClient() {
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await fetch("/api/feed?limit=20");
      const data = await res.json();

      if (data.success) {
        setCards(data.data.cards);
      } else {
        setError(data.error?.message || "Failed to load feed");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading your feed...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AccioAI</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {cards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No content available yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              Content will appear here once the automation runs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold text-gray-900 flex-1">
                    {card.title}
                  </h2>
                  <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {card.category}
                  </span>
                </div>
                
                <div className="prose prose-sm max-w-none text-gray-700 mb-4">
                  {card.content}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="capitalize">{card.difficulty_level}</span>
                  <span>•</span>
                  <span>{card.estimated_time_minutes} min read</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
