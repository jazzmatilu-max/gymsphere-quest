import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Target, Scale, Save, Loader2, Apple, Beef, Egg, Wheat } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { sounds } from "@/lib/sounds";

interface MealSuggestion {
  meal: string;
  foods: string[];
  icon: React.ReactNode;
}

const getMealPlan = (goal: string): MealSuggestion[] => {
  const plans: Record<string, MealSuggestion[]> = {
    "Hipertrofia": [
      { meal: "Desayuno", foods: ["6 claras + 2 huevos enteros", "Avena con plátano y miel", "Batido de whey con leche"], icon: <Egg className="w-4 h-4 text-accent" /> },
      { meal: "Almuerzo", foods: ["Pechuga de pollo 200g", "Arroz integral 1 taza", "Brócoli y espinacas"], icon: <Beef className="w-4 h-4 text-primary" /> },
      { meal: "Merienda", foods: ["Batata al horno", "Yogurt griego con nueces", "Proteína whey 30g"], icon: <Apple className="w-4 h-4 text-accent" /> },
      { meal: "Cena", foods: ["Salmón o tilapia 200g", "Quinoa o pasta integral", "Ensalada verde con aguacate"], icon: <Wheat className="w-4 h-4 text-primary" /> },
    ],
    "Fuerza": [
      { meal: "Desayuno", foods: ["Tortilla de 4 huevos con queso", "Pan integral con mantequilla de maní", "Jugo de naranja natural"], icon: <Egg className="w-4 h-4 text-accent" /> },
      { meal: "Almuerzo", foods: ["Carne roja magra 250g", "Papa al horno", "Vegetales salteados"], icon: <Beef className="w-4 h-4 text-primary" /> },
      { meal: "Merienda", foods: ["Almendras y nueces 50g", "Batido de caseína", "Plátano"], icon: <Apple className="w-4 h-4 text-accent" /> },
      { meal: "Cena", foods: ["Pollo 200g", "Arroz blanco", "Aguacate y tomate"], icon: <Wheat className="w-4 h-4 text-primary" /> },
    ],
    "Cardio": [
      { meal: "Desayuno", foods: ["Avena con frutas y miel", "Tostada integral con mermelada", "Jugo verde (espinaca, manzana)"], icon: <Egg className="w-4 h-4 text-accent" /> },
      { meal: "Almuerzo", foods: ["Pasta integral con pollo", "Ensalada mediterránea", "Fruta de temporada"], icon: <Beef className="w-4 h-4 text-primary" /> },
      { meal: "Merienda", foods: ["Barrita energética", "Plátano con miel", "Bebida isotónica"], icon: <Apple className="w-4 h-4 text-accent" /> },
      { meal: "Cena", foods: ["Pescado blanco 150g", "Verduras al vapor", "Arroz integral"], icon: <Wheat className="w-4 h-4 text-primary" /> },
    ],
    "Pérdida de peso": [
      { meal: "Desayuno", foods: ["Claras de huevo con espinaca", "Café negro sin azúcar", "1/2 aguacate"], icon: <Egg className="w-4 h-4 text-accent" /> },
      { meal: "Almuerzo", foods: ["Pechuga a la plancha 150g", "Ensalada grande con vinagreta", "Pepino y zanahoria"], icon: <Beef className="w-4 h-4 text-primary" /> },
      { meal: "Merienda", foods: ["Yogurt griego natural", "Apio con hummus", "Té verde"], icon: <Apple className="w-4 h-4 text-accent" /> },
      { meal: "Cena", foods: ["Sopa de verduras", "Atún en agua 1 lata", "Ensalada de tomate"], icon: <Wheat className="w-4 h-4 text-primary" /> },
    ],
  };
  return plans[goal] || plans["Hipertrofia"];
};

const NutritionAdvisor = () => {
  const { profile, updateProfile } = useProfile();
  const [weight, setWeight] = useState(profile?.weight_kg?.toString() || "");
  const [height, setHeight] = useState(profile?.height_cm?.toString() || "");
  const [age, setAge] = useState(profile?.age?.toString() || "");
  const [saving, setSaving] = useState(false);

  const macros = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    if (!w || !h || !a) return null;

    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const goal = profile?.fitness_goal || "Hipertrofia";
    let multiplier = 1.55, proteinPerKg = 1.6, fatPercent = 0.25, label = "";

    switch (goal) {
      case "Hipertrofia": multiplier = 1.7; proteinPerKg = 2.2; fatPercent = 0.25; label = "Superávit calórico para ganancia muscular"; break;
      case "Fuerza": multiplier = 1.6; proteinPerKg = 2.0; fatPercent = 0.3; label = "Mantenimiento con alta proteína"; break;
      case "Cardio": multiplier = 1.75; proteinPerKg = 1.4; fatPercent = 0.2; label = "Alto carbohidrato para resistencia"; break;
      case "Pérdida de peso": multiplier = 1.4; proteinPerKg = 2.0; fatPercent = 0.25; label = "Déficit calórico controlado"; break;
      default: label = "Plan balanceado";
    }

    const tdee = Math.round(bmr * multiplier);
    const protein = Math.round(proteinPerKg * w);
    const fat = Math.round((tdee * fatPercent) / 9);
    const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4);
    return { tdee, protein, fat, carbs, label, bmr: Math.round(bmr) };
  }, [weight, height, age, profile?.fitness_goal]);

  const supplements = useMemo(() => {
    const goal = profile?.fitness_goal || "Hipertrofia";
    const base = [
      { name: "Whey Protein", reason: "30g post-entreno", priority: "alta" },
      { name: "Multivitamínico", reason: "Cobertura nutricional", priority: "media" },
    ];
    if (goal === "Hipertrofia" || goal === "Fuerza") {
      base.push({ name: "Creatina 5g/día", reason: "Fuerza y volumen celular", priority: "alta" });
      base.push({ name: "BCAA", reason: "Recuperación muscular", priority: "media" });
    }
    if (goal === "Pérdida de peso") {
      base.push({ name: "L-Carnitina", reason: "Oxidación de grasas", priority: "media" });
      base.push({ name: "CLA", reason: "Recomposición corporal", priority: "baja" });
    }
    if (goal === "Cardio") {
      base.push({ name: "Electrolitos", reason: "Hidratación durante cardio", priority: "alta" });
      base.push({ name: "Beta-Alanina", reason: "Resistencia muscular", priority: "media" });
    }
    return base;
  }, [profile?.fitness_goal]);

  const mealPlan = useMemo(() => getMealPlan(profile?.fitness_goal || "Hipertrofia"), [profile?.fitness_goal]);

  const handleSave = async () => {
    setSaving(true);
    sounds.click();
    await updateProfile({
      weight_kg: parseFloat(weight) || null,
      height_cm: parseFloat(height) || null,
      age: parseInt(age) || null,
    } as any);
    sounds.success();
    toast({ title: "Datos guardados", description: "Tu perfil nutricional ha sido actualizado" });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold neon-text">
        IA Nutrition Advisor
      </motion.h2>

      {/* Input form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="neon-card space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" /> Datos Corporales
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-mono block mb-1">PESO (kg)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75"
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-mono block mb-1">ALTURA (cm)</label>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175"
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-mono block mb-1">EDAD</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25"
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="w-4 h-4 text-primary" />
          Objetivo: <span className="text-primary font-semibold">{profile?.fitness_goal || "—"}</span>
        </div>
        <button onClick={handleSave} disabled={saving} className="neon-button w-full flex items-center justify-center gap-2 text-sm py-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Datos
        </button>
      </motion.div>

      {/* Macros */}
      {macros && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="neon-card space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-accent" /> Plan de Macros
          </h3>
          <p className="text-xs text-muted-foreground font-mono">{macros.label}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "CALORÍAS", value: `${macros.tdee} kcal`, color: "neon-text" },
              { label: "PROTEÍNA", value: `${macros.protein}g`, color: "neon-text-cyan" },
              { label: "CARBOS", value: `${macros.carbs}g`, color: "neon-text" },
              { label: "GRASAS", value: `${macros.fat}g`, color: "text-accent" },
            ].map((m) => (
              <motion.div key={m.label} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-mono">{m.label}</p>
                <p className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</p>
              </motion.div>
            ))}
          </div>
          <div className="h-4 rounded-full overflow-hidden flex">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(macros.protein * 4 / macros.tdee) * 100}%` }}
              transition={{ delay: 0.3, duration: 0.8 }} className="bg-accent h-full" title="Proteína" />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(macros.carbs * 4 / macros.tdee) * 100}%` }}
              transition={{ delay: 0.5, duration: 0.8 }} className="xp-bar-fill h-full" title="Carbos" />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(macros.fat * 9 / macros.tdee) * 100}%` }}
              transition={{ delay: 0.7, duration: 0.8 }} className="bg-neon-purple h-full" title="Grasas" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>🟦 Proteína</span><span>🟩 Carbos</span><span>🟪 Grasas</span>
          </div>
        </motion.div>
      )}

      {/* Meal Plan */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="neon-card space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Apple className="w-4 h-4 text-primary" /> Plan de Alimentación
        </h3>
        <p className="text-xs text-muted-foreground font-mono">Basado en tu objetivo: {profile?.fitness_goal}</p>
        {mealPlan.map((meal, i) => (
          <motion.div key={meal.meal} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-muted/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              {meal.icon} {meal.meal}
            </div>
            {meal.foods.map((food) => (
              <p key={food} className="text-xs text-muted-foreground pl-6">• {food}</p>
            ))}
          </motion.div>
        ))}
      </motion.div>

      {/* Supplements */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="neon-card space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" /> Suplementos Recomendados
        </h3>
        {supplements.map((s, i) => (
          <motion.div key={s.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
            className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
            <div>
              <p className="font-medium text-sm text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.reason}</p>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              s.priority === "alta" ? "bg-primary/20 text-primary" :
              s.priority === "media" ? "bg-accent/20 text-accent" :
              "bg-muted text-muted-foreground"
            }`}>{s.priority.toUpperCase()}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default NutritionAdvisor;
