
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🏆',
  category text NOT NULL DEFAULT 'general',
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 0,
  coins_reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements"
  ON public.achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements"
  ON public.user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

INSERT INTO public.achievements (key, name, description, icon, category, requirement_type, requirement_value, xp_reward, coins_reward) VALUES
  ('first_session', 'Primera Sesión', 'Completa tu primer entrenamiento', '🏋️', 'training', 'workouts', 1, 50, 10),
  ('iron_warrior', 'Guerrera de Hierro', 'Entrena 7 días seguidos', '⚔️', 'streak', 'streak', 7, 200, 50),
  ('unstoppable', 'Imparable', 'Racha de 30 días', '🔥', 'streak', 'streak', 30, 500, 100),
  ('centurion', '100 Sesiones', 'Completa 100 entrenamientos', '💯', 'training', 'workouts', 100, 1000, 200),
  ('level_10', 'Nivel 10', 'Alcanza el nivel 10', '⭐', 'progression', 'level', 10, 300, 50),
  ('level_25', 'Élite', 'Alcanza el nivel 25', '👑', 'progression', 'level', 25, 750, 150),
  ('explorer', 'Explorador', 'Haz 10 check-ins GPS', '📍', 'exploration', 'checkins', 10, 200, 40),
  ('shopaholic', 'Comprador Pro', 'Gasta 500 GymCoins', '🛒', 'marketplace', 'coins_spent', 500, 100, 0),
  ('dedicated', 'Dedicación', 'Completa 50 entrenamientos', '💪', 'training', 'workouts', 50, 500, 100),
  ('social_butterfly', 'Social Butterfly', 'Alcanza nivel 5', '🦋', 'social', 'level', 5, 150, 30);
