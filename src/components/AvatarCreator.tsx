import { useState, useRef, useCallback, useMemo } from "react";
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

const AvatarCreator = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const uploadToStorage = useCallback(async (dataUrl: string): Promise<string | null> => {
    if (!user) return null;
    try {
      // Convert base64 to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err) {
      console.error("Storage upload failed:", err);
      return null;
    }
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
    setPhoto(dataUrl);
    setAnalyzing(true);
    setUploading(true);
    sounds.click();

    // Upload to Storage
    const publicUrl = await uploadToStorage(dataUrl);
    if (publicUrl) {
      await updateProfile({ avatar_photo_url: publicUrl } as any);
      setPhoto(publicUrl);
    }
    setUploading(false);

    // Analyze colors from image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
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
      toast({ title: "¡Avatar actualizado!", description: `Rango: ${armor.name} • ${aura.label}` });
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

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Avatar & ADN Visual
      </motion.h2>

      {/* Avatar display with energy circle */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="neon-card flex flex-col items-center gap-4">
        <div className="relative">
          {/* Rotating energy ring */}
          <div className="w-36 h-36 rounded-full flex items-center justify-center"
            style={{ boxShadow: aura.glow, border: `3px solid ${aura.color}` }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
              style={{ border: `2px dashed ${aura.color}`, opacity: 0.3 }}
            />
            {/* Pulsing outer ring */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -inset-2 rounded-full"
              style={{ border: `1px solid ${aura.color}` }}
            />
            {photo ? (
              <img src={photo} alt="Avatar" className={`w-32 h-32 rounded-full object-cover border-4 ${armor.ring}`} />
            ) : (
              <div className={`w-32 h-32 rounded-full bg-secondary flex items-center justify-center border-4 ${armor.ring}`}>
                <User className="w-16 h-16 text-primary" />
              </div>
            )}
          </div>
          {/* Armor badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-card neon-border rounded-full px-3 py-0.5">
            <span className="text-[10px] font-mono font-bold text-primary flex items-center gap-1">
              <Shield className="w-3 h-3" /> {armor.name}
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: aura.color }}>{aura.label}</p>
          <p className="text-xs text-muted-foreground font-mono">LVL {profile?.level || 1} • {profile?.fitness_goal}</p>
        </div>

        {/* Status indicator */}
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
        <input ref={fileInputRef} type="file" accept="image/*" capture="user" onChange={handleFileUpload} className="hidden" />

        <AnimatePresence mode="wait">
          {!stream && !analyzing && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3">
              <p className="text-muted-foreground text-center text-sm">
                {photo ? "Tu avatar está activo. Puedes cambiar la foto." : "Captura o sube una foto para activar tu avatar"}
              </p>
              {cameraError && <p className="text-destructive text-sm text-center">{cameraError}</p>}
              <div className="flex gap-3">
                <button onClick={startCamera} className="neon-button text-sm py-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Cámara
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
                {/* Scan overlay */}
                <motion.div
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute left-0 right-0 h-0.5 bg-primary/60"
                  style={{ boxShadow: "0 0 10px hsl(155 100% 50% / 0.5)" }}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={capturePhoto} className="neon-button flex items-center gap-2">
                  <Camera className="w-5 h-5" /> Capturar
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
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground font-mono">
                {uploading ? "Subiendo foto..." : "Analizando ADN visual..."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {avatarData && !analyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
            <h3 className="text-sm font-semibold neon-text-cyan flex items-center gap-2"><Check className="w-4 h-4" /> Análisis Completo</h3>
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
              <RotateCcw className="w-4 h-4" /> Cambiar foto
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AvatarCreator;
