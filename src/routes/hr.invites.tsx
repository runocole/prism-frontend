import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Users, Copy, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getInvites,
  sendInvite,
  sendBatchInvites,
  type APIInvite,
} from "@/services/invites.service";
import { getTests, type APITest } from "@/services/assessments.service";

export const Route = createFileRoute("/hr/invites")({
  head: () => ({ meta: [{ title: "Invites — OTIC" }] }),
  loader: async () => {
    const [invites, tests] = await Promise.all([
      getInvites(),
      getTests(),
    ]);
    return { invites, tests };
  },
  component: Invites,
});

type StatusFilter = APIInvite["status"] | "all";

const statusBadge: Record<APIInvite["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  active: "bg-warning/15 text-warning-foreground",
  submitted: "bg-success/15 text-success",
  expired: "bg-destructive/10 text-destructive",
};

function Invites() {
  const { invites: initial, tests } = Route.useLoaderData();
  const [invites, setInvites] = useState<APIInvite[]>(initial);
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [jobRoleFilter, setJobRoleFilter] = useState("all");

  const jobRoles = [...new Set(invites.map((i) => i.test_job_role).filter(Boolean))];

  const filtered = invites.filter((i) => {
  const statusMatch = filter === "all" || i.status === filter;
  const roleMatch = jobRoleFilter === "all" || i.test_job_role === jobRoleFilter;
  return statusMatch && roleMatch;
});

  const counts: Record<StatusFilter, number> = {
    all: invites.length,
    pending: invites.filter((i) => i.status === "pending").length,
    active: invites.filter((i) => i.status === "active").length,
    submitted: invites.filter((i) => i.status === "submitted").length,
    expired: invites.filter((i) => i.status === "expired").length,
  };

  const onInviteSent = (newInvites: APIInvite[]) => {
    setInvites((prev) => [...newInvites, ...prev]);
    setOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Candidate management
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Invites</h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep"
        >
          <Send className="h-4 w-4" /> Send invites
        </button>
      </div>

      {/* Status tabs */}
      <div className="mt-8 flex items-center gap-1 border-b border-border">
        {(["all", "pending", "active", "submitted", "expired"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm capitalize transition-colors -mb-px",
              filter === f
                ? "border-navy text-navy font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
              {counts[f]}
            </span>
          </button>
        ))}
      </div>
    {/* Job role filter */}
{jobRoles.length > 0 && (
  <div className="mt-4 flex items-center gap-2">
    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
      Role:
    </span>
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => setJobRoleFilter("all")}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
          jobRoleFilter === "all"
            ? "bg-navy text-navy-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground",
        )}
      >
        All roles
      </button>
      {jobRoles.map((role) => (
        <button
          key={role}
          onClick={() => setJobRoleFilter(role)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            jobRoleFilter === role
              ? "bg-navy text-navy-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {role}
        </button>
      ))}
    </div>
  </div>
)}
     {/* Table */}
      <div className="mt-6 rounded-lg border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Candidate</th>
              <th className="px-5 py-3 font-medium">Test</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Sent</th>
              <th className="px-5 py-3 font-medium">Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-border last:border-0 hover:bg-muted/40"
              >
                <td className="px-5 py-4">
                  <div className="font-medium">{inv.candidate_name}</div>
                  <div className="text-xs text-muted-foreground">{inv.candidate_email}</div>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{inv.test_title}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                      statusBadge[inv.status],
                    )}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-muted-foreground">
                  {new Date(inv.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  <CopyLink url={inv.invite_url} token={inv.token} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  No invites match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <InviteModal
          tests={tests.filter((t: APITest) => t.status === "published")}
          mode={mode}
          setMode={setMode}
          onClose={() => setOpen(false)}
          onSent={onInviteSent}
        />
      )}
    </div>
  );
}

function CopyLink({ url, token }: { url: string; token: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs hover:bg-muted"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      /c/{token.toString().slice(0, 8)}
    </button>
  );
}

function InviteModal({
  tests,
  mode,
  setMode,
  onClose,
  onSent,
}: {
  tests: APITest[];
  mode: "single" | "batch";
  setMode: (m: "single" | "batch") => void;
  onClose: () => void;
  onSent: (invites: APIInvite[]) => void;
}) {
  const [testId, setTestId] = useState<number>(tests[0]?.id ?? 0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [batchText, setBatchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);

    try {
      if (mode === "single") {
        const invite = await sendInvite({
          test_id: testId,
          candidate_name: name.trim(),
          candidate_email: email.trim(),
        });
        onSent([invite]);
      } else {
        // Parse "Name, email" lines
        const candidates = batchText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [n, ...rest] = line.split(",");
            return { name: n.trim(), email: rest.join(",").trim() };
          })
          .filter((c) => c.name && c.email);

        if (candidates.length === 0) {
          setError("No valid candidates found. Use format: Name, email");
          setLoading(false);
          return;
        }

        const result = await sendBatchInvites({ test_id: testId, candidates });
        onSent(result.invites);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Failed to send invite. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-navy-deep/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-card shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-lg font-semibold">Send invites</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Single / Batch toggle */}
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
            {(["single", "batch"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors",
                  mode === m
                    ? "bg-card shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "single" ? "Single" : <><Users className="mr-1.5 inline h-3.5 w-3.5" />Batch</>}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Test selector */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Test
              </label>
              {tests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No published tests yet. Publish a test first.
                </p>
              ) : (
                <select
                  value={testId}
                  onChange={(e) => setTestId(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                >
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {mode === "single" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
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
                    className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Candidates · one per line as "Name, email"
                </label>
                <textarea
                  rows={6}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={"Amelia Rivers, amelia@example.com\nMarcus Chen, marcus@example.com"}
                  className="w-full resize-none rounded-md border border-input bg-card px-3 py-2.5 font-mono text-xs outline-none ring-ring focus:ring-2"
                />
              </div>
            )}

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || tests.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {loading ? "Sending…" : `Send ${mode === "batch" ? "all" : "invite"}`}
          </button>
        </div>
      </div>
    </div>
  );
}