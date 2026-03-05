import { useState } from "react";
import { motion } from "framer-motion";
import { Users, MapPin } from "lucide-react";
import { sounds } from "@/lib/sounds";
import TrainingMatch from "./TrainingMatch";
import GeoCheckin from "./GeoCheckin";

const SUB_TABS = [
  { id: "match", label: "Match", icon: <Users className="w-4 h-4" /> },
  { id: "checkin", label: "GPS Check-in", icon: <MapPin className="w-4 h-4" /> },
];

const SocialHub = () => {
  const [sub, setSub] = useState("match");

  return (
    <div className="space-y-4">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Social
      </motion.h2>
      <div className="flex gap-2">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setSub(t.id); sounds.click(); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              sub === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {sub === "match" ? <TrainingMatch /> : <GeoCheckin />}
    </div>
  );
};

export default SocialHub;
