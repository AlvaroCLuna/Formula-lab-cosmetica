import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Beaker, CheckCircle2, FileInput, FlaskConical, History, Play, Plus, Save, UploadCloud } from "lucide-react";
import { api } from "../api/client";
import { FieldStatusBadge } from "../components/FieldStatusBadge";
import type { FormulationFamily, FormulationVersion } from "../types";

export function PilotLabPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [formulations, setFormulations] = useState<FormulationFamily[]>([]);
  const [versions, setVersions] = useState<FormulationVersion[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<any>(null);
  const [worksheet, setWorksheet] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [trialForm, setTrialForm] = useState({ pilotProductId: "", formulationId: "", formulationVersionId: "", trialSize: 250, objective: "Prueba piloto de laboratorio no productiva." });
  const [parameter, setParameter] = useState({ parameterType: "proceso", label: "pH", valueNumber: 5.5, unit: "pH", notes: "" });

  async function load() {
    const [dash, productRes, importRes, trialRes, formulationRes] = await Promise.all([
      api.pilotDashboard(),
      api.listPilotProducts(),
      api.listPilotImports(),
      api.listPilotTrials(),
      api.listFormulations()
    ]);
    setDashboard(dash);
    setProducts(productRes.products);
    setImports(importRes.imports);
    setTrials(trialRes.trials);
    setFormulations(formulationRes.formulations);
    setSelectedTrial((current: any) => current ?? trialRes.trials[0] ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!trialForm.formulationId) return;
    api.listVersions(trialForm.formulationId).then((res) => {
      setVersions(res.versions);
      const preferred = res.versions.find((version) => version.status === "aprobada") ?? res.versions[0];
      if (preferred) setTrialForm((current) => ({ ...current, formulationVersionId: preferred.id }));
    }).catch(() => setVersions([]));
  }, [trialForm.formulationId]);

  useEffect(() => {
    if (!selectedTrial) return;
    api.pilotWorksheet(selectedTrial.id).then(setWorksheet).catch(() => setWorksheet(null));
  }, [selectedTrial]);

  const indicators = dashboard?.indicators ?? {};
  const selectedRows = worksheet?.rows ?? [];
  const protections = dashboard?.mode?.protections ?? [];

  async function previewImport() {
    const response = await api.previewPilotImport(files);
    setMessage(`Previsualizacion ${response.batch.permanentCode}: ${response.summary.newRecords} nuevos, ${response.summary.review} en revision, ${response.summary.rejected} rechazados.`);
    setFiles([]);
    await load();
  }

  async function createTrial() {
    if (!trialForm.formulationVersionId) {
      setMessage("Selecciona una version de formulacion para crear la prueba.");
      return;
    }
    const response = await api.createPilotTrial({ pilotProductId: trialForm.pilotProductId || null, formulationVersionId: trialForm.formulationVersionId, trialSize: trialForm.trialSize, unit: "g", objective: trialForm.objective });
    setSelectedTrial(response.trial);
    setMessage(`Prueba creada: ${response.trial.permanentCode}`);
    await load();
  }

  async function saveParameter() {
    if (!selectedTrial) return;
    await api.recordPilotParameter(selectedTrial.id, parameter);
    setMessage("Parametro registrado con trazabilidad.");
    const sheet = await api.pilotWorksheet(selectedTrial.id);
    setWorksheet(sheet);
    await load();
  }

  async function finishTrial(result: string) {
    if (!selectedTrial) return;
    await api.finishPilotTrial(selectedTrial.id, { result, whatWorked: "Pendiente de conclusion tecnica documentada.", whatFailed: "Sin informacion suficiente hasta revision.", suggestedChanges: "No se crea version aprobada automaticamente.", observations: "Resultado capturado en modo piloto." });
    setMessage("Resultado registrado. La formulacion no fue aprobada automaticamente.");
    await load();
  }

  async function createExperimental() {
    if (!selectedTrial) return;
    const response = await api.createPilotExperimentalVersion(selectedTrial.id, { changeSummary: "Preparar version experimental desde hallazgos de prueba piloto; requiere edicion y aprobacion posterior." });
    setMessage(`Version experimental preparada: ${response.experimentalVersion.permanentCode}`);
    await load();
  }

  const selectedVersion = useMemo(() => versions.find((version) => version.id === trialForm.formulationVersionId), [versions, trialForm.formulationVersionId]);

  return (
    <div className="pilot-page">
      <section className="pilot-hero">
        <div>
          <p className="eyebrow">Datos reales controlados</p>
          <h2>Laboratorio Piloto</h2>
          <p>Importa datos reales, prepara pruebas de laboratorio y documenta resultados sin activar operaciones comerciales ni movimientos productivos irreversibles.</p>
        </div>
        <div className="pilot-protections">
          {protections.map((item: string) => <span key={item}><AlertTriangle size={14} />{item}</span>)}
        </div>
      </section>

      <div className="pilot-kpis">
        <Metric label="Productos piloto" value={indicators.products ?? 0} />
        <Metric label="Importaciones" value={indicators.imports ?? 0} />
        <Metric label="Pruebas" value={indicators.trials ?? 0} />
        <Metric label="Pendientes" value={indicators.pendingTrials ?? 0} />
        <Metric label="Experimentales" value={indicators.experimental ?? 0} />
        <Metric label="Documentos" value={indicators.documents ?? 0} />
      </div>

      {message ? <p className="module-warning">{message}</p> : null}

      <div className="pilot-grid">
        <section className="pilot-panel">
          <header><FileInput /><h3>Importacion de datos reales</h3></header>
          <label className="pilot-dropzone">
            <UploadCloud size={28} />
            <strong>XLSX, CSV, PDF o TXT</strong>
            <span>Vista previa antes de importar. Nunca borra datos existentes.</span>
            <input multiple type="file" accept=".xlsx,.csv,.pdf,.txt" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
          </label>
          <div className="chip-row">{files.map((file) => <span key={file.name}>{file.name}</span>)}</div>
          <button className="primary-action" onClick={() => void previewImport()} disabled={files.length === 0}><UploadCloud size={16} /> Previsualizar</button>
          <div className="pilot-list compact">
            {imports.slice(0, 5).map((item) => (
              <article key={item.id}>
                <strong>{item.permanentCode}</strong>
                <FieldStatusBadge status={item.status} />
                <p>{item.sourceName}</p>
                <small>{item.summaryJson?.newRecords ?? 0} nuevos · {item.summaryJson?.duplicates ?? 0} duplicados · {item.summaryJson?.conflicts ?? 0} conflictos</small>
              </article>
            ))}
          </div>
        </section>

        <section className="pilot-panel">
          <header><Plus /><h3>Nueva prueba</h3></header>
          <div className="pilot-form">
            <select value={trialForm.pilotProductId} onChange={(event) => setTrialForm({ ...trialForm, pilotProductId: event.target.value })}>
              <option value="">Producto piloto opcional</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <select value={trialForm.formulationId} onChange={(event) => setTrialForm({ ...trialForm, formulationId: event.target.value })}>
              <option value="">Seleccionar formulacion</option>
              {formulations.map((formulation) => <option key={formulation.id} value={formulation.id}>{formulation.permanentCode} · {formulation.name}</option>)}
            </select>
            <select value={trialForm.formulationVersionId} onChange={(event) => setTrialForm({ ...trialForm, formulationVersionId: event.target.value })}>
              <option value="">Version</option>
              {versions.map((version) => <option key={version.id} value={version.id}>v{version.versionNumber} · {version.status}</option>)}
            </select>
            <select value={trialForm.trialSize} onChange={(event) => setTrialForm({ ...trialForm, trialSize: Number(event.target.value) })}>
              {[100, 250, 500, 1000].map((size) => <option key={size} value={size}>{size >= 1000 ? `${size / 1000} kg` : `${size} g`}</option>)}
            </select>
            <textarea value={trialForm.objective} onChange={(event) => setTrialForm({ ...trialForm, objective: event.target.value })} />
          </div>
          <button className="primary-action" onClick={() => void createTrial()}><Play size={16} /> Crear prueba piloto</button>
          {selectedVersion ? <p className="learning-note">Modo aprendizaje: se usara v{selectedVersion.versionNumber}; ningun resultado aprueba ni libera la formula automaticamente.</p> : null}
        </section>
      </div>

      <div className="pilot-lab-layout">
        <main className="pilot-panel">
          <header><FlaskConical /><h3>Hoja de trabajo guiada</h3></header>
          <div className="pilot-list trials">
            {trials.map((trial) => (
              <button key={trial.id} className={selectedTrial?.id === trial.id ? "selected" : ""} onClick={() => setSelectedTrial(trial)}>
                <strong>{trial.permanentCode}</strong>
                <span>{trial.formulationVersion?.name ?? "Sin formulacion"} · {trial.trialSize} {trial.unit}</span>
                <FieldStatusBadge status={trial.result} />
              </button>
            ))}
          </div>
          <div className="worksheet">
            {selectedRows.map((row: any) => (
              <article key={row.id}>
                <span>{row.phase}</span>
                <strong>{row.ingredient}</strong>
                <small>{row.function} · {row.inci ?? "INCI sin documentar"}</small>
                <b>{row.percentage}%</b>
                <em>{row.grams} g</em>
              </article>
            ))}
          </div>
        </main>

        <aside className="pilot-panel side">
          <header><Beaker /><h3>Registro de prueba</h3></header>
          {selectedTrial ? (
            <>
              <dl className="kde-meta">
                <div><dt>Codigo</dt><dd>{selectedTrial.permanentCode}</dd></div>
                <div><dt>Estado</dt><dd>{selectedTrial.status}</dd></div>
                <div><dt>Resultado</dt><dd>{selectedTrial.result}</dd></div>
                <div><dt>Proyecto LAB</dt><dd>{selectedTrial.labProjectId ? "Generado" : "Pendiente"}</dd></div>
              </dl>
              <div className="pilot-form">
                <select value={parameter.parameterType} onChange={(event) => setParameter({ ...parameter, parameterType: event.target.value })}>
                  <option value="proceso">Proceso</option>
                  <option value="sensorial">Sensorial</option>
                  <option value="incidencia">Incidencia</option>
                </select>
                <input value={parameter.label} onChange={(event) => setParameter({ ...parameter, label: event.target.value })} placeholder="Parametro" />
                <input type="number" value={parameter.valueNumber} onChange={(event) => setParameter({ ...parameter, valueNumber: Number(event.target.value) })} />
                <input value={parameter.unit} onChange={(event) => setParameter({ ...parameter, unit: event.target.value })} placeholder="Unidad" />
                <textarea value={parameter.notes} onChange={(event) => setParameter({ ...parameter, notes: event.target.value })} placeholder="Observaciones, apariencia, color, olor, textura o incidencias" />
              </div>
              <button className="secondary-action" onClick={() => void saveParameter()}><Save size={16} /> Guardar parametro</button>
              <div className="pilot-actions">
                <button onClick={() => void finishTrial("satisfactorio")}><CheckCircle2 size={15} /> Satisfactorio</button>
                <button onClick={() => void finishTrial("requiere_ajuste")}><AlertTriangle size={15} /> Requiere ajuste</button>
                <button onClick={() => void createExperimental()}><History size={15} /> Version experimental</button>
              </div>
              <div className="timeline mini">
                {(worksheet?.trial?.parameters ?? []).map((item: any) => <div key={item.id}><strong>{item.label}</strong><span>{item.valueNumber ?? item.valueText} {item.unit ?? ""}</span></div>)}
              </div>
            </>
          ) : <p className="empty-state">Crea o selecciona una prueba para registrar parametros reales.</p>}
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <span><strong>{value}</strong>{label}</span>;
}
