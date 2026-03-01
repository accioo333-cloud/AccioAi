"use client";

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

interface CardDetailModalProps {
  card: ContentCard;
  onClose: () => void;
}

export default function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-3xl font-bold flex-1 leading-tight pr-4">
              {card.title}
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full font-semibold uppercase tracking-wide">
              {card.category}
            </span>
            <span className="capitalize">{card.difficulty_level}</span>
            <span>•</span>
            <span>{card.estimated_time_minutes} min read</span>
          </div>
        </div>

        {/* Image */}
        {card.image_url && (
          <div className="relative h-64 bg-slate-100">
            <img 
              src={card.image_url} 
              alt={card.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          <div className="prose prose-lg max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
            {card.content}
          </div>
        </div>

        {/* Actions */}
        {card.source_url && (
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <a
              href={card.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-4 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-sm"
            >
              🔗 Read Full Article
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
