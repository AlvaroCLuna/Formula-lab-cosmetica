import type { FormulationComparison, FormulationVersion } from "../types";

type Props = {
  versions: FormulationVersion[];
  comparison: FormulationComparison | null;
  baseVersionId: string;
  targetVersionId: string;
  onBaseChange: (id: string) => void;
  onTargetChange: (id: string) => void;
  onCompare: () => void;
};

export function VersionCompareView({ versions, comparison, baseVersionId, targetVersionId, onBaseChange, onTargetChange, onCompare }: Props) {
  return (
    <section className="compare-panel">
      <div className="section-heading">
        <h2>Comparacion</h2>
        <span>{versions.length} versiones</span>
      </div>
      <div className="compare-controls">
        <label>
          Base
          <select value={baseVersionId} onChange={(event) => onBaseChange(event.target.value)}>
            <option value="">Selecciona</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.versionNumber} - {version.status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Objetivo
          <select value={targetVersionId} onChange={(event) => onTargetChange(event.target.value)}>
            <option value="">Selecciona</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.versionNumber} - {version.status}
              </option>
            ))}
          </select>
        </label>
        <button className="secondary-button" onClick={onCompare} disabled={!baseVersionId || !targetVersionId || baseVersionId === targetVersionId}>
          Comparar
        </button>
      </div>
      {comparison ? (
        <div className="compare-results">
          <p>v{comparison.baseVersion} contra v{comparison.targetVersion}</p>
          <strong>Agregados: {comparison.ingredients.added.length}</strong>
          <strong>Retirados: {comparison.ingredients.removed.length}</strong>
          <strong>Modificados: {comparison.ingredients.modified.length}</strong>
          {comparison.ingredients.modified.map((item) => (
            <span key={item.ingredient}>{item.ingredient}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
