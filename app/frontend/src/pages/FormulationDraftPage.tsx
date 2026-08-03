import { FormEvent, useEffect, useMemo, useState } from "react";
import type { FormulationFamily, FormulationIngredient, FormulationVersion, RawMaterialMaster } from "../types";
import { api } from "../api/client";
import { FormulaEngineEditor } from "../components/FormulaEngineEditor";

type Props = {
  formulation: FormulationFamily;
  onClose: () => void;
  onChanged: () => Promise<void>;
};

export function FormulationDraftPage({ formulation, onClose, onChanged }: Props) {
  const [version, setVersion] = useState<FormulationVersion>(formulation.versions[0]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialMaster[]>([]);
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

  async function addIngredient(input: Parameters<typeof api.addIngredient>[1]) {
    const response = await api.addIngredient(version.id, input);
    setVersion((current) => ({ ...current, ingredients: [...current.ingredients, response.ingredient].sort((a, b) => a.orderIndex - b.orderIndex) }));
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
      <FormulaEngineEditor version={version} rawMaterials={rawMaterials} editable={editable} onAddIngredient={addIngredient} onRemoveIngredient={removeIngredient} onChanged={async () => {
        const response = await api.getFormulation(formulation.id);
        setVersion(response.formulation.versions.find((item) => item.id === version.id) ?? response.formulation.versions[0]);
        await onChanged();
      }} />
    </section>
  );
}
