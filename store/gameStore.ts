import { create } from 'zustand';
import { GameState, Player, GamePhase, ActionType, AIPersonality, PlayerPosition, PlayerMemory, PotSplit } from '../define';
import { PokerEngine } from '../engine/PokerEngine';
import { HandEvaluation } from '../define';
import { AIEngine } from '../engine/AIEngine';
import { soundManager } from '../utils/SoundManager';

const PLAYER_NAMES = ['Hero', 'Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Epsilon', 'Bot Zeta', 'Bot Eta'];

const createInitialMemory = (): PlayerMemory => ({
  handsPlayed: 0,
  handsWon: 0,
  totalWon: 0,
  foldFrequency: 0,
  raiseFrequency: 0,
  bluffFrequency: 0,
  isTilted: false,
  tiltHands: 0,
  playerNotes: ''
});

const getAIPersonality = (seatIndex: number): AIPersonality | undefined => {
  if (seatIndex === 0) return undefined;
  const personalities = [
    AIPersonality.TIGHT_WEAK,
    AIPersonality.LOOSE_AGGRESSIVE,
    AIPersonality.CRAFTY,
    AIPersonality.CALLING_STATION,
    AIPersonality.TIGHT_WEAK
  ];
  return personalities[(seatIndex - 1) % personalities.length];
};

const getPlayerPosition = (seatIndex: number, dealerIndex: number, numPlayers: number = 6): PlayerPosition => {
  const positions = [
    PlayerPosition.UTG,
    PlayerPosition.UTG1,
    PlayerPosition.LJ,
    PlayerPosition.HJ,
    PlayerPosition.CO,
    PlayerPosition.BTN,
    PlayerPosition.SB,
    PlayerPosition.BB
  ];
  const relativePos = (seatIndex - dealerIndex + numPlayers) % numPlayers;
  return positions[relativePos];
};

const getPlayerPositionForAI = (seatIndex: number): 'early' | 'middle' | 'late' | 'btn' => {
  const { dealerIndex, players } = useGameStore.getState();
  const numPlayers = players.length;
  const relativePos = (seatIndex - dealerIndex + numPlayers) % numPlayers;

  if (relativePos === numPlayers - 1) return 'btn';
  const third = Math.floor(numPlayers / 3);
  if (relativePos >= numPlayers - third - 1) return 'late';
  if (relativePos >= third) return 'middle';
  return 'early';
};

const canPlayerAct = (player: Player): boolean =>
  !player.isFolded && !player.isAllIn && player.chips > 0;

const getInHandPlayers = (players: Player[]): Player[] =>
  players.filter(p => !p.isFolded);

const findNextActivePlayer = (players: Player[], startFrom: number): number => {
  const numPlayers = players.length;
  for (let i = 1; i <= numPlayers; i++) {
    const idx = (startFrom + i) % numPlayers;
    if (canPlayerAct(players[idx])) return idx;
  }
  return -1;
};

const getFirstActorForStreet = (
  phase: GamePhase,
  players: Player[],
  dealerIndex: number,
  bbIndex: number,
  isHeadsUp: boolean
): number => {
  if (phase === 'pre_flop') {
    if (isHeadsUp) {
      return findNextActivePlayer(players, dealerIndex - 1);
    }
    return findNextActivePlayer(players, bbIndex);
  }
  if (isHeadsUp) {
    return findNextActivePlayer(players, dealerIndex);
  }
  return findNextActivePlayer(players, dealerIndex);
};

const distributePot = (total: number, winnerIds: number[]): number[] => {
  const base = Math.floor(total / winnerIds.length);
  const remainder = total % winnerIds.length;
  return winnerIds.map((_, i) => base + (i < remainder ? 1 : 0));
};

const calculateSidePots = (players: Player[]): PotSplit[] => {
  const contributors = players.filter(p => p.totalContributed > 0);
  if (contributors.length === 0) return [];

  const levels = [...new Set(contributors.map(p => p.totalContributed))].sort((a, b) => a - b);
  const pots: PotSplit[] = [];
  let previous = 0;

  for (const level of levels) {
    if (level <= previous) continue;
    const increment = level - previous;
    const numContributors = players.filter(p => p.totalContributed >= level).length;
    const amount = increment * numContributors;
    const eligible = players
      .filter(p => !p.isFolded && p.totalContributed >= level)
      .map(p => p.id);

    if (amount > 0 && eligible.length > 0) {
      pots.push({ amount, winners: eligible });
    }
    previous = level;
  }

  return pots;
};

const findWinnersAmong = (
  playerIds: number[],
  handEvaluations: Map<number, HandEvaluation>
): number[] => {
  if (playerIds.length === 0) return [];
  let winners = [playerIds[0]];
  let bestScore = handEvaluations.get(playerIds[0])?.score ?? 0;

  for (let i = 1; i < playerIds.length; i++) {
    const id = playerIds[i];
    const eval_ = handEvaluations.get(id);
    if (!eval_) continue;
    if (eval_.score > bestScore) {
      bestScore = eval_.score;
      winners = [id];
    } else if (eval_.score === bestScore) {
      winners.push(id);
    }
  }
  return winners;
};

const createInitialPlayers = (initialChips: number, aiPlayerCount: number = 5): Player[] => {
  const totalPlayers = Math.min(aiPlayerCount + 1, 8);
  return Array.from({ length: totalPlayers }, (_, i) => ({
    id: i,
    name: PLAYER_NAMES[i],
    chips: initialChips,
    hand: [],
    currentBet: 0,
    totalContributed: 0,
    isFolded: false,
    isAllIn: false,
    isActive: true,
    seatIndex: i,
    position: getPlayerPosition(i, 0, totalPlayers),
    aiPersonality: getAIPersonality(i),
    memory: createInitialMemory()
  }));
};

interface GameActions {
  initializeGame: () => void;
  setGameSettings: (settings: { smallBlind?: number; bigBlind?: number; initialChips?: number; aiPlayerCount?: number }) => void;
  startNewHand: () => void;
  nextPhase: () => void;
  playerAction: (playerId: number, action: ActionType, amount?: number) => void;
  advanceToNextPlayer: () => void;
  checkBettingRoundComplete: () => boolean;
  determineWinners: () => { winners: number[]; handEvaluations: Map<number, HandEvaluation> };
  collectPot: (winners: number[], amounts: number[]) => void;
  resetForNextHand: () => void;
  aiMakeDecision: (playerIndex: number) => void;
  processAITurn: () => void;
  finishPlayerTurn: () => void;
  awardUncontested: (winnerId: number) => void;
  resolveShowdown: () => void;
}

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'waiting',
  deck: [],
  communityCards: [],
  players: createInitialPlayers(1000, 5),
  pot: 0,
  sidePots: [],
  dealerIndex: 0,
  smallBlindIndex: -1,
  bigBlindIndex: -1,
  currentActorIndex: -1,
  highestBet: 0,
  minimumRaise: 20,
  actions: [],
  log: ['Welcome to Texas Hold\'em!'],
  currentBetRound: 0,
  isHeadsUp: false,
  smallBlind: 10,
  bigBlind: 20,
  initialChips: 1000,
  aiPlayerCount: 5,
  actedThisRound: [],
  lastRaiseIncrement: 20,
  aiBusy: false,

  initializeGame: () => {
    const { initialChips, aiPlayerCount } = get();
    set({
      phase: 'waiting',
      players: createInitialPlayers(initialChips, aiPlayerCount),
      pot: 0,
      communityCards: [],
      aiBusy: false,
      actedThisRound: [],
      log: ['Game Initialized. Click "Start New Hand" to begin!']
    });
  },

  setGameSettings: (settings) => {
    const { smallBlind, bigBlind, initialChips, aiPlayerCount } = get();
    const newSmallBlind = settings.smallBlind ?? smallBlind;
    const newBigBlind = settings.bigBlind ?? bigBlind;
    const newInitialChips = settings.initialChips ?? initialChips;
    const newAIPlayerCount = settings.aiPlayerCount ?? aiPlayerCount;

    set({
      smallBlind: newSmallBlind,
      bigBlind: newBigBlind,
      initialChips: newInitialChips,
      aiPlayerCount: newAIPlayerCount,
      minimumRaise: newBigBlind * 2,
      lastRaiseIncrement: newBigBlind,
      players: createInitialPlayers(newInitialChips, newAIPlayerCount)
    });
  },

  startNewHand: () => {
    const { players, dealerIndex, smallBlind, bigBlind } = get();
    const numPlayers = players.length;
    soundManager.init();
    soundManager.play('shuffle');

    const newDeck = PokerEngine.shuffle(PokerEngine.createDeck());

    setTimeout(() => soundManager.play('deal'), 300);

    let cardIdx = 0;
    const updatedPlayers = players.map(p => {
      if (p.chips > 0) {
        const hand = [newDeck[cardIdx++], newDeck[cardIdx++]];
        return {
          ...p,
          hand,
          currentBet: 0,
          totalContributed: 0,
          isFolded: false,
          isAllIn: false,
          isActive: true,
          memory: { ...p.memory, handsPlayed: p.memory.handsPlayed + 1 }
        };
      }
      return { ...p, hand: [], currentBet: 0, totalContributed: 0, isFolded: true, isActive: false };
    });

    const nextDealer = (dealerIndex + 1) % numPlayers;
    const activeCount = updatedPlayers.filter(p => p.chips > 0 && !p.isFolded).length;
    const isHeadsUp = activeCount === 2;

    const sbIndex = isHeadsUp ? nextDealer : (nextDealer + 1) % numPlayers;
    const bbIndex = isHeadsUp ? (nextDealer + 1) % numPlayers : (nextDealer + 2) % numPlayers;

    let currentPot = 0;

    const postBlind = (index: number, amount: number) => {
      const player = updatedPlayers[index];
      if (!player || player.chips <= 0) return;
      const blindAmount = Math.min(amount, player.chips);
      updatedPlayers[index] = {
        ...player,
        chips: player.chips - blindAmount,
        currentBet: blindAmount,
        totalContributed: blindAmount,
        isAllIn: player.chips === blindAmount
      };
      currentPot += blindAmount;
    };

    postBlind(sbIndex, smallBlind);
    postBlind(bbIndex, bigBlind);

    const currentActor = getFirstActorForStreet('pre_flop', updatedPlayers, nextDealer, bbIndex, isHeadsUp);

    set({
      phase: 'pre_flop',
      deck: newDeck.slice(cardIdx),
      communityCards: [],
      players: updatedPlayers,
      pot: currentPot,
      dealerIndex: nextDealer,
      smallBlindIndex: sbIndex,
      bigBlindIndex: bbIndex,
      currentActorIndex: currentActor,
      highestBet: bigBlind,
      minimumRaise: bigBlind * 2,
      lastRaiseIncrement: bigBlind,
      actedThisRound: [],
      aiBusy: false,
      sidePots: [],
      actions: [
        {
          playerId: updatedPlayers[sbIndex]?.id ?? 0,
          action: 'blind',
          amount: smallBlind,
          timestamp: Date.now()
        },
        {
          playerId: updatedPlayers[bbIndex]?.id ?? 0,
          action: 'blind',
          amount: bigBlind,
          timestamp: Date.now()
        }
      ],
      log: [
        ...get().log,
        '',
        `--- New Hand #${get().players[0].memory.handsPlayed + 1} ---`,
        `Dealer: ${updatedPlayers[nextDealer].name}`,
        `SB: ${updatedPlayers[sbIndex]?.name} ($${smallBlind})`,
        `BB: ${updatedPlayers[bbIndex]?.name} ($${bigBlind})`
      ],
      currentBetRound: 0,
      isHeadsUp
    });

    setTimeout(() => get().processAITurn(), 400);
  },

  playerAction: (playerId, action, amount = 0) => {
    const { players, pot, highestBet, minimumRaise, actions, actedThisRound, bigBlind } = get();
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const player = { ...players[playerIndex] };
    let newPot = pot;
    let newHighestBet = highestBet;
    let newMinimumRaise = minimumRaise;
    let newLastRaiseIncrement = get().lastRaiseIncrement;
    let newActedThisRound = [...actedThisRound];
    let logMsg = '';
    const timestamp = Date.now();
    const oldHighestBet = highestBet;

    switch (action) {
      case 'fold':
        player.isFolded = true;
        player.memory.foldFrequency = (player.memory.foldFrequency * (player.memory.handsPlayed - 1) + 1) / player.memory.handsPlayed;
        logMsg = `${player.name} 弃牌`;
        soundManager.play('fold');
        break;

      case 'check':
        logMsg = `${player.name} 过牌`;
        soundManager.play('click');
        break;

      case 'call': {
        const callAmount = Math.min(highestBet - player.currentBet, player.chips);
        if (callAmount > 0) {
          player.chips -= callAmount;
          player.currentBet += callAmount;
          player.totalContributed += callAmount;
          newPot += callAmount;
          if (player.chips === 0) player.isAllIn = true;
          logMsg = `${player.name} 跟注 $${callAmount}`;
          soundManager.play('call');
        } else {
          logMsg = `${player.name} 过牌`;
          soundManager.play('click');
        }
        break;
      }

      case 'raise': {
        const raiseTotal = Math.min(amount, player.chips + player.currentBet);
        const addedChips = raiseTotal - player.currentBet;
        if (addedChips > 0 && addedChips <= player.chips) {
          const raiseIncrement = raiseTotal - oldHighestBet;
          player.chips -= addedChips;
          player.currentBet = raiseTotal;
          player.totalContributed += addedChips;
          newPot += addedChips;
          newHighestBet = raiseTotal;
          newLastRaiseIncrement = Math.max(raiseIncrement, bigBlind);
          newMinimumRaise = raiseTotal + newLastRaiseIncrement;
          newActedThisRound = [playerId];
          player.memory.raiseFrequency = (player.memory.raiseFrequency * (player.memory.handsPlayed - 1) + 1) / player.memory.handsPlayed;
          if (player.chips === 0) player.isAllIn = true;
          logMsg = `${player.name} 加注至 $${raiseTotal}`;
          soundManager.play('raise');
        }
        break;
      }

      case 'all_in': {
        const allInAmount = player.chips;
        player.currentBet += allInAmount;
        player.totalContributed += allInAmount;
        newPot += allInAmount;
        player.chips = 0;
        player.isAllIn = true;
        if (player.currentBet > newHighestBet) {
          const raiseIncrement = player.currentBet - oldHighestBet;
          newHighestBet = player.currentBet;
          newLastRaiseIncrement = Math.max(raiseIncrement, bigBlind);
          newMinimumRaise = newHighestBet + newLastRaiseIncrement;
          newActedThisRound = [playerId];
        }
        player.memory.raiseFrequency = (player.memory.raiseFrequency * (player.memory.handsPlayed - 1) + 1) / player.memory.handsPlayed;
        logMsg = `${player.name} ALL IN $${allInAmount}!`;
        soundManager.play('all_in');
        break;
      }

      case 'blind':
        logMsg = `${player.name} 盲注 $${amount}`;
        soundManager.play('bet');
        break;
    }

    if (action !== 'blind' && !newActedThisRound.includes(playerId)) {
      newActedThisRound.push(playerId);
    }

    const newPlayers = [...players];
    newPlayers[playerIndex] = player;

    const newActions = [...actions, { playerId, action, amount: amount || player.currentBet, timestamp }];

    set({
      players: newPlayers,
      pot: newPot,
      highestBet: newHighestBet,
      minimumRaise: newMinimumRaise,
      lastRaiseIncrement: newLastRaiseIncrement,
      actedThisRound: newActedThisRound,
      actions: newActions,
      log: [...get().log, logMsg]
    });
  },

  advanceToNextPlayer: () => {
    const { players, currentActorIndex } = get();
    const nextIndex = findNextActivePlayer(players, currentActorIndex);
    set({ currentActorIndex: nextIndex });
  },

  checkBettingRoundComplete: () => {
    const { players, highestBet, actedThisRound } = get();
    const canAct = players.filter(canPlayerAct);

    if (canAct.length === 0) return true;

    if (!canAct.every(p => p.currentBet === highestBet)) return false;

    return canAct.every(p => actedThisRound.includes(p.id));
  },

  awardUncontested: (winnerId) => {
    const { players, pot } = get();
    const winner = players.find(p => p.id === winnerId);
    if (!winner) return;

    set({
      log: [...get().log, `${winner.name} 收池 $${pot}（其余玩家已弃牌）`]
    });

    get().collectPot([winnerId], [pot]);
  },

  resolveShowdown: () => {
    const { players, communityCards, pot } = get();
    const sidePots = calculateSidePots(players);
    set({ sidePots });

    const handEvaluations = new Map<number, HandEvaluation>();
    getInHandPlayers(players).forEach(player => {
      handEvaluations.set(player.id, PokerEngine.evaluateBestHand(player.hand, communityCards));
    });

    const payouts = new Map<number, number>();
    const potsToResolve = sidePots.length > 0
      ? sidePots
      : [{ amount: pot, winners: getInHandPlayers(players).map(p => p.id) }];

    let resultMsg = '';

    for (const sidePot of potsToResolve) {
      const eligible = sidePot.winners.filter(id => !players.find(p => p.id === id)?.isFolded);
      if (eligible.length === 0) continue;

      const potWinners = findWinnersAmong(eligible, handEvaluations);
      const amounts = distributePot(sidePot.amount, potWinners);

      potWinners.forEach((winnerId, index) => {
        payouts.set(winnerId, (payouts.get(winnerId) ?? 0) + amounts[index]);
        const player = players.find(p => p.id === winnerId);
        const eval_ = handEvaluations.get(winnerId);
        if (player && eval_) {
          resultMsg += `${player.name} 展示 ${eval_.name}（+$${amounts[index]}） `;
        }
      });
    }

    if (!resultMsg) {
      resultMsg = '摊牌完成';
    }

    set({ log: [...get().log, resultMsg.trim()] });

    const winnerIds = Array.from(payouts.keys());
    const amounts = winnerIds.map(id => payouts.get(id)!);
    get().collectPot(winnerIds, amounts);
  },

  nextPhase: () => {
    const { phase, deck, communityCards, players, bigBlind, dealerIndex, bigBlindIndex, isHeadsUp } = get();
    let newCommunityCards = [...communityCards];
    let newDeck = [...deck];

    const resetBets = players.map(p => ({ ...p, currentBet: 0 }));
    const startNewBettingRound = (nextPhaseName: GamePhase, logLine: string) => {
      const firstActor = getFirstActorForStreet(nextPhaseName, resetBets, dealerIndex, bigBlindIndex, isHeadsUp);
      set({
        phase: nextPhaseName,
        deck: newDeck,
        communityCards: newCommunityCards,
        players: resetBets,
        currentActorIndex: firstActor,
        highestBet: 0,
        minimumRaise: bigBlind * 2,
        lastRaiseIncrement: bigBlind,
        actedThisRound: [],
        currentBetRound: get().currentBetRound + 1,
        log: [...get().log, '', logLine]
      });
      setTimeout(() => get().finishPlayerTurn(), 300);
    };

    const burnCard = () => {
      if (newDeck.length > 0) newDeck.pop();
    };

    if (phase === 'pre_flop') {
      burnCard();
      newCommunityCards = [newDeck.pop()!, newDeck.pop()!, newDeck.pop()!];
      startNewBettingRound(
        'flop',
        `=== 翻牌圈 === (${newCommunityCards.map(c => `${c.rank}${c.suit[0].toUpperCase()}`).join(', ')})`
      );
    } else if (phase === 'flop') {
      burnCard();
      newCommunityCards.push(newDeck.pop()!);
      startNewBettingRound(
        'turn',
        `=== 转牌圈 === (${newCommunityCards.map(c => `${c.rank}${c.suit[0].toUpperCase()}`).join(', ')})`
      );
    } else if (phase === 'turn') {
      burnCard();
      newCommunityCards.push(newDeck.pop()!);
      startNewBettingRound(
        'river',
        `=== 河牌圈 === (${newCommunityCards.map(c => `${c.rank}${c.suit[0].toUpperCase()}`).join(', ')})`
      );
    } else if (phase === 'river') {
      set({
        phase: 'showdown',
        communityCards: newCommunityCards,
        log: [...get().log, '', '=== 摊牌 ===']
      });
      setTimeout(() => get().resolveShowdown(), 500);
    }
  },

  determineWinners: () => {
    const { players, communityCards } = get();
    const activePlayers = getInHandPlayers(players).filter(p => p.hand.length > 0);

    const handEvaluations = new Map<number, HandEvaluation>();
    activePlayers.forEach(player => {
      handEvaluations.set(player.id, PokerEngine.evaluateBestHand(player.hand, communityCards));
    });

    const winners = findWinnersAmong(activePlayers.map(p => p.id), handEvaluations);
    return { winners, handEvaluations };
  },

  collectPot: (winners, amounts) => {
    const { players, pot } = get();
    const newPlayers = [...players];

    const heroWon = winners.some(w => w === 0);
    setTimeout(() => {
      soundManager.play(heroWon ? 'win' : 'lose');
    }, 500);

    winners.forEach((winnerId, index) => {
      const playerIndex = newPlayers.findIndex(p => p.id === winnerId);
      if (playerIndex !== -1) {
        newPlayers[playerIndex] = {
          ...newPlayers[playerIndex],
          chips: newPlayers[playerIndex].chips + amounts[index],
          memory: {
            ...newPlayers[playerIndex].memory,
            handsWon: newPlayers[playerIndex].memory.handsWon + 1,
            totalWon: newPlayers[playerIndex].memory.totalWon + amounts[index]
          }
        };
      }
    });

    set({
      players: newPlayers,
      phase: 'complete',
      pot: 0,
      aiBusy: false,
      log: [...get().log, '', `底池 $${pot} 已分配`]
    });
  },

  resetForNextHand: () => {
    set({
      phase: 'waiting',
      communityCards: [],
      pot: 0,
      highestBet: 0,
      currentActorIndex: -1,
      actedThisRound: [],
      aiBusy: false,
      actions: [],
      sidePots: []
    });
  },

  finishPlayerTurn: () => {
    const { phase, players } = get();
    if (phase === 'showdown' || phase === 'complete' || phase === 'waiting') return;

    const inHand = getInHandPlayers(players);
    if (inHand.length <= 1) {
      get().awardUncontested(inHand[0].id);
      return;
    }

    if (get().checkBettingRoundComplete()) {
      setTimeout(() => get().nextPhase(), 800);
      return;
    }

    get().advanceToNextPlayer();
    get().processAITurn();
  },

  aiMakeDecision: (playerIndex: number) => {
    const { players, communityCards, highestBet, pot, phase } = get();
    const player = players[playerIndex];

    if (!player?.aiPersonality || !canPlayerAct(player)) {
      set({ aiBusy: false });
      return;
    }

    const aiEngine = new AIEngine(player.aiPersonality, player.memory);
    const position = getPlayerPositionForAI(playerIndex);
    const isPreFlop = phase === 'pre_flop';

    const decision = aiEngine.makeDecision(
      player.hand,
      communityCards,
      player.currentBet,
      highestBet,
      pot,
      player.chips,
      isPreFlop,
      position
    );

    setTimeout(() => {
      get().playerAction(player.id, decision.action, decision.amount);
      set({ aiBusy: false });
      setTimeout(() => get().finishPlayerTurn(), 300);
    }, aiEngine.getThinkTime());
  },

  processAITurn: () => {
    const { phase, currentActorIndex, aiBusy, players } = get();

    if (aiBusy) return;
    if (phase === 'showdown' || phase === 'complete' || phase === 'waiting') return;
    if (currentActorIndex === 0) return;

    const currentPlayer = players[currentActorIndex];
    if (currentPlayer?.aiPersonality && canPlayerAct(currentPlayer)) {
      set({ aiBusy: true });
      get().aiMakeDecision(currentActorIndex);
    }
  }
}));
