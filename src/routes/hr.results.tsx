import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessions } from "@/services/sessions.service";
import type { APISession } from "@/services/sessions.service";
import type { ReactNode } from "react";

export const Route = createFileRoute("/hr/results")({
  head: () => ({ meta: [{ title: "Results — OTIC" }] }),
  loader: async () => {
    const sessions = await getSessions();
    return { sessions: sessions.filter((s: APISession) => s.status === "submitted") };
  },
  component: Results,
});

type DecisionKey = "pass" | "fail" | "hold" | "pending";

type StyleEntry = {
  label: string;
  cls: string;
  Icon: (props: { className?: string }) => ReactNode;
};

const decisionStyle: Record<DecisionKey, StyleEntry> = {
  pass: { label: "Pass", cls: "bg-success/15 text-success", Icon: CheckCircle2 },
  fail: { label: "Fail", cls: "bg-destructive/10 text-destructive", Icon: XCircle },
  hold: { label: "Hold", cls: "bg-warning/20 text-warning-foreground", Icon: AlertCircle },
  pending: { label: "Pending review", cls: "bg-muted text-muted-foreground", Icon: AlertCircle },
};

function Results() {
  const { sessions } = Route.useLoaderData();

  return (
    <div className="p-8">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Reviewer queue
      </div>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Results</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {sessions.length} submission{sessions.length !== 1 ? "s" : ""} awaiting review
      </p>

      {sessions.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 opacity-30" />
          <p className="text-sm">All caught up — no pending submissions.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {sessions.map((session: APISession) => {
            const style = decisionStyle["pending"];
            const Icon = style.Icon;

            return (
              <Link
                key={session.id}
                to="/hr/results/$inviteId"
                params={{ inviteId: String(session.id) }}
                className="group rounded-lg border border-border bg-card p-5 shadow-soft transition-all hover:border-navy hover:shadow-elevated"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{session.candidate_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {session.candidate_email}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                      style.cls,
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {style.label}
                  </span>
                </div>

                <div className="mt-3 truncate text-xs text-muted-foreground">
                  {session.test_title}
                </div>

                {session.violation_count > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {session.violation_count} violation
                    {session.violation_count !== 1 ? "s" : ""}
                  </div>
                )}

                <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                  <div className="text-xs text-muted-foreground">
                    Submitted{" "}
                    {session.submitted_at
                      ? new Date(session.submitted_at).toLocaleDateString()
                      : "—"}
                  </div>
                  <span className="text-xs text-navy group-hover:underline">
                    Review →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}