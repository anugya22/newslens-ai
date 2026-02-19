-- Migration V2: Add Persona and Advanced Asset Tracking
-- Run this in the Supabase SQL Editor

-- Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS investment_type text CHECK (investment_type IN ('long_term', 'swing', 'day_trader')) DEFAULT 'long_term',
ADD COLUMN IF NOT EXISTS risk_profile text CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')) DEFAULT 'moderate';

-- Update portfolio_items table
ALTER TABLE public.portfolio_items 
ADD COLUMN IF NOT EXISTS buy_date timestamp with time zone DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS exchange text;
