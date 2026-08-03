import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Download, FileBarChart, Gauge, Layers, RefreshCw } from "lucide-react";
import { api } from "../api/client";

const modules = ["general", "formulaciones", "materias", "inventario", "produccion", "calidad", "compras", "ventas", "ia"];

const labels: Record<string, string> = {
  formulations: "Formulaciones",
  approvedFormulations: "Versiones aprobadas",
  rawMaterials: "Materias primas",
  documentsPending: "Docs pendientes",
  inventoryValue: "Valor inventario",
  expiringSoon: "Por caducar",
  activeProduction: "Produccion activa",
  avgYield: "Rendimiento prom.",
  openNonConformities: "NC abiertas",
  overdueCapa: "CAPA vencidas",
  openPurchases: "Compras abiertas",
  activeOrders: "Pedidos activos",
  pipelineValue: "Pipeline",
  estimatedSales: "Ventas estimadas",
  criticalAiAlerts: "Alertas IA criticas"
};

const moduleEntities: Record<string, string> = {
  general: "sales",
  formulaciones: "formulations",
  materias: "raw_materials",
  inventario: "inventory",
  produccion: "production",
  calidad: "quality",
  compras: "purchases",
  ventas: "sales",
  ia: "ai"
};

function money(value: unknown) {
  return `$${Number(value ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN`;
}

export function BiPage() {
  const [module, setModule] = useState("general");
  const [activeTab, setActiveTab] = useState("ejecutivo");
  const [loading, setLoading] = useState(true);
  const [executive, setExecutive] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [exportsList, setExportsList] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  async function load() {
    setLoading(true);
    const [executiveData, dashboardData, reportsData, snapshotsData, alertsData, exportsData, schedulesData] = await Promise.all([
      api.biExecutive(),
      api.listBiDashboards(module === "general" ? undefined : module),
      api.listBiReports(),
      api.listBiSnapshots(),
      api.listBiAlerts(),
      api.listBiExports(),
      api.listBiSchedules()
    ]);
    setExecutive(executiveData);
    setDashboard(dashboardData);
    setReports(reportsData.reports);
    setSnapshots(snapshotsData.snapshots);
    setAlerts(alertsData.alerts);
    setExportsList(exportsData.exports);
    setSchedules(schedulesData.schedules);
    setSelected(dashboardData.dashboards?.[0] ?? alertsData.alerts?.[0] ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [module]);

  const kpis = useMemo(() => Object.entries(executive?.indicators ?? {}).slice(0, 15), [executive]);
  const filteredAlerts = module === "general" ? alerts : alerts.filter((alert) => alert.module === module);

  async function createReport() {
    const created = await api.createBiReport({
      title: `Reporte ${module} ${new Date().toLocaleDateString("es-MX")}`,
      module,
      entity: moduleEntities[module] ?? "sales",
      fields: ["permanentCode", "status", "createdAt"],
      filters: { module, period: "actual" },
      groupBy: ["status"],
      order: { createdAt: "desc" },
      period: { preset: "mes_actual" },
      format: "csv",
      columns: ["Codigo", "Estado", "Fecha"],
      totals: ["conteo"]
    });
    setReports((current) => [created.report, ...current]);
    setSelected(created.report);
  }

  async function createExport() {
    const report = reports[0];
    const created = await api.createBiExport({ reportId: report?.id, module, format: "xlsx", filters: { module, period: "actual" } });
    setExportsList((current) => [created.export, ...current]);
    setSelected(created.export);
  }

  if (loading) return <section className="bi-page"><div className="panel-card">Cargando tablero BI...</div></section>;

  return (
    <section className="bi-page">
      <div className="bi-hero">
        <div>
          <p className="eyebrow">BI-DSH · solo lectura operativa</p>
          <h2>Tablero ejecutivo conectado al ERP</h2>
          <p>Consolida indicadores, snapshots, alertas y reportes sin modificar formulaciones, inventario, ventas ni calidad.</p>
        </div>
        <div className="bi-actions">
          <select value={module} onChange={(event) => setModule(event.target.value)} aria-label="Modulo BI">
            {modules.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button onClick={load} title="Actualizar datos"><RefreshCw size={16} /> Actualizar</button>
          <button onClick={createReport} title="Crear reporte configurable"><FileBarChart size={16} /> Reporte</button>
          <button onClick={createExport} title="Registrar exportacion"><Download size={16} /> Exportar</button>
        </div>
      </div>

      <div className="tab-strip">
        {["ejecutivo", "dashboards", "reportes", "snapshots", "alertas", "exportaciones", "aprendizaje"].map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      <div className="bi-kpis">
        {kpis.map(([key, value]) => (
          <button key={key} className="metric-card" onClick={() => setSelected({ title: labels[key] ?? key, value, source: "Calculado desde APIs BI" })}>
            <span>{labels[key] ?? key}</span>
            <strong>{["inventoryValue", "pipelineValue", "estimatedSales"].includes(key) ? money(value) : String(value)}</strong>
          </button>
        ))}
      </div>

      <div className="bi-layout">
        <main className="bi-main">
          {activeTab === "ejecutivo" && (
            <>
              <div className="bi-chart-grid">
                {(dashboard?.moduleDashboard?.trends ?? snapshots).slice(0, 6).map((snapshot: any, index: number) => (
                  <button key={snapshot.id ?? index} className="bi-mini-chart" onClick={() => setSelected(snapshot)}>
                    <span>{snapshot.metric ?? snapshot.metricKey}</span>
                    <div style={{ height: `${42 + index * 8}px` }} />
                    <small>{snapshot.value?.unit ?? snapshot.valueJson?.unit ?? "valor"} · fuente trazable</small>
                  </button>
                ))}
              </div>
              <div className="panel-card">
                <h3>Actividad reciente</h3>
                {(executive?.recentActivity ?? []).slice(0, 6).map((activity: any) => (
                  <button key={activity.id} className="list-row" onClick={() => setSelected(activity)}>
                    <span>{activity.action}</span>
                    <small>{new Date(activity.createdAt).toLocaleString("es-MX")}</small>
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === "dashboards" && dashboard?.dashboards.map((item: any) => (
            <button key={item.id} className="wide-card" onClick={() => setSelected(item)}>
              <BarChart3 size={18} /><span>{item.permanentCode}</span><strong>{item.name}</strong><small>{item.module}</small>
            </button>
          ))}

          {activeTab === "reportes" && reports.map((report) => (
            <button key={report.id} className="wide-card" onClick={() => setSelected(report)}>
              <FileBarChart size={18} /><span>{report.permanentCode}</span><strong>{report.title}</strong><small>{report.entity} · {report.format}</small>
            </button>
          ))}

          {activeTab === "snapshots" && snapshots.map((snapshot) => (
            <button key={snapshot.id} className="wide-card" onClick={() => setSelected(snapshot)}>
              <Gauge size={18} /><span>{snapshot.permanentCode}</span><strong>{snapshot.metricKey}</strong><small>{snapshot.module}</small>
            </button>
          ))}

          {activeTab === "alertas" && filteredAlerts.map((alert) => (
            <button key={alert.id} className={`wide-card severity-${alert.severity}`} onClick={() => setSelected(alert)}>
              <AlertTriangle size={18} /><span>{alert.permanentCode}</span><strong>{alert.title}</strong><small>{alert.severity} · {alert.status}</small>
            </button>
          ))}

          {activeTab === "exportaciones" && exportsList.map((item) => (
            <button key={item.id} className="wide-card" onClick={() => setSelected(item)}>
              <Download size={18} /><span>{item.permanentCode}</span><strong>{item.format.toUpperCase()}</strong><small>{item.rowCount} filas · {item.storagePath}</small>
            </button>
          ))}

          {activeTab === "aprendizaje" && (
            <div className="learning-panel">
              <h3>Modo aprendizaje BI</h3>
              <p><strong>Snapshot:</strong> fotografia fechada de una metrica. No se recalcula silenciosamente.</p>
              <p><strong>Margen ejecutivo:</strong> una alerta BI siempre muestra criterio, fuente y severidad.</p>
              <p><strong>Reporte:</strong> usa campos permitidos y filtros configurables; no ejecuta SQL desde frontend.</p>
              <p><strong>Exportacion:</strong> queda auditada por usuario, fecha, formato y filtros.</p>
            </div>
          )}
        </main>

        <aside className="bi-side-panel">
          <h3>Vista rapida</h3>
          {selected ? (
            <>
              <p className="eyebrow">{selected.permanentCode ?? selected.module ?? "BI"}</p>
              <h4>{selected.title ?? selected.name ?? selected.metricKey ?? selected.action}</h4>
              <pre>{JSON.stringify(selected, null, 2)}</pre>
            </>
          ) : (
            <p>Selecciona un indicador, reporte o alerta para revisar su trazabilidad.</p>
          )}
          <div className="trace-note">
            <Layers size={16} />
            <span>BI consulta datos operativos por organization_id y registra sus propios escenarios.</span>
          </div>
          <h4>Programaciones preparadas</h4>
          {schedules.slice(0, 3).map((item) => <small key={item.id}>{item.permanentCode} · {item.frequency}</small>)}
        </aside>
      </div>
    </section>
  );
}
