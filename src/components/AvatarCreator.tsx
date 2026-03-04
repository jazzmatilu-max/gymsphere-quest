import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, RotateCcw, Check, User, Upload, Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { sounds } from "@/lib/sounds";

const AURAS: Record<string, { color: string; label: string; glow: string }> = {
  "Hipertrofia": { color: "hsl(155 100% 50%)", label: "Aura de Fuerza", glow: "0 0 30px hsl(155 100% 50% / 0.6)" },
  "Fuerza": { color: "hsl(280 100% 65%)", label: "Aura Titánica", glow: "0 0 30px hsl(280 100% 65% / 0.6)" },
  "Cardio": { color: "hsl(190 100% 50%)", label: "Aura Veloz", glow: "0 0 30px hsl(190 100% 50% / 0.6)" },
  "Pérdida de peso": { color: "hsl(30 100% 50%)", label: "Aura Ardiente", glow: "0 0 30px hsl(30 100% 50% / 0.6)" },
};

const ARMORS = [
  { minLevel: 1, name: "Recluta", ring: "border-muted-foreground" },
  { minLevel: 5, name: "Guerrero", ring: "border-primary" },
  { minLevel: 15, name: "Élite", ring: "border-accent" },
  { minLevel: 25, name: "Legendario", ring: "border-neon-purple" },
  { minLevel: 50, name: "Mítico", ring: "border-destructive" },
];

/* Particle component that orbits the avatar */
const Particles = ({ count, speed, color }: { count: number; speed: number; color: string }) => (
  <>
    {Array.from({ length: count }).map((_, i) => {
      const angle = (360 / count) * i;
      const duration = Math.max(1.5, 6 - speed * 4);
      const radius = 78 + Math.random() * 12;
      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + Math.random() * 3,
            height: 3 + Math.random() * 3,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            top: "50%",
            left: "50%",
          }}
          animate={{
            x: [
              Math.cos((angle * Math.PI) / 180) * radius,
              Math.cos(((angle + 360) * Math.PI) / 180) * radius,
            ],
            y: [
              Math.sin((angle * Math.PI) / 180) * radius,
              Math.sin(((angle + 360) * Math.PI) / 180) * radius,
            ],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.15,
          }}
        />
      );
    })}
  </>
);

/* Apply scanline hologram filter to canvas */
function applyScanlineFilter(canvas: HTMLCanvasElement, sourceUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // Apply scanline effect
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          // Scanline darkening every 3 lines
          if (y % 3 === 0) {
            data[idx] = Math.max(0, data[idx] - 40);
            data[idx + 1] = Math.max(0, data[idx + 1] - 40);
            data[idx + 2] = Math.max(0, data[idx + 2] - 40);
          }
          // Slight green/cyan tint for hologram look
          data[idx + 1] = Math.min(255, data[idx + 1] + 15);
          data[idx + 2] = Math.min(255, data[idx + 2] + 8);
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // Add subtle vignette
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(sourceUrl);
    img.src = sourceUrl;
  });
}

const AvatarCreator = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filterCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(profile?.avatar_photo_url || null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarData, setAvatarData] = useState<{ skinTone: string; hairColor: string } | null>(
    profile?.avatar_skin_tone ? { skinTone: profile.avatar_skin_tone, hairColor: profile.avatar_hair_color || "" } : null
  );

  const aura = AURAS[profile?.fitness_goal || "Hipertrofia"] || AURAS["Hipertrofia"];
  const armor = useMemo(() => {
    const lvl = profile?.level || 1;
    return [...ARMORS].reverse().find((a) => lvl >= a.minLevel) || ARMORS[0];
  }, [profile?.level]);

  // Particle speed based on XP (0-1 normalized)
  const xpEnergy = useMemo(() => {
    const xp = profile?.xp || 0;
    return Math.min(1, xp / 5000);
  }, [profile?.xp]);

  const particleCount = useMemo(() => Math.max(6, Math.round(8 + xpEnergy * 12)), [xpEnergy]);

  const uploadToStorage = useCallback(async (dataUrl: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) { console.error("Upload error:", error); return null; }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err) { console.error("Storage upload failed:", err); return null; }
  }, [user]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
    }
  }, []);

  const processImage = useCallback(async (dataUrl: string) => {
    setAnalyzing(true);
    setUploading(true);
    sounds.click();

    // Apply scanline hologram filter
    let filteredUrl = dataUrl;
    if (filterCanvasRef.current) {
      filteredUrl = await applyScanlineFilter(filterCanvasRef.current, dataUrl);
    }

    setPhoto(filteredUrl);

    // Upload filtered version
    const publicUrl = await uploadToStorage(filteredUrl);
    if (publicUrl) {
      await updateProfile({ avatar_photo_url: publicUrl } as any);
      setPhoto(publicUrl);
      localStorage.setItem("gymsphere_avatar", publicUrl);
    }
    setUploading(false);

    // Analyze colors
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const centerData = ctx.getImageData(Math.floor(c.width * 0.4), Math.floor(c.height * 0.3), 40, 40).data;
      let rS = 0, gS = 0, bS = 0;
      const cnt = centerData.length / 4;
      for (let i = 0; i < centerData.length; i += 4) { rS += centerData[i]; gS += centerData[i + 1]; bS += centerData[i + 2]; }
      const skin = `rgb(${Math.round(rS / cnt)}, ${Math.round(gS / cnt)}, ${Math.round(bS / cnt)})`;
      const hairData = ctx.getImageData(Math.floor(c.width * 0.4), 10, 40, 20).data;
      let hR = 0, hG = 0, hB = 0;
      const hCnt = hairData.length / 4;
      for (let i = 0; i < hairData.length; i += 4) { hR += hairData[i]; hG += hairData[i + 1]; hB += hairData[i + 2]; }
      const hair = `rgb(${Math.round(hR / hCnt)}, ${Math.round(hG / hCnt)}, ${Math.round(hB / hCnt)})`;
      setAvatarData({ skinTone: skin, hairColor: hair });
      updateProfile({ avatar_skin_tone: skin, avatar_hair_color: hair } as any);
      setAnalyzing(false);
      sounds.success();
      toast({ title: "¡ADN ESCANEADO!", description: `Filtro holográfico aplicado • Rango: ${armor.name}` });
    };
    img.onerror = () => {
      setAnalyzing(false);
      sounds.success();
      toast({ title: "Avatar guardado", description: `Rango: ${armor.name} • ${aura.label}` });
    };
    img.src = dataUrl;
  }, [uploadToStorage, updateProfile, armor, aura]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    sounds.match();
    processImage(canvas.toDataURL("image/jpeg", 0.85));
  }, [stream, processImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => processImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setPhoto(null);
    setAvatarData(null);
    setCameraError(null);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  // Restore from localStorage on mount
  useEffect(() => {
    if (!photo) {
      const cached = localStorage.getItem("gymsphere_avatar");
      if (cached) setPhoto(cached);
    }
  }, []);

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Avatar & ADN Visual
      </motion.h2>

      {/* Avatar display with particles and energy circle */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="neon-card flex flex-col items-center gap-4">
        <div className="relative" style={{ width: 180, height: 180 }}>
          {/* Particles orbiting */}
          <Particles count={particleCount} speed={xpEnergy} color={aura.color} />

          {/* Rotating energy ring */}
          <div className="absolute inset-4 rounded-full flex items-center justify-center"
            style={{ boxShadow: aura.glow, border: `3px solid ${aura.color}` }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: Math.max(3, 8 - xpEnergy * 5), repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
              style={{ border: `2px dashed ${aura.color}`, opacity: 0.3 }}
            />
            {/* Pulsing outer ring */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-2 rounded-full"
              style={{ border: `1px solid ${aura.color}` }}
            />
            {photo ? (
              <img src={photo} alt="Avatar"
                className={`w-28 h-28 rounded-full object-cover border-4 ${armor.ring}`}
                style={{ filter: "contrast(1.1) saturate(1.2)" }} />
            ) : (
              <div className={`w-28 h-28 rounded-full bg-secondary flex items-center justify-center border-4 ${armor.ring}`}>
                <User className="w-14 h-14 text-primary" />
              </div>
            )}
          </div>

          {/* Armor badge */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-card neon-border rounded-full px-3 py-0.5 z-10">
            <span className="text-[10px] font-mono font-bold text-primary flex items-center gap-1">
              <Shield className="w-3 h-3" /> {armor.name}
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: aura.color }}>{aura.label}</p>
          <p className="text-xs text-muted-foreground font-mono">LVL {profile?.level || 1} • {profile?.fitness_goal}</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            Energía de partículas: {Math.round(xpEnergy * 100)}%
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-primary"
          />
          <span className="text-[10px] font-mono text-muted-foreground">
            {profile?.total_workouts && profile.total_workouts > 0 ? "SINCRONIZACIÓN COMPLETA" : "MODO ESPERA"}
          </span>
        </div>
      </motion.div>

      {/* Camera / Upload controls */}
      <div className="neon-card">
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={filterCanvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" capture="user" onChange={handleFileUpload} className="hidden" />

        <AnimatePresence mode="wait">
          {!stream && !analyzing && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3">
              <p className="text-muted-foreground text-center text-sm">
                {photo ? "Avatar activo con filtro holográfico. Puedes cambiar la foto." : "Captura o sube una foto para activar el Escaneo de ADN"}
              </p>
              {cameraError && <p className="text-destructive text-sm text-center">{cameraError}</p>}
              <div className="flex gap-3">
                <button onClick={startCamera} className="neon-button text-sm py-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Escanear ADN
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="bg-secondary text-secondary-foreground font-semibold rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors">
                  <Upload className="w-4 h-4" /> Subir Foto
                </button>
              </div>
            </motion.div>
          )}

          {stream && (
            <motion.div key="camera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4">
              <div className="relative rounded-lg overflow-hidden neon-border">
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-sm rounded-lg" />
                {/* Holographic scan lines overlay */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.03) 2px, rgba(0,255,200,0.03) 4px)",
                  }} />
                <motion.div
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute left-0 right-0 h-1 bg-primary/60"
                  style={{ boxShadow: "0 0 20px hsl(155 100% 50% / 0.6), 0 0 40px hsl(155 100% 50% / 0.3)" }}
                />
                <div className="absolute top-2 left-2 text-[10px] font-mono text-primary/80 bg-card/60 px-2 py-0.5 rounded">
                  ESCÁNER ADN ACTIVO
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={capturePhoto} className="neon-button flex items-center gap-2">
                  <Camera className="w-5 h-5" /> Capturar ADN
                </button>
                <button onClick={() => { stream?.getTracks().forEach(t => t.stop()); setStream(null); }}
                  className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-sm hover:bg-secondary/80 transition-colors">
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}

          {analyzing && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-6">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-2 border border-accent border-b-transparent rounded-full animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                />
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                {uploading ? "Subiendo datos biométricos..." : "Aplicando filtro holográfico..."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {avatarData && !analyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
            <h3 className="text-sm font-semibold neon-text-cyan flex items-center gap-2"><Check className="w-4 h-4" /> Escaneo de ADN Completo</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs">SKIN:</span>
                <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: avatarData.skinTone }} />
                <span className="text-foreground text-xs">{avatarData.skinTone}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs">HAIR:</span>
                <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: avatarData.hairColor }} />
                <span className="text-foreground text-xs">{avatarData.hairColor}</span>
              </div>
            </div>
            <button onClick={reset} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <RotateCcw className="w-4 h-4" /> Nuevo escaneo
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AvatarCreator;
