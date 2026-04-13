'use client'

import { useState } from 'react'
import { UserPlus, Check, X, Circle, Trophy } from 'lucide-react'

interface Friend {
  id: string
  username: string
  avatar: string | null
  accuracy_score: number
  online?: boolean
  status: 'accepted' | 'pending'
}

interface FriendsListProps {
  friends: Friend[]
  pendingRequests: Friend[]
  onAddFriend: (username: string) => Promise<void>
  onAcceptFriend: (id: string) => Promise<void>
  onDeclineFriend: (id: string) => Promise<void>
  onInvite?: (friendId: string) => void
  showInvite?: boolean
}

export default function FriendsList({
  friends,
  pendingRequests,
  onAddFriend,
  onAcceptFriend,
  onDeclineFriend,
  onInvite,
  showInvite = false,
}: FriendsListProps) {
  const [addInput, setAddInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const handleAdd = async () => {
    if (!addInput.trim()) return
    setAdding(true)
    setAddError('')
    try {
      await onAddFriend(addInput.trim())
      setAddInput('')
    } catch (e: any) {
      setAddError(e.message || 'User not found')
    } finally {
      setAdding(false)
    }
  }

  const sortedFriends = [...friends].sort((a, b) => b.accuracy_score - a.accuracy_score)

  return (
    <div className="space-y-4">
      {/* Add friend */}
      <div className="bg-black/30 rounded-xl border border-amber-700/30 p-4 space-y-3">
        <div className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Add Friend</div>
        <div className="flex gap-2">
          <input
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Enter username..."
            className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-700/60"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !addInput.trim()}
            className="bg-amber-700/60 hover:bg-amber-600/70 disabled:opacity-30 text-white rounded-lg px-3 py-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
        {addError && <p className="text-red-400 text-xs">{addError}</p>}
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-black/30 rounded-xl border border-amber-700/30 p-4 space-y-2">
          <div className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Pending Requests</div>
          {pendingRequests.map(req => (
            <div key={req.id} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-bold text-white">
                {req.username[0].toUpperCase()}
              </div>
              <span className="flex-1 text-slate-300 text-sm">{req.username}</span>
              <button
                onClick={() => onAcceptFriend(req.id)}
                className="p-1.5 bg-emerald-700/40 hover:bg-emerald-600/50 rounded-lg text-emerald-400 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeclineFriend(req.id)}
                className="p-1.5 bg-red-900/40 hover:bg-red-800/50 rounded-lg text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Friends leaderboard */}
      <div className="bg-black/30 rounded-xl border border-amber-700/30 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Friends Leaderboard</span>
        </div>
        {sortedFriends.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No friends yet. Add some!</p>
        ) : (
          sortedFriends.map((friend, i) => (
            <div key={friend.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className={`text-sm font-bold w-5 text-center ${
                i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'
              }`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
              </span>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-bold text-white">
                  {friend.username[0].toUpperCase()}
                </div>
                <Circle
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${
                    friend.online ? 'text-emerald-400 fill-emerald-400' : 'text-slate-600 fill-slate-600'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-200 text-sm truncate">{friend.username}</div>
                <div className="text-slate-500 text-xs">{friend.online ? 'Online' : 'Offline'}</div>
              </div>
              <div className="text-right">
                <div className="text-amber-400 font-mono text-sm font-bold">{friend.accuracy_score}%</div>
                <div className="text-slate-600 text-xs">accuracy</div>
              </div>
              {showInvite && onInvite && friend.online && (
                <button
                  onClick={() => onInvite(friend.id)}
                  className="bg-emerald-800/40 hover:bg-emerald-700/50 text-emerald-400 text-xs px-2 py-1 rounded-lg transition-colors"
                >
                  Invite
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
