import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calculator, Save } from "lucide-react";
import { api } from "../api/client";
import type { FormulationFamily, FormulationVersion } from "../types";

const batchSizes = [100, 250, 500, 1000, 5000, 20000, 100000];

export function CostEnginePage() {
  const [formulations, setFormulations] = useState<FormulationFamily[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<FormulationVersion | null>(null);
  const [result, setResult] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [input, setInput] = useState({
    name: "Escenario demo",
    batchSize: 1000,
    currency: "MXN",
    exchangeRate: 17,
    providerStrategy: "precio_reciente",
    additionalCosts: { empaque: 12, etiqueta: 4, mano_obra: 20, energia: 5, merma: 3, indirectos: 10 },
    marginPercent: 45,
    markupPercent: 80
  });
  const [message, setMessage] = useState("");

  const versions = useMemo(() => formulations.flatMap((formulation) => formulation.versions.map((version) => ({ ...version, label: `${formulation.permanentCode} - ${formulation.name} v${version.versionNumber}` }))), [formulations]);

  async function load() {
    const response = await api.listFormulations();
    setFormulations(response.formulations);
    const first = response.formulations[0]?.versions[0];
    if (first) setSelectedVersion(first);
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : "No se pudo cargar costeo."));
  }, []);

  useEffect(() => {
    if (selectedVersion) simulate().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersion?.id]);

  async function simulate(event?: FormEvent) {
    event?.preventDefault();
    if (!selectedVersion) return;
    const response = await api.simulateCost(selectedVersion.id, input);
    setResult(response.result);
    const scenarioResponse = await api.listCostScenarios(selectedVersion.id);
    setScenarios(scenarioResponse.scenarios);
  }

  async function saveScenario() {
    if (!selectedVersion) return;
    const response = await api.saveCostScenario(selectedVersion.id, input);
    setResult(response.result);
    setMessage("Escenario guardado sin modificar la formulacion.");
    const scenarioResponse = await api.listCostScenarios(selectedVersion.id);
    setScenarios(scenarioResponse.scenarios);
  }

  function updateAdditional(key: string, value: number) {
    setInput((current) => ({ ...current, additionalCosts: { ...current.additionalCosts, [key]: value } }));
  }

  return (
    <main className="cost-engine-page">
      <section className="module-hero">
        <div>
          <p className="eyebrow">Incremento 5</p>
          <h1>Motor de Costos</h1>
          <p>Escenarios fechados para costear formulaciones sin alterar versiones aprobadas.</p>
        </div>
        <form className="create-formulation" onSubmit={simulate}>
          <select value={selectedVersion?.id ?? ""} onChange={(event) => setSelectedVersion(versions.find((version) => version.id === event.target.value) ?? null)}>
            {versions.map((version: any) => <option key={version.id} value={version.id}>{version.label}</option>)}
          </select>
          <button className="primary-button" type="submit"><Calculator size={17} />Simular</button>
        </form>
      </section>
      {message ? <p className="module-message">{message}</p> : null}
      <div className="cost-grid">
        <section className="cost-summary">
          <div className="section-heading"><h2>Resumen ejecutivo</h2><span>{input.currency}</span></div>
          <div className="cost-kpis">
            <article><span>Costo lote</span><strong>{input.currency} {result?.totalCost?.toFixed?.(2) ?? "0.00"}</strong></article>
            <article><span>Costo/kg</span><strong>{input.currency} {result?.costPerKg?.toFixed?.(2) ?? "0.00"}</strong></article>
            <article><span>Mayorista margen</span><strong>{input.currency} {result?.wholesalePrice?.toFixed?.(2) ?? "0.00"}</strong></article>
            <article><span>Minorista markup</span><strong>{input.currency} {result?.retailPrice?.toFixed?.(2) ?? "0.00"}</strong></article>
          </div>
          <div className="cost-bars">
            {(result?.items ?? []).map((item: any) => <span key={item.ingredient.id} style={{ width: `${Math.max(item.costSharePercent ?? 1, 3)}%` }} title={`${item.ingredient.displayName}: ${item.costSharePercent ?? 0}%`} />)}
          </div>
          <div className="cost-items">
            {(result?.items ?? []).map((item: any) => (
              <article key={item.ingredient.id}>
                <strong>{item.ingredient.displayName}</strong>
                <span>{item.grams} g - {input.currency} {item.lineCost?.toFixed?.(4) ?? "sin precio"} - {item.costSharePercent ?? 0}%</span>
              </article>
            ))}
          </div>
        </section>
        <aside className="cost-simulator">
          <div className="section-heading"><h2>Simulador</h2><span>Tiempo real</span></div>
          <form onSubmit={simulate}>
            <label>Lote<select value={input.batchSize} onChange={(event) => setInput({ ...input, batchSize: Number(event.target.value) })}>{batchSizes.map((size) => <option key={size} value={size}>{size >= 1000 ? `${size / 1000} kg` : `${size} g`}</option>)}</select></label>
            <label>Personalizado g<input type="number" value={input.batchSize} onChange={(event) => setInput({ ...input, batchSize: Number(event.target.value) })} /></label>
            <label>Moneda<select value={input.currency} onChange={(event) => setInput({ ...input, currency: event.target.value })}><option>MXN</option><option>USD</option></select></label>
            <label>Tipo de cambio<input type="number" step="0.01" value={input.exchangeRate} onChange={(event) => setInput({ ...input, exchangeRate: Number(event.target.value) })} /></label>
            <label>Proveedor<select value={input.providerStrategy} onChange={(event) => setInput({ ...input, providerStrategy: event.target.value })}><option value="precio_reciente">Precio mas reciente</option><option value="precio_bajo">Precio mas bajo</option></select></label>
            {Object.entries(input.additionalCosts).map(([key, value]) => <label key={key}>{key}<input type="number" value={value} onChange={(event) => updateAdditional(key, Number(event.target.value))} /></label>)}
            <label>Margen %<input type="number" value={input.marginPercent} onChange={(event) => setInput({ ...input, marginPercent: Number(event.target.value) })} /></label>
            <label>Markup %<input type="number" value={input.markupPercent} onChange={(event) => setInput({ ...input, markupPercent: Number(event.target.value) })} /></label>
            <button className="secondary-button" type="submit">Recalcular</button>
            <button className="primary-button" type="button" onClick={saveScenario}><Save size={16} />Guardar escenario</button>
          </form>
        </aside>
      </div>
      <div className="cost-grid">
        <section className="cost-summary">
          <div className="section-heading"><h2>Alertas</h2><span>{result?.alerts?.length ?? 0}</span></div>
          {(result?.alerts ?? []).map((alert: any) => <p key={`${alert.code}-${alert.message}`} className={alert.severity === "error" ? "module-warning" : "empty-inline"}>{alert.message}</p>)}
          {(result?.alerts ?? []).length === 0 ? <p className="module-message">Sin alertas de costo.</p> : null}
        </section>
        <aside className="cost-simulator">
          <div className="section-heading"><h2>Modo aprendizaje</h2><span>Finanzas</span></div>
          <p className="empty-inline">Margen: porcentaje de utilidad incluido dentro del precio final. Markup: porcentaje que se suma sobre el costo.</p>
          <p className="empty-inline">Los escenarios son independientes: cambios de precio no modifican formulaciones aprobadas.</p>
          <strong>Escenarios guardados: {scenarios.length}</strong>
        </aside>
      </div>
    </main>
  );
}
