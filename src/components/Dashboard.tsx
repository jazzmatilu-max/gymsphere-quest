import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Coins, Trophy, Flame, TrendingUp, Target, LogOut, Edit3, Save, Loader2, User, Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { sounds } from "@/lib/sounds";
import SyncLoader from "./SyncLoader";
import AchievementsPanel from "./AchievementsPanel";

const GOALS = ["Hipertrofia", "Fuerza", "Cardio", "Pérdida de peso"];

/* God Mode: golden neon theme when daily goal is met */
const useGodMode = (totalWorkouts: number) => {
  const [active, setActive] = useState(false);
  useEffect(() => {
    // God mode activates at 5+ total workouts (simulates daily goal)
    const isGod = totalWorkouts >= 5;
    setActive(isGod);
    if (isGod) {
      document.documentElement.style.setProperty("--primary", "45 100% 55%");
      document.documentElement.style.setProperty("--neon-glow", "45 100% 55%");
      document.documentElement.style.setProperty("--ring", "45 100% 55%");
    }
    return () => {
      document.documentElement.style.setProperty("--primary", "155 100% 50%");
      document.documentElement.style.setProperty("--neon-glow", "155 100% 50%");
      document.documentElement.style.setProperty("--ring", "155 100% 50%");
    };
  }, [totalWorkouts]);
  return active;
};

/* Falling coin animation */
const FallingCoins = ({ trigger }: { trigger: number }) => {
  const [coins, setCoins] = useState<{ id: number; x: number }[]>([]);
  useEffect(() => {
    if (trigger <= 0) return;
    const newCoins = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: 20 + Math.random() * 60,
    }));
    setCoins(newCoins);
    const t = setTimeout(() => setCoins([]), 1500);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <AnimatePresence>
        {coins.map((coin) => (
          <motion.div
            key={coin.id}
            initial={{ y: -30, x: `${coin.x}%`, opacity: 1, scale: 1 }}
            animate={{ y: "100vh", opacity: 0, rotate: 720 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeIn" }}
            className="absolute text-2xl"
          >
            🪙
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = () => {
  const { profile, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [gymName, setGymName] = useState("");
  const [goal, setGoal] = useState("");
  const [coinDrop, setCoinDrop] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const [syncing, setSyncing] = useState(true);

  const godMode = useGodMode(profile?.total_workouts || 0);

  if (!profile) return null;

  const xpToNext = profile.level * 500;
  const xpPercent = Math.min((profile.xp / xpToNext) * 100, 100);

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

  const handleFactoryReset = () => {
    sounds.error();
    localStorage.clear();
    toast({ title: "MEMORIA BORRADA", description: "Reiniciando sistema..." });
    setTimeout(() => window.location.reload(), 1000);
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
      <FallingCoins trigger={coinDrop} />

      {godMode && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center text-xs font-mono text-yellow-400 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30">
          ⚡ MODO DIOS ACTIVO ⚡
        </motion.div>
      )}

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
          <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden" style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.4)" }}>
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
            transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
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
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
            className="neon-card text-center cursor-pointer"
            onClick={() => { if (stat.label === "GymCoins") { setCoinDrop(c => c + 1); sounds.purchase(); } else { sounds.click(); } }}>
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

      {/* Factory Reset - hidden toggle */}
      <div className="text-center">
        <button onClick={() => setShowReset(!showReset)} className="text-[10px] text-muted-foreground/30 font-mono hover:text-muted-foreground transition-colors">
          SISTEMA v2.0
        </button>
        <AnimatePresence>
          {showReset && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden">
              <button onClick={handleFactoryReset}
                className="flex items-center gap-2 mx-auto text-xs font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2 hover:bg-destructive/20 transition-colors">
                <Trash2 className="w-3 h-3" /> BORRAR MEMORIA DE SISTEMA
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
