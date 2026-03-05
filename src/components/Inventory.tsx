import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sounds } from "@/lib/sounds";

interface InventoryItem {
  id: string;
  quantity: number;
  purchased_at: string;
  item: {
    name: string;
    emoji: string | null;
    category: string;
    description: string | null;
  };
}

const Inventory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipped, setEquipped] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("equipped_items");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_inventory")
      .select("id, quantity, purchased_at, item:marketplace_items(name, emoji, category, description)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setItems((data as unknown as InventoryItem[]) || []);
        setLoading(false);
      });
  }, [user]);

  const toggleEquip = (id: string) => {
    sounds.click();
    setEquipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("equipped_items", JSON.stringify([...next]));
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        Inventario
      </motion.h2>

      {items.length === 0 ? (
        <div className="neon-card text-center py-10">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Tu inventario está vacío.</p>
          <p className="text-xs text-muted-foreground mt-1">Compra objetos en el Marketplace.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((inv, i) => {
            const isEquipped = equipped.has(inv.id);
            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`neon-card flex items-center gap-3 ${isEquipped ? "border-primary/60" : ""}`}
              >
                <div className="text-3xl">{inv.item?.emoji || "📦"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-foreground truncate">{inv.item?.name}</h4>
                    {isEquipped && <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{inv.item?.description}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    x{inv.quantity} • {inv.item?.category}
                  </p>
                </div>
                <button
                  onClick={() => toggleEquip(inv.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                    isEquipped
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {isEquipped ? "Equipado" : "Equipar"}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inventory;
