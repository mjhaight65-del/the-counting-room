import type { Rank } from './deck'

export type HiLoValue = -1 | 0 | 1

export function getHiLoValue(rank: Rank): HiLoValue {
  if (['2', '3', '4', '5', '6'].includes(rank)) return 1
  if (['7', '8', '9'].includes(rank)) return 0
  return -1 // 10, J, Q, K, A
}

export function getHiLoLabel(value: HiLoValue): string {
  if (value === 1) return '+1'
  if (value === -1) return '-1'
  return '0'
}

export function getHiLoColor(value: HiLoValue): string {
  if (value === 1) return 'text-emerald-400'
  if (value === -1) return 'text-red-400'
  return 'text-yellow-400'
}

export function getCountAdvantage(runningCount: number, decksRemaining: number): string {
  const trueCount = decksRemaining > 0 ? runningCount / decksRemaining : runningCount
  if (trueCount <= -2) return 'Strong House Edge'
  if (trueCount < 0) return 'House Favored'
  if (trueCount === 0) return 'Neutral'
  if (trueCount <= 2) return 'Slight Player Edge'
  if (trueCount <= 4) return 'Player Favored'
  return 'Strong Player Edge'
}

export function getBetSizing(runningCount: number, decksRemaining: number): string {
  const trueCount = decksRemaining > 0 ? runningCount / decksRemaining : runningCount
  if (trueCount <= 0) return '1x (min bet)'
  if (trueCount <= 2) return '2x'
  if (trueCount <= 4) return '4x'
  return '8x (max bet)'
}

export const HILO_REFERENCE: Record<Rank, HiLoValue> = {
  '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
  '7': 0, '8': 0, '9': 0,
  '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1,
}
