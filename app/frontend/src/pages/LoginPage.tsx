import { FormEvent, useState } from "react";
import { FlaskConical } from "lucide-react";
import { api } from "../api/client";
import type { User } from "../types";

type Props = {
  onLogin: (user: User) => void;
};

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("demo@formulalab.local");
  const [password, setPassword] = useState("FormulaLab2026!");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await api.login(email, password);
      api.setToken(response.token);
      onLogin(response.user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecovery() {
    setLoading(true);
    try {
      const response = await api.prepareRecovery(email);
      setMessage(response.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo preparar la recuperación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-layout">
      <section className="login-hero">
        <div className="brand-mark">
          <FlaskConical size={28} />
        </div>
        <h1>Formula Lab Cosmética</h1>
        <p>ERP de conocimiento técnico, evidencia documental y revisión trazable para formulación cosmética.</p>
        <div className="learning-note">
          <strong>Modo aprendizaje</strong>
          <span>Cada dato técnico conserva fuente, evidencia y confianza antes de aprobarse.</span>
        </div>
      </section>
      <form className="login-panel" onSubmit={handleLogin}>
        <h2>Iniciar sesión</h2>
        <label>
          Correo
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
        </label>
        {message ? <p className="form-message">{message}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Validando..." : "Entrar"}
        </button>
        <button className="ghost-button" disabled={loading} type="button" onClick={handleRecovery}>
          Preparar recuperación
        </button>
      </form>
    </main>
  );
}
