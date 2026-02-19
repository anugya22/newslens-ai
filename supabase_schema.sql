-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (links to auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  risk_tolerance text default 'medium', -- 'low', 'medium', 'high' (DEPRECATED, use risk_profile)
  investment_type text check (investment_type in ('long_term', 'swing', 'day_trader')) default 'long_term',
  risk_profile text check (risk_profile in ('conservative', 'moderate', 'aggressive')) default 'moderate',
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- Create portfolio_items table
create table public.portfolio_items (
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

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.portfolio_items enable row level security;

-- RLS Policies for Profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on profiles for update
  using ( auth.uid() = id );

-- RLS Policies for Portfolio Items
create policy "Users can view their own portfolio items."
  on portfolio_items for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own portfolio items."
  on portfolio_items for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own portfolio items."
  on portfolio_items for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own portfolio items."
  on portfolio_items for delete
  using ( auth.uid() = user_id );
