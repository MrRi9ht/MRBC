import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { CardView } from './Cards';

interface PlayerSeatProps {
  index: number;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({ index }) => {
  const { players, dealerIndex, smallBlindIndex, bigBlindIndex, currentActorIndex, phase } = useGameStore();
  const player = players.find(p => p.seatIndex === index);
  
  if (!player) return null;

  const isActive = currentActorIndex === index;
  const isHero = index === 0;
  const showCards = isHero || phase === 'showdown' || phase === 'complete';
  const isSB = smallBlindIndex === index;
  const isBB = bigBlindIndex === index;

  const getPositions = (totalPlayers: number) => {
    if (totalPlayers === 2) {
      return [
        { bottom: '-14rem', left: '50%', transform: 'translateX(-50%)' },
        { top: '-8rem', left: '50%', transform: 'translateX(-50%)' },
      ];
    } else if (totalPlayers === 3) {
      return [
        { bottom: '-14rem', left: '50%', transform: 'translateX(-50%)' },
        { top: '-6rem', left: '25%', transform: 'translateX(-50%)' },
        { top: '-6rem', right: '25%', transform: 'translateX(50%)' },
      ];
    } else if (totalPlayers === 4) {
      return [
        { bottom: '-14rem', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '15%', left: '-10rem' },
        { top: '15%', left: '-10rem' },
        { top: '-6rem', left: '50%', transform: 'translateX(-50%)' },
      ];
    } else if (totalPlayers === 5) {
      return [
        { bottom: '-14rem', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '20%', left: '-10rem' },
        { top: '20%', left: '-10rem' },
        { top: '-6rem', left: '50%', transform: 'translateX(-50%)' },
        { top: '20%', right: '-10rem' },
      ];
    } else if (totalPlayers === 6) {
      return [
        { bottom: '-14rem', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '20%', left: '-10rem' },
        { top: '20%', left: '-10rem' },
        { top: '-6rem', left: '30%', transform: 'translateX(-50%)' },
        { top: '-6rem', right: '30%', transform: 'translateX(50%)' },
        { top: '20%', right: '-10rem' },
      ];
    } else if (totalPlayers === 7) {
      return [
        { bottom: '-14rem', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '25%', left: '-12rem' },
        { top: '25%', left: '-12rem' },
        { top: '-6rem', left: '20%', transform: 'translateX(-50%)' },
        { top: '-6rem', left: '50%', transform: 'translateX(-50%)' },
        { top: '-6rem', right: '20%', transform: 'translateX(50%)' },
        { top: '25%', right: '-12rem' },
      ];
    } else {
      return [
        { bottom: '-14rem', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '25%', left: '-12rem' },
        { top: '25%', left: '-12rem' },
        { top: '-6rem', left: '15%', transform: 'translateX(-50%)' },
        { top: '-6rem', left: '38%', transform: 'translateX(-50%)' },
        { top: '-6rem', right: '38%', transform: 'translateX(50%)' },
        { top: '-6rem', right: '15%', transform: 'translateX(50%)' },
        { top: '25%', right: '-12rem' },
        { bottom: '25%', right: '-12rem' },
      ];
    }
  };

  const positions = getPositions(players.length);

  return (
    <motion.div
      className={`absolute flex flex-col items-center z-10 ${player.isFolded ? 'opacity-50' : 'opacity-100'}`}
      style={positions[index]}
      animate={{
        scale: isActive ? 1.1 : 1,
        y: isActive ? -10 : 0,
      }}
      transition={{ duration: 0.3 }}
    >
      {dealerIndex === index && (
        <motion.div
          className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black rounded-full flex items-center justify-center text-sm font-bold border-2 border-yellow-700 shadow-lg z-20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          D
        </motion.div>
      )}

      {isSB && (
        <motion.div
          className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-red-700 shadow-lg z-20"
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          SB
        </motion.div>
      )}

      {isBB && (
        <motion.div
          className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-blue-700 shadow-lg z-20"
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          BB
        </motion.div>
      )}

      {isActive && (
        <motion.div
          className="absolute -inset-2 rounded-xl border-2 border-yellow-400/50 bg-yellow-400/10"
          animate={{ 
            boxShadow: ['0 0 10px rgba(255, 215, 0, 0.3)', '0 0 20px rgba(255, 215, 0, 0.6)', '0 0 10px rgba(255, 215, 0, 0.3)']
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <motion.div 
        className={`flex flex-col items-center p-3 rounded-xl backdrop-blur-sm min-w-[120px] ${
          isHero 
            ? 'bg-gradient-to-br from-blue-900/90 to-blue-950/90 border-2 border-blue-500/50' 
            : 'bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-2 border-gray-600/50'
        }`}
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center text-2xl shadow-lg ${
          isHero 
            ? 'bg-gradient-to-br from-blue-500 to-blue-700' 
            : 'bg-gradient-to-br from-gray-600 to-gray-800'
        }`}>
          {isHero ? '👤' : '🤖'}
        </div>
        
        <span className="text-sm font-bold text-white mb-1">{player.name}</span>
        
        <div className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
          isHero 
            ? 'bg-blue-600/50 text-blue-300' 
            : 'bg-gray-700/50 text-gray-300'
        }`}>
          ${player.chips.toLocaleString()}
        </div>

        {player.aiPersonality && !isHero && (
          <div className="mt-1 text-[10px] text-gray-500 uppercase tracking-wider">
            {player.aiPersonality.replace('_', ' ')}
          </div>
        )}
      </motion.div>

      <div className="flex gap-1 mt-2 z-0">
        {player.hand.map((card, i) => (
          <CardView 
            key={i} 
            card={card} 
            hidden={!showCards}
            isDealing={phase !== 'waiting'}
            dealDelay={index * 0.1 + i * 0.05}
            size="md"
          />
        ))}
      </div>
      
      {player.currentBet > 0 && (
        <motion.div 
          className="absolute -bottom-8 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg border border-orange-300"
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          ${player.currentBet}
        </motion.div>
      )}

      {player.isAllIn && (
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          ALL IN!
        </motion.div>
      )}

      {player.isFolded && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-xs text-gray-400">已弃牌</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
