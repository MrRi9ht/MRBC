import { Card, Suit, Rank, HandRank, HandEvaluation } from '../define';

interface RankCount {
  rank: number;
  count: number;
}

export class PokerEngine {
  private static readonly TIER_BASE = 1_000_000_000_000;
  private static readonly KICKER_WEIGHTS = [100, 10000, 1000000, 100000000, 10000000000];

  static createDeck(): Card[] {
    const deck: Card[] = [];
    const suits = [Suit.Spades, Suit.Hearts, Suit.Clubs, Suit.Diamonds];
    for (const suit of suits) {
      for (let r = Rank.Two; r <= Rank.Ace; r++) {
        deck.push({ suit, rank: r as Rank, id: `${suit}-${r}` });
      }
    }
    return deck;
  }

  static shuffle(deck: Card[]): Card[] {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  }

  static evaluateBestHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
    const allCards = [...holeCards, ...communityCards];
    if (allCards.length < 5) {
      return this.evaluateIncompleteHand(allCards);
    }

    const combinations = this.getCombinations(allCards, 5);
    let bestEval: HandEvaluation | null = null;

    for (const combo of combinations) {
      const currentEval = this.evaluateFiveCards(combo);
      if (!bestEval || this.compareHands(currentEval, bestEval) > 0) {
        bestEval = currentEval;
      }
    }
    return bestEval!;
  }

  private static getCombinations(cards: Card[], k: number): Card[][] {
    if (k === 0) return [[]];
    if (cards.length === 0) return [];
    if (k > cards.length) return [];

    const result: Card[][] = [];

    const generate = (start: number, current: Card[]) => {
      if (current.length === k) {
        result.push([...current]);
        return;
      }
      for (let i = start; i < cards.length; i++) {
        current.push(cards[i]);
        generate(i + 1, current);
        current.pop();
      }
    };

    generate(0, []);
    return result;
  }

  private static evaluateIncompleteHand(cards: Card[]): HandEvaluation {
    const sorted = [...cards].sort((a, b) => b.rank - a.rank);
    const ranks = sorted.map(c => c.rank);
    const kickerScore = this.calculateKickerScoreFromRanks(ranks);

    return {
      rank: HandRank.HighCard,
      score: HandRank.HighCard * this.TIER_BASE + kickerScore,
      name: "High Card",
      kickers: ranks
    };
  }

  private static evaluateFiveCards(cards: Card[]): HandEvaluation {
    const sorted = [...cards].sort((a, b) => b.rank - a.rank);
    const ranks = sorted.map(c => c.rank);
    const suits = sorted.map(c => c.suit);

    const isFlush = suits.every(s => s === suits[0]);
    const straightInfo = this.checkStraight(ranks);

    const rankCounts = this.getRankCounts(ranks);
    const counts = rankCounts.map(rc => rc.count);
    const hasFour = counts.includes(4);
    const hasThree = counts.includes(3);
    const pairCount = counts.filter(c => c === 2).length;

    let handRank = HandRank.HighCard;
    let name = "High Card";
    let score: number;
    let kickers: number[];

    if (isFlush && straightInfo.isStraight) {
      const highCard = straightInfo.highCard;
      if (highCard === 14) {
        handRank = HandRank.RoyalFlush;
        name = "Royal Flush";
      } else {
        handRank = HandRank.StraightFlush;
        name = `Straight Flush (${this.getRankName(highCard)} High)`;
      }
      score = handRank * this.TIER_BASE + highCard;
      kickers = [highCard];
    } else if (hasFour) {
      handRank = HandRank.FourOfAKind;
      name = `Four of a Kind (${this.getRankName(rankCounts[0].rank)}s)`;
      score = this.calculateQuadsScore(rankCounts);
      kickers = rankCounts.map(rc => rc.rank);
    } else if (hasThree && pairCount >= 1) {
      handRank = HandRank.FullHouse;
      const tripRank = rankCounts.find(rc => rc.count === 3)!.rank;
      const pairRank = rankCounts.find(rc => rc.count >= 2 && rc.rank !== tripRank)!.rank;
      name = `Full House (${this.getRankName(tripRank)}s over ${this.getRankName(pairRank)}s)`;
      score = this.calculateFullHouseScore(rankCounts);
      kickers = rankCounts.map(rc => rc.rank);
    } else if (isFlush) {
      handRank = HandRank.Flush;
      name = `${this.getFlushName(ranks)} Flush`;
      score = this.calculateFlushScore(ranks);
      kickers = ranks;
    } else if (straightInfo.isStraight) {
      handRank = HandRank.Straight;
      const highCard = straightInfo.highCard;
      name = `Straight (${this.getRankName(highCard)} High)`;
      score = handRank * this.TIER_BASE + highCard;
      kickers = [highCard];
    } else if (hasThree) {
      handRank = HandRank.ThreeOfAKind;
      name = `Three of a Kind (${this.getRankName(rankCounts[0].rank)}s)`;
      score = this.calculateTripsScore(rankCounts);
      kickers = rankCounts.map(rc => rc.rank);
    } else if (pairCount === 2) {
      handRank = HandRank.TwoPair;
      const highPair = rankCounts.find(rc => rc.count === 2)!.rank;
      const lowPair = rankCounts.find(rc => rc.count === 2 && rc.rank !== highPair)!.rank;
      name = `Two Pair (${this.getRankName(highPair)}s and ${this.getRankName(lowPair)}s)`;
      score = this.calculateTwoPairScore(rankCounts);
      kickers = rankCounts.map(rc => rc.rank);
    } else if (pairCount === 1) {
      handRank = HandRank.OnePair;
      name = `One Pair (${this.getRankName(rankCounts[0].rank)}s)`;
      score = this.calculatePairScore(rankCounts);
      kickers = rankCounts.map(rc => rc.rank);
    } else {
      handRank = HandRank.HighCard;
      name = `High Card (${this.getRankName(ranks[0])})`;
      score = this.calculateHighCardScore(ranks);
      kickers = ranks;
    }

    return { rank: handRank, score, name, kickers };
  }

  private static checkStraight(ranks: number[]): { isStraight: boolean; highCard: number } {
    if (ranks.length < 5) {
      return { isStraight: false, highCard: 0 };
    }

    let isStraight = true;
    for (let i = 0; i < 4; i++) {
      if (ranks[i] - ranks[i + 1] !== 1) {
        isStraight = false;
        break;
      }
    }

    if (isStraight) {
      return { isStraight: true, highCard: ranks[0] };
    }

    if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
      return { isStraight: true, highCard: 5 };
    }

    return { isStraight: false, highCard: 0 };
  }

  private static getRankCounts(ranks: number[]): RankCount[] {
    const countMap: Record<number, number> = {};
    ranks.forEach(r => {
      countMap[r] = (countMap[r] || 0) + 1;
    });

    return Object.entries(countMap)
      .map(([rank, count]) => ({ rank: parseInt(rank), count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.rank - a.rank;
      });
  }

  private static calculateQuadsScore(rankCounts: RankCount[]): number {
    const quads = rankCounts.find(rc => rc.count === 4)!.rank;
    const kicker = rankCounts.find(rc => rc.count === 1)!.rank;
    return HandRank.FourOfAKind * this.TIER_BASE + quads * 100 + kicker;
  }

  private static calculateFullHouseScore(rankCounts: RankCount[]): number {
    const trips = rankCounts.find(rc => rc.count === 3)!.rank;
    const pair = rankCounts.find(rc => rc.count >= 2 && rc.count !== 3)!.rank;
    return HandRank.FullHouse * this.TIER_BASE + trips * 100 + pair;
  }

  private static calculateFlushScore(ranks: number[]): number {
    let score = HandRank.Flush * this.TIER_BASE;
    for (let i = 0; i < 5; i++) {
      score += ranks[i] * this.KICKER_WEIGHTS[4 - i];
    }
    return score;
  }

  private static calculateTripsScore(rankCounts: RankCount[]): number {
    const trips = rankCounts.find(rc => rc.count === 3)!.rank;
    const kickers = rankCounts.filter(rc => rc.count === 1).map(rc => rc.rank);
    let score = HandRank.ThreeOfAKind * this.TIER_BASE + trips * 10000;
    for (let i = 0; i < kickers.length; i++) {
      score += kickers[i] * this.KICKER_WEIGHTS[1 - i];
    }
    return score;
  }

  private static calculateTwoPairScore(rankCounts: RankCount[]): number {
    const pairs = rankCounts.filter(rc => rc.count === 2).map(rc => rc.rank).sort((a, b) => b - a);
    const kicker = rankCounts.find(rc => rc.count === 1)!.rank;
    return HandRank.TwoPair * this.TIER_BASE + pairs[0] * 10000 + pairs[1] * 100 + kicker;
  }

  private static calculatePairScore(rankCounts: RankCount[]): number {
    const pair = rankCounts.find(rc => rc.count === 2)!.rank;
    const kickers = rankCounts.filter(rc => rc.count === 1).map(rc => rc.rank).sort((a, b) => b - a);
    let score = HandRank.OnePair * this.TIER_BASE + pair * 1000000;
    for (let i = 0; i < kickers.length; i++) {
      score += kickers[i] * this.KICKER_WEIGHTS[2 - i];
    }
    return score;
  }

  private static calculateHighCardScore(ranks: number[]): number {
    let score = HandRank.HighCard * this.TIER_BASE;
    for (let i = 0; i < 5; i++) {
      score += ranks[i] * this.KICKER_WEIGHTS[4 - i];
    }
    return score;
  }

  private static calculateKickerScoreFromRanks(ranks: number[]): number {
    let score = 0;
    for (let i = 0; i < ranks.length; i++) {
      score += ranks[i] * this.KICKER_WEIGHTS[4 - i];
    }
    return score;
  }

  static compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
    if (hand1.score > hand2.score) return 1;
    if (hand1.score < hand2.score) return -1;

    if (hand1.rank !== hand2.rank) {
      return hand1.rank > hand2.rank ? 1 : -1;
    }

    const maxKickers = Math.max(hand1.kickers.length, hand2.kickers.length);
    for (let i = 0; i < maxKickers; i++) {
      const kicker1 = hand1.kickers[i] || 0;
      const kicker2 = hand2.kickers[i] || 0;
      if (kicker1 !== kicker2) {
        return kicker1 > kicker2 ? 1 : -1;
      }
    }

    return 0;
  }

  private static getRankName(rank: number): string {
    const names: Record<number, string> = {
      2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
      10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A'
    };
    return names[rank] || String(rank);
  }

  private static getFlushName(ranks: number[]): string {
    return this.getRankName(ranks[0]);
  }

  static dealCards(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
    const dealt = deck.slice(0, count);
    const remaining = deck.slice(count);
    return { dealt, remaining };
  }

  static getHandRankName(rank: HandRank): string {
    const names: Record<number, string> = {
      [HandRank.HighCard]: "高牌",
      [HandRank.OnePair]: "一对",
      [HandRank.TwoPair]: "两对",
      [HandRank.ThreeOfAKind]: "三条",
      [HandRank.Straight]: "顺子",
      [HandRank.Flush]: "同花",
      [HandRank.FullHouse]: "葫芦",
      [HandRank.FourOfAKind]: "四条",
      [HandRank.StraightFlush]: "同花顺",
      [HandRank.RoyalFlush]: "皇家同花顺"
    };
    return names[rank] || "未知";
  }
}