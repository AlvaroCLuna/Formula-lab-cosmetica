import type { FormulationFamily } from "../types";
import { FieldStatusBadge } from "./FieldStatusBadge";
import { IngredientFunctionChip } from "./IngredientFunctionChip";

type Props = {
  formulations: FormulationFamily[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEditDraft: (formulation: FormulationFamily) => void;
  onNewVersion: (formulation: FormulationFamily) => void;
};

export function FormulationTable({ formulations, selectedId, onSelect, onEditDraft, onNewVersion }: Props) {
  return (
    <section className="formulation-table">
      <div className="section-heading">
        <h2>Formulaciones</h2>
        <span>{formulations.length} registros</span>
      </div>
      <div className="formulation-rows">
        {formulations.map((formulation) => {
          const version = formulation.versions[0];
          const ingredients = version?.ingredients ?? [];
          return (
            <article key={formulation.id} className={selectedId === formulation.id ? "formulation-row selected" : "formulation-row"}>
              <button className="formulation-summary" onClick={() => onSelect(formulation.id)} title="Abrir vista rapida">
                <div>
                  <strong>{formulation.permanentCode}</strong>
                  <h3>{formulation.name}</h3>
                  <span>{formulation.category} - v{version?.versionNumber ?? 1}</span>
                </div>
                <FieldStatusBadge status={version?.status ?? "pendiente"} />
              </button>
              <div className="ingredient-chip-row">
                {ingredients.slice(0, 5).map((ingredient) => (
                  <IngredientFunctionChip key={ingredient.id} name={ingredient.displayName} functionName={ingredient.cosmeticFunction} inci={ingredient.inci} />
                ))}
                {ingredients.length > 5 ? <span className="more-chip">+{ingredients.length - 5}</span> : null}
                {ingredients.length === 0 ? <span className="empty-inline">Sin ingredientes</span> : null}
              </div>
              <div className="row-actions">
                <button className="mini-button" onClick={() => onEditDraft(formulation)} disabled={!version || !["borrador", "en_revision"].includes(version.status)}>
                  Editar borrador
                </button>
                <button className="mini-button" onClick={() => onNewVersion(formulation)} disabled={version?.status !== "aprobada"}>
                  Nueva version
                </button>
              </div>
            </article>
          );
        })}
        {formulations.length === 0 ? <p className="empty-state">No hay formulaciones con esos filtros.</p> : null}
      </div>
    </section>
  );
}
