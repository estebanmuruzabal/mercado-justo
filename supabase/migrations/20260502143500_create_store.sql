-- Create seller store table
CREATE TABLE public.store (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  mode TEXT NOT NULL DEFAULT 'online' CHECK (mode IN ('online', 'physical')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan = 'free'),
  product_limit INTEGER NOT NULL DEFAULT 10 CHECK (product_limit > 0),
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own store" ON public.store
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own store" ON public.store
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own store" ON public.store
  FOR UPDATE USING (auth.uid() = id);

