import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Beaker, CalendarDays, CheckCircle2, ClipboardCheck, FlaskConical, Microscope, Plus, ShieldCheck, TimerReset } from "lucide-react";
import { api } from "../api/client";
import type { LabProject, LabSample, LabTest } from "../types";
import { FieldStatusBadge } from "../components/FieldStatusBadge";

export function LimsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [projects, setProjects] = useState<LabProject[]>([]);
  const [samples, setSamples] = useState<LabSample[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [stability, setStability] = useState<any[]>([]);
  const [nonConformities, setNonConformities] = useState<any[]>([]);
  const [selectedSample, setSelectedSample] = useState<LabSample | null>(null);
  const [tab, setTab] = useState<"proyectos" | "muestras" | "ensayos" | "estabilidad" | "aprendizaje">("proyectos");
  const [message, setMessage] = useState("");

  async function load() {
    const [dash, projectRes, sampleRes, testRes, methodRes, instrumentRes, stabilityRes, ncfRes] = await Promise.all([
      api.limsDashboard(),
      api.listLabProjects(),
      api.listLabSamples(),
      api.listLabTests(),
      api.listLabMethods(),
      api.listLabInstruments(),
      api.listStabilityStudies(),
      api.listLabNonConformities()
    ]);
    setDashboard(dash.indicators);
    setProjects(projectRes.projects);
    setSamples(sampleRes.samples);
    setTests(testRes.tests);
    setMethods(methodRes.methods);
    setInstruments(instrumentRes.instruments);
    setStability(stabilityRes.studies);
    setNonConformities(ncfRes.nonConformities);
    setSelectedSample((current) => current ?? sampleRes.samples[0] ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedTests = useMemo(() => tests.filter((test) => test.sampleId === selectedSample?.id), [tests, selectedSample]);

  async function createDemoTest() {
    if (!selectedSample || methods.length === 0) return;
    const method = methods.find((item) => item.name === "pH") ?? methods[0];
    const instrument = instruments.find((item) => item.instrumentType === "pH-metro") ?? instruments[0];
    const response = await api.createLabTest({
      sampleId: selectedSample.id,
      methodId: method.id,
      testType: method.name,
      unit: method.unit,
      specification: method.acceptanceCriteria,
      numericResult: 5.7,
      instrumentId: instrument?.id,
      observations: "Captura guiada desde LIMS."
    });
    setMessage(`Ensayo creado: ${response.test.permanentCode}`);
    await load();
  }

  async function releaseSelected() {
    if (!selectedSample) return;
    const usable = selectedTests.filter((test) => !["pendiente", "invalidado"].includes(test.status)).slice(0, 2);
    if (usable.length === 0) {
      setMessage("La muestra requiere ensayos completados para liberarse.");
      return;
    }
    const response = await api.releaseLabSample(selectedSample.id, {
      decision: "aprobada_con_observaciones",
      conclusion: "Liberacion demo basada en resultados seleccionados. No se generan conclusiones automaticas.",
      digitalConfirmation: "confirmacion-ui",
      testIds: usable.map((test) => test.id),
      documentIds: []
    });
    setMessage(`Liberacion registrada: ${response.release.decision}`);
    await load();
  }

  return (
    <div className="lims-page">
      <section className="lims-hero">
        <div>
          <p className="eyebrow">Laboratory Information Management System</p>
          <h2>Laboratorio trazable</h2>
          <p>Gestiona proyectos, muestras, ensayos, estabilidad, evidencias KDE y liberacion tecnica sin inventar conclusiones.</p>
        </div>
        <div className="lims-kpis">
          <Metric icon={<FlaskConical />} label="Proyectos activos" value={dashboard?.activeProjects ?? 0} />
          <Metric icon={<Beaker />} label="Muestras evaluacion" value={dashboard?.samplesInEvaluation ?? 0} />
          <Metric icon={<TimerReset />} label="Ensayos pendientes" value={dashboard?.pendingTests ?? 0} />
          <Metric icon={<AlertTriangle />} label="No conformes" value={dashboard?.nonConformingResults ?? 0} />
          <Metric icon={<CalendarDays />} label="Estabilidad activa" value={dashboard?.activeStabilityStudies ?? 0} />
          <Metric icon={<ShieldCheck />} label="Calibracion proxima" value={dashboard?.instrumentsCalibrationSoon ?? 0} />
        </div>
      </section>

      <nav className="lims-tabs">
        {["proyectos", "muestras", "ensayos", "estabilidad", "aprendizaje"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item as typeof tab)}>{item}</button>)}
      </nav>

      {message ? <p className="module-warning">{message}</p> : null}

      <div className="lims-layout">
        <main className="lims-main">
          {tab === "proyectos" ? projects.map((project) => (
            <article className="lims-card" key={project.id}>
              <header><strong>{project.permanentCode}</strong><FieldStatusBadge status={project.status} /></header>
              <h3>{project.name}</h3>
              <p>{project.objective}</p>
              <div className="chip-row"><span>{project.projectType}</span><span>{project.priority}</span><span>{project.samples?.length ?? 0} muestras</span></div>
            </article>
          )) : null}

          {tab === "muestras" ? samples.map((sample) => (
            <article className={selectedSample?.id === sample.id ? "lims-card selected" : "lims-card"} key={sample.id} onClick={() => setSelectedSample(sample)}>
              <header><strong>{sample.permanentCode}</strong><FieldStatusBadge status={sample.status} /></header>
              <h3>{sample.pilotLotCode ?? "Muestra sin lote piloto"}</h3>
              <p>{sample.quantity} {sample.unit} · {sample.location ?? "Sin ubicacion"} · {sample.storageConditions ?? "Sin condiciones"}</p>
              <div className="chip-row"><span>{sample.tests?.length ?? 0} ensayos</span><span>{sample.released ? "Liberada" : "Sin liberar"}</span></div>
            </article>
          )) : null}

          {tab === "ensayos" ? tests.map((test) => (
            <article className="lims-card" key={test.id}>
              <header><strong>{test.permanentCode}</strong><FieldStatusBadge status={test.conformityStatus} /></header>
              <h3>{test.testType}</h3>
              <p>{test.method?.name} · {test.instrument?.name ?? "Sin instrumento"} · {test.specification ?? "Sin especificacion"}</p>
              <div className="chip-row"><span>{test.numericResult ?? test.qualitativeResult ?? "Pendiente"}</span><span>{test.status}</span></div>
            </article>
          )) : null}

          {tab === "estabilidad" ? stability.map((study) => (
            <article className="lims-card" key={study.id}>
              <header><strong>{study.permanentCode}</strong><FieldStatusBadge status={study.status} /></header>
              <h3>{study.conditionName}</h3>
              <p>{study.temperature ?? "-"} C · {study.humidity ?? "-"} % HR · {study.packaging}</p>
              <div className="chip-row"><span>{study.durationDays} dias</span><span>{study.points?.length ?? 0} puntos</span></div>
            </article>
          )) : null}

          {tab === "aprendizaje" ? (
            <section className="lims-learning">
              <h3>Modo aprendizaje</h3>
              <p>Un proyecto agrupa el objetivo tecnico; la muestra es la unidad fisica evaluada; el ensayo registra metodo, instrumento, resultado y evidencia KDE.</p>
              <p>La liberacion tecnica congela los resultados usados. Cualquier cambio posterior requiere una revision documentada.</p>
              <p>Si no existe regla validada, el sistema no concluye automaticamente: conserva el resultado y marca revision humana.</p>
            </section>
          ) : null}
        </main>

        <aside className="lims-side">
          <div className="side-header">
            <div>
              <p className="eyebrow">Ficha de muestra</p>
              <h3>{selectedSample?.permanentCode ?? "Sin seleccion"}</h3>
            </div>
            <ClipboardCheck size={24} />
          </div>
          {selectedSample ? (
            <>
              <dl className="kde-meta">
                <div><dt>Lote piloto</dt><dd>{selectedSample.pilotLotCode ?? "Sin dato"}</dd></div>
                <div><dt>Estado</dt><dd>{selectedSample.status}</dd></div>
                <div><dt>Cantidad</dt><dd>{selectedSample.quantity} {selectedSample.unit}</dd></div>
                <div><dt>Ubicacion</dt><dd>{selectedSample.location ?? "Sin dato"}</dd></div>
                <div><dt>Liberada</dt><dd>{selectedSample.released ? "Si" : "No"}</dd></div>
              </dl>
              <div className="lims-actions">
                <button type="button" onClick={() => void createDemoTest()}><Plus size={15} /> Ensayo guiado</button>
                <button type="button" onClick={() => void releaseSelected()}><CheckCircle2 size={15} /> Liberar</button>
              </div>
              <h4>Timeline</h4>
              <div className="timeline mini">
                {(selectedSample.timelineEvents ?? dashboard?.recent ?? []).slice(0, 6).map((event: any) => <div key={event.id}><strong>{event.title}</strong><span>{event.eventType}</span></div>)}
              </div>
              <h4>No conformidades</h4>
              <div className="timeline mini">
                {nonConformities.slice(0, 3).map((item) => <div key={item.id}><strong>{item.permanentCode}</strong><span>{item.status}</span></div>)}
              </div>
            </>
          ) : <p className="empty-state">Selecciona una muestra para ver resultados, evidencias y liberacion.</p>}
        </aside>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <span>{icon}<strong>{value}</strong>{label}</span>;
}
