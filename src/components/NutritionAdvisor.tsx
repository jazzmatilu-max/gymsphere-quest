import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Target, Scale, Ruler, Save, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";

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

    // Mifflin-St Jeor BMR
    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const goal = profile?.fitness_goal || "Hipertrofia";

    let multiplier = 1.55; // moderate activity
    let proteinPerKg = 1.6;
    let fatPercent = 0.25;
    let label = "";

    switch (goal) {
      case "Hipertrofia":
        multiplier = 1.7;
        proteinPerKg = 2.2;
        fatPercent = 0.25;
        label = "Superávit calórico para ganancia muscular";
        break;
      case "Fuerza":
        multiplier = 1.6;
        proteinPerKg = 2.0;
        fatPercent = 0.3;
        label = "Mantenimiento con alta proteína";
        break;
      case "Cardio":
        multiplier = 1.75;
        proteinPerKg = 1.4;
        fatPercent = 0.2;
        label = "Alto carbohidrato para resistencia";
        break;
      case "Pérdida de peso":
        multiplier = 1.4;
        proteinPerKg = 2.0;
        fatPercent = 0.25;
        label = "Déficit calórico controlado";
        break;
      default:
        label = "Plan balanceado";
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

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      weight_kg: parseFloat(weight) || null,
      height_cm: parseFloat(height) || null,
      age: parseInt(age) || null,
    } as any);
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
              <div key={m.label} className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-mono">{m.label}</p>
                <p className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
          {/* Macro bar visual */}
          <div className="h-4 rounded-full overflow-hidden flex">
            <div style={{ width: `${(macros.protein * 4 / macros.tdee) * 100}%` }} className="bg-accent h-full" title="Proteína" />
            <div style={{ width: `${(macros.carbs * 4 / macros.tdee) * 100}%` }} className="xp-bar-fill h-full" title="Carbos" />
            <div style={{ width: `${(macros.fat * 9 / macros.tdee) * 100}%` }} className="bg-neon-purple h-full" title="Grasas" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>🟦 Proteína</span><span>🟩 Carbos</span><span>🟪 Grasas</span>
          </div>
        </motion.div>
      )}

      {/* Supplements */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="neon-card space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" /> Suplementos Recomendados
        </h3>
        {supplements.map((s) => (
          <div key={s.name} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
            <div>
              <p className="font-medium text-sm text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.reason}</p>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              s.priority === "alta" ? "bg-primary/20 text-primary" :
              s.priority === "media" ? "bg-accent/20 text-accent" :
              "bg-muted text-muted-foreground"
            }`}>{s.priority.toUpperCase()}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default NutritionAdvisor;
