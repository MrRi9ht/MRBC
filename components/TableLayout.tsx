import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { PlayerSeat } from './PlayerSeat';
import { CardView } from './Cards';
import { ActionType } from '../define';

const GAME_RULES = [
  '每位玩家发 2 张底牌，共 5 张公共牌（翻牌 3 张、转牌 1 张、河牌 1 张）。',
  '用 2 张底牌 + 5 张公共牌中任意 5 张组成最大牌型比大小。',
  '牌型从大到小：皇家同花顺 > 同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌。',
  '翻牌前从大盲后第一位开始行动；翻牌后从庄家左侧第一位可行动玩家开始。',
  '可弃牌、过牌、跟注、加注或全下。超时将自动弃牌。'
];

export const TableLayout: React.FC = () => {
  const {
    communityCards,
    pot,
    phase,
    players,
    currentActorIndex,
    highestBet,
    minimumRaise,
    startNewHand,
    playerAction,
    log,
    processAITurn,
    finishPlayerTurn,
    setGameSettings
  } = useGameStore();

  const [raiseAmount, setRaiseAmount] = useState(40);
  const [isBetting, setIsBetting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [showRules, setShowRules] = useState(false);
  const [selectedSmallBlind, setSelectedSmallBlind] = useState(10);
  const [selectedBigBlind, setSelectedBigBlind] = useState(20);
  const [selectedInitialChips, setSelectedInitialChips] = useState(1000);
  const [selectedAIPlayerCount, setSelectedAIPlayerCount] = useState(5);

  const currentBetRound = useGameStore(state => state.currentBetRound);
  const hero = players[0];
  const isHeroTurn = currentActorIndex === 0 && !['showdown', 'complete', 'waiting'].includes(phase as string);
  const heroBet = highestBet - hero.currentBet;
  const canRaise = hero.chips >= (raiseAmount - hero.currentBet) && raiseAmount >= minimumRaise;
  const canCall = hero.chips >= heroBet && heroBet > 0;

  const handleSmallBlindChange = (value: number) => {
    setSelectedSmallBlind(value);
    setSelectedBigBlind(value * 2);
  };

  const handleStartGame = () => {
    setGameSettings({
      smallBlind: selectedSmallBlind,
      bigBlind: selectedBigBlind,
      initialChips: selectedInitialChips,
      aiPlayerCount: selectedAIPlayerCount
    });
    setTimeout(() => startNewHand(), 100);
  };

  const handleAction = useCallback((action: ActionType, amount?: number) => {
    const { currentActorIndex } = useGameStore.getState();
    if (currentActorIndex !== 0) return;
    setIsBetting(true);

    playerAction(hero.id, action, amount);

    setTimeout(() => {
      finishPlayerTurn();
      setIsBetting(false);
    }, 300);
  }, [hero.id, playerAction, finishPlayerTurn]);

  useEffect(() => {
    setRaiseAmount(minimumRaise);
  }, [minimumRaise, phase, currentBetRound]);

  useEffect(() => {
    if (!isHeroTurn || isBetting) return;

    setTimeLeft(20);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAction('fold');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isHeroTurn, isBetting, currentActorIndex, phase, handleAction]);

  useEffect(() => {
    const validPhases = ['pre_flop', 'flop', 'turn', 'river'];
    if (validPhases.includes(phase as string) && currentActorIndex !== -1 && currentActorIndex !== 0) {
      const timer = setTimeout(() => processAITurn(), 300);
      return () => clearTimeout(timer);
    }
  }, [phase, currentActorIndex, processAITurn]);

  const handleRaiseAmountChange = (delta: number) => {
    const newAmount = raiseAmount + delta;
    if (newAmount >= minimumRaise && newAmount <= hero.chips + hero.currentBet) {
      setRaiseAmount(newAmount);
    }
  };

  const phaseNames: Record<string, string> = {
    waiting: '等待开始',
    pre_flop: '翻牌前',
    flop: '翻牌',
    turn: '转牌',
    river: '河牌',
    showdown: '摊牌',
    complete: '结算'
  };

  const formatMoney = (value: number) => `$${value.toLocaleString()}`;

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(100, 100, 150, 0.1) 0%, transparent 50%)'
          }}></div>
        </div>
      </div>

      <motion.div 
        className="relative w-[95%] max-w-[1000px] aspect-[1.9/1]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 rounded-[180px] overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950">
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="feltPattern" patternUnits="userSpaceOnUse" width="60" height="60">
                    <rect width="60" height="60" fill="transparent"/>
                    <circle cx="30" cy="30" r="1" fill="rgba(255,255,255,0.1)"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#feltPattern)"/>
              </svg>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10"></div>
          </div>
        </div>

        <div className="absolute inset-[12px] rounded-[160px] border-[6px] border-amber-900/50 shadow-inner"></div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-8 z-10">
          <motion.div 
            className="relative"
            animate={{ scale: pot > 0 ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 2, repeat: pot > 0 ? Infinity : 0 }}
          >
            <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md px-8 py-3 rounded-full border-2 border-yellow-500/50 shadow-2xl">
              <div className="flex items-center gap-3">
                <motion.span 
                  className="text-3xl"
                  animate={{ rotate: pot > 0 ? [0, 10, -10, 0] : 0 }}
                  transition={{ duration: 0.5, repeat: pot > 0 ? Infinity : 0 }}
                >
                  🪙
                </motion.span>
                <span className="text-yellow-400 font-mono font-bold text-2xl">
                  {formatMoney(pot)}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="flex gap-4 items-center">
            <AnimatePresence mode="popLayout">
              {communityCards.map((card, i) => {
                const uniqueKey = `${card.rank}-${card.suit}-${i}`;
                const isFlopPhase = communityCards.length === 3 && phase === 'flop';
                const delay = isFlopPhase ? i * 0.1 : i * 0.15;

                return (
                  <motion.div
                    key={uniqueKey}
                    layoutId={uniqueKey}
                    initial={{ opacity: 0, y: -50, rotateX: -90, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{
                      delay,
                      duration: 0.5,
                      type: 'spring',
                      stiffness: 280,
                      damping: 22
                    }}
                    style={{ perspective: '800px' }}
                    className="shadow-2xl"
                  >
                    <CardView card={card} size="xl" />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {Array.from({ length: Math.max(0, 5 - communityCards.length) }).map((_, i) => (
              <motion.div
                key={`placeholder-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="w-28 h-40 border-2 border-dashed border-white/20 rounded-xl bg-black/30 flex items-center justify-center shadow-lg"
              >
                <span className="text-white/15 text-3xl">?</span>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            className="bg-black/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-white/80 text-sm font-medium uppercase tracking-widest">
              {phaseNames[phase]}
            </span>
          </motion.div>
        </div>

        {Array.from({ length: players.length }).map((_, i) => (
          <PlayerSeat key={i} index={i} />
        ))}

        {phase === 'waiting' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-900/98 via-gray-800/98 to-gray-900/98 rounded-3xl p-8 border border-gray-700/50 shadow-2xl min-w-[520px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div className="text-center mb-6">
                <motion.div
                  className="text-5xl mb-3"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎴
                </motion.div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-1">
                  德州扑克
                </h1>
                <p className="text-gray-400 text-xs">Texas Hold'em Poker</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-3 border border-blue-700/30">
                  <div className="text-blue-400 text-xs mb-2 flex items-center gap-1">
                    <span>🎯</span> 小盲注
                  </div>
                  <div className="flex gap-2">
                    {[{ value: 10, label: '$10' }, { value: 100, label: '$100' }, { value: 200, label: '$200' }].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleSmallBlindChange(opt.value)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          selectedSmallBlind === opt.value
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-3 border border-purple-700/30">
                  <div className="text-purple-400 text-xs mb-2 flex items-center gap-1">
                    <span>👑</span> 大盲注 (小盲的两倍)
                  </div>
                  <div className="bg-purple-900/50 rounded-lg py-3 text-center">
                    <span className="text-white font-bold text-lg">{formatMoney(selectedBigBlind)}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-3 border border-green-700/30">
                  <div className="text-green-400 text-xs mb-2 flex items-center gap-1">
                    <span>💰</span> 初始筹码
                  </div>
                  <div className="flex gap-2">
                    {[
                      { value: 1000, label: '$1,000' },
                      { value: 10000, label: '$10,000' },
                      { value: 100000, label: '$100,000' },
                      { value: 1000000, label: '$1,000,000' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedInitialChips(opt.value)}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          selectedInitialChips === opt.value
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-green-900/50 text-green-300 hover:bg-green-800/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-xl p-3 border border-orange-700/30">
                  <div className="text-orange-400 text-xs mb-2 flex items-center gap-1">
                    <span>🤖</span> AI对手数量
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(count => (
                      <button
                        key={count}
                        onClick={() => setSelectedAIPlayerCount(count)}
                        className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                          selectedAIPlayerCount === count
                            ? 'bg-orange-600 text-white shadow-lg'
                            : 'bg-orange-900/50 text-orange-300 hover:bg-orange-800/50'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <div className="text-center text-orange-300 text-xs mt-2">
                    共 {selectedAIPlayerCount + 1} 位玩家
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={handleStartGame}
                  className="w-full text-white py-4 px-8 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 3s ease infinite'
                  }}
                  whileHover={{ scale: 1.02, y: -3, boxShadow: '0 20px 40px rgba(102, 126, 234, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xl">🎰</span>
                    <span>开始游戏</span>
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => setShowRules(true)}
                  className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 py-3 px-8 rounded-xl font-medium text-sm border border-gray-700/50 transition-all"
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>📖</span>
                    <span>游戏规则</span>
                  </span>
                </motion.button>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-700/50">
                <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span>⚡</span> 快速匹配
                  </span>
                  <span className="flex items-center gap-1">
                    <span>🎨</span> 精美界面
                  </span>
                  <span className="flex items-center gap-1">
                    <span>🤯</span> AI对手
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showRules && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowRules(false)}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-6 max-w-md border border-gray-700 shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-yellow-400 mb-4">游戏规则</h2>
              <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
                {GAME_RULES.map(rule => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
              <button
                onClick={() => setShowRules(false)}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium"
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}

        {phase !== 'waiting' && (
          <motion.div 
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {isHeroTurn && phase !== 'showdown' && phase !== 'complete' ? (
              <motion.div 
                className="bg-gradient-to-br from-gray-900/98 to-gray-950/98 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50 shadow-2xl min-w-[400px]"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="text-center mb-4">
                  <div className="text-gray-400 text-sm mb-2">🎯 你的回合</div>
                  <div className="flex items-center justify-center gap-4">
                    {heroBet > 0 && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <span className="text-gray-500">需要跟注:</span>
                        <span className="font-bold text-2xl">{formatMoney(heroBet)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-blue-400">
                      <span className="text-gray-500">剩余时间:</span>
                      <span className={`font-bold text-xl ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : ''}`}>
                        {timeLeft}s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <motion.button
                      onClick={() => handleAction('fold')}
                      disabled={isBetting}
                      className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-lg">🚫</div>
                      <div className="text-sm">弃牌</div>
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleAction(heroBet > 0 ? 'call' : 'check')}
                      disabled={isBetting || (heroBet > 0 && !canCall)}
                      className={`py-4 rounded-xl font-bold shadow-lg transition-all ${
                        heroBet > 0 
                          ? 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 text-white'
                          : 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white'
                      }`}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-lg">{heroBet > 0 ? '✅' : '👆'}</div>
                      <div className="text-sm">{heroBet > 0 ? `跟注 ${formatMoney(heroBet)}` : '过牌'}</div>
                    </motion.button>

                    <motion.button
                      onClick={() => handleAction('all_in')}
                      disabled={isBetting}
                      className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-500 hover:via-orange-500 hover:to-red-500 text-white py-4 rounded-xl font-bold shadow-lg transition-all"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-lg">🔥</div>
                      <div className="text-sm">ALL IN</div>
                    </motion.button>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="text-center text-xs text-gray-400 mb-3">💰 加注选项</div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <motion.button
                        onClick={() => handleRaiseAmountChange(-10)}
                        disabled={isBetting || raiseAmount <= minimumRaise}
                        className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white w-12 h-10 rounded-lg font-bold shadow"
                        whileTap={{ scale: 0.9 }}
                      >
                        -10
                      </motion.button>
                      
                      <div className="flex-1 text-center bg-gray-900/50 rounded-lg py-2">
                        <div className="text-xs text-gray-400">加注到</div>
                        <div className="text-yellow-400 font-bold text-xl">{formatMoney(raiseAmount)}</div>
                      </div>
                      
                      <motion.button
                        onClick={() => handleRaiseAmountChange(10)}
                        disabled={isBetting || raiseAmount >= hero.chips + hero.currentBet}
                        className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white w-12 h-10 rounded-lg font-bold shadow"
                        whileTap={{ scale: 0.9 }}
                      >
                        +10
                      </motion.button>
                    </div>

                    <motion.button
                      onClick={() => handleAction('raise', raiseAmount)}
                      disabled={isBetting || !canRaise}
                      className="w-full bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🎯 加注至 {formatMoney(raiseAmount)}
                    </motion.button>
                  </div>

                  <div className="text-center text-xs text-gray-500">
                    你的筹码: <span className="text-green-400 font-bold">{formatMoney(hero.chips)}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              (phase === 'complete' || phase === 'showdown') && (
                <motion.button 
                  onClick={startNewHand}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl transition-all"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 新的一局
                </motion.button>
              )
            )}
          </motion.div>
        )}

        <motion.div 
          className="absolute top-4 right-4 w-72 max-h-56 overflow-y-auto bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-xs text-gray-400 mb-3 font-bold uppercase tracking-wider flex items-center gap-2">
            <span>📜</span> 游戏日志
          </div>
          <AnimatePresence mode="popLayout">
            {log.slice(-8).map((entry, i) => (
              <motion.div
                key={`${i}-${entry}`}
                className="text-xs text-gray-300 py-1.5 border-b border-gray-800/50 last:border-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
              >
                {entry}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};
