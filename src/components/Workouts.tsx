import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Heart, Footprints, ArrowUp, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { sounds } from "@/lib/sounds";
import { triggerNotification } from "./InAppNotification";
import SyncLoader from "./SyncLoader";
import MuscleVisualizer from "./MuscleVisualizer";

const CATEGORIES = [
  { id: "cardio", label: "Cardio", icon: <Footprints className="w-4 h-4" />, color: "text-blue-400" },
  { id: "biceps", label: "Bíceps", icon: <Dumbbell className="w-4 h-4" />, color: "text-primary" },
  { id: "pierna", label: "Pierna", icon: <ArrowUp className="w-4 h-4 rotate-180" />, color: "text-orange-400" },
  { id: "espalda", label: "Espalda", icon: <ShieldAlert className="w-4 h-4" />, color: "text-purple-400" },
  { id: "brazos", label: "Brazos", icon: <Dumbbell className="w-4 h-4" />, color: "text-cyan-400" },
  { id: "hombros", label: "Hombros", icon: <ArrowUp className="w-4 h-4" />, color: "text-pink-400" },
];

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  xp: number;
}

const EXERCISES: Record<string, Exercise[]> = {
  cardio: [
    { name: "Correr en cinta", sets: "1", reps: "20 min", xp: 40 },
    { name: "Saltar cuerda", sets: "3", reps: "3 min", xp: 35 },
    { name: "Bicicleta estática", sets: "1", reps: "25 min", xp: 45 },
    { name: "Burpees", sets: "4", reps: "15", xp: 50 },
  ],
  biceps: [
    { name: "Curl con barra", sets: "4", reps: "12", xp: 30 },
    { name: "Curl martillo", sets: "3", reps: "12", xp: 25 },
    { name: "Curl concentrado", sets: "3", reps: "10", xp: 25 },
    { name: "Curl con cable", sets: "3", reps: "15", xp: 20 },
  ],
  pierna: [
    { name: "Sentadilla", sets: "4", reps: "12", xp: 50 },
    { name: "Prensa de pierna", sets: "4", reps: "15", xp: 45 },
    { name: "Extensión de cuádriceps", sets: "3", reps: "12", xp: 25 },
    { name: "Curl de isquiotibiales", sets: "3", reps: "12", xp: 25 },
    { name: "Peso muerto rumano", sets: "4", reps: "10", xp: 45 },
  ],
  espalda: [
    { name: "Jalón al pecho", sets: "4", reps: "12", xp: 35 },
    { name: "Remo con barra", sets: "4", reps: "10", xp: 40 },
    { name: "Remo con mancuerna", sets: "3", reps: "12", xp: 30 },
    { name: "Pull-ups", sets: "3", reps: "max", xp: 50 },
  ],
  brazos: [
    { name: "Press francés", sets: "3", reps: "12", xp: 30 },
    { name: "Extensión de tríceps", sets: "3", reps: "15", xp: 25 },
    { name: "Fondos en paralelas", sets: "3", reps: "12", xp: 40 },
    { name: "Kickback con mancuerna", sets: "3", reps: "12", xp: 20 },
  ],
  hombros: [
    { name: "Press militar", sets: "4", reps: "10", xp: 40 },
    { name: "Elevaciones laterales", sets: "3", reps: "15", xp: 25 },
    { name: "Elevaciones frontales", sets: "3", reps: "12", xp: 25 },
    { name: "Face pull", sets: "3", reps: "15", xp: 30 },
  ],
};

const DAILY_XP_LIMIT = 200;

const Workouts = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const [activeCategory, setActiveCategory] = useState("cardio");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [dailyXp, setDailyXp] = useState(0);
  const [overtraining, setOvertraining] = useState(false);
  const [logging, setLogging] = useState<string | null>(null);

  const handleComplete = async (exercise: Exercise) => {
    if (!user || logging) return;
    const key = `${activeCategory}-${exercise.name}`;
    if (completed.has(key)) return;

    const newDailyXp = dailyXp + exercise.xp;

    if (newDailyXp > DAILY_XP_LIMIT) {
      setOvertraining(true);
      sounds.error();
      toast({
        title: "⚠️ ADVERTENCIA",
        description: "Riesgo de sobreentrenamiento detectado. Descanso recomendado.",
        variant: "destructive",
      });
      try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch {}
      return;
    }

    setLogging(key);
    sounds.click();

    const { data } = await supabase.rpc("add_xp", {
      p_user_id: user.id,
      p_xp: exercise.xp,
      p_coins: Math.floor(exercise.xp / 5),
    });

    if (data && !(data as any).error) {
      setCompleted((prev) => new Set(prev).add(key));
      setDailyXp(newDailyXp);
      sounds.success();
      toast({ title: `+${exercise.xp} XP`, description: `${exercise.name} completado` });

      if ((data as any).leveled_up) {
        sounds.levelUp();
        toast({ title: "🎮 ¡NIVEL ARRIBA!", description: `Ahora eres nivel ${(data as any).level}` });
      }
      await refetch();
    }
    setLogging(null);
  };

  const exercises = EXERCISES[activeCategory] || [];
  const xpPercent = Math.min((dailyXp / DAILY_XP_LIMIT) * 100, 100);

  return (
    <div className="space-y-5">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Rutinas
      </motion.h2>

      {/* Overtraining warning */}
      <AnimatePresence>
        {overtraining && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="neon-card border-2 border-destructive bg-destructive/10"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
              <div>
                <p className="font-bold text-destructive text-sm">SOBREENTRENAMIENTO DETECTADO</p>
                <p className="text-xs text-muted-foreground mt-0.5">Has alcanzado tu límite diario de {DAILY_XP_LIMIT} XP. Descansa y vuelve mañana.</p>
              </div>
            </div>
            <button onClick={() => setOvertraining(false)} className="mt-2 text-xs text-muted-foreground hover:text-foreground font-mono">
              Entendido ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily XP progress */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="neon-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-muted-foreground">XP DIARIO</span>
          <span className={`text-xs font-mono font-bold ${dailyXp >= DAILY_XP_LIMIT ? "text-destructive" : "text-primary"}`}>
            {dailyXp} / {DAILY_XP_LIMIT}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${xpPercent}%` }}
            className={`h-full rounded-full ${dailyXp >= DAILY_XP_LIMIT ? "bg-destructive" : ""}`}
            style={dailyXp < DAILY_XP_LIMIT ? { background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" } : {}}
          />
        </div>
      </motion.div>

      {/* Category selector - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); sounds.click(); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Exercise cards */}
      <div className="space-y-3">
        {exercises.map((ex, i) => {
          const key = `${activeCategory}-${ex.name}`;
          const isDone = completed.has(key);
          const isLogging = logging === key;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`neon-card flex items-center justify-between transition-all ${isDone ? "border-primary/50 bg-primary/5" : ""}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {isDone && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                  <h4 className={`font-semibold text-sm ${isDone ? "text-primary" : "text-foreground"}`}>{ex.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {ex.sets} series × {ex.reps} reps • +{ex.xp} XP
                </p>
              </div>
              <button
                onClick={() => handleComplete(ex)}
                disabled={isDone || isLogging || overtraining}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  isDone
                    ? "bg-primary/20 text-primary cursor-default"
                    : overtraining
                    ? "bg-destructive/20 text-destructive"
                    : "neon-button"
                }`}
              >
                {isLogging ? <Heart className="w-4 h-4 animate-pulse" /> : isDone ? "✓" : "Hacer"}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Stats summary */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="neon-card text-center text-xs text-muted-foreground font-mono">
        Nivel {profile?.level} • {profile?.xp} XP total • {completed.size} ejercicios hoy
      </motion.div>
    </div>
  );
};

export default Workouts;
