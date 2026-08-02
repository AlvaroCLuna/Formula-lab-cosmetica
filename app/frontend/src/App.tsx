import { useEffect, useState } from "react";
import type { User } from "./types";
import { api } from "./api/client";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { IngredientIntelligencePage } from "./pages/IngredientIntelligencePage";
import { FormulationListPage } from "./pages/FormulationListPage";

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
      {view === "formulaciones" ? <FormulationListPage /> : <IngredientIntelligencePage />}
    </AppShell>
  );
}
