import type { FormulationFamily, LearningCard as LearningCardType } from "../types";
import { FieldStatusBadge } from "./FieldStatusBadge";
import { IngredientFunctionChip } from "./IngredientFunctionChip";
import { LearningCard } from "./LearningCard";

type Props = {
  formulation: FormulationFamily | null;
  learningCards: LearningCardType[];
  onCompare: () => void;
};

export function FormulationQuickView({ formulation, learningCards, onCompare }: Props) {
  const version = formulation?.versions[0];
  return (
    <aside className="formulation-quick-view">
      <div className="section-heading">
        <h2>Vista rapida</h2>
        <span>{formulation?.permanentCode ?? "Sin seleccion"}</span>
      </div>
      {!formulation ? (
        <p className="empty-state">Selecciona una formulacion para revisar ingredientes, version y aprendizaje.</p>
      ) : (
        <div className="quick-content">
          <header>
            <h3>{formulation.name}</h3>
            <FieldStatusBadge status={version?.status ?? "pendiente"} />
            <p>{formulation.category} - version {version?.versionNumber ?? 1}</p>
          </header>
          <section>
            <h4>Ingredientes</h4>
            <div className="ingredient-chip-row stacked">
              {(version?.ingredients ?? []).map((ingredient) => (
                <IngredientFunctionChip key={ingredient.id} name={ingredient.displayName} functionName={ingredient.cosmeticFunction} inci={ingredient.inci} />
              ))}
            </div>
          </section>
          <section>
            <h4>Modo aprendizaje</h4>
            <div className="learning-stack">
              {learningCards.map((card) => (
                <LearningCard key={`${card.name}-${card.cosmeticFunction}`} card={card} />
              ))}
              {learningCards.length === 0 ? <p className="empty-inline">Sin ingredientes para explicar.</p> : null}
            </div>
          </section>
          <button className="secondary-button" onClick={onCompare}>
            Comparar versiones
          </button>
        </div>
      )}
    </aside>
  );
}
