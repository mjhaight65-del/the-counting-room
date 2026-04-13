import type { Rank } from './deck'

type Action = 'H' | 'S' | 'D' | 'P' | 'DS' // Hit, Stand, Double, Split, Double or Stand

// Basic strategy charts (dealer shows upcard)
// Hard totals
const HARD_TOTALS: Record<number, Record<string, Action>> = {
  8:  { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  9:  { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  10: { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'H', 'A': 'H' },
  11: { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'D', 'A': 'H' },
  12: { '2': 'H', '3': 'H', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  13: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  14: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  15: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  16: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  17: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  18: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  19: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  20: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
}

// Soft totals (Ace + card)
const SOFT_TOTALS: Record<number, Record<string, Action>> = {
  13: { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  14: { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  15: { '2': 'H', '3': 'H', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  16: { '2': 'H', '3': 'H', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  17: { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  18: { '2': 'DS', '3': 'DS', '4': 'DS', '5': 'DS', '6': 'DS', '7': 'S', '8': 'S', '9': 'H', '10': 'H', 'A': 'H' },
  19: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'DS', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  20: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
}

// Pairs
const PAIRS: Record<string, Record<string, Action>> = {
  'A': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', 'A': 'P' },
  '10': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  '9': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'S', '8': 'P', '9': 'P', '10': 'S', 'A': 'S' },
  '8': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', 'A': 'P' },
  '7': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '6': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '5': { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'H', 'A': 'H' },
  '4': { '2': 'H', '3': 'H', '4': 'H', '5': 'P', '6': 'P', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '3': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '2': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
}

export const ACTION_LABELS: Record<Action, string> = {
  'H': 'Hit',
  'S': 'Stand',
  'D': 'Double Down',
  'P': 'Split',
  'DS': 'Double (or Stand)',
}

export const ACTION_COLORS: Record<Action, string> = {
  'H': 'bg-emerald-500',
  'S': 'bg-red-500',
  'D': 'bg-yellow-500',
  'P': 'bg-blue-500',
  'DS': 'bg-orange-500',
}

function dealerKey(rank: Rank): string {
  if (['J', 'Q', 'K'].includes(rank)) return '10'
  return rank
}

export function getBasicStrategy(
  playerValue: number,
  soft: boolean,
  isPair: boolean,
  pairRank: Rank | null,
  dealerUpcard: Rank,
  canDouble: boolean
): { action: Action; label: string } {
  const dKey = dealerKey(dealerUpcard)
  let action: Action = 'H'

  if (isPair && pairRank) {
    const pKey = ['J', 'Q', 'K'].includes(pairRank) ? '10' : pairRank
    action = PAIRS[pKey]?.[dKey] || 'H'
  } else if (soft && SOFT_TOTALS[playerValue]) {
    action = SOFT_TOTALS[playerValue][dKey] || 'H'
  } else if (HARD_TOTALS[playerValue]) {
    action = HARD_TOTALS[playerValue][dKey] || 'H'
  } else if (playerValue >= 17) {
    action = 'S'
  }

  // If can't double, convert D to H
  if (!canDouble && (action === 'D' || action === 'DS')) {
    action = action === 'DS' ? 'S' : 'H'
  }

  return { action, label: ACTION_LABELS[action] }
}
