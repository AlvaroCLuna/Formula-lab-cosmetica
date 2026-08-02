import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { api } from "../api/client";
import type { FormulationComparison, FormulationFamily, FormulationVersion, LearningCard } from "../types";
import { FormulationDraftPage } from "./FormulationDraftPage";
import { FormulationQuickView } from "../components/FormulationQuickView";
import { FormulationTable } from "../components/FormulationTable";
import { VersionCompareView } from "../components/VersionCompareView";

const emptyCreateForm = {
  name: "",
  category: "",
  objective: "",
  notes: ""
};

export function FormulationListPage() {
  const [formulations, setFormulations] = useState<FormulationFamily[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quickCards, setQuickCards] = useState<LearningCard[]>([]);
  const [filters, setFilters] = useState({ search: "", status: "", category: "" });
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editing, setEditing] = useState<FormulationFamily | null>(null);
  const [versions, setVersions] = useState<FormulationVersion[]>([]);
  const [baseVersionId, setBaseVersionId] = useState("");
  const [targetVersionId, setTargetVersionId] = useState("");
  const [comparison, setComparison] = useState<FormulationComparison | null>(null);
  const [message, setMessage] = useState("");

  const selected = useMemo(() => formulations.find((item) => item.id === selectedId) ?? null, [formulations, selectedId]);
  const categories = useMemo(() => Array.from(new Set(formulations.map((item) => item.category))).sort(), [formulations]);

  async function loadFormulations(nextFilters = filters) {
    const response = await api.listFormulations(nextFilters);
    setFormulations(response.formulations);
    if (!selectedId && response.formulations[0]) {
      await selectFormulation(response.formulations[0].id);
    }
  }

  async function selectFormulation(id: string) {
    setSelectedId(id);
    setComparison(null);
    const [quick, versionResponse] = await Promise.all([api.quickView(id), api.listVersions(id)]);
    setQuickCards(quick.learningCards);
    setVersions(versionResponse.versions);
    setBaseVersionId(versionResponse.versions[1]?.id ?? "");
    setTargetVersionId(versionResponse.versions[0]?.id ?? "");
  }

  useEffect(() => {
    loadFormulations().catch((error) => setMessage(error instanceof Error ? error.message : "No se pudo cargar formulaciones."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilters(event: FormEvent) {
    event.preventDefault();
    setSelectedId(null);
    setQuickCards([]);
    await loadFormulations(filters);
  }

  async function createDraft(event: FormEvent) {
    event.preventDefault();
    const response = await api.createFormulation(createForm);
    setCreateForm(emptyCreateForm);
    setMessage("Formulacion creada como borrador.");
    await loadFormulations();
    await selectFormulation(response.formulation.id);
    setEditing(response.formulation);
  }

  async function createNewVersion(formulation: FormulationFamily) {
    try {
      await api.createVersion(formulation.id);
      setMessage("Nueva version creada desde la aprobada vigente.");
      await loadFormulations();
      await selectFormulation(formulation.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la nueva version.");
    }
  }

  async function compare() {
    if (!selectedId || !baseVersionId || !targetVersionId) return;
    const response = await api.saveComparison(selectedId, baseVersionId, targetVersionId);
    setComparison(response.comparison);
    setMessage("Comparacion generada y auditada.");
  }

  async function refreshCurrent() {
    await loadFormulations();
    if (selectedId) {
      await selectFormulation(selectedId);
    }
  }

  return (
    <main className="formulations-page">
      <section className="module-hero">
        <div>
          <p className="eyebrow">Incremento 2</p>
          <h1>Gestor de Formulaciones</h1>
          <p>Listado, versionado, aprobacion e ingredientes por fase conectados con materias primas maestras.</p>
        </div>
        <form className="create-formulation" onSubmit={createDraft}>
          <input required placeholder="Nombre de formulacion" value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} />
          <input required placeholder="Categoria" value={createForm.category} onChange={(event) => setCreateForm({ ...createForm, category: event.target.value })} />
          <button className="primary-button" type="submit">
            <Plus size={17} />
            Crear borrador
          </button>
        </form>
      </section>

      <form className="filters-bar" onSubmit={applyFilters}>
        <label className="search-box compact">
          <Search size={17} />
          <input placeholder="Buscar por nombre o codigo" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        </label>
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="en_desarrollo">En desarrollo</option>
          <option value="archivada">Archivada</option>
        </select>
        <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Todas las categorias</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button className="secondary-button" type="submit">Filtrar</button>
      </form>

      {message ? <p className="module-message">{message}</p> : null}

      <div className="formulations-grid">
        <div className="left-column">
          <FormulationTable
            formulations={formulations}
            selectedId={selectedId}
            onSelect={selectFormulation}
            onEditDraft={setEditing}
            onNewVersion={createNewVersion}
          />
          {editing ? <FormulationDraftPage formulation={editing} onClose={() => setEditing(null)} onChanged={refreshCurrent} /> : null}
          {versions.length > 1 ? (
            <VersionCompareView
              versions={versions}
              comparison={comparison}
              baseVersionId={baseVersionId}
              targetVersionId={targetVersionId}
              onBaseChange={setBaseVersionId}
              onTargetChange={setTargetVersionId}
              onCompare={compare}
            />
          ) : null}
        </div>
        <FormulationQuickView formulation={selected} learningCards={quickCards} onCompare={compare} />
      </div>
    </main>
  );
}
