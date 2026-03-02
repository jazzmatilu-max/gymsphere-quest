
-- Add weight and height columns for nutrition advisor
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS age integer;

-- Add marketplace items if empty
INSERT INTO public.marketplace_items (name, price, category, emoji, description, fitness_goals)
SELECT * FROM (VALUES
  ('Whey Protein Cyber', 120, 'suplemento', '🥤', 'Proteína de suero premium 2kg', ARRAY['Hipertrofia', 'Fuerza']),
  ('Creatina NeonForce', 60, 'suplemento', '⚡', 'Monohidrato puro 500g', ARRAY['Hipertrofia', 'Fuerza']),
  ('Tank Top Glitch', 45, 'ropa', '👕', 'Fibra anti-sudor con diseño cyberpunk', ARRAY['Hipertrofia', 'Cardio']),
  ('Shorts HyperFlex', 55, 'ropa', '🩳', 'Shorts elásticos con bolsillos', ARRAY['Cardio', 'Pérdida de peso']),
  ('Pre-Workout Volt', 85, 'suplemento', '🔋', 'Energía extrema 30 servings', ARRAY['Fuerza', 'Cardio']),
  ('Guantes CyberGrip', 35, 'equipo', '🧤', 'Agarre máximo con soporte de muñeca', ARRAY['Hipertrofia', 'Fuerza']),
  ('Fat Burner Neon', 70, 'suplemento', '🔥', 'Termogénico avanzado 60 caps', ARRAY['Pérdida de peso', 'Cardio']),
  ('Hoodie Phantom', 80, 'ropa', '🧥', 'Hoodie oversized edición limitada', ARRAY['Hipertrofia', 'Fuerza', 'Cardio']),
  ('BCAA Matrix', 50, 'suplemento', '💊', 'Aminoácidos ramificados 300g', ARRAY['Hipertrofia', 'Fuerza', 'Cardio']),
  ('Skin: Neon Warrior', 200, 'skin', '🎨', 'Skin exclusiva de avatar neón', ARRAY['Hipertrofia', 'Fuerza', 'Cardio', 'Pérdida de peso']),
  ('Skin: Shadow Ghost', 250, 'skin', '👻', 'Skin fantasma con efecto humo', ARRAY['Hipertrofia', 'Fuerza', 'Cardio', 'Pérdida de peso']),
  ('Skin: Fire Lord', 300, 'skin', '🔥', 'Skin de fuego con aura ardiente', ARRAY['Hipertrofia', 'Fuerza', 'Cardio', 'Pérdida de peso'])
) AS v(name, price, category, emoji, description, fitness_goals)
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_items LIMIT 1);

-- Create purchase function
CREATE OR REPLACE FUNCTION public.purchase_item(p_user_id uuid, p_item_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_item marketplace_items%ROWTYPE;
  v_existing user_inventory%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN json_build_object('error', 'Profile not found'); END IF;

  SELECT * INTO v_item FROM marketplace_items WHERE id = p_item_id;
  IF NOT FOUND THEN RETURN json_build_object('error', 'Item not found'); END IF;

  IF NOT v_item.in_stock THEN RETURN json_build_object('error', 'Out of stock'); END IF;

  IF v_profile.coins < v_item.price THEN
    RETURN json_build_object('error', 'Insufficient coins', 'required', v_item.price, 'current', v_profile.coins);
  END IF;

  UPDATE profiles SET coins = coins - v_item.price, updated_at = now() WHERE user_id = p_user_id;

  SELECT * INTO v_existing FROM user_inventory WHERE user_id = p_user_id AND item_id = p_item_id;
  IF FOUND THEN
    UPDATE user_inventory SET quantity = quantity + 1 WHERE id = v_existing.id;
  ELSE
    INSERT INTO user_inventory (user_id, item_id) VALUES (p_user_id, p_item_id);
  END IF;

  RETURN json_build_object(
    'success', true,
    'new_balance', v_profile.coins - v_item.price,
    'item_name', v_item.name
  );
END;
$$;
