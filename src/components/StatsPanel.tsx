import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Calendar, Loader2, TrendingUp, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface CheckinRecord {
  xp_earned: number;
  coins_earned: number;
  created_at: string;
}

const StatsPanel = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("checkins")
      .select("xp_earned, coins_earned, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setCheckins((data as CheckinRecord[]) || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const totalXp = checkins.reduce((s, c) => s + c.xp_earned, 0);
  const totalCoins = checkins.reduce((s, c) => s + c.coins_earned, 0);
  const maxXp = Math.max(...checkins.map((c) => c.xp_earned), 1);

  // Last 7 days activity
  const last7 = checkins.slice(0, 7);

  return (
    <div className="space-y-5">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Estadísticas
      </motion.h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "XP Total", value: profile?.xp ?? 0, icon: <Zap className="w-5 h-5" />, accent: "neon-text" },
          { label: "Nivel", value: profile?.level ?? 1, icon: <TrendingUp className="w-5 h-5" />, accent: "neon-text-cyan" },
          { label: "Check-ins", value: checkins.length, icon: <Calendar className="w-5 h-5" />, accent: "neon-text" },
          { label: "Sesiones", value: profile?.total_workouts ?? 0, icon: <BarChart3 className="w-5 h-5" />, accent: "neon-text-cyan" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="neon-card text-center"
          >
            <div className="flex justify-center text-primary mb-1">{s.icon}</div>
            <p className={`text-2xl font-bold font-mono ${s.accent}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* XP History chart (simple bars) */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="neon-card">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Historial de XP (últimos {last7.length} check-ins)
        </h3>
        {last7.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sin datos aún. ¡Haz tu primer check-in!</p>
        ) : (
          <div className="flex items-end gap-1 h-24">
            {last7.reverse().map((c, i) => {
              const height = Math.max((c.xp_earned / maxXp) * 100, 8);
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.6 }}
                  className="flex-1 rounded-t-sm"
                  style={{ background: "linear-gradient(to top, hsl(var(--primary)), hsl(var(--accent)))" }}
                  title={`${c.xp_earned} XP`}
                />
              );
            })}
          </div>
        )}
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
          <span>Antiguo</span>
          <span>Reciente</span>
        </div>
      </motion.div>

      {/* Totals */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="neon-card">
        <h3 className="text-sm font-semibold text-foreground mb-2">Totales Acumulados</h3>
        <div className="grid grid-cols-2 gap-2 text-sm font-mono">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-muted-foreground text-xs">XP Check-ins</p>
            <p className="text-foreground font-bold text-lg">{totalXp}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-muted-foreground text-xs">Coins Check-ins</p>
            <p className="text-foreground font-bold text-lg">{totalCoins}</p>
          </div>
        </div>
      </motion.div>

      {/* Streak info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="neon-card text-center text-xs text-muted-foreground font-mono">
        🔥 Racha actual: {profile?.streak_days ?? 0} días • Total sesiones: {profile?.total_workouts ?? 0}
      </motion.div>
    </div>
  );
};

export default StatsPanel;
