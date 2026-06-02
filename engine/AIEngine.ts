import { Card, AIPersonality, AIPersonalityConfig, PlayerMemory, ActionType } from '../define';
import { PokerEngine } from './PokerEngine';
import { HandEvaluation } from '../define';

export interface AIDecision {
  action: ActionType;
  amount: number;
  reasoning: string;
}

export const PERSONALITY_CONFIGS: Record<AIPersonality, AIPersonalityConfig> = {
  [AIPersonality.TIGHT_WEAK]: {
    type: AIPersonality.TIGHT_WEAK,
    vpip: 0.15,
    pfr: 0.08,
    threeBet: 0.02,
    cbet: 0.1,
    foldToCbet: 0.95,
    aggressionFactor: 0.2,
    tiltThreshold: 3,
    tiltMultiplier: 1.2
  },
  [AIPersonality.LOOSE_AGGRESSIVE]: {
    type: AIPersonality.LOOSE_AGGRESSIVE,
    vpip: 0.35,
    pfr: 0.25,
    threeBet: 0.15,
    cbet: 0.6,
    foldToCbet: 0.4,
    aggressionFactor: 1.5,
    tiltThreshold: 5,
    tiltMultiplier: 1.3
  },
  [AIPersonality.CRAFTY]: {
    type: AIPersonality.CRAFTY,
    vpip: 0.25,
    pfr: 0.18,
    threeBet: 0.12,
    cbet: 0.45,
    foldToCbet: 0.5,
    aggressionFactor: 1.0,
    tiltThreshold: 4,
    tiltMultiplier: 1.15
  },
  [AIPersonality.CALLING_STATION]: {
    type: AIPersonality.CALLING_STATION,
    vpip: 0.4,
    pfr: 0.05,
    threeBet: 0.01,
    cbet: 0.05,
    foldToCbet: 0.15,
    aggressionFactor: 0.3,
    tiltThreshold: 2,
    tiltMultiplier: 1.4
  }
};

export class AIEngine {
  private personality: AIPersonality;
  private config: AIPersonalityConfig;
  private memory: PlayerMemory;
  private handStrength: number = 0;
  private boardTexture: 'dry' | 'wet' | 'monotone' = 'dry';

  constructor(personality: AIPersonality, memory: PlayerMemory) {
    this.personality = personality;
    this.config = PERSONALITY_CONFIGS[personality];
    this.memory = memory;
  }

  makeDecision(
    hand: Card[],
    communityCards: Card[],
    currentBet: number,
    highestBet: number,
    pot: number,
    chips: number,
    isPreFlop: boolean,
    position: 'early' | 'middle' | 'late' | 'btn'
  ): AIDecision {
    this.evaluateHandStrength(hand, communityCards, isPreFlop);
    this.analyzeBoardTexture(communityCards);
    
    const adjustedHandStrength = this.applyTiltModifier(this.handStrength);
    
    const callAmount = highestBet - currentBet;
    const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;
    const impliedOdds = this.calculateImpliedOdds(adjustedHandStrength, pot, callAmount);
    
    const decision = this.decideAction(
      adjustedHandStrength,
      callAmount,
      potOdds,
      impliedOdds,
      chips,
      pot,
      isPreFlop,
      position
    );
    
    return decision;
  }

  private evaluateHandStrength(hand: Card[], communityCards: Card[], isPreFlop: boolean): void {
    if (isPreFlop) {
      this.handStrength = this.evaluatePreFlopHand(hand);
    } else {
      const evaluation = PokerEngine.evaluateBestHand(hand, communityCards);
      this.handStrength = this.convertEvaluationToStrength(evaluation);
    }
  }

  private evaluatePreFlopHand(hand: Card[]): number {
    const [c1, c2] = hand;
    const isPair = c1.rank === c2.rank;
    const isSuited = c1.suit === c2.suit;
    const highRank = Math.max(c1.rank, c2.rank);
    const lowRank = Math.min(c1.rank, c2.rank);

    let strength = 0;

    if (isPair) {
      if (highRank >= 12) strength = 0.9;
      else if (highRank >= 10) strength = 0.75;
      else if (highRank >= 8) strength = 0.6;
      else strength = 0.45;
    } else {
      if (highRank === 14) {
        if (lowRank >= 12 || (lowRank >= 10 && isSuited)) strength = 0.85;
        else if (lowRank >= 8 || isSuited) strength = 0.65;
        else strength = 0.4;
      } else if (highRank >= 12) {
        if (lowRank >= 10 || isSuited) strength = 0.55;
        else strength = 0.35;
      } else if (highRank >= 10) {
        if (isSuited && lowRank >= 8) strength = 0.45;
        else strength = 0.25;
      } else {
        strength = isSuited ? 0.15 : 0.08;
      }
    }

    return strength;
  }

  private convertEvaluationToStrength(evaluation: HandEvaluation): number {
    const rankStrengths: Record<number, number> = {
      1: 0.05,
      2: 0.15,
      3: 0.25,
      4: 0.4,
      5: 0.55,
      6: 0.65,
      7: 0.8,
      8: 0.92,
      9: 0.98,
      10: 1.0
    };

    const baseStrength = rankStrengths[evaluation.rank] || 0.05;
    const kickerBonus = evaluation.kickers.length > 0 
      ? (evaluation.kickers[0] - 2) / 52 
      : 0;

    return Math.min(1, baseStrength + kickerBonus * 0.1);
  }

  private analyzeBoardTexture(communityCards: Card[]): void {
    if (communityCards.length < 3) {
      this.boardTexture = 'dry';
      return;
    }

    const suits = communityCards.map(c => c.suit);
    const suitCounts: Record<string, number> = {};
    suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
    
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    
    if (maxSuitCount >= 3) {
      this.boardTexture = 'monotone';
      return;
    }

    const ranks = communityCards.map(c => c.rank).sort((a, b) => b - a);
    let hasStraightDraw = false;
    
    for (let i = 0; i < ranks.length - 2; i++) {
      if (ranks[i] - ranks[i + 2] <= 3) {
        hasStraightDraw = true;
        break;
      }
    }

    this.boardTexture = hasStraightDraw ? 'wet' : 'dry';
  }

  private calculateImpliedOdds(strength: number, pot: number, callAmount: number): number {
    if (callAmount <= 0) return 1;
    
    const expectedValue = strength * (pot + callAmount * 2) - callAmount;
    return expectedValue / callAmount;
  }

  private applyTiltModifier(strength: number): number {
    if (!this.memory.isTilted) return strength;
    
    const tiltBonus = this.config.tiltMultiplier - 1;
    const adjusted = strength + tiltBonus * (1 - strength) * 0.5;
    
    return Math.min(1, adjusted);
  }

  private decideAction(
    strength: number,
    callAmount: number,
    potOdds: number,
    impliedOdds: number,
    chips: number,
    pot: number,
    _isPreFlop: boolean,
    position: 'early' | 'middle' | 'late' | 'btn'
  ): AIDecision {
    const shouldBluff = this.shouldBluff(strength, pot, position);
    const adjustedStrength = shouldBluff ? 0.7 + Math.random() * 0.3 : strength;

    const isFavorable = adjustedStrength > potOdds || impliedOdds > 0;
    
    if (callAmount === 0) {
      if (this.shouldCheckRaise(adjustedStrength, pot, position)) {
        const raiseAmount = this.calculateRaiseAmount(pot, chips, position);
        return { action: 'raise', amount: raiseAmount, reasoning: this.getRaiseReason(adjustedStrength) };
      }
      return { action: 'check', amount: 0, reasoning: '过牌观望' };
    }

    if (!isFavorable && this.shouldFold(adjustedStrength, callAmount, chips)) {
      return { action: 'fold', amount: 0, reasoning: this.getFoldReason(adjustedStrength) };
    }

    if (this.shouldRaise(adjustedStrength, callAmount, pot, chips, position)) {
      const raiseAmount = this.calculateRaiseAmount(pot, chips, position);
      return { action: 'raise', amount: raiseAmount, reasoning: this.getRaiseReason(adjustedStrength) };
    }

    if (callAmount >= chips) {
      return { action: 'all_in', amount: chips, reasoning: '筹码不足，全押' };
    }

    return { action: 'call', amount: callAmount, reasoning: this.getCallReason(adjustedStrength) };
  }

  private shouldFold(strength: number, _callAmount: number, _chips: number): boolean {
    const baseFoldChance = 1 - strength;
    
    switch (this.personality) {
      case AIPersonality.TIGHT_WEAK:
        return baseFoldChance > 0.3;
      case AIPersonality.LOOSE_AGGRESSIVE:
        return baseFoldChance > 0.7;
      case AIPersonality.CRAFTY:
        return baseFoldChance > 0.5;
      case AIPersonality.CALLING_STATION:
        return baseFoldChance > 0.9;
      default:
        return baseFoldChance > 0.5;
    }
  }

  private shouldRaise(strength: number, _callAmount: number, _pot: number, _chips: number, position: string): boolean {
    const raiseThreshold = this.getRaiseThreshold(position);
    
    if (strength >= raiseThreshold) {
      return Math.random() < this.config.aggressionFactor;
    }

    if (this.personality === AIPersonality.LOOSE_AGGRESSIVE && strength > 0.3) {
      return Math.random() < 0.3;
    }

    if (this.personality === AIPersonality.CRAFTY && this.boardTexture === 'wet' && strength < 0.3) {
      return Math.random() < 0.25;
    }

    return false;
  }

  private shouldCheckRaise(strength: number, _pot: number, position: string): boolean {
    const raiseThreshold = this.getRaiseThreshold(position);
    return strength >= raiseThreshold && Math.random() < this.config.aggressionFactor * 0.5;
  }

  private shouldBluff(strength: number, _pot: number, position: string): boolean {
    if (this.personality === AIPersonality.CRAFTY && strength < 0.2) {
      return Math.random() < 0.15;
    }
    
    if (this.personality === AIPersonality.LOOSE_AGGRESSIVE && strength < 0.15 && position === 'btn') {
      return Math.random() < 0.1;
    }
    
    return false;
  }

  private getRaiseThreshold(position: string): number {
    const positionBonus: Record<string, number> = {
      early: 0.85,
      middle: 0.75,
      late: 0.65,
      btn: 0.6
    };
    
    return positionBonus[position] || 0.75;
  }

  private calculateRaiseAmount(pot: number, chips: number, position: string): number {
    const positionMultiplier: Record<string, number> = {
      early: 1.5,
      middle: 2,
      late: 2.5,
      btn: 3
    };
    
    const multiplier = positionMultiplier[position] || 2;
    const baseRaise = pot * multiplier * this.config.aggressionFactor;
    const maxRaise = Math.min(baseRaise, chips);
    
    return Math.max(40, Math.floor(maxRaise / 10) * 10);
  }

  private getFoldReason(_strength: number): string {
    const reasons = {
      [AIPersonality.TIGHT_WEAK]: ['手牌太弱', '不敢跟注', '风险太高'],
      [AIPersonality.LOOSE_AGGRESSIVE]: ['不值得', '等更好的牌', '这次算了'],
      [AIPersonality.CRAFTY]: ['时机不对', '诈唬风险大', '保留筹码'],
      [AIPersonality.CALLING_STATION]: ['实在不行了', '无奈弃牌', '下次再来']
    };
    
    return reasons[this.personality][Math.floor(Math.random() * reasons[this.personality].length)];
  }

  private getCallReason(_strength: number): string {
    const reasons = {
      [AIPersonality.TIGHT_WEAK]: ['跟注看看', '牌还可以', '试试运气'],
      [AIPersonality.LOOSE_AGGRESSIVE]: ['跟你！', '看看你的牌', '不怕'],
      [AIPersonality.CRAFTY]: ['有意思', '看看会怎样', '跟注'],
      [AIPersonality.CALLING_STATION]: ['必须跟', '不能弃', '跟到底']
    };
    
    return reasons[this.personality][Math.floor(Math.random() * reasons[this.personality].length)];
  }

  private getRaiseReason(_strength: number): string {
    const reasons = {
      [AIPersonality.TIGHT_WEAK]: ['强牌！', '加注', '你怕了吗'],
      [AIPersonality.LOOSE_AGGRESSIVE]: ['压上！', '来啊！', '比比看'],
      [AIPersonality.CRAFTY]: ['跟吗？', '试试看', '加注'],
      [AIPersonality.CALLING_STATION]: ['难得好牌', '加注！', '冲！']
    };
    
    return reasons[this.personality][Math.floor(Math.random() * reasons[this.personality].length)];
  }

  updateMemory(result: 'win' | 'lose', amount: number): PlayerMemory {
    this.memory.handsPlayed++;
    
    if (result === 'win') {
      this.memory.handsWon++;
      this.memory.totalWon += amount;
      this.memory.isTilted = false;
      this.memory.tiltHands = 0;
    } else {
      this.memory.tiltHands++;
      if (this.memory.tiltHands >= this.config.tiltThreshold) {
        this.memory.isTilted = true;
      }
    }
    
    return { ...this.memory };
  }

  getThinkTime(): number {
    const baseTime = 1000;
    
    if (this.handStrength > 0.8) {
      return Math.max(1000, baseTime * (this.personality === AIPersonality.TIGHT_WEAK ? 0.5 : 0.7));
    }
    
    if (this.handStrength < 0.3) {
      return baseTime * (this.personality === AIPersonality.CRAFTY ? 1.8 : 1.5);
    }
    
    return baseTime + Math.random() * 1000;
  }
}
