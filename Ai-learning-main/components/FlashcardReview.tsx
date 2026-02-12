import React, { useState } from 'react';
import { Flashcard } from '../types';

interface FlashcardReviewProps {
  cards: Flashcard[];
  subtopicTitle: string;
  onClose: () => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ cards, subtopicTitle, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center text-white mb-6">
          <div>
            <h2 className="text-2xl font-bold">{subtopicTitle}</h2>
            <p className="text-slate-300 text-sm">Flashcards</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        {/* Card Container */}
        <div className="perspective-1000 relative h-80 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div 
                className={`w-full h-full relative transition-all duration-500 transform-style-3d shadow-2xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}
                style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                {/* Front */}
                <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Front</span>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{currentCard.front}</div>
                    <div className="absolute bottom-6 text-slate-400 text-xs flex items-center gap-1">
                        <span>Click to flip</span> ⟳
                    </div>
                </div>

                {/* Back */}
                <div 
                    className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-8 flex flex-col items-center justify-center text-center backface-hidden"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-4">Back</span>
                    <div className="text-xl font-medium leading-relaxed">{currentCard.back}</div>
                    <div className="absolute bottom-6 text-indigo-200 text-xs flex items-center gap-1">
                         Click to flip back
                    </div>
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-between">
            <div className="text-white font-medium">
                {currentIndex + 1} <span className="text-slate-400">/ {cards.length}</span>
            </div>
            
            <div className="flex gap-4">
                <button 
                    onClick={handlePrev} 
                    disabled={currentIndex === 0}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                    Previous
                </button>
                <button 
                    onClick={handleNext} 
                    disabled={currentIndex === cards.length - 1}
                    className="bg-primary hover:bg-primary/80 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                    Next Card
                </button>
            </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

      </div>
    </div>
  );
};