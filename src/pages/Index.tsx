import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "@/components/Dashboard";
import TrainingMatch from "@/components/TrainingMatch";
import GeoCheckin from "@/components/GeoCheckin";
import Marketplace from "@/components/Marketplace";
import AvatarCreator from "@/components/AvatarCreator";
import BottomNav from "@/components/BottomNav";
import Auth from "@/pages/Auth";

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

const Index = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default Index;
