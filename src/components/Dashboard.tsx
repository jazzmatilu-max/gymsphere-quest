import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Coins, Trophy, Flame, TrendingUp, Target, LogOut, Edit3, Save, Loader2, User } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { sounds } from "@/lib/sounds";

const ACHIEVEMENTS = [
  { name: "Primera Sesión", icon: "🏋️", minWorkouts: 1 },
  { name: "Racha de 7 días", icon: "🔥", minStreak: 7 },
  { name: "100 Check-ins", icon: "📍", minWorkouts: 100 },
  { name: "Nivel 25", icon: "⭐", minLevel: 25 },
  { name: "Social Butterfly", icon: "🦋", minLevel: 10 },
  { name: "Comprador Pro", icon: "🛒", minCoins: 0 },
];

const GOALS = ["Hipertrofia", "Fuerza", "Cardio", "Pérdida de peso"];

const Dashboard = () => {
  const { profile, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [gymName, setGymName] = useState("");
  const [goal, setGoal] = useState("");

  if (!profile) return null;

  const xpToNext = profile.level * 500;
  const xpPercent = Math.min((profile.xp / xpToNext) * 100, 100);

  const startEdit = () => {
    setUsername(profile.username);
    setGymName(profile.gym_name);
    setGoal(profile.fitness_goal);
    setEditing(true);
    sounds.click();
  };

  const saveEdit = async () => {
    setSaving(true);
    await updateProfile({ username, gym_name: gymName, fitness_goal: goal } as any);
    sounds.success();
    toast({ title: "Perfil actualizado", description: "Tus datos han sido guardados" });
    setEditing(false);
    setSaving(false);
  };

  const isUnlocked = (a: typeof ACHIEVEMENTS[0]) => {
    if (a.minWorkouts && profile.total_workouts >= a.minWorkouts) return true;
    if (a.minStreak && profile.streak_days >= a.minStreak) return true;
    if (a.minLevel && profile.level >= a.minLevel) return true;
    if (a.minCoins !== undefined && profile.coins > 0) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative">
        <button onClick={signOut} className="absolute right-0 top-0 text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold neon-text tracking-tight">GymSphere Quest</h1>
        <p className="text-muted-foreground text-sm mt-1 font-mono">// {profile.username}</p>
      </motion.div>

      {/* Avatar mini preview */}
      {profile.avatar_photo_url && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center">
          <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden" style={{ boxShadow: "0 0 20px hsl(155 100% 50% / 0.4)" }}>
            <img src={profile.avatar_photo_url} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </motion.div>
      )}

      {/* Level & XP */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="neon-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-semibold">Nivel {profile.level}</span>
          </div>
          <span className="font-mono text-sm text-muted-foreground">{profile.xp} / {xpToNext} XP</span>
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

      {/* Profile - Editable */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="neon-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Mi Perfil</h3>
          {!editing && (
            <button onClick={startEdit} className="text-muted-foreground hover:text-primary transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-mono block mb-1">USUARIO</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-mono block mb-1">GIMNASIO</label>
                <input value={gymName} onChange={(e) => setGymName(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-mono block mb-1">OBJETIVO</label>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <button key={g} onClick={() => setGoal(g)}
                      className={`text-xs font-medium px-3 py-2 rounded-lg transition-all ${
                        goal === g ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border"
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="neon-button flex-1 text-sm py-2 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
                </button>
                <button onClick={() => setEditing(false)} className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-sm hover:bg-secondary/80 transition-colors">
                  Cancelar
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
          )}
        </AnimatePresence>
      </motion.div>

      {/* Achievements */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="neon-card">
        <h3 className="font-semibold flex items-center gap-2 mb-3"><Trophy className="w-4 h-4 text-primary" /> Logros</h3>
        <div className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = isUnlocked(ach);
            return (
              <div key={ach.name} className={`text-center p-2 rounded-lg ${unlocked ? "bg-primary/10 achievement-glow" : "bg-muted/30 opacity-40"}`}>
                <div className="text-2xl mb-1">{ach.icon}</div>
                <p className="text-[10px] text-muted-foreground leading-tight">{ach.name}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
