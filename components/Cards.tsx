import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '../define';

interface CardProps {
  card?: CardType;
  hidden?: boolean;
  className?: string;
  isDealing?: boolean;
  dealDelay?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CardView: React.FC<CardProps> = ({ 
  card, 
  hidden, 
  className = '', 
  isDealing = false, 
  dealDelay = 0,
  size = 'md'
}) => {
  const suitColor = card && (card.suit === 'hearts' || card.suit === 'diamonds') ? 'text-red-600' : 'text-gray-900';
  
  const suitIcon = card ? (
    card.suit === 'spades' ? '♠' : 
    card.suit === 'hearts' ? '♥' : 
    card.suit === 'clubs' ? '♣' : '♦'
  ) : '';

  const rankDisplay = card ? (
    card.rank === 11 ? 'J' :
    card.rank === 12 ? 'Q' :
    card.rank === 13 ? 'K' :
    card.rank === 14 ? 'A' :
    String(card.rank)
  ) : '';

  const sizeClasses = {
    sm: 'w-10 h-14 text-xs',
    md: 'w-16 h-24 text-sm',
    lg: 'w-20 h-30 text-base',
    xl: 'w-28 h-40 text-lg'
  };

  const dealAnimation = {
    hidden: { opacity: 0, y: -80, rotate: -10, scale: 0.8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotate: 0, 
      scale: 1,
      transition: { 
        duration: 0.4, 
        delay: dealDelay,
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} relative ${className}`}
      variants={isDealing ? dealAnimation : undefined}
      initial={isDealing ? 'hidden' : undefined}
      animate={isDealing ? 'visible' : undefined}
      whileHover={!hidden && card ? { y: -6, scale: 1.05 } : {}}
      transition={{ duration: 0.2 }}
    >
      {hidden || !card ? (
        <div className="w-full h-full rounded-lg relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950"></div>
          
          <div className="absolute inset-1 rounded-md bg-gradient-to-br from-blue-800/50 to-blue-950/50"></div>
          
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 100 140" className="w-full h-full">
              <defs>
                <pattern id="cardBackGrid" patternUnits="userSpaceOnUse" width="20" height="20">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="140" fill="url(#cardBackGrid)"/>
            </svg>
          </div>
          
          <div className="absolute inset-2 rounded bg-gradient-to-br from-blue-800/30 to-transparent"></div>
          
          <div className="absolute top-1 left-1 w-4 h-4 rounded-full border border-blue-400/50 flex items-center justify-center">
            <span className="text-blue-300 text-[6px]">🎰</span>
          </div>
          
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border border-blue-400/50 flex items-center justify-center rotate-180">
            <span className="text-blue-300 text-[6px]">🎰</span>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-12 border-2 border-blue-400/40 rounded-lg flex items-center justify-center">
              <span className="text-blue-400/60 text-lg font-bold">?</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full rounded-lg bg-white shadow-xl relative overflow-hidden border border-gray-200">
          <div className="absolute top-0.5 left-0.5 flex flex-col items-center leading-none">
            <span className={`font-bold ${suitColor} ${size === 'sm' ? 'text-[8px]' : 'text-xs'}`}>{rankDisplay}</span>
            <span className={suitColor}>{suitIcon}</span>
          </div>
          
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${suitColor}`}>
            <span className={`font-bold ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-xl'}`}>{rankDisplay}</span>
            <span className={`${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'} ${suitColor}`}>{suitIcon}</span>
          </div>
          
          <div className="absolute bottom-0.5 right-0.5 flex flex-col items-center leading-none rotate-180">
            <span className={`font-bold ${suitColor} ${size === 'sm' ? 'text-[8px]' : 'text-xs'}`}>{rankDisplay}</span>
            <span className={suitColor}>{suitIcon}</span>
          </div>

          {card.suit === 'hearts' && (
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-transparent pointer-events-none"></div>
          )}
          {card.suit === 'diamonds' && (
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 to-transparent pointer-events-none"></div>
          )}
          {card.suit === 'spades' && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-transparent pointer-events-none"></div>
          )}
          {card.suit === 'clubs' && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/20 to-transparent pointer-events-none"></div>
          )}
        </div>
      )}
    </motion.div>
  );
};
