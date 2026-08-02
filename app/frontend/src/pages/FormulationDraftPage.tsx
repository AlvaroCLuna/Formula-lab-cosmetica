import { FormEvent, useEffect, useMemo, useState } from "react";
import type { FormulationFamily, FormulationIngredient, FormulationVersion, RawMaterialMaster } from "../types";
import { api } from "../api/client";

type Props = {
  formulation: FormulationFamily;
  onClose: () => void;
  onChanged: () => Promise<void>;
};

const emptyIngredient = {
  rawMaterialMasterId: "",
  displayName: "",
  inci: "",
  cosmeticFunction: "",
  phase: "A",
  percentage: 0,
  baseQuantity: 0,
  unit: "g",
  orderIndex: 1,
  sourceReference: ""
};

export function FormulationDraftPage({ formulation, onClose, onChanged }: Props) {
  const [version, setVersion] = useState<FormulationVersion>(formulation.versions[0]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialMaster[]>([]);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredient);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.listRawMaterials().then(({ rawMaterials }) => setRawMaterials(rawMaterials)).catch((error) => setMessage(error instanceof Error ? error.message : "No se cargo catalogo."));
  }, []);

  useEffect(() => {
    setVersion(formulation.versions[0]);
  }, [formulation]);

  const total = useMemo(() => Math.round((version.ingredients.reduce((sum, ingredient) => sum + Number(ingredient.percentage), 0) + Number.EPSILON) * 1000) / 1000, [version.ingredients]);
  const editable = ["borrador", "en_revision"].includes(version.status);

  async function saveVersion(event: FormEvent) {
    event.preventDefault();
    const response = await api.updateVersion(version.id, {
      name: version.name,
      category: version.category,
      objective: version.objective,
      notes: version.notes
    });
    setVersion(response.version);
    setMessage("Borrador guardado con historial.");
    await onChanged();
  }

  async function addIngredient(event: FormEvent) {
    event.preventDefault();
    const selected = rawMaterials.find((item) => item.id === ingredientForm.rawMaterialMasterId);
    const response = await api.addIngredient(version.id, {
      rawMaterialMasterId: selected?.id ?? null,
      displayName: ingredientForm.displayName || selected?.commonName || "",
      inci: ingredientForm.inci || selected?.inci || null,
      cosmeticFunction: ingredientForm.cosmeticFunction,
      phase: ingredientForm.phase,
      percentage: Number(ingredientForm.percentage),
      baseQuantity: Number(ingredientForm.baseQuantity),
      unit: ingredientForm.unit,
      orderIndex: Number(ingredientForm.orderIndex),
      sourceReference: selected?.permanentCode ?? ingredientForm.sourceReference
    });
    setVersion((current) => ({ ...current, ingredients: [...current.ingredients, response.ingredient].sort((a, b) => a.orderIndex - b.orderIndex) }));
    setIngredientForm({ ...emptyIngredient, orderIndex: version.ingredients.length + 2 });
    setMessage("Ingrediente agregado y auditado.");
    await onChanged();
  }

  async function removeIngredient(ingredient: FormulationIngredient) {
    await api.removeIngredient(ingredient.id);
    setVersion((current) => ({ ...current, ingredients: current.ingredients.filter((item) => item.id !== ingredient.id) }));
    setMessage("Ingrediente archivado con historial.");
    await onChanged();
  }

  async function submitReview() {
    const response = await api.submitVersion(version.id);
    setVersion(response.version);
    setMessage("Version enviada a revision.");
    await onChanged();
  }

  async function approve() {
    try {
      const response = await api.approveVersion(version.id);
      setVersion(response.version);
      setMessage("Version aprobada con snapshot persistente.");
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo aprobar.");
    }
  }

  async function reject() {
    const response = await api.rejectVersion(version.id);
    setVersion(response.version);
    setMessage("Version rechazada con historial.");
    await onChanged();
  }

  return (
    <section className="draft-editor">
      <div className="section-heading">
        <h2>Editor de borrador</h2>
        <span>{formulation.permanentCode} - v{version.versionNumber}</span>
      </div>
      <form className="draft-form" onSubmit={saveVersion}>
        <label>Nombre<input value={version.name} disabled={!editable} onChange={(event) => setVersion({ ...version, name: event.target.value })} /></label>
        <label>Categoria<input value={version.category} disabled={!editable} onChange={(event) => setVersion({ ...version, category: event.target.value })} /></label>
        <label>Objetivo<textarea value={version.objective ?? ""} disabled={!editable} onChange={(event) => setVersion({ ...version, objective: event.target.value })} /></label>
        <label>Notas<textarea value={version.notes ?? ""} disabled={!editable} onChange={(event) => setVersion({ ...version, notes: event.target.value })} /></label>
        <div className={total === 100 ? "total-box ok" : "total-box warn"}>Total porcentual: {total}%</div>
        <div className="draft-actions">
          <button className="secondary-button" type="submit" disabled={!editable}>Guardar borrador</button>
          <button className="secondary-button" type="button" onClick={submitReview} disabled={!editable}>Enviar a revision</button>
          <button className="primary-button" type="button" onClick={approve} disabled={!editable || total !== 100 || version.ingredients.length === 0}>Aprobar</button>
          <button className="danger-button" type="button" onClick={reject} disabled={!editable}>Rechazar</button>
          <button className="ghost-button" type="button" onClick={onClose}>Cerrar</button>
        </div>
      </form>
      {message ? <p className="module-message">{message}</p> : null}
      <form className="ingredient-form" onSubmit={addIngredient}>
        <h3>Ingredientes por fase</h3>
        <label>
          Materia prima maestra
          <select
            disabled={!editable}
            value={ingredientForm.rawMaterialMasterId}
            onChange={(event) => {
              const selected = rawMaterials.find((item) => item.id === event.target.value);
              setIngredientForm({
                ...ingredientForm,
                rawMaterialMasterId: event.target.value,
                displayName: selected?.commonName ?? ingredientForm.displayName,
                inci: selected?.inci ?? ingredientForm.inci,
                sourceReference: selected?.permanentCode ?? ingredientForm.sourceReference
              });
            }}
          >
            <option value="">Ingrediente provisional</option>
            {rawMaterials.map((material) => (
              <option key={material.id} value={material.id}>{material.permanentCode} - {material.commonName}</option>
            ))}
          </select>
        </label>
        <label>Nombre<input required disabled={!editable} value={ingredientForm.displayName} onChange={(event) => setIngredientForm({ ...ingredientForm, displayName: event.target.value })} /></label>
        <label>INCI<input disabled={!editable} value={ingredientForm.inci} onChange={(event) => setIngredientForm({ ...ingredientForm, inci: event.target.value })} /></label>
        <label>Funcion cosmetica<input required disabled={!editable} value={ingredientForm.cosmeticFunction} onChange={(event) => setIngredientForm({ ...ingredientForm, cosmeticFunction: event.target.value })} /></label>
        <label>Fase<input required disabled={!editable} value={ingredientForm.phase} onChange={(event) => setIngredientForm({ ...ingredientForm, phase: event.target.value })} /></label>
        <label>Orden<input required disabled={!editable} type="number" value={ingredientForm.orderIndex} onChange={(event) => setIngredientForm({ ...ingredientForm, orderIndex: Number(event.target.value) })} /></label>
        <label>Porcentaje<input required disabled={!editable} type="number" step="0.01" value={ingredientForm.percentage} onChange={(event) => setIngredientForm({ ...ingredientForm, percentage: Number(event.target.value) })} /></label>
        <label>Cantidad base<input required disabled={!editable} type="number" step="0.01" value={ingredientForm.baseQuantity} onChange={(event) => setIngredientForm({ ...ingredientForm, baseQuantity: Number(event.target.value) })} /></label>
        <button className="secondary-button" disabled={!editable} type="submit">Agregar ingrediente</button>
      </form>
      <div className="ingredients-table">
        {version.ingredients.map((ingredient) => (
          <div key={ingredient.id} className="ingredient-line">
            <span>{ingredient.orderIndex}</span>
            <strong>{ingredient.displayName}</strong>
            <span>Fase {ingredient.phase}</span>
            <span>{ingredient.percentage}%</span>
            <span>{ingredient.baseQuantity} {ingredient.unit}</span>
            <small>{ingredient.cosmeticFunction}</small>
            <button className="mini-button" disabled={!editable} onClick={() => removeIngredient(ingredient)}>Archivar</button>
          </div>
        ))}
        {version.ingredients.length === 0 ? <p className="empty-state">Agrega ingredientes para habilitar revision y aprobacion.</p> : null}
      </div>
    </section>
  );
}
