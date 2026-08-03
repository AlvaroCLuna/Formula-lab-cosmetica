import { useEffect, useState } from "react";
import type { User } from "./types";
import { api } from "./api/client";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { IngredientIntelligencePage } from "./pages/IngredientIntelligencePage";
import { FormulationListPage } from "./pages/FormulationListPage";
import { RawMaterialsPage } from "./pages/RawMaterialsPage";
import { CostEnginePage } from "./pages/CostEnginePage";
import { InventoryPage } from "./pages/InventoryPage";
import { ProductionPage } from "./pages/ProductionPage";
import { KnowledgeCenterPage } from "./pages/KnowledgeCenterPage";
import { KnowledgeDocumentEnginePage } from "./pages/KnowledgeDocumentEnginePage";
import { LimsPage } from "./pages/LimsPage";
import { QualityPage } from "./pages/QualityPage";
import { PurchasesPage } from "./pages/PurchasesPage";
import { SalesPage } from "./pages/SalesPage";
import { AiPage } from "./pages/AiPage";
import { BiPage } from "./pages/BiPage";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(api.getToken()));
  const [view, setView] = useState("inteligencia");

  useEffect(() => {
    if (!api.getToken()) {
      setLoading(false);
      return;
    }

    api
      .me()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => api.setToken(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="boot-screen">Cargando Formula Lab...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <AppShell
      user={user}
      activeView={view}
      onNavigate={setView}
      onLogout={() => {
        api.setToken(null);
        setUser(null);
      }}
    >
      {view === "formulaciones" ? <FormulationListPage /> : view === "materias" ? <RawMaterialsPage /> : view === "costos" ? <CostEnginePage /> : view === "compras" ? <PurchasesPage /> : view === "ventas" ? <SalesPage /> : view === "ia" ? <AiPage /> : view === "bi" ? <BiPage /> : view === "inventario" ? <InventoryPage /> : view === "produccion" ? <ProductionPage /> : view === "conocimiento" ? <KnowledgeCenterPage /> : view === "documentos" ? <KnowledgeDocumentEnginePage /> : view === "lims" ? <LimsPage /> : view === "calidad" ? <QualityPage /> : <IngredientIntelligencePage />}
    </AppShell>
  );
}
