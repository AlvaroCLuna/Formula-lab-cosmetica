import type { DocumentStatus, ValidationStatus } from "../types";

const labels: Record<string, string> = {
  pendiente: "Pendiente",
  procesando: "Procesando",
  procesado: "Procesado",
  requiere_revision: "Requiere revisión",
  rechazado: "Rechazado",
  validado: "Validado",
  corregido: "Corregido",
  en_conflicto: "En conflicto"
};

type Props = {
  status: DocumentStatus | ValidationStatus | "documental" | "inferido";
};

export function FieldStatusBadge({ status }: Props) {
  return <span className={`status-badge ${status}`}>{labels[status] ?? status}</span>;
}
