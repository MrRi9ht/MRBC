import { useEffect } from 'react';
import { TableLayout } from './components/TableLayout';
import { ShowdownModal } from './components/ShowdownModal';
import { ControlPanel } from './components/ControlPanel';
import { BankruptcyModal } from './components/BankruptcyModal';
import { useGameStore } from './store/gameStore';

function App() {
  const initializeGame = useGameStore(state => state.initializeGame);
  const startNewHand = useGameStore(state => state.startNewHand);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handleRestart = () => {
    initializeGame();
    setTimeout(() => startNewHand(), 500);
  };

  const handleLeaveTable = () => {
    initializeGame();
  };

  return (
    <div className="font-sans antialiased text-gray-100">
      <TableLayout />
      <ShowdownModal />
      <BankruptcyModal />
      <ControlPanel
        onRestart={handleRestart}
        onLeaveTable={handleLeaveTable}
      />
    </div>
  );
}

export default App;
