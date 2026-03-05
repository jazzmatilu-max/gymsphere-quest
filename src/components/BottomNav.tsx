import { Home, Users, MapPin, ShoppingBag, User, FlaskConical, Dumbbell, Package, BarChart3 } from "lucide-react";
import { sounds } from "@/lib/sounds";
import { motion } from "framer-motion";

interface NavBarProps {
  active: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: "dashboard", icon: Home, label: "Inicio" },
  { id: "workouts", icon: Dumbbell, label: "Rutinas" },
  { id: "match", icon: Users, label: "Match" },
  { id: "checkin", icon: MapPin, label: "GPS" },
  { id: "marketplace", icon: ShoppingBag, label: "Tienda" },
  { id: "inventory", icon: Package, label: "Mochila" },
  { id: "stats", icon: BarChart3, label: "Stats" },
  { id: "nutrition", icon: FlaskConical, label: "Nutri" },
  { id: "avatar", icon: User, label: "Avatar" },
];

const BottomNav = ({ active, onNavigate }: NavBarProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="max-w-lg mx-auto flex items-center overflow-x-auto py-2 px-1 gap-0.5">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { sounds.navigate(); onNavigate(tab.id); }}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all shrink-0 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    style={{ boxShadow: "0 0 6px hsl(var(--primary))" }}
                  />
                )}
              </div>
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
