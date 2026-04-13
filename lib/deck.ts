export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
  faceDown?: boolean
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

export function createDeck(numDecks = 6): Card[] {
  const deck: Card[] = []
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank })
      }
    }
  }
  return shuffle(deck)
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function cardValue(rank: Rank): number {
  if (['J', 'Q', 'K'].includes(rank)) return 10
  if (rank === 'A') return 11
  return parseInt(rank)
}

export function handValue(cards: Card[]): { value: number; soft: boolean } {
  let total = 0
  let aces = 0
  for (const card of cards) {
    if (card.faceDown) continue
    if (card.rank === 'A') {
      aces++
      total += 11
    } else {
      total += cardValue(card.rank)
    }
  }
  let soft = aces > 0 && total <= 21
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  if (total > 21) soft = false
  return { value: total, soft }
}

export function isBust(cards: Card[]): boolean {
  return handValue(cards).value > 21
}

export function isBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) return false
  const { value } = handValue(cards)
  return value === 21
}

export function suitSymbol(suit: Suit): string {
  const symbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }
  return symbols[suit]
}

export function suitColor(suit: Suit): string {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-400' : 'text-white'
}
