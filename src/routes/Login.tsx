import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelButton } from "../components/ui/PixelButton";
import { PixelInput, PixelLabel } from "../components/ui/PixelInput";

export function Login() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError(error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <PixelPanel className="w-full max-w-sm">
        <h1 className="font-pixel text-lg text-accent text-center mb-1">HabitCraft</h1>
        <p className="text-center text-ink-dim mb-6">craft your streaks</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <PixelLabel>Email</PixelLabel>
            <PixelInput
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <PixelLabel>Senha</PixelLabel>
            <PixelInput
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <PixelButton type="submit" color="grass" className="w-full" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </PixelButton>
        </form>
      </PixelPanel>
    </div>
  );
}
