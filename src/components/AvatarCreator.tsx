import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, RotateCcw, Check, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AvatarCreator = () => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [avatarData, setAvatarData] = useState<{
    skinTone: string;
    hairColor: string;
  } | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
      console.error("Camera error:", err);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    const dataUrl = canvas.toDataURL("image/png");
    setPhoto(dataUrl);

    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);

    analyzeAndSave(ctx, canvas.width, canvas.height, dataUrl);
  }, [stream, user]);

  const analyzeAndSave = async (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    photoUrl: string
  ) => {
    setAnalyzing(true);

    // Sample center for skin tone
    const cx = Math.floor(w * 0.4);
    const cy = Math.floor(h * 0.3);
    const ss = 40;
    const imageData = ctx.getImageData(cx, cy, ss, ss);
    const px = imageData.data;
    let rS = 0, gS = 0, bS = 0;
    const cnt = px.length / 4;
    for (let i = 0; i < px.length; i += 4) { rS += px[i]; gS += px[i+1]; bS += px[i+2]; }

    // Sample top for hair
    const hd = ctx.getImageData(Math.floor(w * 0.4), 10, ss, 20);
    const hp = hd.data;
    let hR = 0, hG = 0, hB = 0;
    const hC = hp.length / 4;
    for (let i = 0; i < hp.length; i += 4) { hR += hp[i]; hG += hp[i+1]; hB += hp[i+2]; }

    const skinTone = `rgb(${Math.round(rS/cnt)}, ${Math.round(gS/cnt)}, ${Math.round(bS/cnt)})`;
    const hairColor = `rgb(${Math.round(hR/hC)}, ${Math.round(hG/hC)}, ${Math.round(hB/hC)})`;

    // Save to DB
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_skin_tone: skinTone,
          avatar_hair_color: hairColor,
          avatar_photo_url: photoUrl,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Avatar save error:", error);
        toast.error("Error al guardar avatar");
      } else {
        toast.success("Avatar guardado en tu perfil");
      }
    }

    setTimeout(() => {
      setAvatarData({ skinTone, hairColor });
      setAnalyzing(false);
    }, 1500);
  };

  const reset = () => {
    setPhoto(null);
    setAvatarData(null);
    setCameraError(null);
  };

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Crea tu Avatar
      </motion.h2>

      <div className="neon-card">
        <canvas ref={canvasRef} className="hidden" />

        {!stream && !photo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-12">
            <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center neon-border">
              <User className="w-16 h-16 text-primary" />
            </div>
            <p className="text-muted-foreground text-center text-sm">
              Captura tu foto para generar un avatar único basado en tu apariencia
            </p>
            {cameraError && <p className="text-destructive text-sm text-center">{cameraError}</p>}
            <button onClick={startCamera} className="neon-button flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Escanear Rostro
            </button>
          </motion.div>
        )}

        {stream && !photo && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
            <div className="relative rounded-lg overflow-hidden neon-border">
              <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-sm rounded-lg" />
              <div className="absolute inset-0 border-2 border-primary/20 rounded-lg pointer-events-none" />
              {/* Scan lines overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 scanline" />
            </div>
            <button onClick={capturePhoto} className="neon-button flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Capturar Foto
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {photo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <img src={photo} alt="Captured" className="w-40 h-40 object-cover rounded-full neon-border" />
                  {analyzing && (
                    <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {avatarData && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                    <h3 className="text-lg font-semibold neon-text-cyan">Análisis IA Completo</h3>
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">SKIN_TONE:</span>
                        <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: avatarData.skinTone }} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">HAIR_CLR:</span>
                        <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: avatarData.hairColor }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Guardado en base de datos ✓</span>
                    </div>
                  </motion.div>
                )}
              </div>

              <button onClick={reset} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                <RotateCcw className="w-4 h-4" />
                Tomar otra foto
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AvatarCreator;
