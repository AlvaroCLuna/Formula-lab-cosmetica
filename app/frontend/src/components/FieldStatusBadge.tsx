import type { DocumentStatus, ValidationStatus } from "../types";

const labels: Record<string, string> = {
  pendiente: "Pendiente",
  procesando: "Procesando",
  procesado: "Procesado",
  requiere_revision: "Requiere revision",
  rechazado: "Rechazado",
  validado: "Validado",
  corregido: "Corregido",
  en_conflicto: "En conflicto",
  borrador: "Borrador",
  en_revision: "En revision",
  aprobada: "Aprobada",
  obsoleta: "Obsoleta",
  activa: "Activa",
  en_desarrollo: "En desarrollo",
  archivada: "Archivada",
  validada: "Validada",
  documental: "Documental",
  inferido: "Inferido"
};

type Props = {
  status: DocumentStatus | ValidationStatus | "documental" | "inferido" | string;
};

export function FieldStatusBadge({ status }: Props) {
  return <span className={`status-badge ${status}`}>{labels[status] ?? status}</span>;
}
