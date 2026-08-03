import { type ReactNode, useEffect, useState } from "react";
import { AlertTriangle, Bot, BrainCircuit, CheckCircle2, FileSearch, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "../api/client";
import { FieldStatusBadge } from "../components/FieldStatusBadge";

type Tab = "consulta" | "reglas" | "alertas" | "respuestas" | "aprendizaje" | "fuentes";

export function AiPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [learning, setLearning] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("consulta");
  const [question, setQuestion] = useState("En que formulaciones se usa SCI");
  const [message, setMessage] = useState("");

  async function load() {
    const [dash, ruleRes, alertRes, queryRes, responseRes, learningRes, sourceRes] = await Promise.all([
      api.aiDashboard(),
      api.listAiRules(),
      api.listAiAlerts(),
      api.listAiQueries(),
      api.listAiResponses(),
      api.listLearningEvents(),
      api.listAiSources()
    ]);
    setDashboard(dash);
    setRules(ruleRes.rules);
    setAlerts(alertRes.alerts);
    setQueries(queryRes.queries);
    setResponses(responseRes.responses);
    setLearning(learningRes.events);
    setSources(sourceRes.sources);
    setSelected((current: any) => current ?? responseRes.responses[0] ?? alertRes.alerts[0] ?? ruleRes.rules[0] ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function ask() {
    const result = await api.askAi({ queryText: question, moduleScope: "transversal" });
    setSelected(result.response);
    setMessage(`Consulta registrada: ${result.query.permanentCode}`);
    await load();
  }

  async function evaluateDemo() {
    const result = await api.evaluateAiRules({ entityType: "raw_material_lot", entityId: "lot-demo-01", data: { availableQuantity: 4, status: "cuarentena", evidenceDocumentId: null, totalPercentage: 98 } });
    setMessage(`Evaluacion ejecutada: ${result.results.length} reglas revisadas`);
    await load();
  }

  async function learnDemo() {
    const response = await api.createLearningEvent({ context: "rechazo_sugerencia", inputJson: { pregunta: question }, proposedOutputJson: { respuesta: selected?.answer ?? "sin respuesta" }, correctionJson: { correccion: "Requiere fuente tecnica validada." }, entityType: "ai_response", entityId: selected?.id, modelOrRule: selected?.permanentCode });
    setMessage(`Evento de aprendizaje: ${response.event.permanentCode}`);
    await load();
  }

  return (
    <div className="ai-page">
      <section className="ai-hero">
        <div>
          <p className="eyebrow">IA Responsable</p>
          <h2>Consulta, reglas y alertas con evidencia visible</h2>
          <p>La IA organiza y relaciona datos registrados. No aprueba, no sustituye decisiones humanas y no responde tecnicamente sin fuente.</p>
        </div>
        <div className="ai-kpis">
          <Metric icon={<ShieldCheck />} value={dashboard?.indicators?.activeRules ?? 0} label="Reglas activas" />
          <Metric icon={<AlertTriangle />} value={dashboard?.indicators?.openAlerts ?? 0} label="Alertas abiertas" />
          <Metric icon={<MessageSquare />} value={dashboard?.indicators?.queries ?? 0} label="Consultas" />
          <Metric icon={<BrainCircuit />} value={dashboard?.indicators?.learningEvents ?? 0} label="Correcciones" />
          <Metric icon={<FileSearch />} value={dashboard?.indicators?.unindexedDocs ?? 0} label="Docs sin indexar" />
          <Metric icon={<Sparkles />} value={dashboard?.indicators?.lowConfidenceResponses ?? 0} label="Baja confianza" />
        </div>
      </section>

      <nav className="quality-tabs">
        {(["consulta", "reglas", "alertas", "respuestas", "aprendizaje", "fuentes"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </nav>

      {message ? <p className="module-warning">{message}</p> : null}

      <div className="ai-layout">
        <main className="ai-main">
          {tab === "consulta" ? (
            <section className="ai-console">
              <label>
                Consulta interna
                <textarea value={question} onChange={(event) => setQuestion(event.target.value)} />
              </label>
              <div className="quality-actions">
                <button type="button" onClick={() => void ask()}><Bot size={15} /> Consultar con evidencia</button>
                <button type="button" onClick={() => void evaluateDemo()}><ShieldCheck size={15} /> Evaluar reglas demo</button>
                <button type="button" onClick={() => void learnDemo()}><BrainCircuit size={15} /> Registrar correccion</button>
              </div>
              <p className="empty-state">Las respuestas se guardan como no validadas y separan dato documental, alerta, sugerencia o informacion insuficiente.</p>
            </section>
          ) : null}
          {tab === "reglas" ? rules.map((item) => <AiCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelected(item)} />) : null}
          {tab === "alertas" ? alerts.map((item) => <AiCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelected(item)} />) : null}
          {tab === "respuestas" ? responses.map((item) => <AiCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelected(item)} />) : null}
          {tab === "aprendizaje" ? learning.map((item) => <AiCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelected(item)} />) : null}
          {tab === "fuentes" ? sources.map((item) => <AiCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelected(item)} />) : null}
        </main>

        <aside className="quality-side">
          <div className="side-header">
            <div>
              <p className="eyebrow">Panel de evidencia</p>
              <h3>{selected?.permanentCode ?? "Sin seleccion"}</h3>
            </div>
            <Bot size={24} />
          </div>
          {selected ? (
            <>
              <dl className="kde-meta">
                <div><dt>Tipo de salida</dt><dd>{selected.outputType ?? selected.ruleType ?? selected.sourceType ?? "registro"}</dd></div>
                <div><dt>Estado</dt><dd>{selected.validationStatus ?? selected.status ?? "no_validada"}</dd></div>
                <div><dt>Severidad</dt><dd>{selected.severity ?? "informativa"}</dd></div>
                <div><dt>Confianza</dt><dd>{selected.confidence ? `${Math.round(Number(selected.confidence) * 100)}%` : "Sin dato"}</dd></div>
                <div><dt>Documento</dt><dd>{selected.document?.originalName ?? selected.evidenceDocument?.originalFilename ?? selected.documentId ?? "Sin documento"}</dd></div>
              </dl>
              <h4>Respuesta / alerta</h4>
              <p className="ai-answer">{selected.answer ?? selected.detected ?? selected.resultMessage ?? selected.description ?? "Registro de inteligencia responsable."}</p>
              <h4>Fuentes</h4>
              <div className="purchase-lines">
                {(selected.sourcesJson ?? selected.fragmentsJson ?? []).slice(0, 5).map((row: any, index: number) => <span key={`${row.id ?? row.documentId ?? index}`}><strong>{row.title ?? row.reference ?? row.type}</strong>{row.validationStatus ?? row.text ?? "Fuente registrada"}</span>)}
              </div>
              <h4>Advertencias</h4>
              <div className="chip-row">{(selected.warningsJson ?? ["Validacion humana requerida"]).map((warning: string) => <span key={warning}>{warning}</span>)}</div>
            </>
          ) : <p className="empty-state">Selecciona una regla, alerta, respuesta o fuente.</p>}
        </aside>
      </div>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return <span>{icon}<strong>{value}</strong>{label}</span>;
}

function AiCard({ item, selected, onSelect }: { item: any; selected: boolean; onSelect: () => void }) {
  const title = item.name ?? item.answer ?? item.detected ?? item.context ?? item.sourceType ?? item.queryText;
  return (
    <article className={selected ? "quality-card selected" : "quality-card"} onClick={onSelect}>
      <header><strong>{item.permanentCode}</strong><FieldStatusBadge status={item.validationStatus ?? item.status ?? item.severity ?? "registro"} /></header>
      <h3>{title}</h3>
      <p>{item.description ?? item.explanation ?? item.source ?? item.reviewStatus ?? "Evidencia y trazabilidad disponibles."}</p>
      <div className="chip-row"><span>{item.outputType ?? item.ruleType ?? item.sourceType ?? "dato"}</span><span>{item.confidence ? `${Math.round(Number(item.confidence) * 100)}% confianza` : "confianza s/d"}</span></div>
    </article>
  );
}
