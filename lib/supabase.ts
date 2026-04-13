import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; username: string; avatar: string | null; accuracy_score: number; chips: number; created_at: string }
        Insert: { id: string; username: string; avatar?: string | null; accuracy_score?: number; chips?: number; created_at?: string }
        Update: { username?: string; avatar?: string | null; accuracy_score?: number; chips?: number }
      }
      friends: {
        Row: { id: string; user_id: string; friend_id: string; status: 'pending' | 'accepted'; created_at: string }
        Insert: { user_id: string; friend_id: string; status?: 'pending' | 'accepted' }
        Update: { status?: 'pending' | 'accepted' }
      }
      tables: {
        Row: { id: string; owner_id: string; speed: 'beginner' | 'intermediate' | 'expert'; status: 'waiting' | 'playing' | 'finished'; created_at: string }
        Insert: { owner_id: string; speed?: 'beginner' | 'intermediate' | 'expert'; status?: 'waiting' | 'playing' | 'finished' }
        Update: { speed?: 'beginner' | 'intermediate' | 'expert'; status?: 'waiting' | 'playing' | 'finished' }
      }
      table_players: {
        Row: { id: string; table_id: string; user_id: string; running_count: number; chips: number; joined_at: string }
        Insert: { table_id: string; user_id: string; running_count?: number; chips?: number }
        Update: { running_count?: number; chips?: number }
      }
      messages: {
        Row: { id: string; table_id: string; user_id: string; content: string; created_at: string }
        Insert: { table_id: string; user_id: string; content: string }
        Update: never
      }
    }
  }
}
