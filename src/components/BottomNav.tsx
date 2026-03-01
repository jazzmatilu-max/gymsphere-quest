import { Home, Users, MapPin, ShoppingBag, User } from "lucide-react";

interface NavBarProps {
  active: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: "dashboard", icon: Home, label: "Inicio" },
  { id: "match", icon: Users, label: "Match" },
  { id: "checkin", icon: MapPin, label: "Check-in" },
  { id: "marketplace", icon: ShoppingBag, label: "Tienda" },
  { id: "avatar", icon: User, label: "Avatar" },
];

const BottomNav = ({ active, onNavigate }: NavBarProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_hsl(155_100%_50%)]" />
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
