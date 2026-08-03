import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { FieldStatusBadge } from "../components/FieldStatusBadge";

export function InventoryPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [kardex, setKardex] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [message, setMessage] = useState("");

  async function load() {
    const [dash, lotResponse] = await Promise.all([api.inventoryDashboard(), api.listInventoryLots(filters)]);
    setDashboard(dash);
    setLots(lotResponse.lots);
    if (!selected && lotResponse.lots[0]) await selectLot(lotResponse.lots[0]);
  }

  async function selectLot(lot: any) {
    setSelected(lot);
    const response = await api.lotKardex(lot.id);
    setKardex(response.movements);
  }

  useEffect(() => { load().catch((error) => setMessage(error instanceof Error ? error.message : "No se pudo cargar inventario.")); }, []);

  async function applyFilters(event: FormEvent) {
    event.preventDefault();
    const response = await api.listInventoryLots(filters);
    setLots(response.lots);
  }

  async function reserve() {
    if (!selected) return;
    try {
      await api.inventoryMovement(selected.id, { type: "reserva", quantity: 10, reason: "Reserva demo para prueba/formulacion", reference: "simulador" });
      setMessage("Reserva registrada con movimiento.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo reservar.");
    }
  }

  async function release() {
    if (!selected) return;
    try {
      await api.inventoryMovement(selected.id, { type: "liberacion_reserva", quantity: 5, reason: "Liberacion demo", reference: "simulador" });
      setMessage("Reserva liberada con movimiento.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo liberar.");
    }
  }

  return (
    <main className="inventory-page">
      <section className="module-hero">
        <div><p className="eyebrow">Incremento 6</p><h1>Inventario y Lotes</h1><p>Kardex trazable por lote, FEFO preparado, reservas y alertas sin saldos negativos.</p></div>
        <form className="create-formulation" onSubmit={applyFilters}>
          <input placeholder="Buscar lote" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos</option><option value="aprobado">Aprobado</option><option value="cuarentena">Cuarentena</option><option value="bloqueado">Bloqueado</option><option value="caducado">Caducado</option></select>
          <button className="primary-button">Filtrar</button>
        </form>
      </section>
      {message ? <p className="module-message">{message}</p> : null}
      <section className="inventory-kpis">
        <article><span>Valor estimado</span><strong>MXN {dashboard?.indicators.estimatedValue ?? 0}</strong></article>
        <article><span>Bajo stock</span><strong>{dashboard?.indicators.lowStock ?? 0}</strong></article>
        <article><span>Proximos a caducar</span><strong>{dashboard?.indicators.expiringSoon ?? 0}</strong></article>
        <article><span>Cuarentena</span><strong>{dashboard?.indicators.quarantine ?? 0}</strong></article>
        <article><span>Bloqueados</span><strong>{dashboard?.indicators.blocked ?? 0}</strong></article>
      </section>
      <div className="inventory-grid">
        <section className="inventory-list">
          <div className="section-heading"><h2>Lotes</h2><span>{lots.length} registros</span></div>
          {lots.map((lot) => (
            <button key={lot.id} className={selected?.id === lot.id ? "inventory-row selected" : "inventory-row"} onClick={() => selectLot(lot)}>
              <div><strong>{lot.permanentCode}</strong><span>{lot.rawMaterial.commonName}</span></div>
              <span>{lot.availableQuantity} {lot.unit} disp. / {lot.reservedQuantity} res.</span>
              <span>{lot.location?.warehouse?.name ?? "Sin ubicacion"}</span>
              <FieldStatusBadge status={lot.status} />
            </button>
          ))}
        </section>
        <aside className="inventory-side">
          <div className="section-heading"><h2>Vista rapida</h2><span>{selected?.permanentCode ?? "Sin lote"}</span></div>
          {selected ? (
            <div className="quick-content">
              <h3>{selected.rawMaterial.commonName}</h3>
              <p>Caducidad: {selected.expirationDate ? new Date(selected.expirationDate).toLocaleDateString() : "Sin fecha"}</p>
              <p>Ubicacion: {selected.location?.code ?? "Pendiente"}</p>
              <div className="row-actions"><button className="secondary-button" onClick={reserve}>Reservar 10</button><button className="secondary-button" onClick={release}>Liberar 5</button></div>
              <h4>Alertas</h4>
              {(selected.alerts ?? []).map((alert: string) => <p key={alert} className="module-warning">{alert}</p>)}
              <h4>Kardex</h4>
              {kardex.map((movement) => <p key={movement.id} className="empty-inline">{movement.type}: {movement.quantity} {movement.unit} | {movement.previousBalance} &gt; {movement.newBalance}</p>)}
              <h4>Modo aprendizaje</h4>
              <p className="empty-inline">FEFO prioriza el lote con caducidad mas cercana. Ningun saldo cambia sin movimiento de kardex.</p>
            </div>
          ) : <p className="empty-state">Selecciona un lote.</p>}
        </aside>
      </div>
    </main>
  );
}
