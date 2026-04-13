'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import FriendsList from '@/components/FriendsList'
import { Plus, Users, Zap, BookOpen, Target, Trophy, LogOut, Copy, Check } from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  avatar: string | null
  accuracy_score: number
  chips: number
}

interface TableRow {
  id: string
  owner_id: string
  speed: string
  status: string
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [friends, setFriends] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [activeTables, setActiveTables] = useState<TableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingTable, setCreatingTable] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tableSpeed, setTableSpeed] = useState<'beginner' | 'intermediate' | 'expert'>('beginner')
  const [vegasDays, setVegasDays] = useState(0)

  useEffect(() => {
    const vegasDate = new Date('2025-06-04')
    const today = new Date()
    const diff = Math.ceil((vegasDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    setVegasDays(Math.max(0, diff))
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single()
    setProfile(prof)

    // Load friends
    const { data: friendsData } = await supabase
      .from('friends')
      .select('*, friend:friend_id(id, username, accuracy_score, avatar)')
      .eq('user_id', user.id)
      .eq('status', 'accepted')

    const { data: pendingData } = await supabase
      .from('friends')
      .select('*, user:user_id(id, username, accuracy_score, avatar)')
      .eq('friend_id', user.id)
      .eq('status', 'pending')

    setFriends(friendsData?.map(f => ({ ...f.friend, status: 'accepted', online: false })) || [])
    setPending(pendingData?.map(f => ({ ...f.user, status: 'pending' })) || [])

    // Load active tables
    const { data: tables } = await supabase
      .from('tables')
      .select('*')
      .in('status', ['waiting', 'playing'])
      .order('created_at', { ascending: false })
      .limit(10)

    setActiveTables(tables || [])
    setLoading(false)
  }

  async function createTable() {
    if (!profile) return
    setCreatingTable(true)
    const { data, error } = await supabase.from('tables').insert({
      owner_id: profile.id,
      speed: tableSpeed,
      status: 'waiting',
    }).select().single()

    if (data) {
      await supabase.from('table_players').insert({
        table_id: data.id,
        user_id: profile.id,
        chips: profile.chips,
      })
      router.push(`/table/${data.id}`)
    }
    setCreatingTable(false)
  }

  async function joinTable(tableId: string) {
    if (!profile) return
    await supabase.from('table_players').upsert({
      table_id: tableId,
      user_id: profile.id,
      chips: profile.chips,
    })
    router.push(`/table/${tableId}`)
  }

  async function addFriend(username: string) {
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()
    if (!targetUser) throw new Error('User not found')
    await supabase.from('friends').insert({ user_id: profile!.id, friend_id: targetUser.id, status: 'pending' })
    await loadData()
  }

  async function acceptFriend(friendId: string) {
    await supabase.from('friends').update({ status: 'accepted' }).eq('user_id', friendId).eq('friend_id', profile!.id)
    await supabase.from('friends').insert({ user_id: profile!.id, friend_id: friendId, status: 'accepted' })
    await loadData()
  }

  async function declineFriend(friendId: string) {
    await supabase.from('friends').delete().eq('user_id', friendId).eq('friend_id', profile!.id)
    await loadData()
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="text-4xl"
        >
          ♠
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f0a]">
      {/* Header */}
      <header className="border-b border-amber-700/20 bg-black/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-xl">♠</span>
            <span className="font-bold text-amber-300 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              The Counting Room
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-amber-400 text-sm font-semibold">{profile?.username}</div>
              <div className="text-slate-500 text-xs font-mono">${profile?.chips?.toLocaleString()}</div>
            </div>
            <button onClick={signOut} className="text-slate-500 hover:text-slate-300 transition-colors p-1.5">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Vegas countdown banner */}
        {vegasDays > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-900/40 via-amber-900/30 to-red-900/40 border border-red-700/40 rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎰</span>
              <div>
                <div className="text-red-300 font-bold text-sm">Vegas Countdown</div>
                <div className="text-slate-400 text-xs">June 4th, 2025 — Keep practicing!</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-red-300 font-mono font-bold text-2xl">{vegasDays}</div>
              <div className="text-slate-500 text-xs">days to go</div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main actions + tables */}
          <div className="lg:col-span-2 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Accuracy', value: `${profile?.accuracy_score || 0}%`, icon: Target, color: 'text-emerald-400' },
                { label: 'Chips', value: `$${profile?.chips?.toLocaleString() || 1000}`, icon: Trophy, color: 'text-amber-400' },
                { label: 'Friends', value: friends.length, icon: Users, color: 'text-blue-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-black/40 border border-white/5 rounded-xl p-4 text-center">
                  <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-2`} />
                  <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/practice')}
                className="bg-gradient-to-br from-emerald-900/60 to-emerald-950 border border-emerald-700/40 hover:border-emerald-600/60 rounded-xl p-4 text-left transition-all group"
              >
                <Zap className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-emerald-300 font-semibold text-sm">Practice Mode</div>
                <div className="text-slate-500 text-xs mt-0.5">Solo card counting drills</div>
              </button>

              <button
                onClick={() => router.push('/tutorial')}
                className="bg-gradient-to-br from-blue-900/60 to-blue-950 border border-blue-700/40 hover:border-blue-600/60 rounded-xl p-4 text-left transition-all group"
              >
                <BookOpen className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-blue-300 font-semibold text-sm">Tutorial</div>
                <div className="text-slate-500 text-xs mt-0.5">Learn Hi-Lo card counting</div>
              </button>

              <button
                onClick={() => router.push('/game')}
                className="bg-gradient-to-br from-purple-900/60 to-purple-950 border border-purple-700/40 hover:border-purple-600/60 rounded-xl p-4 text-left transition-all group"
              >
                <span className="text-2xl block mb-1">🃏</span>
                <div className="text-purple-300 font-semibold text-sm">Full Game</div>
                <div className="text-slate-500 text-xs mt-0.5">Play blackjack with chips</div>
              </button>

              <button
                onClick={() => router.push('/practice?mode=vegas')}
                className="bg-gradient-to-br from-red-900/60 to-red-950 border border-red-700/40 hover:border-red-600/60 rounded-xl p-4 text-left transition-all group"
              >
                <span className="text-2xl block mb-1">🎰</span>
                <div className="text-red-300 font-semibold text-sm">Vegas Prep Mode</div>
                <div className="text-slate-500 text-xs mt-0.5">Casino pressure simulation</div>
              </button>
            </div>

            {/* Create / Join table */}
            <div className="bg-black/40 border border-amber-700/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Multiplayer</span>
                </div>
              </div>

              {/* Speed selector */}
              <div className="space-y-2">
                <div className="text-slate-400 text-xs">Table Speed</div>
                <div className="flex gap-2">
                  {(['beginner', 'intermediate', 'expert'] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setTableSpeed(speed)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                        tableSpeed === speed
                          ? 'bg-amber-700/60 border border-amber-600/60 text-amber-200'
                          : 'bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:border-slate-600/50'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={createTable}
                disabled={creatingTable}
                className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {creatingTable ? 'Creating...' : 'Create New Table'}
              </button>

              {/* Active tables */}
              {activeTables.length > 0 && (
                <div className="space-y-2">
                  <div className="text-slate-500 text-xs uppercase tracking-wider">Active Tables</div>
                  {activeTables.map(table => (
                    <div key={table.id} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2.5">
                      <div>
                        <div className="text-slate-300 text-xs font-mono">#{table.id.slice(0, 8)}</div>
                        <div className="text-slate-500 text-xs capitalize">{table.speed} • {table.status}</div>
                      </div>
                      <button
                        onClick={() => joinTable(table.id)}
                        className="bg-emerald-800/50 hover:bg-emerald-700/60 text-emerald-400 text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Friends */}
          <div className="space-y-4">
            <FriendsList
              friends={friends}
              pendingRequests={pending}
              onAddFriend={addFriend}
              onAcceptFriend={acceptFriend}
              onDeclineFriend={declineFriend}
              showInvite={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
