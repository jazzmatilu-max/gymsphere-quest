import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, RotateCcw, Check, User, Upload, Shield } from "lucide-react";
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
  const { profile, updateProfile } = useProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(profile?.avatar_photo_url || null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [avatarData, setAvatarData] = useState<{ skinTone: string; hairColor: string } | null>(
    profile?.avatar_skin_tone ? { skinTone: profile.avatar_skin_tone, hairColor: profile.avatar_hair_color || "" } : null
  );

  const aura = AURAS[profile?.fitness_goal || "Hipertrofia"] || AURAS["Hipertrofia"];
  const armor = useMemo(() => {
    const lvl = profile?.level || 1;
    return [...ARMORS].reverse().find((a) => lvl >= a.minLevel) || ARMORS[0];
  }, [profile?.level]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  }, []);

  const processImage = useCallback(async (dataUrl: string) => {
    setPhoto(dataUrl);
    setAnalyzing(true);
    sounds.click();

    // Save photo URL to profile (base64 for now)
    await updateProfile({ avatar_photo_url: dataUrl } as any);

    // Simple analysis from canvas
    const img = new Image();
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
      toast({ title: "Avatar actualizado", description: `Rango: ${armor.name} • ${aura.label}` });
    };
    img.src = dataUrl;
  }, [updateProfile, armor, aura]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    processImage(canvas.toDataURL("image/png"));
  }, [stream, processImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => processImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setPhoto(null);
    setAvatarData(null);
    setCameraError(null);
  };

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Avatar & ADN Visual
      </motion.h2>

      {/* Avatar display with energy circle */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="neon-card flex flex-col items-center gap-4">
        <div className="relative">
          {/* Energy ring */}
          <div className="w-36 h-36 rounded-full flex items-center justify-center"
            style={{ boxShadow: aura.glow, border: `3px solid ${aura.color}` }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
              style={{ border: `2px dashed ${aura.color}`, opacity: 0.3 }}
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
      </motion.div>

      <div className="neon-card">
        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

        {!stream && !analyzing && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-muted-foreground text-center text-sm">Captura o sube una foto para personalizar tu avatar</p>
            {cameraError && <p className="text-destructive text-sm text-center">{cameraError}</p>}
            <div className="flex gap-3">
              <button onClick={startCamera} className="neon-button text-sm py-2 flex items-center gap-2">
                <Camera className="w-4 h-4" /> Cámara
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-secondary text-secondary-foreground font-semibold rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors">
                <Upload className="w-4 h-4" /> Subir Foto
              </button>
            </div>
          </div>
        )}

        {stream && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
            <div className="relative rounded-lg overflow-hidden neon-border">
              <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-sm rounded-lg" />
            </div>
            <button onClick={capturePhoto} className="neon-button flex items-center gap-2">
              <Camera className="w-5 h-5" /> Capturar
            </button>
          </motion.div>
        )}

        {analyzing && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-mono">Analizando ADN visual...</p>
          </div>
        )}

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
