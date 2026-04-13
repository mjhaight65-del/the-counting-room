'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import Card from '@/components/Card'
import CountTracker from '@/components/CountTracker'
import CheatSheet from '@/components/CheatSheet'
import { createDeck, handValue, isBust, isBlackjack, type Card as CardType } from '@/lib/deck'
import { getHiLoValue } from '@/lib/hiloSystem'
import { getBasicStrategy } from '@/lib/basicStrategy'
import { ArrowLeft, BookOpen, Eye, EyeOff, Lightbulb } from 'lucide-react'

type GamePhase = 'betting' | 'playing' | 'dealer' | 'results'

export default function GamePage() {
  const router = useRouter()
  const [deck, setDeck] = useState<CardType[]>(createDeck(6))
  const [dealerHand, setDealerHand] = useState<CardType[]>([])
  const [playerHand, setPlayerHand] = useState<CardType[]>([])
  const [chips, setChips] = useState(1000)
  const [bet, setBet] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('betting')
  const [runningCount, setRunningCount] = useState(0)
  const [showCount, setShowCount] = useState(true)
  const [showCheatSheet, setShowCheatSheet] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [result, setResult] = useState<string>('')
  const [message, setMessage] = useState('')

  const decksRemaining = Math.ceil(deck.length / 52)

  const countCard = useCallback((card: CardType) => {
    if (!card.faceDown) {
      setRunningCount(c => c + getHiLoValue(card.rank))
    }
  }, [])

  const drawCard = useCallback((faceDown = false): CardType => {
    const card = { ...deck[0], faceDown }
    setDeck(prev => prev.slice(1))
    if (!faceDown) setRunningCount(c => c + getHiLoValue(card.rank))
    return card
  }, [deck])

  const dealInitial = () => {
    if (bet === 0) { setMessage('Place a bet first!'); return }
    const newDeck = [...deck]

    const p1 = { ...newDeck[0] }; newDeck.splice(0, 1)
    const d1 = { ...newDeck[0] }; newDeck.splice(0, 1)
    const p2 = { ...newDeck[0] }; newDeck.splice(0, 1)
    const d2 = { ...newDeck[0], faceDown: true }; newDeck.splice(0, 1)

    setDeck(newDeck)
    setPlayerHand([p1, p2])
    setDealerHand([d1, d2])
    setRunningCount(c => c + getHiLoValue(p1.rank) + getHiLoValue(d1.rank) + getHiLoValue(p2.rank))
    setMessage('')

    if (isBlackjack([p1, p2])) {
      setPhase('dealer')
      setTimeout(() => finishDealer([d1, d2], [p1, p2], newDeck, true), 600)
    } else {
      setPhase('playing')
    }
  }

  const hit = () => {
    if (deck.length === 0) return
    const card = { ...deck[0] }
    const newDeck = deck.slice(1)
    setDeck(newDeck)
    setRunningCount(c => c + getHiLoValue(card.rank))
    const newHand = [...playerHand, card]
    setPlayerHand(newHand)

    if (isBust(newHand)) {
      setPhase('results')
      setResult('bust')
      setChips(c => c - bet)
      setMessage('Bust! Dealer wins.')
    }
  }

  const stand = () => {
    setPhase('dealer')
    setTimeout(() => finishDealer(dealerHand, playerHand, deck, false), 400)
  }

  const double = () => {
    if (chips < bet) return
    const card = { ...deck[0] }
    const newDeck = deck.slice(1)
    setDeck(newDeck)
    setRunningCount(c => c + getHiLoValue(card.rank))
    const newHand = [...playerHand, card]
    setPlayerHand(newHand)
    setBet(b => b * 2)

    if (isBust(newHand)) {
      setPhase('results')
      setResult('bust')
      setChips(c => c - bet * 2)
      setMessage('Bust! Dealer wins.')
    } else {
      setPhase('dealer')
      setTimeout(() => finishDealer(dealerHand, newHand, newDeck, false), 400)
    }
  }

  const finishDealer = async (dHand: CardType[], pHand: CardType[], currentDeck: CardType[], playerHasBlackjack: boolean) => {
    // Reveal hole card
    const revealed = dHand.map(c => ({ ...c, faceDown: false }))
    setDealerHand(revealed)
    setRunningCount(c => c + getHiLoValue(dHand[dHand.length - 1].rank))

    let finalDealerHand: CardType[] = [...revealed]
    let workingDeck = [...currentDeck]

    // Dealer draws to 17
    while (handValue(finalDealerHand).value < 17 && workingDeck.length > 0) {
      await new Promise(r => setTimeout(r, 600))
      const card = { ...workingDeck[0] }
      workingDeck = workingDeck.slice(1)
      setRunningCount(c => c + getHiLoValue(card.rank))
      finalDealerHand = [...finalDealerHand, card]
      setDealerHand([...finalDealerHand])
    }

    setDeck(workingDeck)

    const pv = handValue(pHand).value
    const dv = handValue(finalDealerHand).value
    const pBust = isBust(pHand)
    const dBust = isBust(finalDealerHand)
    const pBJ = isBlackjack(pHand)
    const dBJ = isBlackjack(finalDealerHand)

    let outcome = ''
    let chipChange = 0

    if (pBust) {
      outcome = 'bust'
      chipChange = -bet
      setMessage('Bust! You lose.')
    } else if (pBJ && !dBJ) {
      outcome = 'blackjack'
      chipChange = Math.floor(bet * 1.5)
      setMessage('Blackjack! You win 3:2! 🎉')
    } else if (dBust) {
      outcome = 'win'
      chipChange = bet
      setMessage('Dealer busts! You win! 🤑')
    } else if (pBJ && dBJ) {
      outcome = 'push'
      chipChange = 0
      setMessage('Push — both blackjack!')
    } else if (pv > dv) {
      outcome = 'win'
      chipChange = bet
      setMessage('You win! 🤑')
    } else if (pv < dv) {
      outcome = 'lose'
      chipChange = -bet
      setMessage('Dealer wins.')
    } else {
      outcome = 'push'
      chipChange = 0
      setMessage("Push — it's a tie!")
    }

    setResult(outcome)
    setChips(c => c + chipChange)
    setPhase('results')
  }

  const newRound = () => {
    if (deck.length < 26) {
      setDeck(createDeck(6))
      setRunningCount(0)
    }
    setBet(0)
    setPlayerHand([])
    setDealerHand([])
    setPhase('betting')
    setResult('')
    setMessage('')
    setShowHint(false)
  }

  const { value: pv, soft: pSoft } = handValue(playerHand)
  const isPair = playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank
  const hint = phase === 'playing' && dealerHand.length > 0
    ? getBasicStrategy(pv, pSoft, isPair, isPair ? playerHand[0].rank : null, dealerHand[0].rank, playerHand.length === 2)
    : null

  const resultColors: Record<string, string> = {
    win: 'text-emerald-400',
    blackjack: 'text-yellow-400',
    bust: 'text-red-400',
    lose: 'text-red-400',
    push: 'text-slate-400',
  }

  return (
    <div className="min-h-screen bg-[#0a0f0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-amber-700/20 bg-black/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-mono font-bold">${chips.toLocaleString()}</span>
            <button onClick={() => setShowCount(!showCount)} className="text-slate-500 hover:text-slate-300">
              {showCount ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowCheatSheet(!showCheatSheet)} className="text-slate-500 hover:text-slate-300">
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex gap-6">
        <div className="flex-1 space-y-5">
          {/* Dealer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs uppercase tracking-wider">Dealer</span>
              {dealerHand.length > 0 && phase !== 'betting' && (
                <span className="text-slate-400 text-xs font-mono">{handValue(dealerHand).value}</span>
              )}
            </div>
            <div className="felt rounded-2xl p-4 min-h-[120px] flex items-center justify-center gap-2" style={{
              background: 'radial-gradient(ellipse at center, #1a3d1a 0%, #0f2a0f 100%)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
            }}>
              {dealerHand.length === 0 ? (
                <div className="text-green-800/40 text-sm">Waiting for deal...</div>
              ) : (
                dealerHand.map((card, i) => <Card key={i} card={card} size="md" animate delay={i * 0.15} />)
              )}
            </div>
          </div>

          {/* Player */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs uppercase tracking-wider">You</span>
              {playerHand.length > 0 && (
                <span className={`text-xs font-mono ${isBust(playerHand) ? 'text-red-400' : 'text-slate-400'}`}>
                  {handValue(playerHand).value}{handValue(playerHand).soft ? ' soft' : ''}
                  {isBust(playerHand) ? ' BUST' : ''}
                </span>
              )}
            </div>
            <div className="felt rounded-2xl p-4 min-h-[120px] flex items-center justify-center gap-2" style={{
              background: 'radial-gradient(ellipse at center, #1a3d1a 0%, #0f2a0f 100%)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
            }}>
              {playerHand.length === 0 ? (
                <div className="text-green-800/40 text-sm">Place your bet to deal</div>
              ) : (
                playerHand.map((card, i) => <Card key={i} card={card} size="md" animate delay={i * 0.15} />)
              )}
            </div>
          </div>

          {/* Count tracker */}
          {showCount && (
            <CountTracker runningCount={runningCount} decksRemaining={decksRemaining} />
          )}

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-center text-lg font-bold ${result ? resultColors[result] : 'text-slate-300'}`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint */}
          {hint && showHint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-900/30 border border-blue-700/40 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <Lightbulb className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-slate-400 text-xs">Basic Strategy: </span>
                <span className="text-blue-300 font-bold text-sm">{hint.label}</span>
              </div>
            </motion.div>
          )}

          {/* Betting phase */}
          {phase === 'betting' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Bet: <span className="text-amber-400 font-mono font-bold">${bet}</span></span>
                {bet > 0 && <button onClick={() => setBet(0)} className="text-slate-500 text-xs hover:text-slate-300">Clear</button>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 25, 50, 100].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBet(b => Math.min(b + amount, chips))}
                    disabled={bet + amount > chips}
                    className="bg-amber-800/50 hover:bg-amber-700/60 disabled:opacity-30 border border-amber-700/40 text-amber-200 font-bold px-3 py-2 rounded-xl text-sm transition-all"
                  >
                    +${amount}
                  </button>
                ))}
              </div>
              <button
                onClick={dealInitial}
                disabled={bet === 0}
                className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider transition-all"
              >
                Deal
              </button>
              {message && <p className="text-red-400 text-xs text-center">{message}</p>}
            </div>
          )}

          {/* Playing phase */}
          {phase === 'playing' && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button onClick={hit} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider transition-all">
                  Hit
                </button>
                <button onClick={stand} className="flex-1 bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider transition-all">
                  Stand
                </button>
                {playerHand.length === 2 && chips >= bet && (
                  <button onClick={double} className="flex-1 bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider transition-all">
                    Double
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="w-full border border-blue-700/30 text-blue-500/70 hover:text-blue-400 py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {showHint ? 'Hide Hint' : 'Show Basic Strategy Hint'}
              </button>
            </div>
          )}

          {/* Dealer phase */}
          {phase === 'dealer' && (
            <div className="text-center py-4">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-slate-400 text-sm"
              >
                Dealer's turn...
              </motion.div>
            </div>
          )}

          {/* Results phase */}
          {phase === 'results' && (
            <div className="space-y-3">
              {chips <= 0 && (
                <div className="text-center space-y-2">
                  <div className="text-red-400 font-bold">Out of chips!</div>
                  <button
                    onClick={() => { setChips(1000); newRound() }}
                    className="bg-amber-700/60 text-amber-200 px-4 py-2 rounded-xl text-sm"
                  >
                    Reload $1,000
                  </button>
                </div>
              )}
              <button
                onClick={newRound}
                className="w-full bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 rounded-xl text-sm uppercase tracking-wider transition-all"
              >
                Next Hand
              </button>
            </div>
          )}
        </div>

        {/* Cheat sheet */}
        <AnimatePresence>
          {showCheatSheet && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-72 shrink-0 hidden md:block"
            >
              <CheatSheet onClose={() => setShowCheatSheet(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
