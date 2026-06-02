import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export const BankruptcyModal: React.FC = () => {
  const { players, initializeGame } = useGameStore();
  const hero = players[0];
  
  if (hero.chips > 0) return null;

  const handleClaimRelief = () => {
    const { initialChips } = useGameStore.getState();
    const reliefAmount = Math.max(500, Math.floor(initialChips / 2));
    const newPlayers = [...players];
    newPlayers[0] = {
      ...newPlayers[0],
      chips: reliefAmount
    };
    useGameStore.setState({
      players: newPlayers,
      phase: 'waiting',
      pot: 0,
      communityCards: [],
      aiBusy: false
    });
    setTimeout(() => useGameStore.getState().startNewHand(), 300);
  };

  const handleRestart = () => {
    initializeGame();
    useGameStore.getState().startNewHand();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-br from-red-900/90 to-gray-900/90 rounded-2xl p-6 max-w-sm w-full border border-red-700/50 shadow-2xl"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="text-center mb-6">
          <motion.div
            className="text-6xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            💸
          </motion.div>
          <h2 className="text-2xl font-bold text-red-400">破产!</h2>
          <p className="text-gray-400 mt-2">你的筹码已全部输光</p>
        </div>

        <div className="space-y-3 mb-6">
          <motion.button
            onClick={handleClaimRelief}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 rounded-xl font-bold text-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🎁 领取救济金 (+$500)
          </motion.button>
          
          <motion.button
            onClick={handleRestart}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold text-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🔄 重新开始
          </motion.button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          每局游戏结束后，若筹码归零可领取救济金
        </p>
      </motion.div>
    </motion.div>
  );
};
