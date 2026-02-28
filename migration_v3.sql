-- Migration V3: Auth, Multi-Currency, and Chat History
-- Run this in the Supabase SQL Editor

-- 1. Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD';

-- 2. Create chat_history table
CREATE TABLE IF NOT EXISTS public.chat_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  session_id uuid NOT NULL,
  mode text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Set up Auto-Delete for chat history (Requires pg_cron extension)
-- NOTE: Please go to your Supabase Dashboard -> Database -> Extensions 
-- Search for "pg_cron" and explicitly enable it first before running the cron schedule below:
-- SELECT cron.schedule('delete-old-chats', '0 2 * * *', 'DELETE FROM public.chat_history WHERE created_at < NOW() - INTERVAL ''10 days''');
