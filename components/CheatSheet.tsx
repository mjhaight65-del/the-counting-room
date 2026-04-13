'use client'

import { useState } from 'react'
import { X, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { HILO_REFERENCE } from '@/lib/hiloSystem'
import type { Rank } from '@/lib/deck'

interface CheatSheetProps {
  onClose?: () => void
}

const RANKS_ORDER: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']

// Simplified basic strategy visual grid
const HARD_GRID = [
  { hand: '17+', cells: ['S','S','S','S','S','S','S','S','S','S'] },
  { hand: '16',  cells: ['S','S','S','S','S','H','H','H','H','H'] },
  { hand: '15',  cells: ['S','S','S','S','S','H','H','H','H','H'] },
  { hand: '13-14', cells: ['S','S','S','S','S','H','H','H','H','H'] },
  { hand: '12',  cells: ['H','H','S','S','S','H','H','H','H','H'] },
  { hand: '11',  cells: ['D','D','D','D','D','D','D','D','D','H'] },
  { hand: '10',  cells: ['D','D','D','D','D','D','D','D','H','H'] },
  { hand: '9',   cells: ['H','D','D','D','D','H','H','H','H','H'] },
  { hand: '8-',  cells: ['H','H','H','H','H','H','H','H','H','H'] },
]

const LEGEND = [
  { code: 'H', label: 'Hit', color: 'bg-emerald-600' },
  { code: 'S', label: 'Stand', color: 'bg-red-700' },
  { code: 'D', label: 'Double', color: 'bg-yellow-600' },
  { code: 'P', label: 'Split', color: 'bg-blue-600' },
]

const cellColor: Record<string, string> = {
  H: 'bg-emerald-800/60 text-emerald-300',
  S: 'bg-red-900/60 text-red-300',
  D: 'bg-yellow-800/60 text-yellow-300',
  P: 'bg-blue-800/60 text-blue-300',
}

export default function CheatSheet({ onClose }: CheatSheetProps) {
  const [section, setSection] = useState<'hilo' | 'strategy' | 'bets'>('hilo')

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border border-amber-700/40 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/30 bg-black/30">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span className="text-amber-400 font-semibold text-sm tracking-wider uppercase">Cheat Sheet</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-700/20">
        {(['hilo', 'strategy', 'bets'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSection(tab)}
            className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
              section === tab
                ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'hilo' ? 'Hi-Lo' : tab === 'strategy' ? 'Strategy' : 'Bet Guide'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {section === 'hilo' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-xs leading-relaxed">
              The Hi-Lo system assigns values to each card. Keep a running total — positive means the deck favors you.
            </p>
            <div className="space-y-2">
              {/* Low cards */}
              <div>
                <div className="text-emerald-400 text-xs font-semibold mb-1 uppercase tracking-wider">Low Cards (+1)</div>
                <div className="flex gap-1.5 flex-wrap">
                  {(['2','3','4','5','6'] as Rank[]).map(r => (
                    <div key={r} className="bg-emerald-900/40 border border-emerald-700/40 rounded px-2 py-1 text-center">
                      <div className="text-white font-bold text-sm">{r}</div>
                      <div className="text-emerald-400 text-xs font-mono">+1</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Neutral */}
              <div>
                <div className="text-yellow-400 text-xs font-semibold mb-1 uppercase tracking-wider">Neutral (0)</div>
                <div className="flex gap-1.5">
                  {(['7','8','9'] as Rank[]).map(r => (
                    <div key={r} className="bg-yellow-900/40 border border-yellow-700/40 rounded px-2 py-1 text-center">
                      <div className="text-white font-bold text-sm">{r}</div>
                      <div className="text-yellow-400 text-xs font-mono">0</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* High cards */}
              <div>
                <div className="text-red-400 text-xs font-semibold mb-1 uppercase tracking-wider">High Cards (−1)</div>
                <div className="flex gap-1.5 flex-wrap">
                  {(['10','J','Q','K','A'] as Rank[]).map(r => (
                    <div key={r} className="bg-red-900/40 border border-red-700/40 rounded px-2 py-1 text-center">
                      <div className="text-white font-bold text-sm">{r}</div>
                      <div className="text-red-400 text-xs font-mono">−1</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {section === 'strategy' && (
          <div className="space-y-3">
            {/* Legend */}
            <div className="flex gap-2 flex-wrap">
              {LEGEND.map(l => (
                <div key={l.code} className="flex items-center gap-1">
                  <div className={`w-4 h-4 rounded ${l.color} text-white text-[9px] flex items-center justify-center font-bold`}>{l.code}</div>
                  <span className="text-slate-400 text-xs">{l.label}</span>
                </div>
              ))}
            </div>
            {/* Dealer row */}
            <div>
              <div className="text-slate-500 text-xs mb-1">Dealer upcard →</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr>
                      <th className="text-slate-400 text-left py-1 pr-2 font-normal w-10">Hand</th>
                      {DEALER_UPCARDS.map(u => (
                        <th key={u} className="text-slate-400 font-mono text-center w-6">{u}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HARD_GRID.map(row => (
                      <tr key={row.hand}>
                        <td className="text-slate-300 py-0.5 pr-2 font-mono">{row.hand}</td>
                        {row.cells.map((cell, i) => (
                          <td key={i} className="py-0.5">
                            <div className={`${cellColor[cell]} text-[10px] text-center rounded font-bold mx-0.5`}>{cell}</div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-slate-500 text-xs">Hard totals only. Always split Aces & 8s. Never split 5s or 10s.</p>
          </div>
        )}

        {section === 'bets' && (
          <div className="space-y-3">
            <p className="text-slate-400 text-xs">Adjust bets based on the true count (running count ÷ decks remaining)</p>
            <div className="space-y-2">
              {[
                { tc: '≤ 0', bet: '1× (min)', color: 'text-slate-400', bg: 'bg-slate-800/40' },
                { tc: '+1 to +2', bet: '2×', color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
                { tc: '+3 to +4', bet: '4×', color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
                { tc: '+5 or more', bet: '8× (max)', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
              ].map(row => (
                <div key={row.tc} className={`${row.bg} border border-white/5 rounded-lg px-3 py-2 flex justify-between items-center`}>
                  <div>
                    <span className="text-slate-300 text-xs">True Count </span>
                    <span className={`${row.color} font-mono font-bold text-sm`}>{row.tc}</span>
                  </div>
                  <span className={`${row.color} font-bold text-sm`}>{row.bet}</span>
                </div>
              ))}
            </div>
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
              <p className="text-amber-400 text-xs font-semibold mb-1">True Count Formula</p>
              <p className="text-slate-300 text-xs font-mono">True Count = Running Count ÷ Decks Remaining</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
