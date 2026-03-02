import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  level: number;
  xp: number;
  coins: number;
  streak_days: number;
  total_workouts: number;
  fitness_goal: string;
  gym_name: string;
  gym_lat: number | null;
  gym_lng: number | null;
  avatar_skin_tone: string | null;
  avatar_hair_color: string | null;
  avatar_photo_url: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    setProfile(data as unknown as Profile | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    await supabase.from("profiles").update(updates).eq("user_id", user.id);
    await fetchProfile();
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
};
