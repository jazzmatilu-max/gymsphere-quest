import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Package, BarChart3, FlaskConical, RotateCcw } from "lucide-react";
import { sounds } from "@/lib/sounds";
import { toast } from "@/hooks/use-toast";
import AvatarCreator from "./AvatarCreator";
import Inventory from "./Inventory";
import StatsPanel from "./StatsPanel";
import NutritionAdvisor from "./NutritionAdvisor";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const SUB_TABS = [
  { id: "avatar", label: "Avatar", icon: <User className="w-3.5 h-3.5" /> },
  { id: "inventory", label: "Mochila", icon: <Package className="w-3.5 h-3.5" /> },
  { id: "stats", label: "Stats", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: "nutrition", label: "Nutri", icon: <FlaskConical className="w-3.5 h-3.5" /> },
];

const ProfileHub = () => {
  const [sub, setSub] = useState("avatar");
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    sounds.error();
    localStorage.clear();
    toast({ title: "MEMORIA BORRADA", description: "Reiniciando sistema..." });
    setTimeout(() => window.location.reload(), 1000);
  };

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
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <h2 className="text-2xl font-bold neon-text">Mi Perfil</h2>
        <button
          onClick={handleReset}
          className={`p-1.5 rounded-lg transition-all ${
            confirmReset
              ? "bg-destructive/20 text-destructive animate-pulse"
              : "text-muted-foreground/40 hover:text-muted-foreground"
          }`}
          title={confirmReset ? "Pulsa de nuevo para confirmar" : "Resetear datos locales"}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </motion.div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setSub(t.id); sounds.click(); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
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
