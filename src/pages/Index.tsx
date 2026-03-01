import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import TrainingMatch from "@/components/TrainingMatch";
import GeoCheckin from "@/components/GeoCheckin";
import Marketplace from "@/components/Marketplace";
import AvatarCreator from "@/components/AvatarCreator";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "match": return <TrainingMatch />;
      case "checkin": return <GeoCheckin />;
      case "marketplace": return <Marketplace />;
      case "avatar": return <AvatarCreator />;
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
