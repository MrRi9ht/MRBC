import React from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../utils/SoundManager';

interface ControlPanelProps {
  onRestart: () => void;
  onLeaveTable: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onRestart, onLeaveTable }) => {
  const [isMuted, setIsMuted] = React.useState(false);

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.setMuted(newMuted);
  };

  return (
    <motion.div
      className="fixed top-4 left-4 flex flex-col gap-2 z-50"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.button
        onClick={handleToggleMute}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-colors ${
          isMuted ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isMuted ? '取消静音' : '静音'}
      >
        {isMuted ? '🔇' : '🔊'}
      </motion.button>

      <motion.button
        onClick={onRestart}
        className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center text-xl shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="重新开始"
      >
        🔄
      </motion.button>

      <motion.button
        onClick={onLeaveTable}
        className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-xl shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="离开牌桌"
      >
        🚪
      </motion.button>
    </motion.div>
  );
};
