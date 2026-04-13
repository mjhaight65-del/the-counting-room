'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface Message {
  id: string
  user_id: string
  username: string
  content: string
  created_at: string
}

interface ChatBoxProps {
  messages: Message[]
  currentUserId: string
  onSend: (content: string) => void
}

const QUICK_REACTIONS = ['🃏', '🎰', '💀', '🤑', '🔥', '👏']

export default function ChatBox({ messages, currentUserId, onSend }: ChatBoxProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-xl border border-amber-700/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-amber-700/20">
        <span className="text-amber-500/70 text-xs uppercase tracking-widest font-semibold">Table Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-4">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.user_id === currentUserId ? 'flex-row-reverse' : ''}`}>
            <div className={`max-w-[80%] ${msg.user_id === currentUserId ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
              <span className="text-slate-500 text-[10px] px-1">{msg.username}</span>
              <div className={`px-2.5 py-1.5 rounded-xl text-xs ${
                msg.user_id === currentUserId
                  ? 'bg-amber-700/40 text-amber-100 rounded-tr-none'
                  : 'bg-slate-800/60 text-slate-200 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick reactions */}
      <div className="flex gap-1 px-2 py-1 border-t border-amber-700/10">
        {QUICK_REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => onSend(emoji)}
            className="text-base hover:scale-125 transition-transform p-0.5"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-2 border-t border-amber-700/20">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Say something..."
          maxLength={200}
          className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-700/60"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-amber-700/60 hover:bg-amber-600/60 disabled:opacity-30 text-white rounded-lg px-2.5 py-1.5 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
