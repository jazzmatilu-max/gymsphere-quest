import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import Dashboard from "@/components/Dashboard";
import TrainingMatch from "@/components/TrainingMatch";
import GeoCheckin from "@/components/GeoCheckin";
import Marketplace from "@/components/Marketplace";
import AvatarCreator from "@/components/AvatarCreator";
import NutritionAdvisor from "@/components/NutritionAdvisor";
import BottomNav from "@/components/BottomNav";
import Auth from "@/pages/Auth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Auth />;

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "match": return <TrainingMatch />;
      case "checkin": return <GeoCheckin />;
      case "marketplace": return <Marketplace />;
      case "avatar": return <AvatarCreator />;
      case "nutrition": return <NutritionAdvisor />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid relative">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {renderTab()}
      </div>
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
