import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Trophy, Loader2 } from "lucide-react";

const REGISTERED_GYM = {
  name: "GymTech Central",
  lat: 19.4326,
  lng: -99.1332,
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const GeoCheckin = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "too_far" | "error">("idle");
  const [distance, setDistance] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);

  const handleCheckin = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = getDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          REGISTERED_GYM.lat,
          REGISTERED_GYM.lng
        );
        setDistance(Math.round(d));

        if (d <= 100) {
          setXpEarned(50);
          setCoinsEarned(10);
          setStatus("success");
        } else {
          setStatus("too_far");
        }
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? "Permiso de ubicación denegado. Actívalo en la configuración."
            : "No se pudo obtener tu ubicación. Intenta de nuevo."
        );
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const reset = () => {
    setStatus("idle");
    setDistance(null);
    setGeoError(null);
  };

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold neon-text"
      >
        Check-in GPS
      </motion.h2>

      <div className="neon-card">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold text-foreground">{REGISTERED_GYM.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {REGISTERED_GYM.lat.toFixed(4)}, {REGISTERED_GYM.lng.toFixed(4)}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Debes estar a menos de <span className="neon-text font-mono">100m</span> del gimnasio para hacer check-in y ganar recompensas.
        </p>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.button
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCheckin}
              className="neon-button w-full flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              Verificar Ubicación
            </motion.button>
          )}

          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Obteniendo coordenadas GPS...</p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center achievement-glow"
              >
                <Trophy className="w-10 h-10 text-primary" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold neon-text">¡Logro Desbloqueado!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Check-in confirmado a {distance}m del gym
                </p>
              </div>
              <div className="flex justify-center gap-6 font-mono">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold neon-text">+{xpEarned}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold neon-text-cyan">+{coinsEarned}</p>
                  <p className="text-xs text-muted-foreground">GymCoins</p>
                </motion.div>
              </div>
              <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cerrar
              </button>
            </motion.div>
          )}

          {status === "too_far" && (
            <motion.div
              key="far"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-3 py-4"
            >
              <p className="text-destructive font-semibold">Estás demasiado lejos</p>
              <p className="text-sm text-muted-foreground">
                Distancia: <span className="font-mono text-foreground">{distance}m</span> — necesitas estar a menos de 100m
              </p>
              <button onClick={reset} className="neon-button text-sm py-2">
                Intentar de nuevo
              </button>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-3 py-4"
            >
              <p className="text-destructive text-sm">{geoError}</p>
              <button onClick={reset} className="neon-button text-sm py-2">
                Reintentar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GeoCheckin;
