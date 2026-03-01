"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import SwipeCard from "./SwipeCard";

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
  const router = useRouter();
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const handleSwipe = async (cardId: string, direction: "left" | "right") => {
    const interactionType = direction === "right" ? "like" : "view";

    // Record interaction
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: cardId,
        interaction_type: interactionType,
      }),
    });

    // Move to next card
    setCurrentIndex((prev) => prev + 1);
  };

  const handleAction = async (cardId: string, action: "bookmark" | "complete") => {
    // Record interaction
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: cardId,
        interaction_type: action,
      }),
    });

    // Move to next card
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
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

  const currentCard = cards[currentIndex];
  const hasMoreCards = currentIndex < cards.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AccioAI</h1>
            <p className="text-xs text-gray-500">
              {currentIndex} of {cards.length} cards
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="relative h-[calc(100vh-80px)]">
        {!hasMoreCards ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900">You&apos;re all caught up!</h2>
              <p className="text-gray-600">New content will be available tomorrow.</p>
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  fetchFeed();
                }}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh Feed
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentCard && (
              <SwipeCard
                key={currentCard.id}
                card={currentCard}
                onSwipe={handleSwipe}
                onAction={handleAction}
              />
            )}
            
            {/* Swipe Instructions */}
            {currentIndex === 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-full text-sm backdrop-blur-sm">
                👈 Swipe left to skip • Swipe right to like 👉
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
