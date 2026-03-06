import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { sounds } from "@/lib/sounds";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Simulated warriors for fallback mode */
const SimulatedRadar = () => {
  const warriors = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      angle: Math.random() * 360,
      radius: 20 + Math.random() * 35,
      speed: 0.3 + Math.random() * 0.7,
      name: ["Guerrero", "Titán", "Recluta", "Élite", "Sombra"][i],
    }))
  );

  return (
    <div className="relative w-28 h-28 mx-auto my-4">
      {[1, 2, 3].map((ring) => (
        <div key={ring} className="absolute rounded-full border border-primary/15"
          style={{ inset: `${(3 - ring) * 14}px` }} />
      ))}
      <motion.div
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary"
        style={{ boxShadow: "0 0 8px hsl(var(--primary))" }}
      />
      {warriors.current.map((w) => (
        <motion.div
          key={w.id}
          animate={{
            x: [
              Math.cos((w.angle * Math.PI) / 180) * w.radius,
              Math.cos(((w.angle + 120) * Math.PI) / 180) * (w.radius + 5),
              Math.cos(((w.angle + 240) * Math.PI) / 180) * w.radius,
              Math.cos((w.angle * Math.PI) / 180) * w.radius,
            ],
            y: [
              Math.sin((w.angle * Math.PI) / 180) * w.radius,
              Math.sin(((w.angle + 120) * Math.PI) / 180) * (w.radius + 5),
              Math.sin(((w.angle + 240) * Math.PI) / 180) * w.radius,
              Math.sin((w.angle * Math.PI) / 180) * w.radius,
            ],
            opacity: [0.5, 1, 0.6, 0.5],
          }}
          transition={{ duration: 6 / w.speed, repeat: Infinity, ease: "linear" }}
          className="absolute w-2 h-2 rounded-full bg-accent top-1/2 left-1/2"
          style={{ boxShadow: "0 0 6px hsl(var(--accent))" }}
          title={w.name}
        />
      ))}
      {/* Sweep line */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        <div className="absolute top-1/2 left-1/2 w-1/2 h-px origin-left"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary)), transparent)" }} />
      </motion.div>
    </div>
  );
};

const GeoCheckin = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "too_far" | "error" | "simulation">("idle");
  const [distance, setDistance] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);

  const gymLat = profile?.gym_lat || 19.4326;
  const gymLng = profile?.gym_lng || -99.1332;

  const handleCheckin = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("simulation");
      sounds.sonar();
      return;
    }
    setStatus("loading");
    setGeoError(null);
    sounds.sonar();

    const processPosition = async (lat: number, lng: number) => {
      const d = getDistance(lat, lng, gymLat, gymLng);
      setDistance(Math.round(d));

      if (d <= 100 && user) {
        await supabase.from("checkins").insert({
          user_id: user.id,
          latitude: lat,
          longitude: lng,
          distance_meters: Math.round(d),
          validated: true,
          xp_earned: 50,
          coins_earned: 10,
        });

        const { data } = await supabase.rpc("add_xp", { p_user_id: user.id, p_xp: 50, p_coins: 10 });
        const result = data as any;

        setXpEarned(50);
        setCoinsEarned(10);
        setStatus("success");
        sounds.success();
        await refetch();

        if (result?.leveled_up) {
          sounds.levelUp();
          toast({ title: "¡LEVEL UP!", description: `Has alcanzado el nivel ${result.level}` });
        } else {
          toast({ title: "¡Check-in exitoso!", description: "+50 XP, +10 GymCoins" });
        }
      } else {
        setStatus("too_far");
        sounds.error();
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await processPosition(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        if (err.code === 1) {
          // Permission denied → go to simulation mode
          setStatus("simulation");
          sounds.sonar();
          toast({ title: "GPS bloqueado", description: "Modo simulación activado" });
        } else {
          // Retry with low accuracy
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await processPosition(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              // All failed → simulation mode
              setStatus("simulation");
              sounds.sonar();
              toast({ title: "GPS no disponible", description: "Modo simulación activado" });
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [gymLat, gymLng, user, refetch]);

  const reset = () => { setStatus("idle"); setDistance(null); setGeoError(null); };

  return (
    <div className="space-y-5">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Check-in GPS
      </motion.h2>

      <div className="neon-card backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="w-4 h-4 text-primary" />
          <div>
            <p className="font-semibold text-foreground text-sm">{profile?.gym_name || "GymTech Central"}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{gymLat.toFixed(4)}, {gymLng.toFixed(4)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Debes estar a menos de <span className="neon-text font-mono">100m</span> para ganar recompensas.
        </p>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.button key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCheckin} className="neon-button w-full flex items-center justify-center gap-2 text-sm py-2">
              <Navigation className="w-4 h-4" /> Verificar Ubicación
            </motion.button>
          )}
          {status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Obteniendo coordenadas GPS...</p>
            </motion.div>
          )}
          {status === "simulation" && (
            <motion.div key="simulation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3">
              <p className="text-xs font-mono text-accent">MODO SIMULACIÓN ACTIVO</p>
              <p className="text-[10px] text-muted-foreground">GPS no disponible. Mostrando guerreros simulados.</p>
              <SimulatedRadar />
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cerrar</button>
            </motion.div>
          )}
          {status === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3 py-3">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center achievement-glow">
                <Trophy className="w-8 h-8 text-primary" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold neon-text">¡Logro Desbloqueado!</h3>
                <p className="text-xs text-muted-foreground mt-1">Check-in confirmado a {distance}m</p>
              </div>
              <div className="flex justify-center gap-6 font-mono">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center">
                  <p className="text-xl font-bold neon-text">+{xpEarned}</p>
                  <p className="text-[10px] text-muted-foreground">XP</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-center">
                  <p className="text-xl font-bold neon-text-cyan">+{coinsEarned}</p>
                  <p className="text-[10px] text-muted-foreground">GymCoins</p>
                </motion.div>
              </div>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cerrar</button>
            </motion.div>
          )}
          {status === "too_far" && (
            <motion.div key="far" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2 py-3">
              <p className="text-destructive font-semibold text-sm">Estás demasiado lejos</p>
              <p className="text-xs text-muted-foreground">Distancia: <span className="font-mono text-foreground">{distance}m</span></p>
              <button onClick={reset} className="neon-button text-xs py-1.5">Intentar de nuevo</button>
            </motion.div>
          )}
          {status === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2 py-3">
              <p className="text-destructive text-xs">{geoError}</p>
              <button onClick={reset} className="neon-button text-xs py-1.5">Reintentar</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GeoCheckin;
