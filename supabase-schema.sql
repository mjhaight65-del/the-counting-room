-- The Counting Room — Supabase Schema
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT,
  accuracy_score INTEGER DEFAULT 0,
  chips INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friends table
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Tables (blackjack tables)
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  speed TEXT DEFAULT 'beginner' CHECK (speed IN ('beginner', 'intermediate', 'expert')),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table players
CREATE TABLE IF NOT EXISTS public.table_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  running_count INTEGER DEFAULT 0,
  chips INTEGER DEFAULT 1000,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(table_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users
CREATE POLICY "Users can read all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies: Friends
CREATE POLICY "Users can read own friends" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert friend requests" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update friend status" ON public.friends FOR UPDATE USING (auth.uid() = friend_id OR auth.uid() = user_id);
CREATE POLICY "Users can delete own friends" ON public.friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies: Tables
CREATE POLICY "Anyone can read tables" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tables" ON public.tables FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Table owners can update" ON public.tables FOR UPDATE USING (auth.uid() = owner_id);

-- RLS Policies: Table players
CREATE POLICY "Anyone can read table players" ON public.table_players FOR SELECT USING (true);
CREATE POLICY "Users can join tables" ON public.table_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own player data" ON public.table_players FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies: Messages
CREATE POLICY "Anyone can read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
