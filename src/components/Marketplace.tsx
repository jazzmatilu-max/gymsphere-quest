import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Filter, Coins, Dumbbell, Shirt, FlaskConical } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: "suplemento" | "ropa" | "equipo";
  fitnessGoal: string[];
  image: string;
  description: string;
}

const PRODUCTS: Product[] = [
  { id: "1", name: "Whey Protein Cyber", price: 120, category: "suplemento", fitnessGoal: ["Hipertrofia", "Fuerza"], image: "🥤", description: "Proteína de suero premium 2kg" },
  { id: "2", name: "Creatina NeonForce", price: 60, category: "suplemento", fitnessGoal: ["Hipertrofia", "Fuerza"], image: "⚡", description: "Monohidrato puro 500g" },
  { id: "3", name: "Tank Top Glitch", price: 45, category: "ropa", fitnessGoal: ["Hipertrofia", "Cardio"], image: "👕", description: "Fibra anti-sudor con diseño cyberpunk" },
  { id: "4", name: "Shorts HyperFlex", price: 55, category: "ropa", fitnessGoal: ["Cardio", "Pérdida de peso"], image: "🩳", description: "Shorts elásticos con bolsillos" },
  { id: "5", name: "Pre-Workout Volt", price: 85, category: "suplemento", fitnessGoal: ["Fuerza", "Cardio"], image: "🔋", description: "Energía extrema 30 servings" },
  { id: "6", name: "Guantes CyberGrip", price: 35, category: "equipo", fitnessGoal: ["Hipertrofia", "Fuerza"], image: "🧤", description: "Agarre máximo con soporte de muñeca" },
  { id: "7", name: "Fat Burner Neon", price: 70, category: "suplemento", fitnessGoal: ["Pérdida de peso", "Cardio"], image: "🔥", description: "Termogénico avanzado 60 caps" },
  { id: "8", name: "Hoodie Phantom", price: 80, category: "ropa", fitnessGoal: ["Hipertrofia", "Fuerza", "Cardio"], image: "🧥", description: "Hoodie oversized edición limitada" },
];

const CATEGORIES = ["todos", "suplemento", "ropa", "equipo"] as const;
const GOALS = ["Todos", "Hipertrofia", "Fuerza", "Cardio", "Pérdida de peso"];

const USER_GOAL = "Hipertrofia";

const categoryIcons: Record<string, React.ReactNode> = {
  todos: <ShoppingBag className="w-4 h-4" />,
  suplemento: <FlaskConical className="w-4 h-4" />,
  ropa: <Shirt className="w-4 h-4" />,
  equipo: <Dumbbell className="w-4 h-4" />,
};

const Marketplace = () => {
  const [category, setCategory] = useState<string>("todos");
  const [goalFilter, setGoalFilter] = useState<string>("Todos");
  const [showRecommended, setShowRecommended] = useState(true);

  const filtered = useMemo(() => {
    let items = PRODUCTS;
    if (category !== "todos") items = items.filter((p) => p.category === category);
    if (goalFilter !== "Todos") items = items.filter((p) => p.fitnessGoal.includes(goalFilter));
    if (showRecommended) {
      items = [...items].sort((a, b) => {
        const aMatch = a.fitnessGoal.includes(USER_GOAL) ? 1 : 0;
        const bMatch = b.fitnessGoal.includes(USER_GOAL) ? 1 : 0;
        return bMatch - aMatch;
      });
    }
    return items;
  }, [category, goalFilter, showRecommended]);

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold neon-text"
      >
        Marketplace
      </motion.h2>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              category === c
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
              goalFilter === g
                ? "neon-border bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Smart recommendation toggle */}
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={showRecommended}
          onChange={(e) => setShowRecommended(e.target.checked)}
          className="accent-primary"
        />
        Priorizar según mi objetivo ({USER_GOAL})
      </label>

      {/* Products grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((product, i) => {
          const isRecommended = product.fitnessGoal.includes(USER_GOAL);
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
              <div className="text-4xl text-center mb-2">{product.image}</div>
              <h3 className="font-semibold text-sm text-foreground leading-tight">{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="flex items-center gap-1 font-mono font-bold text-primary">
                  <Coins className="w-3.5 h-3.5" />
                  {product.price}
                </span>
                <button className="bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full hover:bg-primary/30 transition-colors">
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
