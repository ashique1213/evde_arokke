-- WIPE EVERYTHING CLEAN
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Delete all users to start fully fresh
DELETE FROM auth.users;

-- ----------------------------------------------------
-- REBUILD THE DATABASE
-- ----------------------------------------------------

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    phone TEXT,
    nickname TEXT,
    home_location TEXT DEFAULT 'Korome',
    favorite_meetup TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create locations table
CREATE TABLE public.locations (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    status TEXT NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    location_name TEXT,
    arrived_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    online BOOLEAN DEFAULT true
);

-- Automate Profile Creation on first Google Login
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Configure RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on profiles"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access on locations"
  ON public.locations FOR SELECT USING (true);

-- Allow authenticated users to manage their own profile and location
CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow users to insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to upsert own location"
  ON public.locations FOR ALL USING (auth.uid() = user_id);

-- ENABLE supabase REALTIME for locations table
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.locations;
