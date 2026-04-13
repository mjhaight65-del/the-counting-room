'use client'

import { motion } from 'framer-motion'
import { type Card as CardType, suitSymbol, suitColor } from '@/lib/deck'

interface CardProps {
  card: CardType
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  delay?: number
}

const sizeClasses = {
  sm: 'w-10 h-14 text-xs',
  md: 'w-14 h-20 text-sm',
  lg: 'w-20 h-28 text-base',
}

export default function Card({ card, size = 'md', animate = false, delay = 0 }: CardProps) {
  const sizeClass = sizeClasses[size]
  const color = suitColor(card.suit)
  const symbol = suitSymbol(card.suit)

  if (card.faceDown) {
    return (
      <motion.div
        initial={animate ? { rotateY: 90, opacity: 0 } : false}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay }}
        className={`${sizeClass} rounded-lg border border-amber-700/40 shadow-lg shadow-black/50 flex items-center justify-center bg-gradient-to-br from-green-900 to-green-950 relative overflow-hidden`}
      >
        <div className="absolute inset-1 rounded border border-amber-700/30 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(180,120,40,0.1)_4px,rgba(180,120,40,0.1)_8px)]" />
        <span className="text-amber-700/60 text-lg">🂠</span>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={animate ? { rotateY: 90, opacity: 0, y: -20 } : false}
      animate={{ rotateY: 0, opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, type: 'spring', stiffness: 200 }}
      className={`${sizeClass} rounded-lg border border-white/10 shadow-lg shadow-black/50 bg-gradient-to-br from-slate-100 to-white flex flex-col items-center justify-between p-1 relative`}
    >
      <span className={`${color} font-bold leading-none self-start text-xs`}>
        {card.rank}
        <br />
        <span className="text-[10px]">{symbol}</span>
      </span>
      <span className={`${color} text-lg font-bold`}>{symbol}</span>
      <span className={`${color} font-bold leading-none self-end rotate-180 text-xs`}>
        {card.rank}
        <br />
        <span className="text-[10px]">{symbol}</span>
      </span>
    </motion.div>
  )
}
