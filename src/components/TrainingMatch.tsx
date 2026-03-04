import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Zap, Heart, Loader2, Users, Radio, User, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, type Profile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { sounds } from "@/lib/sounds";

function calculateAffinity(me: Profile, other: Profile): number {
  let score = 0;
  if (me.gym_name === other.gym_name) score += 30;
  if (me.fitness_goal === other.fitness_goal) score += 20;
  const xpDiff = Math.abs(me.xp - other.xp);
  score += Math.max(0, 20 - xpDiff / 200);
  const levelDiff = Math.abs(me.level - other.level);
  score += Math.max(0, 15 - levelDiff * 2);
  score += 15;
  return Math.min(100, Math.round(score));
}

function triggerVibration() {
  try { navigator.vibrate?.([100, 50, 200]); } catch {}
}

const GlitchOverlay = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-50 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.08) 2px, rgba(0,255,200,0.08) 4px)",
          mixBlendMode: "screen",
        }}
      >
        <motion.div
          animate={{ x: [-3, 3, -2, 0], y: [2, -2, 1, 0] }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
          style={{ boxShadow: "inset 0 0 60px hsl(155 100% 50% / 0.3)" }}
        />
      </motion.div>
    )}
  </AnimatePresence>
);

/* Anomaly detection panel */
const AnomalyPanel = ({ match, onClose }: { match: { username: string; affinity: number; level: number; fitness_goal: string } | null; onClose: () => void }) => (
  <AnimatePresence>
    {match && (
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-4 right-4 z-50 neon-card border-2 border-primary"
        style={{ boxShadow: "0 0 30px hsl(155 100% 50% / 0.4), 0 0 60px hsl(155 100% 50% / 0.1)" }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-primary font-mono text-sm">⚡ ANOMALÍA DETECTADA</p>
            <p className="text-foreground text-sm mt-1">
              Guerrero compatible: <strong>{match.username}</strong>
            </p>
            <p className="text-muted-foreground text-xs font-mono mt-1">
              LVL {match.level} • {match.fitness_goal} • Afinidad: {match.affinity}%
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs font-mono">✕</button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const TrainingMatch = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [glitch, setGlitch] = useState(false);
  const [anomaly, setAnomaly] = useState<{ username: string; affinity: number; level: number; fitness_goal: string } | null>(null);

  const startScan = useCallback(() => {
    setScanning(true);
    sounds.sonar();

    // Request real geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {}, // We got permission, proceed with scan animation
        () => toast({ title: "GPS no disponible", description: "Activa tu GPS para detectar guerreros cercanos", variant: "destructive" }),
        { timeout: 5000 }
      );
    }

    setTimeout(() => {
      setScanning(false);
      if (users.length > 0) {
        // Glitch effect + vibration
        setGlitch(true);
        triggerVibration();
        setTimeout(() => setGlitch(false), 600);

        sounds.match();

        // Show anomaly panel for top match
        const topMatch = users
          .map((u) => ({ ...u, affinity: profile ? calculateAffinity(profile, u) : 0 }))
          .sort((a, b) => b.affinity - a.affinity)[0];

        if (topMatch) {
          setAnomaly({
            username: topMatch.username,
            affinity: topMatch.affinity,
            level: topMatch.level,
            fitness_goal: topMatch.fitness_goal,
          });
          setTimeout(() => setAnomaly(null), 6000);
        }

        toast({ title: "¡SEÑAL DETECTADA!", description: `${users.length} guerrero(s) encontrado(s) en tu zona` });
      }
    }, 2500);
  }, [users, profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").neq("user_id", user.id).then(({ data }) => {
      setUsers((data as unknown as Profile[]) || []);
      setLoading(false);
    });
  }, [user]);

  const matches = useMemo(() => {
    if (!profile) return [];
    return users
      .map((u) => ({ ...u, affinity: calculateAffinity(profile, u) }))
      .sort((a, b) => b.affinity - a.affinity);
  }, [users, profile]);

  const handleMatch = async (targetId: string, affinity: number) => {
    if (!user) return;
    setSending(targetId);
    sounds.click();

    const { error } = await supabase.from("training_matches").insert({
      requester_id: user.id,
      target_id: targetId,
      affinity_score: affinity,
    });

    if (error) {
      sounds.error();
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      triggerVibration();
      sounds.match();
      toast({ title: "¡Match enviado!", description: "Solicitud de entrenamiento enviada" });
    }
    setSending(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Buscando guerreros cercanos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlitchOverlay active={glitch} />
      <AnomalyPanel match={anomaly} onClose={() => setAnomaly(null)} />

      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Radar de Match
      </motion.h2>

      {/* Radar scan */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="neon-card flex flex-col items-center gap-4">
        <div className="relative w-32 h-32">
          {[1, 2, 3].map((ring) => (
            <div key={ring} className="absolute rounded-full border border-primary/20"
              style={{ inset: `${(3 - ring) * 16}px` }} />
          ))}
          <AnimatePresence>
            {scanning && (
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: 1, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left"
                  style={{ background: "linear-gradient(90deg, hsl(155 100% 50%), transparent)" }} />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            animate={{ scale: scanning ? [1, 1.5, 1] : 1 }}
            transition={{ duration: 1, repeat: scanning ? Infinity : 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary"
            style={{ boxShadow: "0 0 10px hsl(155 100% 50%)" }}
          />
          {!scanning && matches.slice(0, 5).map((m, i) => {
            const angle = (i * 72) * (Math.PI / 180);
            const radius = 40 - (m.affinity / 100) * 20;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                className="absolute w-2 h-2 rounded-full bg-accent"
                style={{
                  top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                  left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                  boxShadow: "0 0 6px hsl(280 100% 65%)",
                }} />
            );
          })}
        </div>
        <button onClick={startScan} disabled={scanning} className="neon-button text-sm py-2 flex items-center gap-2">
          <Radio className="w-4 h-4" /> {scanning ? "Escaneando..." : "Escanear Zona"}
        </button>
        <p className="text-xs text-muted-foreground font-mono text-center">
          {matches.length} guerrero(s) detectados • Gimnasio: {profile?.gym_name}
        </p>
      </motion.div>

      {matches.length === 0 ? (
        <div className="neon-card text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No hay guerreros disponibles aún. ¡Invita a otros!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, i) => (
            <motion.div key={match.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              onClick={() => { setSelectedMatch(selectedMatch === match.id ? null : match.id); sounds.click(); }}
              className="neon-card cursor-pointer hover:border-primary/60 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {match.avatar_photo_url ? (
                      <img src={match.avatar_photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
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
                <motion.div initial={{ width: 0 }} animate={{ width: `${match.affinity}%` }} transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                  className="h-full xp-bar-fill rounded-full" />
              </div>

              <AnimatePresence>
                {selectedMatch === match.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-3 border-t border-border space-y-3 text-sm overflow-hidden">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-muted/30 rounded-lg p-2 text-center">
                        <p className="text-muted-foreground">TÚ</p>
                        <p className="text-foreground font-semibold">LVL {profile?.level}</p>
                        <p className="text-primary text-[10px]">{profile?.fitness_goal}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2 text-center">
                        <p className="text-muted-foreground">RIVAL</p>
                        <p className="text-foreground font-semibold">LVL {match.level}</p>
                        <p className="text-accent text-[10px]">{match.fitness_goal}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" /> {match.gym_name}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="w-4 h-4 text-accent" /> Objetivo: {match.fitness_goal}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMatch(match.user_id, match.affinity); }}
                      disabled={sending === match.id}
                      className="neon-button w-full mt-2 text-sm py-2 flex items-center justify-center gap-2">
                      {sending === match.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                      Enviar Solicitud de Match
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingMatch;
