import type { RawMaterialLearning, RawMaterialMaster } from "../types";
import { FieldStatusBadge } from "./FieldStatusBadge";

type Props = {
  rawMaterial: RawMaterialMaster | null;
  learning: RawMaterialLearning | null;
  onNewVersion: () => void;
  onArchive: () => void;
};

export function RawMaterialQuickView({ rawMaterial, learning, onNewVersion, onArchive }: Props) {
  const version = rawMaterial?.versions?.[0];
  return (
    <aside className="raw-material-quick-view">
      <div className="section-heading">
        <h2>Vista rapida</h2>
        <span>{rawMaterial?.permanentCode ?? "Sin seleccion"}</span>
      </div>
      {!rawMaterial ? (
        <p className="empty-state">Selecciona una materia prima para ver propiedades, documentos y uso en formulaciones.</p>
      ) : (
        <div className="quick-content">
          <header>
            <h3>{rawMaterial.commonName}</h3>
            <FieldStatusBadge status={rawMaterial.status} />
            <p>{rawMaterial.inci ?? "INCI no disponible"}</p>
          </header>
          <section>
            <h4>Propiedades</h4>
            <dl className="knowledge-dl">
              <dt>Categoria</dt><dd>{rawMaterial.category ?? "Pendiente"}</dd>
              <dt>Familia</dt><dd>{rawMaterial.family ?? "Pendiente"}</dd>
              <dt>Funcion</dt><dd>{rawMaterial.cosmeticFunction ?? "Pendiente"}</dd>
              <dt>Uso</dt><dd>{version?.usageRange ?? "Pendiente"}</dd>
              <dt>pH</dt><dd>{version?.ph ?? "Pendiente"}</dd>
              <dt>Temp. max</dt><dd>{version?.maxTemperature ?? "Pendiente"}</dd>
            </dl>
          </section>
          <section>
            <h4>Inteligencia</h4>
            <div className="knowledge-metrics">
              <span><strong>{rawMaterial.intelligence?.formulationCount ?? 0}</strong> formulaciones</span>
              <span><strong>{rawMaterial.intelligence?.supplierCount ?? 0}</strong> proveedores</span>
              <span><strong>{rawMaterial.intelligence?.documentCount ?? 0}</strong> documentos</span>
              <span><strong>{rawMaterial.intelligence?.averageUsage ?? "N/D"}%</strong> uso promedio</span>
            </div>
          </section>
          <section>
            <h4>Modo aprendizaje</h4>
            <p>{learning?.description ?? "Informacion insuficiente para evaluar."}</p>
            <small>Ejemplos: {learning?.examplesOfUse ?? "Informacion insuficiente para evaluar."}</small>
          </section>
          <section>
            <h4>Formulaciones relacionadas</h4>
            {(learning?.formulations ?? []).map((formulation) => (
              <span className="relation-pill" key={formulation.id}>{formulation.name} - {formulation.percentage}%</span>
            ))}
            {(learning?.formulations ?? []).length === 0 ? <p className="empty-inline">Sin formulaciones relacionadas.</p> : null}
          </section>
          <div className="row-actions">
            <button className="secondary-button" disabled={version?.status !== "validada"} onClick={onNewVersion}>Nueva version</button>
            <button className="danger-button" onClick={onArchive}>Archivar</button>
          </div>
        </div>
      )}
    </aside>
  );
}
