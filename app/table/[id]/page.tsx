'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import Card from '@/components/Card'
import CountTracker from '@/components/CountTracker'
import ChatBox from '@/components/ChatBox'
import CheatSheet from '@/components/CheatSheet'
import { createDeck, handValue, isBust, type Card as CardType } from '@/lib/deck'
import { getHiLoValue } from '@/lib/hiloSystem'
import { ArrowLeft, BookOpen, Copy, Check, Users, Share2 } from 'lucide-react'

interface TablePlayer {
  user_id: string
  username: string
  chips: number
  running_count: number
  hand?: CardType[]
  bet?: number
  status?: 'waiting' | 'playing' | 'stand' | 'bust'
}

interface ChatMessage {
  id: string
  user_id: string
  username: string
  content: string
  created_at: string
}

export default function TablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tableId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [table, setTable] = useState<any>(null)
  const [players, setPlayers] = useState<TablePlayer[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [runningCount, setRunningCount] = useState(0)
  const [showCheatSheet, setShowCheatSheet] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  // Local game state (demo mode since we're not running full server-side blackjack)
  const [deck, setDeck] = useState<CardType[]>(createDeck(6))
  const [dealerHand, setDealerHand] = useState<CardType[]>([])
  const [playerHand, setPlayerHand] = useState<CardType[]>([])
  const [bet, setBet] = useState(0)
  const [gamePhase, setGamePhase] = useState<'betting' | 'playing' | 'dealer' | 'results'>('betting')
  const [chips, setChips] = useState(1000)
  const [result, setResult] = useState('')
  const [showCountReveal, setShowCountReveal] = useState(false)
  const [revealedCounts, setRevealedCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    init()
  }, [tableId])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single()
    setProfile(prof)
    setChips(prof?.chips || 1000)

    const { data: tbl } = await supabase.from('tables').select('*').eq('id', tableId).single()
    setTable(tbl)

    await loadPlayers(user.id)
    await loadMessages()

    // Subscribe to realtime updates
    const channel = supabase.channel(`table:${tableId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_players', filter: `table_id=eq.${tableId}` },
        () => loadPlayers(user.id))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `table_id=eq.${tableId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage])
        })
      .subscribe()

    setLoading(false)
    return () => { supabase.removeChannel(channel) }
  }

  async function loadPlayers(myId: string) {
    const { data } = await supabase
      .from('table_players')
      .select('*, user:user_id(username, chips)')
      .eq('table_id', tableId)

    const mapped = (data || []).map((p: any) => ({
      user_id: p.user_id,
      username: p.user?.username || 'Player',
      chips: p.chips,
      running_count: p.running_count || 0,
      status: 'waiting' as const,
    }))
    setPlayers(mapped)
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, user:user_id(username)')
      .eq('table_id', tableId)
      .order('created_at', { ascending: true })
      .limit(50)

    setMessages((data || []).map((m: any) => ({
      ...m,
      username: m.user?.username || 'Player',
    })))
  }

  async function sendMessage(content: string) {
    if (!profile) return
    await supabase.from('messages').insert({
      table_id: tableId,
      user_id: profile.id,
      content,
    })
  }

  async function updateMyCount(count: number) {
    if (!profile) return
    setRunningCount(count)
    await supabase.from('table_players')
      .update({ running_count: count })
      .eq('table_id', tableId)
      .eq('user_id', profile.id)
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function revealCounts() {
    const counts: Record<string, number> = {}
    players.forEach(p => { counts[p.user_id] = p.running_count })
    setRevealedCounts(counts)
    setShowCountReveal(true)
    setTimeout(() => setShowCountReveal(false), 5000)
  }

  // Simple local game logic
  const dealGame = () => {
    if (bet === 0) return
    const newDeck = [...deck]
    const p1 = newDeck.splice(0, 1)[0]
    const d1 = newDeck.splice(0, 1)[0]
    const p2 = newDeck.splice(0, 1)[0]
    const d2 = { ...newDeck.splice(0, 1)[0], faceDown: true }

    setDeck(newDeck)
    setPlayerHand([p1, p2])
    setDealerHand([d1, d2])
    const newCount = runningCount + getHiLoValue(p1.rank) + getHiLoValue(d1.rank) + getHiLoValue(p2.rank)
    updateMyCount(newCount)
    setGamePhase('playing')
  }

  const hitCard = () => {
    if (deck.length === 0) return
    const card = deck[0]
    const newDeck = deck.slice(1)
    setDeck(newDeck)
    const newHand = [...playerHand, card]
    setPlayerHand(newHand)
    updateMyCount(runningCount + getHiLoValue(card.rank))
    if (isBust(newHand)) {
      setResult('Bust! Dealer wins.')
      setChips(c => c - bet)
      setGamePhase('results')
    }
  }

  const standGame = async () => {
    setGamePhase('dealer')
    let dHand: CardType[] = dealerHand.map(c => ({ ...c, faceDown: false as boolean }))
    setDealerHand(dHand)
    updateMyCount(runningCount + getHiLoValue(dHand[dHand.length - 1].rank))

    let workDeck = [...deck]
    while (handValue(dHand).value < 17 && workDeck.length > 0) {
      await new Promise(r => setTimeout(r, 700))
      const card = workDeck.splice(0, 1)[0]
      dHand = [...dHand, card as CardType]
      setDealerHand([...dHand])
      updateMyCount(runningCount + getHiLoValue(card.rank))
    }
    setDeck(workDeck)

    const pv = handValue(playerHand).value
    const dv = handValue(dHand).value
    if (isBust(dHand)) {
      setResult('Dealer busts! You win! 🤑')
      setChips(c => c + bet)
    } else if (pv > dv) {
      setResult('You win! 🤑')
      setChips(c => c + bet)
    } else if (pv < dv) {
      setResult('Dealer wins.')
      setChips(c => c - bet)
    } else {
      setResult('Push!')
    }
    setGamePhase('results')

    // Show count reveal for multiplayer comparison
    setTimeout(revealCounts, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="text-4xl">
          ♠
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-amber-700/20 bg-black/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-semibold text-sm tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              The Counting Room
            </span>
            <span className="text-slate-600 text-xs">•</span>
            <span className="text-slate-400 text-xs capitalize">{table?.speed} table</span>
            <span className="flex items-center gap-1 text-slate-500 text-xs">
              <Users className="w-3 h-3" /> {players.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={copyInviteLink} className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 text-xs transition-colors bg-black/30 border border-white/5 rounded-lg px-2.5 py-1.5">
              {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Invite'}
            </button>
            <button onClick={() => setShowCheatSheet(!showCheatSheet)} className="text-slate-500 hover:text-slate-300">
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 flex gap-4">
        {/* Main table area */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Players bar */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {players.map(p => (
              <div key={p.user_id} className={`shrink-0 bg-black/40 border rounded-xl px-3 py-2 text-center min-w-[80px] ${
                p.user_id === profile?.id ? 'border-amber-700/50' : 'border-white/5'
              }`}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-bold text-white mx-auto mb-1">
                  {p.username[0].toUpperCase()}
                </div>
                <div className="text-slate-300 text-xs truncate max-w-[70px]">{p.user_id === profile?.id ? 'You' : p.username}</div>
                <div className="text-amber-400 font-mono text-xs">${p.chips.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Game table */}
          <div className="rounded-3xl overflow-hidden" style={{
            background: 'radial-gradient(ellipse at center, #1a3d1a 0%, #0f2a0f 60%, #0a1a0a 100%)',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.6)',
            border: '2px solid rgba(180,120,40,0.2)',
          }}>
            <div className="p-5 space-y-4">
              {/* Dealer */}
              <div className="text-center space-y-2">
                <div className="text-slate-400/60 text-xs uppercase tracking-widest">Dealer</div>
                <div className="flex justify-center gap-2 min-h-[80px] items-center">
                  {dealerHand.map((card, i) => <Card key={i} card={card} size="md" animate delay={i * 0.1} />)}
                  {dealerHand.length === 0 && <div className="w-14 h-20 rounded-lg border border-dashed border-green-700/30" />}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-amber-700/30 text-xs tracking-[0.5em] uppercase">The Counting Room</div>
              </div>

              {/* Player */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-slate-400/60 text-xs uppercase tracking-widest">You</div>
                  {playerHand.length > 0 && (
                    <div className={`text-xs font-mono ${isBust(playerHand) ? 'text-red-400' : 'text-slate-300'}`}>
                      {handValue(playerHand).value}
                    </div>
                  )}
                </div>
                <div className="flex justify-center gap-2 min-h-[80px] items-center">
                  {playerHand.map((card, i) => <Card key={i} card={card} size="md" animate delay={i * 0.1} />)}
                  {playerHand.length === 0 && <div className="w-14 h-20 rounded-lg border border-dashed border-green-700/30" />}
                </div>
              </div>

              {/* Bet display */}
              {bet > 0 && gamePhase !== 'betting' && (
                <div className="text-center text-amber-500/70 text-xs font-mono">Bet: ${bet}</div>
              )}
            </div>
          </div>

          {/* Count reveal overlay */}
          <AnimatePresence>
            {showCountReveal && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-black/70 border border-amber-700/40 rounded-xl p-4"
              >
                <div className="text-amber-400 text-sm font-semibold mb-3 text-center">Running Count Comparison</div>
                <div className="grid grid-cols-2 gap-2">
                  {players.map(p => (
                    <div key={p.user_id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      p.user_id === profile?.id ? 'bg-amber-900/30 border border-amber-700/40' : 'bg-slate-800/40'
                    }`}>
                      <span className="text-slate-300 text-xs">{p.user_id === profile?.id ? 'You' : p.username}</span>
                      <span className={`font-mono font-bold text-sm ${
                        (revealedCounts[p.user_id] || 0) === runningCount ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {revealedCounts[p.user_id] > 0 ? `+${revealedCounts[p.user_id]}` : revealedCounts[p.user_id]}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Count tracker */}
          <CountTracker runningCount={runningCount} decksRemaining={Math.ceil(deck.length / 52)} compact />

          {/* Game controls */}
          {gamePhase === 'betting' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Bet: <span className="text-amber-400 font-mono font-bold">${bet}</span></span>
                {bet > 0 && <button onClick={() => setBet(0)} className="text-slate-500 text-xs hover:text-slate-300">Clear</button>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {[10, 25, 50, 100].map(a => (
                  <button key={a} onClick={() => setBet(b => Math.min(b + a, chips))} disabled={chips < bet + a}
                    className="bg-amber-800/50 hover:bg-amber-700/60 disabled:opacity-30 border border-amber-700/40 text-amber-200 font-bold px-3 py-2 rounded-xl text-sm transition-all">
                    +${a}
                  </button>
                ))}
              </div>
              <button onClick={dealGame} disabled={bet === 0}
                className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider">
                Deal
              </button>
            </div>
          )}

          {gamePhase === 'playing' && (
            <div className="flex gap-3">
              <button onClick={hitCard} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider">Hit</button>
              <button onClick={standGame} className="flex-1 bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider">Stand</button>
            </div>
          )}

          {gamePhase === 'dealer' && (
            <div className="text-center py-3">
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}
                className="text-slate-400 text-sm">Dealer's turn...</motion.div>
            </div>
          )}

          {gamePhase === 'results' && (
            <div className="space-y-3">
              {result && (
                <div className={`text-center text-lg font-bold py-2 ${
                  result.includes('win') || result.includes('Win') ? 'text-emerald-400' :
                  result.includes('Push') ? 'text-slate-400' : 'text-red-400'
                }`}>{result}</div>
              )}
              <button
                onClick={() => {
                  setBet(0); setPlayerHand([]); setDealerHand([]); setGamePhase('betting'); setResult('')
                  if (deck.length < 26) { setDeck(createDeck(6)); updateMyCount(0) }
                }}
                className="w-full bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 rounded-xl text-sm uppercase tracking-wider"
              >
                Next Hand
              </button>
            </div>
          )}
        </div>

        {/* Right sidebar: chat + cheat sheet */}
        <div className="w-72 shrink-0 hidden md:flex flex-col gap-4">
          <div className="h-80">
            <ChatBox
              messages={messages}
              currentUserId={profile?.id || ''}
              onSend={sendMessage}
            />
          </div>

          <AnimatePresence>
            {showCheatSheet && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex-1 min-h-0"
              >
                <CheatSheet onClose={() => setShowCheatSheet(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
