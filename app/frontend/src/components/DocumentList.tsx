import { FileText } from "lucide-react";
import type { LoadedDocument } from "../types";
import { FieldStatusBadge } from "./FieldStatusBadge";

type Props = {
  documents: LoadedDocument[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function DocumentList({ documents, selectedId, onSelect }: Props) {
  return (
    <section className="document-list">
      <div className="section-heading">
        <h2>Archivos recibidos</h2>
        <span>{documents.length} registros</span>
      </div>
      <div className="document-rows">
        {documents.map((document) => (
          <button
            key={document.id}
            className={selectedId === document.id ? "document-row selected" : "document-row"}
            onClick={() => onSelect(document.id)}
            title="Ver evidencia extraída"
          >
            <FileText size={18} />
            <div>
              <strong>{document.originalFilename}</strong>
              <span>{Math.round(document.sizeBytes / 1024)} KB · {document.fileExtension.toUpperCase()}</span>
            </div>
            <FieldStatusBadge status={document.status} />
          </button>
        ))}
        {documents.length === 0 ? <p className="empty-state">Aún no hay documentos cargados.</p> : null}
      </div>
    </section>
  );
}
