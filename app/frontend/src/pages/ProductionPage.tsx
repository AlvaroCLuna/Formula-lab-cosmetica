import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { FieldStatusBadge } from "../components/FieldStatusBadge";

export function ProductionPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [theoretical, setTheoretical] = useState<any | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [message, setMessage] = useState("");
  const [newOrder, setNewOrder] = useState({ formulationVersionId: "frm-shampoo-v1", plannedQuantity: 1000, priority: "media" });

  async function load() {
    const [dash, response] = await Promise.all([api.productionDashboard(), api.listProductionOrders(filters)]);
    setDashboard(dash);
    setOrders(response.orders);
    if (!selected && response.orders[0]) await selectOrder(response.orders[0].id);
  }

  async function selectOrder(id: string) {
    const response = await api.getProductionOrder(id);
    setSelected(response.order);
    setTheoretical(response.theoretical);
  }

  useEffect(() => { load().catch((error) => setMessage(error instanceof Error ? error.message : "No se pudo cargar produccion.")); }, []);

  async function applyFilters(event: FormEvent) {
    event.preventDefault();
    const response = await api.listProductionOrders(filters);
    setOrders(response.orders);
  }

  async function createOrder(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await api.createProductionOrder({ ...newOrder, plannedUnit: "g" });
      setMessage("Orden de produccion creada desde version aprobada.");
      await load();
      await selectOrder(response.order.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la orden.");
    }
  }

  async function transition(action: string) {
    if (!selected) return;
    try {
      const response = await api.transitionProductionOrder(selected.id, { action, actualYield: action === "terminar" ? selected.expectedYield : undefined, observations: `Accion ${action} desde panel` });
      setMessage(`Orden actualizada: ${action}.`);
      await load();
      await selectOrder(response.order.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar la orden.");
    }
  }

  async function toggleChecklist(item: any) {
    await api.updateProductionChecklist(item.id, !item.completed);
    await selectOrder(selected.id);
  }

  async function confirmFirstConsumption(consumption: any) {
    const suggestion = theoretical?.rows.find((row: any) => row.rawMaterialMasterId === consumption.rawMaterialMasterId)?.suggestedLots?.[0];
    if (!suggestion) {
      setMessage("No hay lote FEFO sugerido suficiente para este consumo.");
      return;
    }
    try {
      await api.confirmProductionConsumption(consumption.id, { rawMaterialLotId: suggestion.lot.id, usedQuantity: Math.min(consumption.requiredQuantity, suggestion.suggestedQuantity), wasteQuantity: 0, substitutionAuthorized: false, observations: "Consumo MVP confirmado desde panel" });
      setMessage("Consumo real confirmado y descontado de inventario.");
      await selectOrder(selected.id);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo confirmar consumo.");
    }
  }

  async function addParameter() {
    if (!selected) return;
    await api.addProductionParameter(selected.id, { temperature: 25, timeMinutes: 15, speed: 600, ph: 5.5, viscosity: "Media", obtainedWeight: selected.expectedYield, observations: "Parametro demo registrado" });
    await api.addProductionLog(selected.id, { type: "parametro", temperature: 25, timeMinutes: 15, agitationSpeed: 600, observations: "Registro de proceso desde panel" });
    await selectOrder(selected.id);
  }

  return (
    <main className="production-page">
      <section className="module-hero">
        <div><p className="eyebrow">Incremento 7</p><h1>Laboratorio y Produccion</h1><p>Ordenes trazables desde formulaciones aprobadas, consumo real, bitacora, checklist y lote terminado.</p></div>
        <form className="create-formulation" onSubmit={createOrder}>
          <input value={newOrder.formulationVersionId} onChange={(event) => setNewOrder({ ...newOrder, formulationVersionId: event.target.value })} />
          <input type="number" min="1" value={newOrder.plannedQuantity} onChange={(event) => setNewOrder({ ...newOrder, plannedQuantity: Number(event.target.value) })} />
          <select value={newOrder.priority} onChange={(event) => setNewOrder({ ...newOrder, priority: event.target.value })}><option value="media">Media</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select>
          <button className="primary-button">Crear orden</button>
        </form>
      </section>
      {message ? <p className="module-message">{message}</p> : null}
      <section className="production-kpis">
        <article><span>Activas</span><strong>{dashboard?.indicators.activeOrders ?? 0}</strong></article>
        <article><span>Produccion dia</span><strong>{dashboard?.indicators.todayProduction ?? 0} g</strong></article>
        <article><span>Lotes producidos</span><strong>{dashboard?.indicators.finishedLots ?? 0}</strong></article>
        <article><span>Consumo</span><strong>{dashboard?.indicators.consumption ?? 0} g</strong></article>
        <article><span>Mermas</span><strong>{dashboard?.indicators.waste ?? 0} g</strong></article>
        <article><span>Detenidas</span><strong>{dashboard?.indicators.stoppedOrders ?? 0}</strong></article>
      </section>
      <form className="filters-bar" onSubmit={applyFilters}>
        <input placeholder="Buscar orden o lote" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos</option><option value="planeada">Planeada</option><option value="en_proceso">En proceso</option><option value="pausada">Pausada</option><option value="terminada">Terminada</option></select>
        <button className="secondary-button">Filtrar</button>
      </form>
      <div className="production-grid">
        <section className="production-orders">
          <div className="section-heading"><h2>Ordenes</h2><span>{orders.length} registros</span></div>
          {orders.map((order) => (
            <button key={order.id} className={selected?.id === order.id ? "production-card selected" : "production-card"} onClick={() => selectOrder(order.id)}>
              <div><strong>{order.permanentCode}</strong><span>{order.formulationVersion.name} · {order.targetLotCode}</span></div>
              <span>{order.plannedQuantity} {order.plannedUnit}</span>
              <span>Prioridad {order.priority}</span>
              <FieldStatusBadge status={order.status} />
            </button>
          ))}
        </section>
        <aside className="production-side">
          <div className="section-heading"><h2>Orden activa</h2><span>{selected?.permanentCode ?? "Sin seleccion"}</span></div>
          {selected ? (
            <div className="quick-content">
              <h3>{selected.formulationVersion.name}</h3>
              <p>Lote objetivo: {selected.targetLotCode}</p>
              <p>Rendimiento esperado: {selected.expectedYield} {selected.plannedUnit}</p>
              <div className="row-actions"><button className="secondary-button" onClick={() => transition("planear")}>Planear</button><button className="secondary-button" onClick={() => transition("liberar")}>Liberar</button><button className="secondary-button" onClick={() => transition("iniciar")}>Iniciar</button><button className="secondary-button" onClick={() => transition("pausar")}>Pausar</button><button className="primary-button" onClick={() => transition("terminar")}>Terminar</button></div>
              <h4>Checklist</h4>
              {selected.checklistItems.map((item: any) => <label key={item.id} className="checkline"><input type="checkbox" checked={item.completed} onChange={() => toggleChecklist(item)} /> {item.label}</label>)}
              <h4>Consumo teorico y real</h4>
              {selected.consumptions.map((consumption: any) => <article key={consumption.id} className="production-consumption"><strong>{consumption.rawMaterial.commonName}</strong><span>Req. {consumption.requiredQuantity} {consumption.unit} · Usado {consumption.usedQuantity ?? 0}</span><button className="secondary-button" disabled={Boolean(consumption.confirmedAt)} onClick={() => confirmFirstConsumption(consumption)}>Confirmar FEFO</button></article>)}
              <h4>Bitacora</h4>
              <button className="secondary-button" onClick={addParameter}>Registrar parametro demo</button>
              {selected.logs.map((log: any) => <p key={log.id} className="empty-inline">{new Date(log.createdAt).toLocaleString()} · {log.type} · {log.observations ?? "Sin observaciones"}</p>)}
              <h4>Producto terminado</h4>
              <p className="empty-inline">{selected.finishedLot ? `${selected.finishedLot.lotCode} · ${selected.finishedLot.quantityObtained} ${selected.finishedLot.unit}` : "Pendiente de cierre."}</p>
            </div>
          ) : <p className="empty-state">Selecciona una orden.</p>}
        </aside>
      </div>
    </main>
  );
}
