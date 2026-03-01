"use client";

import { useState, useEffect } from "react";
import SwipeCard from "./SwipeCard";

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

export default function SavedClient() {
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/saved");
      const data = await res.json();
      
      if (data.success) {
        setCards(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch saved cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (cardId: string) => {
    // Remove from saved
    await fetch("/api/interactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card_id: cardId, interaction_type: "bookmark" }),
    });
    
    setCards(cards.filter(c => c.id !== cardId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading saved cards...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-orange-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-7xl">📚</div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-orange-500 bg-clip-text text-transparent">
            No Saved Cards Yet
          </h2>
          <p className="text-slate-600 text-lg">
            Bookmark cards from your feed to read them later
          </p>
          <a 
            href="/feed" 
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-orange-500 text-white rounded-lg hover:from-indigo-700 hover:to-orange-600 transition font-medium shadow-md"
          >
            Back to Feed
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow-sm p-4 border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-orange-500 bg-clip-text text-transparent">
              Read Later
            </h1>
            <p className="text-sm text-slate-500">{cards.length} saved {cards.length === 1 ? 'card' : 'cards'}</p>
          </div>
          <a 
            href="/feed" 
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            ← Back to Feed
          </a>
        </div>

        <div className="space-y-4">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-slate-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-slate-900 flex-1">{card.title}</h3>
                <span className="ml-3 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  {card.category}
                </span>
              </div>
              
              {card.image_url && (
                <img 
                  src={card.image_url} 
                  alt={card.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              
              <div className="text-slate-700 text-sm line-clamp-3">{card.content}</div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="capitalize">{card.difficulty_level}</span>
                  <span>•</span>
                  <span>{card.estimated_time_minutes} min read</span>
                </div>
                
                <button
                  onClick={() => handleRemove(card.id)}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
