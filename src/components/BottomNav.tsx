import { Home, Dumbbell, Users, ShoppingBag, User } from "lucide-react";
import { sounds } from "@/lib/sounds";
import { motion } from "framer-motion";

interface NavBarProps {
  active: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: "dashboard", icon: Home, label: "Inicio" },
  { id: "workouts", icon: Dumbbell, label: "Entreno" },
  { id: "social", icon: Users, label: "Social" },
  { id: "marketplace", icon: ShoppingBag, label: "Tienda" },
  { id: "profile", icon: User, label: "Perfil" },
];

const BottomNav = ({ active, onNavigate }: NavBarProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { sounds.navigate(); onNavigate(tab.id); }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                    style={{ boxShadow: "0 0 8px hsl(var(--primary))" }}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
