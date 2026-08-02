import { ChangeEvent, useState } from "react";
import { Check, Edit3, Save, X } from "lucide-react";
import type { Draft, ExtractedValue } from "../types";
import { FieldStatusBadge } from "./FieldStatusBadge";

type Props = {
  draft: Draft | null;
  onUpdate: (id: string, value: string) => Promise<void>;
  onAction: (action: "guardar_borrador" | "aprobar" | "rechazar") => Promise<void>;
};

function FieldRow({ field, onUpdate }: { field: ExtractedValue; onUpdate: (id: string, value: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(field.value ?? "");
  const confidence = Math.round(field.confidence * 100);

  async function save() {
    await onUpdate(field.id, value);
    setEditing(false);
  }

  return (
    <article className={`field-row ${field.evidenceType} ${field.validationStatus}`}>
      <div className="field-row-head">
        <strong>{field.fieldLabel}</strong>
        <FieldStatusBadge status={field.validationStatus} />
      </div>
      {editing ? (
        <textarea value={value} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value)} />
      ) : (
        <p>{field.value || "Información insuficiente para evaluar."}</p>
      )}
      <dl>
        <div>
          <dt>Documento</dt>
          <dd>{field.sourceDocumentName}</dd>
        </div>
        <div>
          <dt>Referencia</dt>
          <dd>{field.sourceReference}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{field.dataType}</dd>
        </div>
        <div>
          <dt>Confianza</dt>
          <dd>{confidence}%</dd>
        </div>
      </dl>
      <div className="field-actions">
        <FieldStatusBadge status={field.evidenceType} />
        {editing ? (
          <button className="mini-button" onClick={save}>
            <Save size={14} />
            Guardar
          </button>
        ) : (
          <button className="mini-button" onClick={() => setEditing(true)}>
            <Edit3 size={14} />
            Corregir
          </button>
        )}
      </div>
    </article>
  );
}

export function ExtractedFieldPreview({ draft, onUpdate, onAction }: Props) {
  const fields = draft?.extractedValues ?? [];

  return (
    <aside className="field-preview">
      <div className="section-heading">
        <h2>Campos extraídos</h2>
        <span>{fields.length} evidencias</span>
      </div>
      <div className="preview-actions">
        <button className="secondary-button" disabled={!draft} onClick={() => onAction("guardar_borrador")}>
          <Save size={16} />
          Guardar borrador
        </button>
        <button className="primary-button" disabled={!draft || fields.length === 0} onClick={() => onAction("aprobar")}>
          <Check size={16} />
          Aprobar
        </button>
        <button className="danger-button" disabled={!draft} onClick={() => onAction("rechazar")}>
          <X size={16} />
          Rechazar
        </button>
      </div>
      <div className="fields-stack">
        {fields.map((field) => (
          <FieldRow key={field.id} field={field} onUpdate={onUpdate} />
        ))}
        {fields.length === 0 ? <p className="empty-state">Carga un documento con evidencia para revisar campos.</p> : null}
      </div>
    </aside>
  );
}
