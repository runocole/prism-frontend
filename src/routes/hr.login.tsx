import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { login } from "@/services/auth.service";

export const Route = createFileRoute("/hr/login")({
  head: () => ({
    meta: [
      { title: "Sign in — OTIC" },
      { name: "description", content: "Sign in to the OTIC HR console." },
    ],
  }),
  component: HrLogin,
});

function HrLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate({ to: "/hr/dashboard" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="border-b border-border px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5">
          <img src="/favicon.png" alt="OTIC" className="h-9 w-auto" />
        </div>
      </header>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo mark */}
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/favicon.png" alt="OTIC" className="mb-4 h-14 w-auto" />
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your HR console
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring transition-shadow focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring transition-shadow focus:ring-2"
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-deep disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Secured by OTIC · v1.0
          </p>
        </div>
      </div>
    </div>
  );
}