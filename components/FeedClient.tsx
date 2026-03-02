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
  const [totalCards, setTotalCards] = useState(0); // Track initial total
  const [viewedCount, setViewedCount] = useState(0); // Track how many viewed
  const [newCardsToday, setNewCardsToday] = useState(0); // Track new cards added today
  const [currentStreak, setCurrentStreak] = useState(0); // Track streak
  const [showCelebration, setShowCelebration] = useState(false); // Celebration animation

  useEffect(() => {
    fetchFeed();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.success) {
        setCurrentStreak(data.data.currentStreak);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch("/api/feed?limit=20");
      const data = await res.json();

      if (data.success) {
        setCards(data.data.cards);
        setTotalCards(data.data.cards.length); // Store initial count
        
        // Count cards added today
        const today = new Date().toDateString();
        const todayCards = data.data.cards.filter((card: ContentCard) => 
          new Date(card.created_at).toDateString() === today
        );
        setNewCardsToday(todayCards.length);
      } else {
        setError(data.error?.message || "Failed to load feed");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Trigger automation to fetch new content
      const automationRes = await fetch("/api/automation/run", {
        method: "POST",
      });
      
      if (automationRes.ok) {
        // Wait a bit for processing
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Fetch updated feed
      await fetchFeed();
      setCurrentIndex(0);
      setViewedCount(0); // Reset counter on refresh
    } catch {
      setError("Failed to refresh feed");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (cardId: string, direction: "left" | "right") => {
    const interactionType = direction === "right" ? "like" : "view";

    console.log("Recording interaction:", { cardId, interactionType, direction });

    try {
      // Record interaction and wait for response
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: cardId,
          interaction_type: interactionType,
        }),
      });

      const data = await res.json();
      console.log("Interaction response:", data);

      if (!res.ok) {
        console.error("Failed to record interaction:", data);
      } else {
        console.log("✅ Interaction saved successfully");
        // Remove the card from local state
        // Don't increment index - removing card shifts array, so same index shows next card
        setCards(prev => {
          const newCards = prev.filter(card => card.id !== cardId);
          // Show celebration if this was the last card
          if (newCards.length === 0 && prev.length > 0) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
          }
          return newCards;
        });
        setViewedCount(prev => prev + 1); // Increment viewed count
      }
    } catch (error) {
      console.error("Error recording interaction:", error);
      // Still move forward on error
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleAction = async (cardId: string, action: "bookmark" | "complete") => {
    try {
      // Record interaction and wait for response
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: cardId,
          interaction_type: action,
        }),
      });

      if (!res.ok) {
        console.error("Failed to record action:", await res.text());
      } else {
        // Remove the card from local state
        // Don't increment index - array shifts automatically
        setCards(prev => {
          const newCards = prev.filter(card => card.id !== cardId);
          // Show celebration if this was the last card
          if (newCards.length === 0 && prev.length > 0) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
          }
          return newCards;
        });
        setViewedCount(prev => prev + 1); // Increment viewed count
      }
    } catch (error) {
      console.error("Error recording action:", error);
      // Still move forward on error
      setCurrentIndex((prev) => prev + 1);
    }
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-orange-500 bg-clip-text text-transparent">
              AccioAI
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{hasMoreCards ? `${viewedCount + 1} of ${totalCards}` : "All done!"}</span>
              {newCardsToday > 0 && (
                <span className="text-green-600 font-medium">• {newCardsToday} new today</span>
              )}
              {currentStreak > 0 && (
                <span className="text-orange-600 font-medium">• 🔥 {currentStreak} day streak</span>
              )}
            </div>
            {/* Progress bar */}
            {totalCards > 0 && (
              <div className="mt-2 w-full max-w-xs bg-slate-200 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-orange-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(viewedCount / totalCards) * 100}%` }}
                />
              </div>
            )}
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

      <main className="relative h-[calc(100vh-80px)] overflow-hidden">
        {!hasMoreCards ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md">
              {showCelebration && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="text-6xl animate-bounce">🎉</div>
                  <div className="text-6xl animate-bounce delay-100" style={{ animationDelay: '0.1s' }}>✨</div>
                  <div className="text-6xl animate-bounce delay-200" style={{ animationDelay: '0.2s' }}>🎊</div>
                </div>
              )}
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-orange-500 bg-clip-text text-transparent">
                You&apos;re All Caught Up!
              </h2>
              <p className="text-slate-600 text-lg">
                {viewedCount === 0 
                  ? "No content matches your interests yet. Try refreshing to fetch new content!"
                  : `You've reviewed ${viewedCount} card${viewedCount === 1 ? '' : 's'} today. New personalized content arrives daily at midnight.`}
              </p>
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-orange-500 text-white rounded-lg hover:from-indigo-700 hover:to-orange-600 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Fetching new content..." : "🔄 Refresh Feed"}
                </button>
                <a
                  href="/saved"
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                >
                  📚 View Saved Items
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            {/* Stack of cards - show next 2 cards behind current */}
            {[2, 1, 0].map((offset) => {
              const cardIndex = currentIndex + offset;
              const cardData = cards[cardIndex];
              
              if (!cardData) return null;
              
              const isCurrentCard = offset === 0;
              const scale = 1 - (offset * 0.05);
              const translateY = offset * 20;
              const zIndex = 10 - offset;
              
              return (
                <div
                  key={cardData.id}
                  className="absolute inset-0"
                  style={{
                    transform: `scale(${scale}) translateY(${translateY}px)`,
                    zIndex,
                    pointerEvents: isCurrentCard ? 'auto' : 'none',
                    opacity: isCurrentCard ? 1 : 0.5,
                  }}
                >
                  {isCurrentCard && (
                    <SwipeCard
                      card={cardData}
                      onSwipe={handleSwipe}
                      onAction={handleAction}
                      onClick={() => setSelectedCard(cardData)}
                    />
                  )}
                  {!isCurrentCard && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl h-[600px] border border-slate-200"></div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {selectedCard && (
              <CardDetailModal
                card={selectedCard}
                onClose={() => setSelectedCard(null)}
              />
            )}
            
            {/* Swipe Instructions */}
            {currentIndex === 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-6 py-3 rounded-full text-sm backdrop-blur-sm shadow-lg z-50">
                👈 Swipe left to skip • Swipe right to like 👉 • Tap to expand
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
