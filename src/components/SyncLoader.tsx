import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SyncLoaderProps {
  label?: string;
  duration?: number;
  onComplete?: () => void;
}

const SyncLoader = ({ label = "Sincronizando...", duration = 800, onComplete }: SyncLoaderProps) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const steps = 20;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setProgress(Math.min((step / steps) * 100, 100));
      if (step >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 200);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="neon-card py-2 px-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-primary animate-pulse">{label}</span>
            <span className="text-[10px] font-mono text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.04 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SyncLoader;
