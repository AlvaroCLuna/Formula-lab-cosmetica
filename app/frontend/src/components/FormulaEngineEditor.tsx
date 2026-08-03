import { FormEvent, useEffect, useMemo, useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import { api } from "../api/client";
import type { FormulaEngineState, FormulationIngredient, FormulationVersion, RawMaterialMaster } from "../types";

type Props = {
  version: FormulationVersion;
  rawMaterials: RawMaterialMaster[];
  editable: boolean;
  onAddIngredient: (input: {
    rawMaterialMasterId: string | null;
    displayName: string;
    inci: string | null;
    cosmeticFunction: string;
    phase: string;
    percentage: number;
    baseQuantity: number;
    unit: string;
    orderIndex: number;
    sourceReference: string;
  }) => Promise<void>;
  onRemoveIngredient: (ingredient: FormulationIngredient) => Promise<void>;
  onChanged: () => Promise<void>;
};

const batchSizes = [100, 250, 500, 1000, 5000, 20000, 100000];

export function FormulaEngineEditor({ version, rawMaterials, editable, onAddIngredient, onRemoveIngredient, onChanged }: Props) {
  const [engine, setEngine] = useState<FormulaEngineState | null>(null);
  const [batchSize, setBatchSize] = useState(100);
  const [newPhase, setNewPhase] = useState("");
  const [dragIngredientId, setDragIngredientId] = useState<string | null>(null);
  const [form, setForm] = useState({ rawMaterialMasterId: "", displayName: "", inci: "", cosmeticFunction: "", phase: "A", percentage: 0 });

  async function loadEngine(nextBatchSize = batchSize) {
    const response = await api.getFormulaEngine(version.id, nextBatchSize);
    setEngine(response);
  }

  useEffect(() => {
    loadEngine().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version.id, version.ingredients.length]);

  const grouped = useMemo(() => {
    const phaseNames = engine?.phases.map((phase) => phase.name) ?? Array.from(new Set(version.ingredients.map((ingredient) => ingredient.phase)));
    return phaseNames.map((phase) => ({
      phase,
      subtotal: engine?.calculation.phaseTotals.find((item) => item.phase === phase),
      ingredients: version.ingredients.filter((ingredient) => ingredient.phase === phase).sort((a, b) => a.orderIndex - b.orderIndex)
    }));
  }, [engine, version.ingredients]);

  async function addPhase(event: FormEvent) {
    event.preventDefault();
    if (!newPhase.trim()) return;
    await api.addFormulaPhase(version.id, { name: newPhase.trim(), orderIndex: (engine?.phases.length ?? 0) + 1 });
    setNewPhase("");
    await loadEngine();
  }

  async function addIngredient(event: FormEvent) {
    event.preventDefault();
    const selected = rawMaterials.find((item) => item.id === form.rawMaterialMasterId);
    await onAddIngredient({
      rawMaterialMasterId: selected?.id ?? null,
      displayName: form.displayName || selected?.commonName || "",
      inci: form.inci || selected?.inci || null,
      cosmeticFunction: form.cosmeticFunction || selected?.cosmeticFunction || "",
      phase: form.phase,
      percentage: Number(form.percentage),
      baseQuantity: Number(form.percentage),
      unit: "g",
      orderIndex: version.ingredients.filter((ingredient) => ingredient.phase === form.phase).length + 1,
      sourceReference: selected?.permanentCode ?? "Formula Engine"
    });
    setForm({ rawMaterialMasterId: "", displayName: "", inci: "", cosmeticFunction: "", phase: form.phase, percentage: 0 });
    await loadEngine();
  }

  async function dropOnPhase(phase: string) {
    if (!dragIngredientId) return;
    const orderIndex = version.ingredients.filter((ingredient) => ingredient.phase === phase).length + 1;
    await api.moveFormulaIngredient(dragIngredientId, { phase, orderIndex });
    setDragIngredientId(null);
    await onChanged();
    await loadEngine();
  }

  async function reorderPhase(name: string, direction: -1 | 1) {
    const phases = [...(engine?.phases ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
    const index = phases.findIndex((phase) => phase.name === name);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= phases.length) return;
    [phases[index], phases[target]] = [phases[target], phases[index]];
    await api.reorderFormulaPhases(version.id, phases.map((phase, nextIndex) => ({ name: phase.name, orderIndex: nextIndex + 1 })));
    await loadEngine();
  }

  return (
    <section className="formula-engine">
      <div className="section-heading">
        <h2>Formula Engine</h2>
        <span>{engine?.validation.isValid ? "Validacion correcta" : "Requiere ajuste"}</span>
      </div>
      <div className="engine-toolbar">
        <div className="scale-control">
          {batchSizes.map((size) => (
            <button key={size} className={batchSize === size ? "mini-button active" : "mini-button"} type="button" onClick={() => { setBatchSize(size); loadEngine(size); }}>
              {size >= 1000 ? `${size / 1000} kg` : `${size} g`}
            </button>
          ))}
        </div>
        <form className="phase-form" onSubmit={addPhase}>
          <input disabled={!editable} placeholder="Nueva fase" value={newPhase} onChange={(event) => setNewPhase(event.target.value)} />
          <button className="secondary-button" disabled={!editable} type="submit"><Plus size={16} />Fase</button>
        </form>
      </div>
      <div className="engine-layout">
        <div className="phase-board">
          {grouped.map((group) => (
            <article className="phase-column" key={group.phase} onDragOver={(event) => event.preventDefault()} onDrop={() => dropOnPhase(group.phase)}>
              <header>
                <div>
                  <strong>Fase {group.phase}</strong>
                  <span>{group.subtotal?.percentage ?? 0}% - {group.subtotal?.grams ?? 0} g</span>
                </div>
                <div className="phase-actions">
                  <button className="mini-button" disabled={!editable} type="button" onClick={() => reorderPhase(group.phase, -1)}>Subir</button>
                  <button className="mini-button" disabled={!editable} type="button" onClick={() => reorderPhase(group.phase, 1)}>Bajar</button>
                </div>
              </header>
              <div className="ingredient-cards">
                {group.ingredients.map((ingredient) => {
                  const grams = Math.round((ingredient.percentage / 100) * batchSize * 1000) / 1000;
                  return (
                    <div className="engine-ingredient-card" key={ingredient.id} draggable={editable} onDragStart={() => setDragIngredientId(ingredient.id)}>
                      <GripVertical size={16} />
                      <div><strong>{ingredient.displayName}</strong><span>{ingredient.cosmeticFunction}</span></div>
                      <b>{ingredient.percentage}%</b>
                      <small>{grams} g</small>
                      <button className="mini-button" disabled={!editable} type="button" onClick={() => onRemoveIngredient(ingredient)}>Archivar</button>
                    </div>
                  );
                })}
                {group.ingredients.length === 0 ? <p className="empty-inline">Fase vacia</p> : null}
              </div>
            </article>
          ))}
        </div>
        <aside className="engine-side-panel">
          <h3>Validaciones</h3>
          <strong>Total: {engine?.calculation.totalPercentage ?? 0}% - {engine?.calculation.totalGrams ?? 0} g</strong>
          {(engine?.validation.issues ?? []).map((issue) => (
            <p className={issue.severity === "error" ? "module-warning" : "empty-inline"} key={`${issue.code}-${issue.message}`}>{issue.message}</p>
          ))}
          {(engine?.validation.issues ?? []).length === 0 ? <p className="module-message">Sin alertas del motor.</p> : null}
          <h3>Modo aprendizaje</h3>
          <p className="empty-inline">El motor calcula gramos desde porcentajes y prepara restricciones futuras sin ejecutar reglas quimicas todavia.</p>
        </aside>
      </div>
      <form className="engine-add-ingredient" onSubmit={addIngredient}>
        <select disabled={!editable} value={form.rawMaterialMasterId} onChange={(event) => {
          const selected = rawMaterials.find((item) => item.id === event.target.value);
          setForm({ ...form, rawMaterialMasterId: event.target.value, displayName: selected?.commonName ?? "", inci: selected?.inci ?? "", cosmeticFunction: selected?.cosmeticFunction ?? "" });
        }}>
          <option value="">Ingrediente provisional</option>
          {rawMaterials.map((material) => <option key={material.id} value={material.id}>{material.permanentCode} - {material.commonName}</option>)}
        </select>
        <input required disabled={!editable} placeholder="Nombre" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
        <input required disabled={!editable} placeholder="Funcion" value={form.cosmeticFunction} onChange={(event) => setForm({ ...form, cosmeticFunction: event.target.value })} />
        <select disabled={!editable} value={form.phase} onChange={(event) => setForm({ ...form, phase: event.target.value })}>
          {grouped.map((group) => <option key={group.phase} value={group.phase}>{group.phase}</option>)}
        </select>
        <input required disabled={!editable} type="number" step="0.01" placeholder="%" value={form.percentage} onChange={(event) => setForm({ ...form, percentage: Number(event.target.value) })} />
        <button className="primary-button" disabled={!editable} type="submit">Agregar ingrediente</button>
      </form>
    </section>
  );
}
