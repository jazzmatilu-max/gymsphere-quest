import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface Notification {
  id: number;
  message: string;
  xp?: number;
}

let notifyListeners: ((n: Notification) => void)[] = [];

export function triggerNotification(message: string, xp?: number) {
  const n: Notification = { id: Date.now(), message, xp };
  notifyListeners.forEach((fn) => fn(n));
}

const InAppNotification = () => {
  const [notifs, setNotifs] = useState<Notification[]>([]);

  const handleNew = useCallback((n: Notification) => {
    setNotifs((prev) => [...prev.slice(-2), n]);
    setTimeout(() => {
      setNotifs((prev) => prev.filter((x) => x.id !== n.id));
    }, 3500);
  }, []);

  useEffect(() => {
    notifyListeners.push(handleNew);
    return () => {
      notifyListeners = notifyListeners.filter((fn) => fn !== handleNew);
    };
  }, [handleNew]);

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm space-y-1.5 pointer-events-none">
      <AnimatePresence>
        {notifs.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="glass border border-primary/30 rounded-xl px-3 py-2 flex items-center gap-2"
            style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.2)" }}
          >
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-foreground flex-1">{n.message}</span>
            {n.xp && (
              <span className="text-xs font-bold font-mono text-primary">+{n.xp} XP</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default InAppNotification;
