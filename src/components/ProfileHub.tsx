import { useState } from "react";
import { motion } from "framer-motion";
import { User, Package, BarChart3, FlaskConical } from "lucide-react";
import { sounds } from "@/lib/sounds";
import AvatarCreator from "./AvatarCreator";
import Inventory from "./Inventory";
import StatsPanel from "./StatsPanel";
import NutritionAdvisor from "./NutritionAdvisor";

const SUB_TABS = [
  { id: "avatar", label: "Avatar", icon: <User className="w-4 h-4" /> },
  { id: "inventory", label: "Mochila", icon: <Package className="w-4 h-4" /> },
  { id: "stats", label: "Stats", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "nutrition", label: "Nutri", icon: <FlaskConical className="w-4 h-4" /> },
];

const ProfileHub = () => {
  const [sub, setSub] = useState("avatar");

  const renderContent = () => {
    switch (sub) {
      case "avatar": return <AvatarCreator />;
      case "inventory": return <Inventory />;
      case "stats": return <StatsPanel />;
      case "nutrition": return <NutritionAdvisor />;
      default: return <AvatarCreator />;
    }
  };

  return (
    <div className="space-y-4">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Mi Perfil
      </motion.h2>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setSub(t.id); sounds.click(); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              sub === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
};

export default ProfileHub;
