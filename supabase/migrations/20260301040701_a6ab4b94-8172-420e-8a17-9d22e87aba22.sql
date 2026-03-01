
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT NOT NULL DEFAULT 'Jugador',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  coins INTEGER NOT NULL DEFAULT 100,
  fitness_goal TEXT NOT NULL DEFAULT 'Hipertrofia',
  gym_name TEXT NOT NULL DEFAULT 'GymTech Central',
  gym_lat DOUBLE PRECISION DEFAULT 19.4326,
  gym_lng DOUBLE PRECISION DEFAULT -99.1332,
  avatar_skin_tone TEXT,
  avatar_hair_color TEXT,
  avatar_photo_url TEXT,
  streak_days INTEGER NOT NULL DEFAULT 0,
  total_workouts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
-- Allow reading other profiles for matching
CREATE POLICY "Users can read all profiles for matching" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);

-- Checkins table
CREATE TABLE public.checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  distance_meters DOUBLE PRECISION NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own checkins" ON public.checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Training matches
CREATE TABLE public.training_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affinity_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.training_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their matches" ON public.training_matches FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);
CREATE POLICY "Users can create matches" ON public.training_matches FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update their matches" ON public.training_matches FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Marketplace items (public read)
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'suplemento',
  fitness_goals TEXT[] NOT NULL DEFAULT '{}',
  emoji TEXT DEFAULT '📦',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read marketplace items" ON public.marketplace_items FOR SELECT USING (true);

-- User purchases / inventory
CREATE TABLE public.user_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'Jugador_' || substr(NEW.id::text, 1, 4)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to add XP and handle level up
CREATE OR REPLACE FUNCTION public.add_xp(p_user_id UUID, p_xp INTEGER, p_coins INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_xp_to_next INTEGER;
  v_leveled_up BOOLEAN := false;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Profile not found');
  END IF;
  
  v_new_xp := v_profile.xp + p_xp;
  v_new_level := v_profile.level;
  
  -- Level up every 500 XP
  LOOP
    v_xp_to_next := v_new_level * 500;
    EXIT WHEN v_new_xp < v_xp_to_next;
    v_new_xp := v_new_xp - v_xp_to_next;
    v_new_level := v_new_level + 1;
    v_leveled_up := true;
  END LOOP;
  
  UPDATE profiles 
  SET xp = v_new_xp, 
      level = v_new_level, 
      coins = coins + p_coins,
      total_workouts = total_workouts + 1,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'xp', v_new_xp, 
    'level', v_new_level, 
    'coins', v_profile.coins + p_coins,
    'leveled_up', v_leveled_up,
    'xp_to_next', v_new_level * 500
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Seed marketplace items
INSERT INTO public.marketplace_items (name, description, price, category, fitness_goals, emoji) VALUES
  ('Whey Protein Cyber', 'Proteína de suero premium 2kg', 120, 'suplemento', ARRAY['Hipertrofia', 'Fuerza'], '🥤'),
  ('Creatina NeonForce', 'Monohidrato puro 500g', 60, 'suplemento', ARRAY['Hipertrofia', 'Fuerza'], '⚡'),
  ('Tank Top Glitch', 'Fibra anti-sudor cyberpunk', 45, 'ropa', ARRAY['Hipertrofia', 'Cardio'], '👕'),
  ('Shorts HyperFlex', 'Shorts elásticos con bolsillos', 55, 'ropa', ARRAY['Cardio', 'Pérdida de peso'], '🩳'),
  ('Pre-Workout Volt', 'Energía extrema 30 servings', 85, 'suplemento', ARRAY['Fuerza', 'Cardio'], '🔋'),
  ('Guantes CyberGrip', 'Agarre máximo soporte de muñeca', 35, 'equipo', ARRAY['Hipertrofia', 'Fuerza'], '🧤'),
  ('Fat Burner Neon', 'Termogénico avanzado 60 caps', 70, 'suplemento', ARRAY['Pérdida de peso', 'Cardio'], '🔥'),
  ('Hoodie Phantom', 'Hoodie oversized edición limitada', 80, 'ropa', ARRAY['Hipertrofia', 'Fuerza', 'Cardio'], '🧥');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
