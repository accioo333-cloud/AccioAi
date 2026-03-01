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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading saved cards...</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">📚</div>
          <h2 className="text-2xl font-bold text-gray-900">No saved cards</h2>
          <p className="text-gray-600">Cards you bookmark will appear here</p>
          <a href="/feed" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Back to Feed
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Read Later ({cards.length})</h1>
          <a href="/feed" className="text-blue-600 hover:text-blue-700">← Back to Feed</a>
        </div>

        <div className="space-y-4">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{card.title}</h3>
                <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {card.category}
                </span>
              </div>
              
              <div className="text-gray-700 text-sm whitespace-pre-wrap">{card.content}</div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="capitalize">{card.difficulty_level}</span>
                  <span>•</span>
                  <span>{card.estimated_time_minutes} min read</span>
                </div>
                
                <button
                  onClick={() => handleRemove(card.id)}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
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
