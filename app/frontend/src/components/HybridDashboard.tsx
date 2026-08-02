import { AlertTriangle, CheckCircle2, FileText, ShieldCheck } from "lucide-react";

const metrics = [
  { label: "Documentos recibidos", value: "Incremento 1", icon: FileText },
  { label: "Validación humana", value: "Obligatoria", icon: ShieldCheck },
  { label: "Datos sin evidencia", value: "No se inventan", icon: AlertTriangle },
  { label: "Versionado", value: "Aprobación crea snapshot", icon: CheckCircle2 }
];

export function HybridDashboard() {
  return (
    <section className="hybrid-dashboard">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article className="metric-card" key={metric.label}>
            <Icon size={18} />
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}
