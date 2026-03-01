import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Zap, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const SCHEDULES = ["Lunes", "Miércoles", "Viernes"];

function calculateAffinity(me: Tables<"profiles">, other: Tables<"profiles">): number {
  let score = 0;
  if (me.gym_name === other.gym_name) score += 35;
  if (me.fitness_goal === other.fitness_goal) score += 25;

  // XP similarity (max 20)
  const xpDiff = Math.abs(me.xp - other.xp);
  score += Math.max(0, 20 - xpDiff / 200);

  // Level proximity (max 20)
  const lvlDiff = Math.abs(me.level - other.level);
  score += Math.max(0, 20 - lvlDiff * 2);

  return Math.min(100, Math.round(score));
}

const TrainingMatch = () => {
  const { user } = useAuth();
  const [myProfile, setMyProfile] = useState<Tables<"profiles"> | null>(null);
  const [allProfiles, setAllProfiles] = useState<Tables<"profiles">[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: me }, { data: others }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("*").neq("user_id", user.id),
      ]);
      setMyProfile(me);
      setAllProfiles(others ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const matches = useMemo(() => {
    if (!myProfile) return [];
    return allProfiles
      .map((p) => ({ ...p, affinity: calculateAffinity(myProfile, p) }))
      .sort((a, b) => b.affinity - a.affinity);
  }, [myProfile, allProfiles]);

  const sendMatchRequest = async (targetId: string, affinity: number) => {
    if (!user) return;
    const { error } = await supabase.from("training_matches").insert({
      requester_id: user.id,
      target_id: targetId,
      affinity_score: affinity,
    });
    if (error) {
      toast.error("Error al enviar solicitud");
    } else {
      toast.success("¡Solicitud de match enviada!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Match de Entrenamiento
      </motion.h2>

      {matches.length === 0 ? (
        <div className="neon-card text-center py-8">
          <p className="text-muted-foreground">No hay otros usuarios aún. ¡Invita amigos a registrarse!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedMatch(selectedMatch === match.id ? null : match.id)}
              className="neon-card cursor-pointer hover:border-primary/60 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                    {match.avatar_photo_url ? (
                      <img src={match.avatar_photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      "🦾"
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{match.username}</h3>
                    <p className="text-xs text-muted-foreground font-mono">LVL {match.level} • {match.xp} XP</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-bold font-mono ${match.affinity >= 80 ? "neon-text" : match.affinity >= 50 ? "neon-text-cyan" : "text-muted-foreground"}`}>
                    {match.affinity}%
                  </div>
                  <p className="text-xs text-muted-foreground">Afinidad</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${match.affinity}%` }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                  className="h-full xp-bar-fill rounded-full"
                />
              </div>

              {selectedMatch === match.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-3 border-t border-border space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    {match.gym_name}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="w-4 h-4 text-neon-purple" />
                    Objetivo: {match.fitness_goal}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); sendMatchRequest(match.user_id, match.affinity); }}
                    className="neon-button w-full mt-2 text-sm py-2 flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Enviar Solicitud
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingMatch;
