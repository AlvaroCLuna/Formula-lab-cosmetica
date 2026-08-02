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

export function AppShell({ user, activeView, onNavigate, onLogout, children }: Props) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div className="app-shell" data-theme={theme}>
      <Sidebar activeView={activeView} onNavigate={onNavigate} />
      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Organización demo</p>
            <h1>Inteligencia de Insumos</h1>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={16} />
              <input aria-label="Búsqueda rápida" placeholder="Buscar documentos, campos o evidencia" />
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
