import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, FileText, PackageCheck, RotateCcw, ShoppingCart, Truck } from "lucide-react";
import { api } from "../api/client";
import { FieldStatusBadge } from "../components/FieldStatusBadge";

type Tab = "solicitudes" | "cotizaciones" | "ordenes" | "recepciones" | "proveedores" | "aprendizaje";

export function PurchasesPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("ordenes");
  const [message, setMessage] = useState("");

  async function load() {
    const [dash, req, quo, ord, rcv, rtn, evl, sug] = await Promise.all([
      api.purchasesDashboard(),
      api.listPurchaseRequests(),
      api.listPurchaseQuotes(),
      api.listPurchaseOrders(),
      api.listPurchaseReceipts(),
      api.listPurchaseReturns(),
      api.listSupplierEvaluations(),
      api.listSupplySuggestions()
    ]);
    setDashboard(dash);
    setRequests(req.requests);
    setQuotes(quo.quotes);
    setOrders(ord.orders);
    setReceipts(rcv.receipts);
    setReturnsList(rtn.returns);
    setEvaluations(evl.evaluations);
    setSuggestions(sug.suggestions);
    setSelected((current: any) => current ?? ord.orders[0] ?? req.requests[0] ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedOrder = useMemo(() => orders.find((order) => order.id === selected?.id), [orders, selected]);

  async function createDemoRequest() {
    const response = await api.createPurchaseRequest({
      origin: "inventario",
      area: "Laboratorio",
      priority: "alta",
      reason: "Reabastecimiento guiado por bajo stock y proxima produccion.",
      observations: "Solicitud creada desde Compras MVP.",
      items: [{ itemName: "Glicerina vegetal", quantity: 5, unit: "kg", specifications: "Grado cosmetico con COA vigente" }]
    });
    setMessage(`Solicitud creada: ${response.request.permanentCode}`);
    await load();
  }

  async function createDemoOrder() {
    const response = await api.createPurchaseOrder({
      supplierName: "Proveedor Demo Compras",
      currency: "MXN",
      promisedDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      terms: "Entrega parcial permitida con evidencia documental.",
      items: [{ itemName: "Cosgard", quantity: 2, unit: "kg", unitPrice: 980, taxRate: 16 }]
    });
    setMessage(`Orden creada: ${response.order.permanentCode}`);
    await load();
  }

  async function approveSelectedOrder() {
    if (!selectedOrder) return;
    await api.approvePurchaseOrder(selectedOrder.id, { decision: "aprobada", comment: "Aprobacion demo con criterio de precio, tiempo y documentacion.", level: 1 });
    setMessage(`Orden aprobada: ${selectedOrder.permanentCode}`);
    await load();
  }

  async function receiveSelectedOrder() {
    if (!selectedOrder?.items?.[0]) return;
    const item = selectedOrder.items[0];
    const pending = Number(item.quantityOrdered) - Number(item.quantityReceived);
    await api.createPurchaseReceipt({
      orderId: selectedOrder.id,
      orderItemId: item.id,
      expectedQuantity: pending,
      receivedQuantity: Math.max(0.1, Math.min(pending, Number(item.quantityOrdered) / 2)),
      supplierLotCode: "SUP-DEMO-UI",
      packageStatus: "integro",
      observations: "Recepcion demo conservando trazabilidad documental.",
      initialStatus: "cuarentena"
    });
    setMessage(`Recepcion registrada para ${selectedOrder.permanentCode}`);
    await load();
  }

  return (
    <div className="purchases-page">
      <section className="purchases-hero">
        <div>
          <p className="eyebrow">Compras y Abastecimiento</p>
          <h2>Solicitudes, cotizaciones, ordenes y recepciones trazables</h2>
          <p>Coordina abastecimiento sin sobrescribir precios historicos y sin liberar automaticamente materiales recibidos.</p>
        </div>
        <div className="purchases-kpis">
          <Metric icon={<ClipboardList />} value={dashboard?.indicators?.openRequests ?? 0} label="Solicitudes abiertas" />
          <Metric icon={<FileText />} value={quotes.length} label="Cotizaciones" />
          <Metric icon={<ShoppingCart />} value={dashboard?.indicators?.ordersInApproval ?? 0} label="OC por aprobar" />
          <Metric icon={<PackageCheck />} value={dashboard?.indicators?.partialReceipts ?? 0} label="Parciales" />
          <Metric icon={<AlertTriangle />} value={dashboard?.indicators?.supplyAlerts ?? 0} label="Alertas" />
          <Metric icon={<Truck />} value={evaluations.length} label="Proveedores evaluados" />
        </div>
      </section>

      <nav className="quality-tabs">
        {(["solicitudes", "cotizaciones", "ordenes", "recepciones", "proveedores", "aprendizaje"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </nav>

      {message ? <p className="module-warning">{message}</p> : null}

      <div className="purchases-layout">
        <main className="purchases-main">
          {tab === "solicitudes" ? requests.map((item) => <PurchaseCard key={item.id} item={item} onSelect={() => setSelected(item)} selected={selected?.id === item.id} />) : null}
          {tab === "cotizaciones" ? quotes.map((item) => <PurchaseCard key={item.id} item={item} onSelect={() => setSelected(item)} selected={selected?.id === item.id} />) : null}
          {tab === "ordenes" ? orders.map((item) => <PurchaseCard key={item.id} item={item} onSelect={() => setSelected(item)} selected={selected?.id === item.id} />) : null}
          {tab === "recepciones" ? receipts.map((item) => <PurchaseCard key={item.id} item={item} onSelect={() => setSelected(item)} selected={selected?.id === item.id} />) : null}
          {tab === "proveedores" ? evaluations.map((item) => <SupplierCard key={item.id} item={item} />) : null}
          {tab === "aprendizaje" ? (
            <section className="quality-learning">
              <h3>Modo aprendizaje</h3>
              <p>Una cotizacion es evidencia historica: se crea una nueva entrada cuando cambia precio, vigencia o condiciones.</p>
              <p>Una orden de compra aprobada autoriza abastecimiento, pero la recepcion solo deja el material en cuarentena hasta que Calidad decida.</p>
              <p>La seleccion de proveedor debe explicar criterio: precio, vigencia, disponibilidad, documentos, historial e incidencias.</p>
            </section>
          ) : null}
        </main>

        <aside className="quality-side">
          <div className="side-header">
            <div>
              <p className="eyebrow">Vista rapida</p>
              <h3>{selected?.permanentCode ?? "Sin seleccion"}</h3>
            </div>
            <ShoppingCart size={24} />
          </div>
          {selected ? (
            <>
              <dl className="kde-meta">
                <div><dt>Estado</dt><dd>{selected.status ?? "registrado"}</dd></div>
                <div><dt>Proveedor</dt><dd>{selected.supplierName ?? selected.requester?.fullName ?? "Sin dato"}</dd></div>
                <div><dt>Moneda</dt><dd>{selected.currency ?? "MXN"}</dd></div>
                <div><dt>Total</dt><dd>{selected.total ? `${selected.currency ?? "MXN"} ${Number(selected.total).toLocaleString("es-MX")}` : "No calculado"}</dd></div>
                <div><dt>Documento fuente</dt><dd>{selected.document?.originalName ?? selected.documentId ?? "Sin documento"}</dd></div>
              </dl>
              <div className="quality-actions">
                <button type="button" onClick={() => void createDemoRequest()}>Nueva solicitud</button>
                <button type="button" onClick={() => void createDemoOrder()}>Nueva OC</button>
                <button type="button" onClick={() => void approveSelectedOrder()} disabled={!selectedOrder}><CheckCircle2 size={15} /> Aprobar OC</button>
                <button type="button" onClick={() => void receiveSelectedOrder()} disabled={!selectedOrder}><PackageCheck size={15} /> Recibir</button>
              </div>
              <h4>Renglones</h4>
              <div className="purchase-lines">
                {(selected.items ?? []).map((row: any) => (
                  <span key={row.id ?? row.itemName}><strong>{row.itemName}</strong>{Number(row.quantityOrdered ?? row.quantity).toLocaleString("es-MX")} {row.unit} · recibido {Number(row.quantityReceived ?? 0).toLocaleString("es-MX")}</span>
                ))}
              </div>
              <h4>Sugerencias de abastecimiento</h4>
              <div className="purchase-lines">
                {suggestions.slice(0, 4).map((row) => <span key={row.id}><strong>{row.itemName}</strong>{row.reason}</span>)}
              </div>
            </>
          ) : <p className="empty-state">Selecciona un registro para ver trazabilidad, importes y acciones permitidas.</p>}
        </aside>
      </div>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return <span>{icon}<strong>{value}</strong>{label}</span>;
}

function PurchaseCard({ item, selected, onSelect }: { item: any; selected: boolean; onSelect: () => void }) {
  const title = item.supplierName ?? item.reason ?? item.permanentCode;
  const subtitle = item.total ? `${item.currency ?? "MXN"} ${Number(item.total).toLocaleString("es-MX")}` : `${item.items?.length ?? 0} renglones`;
  return (
    <article className={selected ? "quality-card selected" : "quality-card"} onClick={onSelect}>
      <header><strong>{item.permanentCode}</strong><FieldStatusBadge status={item.status ?? "registrado"} /></header>
      <h3>{title}</h3>
      <p>{subtitle} · {item.promisedDate ? new Date(item.promisedDate).toLocaleDateString("es-MX") : item.requiredDate ? new Date(item.requiredDate).toLocaleDateString("es-MX") : "Sin fecha compromiso"}</p>
      <div className="chip-row">{(item.items ?? []).slice(0, 4).map((row: any) => <span key={row.id ?? row.itemName}>{row.itemName}</span>)}</div>
    </article>
  );
}

function SupplierCard({ item }: { item: any }) {
  return (
    <article className="quality-card">
      <header><strong>{item.permanentCode}</strong><FieldStatusBadge status={item.trend ?? "estable"} /></header>
      <h3>{item.supplierName}</h3>
      <p>Calificacion {Number(item.score).toFixed(1)} · {item.lotsApproved}/{item.lotsReceived} lotes aprobados</p>
      <div className="chip-row"><span>{item.incidents} incidencias</span><span>{item.incompleteDocuments} docs incompletos</span><span><RotateCcw size={13} /> {item.responseTimeDays ?? "s/d"} dias</span></div>
    </article>
  );
}
