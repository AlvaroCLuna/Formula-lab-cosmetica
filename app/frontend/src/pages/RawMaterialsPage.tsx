import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { api } from "../api/client";
import type { RawMaterialLearning, RawMaterialMaster, RawMaterialMasterVersion } from "../types";
import { FieldStatusBadge } from "../components/FieldStatusBadge";
import { RawMaterialQuickView } from "../components/RawMaterialQuickView";

const emptyVersion = {
  commercialName: "",
  commonName: "",
  inci: "",
  cas: "",
  ec: "",
  category: "",
  family: "",
  cosmeticFunction: "",
  description: "",
  appearance: "",
  color: "",
  odor: "",
  solubility: "",
  density: "",
  ph: "",
  maxTemperature: "",
  recommendedTemperature: "",
  usageRange: "",
  storageConditions: "",
  shelfLife: "",
  contraindications: "",
  compatibilities: "",
  incompatibilities: "",
  allergens: "",
  observations: "",
  examplesOfUse: "",
  evidenceSummary: "",
  confidenceLevel: "pendiente"
};

export function RawMaterialsPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterialMaster[]>([]);
  const [selected, setSelected] = useState<RawMaterialMaster | null>(null);
  const [learning, setLearning] = useState<RawMaterialLearning | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "", category: "", family: "" });
  const [form, setForm] = useState(emptyVersion);
  const [message, setMessage] = useState("");

  const categories = useMemo(() => Array.from(new Set(rawMaterials.map((item) => item.category).filter(Boolean))).sort() as string[], [rawMaterials]);
  const families = useMemo(() => Array.from(new Set(rawMaterials.map((item) => item.family).filter(Boolean))).sort() as string[], [rawMaterials]);
  const selectedVersion = selected?.versions?.[0] ?? null;
  const editable = selectedVersion ? ["borrador", "en_revision"].includes(selectedVersion.status) : false;

  async function load(nextFilters = filters) {
    const response = await api.listMasterRawMaterials(nextFilters);
    setRawMaterials(response.rawMaterials);
    if (!selected && response.rawMaterials[0]) {
      await selectMaterial(response.rawMaterials[0].id);
    }
  }

  async function selectMaterial(id: string) {
    const response = await api.quickRawMaterial(id);
    setSelected({ ...response.rawMaterial, intelligence: response.intelligence });
    setLearning(response.learning);
    const version = response.rawMaterial.versions?.[0];
    if (version) {
      setForm({ ...emptyVersion, ...Object.fromEntries(Object.entries(version).map(([key, value]) => [key, value ?? ""])) });
    }
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : "No se pudo cargar materias primas."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilters(event: FormEvent) {
    event.preventDefault();
    setSelected(null);
    setLearning(null);
    await load(filters);
  }

  async function createMaterial(event: FormEvent) {
    event.preventDefault();
    const response = await api.createMasterRawMaterial(form as Partial<RawMaterialMasterVersion>);
    setMessage("Materia prima creada como borrador.");
    await load();
    await selectMaterial(response.rawMaterial.id);
  }

  async function saveVersion(event: FormEvent) {
    event.preventDefault();
    if (!selectedVersion) return;
    const response = await api.updateRawMaterialVersion(selectedVersion.id, form as Partial<RawMaterialMasterVersion>);
    setMessage("Ficha guardada con auditoria.");
    await selectMaterial(response.version.rawMaterialMasterId);
    await load();
  }

  async function submitReview() {
    if (!selectedVersion) return;
    const response = await api.submitRawMaterialVersion(selectedVersion.id);
    setMessage("Ficha enviada a revision.");
    await selectMaterial(response.version.rawMaterialMasterId);
    await load();
  }

  async function approve() {
    if (!selectedVersion) return;
    const response = await api.approveRawMaterialVersion(selectedVersion.id);
    setMessage("Ficha validada con snapshot persistente.");
    await selectMaterial(response.version.rawMaterialMasterId);
    await load();
  }

  async function newVersion() {
    if (!selected) return;
    const response = await api.createRawMaterialVersion(selected.id);
    setMessage("Nueva version creada desde ficha validada.");
    await selectMaterial(response.version.rawMaterialMasterId);
    await load();
  }

  async function archive() {
    if (!selected) return;
    const response = await api.archiveRawMaterial(selected.id);
    setMessage("Materia prima archivada con auditoria.");
    await load();
    setSelected(response.rawMaterial);
  }

  const setField = (key: keyof typeof emptyVersion, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <main className="raw-materials-page">
      <section className="module-hero">
        <div>
          <p className="eyebrow">Incremento 3</p>
          <h1>Materias Primas Maestras</h1>
          <p>Base de conocimiento versionada para formulaciones, calidad, laboratorio e IA responsable.</p>
        </div>
        <form className="create-formulation" onSubmit={createMaterial}>
          <input required placeholder="Nombre comun" value={form.commonName} onChange={(event) => setField("commonName", event.target.value)} />
          <input required placeholder="Categoria" value={form.category} onChange={(event) => setField("category", event.target.value)} />
          <input required placeholder="Funcion cosmetica" value={form.cosmeticFunction} onChange={(event) => setField("cosmeticFunction", event.target.value)} />
          <button className="primary-button" type="submit"><Plus size={17} />Crear ficha</button>
        </form>
      </section>

      <form className="filters-bar" onSubmit={applyFilters}>
        <label className="search-box compact"><Search size={17} /><input placeholder="Buscar por nombre, INCI, CAS o codigo" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label>
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="en_revision">En revision</option>
          <option value="validada">Validada</option>
          <option value="archivada">Archivada</option>
        </select>
        <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Categorias</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select value={filters.family} onChange={(event) => setFilters({ ...filters, family: event.target.value })}>
          <option value="">Familias</option>
          {families.map((family) => <option key={family} value={family}>{family}</option>)}
        </select>
        <button className="secondary-button" type="submit">Filtrar</button>
      </form>

      {message ? <p className="module-message">{message}</p> : null}

      <div className="knowledge-grid">
        <section className="raw-material-table">
          <div className="section-heading"><h2>Base de conocimiento</h2><span>{rawMaterials.length} materias</span></div>
          <div className="raw-material-rows">
            {rawMaterials.map((material) => (
              <button key={material.id} className={selected?.id === material.id ? "raw-material-row selected" : "raw-material-row"} onClick={() => selectMaterial(material.id)}>
                <div><strong>{material.permanentCode}</strong><h3>{material.commonName}</h3><span>{material.inci ?? "INCI pendiente"}</span></div>
                <div className="knowledge-tags"><span>{material.category}</span><span>{material.family ?? "Sin familia"}</span></div>
                <div className="knowledge-metrics compact">
                  <span>{material.intelligence?.formulationCount ?? 0} formulas</span>
                  <span>{material.intelligence?.supplierCount ?? 0} proveedores</span>
                  <span>{material.intelligence?.documentCount ?? 0} docs</span>
                </div>
                <FieldStatusBadge status={material.status} />
              </button>
            ))}
          </div>
        </section>

        <RawMaterialQuickView rawMaterial={selected} learning={learning} onNewVersion={newVersion} onArchive={archive} />
      </div>

      {selectedVersion ? (
        <section className="knowledge-editor">
          <div className="section-heading"><h2>Ficha tecnica version {selectedVersion.versionNumber}</h2><span>{selectedVersion.status}</span></div>
          <form className="knowledge-form" onSubmit={saveVersion}>
            {(["commercialName", "commonName", "inci", "cas", "ec", "category", "family", "cosmeticFunction", "appearance", "color", "odor", "solubility", "density", "ph", "maxTemperature", "recommendedTemperature", "usageRange", "shelfLife"] as Array<keyof typeof emptyVersion>).map((key) => (
              <label key={key}>{key}<input disabled={!editable} value={form[key]} onChange={(event) => setField(key, event.target.value)} /></label>
            ))}
            {(["description", "storageConditions", "contraindications", "compatibilities", "incompatibilities", "allergens", "observations", "examplesOfUse", "evidenceSummary"] as Array<keyof typeof emptyVersion>).map((key) => (
              <label key={key}>{key}<textarea disabled={!editable} value={form[key]} onChange={(event) => setField(key, event.target.value)} /></label>
            ))}
            <div className="draft-actions">
              <button className="secondary-button" disabled={!editable} type="submit">Guardar borrador</button>
              <button className="secondary-button" disabled={!editable} type="button" onClick={submitReview}>Enviar a revision</button>
              <button className="primary-button" disabled={!editable} type="button" onClick={approve}>Validar ficha</button>
            </div>
          </form>
        </section>
      ) : null}
    </main>
  );
}
