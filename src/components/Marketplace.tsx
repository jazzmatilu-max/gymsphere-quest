import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Filter, Coins, Dumbbell, Shirt, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const CATEGORIES = ["todos", "suplemento", "ropa", "equipo"] as const;
const GOALS = ["Todos", "Hipertrofia", "Fuerza", "Cardio", "Pérdida de peso"];

const categoryIcons: Record<string, React.ReactNode> = {
  todos: <ShoppingBag className="w-4 h-4" />,
  suplemento: <FlaskConical className="w-4 h-4" />,
  ropa: <Shirt className="w-4 h-4" />,
  equipo: <Dumbbell className="w-4 h-4" />,
};

const Marketplace = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Tables<"marketplace_items">[]>([]);
  const [userGoal, setUserGoal] = useState("Hipertrofia");
  const [userCoins, setUserCoins] = useState(0);
  const [category, setCategory] = useState<string>("todos");
  const [goalFilter, setGoalFilter] = useState<string>("Todos");
  const [showRecommended, setShowRecommended] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: itemsData }, profileRes] = await Promise.all([
        supabase.from("marketplace_items").select("*").eq("in_stock", true),
        user ? supabase.from("profiles").select("fitness_goal, coins").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setItems(itemsData ?? []);
      if (profileRes.data) {
        setUserGoal(profileRes.data.fitness_goal);
        setUserCoins(profileRes.data.coins);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleBuy = async (item: Tables<"marketplace_items">) => {
    if (!user) return;
    if (userCoins < item.price) {
      toast.error("No tienes suficientes GymCoins");
      return;
    }

    // Deduct coins
    const { error: coinErr } = await supabase
      .from("profiles")
      .update({ coins: userCoins - item.price })
      .eq("user_id", user.id);

    if (coinErr) { toast.error("Error al procesar compra"); return; }

    // Add to inventory
    const { error: invErr } = await supabase.from("user_inventory").insert({
      user_id: user.id,
      item_id: item.id,
    });

    if (invErr) { toast.error("Error al agregar al inventario"); return; }

    setUserCoins((c) => c - item.price);
    toast.success(`¡Compraste ${item.name}!`);
  };

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
  }, [items, category, goalFilter, showRecommended, userGoal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Marketplace
      </motion.h2>

      {/* Coins display */}
      <div className="flex items-center gap-2 neon-card py-2 px-4">
        <Coins className="w-5 h-5 text-accent" />
        <span className="font-mono font-bold neon-text-cyan">{userCoins}</span>
        <span className="text-muted-foreground text-sm">GymCoins disponibles</span>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {categoryIcons[c]}
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Goal filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {GOALS.map((g) => (
          <button
            key={g}
            onClick={() => setGoalFilter(g)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              goalFilter === g ? "neon-border bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input type="checkbox" checked={showRecommended} onChange={(e) => setShowRecommended(e.target.checked)} className="accent-primary" />
        Priorizar según mi objetivo ({userGoal})
      </label>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((product, i) => {
          const isRecommended = product.fitness_goals.includes(userGoal);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`neon-card relative ${isRecommended ? "border-primary/40" : ""}`}
            >
              {isRecommended && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  RECOMENDADO
                </span>
              )}
              <div className="text-4xl text-center mb-2">{product.emoji}</div>
              <h3 className="font-semibold text-sm text-foreground leading-tight">{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="flex items-center gap-1 font-mono font-bold text-primary">
                  <Coins className="w-3.5 h-3.5" />
                  {product.price}
                </span>
                <button
                  onClick={() => handleBuy(product)}
                  disabled={userCoins < product.price}
                  className="bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full hover:bg-primary/30 transition-colors disabled:opacity-30"
                >
                  Comprar
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Marketplace;
