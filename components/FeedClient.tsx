"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import SwipeCard from "./SwipeCard";
import CardDetailModal from "./CardDetailModal";

interface ContentCard {
  id: string;
  title: string;
  content: string;
  category: string;
  difficulty_level: string;
  estimated_time_minutes: number;
  image_url?: string;
  source_url?: string;
  created_at: string;
}

export default function FeedClient() {
  const router = useRouter();
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading your personalized feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900">Something went wrong</h2>
          <p className="text-slate-600">{error}</p>
          <button
            onClick={handleSignOut}
            className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-orange-50">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-orange-500 bg-clip-text text-transparent">
              AccioAI
            </h1>
            <p className="text-xs text-slate-500">
              {hasMoreCards ? `${currentIndex + 1} of ${cards.length}` : "All done!"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/saved" 
              className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-orange-500 text-white rounded-lg hover:from-indigo-700 hover:to-orange-600 transition shadow-sm font-medium"
            >
              📚 Saved
            </a>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="relative h-[calc(100vh-80px)]">
        {!hasMoreCards ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md">
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-orange-500 bg-clip-text text-transparent">
                You&apos;re All Caught Up!
              </h2>
              <p className="text-slate-600 text-lg">
                {cards.length === 0 
                  ? "No content matches your interests yet. Check back tomorrow!"
                  : "Great job! New personalized content arrives daily at midnight."}
              </p>
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  fetchFeed();
                }}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-orange-500 text-white rounded-lg hover:from-indigo-700 hover:to-orange-600 transition font-medium shadow-md"
              >
                Refresh Feed
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentCard && (
              <>
                <SwipeCard
                  key={currentCard.id}
                  card={currentCard}
                  onSwipe={handleSwipe}
                  onAction={handleAction}
                  onClick={() => setSelectedCard(currentCard)}
                />
                
                {selectedCard && (
                  <CardDetailModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                  />
                )}
              </>
            )}
            
            {/* Swipe Instructions */}
            {currentIndex === 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-6 py-3 rounded-full text-sm backdrop-blur-sm shadow-lg">
                👈 Swipe left to skip • Swipe right to like 👉 • Tap to expand
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
