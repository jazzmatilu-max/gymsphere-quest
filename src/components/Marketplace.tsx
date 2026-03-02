import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Filter, Coins, Dumbbell, Shirt, FlaskConical, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { sounds } from "@/lib/sounds";

const CATEGORIES = ["todos", "suplemento", "ropa", "equipo", "skin"] as const;
const GOALS = ["Todos", "Hipertrofia", "Fuerza", "Cardio", "Pérdida de peso"];

const categoryIcons: Record<string, React.ReactNode> = {
  todos: <ShoppingBag className="w-4 h-4" />,
  suplemento: <FlaskConical className="w-4 h-4" />,
  ropa: <Shirt className="w-4 h-4" />,
  equipo: <Dumbbell className="w-4 h-4" />,
  skin: <Sparkles className="w-4 h-4" />,
};

interface MarketItem {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string | null;
  description: string | null;
  fitness_goals: string[];
  in_stock: boolean;
}

const Marketplace = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const [category, setCategory] = useState<string>("todos");
  const [goalFilter, setGoalFilter] = useState<string>("Todos");
  const [showRecommended, setShowRecommended] = useState(true);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("marketplace_items").select("*").then(({ data }) => {
      setItems((data as unknown as MarketItem[]) || []);
      setLoadingItems(false);
    });
  }, []);

  const userGoal = profile?.fitness_goal || "Hipertrofia";

  const filtered = useMemo(() => {
    let list = items;
    if (category !== "todos") list = list.filter((p) => p.category === category);
    if (goalFilter !== "Todos") list = list.filter((p) => p.fitness_goals.includes(goalFilter));
    if (showRecommended) {
      list = [...list].sort((a, b) => {
        const aM = a.fitness_goals.includes(userGoal) ? 1 : 0;
        const bM = b.fitness_goals.includes(userGoal) ? 1 : 0;
        return bM - aM;
      });
    }
    return list;
  }, [category, goalFilter, showRecommended, items, userGoal]);

  const handlePurchase = async (item: MarketItem) => {
    if (!user || !profile) return;
    if (profile.coins < item.price) {
      sounds.error();
      toast({ title: "Créditos Insuficientes", description: `Necesitas ${item.price - profile.coins} GymCoins más`, variant: "destructive" });
      return;
    }
    setPurchasing(item.id);
    sounds.click();

    const { data, error } = await supabase.rpc("purchase_item", {
      p_user_id: user.id,
      p_item_id: item.id,
    });

    if (error || (data as any)?.error) {
      sounds.error();
      toast({ title: "Error", description: (data as any)?.error || error?.message, variant: "destructive" });
    } else {
      sounds.purchase();
      toast({ title: "¡Compra exitosa!", description: `${item.name} añadido a tu inventario` });
      await refetch();
    }
    setPurchasing(null);
  };

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Marketplace
      </motion.h2>

      {/* Balance */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between neon-card py-3">
        <span className="text-sm text-muted-foreground">Tu saldo</span>
        <span className="flex items-center gap-1.5 font-mono font-bold text-lg neon-text-cyan">
          <Coins className="w-5 h-5" /> {profile?.coins ?? 0}
        </span>
      </motion.div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => { setCategory(c); sounds.click(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}>
            {categoryIcons[c]}
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Goal filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {GOALS.map((g) => (
          <button key={g} onClick={() => { setGoalFilter(g); sounds.click(); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              goalFilter === g ? "neon-border bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}>
            {g}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input type="checkbox" checked={showRecommended} onChange={(e) => setShowRecommended(e.target.checked)} className="accent-primary" />
        Priorizar según mi objetivo ({userGoal})
      </label>

      {loadingItems ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product, i) => {
            const isRecommended = product.fitness_goals.includes(userGoal);
            const canAfford = (profile?.coins ?? 0) >= product.price;
            const isBuying = purchasing === product.id;
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`neon-card relative ${isRecommended ? "border-primary/40" : ""}`}>
                {isRecommended && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">REC</span>
                )}
                <div className="text-4xl text-center mb-2">{product.emoji}</div>
                <h3 className="font-semibold text-sm text-foreground leading-tight">{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="flex items-center gap-1 font-mono font-bold text-primary">
                    <Coins className="w-3.5 h-3.5" /> {product.price}
                  </span>
                  <button
                    onClick={() => handlePurchase(product)}
                    disabled={isBuying}
                    className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${
                      canAfford
                        ? "bg-primary/20 text-primary hover:bg-primary/30"
                        : "bg-destructive/20 text-destructive animate-pulse"
                    }`}>
                    {isBuying ? <Loader2 className="w-3 h-3 animate-spin" /> : canAfford ? "Comprar" : "Sin créditos"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
