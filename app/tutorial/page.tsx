'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/Card'
import { getHiLoValue, getHiLoLabel, getHiLoColor, HILO_REFERENCE } from '@/lib/hiloSystem'
import { createDeck, type Card as CardType, type Rank } from '@/lib/deck'
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Home } from 'lucide-react'

const RANKS_ORDER: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

const LESSONS = [
  {
    id: 'intro',
    title: 'What is Card Counting?',
    content: `Card counting is a strategy used to track whether the remaining deck is rich in high cards (good for the player) or low cards (good for the dealer). The Hi-Lo system is the most popular and beginner-friendly method.`,
    key: 'The goal is to know when the deck favors YOU.',
  },
  {
    id: 'hilo',
    title: 'The Hi-Lo System',
    content: `Every card is assigned a value:\n\n• Low cards (2-6): +1 to the running count\n• Neutral cards (7-9): 0 (ignore them)\n• High cards (10, J, Q, K, A): -1 to the running count\n\nYou keep a running total in your head. When the count is high (positive), the deck is rich in 10s and Aces — great for you. You should bet MORE.`,
    key: 'High count = bet more. Low count = bet less.',
  },
  {
    id: 'practice',
    title: 'Practice: Card Values',
    content: 'Now let\'s practice. For each card shown, remember its Hi-Lo value.',
    key: '',
    isFlashcard: true,
  },
  {
    id: 'running',
    title: 'The Running Count',
    content: `Start at 0 at the beginning of a shoe. Add or subtract as each card is dealt.\n\nExample:\n• 5 dealt → count becomes +1\n• King dealt → count becomes 0\n• 3 dealt → count becomes +1\n• Ace dealt → count becomes 0\n\nKeep practicing until this is automatic.`,
    key: 'Start at 0, adjust with every card.',
  },
  {
    id: 'true',
    title: 'True Count',
    content: `The Running Count is only useful relative to how many decks are left. Divide your running count by the estimated number of decks remaining to get the TRUE COUNT.\n\nRunning Count: +6\nDecks Remaining: 3\nTrue Count: +2\n\nMost betting decisions are based on the true count.`,
    key: 'True Count = Running Count ÷ Decks Remaining',
  },
  {
    id: 'betting',
    title: 'Bet Sizing',
    content: `Use the true count to guide your bets:\n\n• True Count ≤ 0: Bet the minimum (1×)\n• True Count +1 to +2: Bet 2× minimum\n• True Count +3 to +4: Bet 4× minimum\n• True Count +5 or more: Bet maximum (8×+)\n\nThis is called "spreading your bets" and is key to getting an edge.`,
    key: 'Bet big when the count is high. Bet small when it\'s low.',
  },
  {
    id: 'quiz',
    title: 'Quick Quiz',
    content: '',
    key: '',
    isQuiz: true,
  },
]

const QUIZ_QUESTIONS = [
  { card: '5' as Rank, question: 'What is the Hi-Lo value of a 5?', correct: '+1', options: ['+1', '0', '-1'] },
  { card: 'K' as Rank, question: 'What is the Hi-Lo value of a King?', correct: '-1', options: ['+1', '0', '-1'] },
  { card: '8' as Rank, question: 'What is the Hi-Lo value of an 8?', correct: '0', options: ['+1', '0', '-1'] },
  { card: 'A' as Rank, question: 'What is the Hi-Lo value of an Ace?', correct: '-1', options: ['+1', '0', '-1'] },
  { card: '3' as Rank, question: 'What is the Hi-Lo value of a 3?', correct: '+1', options: ['+1', '0', '-1'] },
]

export default function TutorialPage() {
  const router = useRouter()
  const [lessonIdx, setLessonIdx] = useState(0)
  const [flashcardRank, setFlashcardRank] = useState<Rank>('5')
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false)
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizAnswered, setQuizAnswered] = useState<string | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [completed, setCompleted] = useState(false)

  const deck = createDeck(1)
  const lesson = LESSONS[lessonIdx]

  function nextFlashcard() {
    const randomRank = RANKS_ORDER[Math.floor(Math.random() * RANKS_ORDER.length)]
    setFlashcardRank(randomRank)
    setShowFlashcardAnswer(false)
  }

  function answerQuiz(answer: string) {
    if (quizAnswered) return
    const correct = QUIZ_QUESTIONS[quizIdx].correct
    setQuizAnswered(answer)
    if (answer === correct) setQuizScore(s => s + 1)
  }

  function nextQuiz() {
    if (quizIdx + 1 >= QUIZ_QUESTIONS.length) {
      setQuizDone(true)
    } else {
      setQuizIdx(i => i + 1)
      setQuizAnswered(null)
    }
  }

  function goNext() {
    if (lessonIdx + 1 >= LESSONS.length) {
      setCompleted(true)
    } else {
      setLessonIdx(i => i + 1)
    }
  }

  if (completed) {
    const pct = Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="text-6xl">🎉</div>
          <h1 className="text-3xl font-bold text-amber-400" style={{ fontFamily: 'Georgia, serif' }}>
            Tutorial Complete!
          </h1>
          <div className="bg-black/40 border border-amber-700/30 rounded-xl p-4">
            <div className="text-amber-300 text-4xl font-mono font-bold">{pct}%</div>
            <div className="text-slate-400 text-sm mt-1">Quiz Score ({quizScore}/{QUIZ_QUESTIONS.length})</div>
          </div>
          <p className="text-slate-400 text-sm">
            {pct >= 80
              ? "You're ready to start practicing! Head to Practice Mode."
              : "Review the Hi-Lo values and try again. Practice makes perfect."}
          </p>
          <div className="flex gap-3 flex-col">
            <button
              onClick={() => router.push('/practice')}
              className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 rounded-xl text-sm uppercase tracking-wider"
            >
              Start Practicing
            </button>
            <button
              onClick={() => { setLessonIdx(0); setCompleted(false); setQuizIdx(0); setQuizAnswered(null); setQuizScore(0); setQuizDone(false) }}
              className="border border-amber-700/40 text-amber-600 py-3 rounded-xl text-sm"
            >
              Restart Tutorial
            </button>
            <button onClick={() => router.push('/dashboard')} className="text-slate-500 text-sm flex items-center justify-center gap-1">
              <Home className="w-3 h-3" /> Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f0a] px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="text-amber-500/60 text-xs font-mono">{lessonIdx + 1} / {LESSONS.length}</div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full"
            animate={{ width: `${((lessonIdx + 1) / LESSONS.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={lessonIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-5"
          >
            <h1 className="text-2xl font-bold text-amber-300" style={{ fontFamily: 'Georgia, serif' }}>
              {lesson.title}
            </h1>

            {/* Standard lesson */}
            {!lesson.isFlashcard && !lesson.isQuiz && (
              <div className="space-y-4">
                <div className="bg-black/40 border border-amber-700/20 rounded-xl p-5">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{lesson.content}</p>
                </div>
                {lesson.key && (
                  <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-amber-400 text-lg mt-0.5">💡</span>
                    <p className="text-amber-300 text-sm font-medium">{lesson.key}</p>
                  </div>
                )}

                {/* Hi-Lo reference for hilo lesson */}
                {lesson.id === 'hilo' && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Low (+1)', ranks: ['2','3','4','5','6'], color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-700/40' },
                      { label: 'Neutral (0)', ranks: ['7','8','9'], color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/30' },
                      { label: 'High (−1)', ranks: ['10','J','Q','K','A'], color: 'text-red-400', bg: 'bg-red-900/20 border-red-700/30' },
                    ].map(group => (
                      <div key={group.label} className={`${group.bg} border rounded-xl p-3 text-center`}>
                        <div className={`${group.color} text-xs font-bold mb-2`}>{group.label}</div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {group.ranks.map(r => (
                            <span key={r} className="text-white text-xs font-mono bg-white/10 rounded px-1">{r}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Flashcard trainer */}
            {lesson.isFlashcard && (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">Click the card to reveal its Hi-Lo value</p>
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    key={flashcardRank}
                    initial={{ rotateY: 0 }}
                    className="cursor-pointer"
                    onClick={() => setShowFlashcardAnswer(true)}
                  >
                    <Card
                      card={{ suit: 'spades', rank: flashcardRank }}
                      size="lg"
                      animate
                    />
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {showFlashcardAnswer ? (
                      <motion.div
                        key="answer"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-2"
                      >
                        <div className={`text-5xl font-mono font-bold ${getHiLoColor(getHiLoValue(flashcardRank))}`}>
                          {getHiLoLabel(getHiLoValue(flashcardRank))}
                        </div>
                        <button
                          onClick={nextFlashcard}
                          className="bg-amber-700/60 hover:bg-amber-600/70 text-amber-200 px-6 py-2 rounded-xl text-sm transition-colors"
                        >
                          Next Card →
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-500 text-sm">
                        Tap card to reveal
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* All values reference */}
                <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                  <div className="text-slate-500 text-xs mb-3 uppercase tracking-wider">Quick Reference</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {RANKS_ORDER.map(r => {
                      const v = getHiLoValue(r)
                      return (
                        <div key={r} className="text-center">
                          <div className="text-white text-xs font-mono bg-white/10 rounded px-1.5 py-0.5">{r}</div>
                          <div className={`${getHiLoColor(v)} text-[10px] font-mono mt-0.5`}>{getHiLoLabel(v)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Quiz */}
            {lesson.isQuiz && !quizDone && (
              <div className="space-y-5">
                <div className="text-slate-400 text-sm">Question {quizIdx + 1} of {QUIZ_QUESTIONS.length}</div>
                <div className="flex justify-center">
                  <Card card={{ suit: 'hearts', rank: QUIZ_QUESTIONS[quizIdx].card }} size="lg" animate />
                </div>
                <p className="text-slate-200 text-base font-medium text-center">{QUIZ_QUESTIONS[quizIdx].question}</p>
                <div className="grid grid-cols-3 gap-3">
                  {QUIZ_QUESTIONS[quizIdx].options.map(opt => {
                    const correct = QUIZ_QUESTIONS[quizIdx].correct
                    let bg = 'bg-slate-800/60 border-slate-700/40 text-slate-300 hover:border-amber-700/60'
                    if (quizAnswered) {
                      if (opt === correct) bg = 'bg-emerald-800/60 border-emerald-600/60 text-emerald-200'
                      else if (opt === quizAnswered) bg = 'bg-red-900/60 border-red-700/60 text-red-300'
                      else bg = 'bg-slate-900/60 border-slate-800/40 text-slate-500'
                    }
                    return (
                      <button
                        key={opt}
                        onClick={() => answerQuiz(opt)}
                        disabled={!!quizAnswered}
                        className={`border rounded-xl py-3 text-lg font-mono font-bold transition-all ${bg}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {quizAnswered && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                    quizAnswered === QUIZ_QUESTIONS[quizIdx].correct
                      ? 'bg-emerald-900/30 border border-emerald-700/40 text-emerald-300'
                      : 'bg-red-900/30 border border-red-700/40 text-red-300'
                  }`}>
                    {quizAnswered === QUIZ_QUESTIONS[quizIdx].correct
                      ? <><CheckCircle className="w-4 h-4" /> Correct!</>
                      : <><XCircle className="w-4 h-4" /> Incorrect. Answer: {QUIZ_QUESTIONS[quizIdx].correct}</>
                    }
                  </div>
                )}
                {quizAnswered && (
                  <button
                    onClick={nextQuiz}
                    className="w-full bg-amber-700/60 hover:bg-amber-600/70 text-amber-200 py-3 rounded-xl text-sm font-medium transition-colors"
                  >
                    {quizIdx + 1 >= QUIZ_QUESTIONS.length ? 'See Results' : 'Next Question →'}
                  </button>
                )}
              </div>
            )}

            {lesson.isQuiz && quizDone && (
              <div className="text-center space-y-4">
                <div className="text-5xl font-mono font-bold text-amber-400">{quizScore}/{QUIZ_QUESTIONS.length}</div>
                <p className="text-slate-400 text-sm">Quiz complete!</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {(!lesson.isFlashcard && !lesson.isQuiz) || (lesson.isQuiz && quizDone) ? (
          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setLessonIdx(i => Math.max(0, i - 1))}
              disabled={lessonIdx === 0}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-600 text-black font-bold px-6 py-2.5 rounded-xl text-sm uppercase tracking-wider transition-all"
            >
              {lessonIdx + 1 >= LESSONS.length ? 'Complete!' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : lesson.isFlashcard ? (
          <button
            onClick={goNext}
            className="w-full flex items-center justify-center gap-1.5 border border-amber-700/40 text-amber-600 hover:border-amber-600/60 hover:text-amber-500 py-3 rounded-xl text-sm transition-all"
          >
            Continue to Next Lesson <ArrowRight className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
