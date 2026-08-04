import { useEffect, useMemo, useState } from "react";
import { Activity, Box, GitBranch, Link2, Network, RefreshCw, Search, ShieldCheck, Split, Timer } from "lucide-react";
import { api } from "../api/client";

const tabs = ["grafo", "gemelo", "timeline", "arbol", "tabla", "tarjetas", "aprendizaje"];

export function DigitalTwinPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [graph, setGraph] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [twin, setTwin] = useState<any>(null);
  const [types, setTypes] = useState<any>({ entityTypes: [], relationTypes: [] });
  const [selected, setSelected] = useState<any>(null);
  const [q, setQ] = useState("");
  const [module, setModule] = useState("");
  const [tab, setTab] = useState("grafo");
  const [loading, setLoading] = useState(true);

  async function load(entityId?: string) {
    setLoading(true);
    const [dashboardData, typesData, entitiesData, graphData] = await Promise.all([
      api.graphDashboard(),
      api.listGraphTypes(),
      api.searchGraph({ q, module }),
      api.getGraph(entityId, 2)
    ]);
    setDashboard(dashboardData);
    setTypes(typesData);
    setEntities(entitiesData.entities);
    setGraph(graphData);
    const focus = entityId ? entitiesData.entities.find((entity) => entity.id === entityId) : entitiesData.entities[0];
    if (focus) {
      const twinData = await api.getTwin(focus.id);
      setTwin(twinData);
      setSelected(focus);
    }
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const indicators = dashboard?.indicators ?? {};
  const modules = useMemo(() => Array.from(new Set(entities.map((entity) => entity.module))).filter(Boolean), [entities]);

  async function sync() {
    await api.syncGraph();
    await load(selected?.id);
  }

  async function openTwin(entity: any) {
    setSelected(entity);
    const [twinData, graphData] = await Promise.all([api.getTwin(entity.id), api.getGraph(entity.id, 2)]);
    setTwin(twinData);
    setGraph(graphData);
    setTab("gemelo");
  }

  async function search() {
    await load(selected?.id);
  }

  if (loading) return <section className="twin-page"><div className="panel-card">Construyendo gemelo digital...</div></section>;

  return (
    <section className="twin-page">
      <div className="twin-hero">
        <div>
          <p className="eyebrow">DTW + Knowledge Graph</p>
          <h2>Gemelo vivo de Formula Lab</h2>
          <p>Navega cualquier materia prima, documento, lote, orden, cliente o alerta desde un solo mapa trazable.</p>
        </div>
        <div className="twin-search">
          <div className="search-box">
            <Search size={16} />
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar SCI, lote, cliente, pedido..." />
          </div>
          <select value={module} onChange={(event) => setModule(event.target.value)} aria-label="Modulo del grafo">
            <option value="">Todos</option>
            {modules.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button onClick={search}><Search size={16} /> Buscar</button>
          <button onClick={sync}><RefreshCw size={16} /> Sincronizar</button>
        </div>
      </div>

      <div className="twin-kpis">
        <button><Box size={18} /><span>Entidades</span><strong>{indicators.entities ?? 0}</strong></button>
        <button><Link2 size={18} /><span>Relaciones</span><strong>{indicators.relations ?? 0}</strong></button>
        <button><Split size={18} /><span>Nodos huerfanos</span><strong>{indicators.orphanNodes ?? 0}</strong></button>
        <button><ShieldCheck size={18} /><span>Lotes sin COA</span><strong>{indicators.lotsWithoutCoa ?? 0}</strong></button>
        <button><Activity size={18} /><span>Relaciones nuevas</span><strong>{indicators.newRelations ?? 0}</strong></button>
      </div>

      <div className="tab-strip">
        {tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      <div className="twin-layout">
        <aside className="twin-entities">
          <h3>Buscador universal</h3>
          {entities.slice(0, 24).map((entity) => (
            <button key={entity.id} className={selected?.id === entity.id ? "entity-pill active" : "entity-pill"} onClick={() => openTwin(entity)}>
              <span>{entity.permanentCode}</span>
              <strong>{entity.title}</strong>
              <small>{entity.sourceEntityType} · {entity.module}</small>
            </button>
          ))}
        </aside>

        <main className="twin-main">
          {tab === "grafo" && (
            <div className="graph-canvas">
              {graph.nodes.slice(0, 36).map((node, index) => (
                <button
                  key={node.id}
                  className={`graph-node node-${index % 6}`}
                  style={{ left: `${8 + (index % 6) * 15}%`, top: `${12 + Math.floor(index / 6) * 14}%` }}
                  onClick={() => openTwin(node)}
                  title={node.title}
                >
                  <Network size={15} />
                  <span>{node.title}</span>
                </button>
              ))}
              <div className="graph-legend">
                <strong>Mapa de relaciones</strong>
                <small>{graph.edges.length} enlaces activos · navegación bidireccional cuando aplica</small>
              </div>
            </div>
          )}

          {tab === "gemelo" && twin && (
            <div className="twin-360">
              <div className="twin-card-primary">
                <p className="eyebrow">{twin.entity.permanentCode}</p>
                <h3>{twin.entity.title}</h3>
                <p>{twin.entity.summary ?? "Gemelo sincronizado desde datos operativos existentes."}</p>
                <div className="twin-status">{twin.entity.sourceEntityType} · {twin.entity.status}</div>
              </div>
              <div className="twin-section-grid">
                <TwinSection title="Documentos" value={graph.edges.filter((edge) => edge.type === "documenta").length} />
                <TwinSection title="Relaciones" value={twin.graph.edges.length} />
                <TwinSection title="Alertas IA" value={twin.alerts.length} />
                <TwinSection title="Auditoria" value={twin.audit.length} />
              </div>
              <div className="panel-card">
                <h3>Relaciones directas</h3>
                {twin.graph.edges.slice(0, 10).map((edge: any) => <button key={edge.id} className="list-row"><span>{edge.label}</span><small>{edge.evidence}</small></button>)}
              </div>
            </div>
          )}

          {tab === "timeline" && (
            <div className="timeline-universal">
              {(twin?.entity?.timeline ?? []).map((item: any) => (
                <div key={item.id} className="timeline-item">
                  <Timer size={16} />
                  <div>
                    <strong>{item.action}</strong>
                    <p>{item.module} · {item.result}</p>
                    <small>{new Date(item.eventAt).toLocaleString("es-MX")}</small>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "arbol" && (
            <div className="tree-view">
              <h3>{selected?.title ?? "Entidad"}</h3>
              {graph.edges.slice(0, 18).map((edge) => <div key={edge.id} className="tree-row">└─ {edge.label} · {edge.code}</div>)}
            </div>
          )}

          {tab === "tabla" && graph.edges.map((edge) => (
            <button key={edge.id} className="wide-card"><GitBranch size={18} /><span>{edge.code}</span><strong>{edge.label}</strong><small>{edge.status}</small></button>
          ))}

          {tab === "tarjetas" && graph.nodes.slice(0, 18).map((node) => (
            <button key={node.id} className="knowledge-card" onClick={() => openTwin(node)}>
              <p className="eyebrow">{node.permanentCode}</p>
              <h3>{node.title}</h3>
              <p>{node.sourceEntityType} · {node.module}</p>
            </button>
          ))}

          {tab === "aprendizaje" && (
            <div className="learning-panel">
              <h3>Modo aprendizaje del grafo</h3>
              <p><strong>Gemelo digital:</strong> representacion navegable de una entidad real del ERP; no duplica el dato operativo.</p>
              <p><strong>Relacion:</strong> enlace tipificado con direccion, peso, estado y evidencia obligatoria.</p>
              <p><strong>Timeline universal:</strong> eventos cronologicos con usuario, modulo, accion, objeto, resultado y evidencia.</p>
              <p><strong>IA sobre grafo:</strong> las respuestas futuras deben consultar relaciones, no solo texto.</p>
            </div>
          )}
        </main>

        <aside className="twin-side">
          <h3>Vista 360</h3>
          {twin ? (
            <>
              <p className="eyebrow">{twin.entity.entityType?.name}</p>
              <h4>{twin.entity.title}</h4>
              <div className="side-metrics">
                {twin.entity.metrics?.map((metric: any) => <span key={metric.id}>{metric.label}: {metric.valueJson?.value ?? 0}</span>)}
              </div>
              <h4>Snapshots</h4>
              {twin.entity.snapshots?.slice(0, 4).map((snapshot: any) => <small key={snapshot.id}>{snapshot.permanentCode} · {snapshot.snapshotType}</small>)}
              <h4>Tipos disponibles</h4>
              <small>{types.entityTypes.length} tipos · {types.relationTypes.length} relaciones</small>
            </>
          ) : (
            <p>Selecciona una entidad para abrir su gemelo.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

function TwinSection({ title, value }: { title: string; value: number }) {
  return (
    <div className="twin-section">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}
