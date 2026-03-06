import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Calendar, Loader2, TrendingUp, Zap, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [skillsOpen, setSkillsOpen] = useState(false);

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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  const totalXp = checkins.reduce((s, c) => s + c.xp_earned, 0);
  const totalCoins = checkins.reduce((s, c) => s + c.coins_earned, 0);
  const maxXp = Math.max(...checkins.map((c) => c.xp_earned), 1);
  const last7 = checkins.slice(0, 7);

  // Skills derived from profile stats
  const skills = [
    { name: "Fuerza", value: Math.min(100, (profile?.total_workouts ?? 0) * 5), icon: "💪" },
    { name: "Resistencia", value: Math.min(100, (profile?.streak_days ?? 0) * 8), icon: "🔥" },
    { name: "Disciplina", value: Math.min(100, (profile?.level ?? 1) * 4), icon: "🎯" },
    { name: "Experiencia", value: Math.min(100, Math.round(((profile?.xp ?? 0) / 5000) * 100)), icon: "⚡" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: "XP Total", value: profile?.xp ?? 0, icon: <Zap className="w-4 h-4" />, accent: "neon-text" },
          { label: "Nivel", value: profile?.level ?? 1, icon: <TrendingUp className="w-4 h-4" />, accent: "neon-text-cyan" },
          { label: "Check-ins", value: checkins.length, icon: <Calendar className="w-4 h-4" />, accent: "neon-text" },
          { label: "Sesiones", value: profile?.total_workouts ?? 0, icon: <BarChart3 className="w-4 h-4" />, accent: "neon-text-cyan" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="neon-card text-center backdrop-blur-sm py-3"
          >
            <div className="flex justify-center text-primary mb-1">{s.icon}</div>
            <p className={`text-xl font-bold font-mono ${s.accent}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Skills - Collapsible */}
      <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="neon-card backdrop-blur-sm">
          <CollapsibleTrigger className="w-full flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
              🏆 Skills
            </h3>
            <motion.div animate={{ rotate: skillsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 space-y-2">
              {skills.map((skill) => (
                <div key={skill.name} className="flex items-center gap-2">
                  <span className="text-sm">{skill.icon}</span>
                  <span className="text-[10px] font-mono text-muted-foreground w-20">{skill.name}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.value}%` }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="h-full xp-bar-fill rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-primary w-8 text-right">{skill.value}%</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </motion.div>
      </Collapsible>

      {/* XP History chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="neon-card backdrop-blur-sm">
        <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-primary" /> Historial XP ({last7.length})
        </h3>
        {last7.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-3">Sin datos aún.</p>
        ) : (
          <div className="flex items-end gap-1 h-20">
            {[...last7].reverse().map((c, i) => {
              const height = Math.max((c.xp_earned / maxXp) * 100, 8);
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.5 }}
                  className="flex-1 rounded-t-sm"
                  style={{ background: "linear-gradient(to top, hsl(var(--primary)), hsl(var(--accent)))" }}
                  title={`${c.xp_earned} XP`}
                />
              );
            })}
          </div>
        )}
        <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground font-mono">
          <span>Antiguo</span>
          <span>Reciente</span>
        </div>
      </motion.div>

      {/* Totals */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="neon-card backdrop-blur-sm">
        <h3 className="text-xs font-semibold text-foreground mb-2">Totales Acumulados</h3>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className="text-muted-foreground text-[10px]">XP Check-ins</p>
            <p className="text-foreground font-bold text-base">{totalXp}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className="text-muted-foreground text-[10px]">Coins Check-ins</p>
            <p className="text-foreground font-bold text-base">{totalCoins}</p>
          </div>
        </div>
      </motion.div>

      {/* Streak */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="neon-card text-center text-[10px] text-muted-foreground font-mono backdrop-blur-sm py-2">
        🔥 Racha: {profile?.streak_days ?? 0} días • Sesiones: {profile?.total_workouts ?? 0}
      </motion.div>
    </div>
  );
};

export default StatsPanel;
