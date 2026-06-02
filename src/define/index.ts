export enum Suit {
  Spades = 'spades',
  Hearts = 'hearts',
  Clubs = 'clubs',
  Diamonds = 'diamonds'
}

export enum Rank {
  Two = 2, Three = 3, Four = 4, Five = 5, Six = 6, Seven = 7, Eight = 8, Nine = 9,
  Ten = 10, Jack = 11, Queen = 12, King = 13, Ace = 14
}

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export enum HandRank {
  HighCard = 1,
  OnePair = 2,
  TwoPair = 3,
  ThreeOfAKind = 4,
  Straight = 5,
  Flush = 6,
  FullHouse = 7,
  FourOfAKind = 8,
  StraightFlush = 9,
  RoyalFlush = 10
}

export interface HandEvaluation {
  rank: HandRank;
  score: number;
  name: string;
  kickers: number[];
}

export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'all_in' | 'blind';

export enum PlayerPosition {
  UTG = 'under_the_gun',
  UTG1 = 'utg_plus_1',
  LJ = 'lojack',
  HJ = 'hi_jack',
  CO = 'cut_off',
  BTN = 'button',
  SB = 'small_blind',
  BB = 'big_blind'
}

export enum AIPersonality {
  TIGHT_WEAK = 'tight_weak',
  LOOSE_AGGRESSIVE = 'loose_aggressive',
  CRAFTY = 'crafty',
  CALLING_STATION = 'calling_station'
}

export interface AIPersonalityConfig {
  type: AIPersonality;
  vpip: number;
  pfr: number;
  threeBet: number;
  cbet: number;
  foldToCbet: number;
  aggressionFactor: number;
  tiltThreshold: number;
  tiltMultiplier: number;
}

export interface PlayerMemory {
  handsPlayed: number;
  handsWon: number;
  totalWon: number;
  foldFrequency: number;
  raiseFrequency: number;
  bluffFrequency: number;
  isTilted: boolean;
  tiltHands: number;
  playerNotes: string;
}

export interface Player {
  id: number;
  name: string;
  chips: number;
  hand: Card[];
  currentBet: number;
  isFolded: boolean;
  isAllIn: boolean;
  isActive: boolean;
  seatIndex: number;
  position: PlayerPosition;
  aiPersonality?: AIPersonality;
  memory: PlayerMemory;
}

export type GamePhase = 'waiting' | 'pre_flop' | 'flop' | 'turn' | 'river' | 'showdown' | 'complete';

export interface GameAction {
  playerId: number;
  action: ActionType;
  amount: number;
  timestamp: number;
}

export interface PotSplit {
  winners: number[];
  amount: number;
}

export interface GameState {
  phase: GamePhase;
  deck: Card[];
  communityCards: Card[];
  players: Player[];
  pot: number;
  sidePots: PotSplit[];
  dealerIndex: number;
  currentActorIndex: number;
  highestBet: number;
  minimumRaise: number;
  actions: GameAction[];
  log: string[];
  currentBetRound: number;
  isHeadsUp: boolean;
}
