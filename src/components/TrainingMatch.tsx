import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Zap, Heart, X } from "lucide-react";

interface MatchUser {
  id: string;
  name: string;
  level: number;
  xp: number;
  gym: string;
  distance: number;
  schedule: string[];
  goal: string;
  avatar: string;
}

const MOCK_USERS: MatchUser[] = [
  { id: "1", name: "Carlos V.", level: 15, xp: 3200, gym: "GymTech Central", distance: 0.3, schedule: ["Lunes", "Miércoles", "Viernes"], goal: "Hipertrofia", avatar: "🦾" },
  { id: "2", name: "Ana R.", level: 22, xp: 5100, gym: "GymTech Central", distance: 0.1, schedule: ["Martes", "Jueves", "Sábado"], goal: "Fuerza", avatar: "⚡" },
  { id: "3", name: "Miguel S.", level: 8, xp: 1400, gym: "IronForge Gym", distance: 1.2, schedule: ["Lunes", "Martes", "Jueves"], goal: "Cardio", avatar: "🔥" },
  { id: "4", name: "Laura P.", level: 30, xp: 8900, gym: "GymTech Central", distance: 0.05, schedule: ["Lunes", "Miércoles", "Viernes"], goal: "Hipertrofia", avatar: "💪" },
  { id: "5", name: "Diego M.", level: 12, xp: 2700, gym: "FlexZone", distance: 2.5, schedule: ["Miércoles", "Viernes", "Domingo"], goal: "Pérdida de peso", avatar: "🏃" },
];

const USER_PROFILE = {
  level: 10,
  xp: 2000,
  gym: "GymTech Central",
  schedule: ["Lunes", "Miércoles", "Viernes"],
  goal: "Hipertrofia",
};

function calculateAffinity(user: MatchUser): number {
  let score = 0;

  // Same gym = +30
  if (user.gym === USER_PROFILE.gym) score += 30;

  // Distance score (closer = better, max 20)
  score += Math.max(0, 20 - user.distance * 8);

  // Schedule overlap (max 30)
  const overlap = user.schedule.filter((d) => USER_PROFILE.schedule.includes(d)).length;
  score += (overlap / Math.max(user.schedule.length, USER_PROFILE.schedule.length)) * 30;

  // XP similarity (max 10)
  const xpDiff = Math.abs(user.xp - USER_PROFILE.xp);
  score += Math.max(0, 10 - xpDiff / 500);

  // Same goal (10)
  if (user.goal === USER_PROFILE.goal) score += 10;

  return Math.min(100, Math.round(score));
}

const TrainingMatch = () => {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  const matches = useMemo(
    () =>
      MOCK_USERS.map((u) => ({ ...u, affinity: calculateAffinity(u) }))
        .sort((a, b) => b.affinity - a.affinity),
    []
  );

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold neon-text"
      >
        Match de Entrenamiento
      </motion.h2>

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
                <div className="text-3xl">{match.avatar}</div>
                <div>
                  <h3 className="font-semibold text-foreground">{match.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    LVL {match.level} • {match.xp} XP
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-2xl font-bold font-mono ${
                    match.affinity >= 80
                      ? "neon-text"
                      : match.affinity >= 50
                      ? "neon-text-cyan"
                      : "text-muted-foreground"
                  }`}
                >
                  {match.affinity}%
                </div>
                <p className="text-xs text-muted-foreground">Afinidad</p>
              </div>
            </div>

            {/* Affinity bar */}
            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${match.affinity}%` }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                className="h-full xp-bar-fill rounded-full"
              />
            </div>

            {selectedMatch === match.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 pt-3 border-t border-border space-y-2 text-sm"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {match.gym} — {match.distance} km
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-accent" />
                  {match.schedule.join(", ")}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="w-4 h-4 text-neon-purple" />
                  Objetivo: {match.goal}
                </div>
                <button className="neon-button w-full mt-2 text-sm py-2 flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" />
                  Enviar Solicitud
                </button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrainingMatch;
