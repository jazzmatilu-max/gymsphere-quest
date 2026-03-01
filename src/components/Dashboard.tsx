import { motion } from "framer-motion";
import { Zap, Coins, Trophy, Flame, TrendingUp, Target } from "lucide-react";

const PROFILE = {
  name: "Jugador_01",
  level: 10,
  xp: 2000,
  xpToNext: 3000,
  coins: 450,
  streak: 7,
  totalWorkouts: 42,
  goal: "Hipertrofia",
  gym: "GymTech Central",
  achievements: [
    { name: "Primera Sesión", icon: "🏋️", unlocked: true },
    { name: "Racha de 7 días", icon: "🔥", unlocked: true },
    { name: "100 Check-ins", icon: "📍", unlocked: false },
    { name: "Nivel 25", icon: "⭐", unlocked: false },
    { name: "Social Butterfly", icon: "🦋", unlocked: false },
    { name: "Comprador Pro", icon: "🛒", unlocked: true },
  ],
};

const Dashboard = () => {
  const xpPercent = (PROFILE.xp / PROFILE.xpToNext) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold neon-text tracking-tight">
          GymSphere Quest
        </h1>
        <p className="text-muted-foreground text-sm mt-1 font-mono">
          // {PROFILE.name}
        </p>
      </motion.div>

      {/* Level & XP */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="neon-card"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-semibold">Nivel {PROFILE.level}</span>
          </div>
          <span className="font-mono text-sm text-muted-foreground">
            {PROFILE.xp} / {PROFILE.xpToNext} XP
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

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Coins className="w-5 h-5" />, value: PROFILE.coins, label: "GymCoins", color: "neon-text-cyan" },
          { icon: <Flame className="w-5 h-5" />, value: `${PROFILE.streak}d`, label: "Racha", color: "neon-text" },
          { icon: <TrendingUp className="w-5 h-5" />, value: PROFILE.totalWorkouts, label: "Sesiones", color: "neon-text" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="neon-card text-center"
          >
            <div className="flex justify-center mb-1 text-primary">{stat.icon}</div>
            <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="neon-card space-y-3"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Mi Perfil
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm font-mono">
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-muted-foreground text-xs">OBJETIVO</p>
            <p className="text-foreground">{PROFILE.goal}</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-muted-foreground text-xs">GIMNASIO</p>
            <p className="text-foreground">{PROFILE.gym}</p>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="neon-card"
      >
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-primary" />
          Logros
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {PROFILE.achievements.map((ach) => (
            <div
              key={ach.name}
              className={`text-center p-2 rounded-lg ${
                ach.unlocked
                  ? "bg-primary/10 achievement-glow"
                  : "bg-muted/30 opacity-40"
              }`}
            >
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
