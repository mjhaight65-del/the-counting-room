'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Card from './Card'
import CountTracker from './CountTracker'
import { handValue } from '@/lib/deck'
import type { Card as CardType } from '@/lib/deck'

interface Player {
  user_id: string
  username: string
  chips: number
  hand: CardType[]
  bet: number
  status: 'waiting' | 'playing' | 'stand' | 'bust' | 'blackjack' | 'win' | 'lose' | 'push'
  isCurrentTurn: boolean
}

interface BlackjackTableProps {
  dealerHand: CardType[]
  players: Player[]
  currentUserId: string
  runningCount: number
  decksRemaining: number
  gamePhase: 'betting' | 'playing' | 'dealer' | 'results'
  onHit?: () => void
  onStand?: () => void
  onDouble?: () => void
  onBet?: (amount: number) => void
  showCountTracker?: boolean
}

const STATUS_LABELS: Record<Player['status'], string> = {
  waiting: '',
  playing: '',
  stand: 'STAND',
  bust: 'BUST!',
  blackjack: 'BJ! 🎉',
  win: 'WIN! 🤑',
  lose: 'LOST',
  push: 'PUSH',
}

const STATUS_COLORS: Record<Player['status'], string> = {
  waiting: '',
  playing: 'text-amber-400',
  stand: 'text-blue-400',
  bust: 'text-red-400',
  blackjack: 'text-yellow-400',
  win: 'text-emerald-400',
  lose: 'text-red-400',
  push: 'text-slate-400',
}

export default function BlackjackTable({
  dealerHand,
  players,
  currentUserId,
  runningCount,
  decksRemaining,
  gamePhase,
  onHit,
  onStand,
  onDouble,
  onBet,
  showCountTracker = true,
}: BlackjackTableProps) {
  const currentPlayer = players.find(p => p.user_id === currentUserId)
  const dealerValue = handValue(dealerHand)

  const canAct = gamePhase === 'playing' && currentPlayer?.isCurrentTurn && currentPlayer?.status === 'playing'

  return (
    <div className="relative w-full rounded-3xl overflow-hidden" style={{
      background: 'radial-gradient(ellipse at center, #1a3d1a 0%, #0f2a0f 60%, #0a1a0a 100%)',
      boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.8)',
    }}>
      {/* Felt texture overlay */}
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23000000\' fill-opacity=\'0.4\'/%3E%3C/svg%3E")' }}
      />

      {/* Table border */}
      <div className="absolute inset-0 rounded-3xl border-2 border-amber-700/30 pointer-events-none" />

      <div className="relative p-4 md:p-6 space-y-4">
        {/* Count Tracker + Phase indicator */}
        <div className="flex items-start justify-between gap-3">
          <div>
            {gamePhase === 'betting' && (
              <div className="bg-amber-700/20 border border-amber-700/40 rounded-lg px-3 py-1.5">
                <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Place Your Bets</span>
              </div>
            )}
            {gamePhase === 'playing' && (
              <div className="bg-emerald-800/30 border border-emerald-700/40 rounded-lg px-3 py-1.5">
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  {currentPlayer?.isCurrentTurn ? 'Your Turn' : 'Waiting...'}
                </span>
              </div>
            )}
            {gamePhase === 'dealer' && (
              <div className="bg-purple-900/30 border border-purple-700/40 rounded-lg px-3 py-1.5">
                <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">Dealer's Turn</span>
              </div>
            )}
          </div>
          {showCountTracker && (
            <CountTracker runningCount={runningCount} decksRemaining={decksRemaining} compact />
          )}
        </div>

        {/* Dealer hand */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-slate-400 text-xs uppercase tracking-wider">Dealer</span>
            {gamePhase !== 'betting' && dealerHand.length > 0 && (
              <span className="text-slate-400 text-xs font-mono">
                {dealerValue.value}{dealerValue.soft ? ' soft' : ''}
              </span>
            )}
          </div>
          <div className="flex justify-center gap-2 min-h-[80px] items-center">
            <AnimatePresence>
              {dealerHand.map((card, i) => (
                <Card key={`dealer-${i}`} card={card} size="md" animate delay={i * 0.1} />
              ))}
            </AnimatePresence>
            {dealerHand.length === 0 && (
              <div className="w-14 h-20 rounded-lg border border-dashed border-green-700/40" />
            )}
          </div>
        </div>

        {/* Table line */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
          <div className="relative bg-transparent px-3 py-1 text-amber-700/50 text-xs tracking-[0.5em] uppercase font-light">
            The Counting Room
          </div>
        </div>

        {/* Player hands */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((player) => {
            const pv = handValue(player.hand)
            const isMe = player.user_id === currentUserId
            const statusLabel = STATUS_LABELS[player.status]
            const statusColor = STATUS_COLORS[player.status]

            return (
              <div
                key={player.user_id}
                className={`relative rounded-xl border p-3 space-y-2 transition-all ${
                  player.isCurrentTurn
                    ? 'border-amber-500/60 bg-amber-900/20 shadow-lg shadow-amber-900/20'
                    : isMe
                      ? 'border-emerald-700/40 bg-emerald-900/10'
                      : 'border-white/5 bg-black/20'
                }`}
              >
                {/* Player info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      isMe ? 'bg-emerald-700' : 'bg-slate-700'
                    }`}>
                      {player.username[0].toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-300 truncate max-w-[80px]">
                      {isMe ? 'You' : player.username}
                    </span>
                  </div>
                  <span className="text-amber-400 font-mono text-xs">${player.chips.toLocaleString()}</span>
                </div>

                {/* Cards */}
                <div className="flex gap-1 min-h-[56px] items-center flex-wrap">
                  {player.hand.map((card, i) => (
                    <Card key={i} card={card} size="sm" animate delay={i * 0.1} />
                  ))}
                  {player.hand.length === 0 && (
                    <div className="w-10 h-14 rounded border border-dashed border-white/10" />
                  )}
                </div>

                {/* Hand value + status */}
                <div className="flex items-center justify-between">
                  {player.hand.length > 0 && (
                    <span className="text-slate-400 text-xs font-mono">
                      {pv.value}{pv.soft ? 's' : ''}
                    </span>
                  )}
                  {statusLabel && (
                    <span className={`${statusColor} text-xs font-bold ml-auto`}>{statusLabel}</span>
                  )}
                  {player.bet > 0 && gamePhase !== 'betting' && (
                    <span className="text-amber-500/70 text-xs font-mono ml-1">bet: ${player.bet}</span>
                  )}
                </div>

                {/* Turn indicator */}
                {player.isCurrentTurn && (
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full"
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Action buttons */}
        {canAct && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center gap-3 pt-2"
          >
            <button
              onClick={onHit}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
            >
              Hit
            </button>
            <button
              onClick={onStand}
              className="bg-red-800 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-red-900/40 transition-all active:scale-95"
            >
              Stand
            </button>
            {currentPlayer?.hand.length === 2 && (
              <button
                onClick={onDouble}
                className="bg-yellow-700 hover:bg-yellow-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-yellow-900/40 transition-all active:scale-95"
              >
                Double
              </button>
            )}
          </motion.div>
        )}

        {/* Betting UI */}
        {gamePhase === 'betting' && currentPlayer && onBet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex gap-2 flex-wrap justify-center">
              {[10, 25, 50, 100, 250].map(amount => (
                <button
                  key={amount}
                  onClick={() => onBet(amount)}
                  disabled={amount > currentPlayer.chips}
                  className="bg-amber-800/60 hover:bg-amber-700/70 disabled:opacity-30 text-amber-200 font-bold px-4 py-2 rounded-xl text-sm transition-all active:scale-95 border border-amber-700/40"
                >
                  ${amount}
                </button>
              ))}
            </div>
            {currentPlayer.bet > 0 && (
              <div className="text-amber-400 text-sm font-mono">
                Current bet: <span className="font-bold text-amber-300">${currentPlayer.bet}</span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
