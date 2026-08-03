import type { ReactNode } from "react";
import { useState } from "react";
import { Bell, Moon, Search, Sun } from "lucide-react";
import type { User } from "../types";
import { Sidebar } from "./Sidebar";
import { HybridDashboard } from "./HybridDashboard";

type Props = {
  user: User;
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  children: ReactNode;
};

const viewCopy: Record<string, { title: string; search: string }> = {
  inteligencia: { title: "Inteligencia de Insumos", search: "Buscar documentos, campos o evidencia" },
  formulaciones: { title: "Gestor de Formulaciones", search: "Buscar formulaciones, versiones o ingredientes" },
  materias: { title: "Materias Primas Maestras", search: "Buscar materias primas, INCI o funciones" },
  costos: { title: "Motor de Costos", search: "Buscar escenarios, proveedores o precios" },
  inventario: { title: "Inventario y Lotes", search: "Buscar lotes, ubicaciones o materias primas" },
  produccion: { title: "Laboratorio y Produccion", search: "Buscar ordenes, lotes o formulaciones" }
};

export function AppShell({ user, activeView, onNavigate, onLogout, children }: Props) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const currentView = viewCopy[activeView] ?? viewCopy.inteligencia;

  return (
    <div className="app-shell" data-theme={theme}>
      <Sidebar activeView={activeView} onNavigate={onNavigate} />
      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Organizacion demo</p>
            <h1>{currentView.title}</h1>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={16} />
              <input aria-label="Busqueda rapida" placeholder={currentView.search} />
            </div>
            <button className="icon-button" title="Notificaciones" aria-label="Notificaciones">
              <Bell size={18} />
            </button>
            <button
              className="icon-button theme-pair"
              title="Cambiar tema claro/oscuro"
              aria-label="Cambiar tema claro/oscuro"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            >
              {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="user-chip">
              <span>{user.fullName}</span>
              <button onClick={onLogout}>Salir</button>
            </div>
          </div>
        </header>
        <HybridDashboard />
        {children}
      </div>
    </div>
  );
}
