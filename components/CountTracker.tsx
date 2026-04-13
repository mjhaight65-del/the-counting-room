'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { getCountAdvantage, getBetSizing } from '@/lib/hiloSystem'

interface CountTrackerProps {
  runningCount: number
  decksRemaining?: number
  showAdvantage?: boolean
  compact?: boolean
}

export default function CountTracker({
  runningCount,
  decksRemaining = 6,
  showAdvantage = true,
  compact = false
}: CountTrackerProps) {
  const advantage = getCountAdvantage(runningCount, decksRemaining)
  const betSizing = getBetSizing(runningCount, decksRemaining)

  const countColor = runningCount > 2
    ? 'text-emerald-400'
    : runningCount < -2
      ? 'text-red-400'
      : 'text-yellow-400'

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 border border-amber-700/30">
        <span className="text-amber-500/70 text-xs font-mono uppercase tracking-wider">Count</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={runningCount}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className={`${countColor} font-bold text-xl font-mono min-w-[3ch] text-center`}
          >
            {runningCount > 0 ? `+${runningCount}` : runningCount}
          </motion.span>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="bg-black/50 rounded-xl border border-amber-700/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-amber-500/70 text-xs font-mono uppercase tracking-widest">Running Count</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={runningCount}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className={`${countColor} font-bold text-3xl font-mono`}
          >
            {runningCount > 0 ? `+${runningCount}` : runningCount}
          </motion.span>
        </AnimatePresence>
      </div>

      {showAdvantage && (
        <>
          <div className="h-px bg-amber-700/20" />
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Advantage</span>
              <span className={countColor}>{advantage}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Bet Sizing</span>
              <span className="text-amber-400">{betSizing}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Decks Left</span>
              <span className="text-slate-300">~{decksRemaining}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
