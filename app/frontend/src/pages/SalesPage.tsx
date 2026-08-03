import { type ReactNode, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, FileText, Handshake, PackageCheck, Send, TrendingUp, Users } from "lucide-react";
import { api } from "../api/client";
import { FieldStatusBadge } from "../components/FieldStatusBadge";

type Tab = "pipeline" | "clientes" | "cotizaciones" | "pedidos" | "entregas" | "aprendizaje";

export function SalesPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("pipeline");
  const [message, setMessage] = useState("");

  async function load() {
    const [dash, leadRes, customerRes, oppRes, productRes, quoteRes, orderRes, deliveryRes, sampleRes] = await Promise.all([
      api.salesDashboard(),
      api.listSalesLeads(),
      api.listSalesCustomers(),
      api.listSalesOpportunities(),
      api.listSalesProducts(),
      api.listSalesQuotes(),
      api.listSalesOrders(),
      api.listSalesDeliveries(),
      api.listSalesSamples()
    ]);
    setDashboard(dash);
    setLeads(leadRes.leads);
    setCustomers(customerRes.customers);
    setOpportunities(oppRes.opportunities);
    setProducts(productRes.products);
    setQuotes(quoteRes.quotes);
    setOrders(orderRes.orders);
    setDeliveries(deliveryRes.deliveries);
    setSamples(sampleRes.samples);
    setSelected((current: any) => current ?? customerRes.customers[0] ?? leadRes.leads[0] ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedQuote = useMemo(() => quotes.find((quote) => quote.id === selected?.id), [quotes, selected]);
  const selectedOrder = useMemo(() => orders.find((order) => order.id === selected?.id), [orders, selected]);
  const firstCustomer = customers[0];
  const firstProduct = products[0];

  async function createDemoLead() {
    const response = await api.createSalesLead({ commercialName: "Nuevo Prospecto Demo", legalName: "Nuevo Prospecto Demo SA de CV", personType: "moral", industry: "Cosmetica", segment: "profesional", channel: "directo", origin: "evento", priority: "alta", city: "CDMX", observations: "Prospecto creado desde UI CRM." });
    setMessage(`Prospecto creado: ${response.lead.permanentCode}`);
    await load();
  }

  async function createDemoQuote() {
    if (!firstCustomer || !firstProduct) return;
    const response = await api.createSalesQuote({ customerId: firstCustomer.id, currency: firstCustomer.currency ?? "MXN", shippingTotal: 120, validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(), conditions: "Condiciones demo guiadas.", items: [{ productId: firstProduct.id, quantity: 12, unit: firstProduct.salesUnit ?? "pieza", unitPrice: Number(firstProduct.price), discountRate: 5, taxRate: 16 }] });
    setMessage(`Cotizacion creada: ${response.quote.permanentCode}`);
    await load();
  }

  async function approveSelectedQuote() {
    if (!selectedQuote) return;
    await api.approveSalesQuote(selectedQuote.id, { approvalType: "descuento", decision: "aprobada", reason: "Revision comercial demo con margen suficiente.", comment: "Aprobada desde UI." });
    setMessage(`Cotizacion aprobada: ${selectedQuote.permanentCode}`);
    await load();
  }

  async function confirmSelectedOrder() {
    if (!selectedOrder) return;
    await api.confirmSalesOrder(selectedOrder.id, { acknowledgement: "Disponibilidad revisada antes de confirmar." });
    setMessage(`Pedido confirmado: ${selectedOrder.permanentCode}`);
    await load();
  }

  return (
    <div className="sales-page">
      <section className="sales-hero">
        <div>
          <p className="eyebrow">CRM, Ventas y Pedidos</p>
          <h2>Prospeccion, pipeline, cotizacion y pedido trazable</h2>
          <p>Gestiona el flujo comercial sin facturacion fiscal, sin e-commerce publico y sin prometer disponibilidad sin evidencia.</p>
        </div>
        <div className="sales-kpis">
          <Metric icon={<Users />} value={dashboard?.indicators?.newLeads ?? 0} label="Prospectos nuevos" />
          <Metric icon={<TrendingUp />} value={dashboard?.indicators?.activeOpportunities ?? 0} label="Oportunidades" />
          <Metric icon={<FileText />} value={dashboard?.indicators?.openQuotes ?? 0} label="Cotizaciones abiertas" />
          <Metric icon={<Clock />} value={dashboard?.indicators?.expiredQuotes ?? 0} label="Vencidas" />
          <Metric icon={<PackageCheck />} value={dashboard?.indicators?.activeOrders ?? 0} label="Pedidos activos" />
          <Metric icon={<Handshake />} value={customers.length} label="Clientes" />
        </div>
      </section>

      <nav className="quality-tabs">
        {(["pipeline", "clientes", "cotizaciones", "pedidos", "entregas", "aprendizaje"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </nav>

      {message ? <p className="module-warning">{message}</p> : null}

      <div className="sales-layout">
        <main className="sales-main">
          {tab === "pipeline" ? <Pipeline opportunities={opportunities} onSelect={setSelected} /> : null}
          {tab === "clientes" ? customers.map((item) => <SalesCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelected(item)} />) : null}
          {tab === "cotizaciones" ? quotes.map((item) => <SalesCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelected(item)} />) : null}
          {tab === "pedidos" ? orders.map((item) => <SalesCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelected(item)} />) : null}
          {tab === "entregas" ? deliveries.map((item) => <SalesCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelected(item)} />) : null}
          {tab === "aprendizaje" ? (
            <section className="quality-learning">
              <h3>Modo aprendizaje</h3>
              <p>CRM conserva la historia comercial: actividades, oportunidades, cotizaciones, pedidos, muestras y documentos del cliente.</p>
              <p>Una cotizacion historica no se sobrescribe. Si cambian precio, vigencia o condiciones se crea una nueva cotizacion o lista versionada.</p>
              <p>Antes de confirmar pedidos se revisa disponibilidad; si falta producto terminado se sugiere produccion, pero no se crea automaticamente.</p>
            </section>
          ) : null}
        </main>

        <aside className="quality-side">
          <div className="side-header">
            <div>
              <p className="eyebrow">Perfil 360</p>
              <h3>{selected?.permanentCode ?? selected?.commercialName ?? "Sin seleccion"}</h3>
            </div>
            <Handshake size={24} />
          </div>
          {selected ? (
            <>
              <dl className="kde-meta">
                <div><dt>Nombre</dt><dd>{selected.commercialName ?? selected.name ?? selected.customer?.commercialName ?? "Sin dato"}</dd></div>
                <div><dt>Estado</dt><dd>{selected.status ?? selected.stage ?? "activo"}</dd></div>
                <div><dt>Moneda</dt><dd>{selected.currency ?? "MXN"}</dd></div>
                <div><dt>Total / valor</dt><dd>{selected.total ? Number(selected.total).toLocaleString("es-MX") : selected.estimatedValue ? Number(selected.estimatedValue).toLocaleString("es-MX") : "No calculado"}</dd></div>
                <div><dt>Documento KDE</dt><dd>{selected.document?.originalName ?? selected.documentId ?? "Sin documento"}</dd></div>
              </dl>
              <div className="quality-actions">
                <button type="button" onClick={() => void createDemoLead()}>Nuevo prospecto</button>
                <button type="button" onClick={() => void createDemoQuote()}><Send size={15} /> Cotizar</button>
                <button type="button" onClick={() => void approveSelectedQuote()} disabled={!selectedQuote}><CheckCircle2 size={15} /> Aprobar cotizacion</button>
                <button type="button" onClick={() => void confirmSelectedOrder()} disabled={!selectedOrder}><PackageCheck size={15} /> Confirmar pedido</button>
              </div>
              <h4>Partidas</h4>
              <div className="purchase-lines">
                {(selected.items ?? []).map((row: any) => <span key={row.id}><strong>{row.product?.name ?? row.itemName}</strong>{Number(row.quantity).toLocaleString("es-MX")} {row.unit} · {Number(row.lineTotal).toLocaleString("es-MX")}</span>)}
              </div>
              <h4>Actividad reciente</h4>
              <div className="purchase-lines">
                {(dashboard?.activities ?? []).slice(0, 5).map((row: any) => <span key={row.id}><strong>{row.activityType}</strong>{new Date(row.scheduledAt).toLocaleDateString("es-MX")} · {row.status}</span>)}
              </div>
            </>
          ) : <p className="empty-state">Selecciona un cliente, oportunidad, cotizacion o pedido.</p>}
        </aside>
      </div>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return <span>{icon}<strong>{typeof value === "number" ? value.toLocaleString("es-MX") : value}</strong>{label}</span>;
}

function SalesCard({ item, selected, onSelect }: { item: any; selected: boolean; onSelect: () => void }) {
  const title = item.commercialName ?? item.name ?? item.customer?.commercialName ?? item.permanentCode;
  const subtitle = item.total ? `${item.currency ?? "MXN"} ${Number(item.total).toLocaleString("es-MX")}` : item.segment ?? item.stage ?? "Registro comercial";
  return (
    <article className={selected ? "quality-card selected" : "quality-card"} onClick={onSelect}>
      <header><strong>{item.permanentCode}</strong><FieldStatusBadge status={item.status ?? item.stage ?? "activo"} /></header>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      <div className="chip-row">{(item.items ?? item.contacts ?? item.quotes ?? []).slice(0, 4).map((row: any) => <span key={row.id}>{row.product?.name ?? row.fullName ?? row.permanentCode}</span>)}</div>
    </article>
  );
}

function Pipeline({ opportunities, onSelect }: { opportunities: any[]; onSelect: (item: any) => void }) {
  const stages = ["deteccion", "calificacion", "diagnostico", "propuesta", "negociacion", "ganada", "perdida", "pausada"];
  return (
    <div className="sales-pipeline">
      {stages.map((stage) => (
        <section key={stage} className="sales-stage">
          <h3>{stage}</h3>
          {opportunities.filter((item) => item.stage === stage).map((item) => (
            <button key={item.id} onClick={() => onSelect(item)}>
              <strong>{item.name}</strong>
              <span>{item.currency} {Number(item.estimatedValue).toLocaleString("es-MX")}</span>
              <small>{item.probability}% prob.</small>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}
