import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { CardView } from './Cards';
import { PokerEngine } from '../engine/PokerEngine';

export const ShowdownModal: React.FC = () => {
  const { players, communityCards, pot, phase, startNewHand } = useGameStore();
  
  if (phase !== 'showdown' && phase !== 'complete') return null;

  const activePlayers = players.filter(p => !p.isFolded);
  
  const results = activePlayers.map(player => {
    const evaluation = PokerEngine.evaluateBestHand(player.hand, communityCards);
    return {
      ...player,
      evaluation
    };
  }).sort((a, b) => b.evaluation.score - a.evaluation.score);

  const winners = results.filter(r => results[0] && r.evaluation.score === results[0].evaluation.score);
  const winAmounts = new Map<number, number>();

  if (phase === 'complete' || phase === 'showdown') {
    const { winners: potWinners } = useGameStore.getState().determineWinners();
    const totalPot = pot || 0;
    const amounts = potWinners.map((_, i, arr) => {
      const base = Math.floor(totalPot / arr.length);
      const remainder = totalPot % arr.length;
      return base + (i < remainder ? 1 : 0);
    });
    potWinners.forEach((id, i) => winAmounts.set(id, amounts[i]));
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="text-center mb-6">
          <motion.div
            className="text-4xl mb-2"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            🎉
          </motion.div>
          <h2 className="text-2xl font-bold text-yellow-400">摊牌结果</h2>
          <p className="text-gray-400 mt-1">底池: ${pot.toLocaleString()}</p>
        </div>

        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
          {results.map((player, index) => (
            <motion.div
              key={player.id}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                winners.some(w => w.id === player.id) 
                  ? 'bg-yellow-500/20 border border-yellow-500/50' 
                  : 'bg-gray-800/50'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                winners.some(w => w.id === player.id) ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{player.seatIndex === 0 ? '👤' : '🤖'}</span>
                  <span className="font-bold text-white">{player.name}</span>
                  {winners.some(w => w.id === player.id) && (
                    <span className="text-yellow-400 text-sm">🏆</span>
                  )}
                </div>
                <div className="text-sm text-yellow-400 mt-1">
                  {player.evaluation.name}
                </div>
              </div>

              <div className="flex gap-1">
                {player.hand.map((card, i) => (
                  <CardView key={i} card={card} />
                ))}
              </div>

              {winners.some(w => w.id === player.id) && winAmounts.has(player.id) && (
                <div className="text-green-400 font-bold">+${winAmounts.get(player.id)}</div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">公共牌</div>
          <div className="flex gap-2 justify-center">
            {communityCards.map((card, i) => (
              <CardView key={i} card={card} />
            ))}
          </div>
        </div>

        <motion.button
          onClick={startNewHand}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold text-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {phase === 'complete' ? '开始新局' : '查看结果'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
