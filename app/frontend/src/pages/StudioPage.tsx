import { useEffect, useMemo, useState } from "react";
import { Boxes, CheckSquare, GitBranch, Layers3, Play, Plus, RefreshCw, Save, Workflow } from "lucide-react";
import { api } from "../api/client";

const tabs = ["disenador", "simulador", "formularios", "checklists", "instancias", "eventos", "marketplace", "aprendizaje"];

export function StudioPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [palette, setPalette] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [forms, setForms] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [variables, setVariables] = useState<any[]>([]);
  const [simulation, setSimulation] = useState<any>(null);
  const [tab, setTab] = useState("disenador");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [dash, pal, workflowData, formData, checklistData, templateData, instanceData, eventData, variableData] = await Promise.all([
      api.studioDashboard(),
      api.studioPalette(),
      api.listStudioWorkflows({ q }),
      api.listStudioForms(),
      api.listStudioChecklists(),
      api.listStudioTemplates(),
      api.listStudioInstances(),
      api.listStudioEvents(),
      api.listStudioVariables()
    ]);
    setDashboard(dash);
    setPalette(pal.categories);
    setWorkflows(workflowData.workflows);
    setForms(formData.forms);
    setChecklists(checklistData.checklists);
    setTemplates(templateData.templates);
    setInstances(instanceData.instances);
    setEvents(eventData.events);
    setVariables(variableData.variables);
    setSelected(workflowData.workflows[0] ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const version = selected?.versions?.[0];
  const nodes = version?.nodes ?? [];
  const edges = version?.edges ?? [];
  const indicators = dashboard?.indicators ?? {};
  const modules = useMemo(() => Array.from(new Set(workflows.map((item) => item.moduleScope))).filter(Boolean), [workflows]);

  async function createDemoWorkflow() {
    const workflow = await api.createStudioWorkflow({
      name: `Flujo configurable ${Date.now().toString().slice(-4)}`,
      description: "Creado desde el diseñador Studio sin logica hardcodeada.",
      moduleScope: "transversal",
      nodes: [
        { nodeKey: "inicio", nodeType: "inicio", label: "Inicio", positionX: 80, positionY: 120, config: { evento: "manual" } },
        { nodeKey: "captura", nodeType: "formulario", label: "Formulario dinamico", positionX: 290, positionY: 120, config: { form: "configurable" } },
        { nodeKey: "decision", nodeType: "decision", label: "Decision responsable", positionX: 500, positionY: 120, config: { rule: "configurada" } },
        { nodeKey: "fin", nodeType: "fin", label: "Fin", positionX: 710, positionY: 120, config: { audit: true } }
      ],
      edges: [
        { edgeKey: "e1", fromNodeKey: "inicio", toNodeKey: "captura", label: "iniciar", condition: {} },
        { edgeKey: "e2", fromNodeKey: "captura", toNodeKey: "decision", label: "enviar", condition: { required: true } },
        { edgeKey: "e3", fromNodeKey: "decision", toNodeKey: "fin", label: "cerrar", condition: { approved: true } }
      ]
    });
    setSelected(workflow.workflow);
    await load();
  }

  async function simulate() {
    if (!selected || !version) return;
    const result = await api.simulateStudioWorkflow(selected.id, version.id);
    setSimulation(result.simulation);
    setTab("simulador");
  }

  async function publish() {
    if (!selected || !version) return;
    await api.publishStudioWorkflow(selected.id, version.id);
    await load();
  }

  async function startInstance() {
    if (!selected || !version) return;
    await api.createStudioInstance({ workflowDefinitionId: selected.id, workflowVersionId: version.id, entityType: "studio", entityId: selected.id, input: { source: "frontend" } });
    await load();
    setTab("instancias");
  }

  async function syncGraph() {
    await api.syncStudioGraph();
    await load();
  }

  async function search() {
    const data = await api.listStudioWorkflows({ q });
    setWorkflows(data.workflows);
    setSelected(data.workflows[0] ?? null);
  }

  if (loading) return <section className="studio-page"><div className="panel-card">Cargando Formula Lab Studio...</div></section>;

  return (
    <section className="studio-page">
      <div className="studio-hero">
        <div>
          <p className="eyebrow">Formula Lab Studio</p>
          <h2>Visual Workflow Engine + BPM</h2>
          <p>Diseña procesos transversales con nodos, formularios, checklists, eventos, permisos y ejecuciones trazables.</p>
        </div>
        <div className="studio-actions">
          <div className="search-box">
            <Workflow size={16} />
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar workflow, modulo o codigo" />
          </div>
          <button onClick={search}>Buscar</button>
          <button onClick={createDemoWorkflow}><Plus size={16} /> Nuevo</button>
          <button onClick={syncGraph}><RefreshCw size={16} /> Grafo</button>
        </div>
      </div>

      <div className="studio-kpis">
        <Kpi icon={<Workflow size={18} />} label="Workflows" value={indicators.workflows ?? 0} />
        <Kpi icon={<Save size={18} />} label="Publicados" value={indicators.published ?? 0} />
        <Kpi icon={<Play size={18} />} label="Instancias" value={indicators.instances ?? 0} />
        <Kpi icon={<Layers3 size={18} />} label="Formularios" value={indicators.forms ?? 0} />
        <Kpi icon={<CheckSquare size={18} />} label="Checklists" value={indicators.checklists ?? 0} />
        <Kpi icon={<GitBranch size={18} />} label="Eventos" value={indicators.events ?? 0} />
      </div>

      <div className="tab-strip">
        {tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      <div className="studio-layout">
        <aside className="studio-list">
          <h3>Workflows</h3>
          <div className="studio-modules">{modules.map((item) => <span key={String(item)}>{String(item)}</span>)}</div>
          {workflows.map((workflow) => (
            <button key={workflow.id} className={selected?.id === workflow.id ? "studio-workflow active" : "studio-workflow"} onClick={() => { setSelected(workflow); setSimulation(null); }}>
              <span>{workflow.permanentCode}</span>
              <strong>{workflow.name}</strong>
              <small>{workflow.moduleScope} · v{workflow.versions?.[0]?.versionNumber ?? 1} · {workflow.status}</small>
            </button>
          ))}
        </aside>

        <main className="studio-main">
          {tab === "disenador" && (
            <div className="studio-designer">
              <aside className="studio-palette">
                <h3>Componentes</h3>
                {palette.map((category) => (
                  <div key={category.name}>
                    <strong>{category.name}</strong>
                    {category.items.map((item: string) => <button key={item} title={`Agregar ${item}`}><Boxes size={14} /> {item}</button>)}
                  </div>
                ))}
              </aside>
              <div className="studio-canvas">
                {edges.map((edge: any, index: number) => <span key={edge.id} className={`studio-edge edge-${index % 3}`}>{edge.label ?? "flujo"}</span>)}
                {nodes.map((node: any) => (
                  <button key={node.id} className={`studio-node ${node.nodeType}`} style={{ left: node.positionX, top: node.positionY }} title={JSON.stringify(node.configJson ?? {})}>
                    <small>{node.nodeType}</small>
                    <strong>{node.label}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "simulador" && (
            <div className="studio-simulator">
              <button onClick={simulate}><Play size={16} /> Ejecutar simulacion</button>
              <button onClick={publish}><Save size={16} /> Publicar version</button>
              <button onClick={startInstance}><Plus size={16} /> Crear instancia</button>
              {simulation ? (
                <div className={simulation.valid ? "simulation-card ok" : "simulation-card warn"}>
                  <h3>{simulation.valid ? "Flujo valido" : "Requiere correccion"}</h3>
                  <p>Tiempo estimado: {simulation.estimatedMinutes} minutos</p>
                  <p>Ruta: {simulation.path?.join(" -> ")}</p>
                  {simulation.errors?.map((item: string) => <small key={item}>{item}</small>)}
                  {simulation.warnings?.map((item: string) => <small key={item}>{item}</small>)}
                </div>
              ) : <p className="empty-state">Ejecuta una simulacion para validar nodos, conexiones y ruta principal.</p>}
            </div>
          )}

          {tab === "formularios" && <CardGrid items={forms} titleKey="name" subtitleKey="permanentCode" meta={(item) => `${item.fields?.length ?? 0} campos`} />}
          {tab === "checklists" && <CardGrid items={checklists} titleKey="name" subtitleKey="permanentCode" meta={(item) => `${item.items?.length ?? 0} puntos`} />}
          {tab === "instancias" && <CardGrid items={instances} titleKey="permanentCode" subtitleKey="status" meta={(item) => item.definition?.name ?? ""} />}
          {tab === "eventos" && <CardGrid items={events} titleKey="permanentCode" subtitleKey="eventType" meta={(item) => item.moduleScope} />}
          {tab === "marketplace" && <CardGrid items={templates} titleKey="name" subtitleKey="permanentCode" meta={(item) => item.templateType} />}
          {tab === "aprendizaje" && (
            <div className="studio-learning">
              <h3>Modo aprendizaje BPM</h3>
              <p><strong>Workflow:</strong> definicion permanente del proceso; sus versiones no se sobrescriben cuando se publican.</p>
              <p><strong>Nodo:</strong> bloque configurable. Puede representar formulario, aprobacion, decision, tarea o evento.</p>
              <p><strong>Instancia:</strong> ejecucion real de una version publicada, con bitacora en workflow_execution_log.</p>
              <p><strong>Regla clave:</strong> Studio no contiene procesos hardcodeados de produccion, compras, laboratorio o ventas; todo via configuracion.</p>
              <p><strong>Variables activas:</strong> {variables.length}</p>
            </div>
          )}
        </main>

        <aside className="studio-side">
          <h3>Vista rapida</h3>
          {selected ? (
            <>
              <p className="eyebrow">{selected.permanentCode}</p>
              <h4>{selected.name}</h4>
              <p>{selected.description}</p>
              <span className={`status-badge ${selected.status}`}>{selected.status}</span>
              <dl className="knowledge-dl">
                <dt>Modulo</dt><dd>{selected.moduleScope}</dd>
                <dt>Version</dt><dd>{version?.versionNumber ?? 1}</dd>
                <dt>Nodos</dt><dd>{nodes.length}</dd>
                <dt>Conexiones</dt><dd>{edges.length}</dd>
              </dl>
              <h4>Instancias recientes</h4>
              {(selected.instances ?? []).map((item: any) => <small key={item.id}>{item.permanentCode} · {item.status}</small>)}
            </>
          ) : <p>Selecciona un workflow para abrir su detalle.</p>}
        </aside>
      </div>
    </section>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <button>{icon}<span>{label}</span><strong>{value}</strong></button>;
}

function CardGrid({ items, titleKey, subtitleKey, meta }: { items: any[]; titleKey: string; subtitleKey: string; meta: (item: any) => string }) {
  return (
    <div className="studio-card-grid">
      {items.map((item) => (
        <article key={item.id} className="studio-card">
          <p className="eyebrow">{item[subtitleKey]}</p>
          <h3>{item[titleKey]}</h3>
          <p>{meta(item)}</p>
        </article>
      ))}
    </div>
  );
}
