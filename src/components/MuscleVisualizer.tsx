import { motion } from "framer-motion";

interface MuscleVisualizerProps {
  activeGroups: string[]; // e.g. ["biceps", "pierna", "espalda"]
}

const MUSCLE_GROUPS: Record<string, { cx: number; cy: number; rx: number; ry: number; label: string }> = {
  hombros:  { cx: 100, cy: 65, rx: 30, ry: 12, label: "Hombros" },
  biceps:   { cx: 55, cy: 115, rx: 12, ry: 22, label: "Bíceps" },
  brazos:   { cx: 145, cy: 115, rx: 12, ry: 22, label: "Tríceps" },
  espalda:  { cx: 100, cy: 100, rx: 22, ry: 28, label: "Espalda" },
  cardio:   { cx: 100, cy: 135, rx: 16, ry: 14, label: "Cardio" },
  pierna:   { cx: 82, cy: 210, rx: 14, ry: 35, label: "Pierna Izq" },
  pierna2:  { cx: 118, cy: 210, rx: 14, ry: 35, label: "Pierna Der" },
};

const MuscleVisualizer = ({ activeGroups }: MuscleVisualizerProps) => {
  const isActive = (key: string) => {
    if (key === "pierna2") return activeGroups.includes("pierna");
    return activeGroups.includes(key);
  };

  return (
    <div className="neon-card">
      <h4 className="text-xs font-mono text-muted-foreground mb-2">MAPA MUSCULAR</h4>
      <div className="flex justify-center">
        <svg viewBox="0 0 200 280" className="w-40 h-56">
          {/* Body outline */}
          <ellipse cx="100" cy="30" rx="18" ry="22" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />
          <line x1="100" y1="52" x2="100" y2="165" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />
          <line x1="100" y1="70" x2="50" y2="140" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />
          <line x1="100" y1="70" x2="150" y2="140" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />
          <line x1="100" y1="165" x2="80" y2="260" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />
          <line x1="100" y1="165" x2="120" y2="260" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />

          {/* Muscle groups */}
          {Object.entries(MUSCLE_GROUPS).map(([key, m]) => {
            const active = isActive(key);
            return (
              <motion.ellipse
                key={key}
                cx={m.cx}
                cy={m.cy}
                rx={m.rx}
                ry={m.ry}
                fill={active ? "hsl(var(--primary) / 0.4)" : "hsl(var(--muted) / 0.2)"}
                stroke={active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.2)"}
                strokeWidth={active ? 1.5 : 0.5}
                initial={false}
                animate={{
                  fill: active ? "hsl(var(--primary) / 0.4)" : "hsl(var(--muted) / 0.2)",
                  scale: active ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 1.5, repeat: active ? Infinity : 0 }}
              />
            );
          })}

          {/* Labels for active */}
          {Object.entries(MUSCLE_GROUPS).map(([key, m]) => {
            if (!isActive(key) || key === "pierna2") return null;
            return (
              <text
                key={`label-${key}`}
                x={m.cx}
                y={m.cy + m.ry + 10}
                textAnchor="middle"
                fill="hsl(var(--primary))"
                fontSize="7"
                fontFamily="monospace"
              >
                {m.label}
              </text>
            );
          })}
        </svg>
      </div>
      {activeGroups.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">Selecciona una rutina para ver los músculos activos</p>
      )}
    </div>
  );
};

export default MuscleVisualizer;
