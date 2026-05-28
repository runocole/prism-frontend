import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Users, Send, Clock, ClipboardCheck, Briefcase,
  ArrowUpRight, CheckCircle2, XCircle, Circle,
  FileSearch, ShieldAlert, TrendingUp, ChevronRight,
} from "lucide-react";
import { getSessions } from "@/services/sessions.service";
import { getTests } from "@/services/assessments.service";
import { getUser } from "@/lib/auth";
import { authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { APISession } from "@/services/sessions.service";
import type { APITest } from "@/services/assessments.service";

const API = import.meta.env.VITE_API_URL;

interface JobStats {
  total: number;
  open: number;
  total_applications: number;
  pending: number;
  screened_in: number;
  screened_out: number;
  blacklisted: number;
  invited: number;
}

export const Route = createFileRoute("/hr/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — OTIC" }] }),
  loader: async () => {
    const [sessions, tests] = await Promise.all([getSessions(), getTests()]);
    return { sessions, tests };
  },
  component: Dashboard,
});

type StatusKey = "pending" | "in_progress" | "submitted" | "timed_out";
type StyleEntry = { label: string; cls: string; Icon: (props: { className?: string }) => ReactNode };

const statusStyle: Record<StatusKey, StyleEntry> = {
  pending: { label: "Pending", cls: "bg-muted text-muted-foreground", Icon: Circle },
  in_progress: { label: "In progress", cls: "bg-warning/15 text-warning-foreground", Icon: Clock },
  submitted: { label: "Submitted", cls: "bg-success/15 text-success", Icon: CheckCircle2 },
  timed_out: { label: "Timed out", cls: "bg-destructive/10 text-destructive", Icon: XCircle },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { sessions, tests } = Route.useLoaderData();
  const user = getUser();
  const firstName = user?.first_name || user?.email?.split("@")[0] || "there";

  const [jobStats, setJobStats] = useState<JobStats>({
    total: 0, open: 0, total_applications: 0,
    pending: 0, screened_in: 0, screened_out: 0,
    blacklisted: 0, invited: 0,
  });

  useEffect(() => {
    authFetch(`${API}/jobs/`)
      .then((r) => r.json())
      .then((d) => {
        const jobs = d.data ?? [];
        const stats: JobStats = {
          total: jobs.length,
          open: jobs.filter((j: { status: string }) => j.status === "open").length,
          total_applications: jobs.reduce((sum: number, j: { application_count: number }) => sum + (j.application_count ?? 0), 0),
          pending: 0, screened_in: 0, screened_out: 0, blacklisted: 0, invited: 0,
        };
        setJobStats(stats);

        // Load application statuses
        Promise.all(
          jobs.map((j: { id: number }) =>
            authFetch(`${API}/jobs/${j.id}/applications/`).then((r) => r.json()),
          ),
        ).then((results) => {
          let pending = 0, screened_in = 0, screened_out = 0, blacklisted = 0, invited = 0;
          for (const res of results) {
            for (const app of res.data ?? []) {
              if (app.status === "pending") pending++;
              else if (app.status === "screened_in") screened_in++;
              else if (app.status === "screened_out") screened_out++;
              else if (app.status === "blacklisted") blacklisted++;
              else if (app.status === "invited") invited++;
            }
          }
          setJobStats((prev) => ({ ...prev, pending, screened_in, screened_out, blacklisted, invited }));
        });
      });
  }, []);

  const publishedTests = tests.filter((t: APITest) => t.status === "published").length;
  const submittedSessions = sessions.filter((s: APISession) => s.status === "submitted").length;
  const inProgressSessions = sessions.filter((s: APISession) => s.status === "in_progress").length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Overview</div>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight lg:text-3xl">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening across your recruitment pipeline.
          </p>
        </div>
        <Link
          to="/hr/jobs"
          className="hidden items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-deep sm:inline-flex"
        >
          Post a job
        </Link>
      </div>

      {/* Pipeline overview */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Recruitment pipeline</h2>
          <Link to="/hr/jobs" className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline">
            Manage jobs <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PipelineCard
            label="Applications"
            value={jobStats.total_applications}
            sub={`${jobStats.open} open position${jobStats.open !== 1 ? "s" : ""}`}
            icon={Users}
            color="navy"
            to="/hr/jobs"
          />
          <PipelineCard
            label="Screened in"
            value={jobStats.screened_in}
            sub={`${jobStats.screened_out} screened out`}
            icon={FileSearch}
            color="success"
            to="/hr/screening"
          />
          <PipelineCard
            label="Invited to test"
            value={jobStats.invited}
            sub={`${jobStats.pending} pending screening`}
            icon={Send}
            color="warning"
            to="/hr/invites"
          />
          <PipelineCard
            label="Awaiting review"
            value={submittedSessions}
            sub={`${inProgressSessions} in progress`}
            icon={ClipboardCheck}
            color="destructive"
            to="/hr/results"
          />
        </div>
      </div>

      {/* Two columns — quick stats + recent activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">

        {/* Left — quick stats */}
        <div className="space-y-4 lg:col-span-1">

          {/* Screening breakdown */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Screening breakdown</h3>
              <Link to="/hr/screening" className="text-xs text-navy hover:underline">View</Link>
            </div>
            <div className="space-y-3">
              {[
                { label: "Pending", value: jobStats.pending, cls: "bg-muted" },
                { label: "Screened in", value: jobStats.screened_in, cls: "bg-success" },
                { label: "Screened out", value: jobStats.screened_out, cls: "bg-destructive" },
                { label: "Blacklisted", value: jobStats.blacklisted, cls: "bg-destructive/50" },
                { label: "Invited", value: jobStats.invited, cls: "bg-navy" },
              ].map(({ label, value, cls }) => {
                const total = jobStats.total_applications || 1;
                const pct = Math.round((value / total) * 100);
                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-medium">{value}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div className={cn("h-1.5 rounded-full transition-all", cls)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assessments */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Assessments</h3>
              <Link to="/hr/tests" className="text-xs text-navy hover:underline">View</Link>
            </div>
            <div className="space-y-2">
              {[
                { label: "Published tests", value: publishedTests, icon: CheckCircle2, cls: "text-success" },
                { label: "Draft tests", value: tests.filter((t: APITest) => t.status === "draft").length, icon: Circle, cls: "text-muted-foreground" },
                { label: "Sessions total", value: sessions.length, icon: TrendingUp, cls: "text-navy" },
                { label: "Completed", value: submittedSessions, icon: ClipboardCheck, cls: "text-success" },
              ].map(({ label, value, icon: Icon, cls }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className={cn("h-3.5 w-3.5", cls)} />
                    {label}
                  </div>
                  <span className="font-mono text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — recent sessions */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h3 className="font-display text-sm font-semibold">Recent test sessions</h3>
                <p className="text-xs text-muted-foreground">Latest candidate activity</p>
              </div>
              <Link to="/hr/results" className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No test sessions yet</p>
                  <p className="text-xs">Post a job, screen applicants, then send invite links.</p>
                </div>
                <div className="flex gap-2">
                  <Link to="/hr/jobs" className="rounded-md bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-deep">
                    Post a job
                  </Link>
                  <Link to="/hr/screening" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    Screen applicants
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sessions.slice(0, 8).map((s: APISession) => {
                  const style = statusStyle[s.status as StatusKey] ?? statusStyle["pending"];
                  const Icon = style.Icon;
                  return (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-semibold text-navy">
                        {s.candidate_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{s.candidate_name}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", style.cls)}>
                            {style.label}
                          </span>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{s.test_title}</div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        {s.violation_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <ShieldAlert className="h-3 w-3" />
                            {s.violation_count}
                          </span>
                        )}
                        {s.status === "submitted" && (
                          <Link
                            to="/hr/results/$inviteId"
                            params={{ inviteId: String(s.id) }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline"
                          >
                            Review <ChevronRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineCard({
  label, value, sub, icon: Icon, color, to,
}: {
  label: string;
  value: number;
  sub: string;
  icon: typeof Users;
  color: "navy" | "success" | "warning" | "destructive";
  to: string;
}) {
  const colorMap = {
    navy: "bg-navy/10 text-navy",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <Link to={to as any} className="block rounded-lg border border-border bg-card p-5 shadow-soft transition-colors hover:border-navy/30 hover:bg-accent">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 font-display text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-sm font-medium">{label}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </Link>
  );
}