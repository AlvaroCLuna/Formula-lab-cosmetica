import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileWarning, PackageCheck, ShieldAlert, Timer, XCircle } from "lucide-react";
import { api } from "../api/client";
import type { QualityInspection, QualityRecord } from "../types";
import { FieldStatusBadge } from "../components/FieldStatusBadge";

export function QualityPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [specifications, setSpecifications] = useState<any[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [releases, setReleases] = useState<QualityRecord[]>([]);
  const [deviations, setDeviations] = useState<QualityRecord[]>([]);
  const [nonConformities, setNonConformities] = useState<QualityRecord[]>([]);
  const [capa, setCapa] = useState<QualityRecord[]>([]);
  const [dispositions, setDispositions] = useState<QualityRecord[]>([]);
  const [selected, setSelected] = useState<QualityInspection | null>(null);
  const [tab, setTab] = useState<"cola" | "desviaciones" | "ncf" | "capa" | "aprendizaje">("cola");
  const [message, setMessage] = useState("");

  async function load() {
    const [dash, specs, inspectionsRes, releaseRes, devRes, ncfRes, capaRes, dispRes] = await Promise.all([
      api.qualityDashboard(),
      api.listQualitySpecifications(),
      api.listQualityInspections(),
      api.listQualityReleases(),
      api.listQualityDeviations(),
      api.listQualityNonConformities(),
      api.listQualityCapa(),
      api.listQualityDispositions()
    ]);
    setDashboard(dash.indicators);
    setSpecifications(specs.specifications);
    setInspections(inspectionsRes.inspections);
    setReleases(releaseRes.releases);
    setDeviations(devRes.deviations);
    setNonConformities(ncfRes.nonConformities);
    setCapa(capaRes.capa);
    setDispositions(dispRes.dispositions);
    setSelected((current) => current ?? inspectionsRes.inspections[0] ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  const approvedSpec = useMemo(() => specifications.find((item) => item.status === "aprobada"), [specifications]);

  async function createDemoInspection() {
    const response = await api.createQualityInspection({
      supplierName: "Proveedor Validacion",
      receivedQuantity: 1200,
      unit: "g",
      packageIntegrity: "integro",
      identification: "correcta",
      color: "conforme",
      odor: "conforme",
      appearance: "conforme",
      initialResult: "aprobado",
      observations: "Inspeccion guiada desde Control de Calidad.",
      specificationId: approvedSpec?.id
    });
    setMessage(`Inspeccion creada: ${response.inspection.permanentCode}`);
    await load();
  }

  async function releaseSelected() {
    if (!selected || !approvedSpec) return;
    const response = await api.createQualityRelease({
      releaseType: "liberacion",
      entityType: "lote",
      entityId: selected.lotId ?? selected.id,
      inspectionId: selected.id,
      specificationId: approvedSpec.id,
      decision: selected.status === "rechazado" ? "rechazar" : "liberar",
      conclusion: "Decision guiada con evidencia suficiente registrada.",
      reason: "Validacion de flujo Control de Calidad.",
      digitalConfirmation: "confirmacion-ui"
    });
    setMessage(`Decision registrada: ${response.release.permanentCode}`);
    await load();
  }

  return (
    <div className="quality-page">
      <section className="quality-hero">
        <div>
          <p className="eyebrow">Control de Calidad</p>
          <h2>Liberacion, cuarentena y CAPA</h2>
          <p>Gestiona especificaciones, inspecciones, liberaciones, desviaciones, no conformidades y disposiciones con evidencia KDE.</p>
        </div>
        <div className="quality-kpis">
          <Metric icon={<PackageCheck />} value={dashboard?.pendingLots ?? 0} label="Pendientes" />
          <Metric icon={<ShieldAlert />} value={dashboard?.quarantineLots ?? 0} label="Cuarentena" />
          <Metric icon={<XCircle />} value={dashboard?.rejectedLots ?? 0} label="Rechazados" />
          <Metric icon={<FileWarning />} value={dashboard?.openDeviations ?? 0} label="Desviaciones" />
          <Metric icon={<AlertTriangle />} value={dashboard?.openNcfs ?? 0} label="NC abiertas" />
          <Metric icon={<Timer />} value={dashboard?.overdueCapas ?? 0} label="CAPA vencidas" />
        </div>
      </section>

      <nav className="quality-tabs">
        {["cola", "desviaciones", "ncf", "capa", "aprendizaje"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item as typeof tab)}>{item}</button>)}
      </nav>

      {message ? <p className="module-warning">{message}</p> : null}

      <div className="quality-layout">
        <main className="quality-main">
          {tab === "cola" ? inspections.map((inspection) => (
            <article key={inspection.id} className={selected?.id === inspection.id ? "quality-card selected" : "quality-card"} onClick={() => setSelected(inspection)}>
              <header><strong>{inspection.permanentCode}</strong><FieldStatusBadge status={inspection.status} /></header>
              <h3>{inspection.supplierName ?? "Proveedor sin dato"}</h3>
              <p>{inspection.lotId ?? "Sin lote"} · {inspection.specification?.name ?? "Sin especificacion"} · {inspection.initialResult ?? "Sin resultado"}</p>
              <div className="chip-row"><span>{inspection.packageIntegrity ?? "empaque s/d"}</span><span>{inspection.releases?.length ?? 0} decisiones</span></div>
            </article>
          )) : null}

          {tab === "desviaciones" ? deviations.map((item) => <QualityMiniCard key={item.id} item={item} />) : null}
          {tab === "ncf" ? nonConformities.map((item) => <QualityMiniCard key={item.id} item={item} />) : null}
          {tab === "capa" ? capa.map((item) => <QualityMiniCard key={item.id} item={item} />) : null}
          {tab === "aprendizaje" ? (
            <section className="quality-learning">
              <h3>Modo aprendizaje</h3>
              <p>Calidad decide el uso de materiales y producto con base en especificaciones aprobadas, evidencia y resultados suficientes.</p>
              <p>Una desviacion contiene el riesgo inmediato; una no conformidad documenta el incumplimiento; una CAPA corrige o previene la causa.</p>
              <p>Una liberacion cerrada no debe editarse sin revision documentada y toda evidencia vive en KDE.</p>
            </section>
          ) : null}
        </main>

        <aside className="quality-side">
          <div className="side-header">
            <div>
              <p className="eyebrow">Vista rapida</p>
              <h3>{selected?.permanentCode ?? "Sin seleccion"}</h3>
            </div>
            <ClipboardCheck size={24} />
          </div>
          {selected ? (
            <>
              <dl className="kde-meta">
                <div><dt>Estado</dt><dd>{selected.status}</dd></div>
                <div><dt>Lote</dt><dd>{selected.lotId ?? "Sin dato"}</dd></div>
                <div><dt>Proveedor</dt><dd>{selected.supplierName ?? "Sin dato"}</dd></div>
                <div><dt>Resultado</dt><dd>{selected.initialResult ?? "Sin dato"}</dd></div>
                <div><dt>Especificacion</dt><dd>{selected.specification?.permanentCode ?? "Sin dato"}</dd></div>
              </dl>
              <div className="quality-actions">
                <button type="button" onClick={() => void createDemoInspection()}>Nueva inspeccion</button>
                <button type="button" onClick={() => void releaseSelected()}><CheckCircle2 size={15} /> Decidir</button>
              </div>
              <h4>Semaforo</h4>
              <div className="quality-stoplight">
                <span className={selected.status.includes("aprobado") ? "green" : ""}>Aprobacion</span>
                <span className={selected.status.includes("cuarentena") ? "yellow" : ""}>Cuarentena</span>
                <span className={selected.status.includes("rechazado") || selected.status.includes("bloqueado") ? "red" : ""}>Bloqueo</span>
              </div>
              <h4>Actividad reciente</h4>
              <div className="timeline mini">
                {(dashboard?.recent ?? []).map((item: any, index: number) => <div key={`${item.code}-${index}`}><strong>{item.code}</strong><span>{item.type} · {item.status}</span></div>)}
              </div>
            </>
          ) : <p className="empty-state">Selecciona una inspeccion para decidir liberacion, rechazo o cuarentena.</p>}
        </aside>
      </div>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return <span>{icon}<strong>{value}</strong>{label}</span>;
}

function QualityMiniCard({ item }: { item: QualityRecord }) {
  return (
    <article className="quality-card">
      <header><strong>{item.permanentCode}</strong><FieldStatusBadge status={item.status ?? item.decision ?? "pendiente"} /></header>
      <h3>{item.severity ?? item.decision ?? item.status}</h3>
      <p>{item.description ?? item.actionText ?? item.reason ?? "Registro de calidad trazable."}</p>
    </article>
  );
}
