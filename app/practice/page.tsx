'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import Card from '@/components/Card'
import CountTracker from '@/components/CountTracker'
import CheatSheet from '@/components/CheatSheet'
import { createDeck, type Card as CardType } from '@/lib/deck'
import { getHiLoValue } from '@/lib/hiloSystem'
import { ArrowLeft, BookOpen, X, Zap, Settings } from 'lucide-react'
import { Suspense } from 'react'

type Speed = 'beginner' | 'intermediate' | 'expert' | 'vegas'

const SPEED_DELAYS: Record<Speed, number> = {
  beginner: 3000,
  intermediate: 1500,
  expert: 750,
  vegas: 400,
}

function PracticeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = (searchParams.get('mode') as Speed) || 'beginner'

  const [speed, setSpeed] = useState<Speed>(initialMode)
  const [running, setRunning] = useState(false)
  const [deck, setDeck] = useState<CardType[]>([])
  const [currentCard, setCurrentCard] = useState<CardType | null>(null)
  const [userCount, setUserCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [cardsDealt, setCardsDealt] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [showCheatSheet, setShowCheatSheet] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [input, setInput] = useState('')
  const [vegasScore, setVegasScore] = useState<null | number>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isVegas = speed === 'vegas'

  const startSession = useCallback(() => {
    const newDeck = createDeck(6)
    setDeck(newDeck)
    setUserCount(0)
    setCorrectCount(0)
    setCardsDealt(0)
    setCorrect(0)
    setStreak(0)
    setFeedback(null)
    setSessionDone(false)
    setRunning(true)
    setCurrentCard(newDeck[0])
    setInput('')
  }, [])

  const checkCount = useCallback((submittedCount: number) => {
    if (!running || !currentCard) return
    const isCorrect = submittedCount === correctCount
    setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) {
      setCorrect(c => c + 1)
      setStreak(s => {
        const ns = s + 1
        setBestStreak(b => Math.max(b, ns))
        return ns
      })
    } else {
      setStreak(0)
    }
    setTimeout(() => setFeedback(null), 500)
  }, [running, currentCard, correctCount])

  useEffect(() => {
    if (!running || !currentCard) return
    const delay = SPEED_DELAYS[speed]

    timerRef.current = setTimeout(() => {
      const hiloVal = getHiLoValue(currentCard.rank)
      const newCorrect = correctCount + hiloVal
      setCorrectCount(newCorrect)
      setCardsDealt(c => c + 1)

      setDeck(prev => {
        if (prev.length <= 1) {
          setSessionDone(true)
          setRunning(false)
          if (speed === 'vegas') {
            const pct = correct / Math.max(cardsDealt, 1)
            const score = Math.round(pct * 100)
            setVegasScore(score)
          }
          return prev
        }
        const newDeck = prev.slice(1)
        setCurrentCard(newDeck[0])
        return newDeck
      })
    }, delay)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [running, currentCard, speed])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseInt(input)
    if (!isNaN(val)) {
      checkCount(val)
      setUserCount(val)
    }
    setInput('')
    inputRef.current?.focus()
  }

  const accuracy = cardsDealt > 0 ? Math.round((correct / cardsDealt) * 100) : 0
  const decksRemaining = Math.round(deck.length / 52)

  if (sessionDone) {
    const isVegasReady = vegasScore !== null && vegasScore >= 85
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-sm w-full"
        >
          {isVegas ? (
            <>
              <div className="text-6xl">{isVegasReady ? '🎰' : '📚'}</div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: isVegasReady ? '#f0c060' : '#e87070' }}>
                {isVegasReady ? 'Vegas Ready! 🔥' : 'Keep Practicing'}
              </h2>
              <div className="bg-black/40 border border-amber-700/30 rounded-xl p-5 space-y-3">
                <div className="text-6xl font-mono font-bold text-amber-400">{vegasScore}%</div>
                <div className="text-slate-400 text-sm">Vegas Prep Score</div>
                <div className="text-slate-300 text-sm">
                  {isVegasReady
                    ? "You're counting fast enough to beat the casino pressure!"
                    : "Aim for 85%+ before hitting the tables."}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-5xl">{accuracy >= 90 ? '🔥' : accuracy >= 70 ? '👍' : '📚'}</div>
              <h2 className="text-2xl font-bold text-amber-300" style={{ fontFamily: 'Georgia, serif' }}>Session Complete</h2>
              <div className="bg-black/40 border border-amber-700/30 rounded-xl p-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-amber-400 font-mono text-xl font-bold">{accuracy}%</div>
                  <div className="text-slate-500 text-xs mt-1">Accuracy</div>
                </div>
                <div>
                  <div className="text-emerald-400 font-mono text-xl font-bold">{cardsDealt}</div>
                  <div className="text-slate-500 text-xs mt-1">Cards</div>
                </div>
                <div>
                  <div className="text-blue-400 font-mono text-xl font-bold">{bestStreak}</div>
                  <div className="text-slate-500 text-xs mt-1">Best Streak</div>
                </div>
              </div>
            </>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={startSession}
              className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 rounded-xl text-sm uppercase tracking-wider"
            >
              Practice Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="border border-amber-700/40 text-amber-600 py-3 rounded-xl text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-amber-700/20 bg-black/40 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm font-semibold">
              {isVegas ? '🎰 Vegas Prep' : 'Practice Mode'}
            </span>
          </div>
          <button
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-4xl mx-auto w-full px-4 py-6 gap-6">
        {/* Main practice area */}
        <div className="flex-1 space-y-6">
          {!running && !sessionDone && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-amber-300" style={{ fontFamily: 'Georgia, serif' }}>
                  {isVegas ? 'Vegas Prep Mode' : 'Practice Mode'}
                </h1>
                <p className="text-slate-400 text-sm">
                  {isVegas
                    ? 'Simulate real casino pressure. Cards fly fast.'
                    : 'Cards are dealt one at a time. Track the running count.'}
                </p>
              </div>

              {/* Speed selector */}
              {!isVegas && (
                <div className="space-y-2">
                  <div className="text-slate-500 text-xs uppercase tracking-wider text-center">Select Speed</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['beginner', 'intermediate', 'expert'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={`py-3 rounded-xl text-xs font-medium capitalize transition-all ${
                          speed === s
                            ? 'bg-amber-700/60 border border-amber-600/60 text-amber-200'
                            : 'bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:border-slate-600/50'
                        }`}
                      >
                        <div>{s}</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">{SPEED_DELAYS[s] / 1000}s/card</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isVegas && (
                <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-center space-y-2">
                  <div className="text-red-300 font-semibold">⚡ 0.4 seconds per card</div>
                  <div className="text-slate-400 text-xs">Cards fly fast. Casino distractions. Vegas-level pressure.</div>
                  <div className="text-amber-400 text-sm font-bold">Score 85%+ to be Vegas Ready</div>
                </div>
              )}

              <button
                onClick={startSession}
                className="w-full bg-amber-700 hover:bg-amber-600 text-black font-bold py-4 rounded-xl text-base uppercase tracking-wider transition-all shadow-lg"
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Start Session
              </button>
            </motion.div>
          )}

          {running && currentCard && (
            <div className="space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400' },
                  { label: 'Streak', value: streak, color: streak >= 5 ? 'text-amber-400' : 'text-slate-300' },
                  { label: 'Cards', value: cardsDealt, color: 'text-slate-300' },
                  { label: 'Left', value: deck.length, color: 'text-slate-400' },
                ].map(s => (
                  <div key={s.label} className="bg-black/30 rounded-lg py-2 px-1">
                    <div className={`font-mono font-bold text-lg ${s.color}`}>{s.value}</div>
                    <div className="text-slate-600 text-[10px] uppercase">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Card display */}
              <div className="relative flex flex-col items-center gap-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentCard.suit}-${currentCard.rank}-${cardsDealt}`}
                    initial={{ y: -60, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 60, opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Card card={currentCard} size="lg" />
                  </motion.div>
                </AnimatePresence>

                {/* Feedback flash */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.5 }}
                      className={`absolute top-0 right-0 text-2xl ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {feedback === 'correct' ? '✓' : '✗'}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Speed indicator */}
                <motion.div
                  className="w-full h-1 bg-amber-700/30 rounded-full overflow-hidden"
                >
                  <motion.div
                    key={`timer-${cardsDealt}`}
                    className="h-full bg-amber-500 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: SPEED_DELAYS[speed] / 1000, ease: 'linear' }}
                  />
                </motion.div>
              </div>

              {/* Count input */}
              <div className="space-y-3">
                <CountTracker runningCount={userCount} decksRemaining={decksRemaining} showAdvantage={false} compact />
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="number"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Enter running count..."
                    autoFocus
                    className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-3 text-lg text-center font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-700/60"
                  />
                  <button
                    type="submit"
                    className="bg-amber-700/60 hover:bg-amber-600/70 text-white px-4 py-3 rounded-xl transition-colors font-bold"
                  >
                    →
                  </button>
                </form>
                <div className="flex gap-2 justify-center">
                  {[-2, -1, 0, 1, 2].map(v => (
                    <button
                      key={v}
                      onClick={() => { checkCount(userCount + v); setUserCount(u => u + v) }}
                      className={`w-12 h-10 rounded-lg border text-sm font-mono font-bold transition-all ${
                        v > 0 ? 'border-emerald-700/40 text-emerald-400 bg-emerald-900/20 hover:bg-emerald-800/30'
                          : v < 0 ? 'border-red-700/40 text-red-400 bg-red-900/20 hover:bg-red-800/30'
                            : 'border-yellow-700/40 text-yellow-400 bg-yellow-900/10 hover:bg-yellow-900/20'
                      }`}
                    >
                      {v > 0 ? `+${v}` : v}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); setRunning(false); setSessionDone(true) }}
                className="w-full border border-slate-700/40 text-slate-500 hover:text-slate-300 py-2 rounded-xl text-xs transition-colors"
              >
                End Session
              </button>
            </div>
          )}
        </div>

        {/* Cheat sheet sidebar */}
        <AnimatePresence>
          {showCheatSheet && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full md:w-72 shrink-0"
            >
              <CheatSheet onClose={() => setShowCheatSheet(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-amber-400">Loading...</div>}>
      <PracticeContent />
    </Suspense>
  )
}
