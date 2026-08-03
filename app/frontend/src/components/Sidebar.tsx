import { Archive, Beaker, BookOpen, Boxes, Calculator, ClipboardCheck, FileStack, FlaskConical, LayoutDashboard, LibraryBig, PackageSearch, UploadCloud } from "lucide-react";

const items = [
  { id: "panel", label: "Panel", icon: LayoutDashboard, disabled: true },
  { id: "inteligencia", label: "Inteligencia", icon: UploadCloud },
  { id: "conocimiento", label: "Conocimiento", icon: LibraryBig },
  { id: "documentos", label: "Documentos KDE", icon: Archive },
  { id: "formulaciones", label: "Formulaciones", icon: FileStack },
  { id: "materias", label: "Materias primas", icon: Boxes },
  { id: "costos", label: "Costos", icon: Calculator },
  { id: "inventario", label: "Inventario", icon: PackageSearch },
  { id: "produccion", label: "Laboratorio", icon: Beaker },
  { id: "lims", label: "LIMS", icon: ClipboardCheck },
  { id: "calidad", label: "Calidad", icon: ClipboardCheck },
  { id: "aprendizaje", label: "Aprendizaje", icon: BookOpen, disabled: true }
];

type Props = {
  activeView: string;
  onNavigate: (view: string) => void;
};

export function Sidebar({ activeView, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <FlaskConical size={25} />
        <span>Formula Lab</span>
      </div>
      <nav>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeView === item.id ? "nav-item active" : "nav-item"}
              disabled={item.disabled}
              title={item.disabled ? "Preparado para incrementos futuros" : item.label}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
