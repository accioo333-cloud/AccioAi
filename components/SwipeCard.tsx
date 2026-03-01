"use client";

import { useState } from "react";

interface ContentCard {
  id: string;
  title: string;
  content: string;
  category: string;
  difficulty_level: string;
  estimated_time_minutes: number;
  image_url?: string;
  source_url?: string;
}

interface SwipeCardProps {
  card: ContentCard;
  onSwipe: (cardId: string, direction: "left" | "right") => void;
  onAction: (cardId: string, action: "bookmark" | "complete") => void;
  onClick?: () => void;
}

export default function SwipeCard({ card, onSwipe, onAction, onClick }: SwipeCardProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = (clientX: number) => {
    setStartX(clientX);
    setCurrentX(clientX);
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    setCurrentX(clientX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const diff = currentX - startX;
    const threshold = 100;

    if (Math.abs(diff) > threshold) {
      const direction = diff > 0 ? "right" : "left";
      onSwipe(card.id, direction);
    }

    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  const offset = isDragging ? currentX - startX : 0;
  const rotation = offset / 20;
  const opacity = 1 - Math.abs(offset) / 300;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-4"
      style={{
        transform: `translateX(${offset}px) rotate(${rotation}deg)`,
        opacity,
        transition: isDragging ? "none" : "all 0.3s ease-out",
      }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-slate-200"
        onClick={onClick}
      >
        {/* Card Image */}
        {card.image_url && (
          <div className="relative h-48 bg-slate-100 overflow-hidden">
            <img 
              src={card.image_url} 
              alt={card.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Card Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl font-bold flex-1 leading-tight">
              {card.title}
            </h2>
            <span className="ml-3 px-3 py-1 bg-white/20 backdrop-blur-sm text-xs font-semibold rounded-full uppercase tracking-wide">
              {card.category}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm opacity-90">
            <span className="capitalize font-medium">{card.difficulty_level}</span>
            <span>•</span>
            <span>{card.estimated_time_minutes} min read</span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6 max-h-96 overflow-y-auto bg-slate-50">
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
            {card.content}
          </div>
        </div>

        {/* Card Actions */}
        <div className="p-6 bg-white border-t border-slate-200 space-y-3">
          {card.source_url && (
            <a
              href={card.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-3 bg-slate-700 text-white text-center rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 Read Full Article
            </a>
          )}
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(card.id, "bookmark");
              }}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              📚 Read Later
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(card.id, "complete");
              }}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
            >
              ✓ Done
            </button>
          </div>
        </div>

        {/* Swipe Indicators */}
        {isDragging && (
          <>
            {offset > 50 && (
              <div className="absolute top-1/2 left-8 -translate-y-1/2 text-6xl opacity-50">
                👍
              </div>
            )}
            {offset < -50 && (
              <div className="absolute top-1/2 right-8 -translate-y-1/2 text-6xl opacity-50">
                👎
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
