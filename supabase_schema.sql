-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (links to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  risk_tolerance text default 'medium', -- 'low', 'medium', 'high' (DEPRECATED, use risk_profile)
  investment_type text check (investment_type in ('long_term', 'swing', 'day_trader')) default 'long_term',
  risk_profile text check (risk_profile in ('conservative', 'moderate', 'aggressive')) default 'moderate',
  preferred_currency text default 'USD',
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- Create portfolio_items table
create table if not exists public.portfolio_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  quantity numeric not null check (quantity > 0),
  avg_price numeric not null check (avg_price >= 0),
  asset_type text check (asset_type in ('stock', 'crypto')) default 'stock',
  buy_date timestamp with time zone default timezone('utc'::text, now()),
  exchange text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create chat_history table
create table if not exists public.chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  session_id uuid not null,
  mode text not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.chat_history enable row level security;

-- RLS Policies for Profiles
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( auth.uid() = id );

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- RLS Policies for Portfolio Items
drop policy if exists "Users can view their own portfolio items." on public.portfolio_items;
drop policy if exists "Users can view their own portfolio" on public.portfolio_items;
create policy "Users can view their own portfolio items."
  on public.portfolio_items for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own portfolio items." on public.portfolio_items;
drop policy if exists "Users can insert their own portfolio" on public.portfolio_items;
create policy "Users can insert their own portfolio items."
  on public.portfolio_items for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own portfolio items." on public.portfolio_items;
create policy "Users can update their own portfolio items."
  on public.portfolio_items for update
  using ( auth.uid() = user_id );

drop policy if exists "Users can delete their own portfolio items." on public.portfolio_items;
drop policy if exists "Users can delete their own portfolio" on public.portfolio_items;
create policy "Users can delete their own portfolio items."
  on public.portfolio_items for delete
  using ( auth.uid() = user_id );

-- RLS Policies for Chat History
drop policy if exists "Users can view their own chat history" on public.chat_history;
create policy "Users can view their own chat history"
  on public.chat_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own chat history" on public.chat_history;
create policy "Users can insert their own chat history"
  on public.chat_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own chat history" on public.chat_history;
create policy "Users can delete their own chat history"
  on public.chat_history for delete
  using (auth.uid() = user_id);

-- Create pg_cron schedule to auto-delete chats older than 10 days
-- NOTE: Please ensure pg_cron is enabled in Database -> Extensions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM cron.job WHERE jobname = 'delete-old-chats'
        ) THEN
            PERFORM cron.unschedule('delete-old-chats');
        END IF;
        
        PERFORM cron.schedule('delete-old-chats', '0 2 * * *', 
            'DELETE FROM public.chat_history WHERE created_at < NOW() - INTERVAL ''10 days'' AND user_id IS NOT NULL');
    END IF;
END $$;
