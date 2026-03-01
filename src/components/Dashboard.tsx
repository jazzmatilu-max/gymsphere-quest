import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Coins, Trophy, Flame, TrendingUp, Target, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Error al cargar perfil");
      }
      setProfile(data);
      setLoading(false);
    };

    fetchProfile();

    // Subscribe to profile changes for real-time level ups
    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newProfile = payload.new as Tables<"profiles">;
          if (profile && newProfile.level > profile.level) {
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 3000);
          }
          setProfile(newProfile);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const xpToNext = profile.level * 500;
  const xpPercent = (profile.xp / xpToNext) * 100;

  const achievements = [
    { name: "Primera Sesión", icon: "🏋️", unlocked: profile.total_workouts >= 1 },
    { name: "Racha de 7 días", icon: "🔥", unlocked: profile.streak_days >= 7 },
    { name: "100 Check-ins", icon: "📍", unlocked: profile.total_workouts >= 100 },
    { name: "Nivel 25", icon: "⭐", unlocked: profile.level >= 25 },
    { name: "Nivel 10", icon: "🎯", unlocked: profile.level >= 10 },
    { name: "Rico", icon: "💰", unlocked: profile.coins >= 500 },
  ];

  return (
    <div className="space-y-6">
      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-7xl"
              >
                ⚡
              </motion.div>
              <h2 className="text-4xl font-bold neon-text">¡NIVEL {profile.level}!</h2>
              <p className="text-muted-foreground">Has subido de nivel</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold neon-text tracking-tight">GymSphere Quest</h1>
          <p className="text-muted-foreground text-sm font-mono">// {profile.username}</p>
        </div>
        <button onClick={signOut} className="text-muted-foreground hover:text-foreground p-2">
          <LogOut className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Level & XP */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="neon-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-semibold">Nivel {profile.level}</span>
          </div>
          <span className="font-mono text-sm text-muted-foreground">
            {profile.xp} / {xpToNext} XP
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
            className="h-full xp-bar-fill rounded-full"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Coins className="w-5 h-5" />, value: profile.coins, label: "GymCoins", color: "neon-text-cyan" },
          { icon: <Flame className="w-5 h-5" />, value: `${profile.streak_days}d`, label: "Racha", color: "neon-text" },
          { icon: <TrendingUp className="w-5 h-5" />, value: profile.total_workouts, label: "Sesiones", color: "neon-text" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="neon-card text-center">
            <div className="flex justify-center mb-1 text-primary">{stat.icon}</div>
            <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Profile Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="neon-card space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Mi Perfil
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm font-mono">
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-muted-foreground text-xs">OBJETIVO</p>
            <p className="text-foreground">{profile.fitness_goal}</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-muted-foreground text-xs">GIMNASIO</p>
            <p className="text-foreground">{profile.gym_name}</p>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="neon-card">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-primary" />
          Logros
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((ach) => (
            <div key={ach.name} className={`text-center p-2 rounded-lg ${ach.unlocked ? "bg-primary/10 achievement-glow" : "bg-muted/30 opacity-40"}`}>
              <div className="text-2xl mb-1">{ach.icon}</div>
              <p className="text-[10px] text-muted-foreground leading-tight">{ach.name}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
