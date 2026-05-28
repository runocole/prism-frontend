import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Camera, Maximize2, Wifi,
  Monitor, Check, AlertTriangle, Clock, ListChecks,
} from "lucide-react";
import { validateInviteToken, type ValidateInviteResponse } from "@/services/invites.service";
import { startSession } from "@/services/sessions.service";

export const Route = createFileRoute("/c/$token")({
  head: () => ({
    meta: [
      { title: "Begin assessment — OTIC" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ params }): Promise<{ invite: ValidateInviteResponse; token: string }> => {
    try {
      const invite = await validateInviteToken(params.token);
      return { invite, token: params.token };
    } catch {
      throw notFound();
    }
  },
  component: CandidateInstructions,
});

function CandidateInstructions() {
  const { invite, token } = Route.useLoaderData();
  const navigate = useNavigate();

  const [name, setName] = useState(invite.candidate_name);
  const [email, setEmail] = useState(invite.candidate_email);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = [
    { icon: Camera, label: "Webcam access", status: "ok" as const },
    { icon: Wifi, label: "Network stable", status: "ok" as const },
    { icon: Monitor, label: "Desktop browser", status: "ok" as const },
    { icon: Maximize2, label: "Full-screen ready", status: "warn" as const },
  ];

  const ready = agreed && name.trim() && email.trim() && !loading;

  const handleStart = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await startSession(token);
    window.location.href = `/c/${token}/test?session=${result.session_id}`;
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { error?: string } } })?.response?.data
        ?.error ?? "Failed to start session. Please try again.";
    setError(msg);
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-navy-gradient">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-navy-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/20">
              <img src="/favicon.png" alt="OTIC" className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-base font-semibold leading-none">OTIC</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Proctored Session
              </div>
            </div>
          </div>
          <div className="font-mono text-xs text-white/70">
            Invite · {token.toString().slice(0, 12)}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          You're invited to take
        </div>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          {invite.test.title}
        </h1>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {invite.test.duration_mins} minutes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" /> {invite.test.question_count} questions
          </span>
          <span className="rounded-full bg-warning/20 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-warning-foreground">
            One attempt only
          </span>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Identity */}
            <section className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Confirm your identity</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Full name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                  />
                </div>
              </div>
            </section>

            {/* Rules */}
            <section className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Rules of the session</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  "The session must be taken in full-screen mode. Exiting full-screen will be logged.",
                  "Your webcam will be recorded for the entire session.",
                  "Switching tabs or applications will be logged with timestamps.",
                  "Copy and paste are disabled within the test interface.",
                  "You have a single attempt. The session cannot be paused or resumed.",
                ].map((rule, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-medium text-navy-foreground">
                      {i + 1}
                    </div>
                    <span className="text-foreground/80">{rule}</span>
                  </li>
                ))}
              </ul>
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-navy"
                />
                <span>
                  I confirm my identity and agree to be recorded under the conditions above.
                </span>
              </label>
            </section>
          </div>

          {/* System check */}
          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
              <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Camera className="h-3.5 w-3.5" /> Webcam preview
              </div>
              <div className="relative aspect-video overflow-hidden rounded-md bg-navy-deep">
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center text-navy-foreground/60">
                    <div className="mx-auto mb-2 h-16 w-16 rounded-full bg-white/5 ring-2 ring-white/10" />
                    <div className="font-mono text-[10px] uppercase tracking-widest">Live preview</div>
                  </div>
                </div>
                <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-medium text-destructive-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> REC
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                System check
              </div>
              <ul className="space-y-2">
                {checks.map(({ icon: Icon, label, status }) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </span>
                    {status === "ok" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <Check className="h-3 w-3" /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-foreground">
                        <AlertTriangle className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              disabled={!ready}
              onClick={handleStart}
              className="w-full rounded-md bg-navy px-4 py-3 text-sm font-medium text-navy-foreground transition-colors hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Starting session…" : "Start proctored session"}
            </button>
            <Link
              to="/"
              className="block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel and exit
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}