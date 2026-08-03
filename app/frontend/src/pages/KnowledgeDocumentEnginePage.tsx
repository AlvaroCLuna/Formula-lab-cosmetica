import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileArchive, FileImage, FileText, Filter, Search, Tags, UploadCloud } from "lucide-react";
import { api } from "../api/client";
import type { KdeDocument } from "../types";
import { FieldStatusBadge } from "../components/FieldStatusBadge";

const acceptedFormats = ".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp,.tiff,.mp4,.mov,.zip";

export function KnowledgeDocumentEnginePage() {
  const [documents, setDocuments] = useState<KdeDocument[]>([]);
  const [selected, setSelected] = useState<KdeDocument | null>(null);
  const [indicators, setIndicators] = useState<any>(null);
  const [types, setTypes] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  async function load() {
    const [dashboardResponse, typesResponse, tagsResponse, docsResponse] = await Promise.all([
      api.kdeDashboard(),
      api.kdeTypes(),
      api.kdeTags(),
      api.listKdeDocuments({ q, type, status })
    ]);
    setIndicators(dashboardResponse.indicators);
    setTypes(typesResponse.types);
    setTags(tagsResponse.tags);
    setDocuments(docsResponse.documents);
    setSelected((current) => current ?? docsResponse.documents[0] ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  const groupedTypes = useMemo(() => types.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {}), [types]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setBusy(true);
    try {
      const response = await api.uploadKdeDocuments(list);
      setDocuments((current) => [...response.documents, ...current]);
      setSelected(response.documents[0]);
      const dashboardResponse = await api.kdeDashboard();
      setIndicators(dashboardResponse.indicators);
    } finally {
      setBusy(false);
    }
  }

  async function applyFilters() {
    const response = await api.listKdeDocuments({ q, type, status });
    setDocuments(response.documents);
    setSelected(response.documents[0] ?? null);
  }

  async function addDemoTag() {
    if (!selected) return;
    await api.addKdeTag(selected.id, { name: "Revision tecnica", color: "#7c3aed" });
    const response = await api.getKdeDocument(selected.id);
    setSelected(response.document);
    await applyFilters();
  }

  return (
    <div className="kde-page">
      <section className="kde-hero">
        <div>
          <p className="eyebrow">Motor Universal de Documentos</p>
          <h2>Repositorio documental oficial</h2>
          <p>Documentos versionados, trazables y preparados para alimentar conocimiento e IA sin guardar aprobaciones automaticas.</p>
        </div>
        <div className="kde-indicators">
          <span><strong>{indicators?.total ?? 0}</strong> documentos</span>
          <span><strong>{indicators?.pending ?? 0}</strong> pendientes</span>
          <span><strong>{indicators?.versioned ?? 0}</strong> versionados</span>
          <span><strong>{indicators?.indexed ?? 0}</strong> indexados</span>
        </div>
      </section>

      <section className="kde-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(event.dataTransfer.files); }}>
        <UploadCloud size={30} />
        <div>
          <h3>Carga documental KDE</h3>
          <p>PDF, DOCX, XLSX, CSV, TXT, imagenes, video y ZIP. Toda version conserva origen e historial.</p>
        </div>
        <label className="button-like">
          Seleccionar archivos
          <input hidden type="file" multiple accept={acceptedFormats} onChange={(event) => event.target.files && void upload(event.target.files)} />
        </label>
      </section>

      <section className="kde-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input value={q} placeholder="Buscar por texto, OCR, etiqueta, proveedor, INCI o norma" onChange={(event) => setQ(event.target.value)} />
        </div>
        <select value={type} onChange={(event) => setType(event.target.value)} title="Tipo documental">
          <option value="">Todos los tipos</option>
          {types.map((item) => <option key={item.id} value={item.code}>{item.category} - {item.name}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} title="Estado documental">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="procesando">Procesando</option>
          <option value="procesado">Procesado</option>
          <option value="requiere_revision">Requiere revision</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <button type="button" onClick={() => void applyFilters()}><Filter size={16} /> Filtrar</button>
        <button type="button" onClick={() => setViewMode(viewMode === "cards" ? "list" : "cards")}>{viewMode === "cards" ? "Lista" : "Tarjetas"}</button>
      </section>

      <div className="kde-layout">
        <main className={viewMode === "cards" ? "kde-card-grid" : "kde-list"}>
          {documents.map((document) => (
            <article key={document.id} className={selected?.id === document.id ? "kde-card selected" : "kde-card"} onClick={() => setSelected(document)}>
              <div className="kde-card-icon">{iconFor(document.fileExtension)}</div>
              <div>
                <strong>{document.title ?? document.originalFilename}</strong>
                <p>{document.permanentCode} · {document.documentType?.name ?? "Sin clasificar"} · {document.fileExtension.toUpperCase()}</p>
                <p>{document.summary}</p>
                <div className="chip-row">
                  <FieldStatusBadge status={document.status} />
                  <span>{document.versions?.[0] ? `v${document.versions[0].versionNumber}` : "v1"}</span>
                  <span>{document.tagLinks?.length ?? 0} tags</span>
                  <span>{document.relations?.length ?? 0} relaciones</span>
                </div>
              </div>
            </article>
          ))}
          {documents.length === 0 ? <p className="empty-state">No hay documentos con los filtros actuales.</p> : null}
        </main>

        <aside className="kde-side">
          {selected ? (
            <>
              <div className="side-header">
                <div>
                  <p className="eyebrow">{selected.permanentCode}</p>
                  <h3>{selected.title ?? selected.originalFilename}</h3>
                </div>
                <FieldStatusBadge status={selected.status} />
              </div>
              <div className="kde-actions">
                {["pdf", "txt", "csv", "png", "jpg", "jpeg", "webp"].includes(selected.fileExtension) ? <a className="button-like" href={`http://localhost:4000/kde/documents/${selected.id}/preview`} target="_blank" rel="noreferrer"><Eye size={15} /> Vista previa</a> : null}
                <a className="button-like" href={`http://localhost:4000/kde/documents/${selected.id}/preview`} target="_blank" rel="noreferrer"><Download size={15} /> Abrir</a>
                <button type="button" onClick={() => void addDemoTag()} disabled={busy}><Tags size={15} /> Etiquetar</button>
              </div>
              <dl className="kde-meta">
                <div><dt>Tipo</dt><dd>{selected.documentType?.category} / {selected.documentType?.name}</dd></div>
                <div><dt>Idioma</dt><dd>{selected.language ?? "Sin detectar"}</dd></div>
                <div><dt>Proveedor</dt><dd>{selected.supplier ?? "Sin dato"}</dd></div>
                <div><dt>Fabricante</dt><dd>{selected.manufacturer ?? "Sin dato"}</dd></div>
                <div><dt>Entidad</dt><dd>{selected.detectedEntity ?? "Sin clasificar"}</dd></div>
                <div><dt>Indexacion</dt><dd>{selected.indexingStatus}</dd></div>
              </dl>
              <h4>Etiquetas</h4>
              <div className="chip-row">
                {selected.tagLinks?.map((link) => <span key={link.tag.id} style={{ borderColor: link.tag.color }}>{link.tag.name}</span>)}
                {selected.tagLinks?.length === 0 ? <span>Sin etiquetas</span> : null}
              </div>
              <h4>Versiones</h4>
              <div className="timeline mini">
                {selected.versions?.map((version) => <div key={version.id}><strong>v{version.versionNumber}</strong><span>{version.changeReason ?? "Sin motivo"}</span></div>)}
              </div>
              <h4>Relaciones</h4>
              <div className="timeline mini">
                {selected.relations?.map((relation) => <div key={relation.id}><strong>{relation.entityType}</strong><span>{relation.relationType} · {relation.validationStatus}</span></div>)}
              </div>
              <h4>OCR / Chunks</h4>
              <p className="kde-ocr">{selected.ocrResults?.[0]?.text ?? selected.chunks?.[0]?.content ?? "Sin texto extraido."}</p>
            </>
          ) : <p className="empty-state">Selecciona un documento para ver trazabilidad, versiones y fuentes.</p>}
        </aside>
      </div>

      <section className="kde-taxonomy">
        <h3>Taxonomia documental activa</h3>
        <div className="chip-row">
          {Object.entries(groupedTypes).map(([category, count]) => <span key={category}>{category}: {count}</span>)}
          <span>Etiquetas: {tags.length}</span>
        </div>
      </section>
    </div>
  );
}

function iconFor(extension: string) {
  if (["png", "jpg", "jpeg", "webp", "tiff"].includes(extension)) return <FileImage size={20} />;
  if (["zip", "mp4", "mov"].includes(extension)) return <FileArchive size={20} />;
  return <FileText size={20} />;
}
