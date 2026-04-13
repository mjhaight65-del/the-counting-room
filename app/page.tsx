'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { Eye, EyeOff, Spade, Heart, Diamond, Club } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'landing' | 'signin' | 'signup'>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters')
      setLoading(false)
      return
    }
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    if (data.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        username: username.trim(),
        accuracy_score: 0,
        chips: 1000,
      })
      if (profileError && !profileError.message.includes('duplicate')) {
        setError(profileError.message)
        setLoading(false)
        return
      }
    }
    setMessage('Check your email to confirm your account!')
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Atmospheric background */}
      <div className="fixed inset-0 bg-[#0a0f0a]">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(26,61,26,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(180,120,40,0.08) 0%, transparent 50%)',
        }} />
        {/* Floating card symbols */}
        {['♠', '♥', '♦', '♣'].map((sym, i) => (
          <motion.div
            key={sym}
            className="absolute text-6xl opacity-5 select-none"
            style={{ left: `${20 + i * 22}%`, top: `${10 + (i % 2) * 40}%` }}
            animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 4 + i, ease: 'easeInOut', delay: i * 0.8 }}
          >
            {sym}
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-16">
        <AnimatePresence mode="wait">
          {mode === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-lg w-full space-y-8"
            >
              {/* Logo */}
              <div className="space-y-3">
                <div className="flex justify-center gap-2 text-4xl">
                  <span className="text-amber-400">♠</span>
                  <span className="text-red-400">♥</span>
                  <span className="text-amber-400">♦</span>
                  <span className="text-red-400">♣</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight neon-gold" style={{
                  fontFamily: 'Georgia, serif',
                  color: '#f0c060',
                  textShadow: '0 0 30px rgba(240,192,96,0.4), 0 0 60px rgba(240,192,96,0.15)',
                }}>
                  The Counting Room
                </h1>
                <p className="text-amber-600/80 text-lg tracking-widest uppercase font-light">
                  Where card counters are made
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-700/40" />
                <span className="text-amber-700/60 text-xs uppercase tracking-widest">Est. 2024</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-700/40" />
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 justify-center text-xs">
                {['Multiplayer Tables', 'Friend Leaderboards', 'Hi-Lo Training', 'Vegas Prep Mode', 'Free Forever'].map(f => (
                  <span key={f} className="bg-amber-900/20 border border-amber-700/30 text-amber-600/80 px-3 py-1 rounded-full">
                    {f}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setMode('signup')}
                  className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 px-8 rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-900/40 hover:shadow-amber-700/30"
                >
                  Enter the Room
                </button>
                <button
                  onClick={() => setMode('signin')}
                  className="border border-amber-700/50 hover:border-amber-600/70 text-amber-500 hover:text-amber-400 font-semibold py-3 px-8 rounded-xl text-sm uppercase tracking-wider transition-all"
                >
                  Sign In
                </button>
              </div>

              <p className="text-slate-600 text-xs">
                Free forever. No credit card required.{' '}
                <button onClick={() => router.push('/practice')} className="text-amber-700/60 hover:text-amber-600 underline">
                  Try without an account
                </button>
              </p>
            </motion.div>
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm space-y-6"
            >
              {/* Back + title */}
              <div className="text-center space-y-2">
                <div className="flex justify-center gap-1 text-2xl mb-3">
                  <span className="text-amber-400">♠</span><span className="text-red-400">♥</span>
                </div>
                <h2 className="text-2xl font-bold text-amber-300" style={{ fontFamily: 'Georgia, serif' }}>
                  {mode === 'signup' ? 'Join the Room' : 'Welcome Back'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {mode === 'signup' ? 'Create your account — free forever' : 'Sign in to your account'}
                </p>
              </div>

              {/* Google OAuth */}
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 py-2.5 rounded-xl text-sm transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-slate-600 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Form */}
              <form onSubmit={mode === 'signup' ? handleSignUp : handleSignIn} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="coolcounter"
                      required
                      minLength={3}
                      maxLength={20}
                      className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-700/60"
                    />
                  </div>
                )}
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-700/60"
                  />
                </div>
                <div className="relative">
                  <label className="text-slate-400 text-xs mb-1 block">Password</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-700/60 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-7 text-slate-500 hover:text-slate-300"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 text-red-400 text-xs">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-lg px-3 py-2 text-emerald-400 text-xs">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm uppercase tracking-wider transition-all mt-2"
                >
                  {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-slate-500 text-xs">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setMessage('') }}
                  className="text-amber-600 hover:text-amber-500"
                >
                  {mode === 'signup' ? 'Sign in' : 'Sign up'}
                </button>
              </p>

              <button
                onClick={() => { setMode('landing'); setError(''); setMessage('') }}
                className="w-full text-slate-600 hover:text-slate-400 text-xs transition-colors"
              >
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
