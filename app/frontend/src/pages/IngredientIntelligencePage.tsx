import { useEffect, useMemo, useState } from "react";
import type { Draft, LoadedDocument } from "../types";
import { api } from "../api/client";
import { DocumentList } from "../components/DocumentList";
import { ExtractedFieldPreview } from "../components/ExtractedFieldPreview";
import { UploadDropzone } from "../components/UploadDropzone";

export function IngredientIntelligencePage() {
  const [documents, setDocuments] = useState<LoadedDocument[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function refresh() {
    const [documentsResponse, draftResponse] = await Promise.all([api.listDocuments(), api.latestDraft()]);
    setDocuments(documentsResponse.documents);
    setDraft(draftResponse.draft);
    setSelectedId((current) => current ?? documentsResponse.documents[0]?.id ?? null);
  }

  useEffect(() => {
    void refresh().catch((error) => setMessage(error instanceof Error ? error.message : "No se pudo cargar el módulo."));
  }, []);

  const selectedDocument = useMemo(() => documents.find((document) => document.id === selectedId) ?? null, [documents, selectedId]);

  async function upload(files: File[]) {
    await api.uploadDocuments(files);
    await refresh();
  }

  async function updateValue(id: string, value: string) {
    await api.updateExtractedValue(id, value);
    await refresh();
  }

  async function draftAction(action: "guardar_borrador" | "aprobar" | "rechazar") {
    if (!draft) {
      return;
    }
    await api.draftAction(draft.id, action);
    setMessage(action === "aprobar" ? "Ficha aprobada con snapshot de versión." : "Acción registrada en historial.");
    await refresh();
  }

  return (
    <main className="intelligence-grid">
      <div className="left-column">
        <UploadDropzone onUpload={upload} />
        {message ? <p className="module-message">{message}</p> : null}
        <DocumentList documents={documents} selectedId={selectedId} onSelect={setSelectedId} />
        {selectedDocument?.rejectionReason ? <p className="module-warning">{selectedDocument.rejectionReason}</p> : null}
      </div>
      <ExtractedFieldPreview draft={draft} onUpdate={updateValue} onAction={draftAction} />
    </main>
  );
}
