import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { triggerNotification } from "./InAppNotification";
import { sounds } from "@/lib/sounds";

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  coins_reward: number;
}

const AchievementsPanel = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("achievements").select("*"),
      supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id),
    ]).then(([{ data: achData }, { data: uaData }]) => {
      setAchievements((achData as unknown as Achievement[]) || []);
      setUnlocked(new Set((uaData || []).map((u: any) => u.achievement_id)));
      setLoading(false);
    });
  }, [user]);

  // Check and unlock achievements
  useEffect(() => {
    if (!user || !profile || loading || achievements.length === 0) return;

    const checkAndUnlock = async () => {
      for (const ach of achievements) {
        if (unlocked.has(ach.id)) continue;

        let met = false;
        switch (ach.requirement_type) {
          case "workouts": met = profile.total_workouts >= ach.requirement_value; break;
          case "streak": met = profile.streak_days >= ach.requirement_value; break;
          case "level": met = profile.level >= ach.requirement_value; break;
          case "checkins": met = profile.total_workouts >= ach.requirement_value; break;
        }

        if (met) {
          const { error } = await supabase.from("user_achievements").insert({
            user_id: user.id,
            achievement_id: ach.id,
          });
          if (!error) {
            setUnlocked((prev) => new Set(prev).add(ach.id));
            sounds.levelUp();
            triggerNotification(`🏆 ¡Logro desbloqueado: ${ach.name}!`, ach.xp_reward);
          }
        }
      }
    };

    checkAndUnlock();
  }, [user, profile, loading, achievements, unlocked]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  const unlockedList = achievements.filter((a) => unlocked.has(a.id));
  const lockedList = achievements.filter((a) => !unlocked.has(a.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Logros ({unlockedList.length}/{achievements.length})</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[...unlockedList, ...lockedList].map((ach, i) => {
          const isUnlocked = unlocked.has(ach.id);
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`text-center p-2 rounded-lg transition-all ${
                isUnlocked ? "bg-primary/10 achievement-glow" : "bg-muted/30 opacity-40"
              }`}
            >
              <div className="text-2xl mb-1">{ach.icon}</div>
              <p className="text-[10px] text-muted-foreground leading-tight font-medium">{ach.name}</p>
              {isUnlocked && ach.xp_reward > 0 && (
                <p className="text-[8px] text-primary font-mono mt-0.5">+{ach.xp_reward} XP</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsPanel;
