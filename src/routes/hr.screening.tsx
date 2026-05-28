import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ChevronRight, Users, CheckCircle2, XCircle, Ban,
  Play, Loader2, ThumbsUp, Mail, Settings, ChevronDown,
  ChevronUp, FileText, ExternalLink,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

interface JobPost {
  id: number;
  title: string;
  department: string;
  status: string;
  application_count: number;
  screening_questions: string[];
  preferred_answers: Record<string, string[]>;
}

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_2?: string;
  cv: string;
  cover_letter: string;
  status: string;
  ai_summary: string;
  screening_answers: Record<string, string>;
  submitted_at: string;
}

const SCREENING_LABELS: Record<string, string> = {
  state_of_residence: "State of residence",
  age_range: "Age range",
  nysc_completion: "NYSC completion",
  years_of_experience: "Years of experience",
  currently_employed: "Currently employed",
  reason_for_leaving: "Reason for leaving",
  salary_expectation: "Salary expectation",
  available_to_resume: "Available to resume",
  willing_to_relocate: "Willing to relocate",
};

const SCREENING_OPTIONS: Record<string, string[]> = {
  state_of_residence: [],
  age_range: ["18-20", "21-25", "26-30", "31-35", "35+"],
  nysc_completion: ["Yes", "No"],
  years_of_experience: ["None", "1-3 years", "3-5 years", "5+ years"],
  currently_employed: ["Yes", "No"],
  reason_for_leaving: [
    "Better career opportunity", "Higher compensation", "Relocation",
    "Company instability", "Career change", "Redundancy / Layoff",
    "Contract ended", "Personal reasons", "Other",
  ],
  salary_expectation: [],
  available_to_resume: ["Immediately", "1 week", "2 weeks", "1 month", "3 months", "More than 3 months"],
  willing_to_relocate: ["Yes", "No"],
};

export const Route = createFileRoute("/hr/screening")({
  head: () => ({ meta: [{ title: "Screening — OTIC" }] }),
  loader: async (): Promise<{ jobs: JobPost[] }> => {
    const res = await authFetch(`${API}/jobs/`);
    const data = await res.json();
    const jobs = (data.data ?? []).filter((j: JobPost) => j.status === "open");
    return { jobs };
  },
  component: ScreeningPage,
});

function ScreeningPage() {
  const { jobs } = Route.useLoaderData();
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [screening, setScreening] = useState(false);
  const [screenResult, setScreenResult] = useState<{
    screened_in: number; screened_out: number; blacklisted: number; total: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "screened_in" | "screened_out" | "blacklisted" | "pending">("all");
  const [showPreferred, setShowPreferred] = useState(false);
  const [preferredAnswers, setPreferredAnswers] = useState<Record<string, string[]>>({});
  const [savingPreferred, setSavingPreferred] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Grouped by department
  const grouped = jobs.reduce<Record<string, JobPost[]>>((acc, job) => {
    const dept = job.department || "Other";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(job);
    return acc;
  }, {});

  const loadApplications = async (job: JobPost) => {
    setSelectedJob(job);
    setLoadingApps(true);
    setScreenResult(null);
    setActiveTab("all");
    setPreferredAnswers(job.preferred_answers ?? {});
    try {
      const res = await authFetch(`${API}/jobs/${job.id}/applications/`);
      const data = await res.json();
      setApplications(data.data ?? []);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleScreen = async () => {
    if (!selectedJob) return;
    setScreening(true);
    try {
      const res = await authFetch(`${API}/jobs/${selectedJob.id}/screen/`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setScreenResult(data.data);
        const res2 = await authFetch(`${API}/jobs/${selectedJob.id}/applications/`);
        const data2 = await res2.json();
        setApplications(data2.data ?? []);
        setActiveTab("screened_in");
      }
    } finally {
      setScreening(false);
    }
  };

  const handleManualScreenIn = async (appId: number) => {
    if (!selectedJob) return;
    const res = await authFetch(
      `${API}/jobs/${selectedJob.id}/applications/${appId}/screen-in/`,
      { method: "POST" },
    );
    const data = await res.json();
    if (data.success) {
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "screened_in" } : a)),
      );
    }
  };

  const handleSavePreferred = async () => {
    if (!selectedJob) return;
    setSavingPreferred(true);
    try {
      await authFetch(`${API}/jobs/${selectedJob.id}/preferred-answers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_answers: preferredAnswers }),
      });
      setShowPreferred(false);
    } finally {
      setSavingPreferred(false);
    }
  };

  const togglePreferredAnswer = (key: string, value: string) => {
    setPreferredAnswers((prev) => {
      const current = prev[key] ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const filteredApps = applications.filter((a) =>
    activeTab === "all" ? true : a.status === activeTab,
  );

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    screened_in: applications.filter((a) => a.status === "screened_in").length,
    screened_out: applications.filter((a) => a.status === "screened_out").length,
    blacklisted: applications.filter((a) => a.status === "blacklisted").length,
  };

  const statusBadge: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-muted text-muted-foreground", label: "Pending" },
    screening: { cls: "bg-warning/15 text-warning-foreground", label: "Screening" },
    screened_in: { cls: "bg-success/15 text-success", label: "Screened in" },
    screened_out: { cls: "bg-destructive/10 text-destructive", label: "Screened out" },
    blacklisted: { cls: "bg-destructive/20 text-destructive font-medium", label: "Blacklisted" },
    invited: { cls: "bg-warning/15 text-warning-foreground", label: "Invited" },
  };

  // Build the effective set of screening question keys to show in preferred-answers panel.
  // Always include willing_to_relocate if state_of_residence is a question (since non-Lagos
  // applicants will be asked it). Deduplicate to avoid double-rendering.
  const preferredAnswerKeys: string[] = (() => {
    if (!selectedJob) return [];
    const keys = [...selectedJob.screening_questions];
    if (keys.includes("state_of_residence") && !keys.includes("willing_to_relocate")) {
      const stateIdx = keys.indexOf("state_of_residence");
      keys.splice(stateIdx + 1, 0, "willing_to_relocate");
    }
    return keys;
  })();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left — job list */}
      <div className="w-72 flex-shrink-0 overflow-y-auto border-r border-border bg-muted/30 p-4">
        <div className="mb-4">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Open positions
          </div>
          <h2 className="mt-1 font-display text-lg font-semibold">Screening</h2>
        </div>

        {jobs.length === 0 && (
          <p className="text-xs text-muted-foreground">No open jobs found.</p>
        )}

        {Object.entries(grouped).map(([dept, deptJobs]) => (
          <div key={dept} className="mb-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <ChevronRight className="h-3.5 w-3.5" />
              {dept}
            </div>
            <div className="space-y-1">
              {deptJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => loadApplications(job)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                    selectedJob?.id === job.id
                      ? "border-navy bg-navy/5 font-medium"
                      : "border-transparent hover:border-border hover:bg-card",
                  )}
                >
                  <div className="font-medium">{job.title}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {job.application_count} applicants
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right — applications */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!selectedJob ? (
          <div className="grid h-full place-items-center text-muted-foreground">
            <div className="text-center">
              <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Select a job to start screening</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold">{selectedJob.title}</h2>
                  <p className="text-xs text-muted-foreground">{selectedJob.department}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreferred(!showPreferred)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Preferred answers
                    {showPreferred ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    onClick={handleScreen}
                    disabled={screening || counts.pending === 0}
                    className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-60"
                  >
                    {screening ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Screening…</>
                    ) : (
                      <><Play className="h-4 w-4" /> Screen {counts.pending} applicants</>
                    )}
                  </button>

                  {counts.screened_in > 0 && (
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:bg-success/90"
                    >
                      <Mail className="h-4 w-4" />
                      Email {counts.screened_in} screened in
                    </button>
                  )}
                </div>
              </div>

              {/* Screen result banner */}
              {screenResult && (
                <div className="mt-3 flex items-center gap-4 rounded-md bg-muted/50 px-4 py-2.5 text-sm">
                  <span className="font-medium">Screening complete:</span>
                  <span className="text-success">✓ {screenResult.screened_in} screened in</span>
                  <span className="text-destructive">✗ {screenResult.screened_out} screened out</span>
                  {screenResult.blacklisted > 0 && (
                    <span className="text-destructive font-medium">
                      ⊘ {screenResult.blacklisted} blacklisted
                    </span>
                  )}
                </div>
              )}

              {/* Preferred answers panel */}
              {showPreferred && (
                <div className="mt-4 rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 text-sm font-semibold">
                    Set preferred answers — candidates not matching will be screened out
                  </h3>
                  <div className="space-y-4">
                    {preferredAnswerKeys.map((key) => {
                      const options = SCREENING_OPTIONS[key] ?? [];

                      if (key === "salary_expectation") {
                        return (
                          <div key={key}>
                            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Maximum acceptable salary (₦)
                            </div>
                            <input
                              type="text"
                              value={(preferredAnswers[key] ?? [])[0] ?? ""}
                              onChange={(e) =>
                                setPreferredAnswers((prev) => ({
                                  ...prev,
                                  [key]: [e.target.value],
                                }))
                              }
                              placeholder="e.g. 300000"
                              className="w-64 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              Candidates expecting more than this will be screened out.
                            </p>
                          </div>
                        );
                      }

                      // state_of_residence has no options array — skip in preferred answers
                      if (options.length === 0) return null;

                      return (
                        <div key={key}>
                          <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {SCREENING_LABELS[key] ?? key}
                            <span className="ml-1 normal-case text-muted-foreground/60">
                              (select all acceptable answers)
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {options.map((opt) => {
                              const selected = (preferredAnswers[key] ?? []).includes(opt);
                              return (
                                <button
                                  key={opt}
                                  onClick={() => togglePreferredAnswer(key, opt)}
                                  className={cn(
                                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                                    selected
                                      ? "bg-navy text-navy-foreground"
                                      : "bg-muted text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setShowPreferred(false)}
                      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePreferred}
                      disabled={savingPreferred}
                      className="rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-60"
                    >
                      {savingPreferred ? "Saving…" : "Save preferences"}
                    </button>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="mt-4 flex items-center gap-1 border-b border-border">
                {(["all", "pending", "screened_in", "screened_out", "blacklisted"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "border-b-2 px-3 py-2 text-xs capitalize transition-colors -mb-px",
                      activeTab === tab
                        ? "border-navy text-navy font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.replace("_", " ")}
                    <span className="ml-1 font-mono">{counts[tab]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Application list */}
            <div className="flex-1 overflow-y-auto">
              {loadingApps ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  No applications in this category.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredApps.map((app) => {
                    const badge = statusBadge[app.status] ?? statusBadge["pending"];
                    return (
                      <div key={app.id} className="px-6 py-4 hover:bg-muted/30">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">
                                {app.first_name} {app.last_name}
                              </span>
                              <span className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                badge.cls,
                              )}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {app.email}
                              {app.phone && (
                                <span className="ml-1">
                                  · {app.phone}
                                  {app.phone_2 && <span className="ml-1 text-muted-foreground/60">/ {app.phone_2}</span>}
                                </span>
                              )}
                            </div>

                            {/* AI summary */}
                            {app.ai_summary && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">AI: </span>
                                {app.ai_summary}
                              </div>
                            )}

                            {/* Screening answers */}
                            {Object.keys(app.screening_answers ?? {}).length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {Object.entries(app.screening_answers).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                                  >
                                    {SCREENING_LABELS[k] ?? k}: <strong>{v}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <a
                              href={`${API}${app.cv}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted"
                            >
                              <FileText className="h-3.5 w-3.5" /> CV
                            </a>
                            <a
                              href={`${API}${app.cover_letter}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Letter
                            </a>
                            {app.status === "screened_out" && (
                              <button
                                onClick={() => handleManualScreenIn(app.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/20"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" /> Screen in
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Batch email modal */}
      {showEmailModal && selectedJob && (
        <BatchEmailModal
          job={selectedJob}
          count={counts.screened_in}
          onClose={() => setShowEmailModal(false)}
          onSent={() => {
            setShowEmailModal(false);
            loadApplications(selectedJob);
          }}
        />
      )}
    </div>
  );
}

function BatchEmailModal({
  job,
  count,
  onClose,
  onSent,
}: {
  job: JobPost;
  count: number;
  onClose: () => void;
  onSent: () => void;
}) {
  const [examLink, setExamLink] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);

  const handleSend = async () => {
    if (!examLink.trim()) { setError("Please enter the exam link."); return; }
    setSending(true);
    setError(null);
    try {
      const res = await authFetch(`${API}/jobs/${job.id}/batch-email/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_link: examLink }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send emails.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-navy-deep/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border p-5">
          <h2 className="font-display text-lg font-semibold">Email screened-in candidates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {count} candidate{count !== 1 ? "s" : ""} will receive the exam link.
          </p>
        </div>
        <div className="p-5">
          {result ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success" />
              <p className="font-medium">Emails sent successfully</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.sent} of {result.total} candidates emailed.
              </p>
              <button
                onClick={onSent}
                className="mt-4 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Exam link <span className="text-destructive">*</span>
                </label>
                <input
                  autoFocus
                  value={examLink}
                  onChange={(e) => setExamLink(e.target.value)}
                  placeholder="https://your-domain.com/c/your-token-here"
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Paste the invite link from the Tests → Invites page.
                </p>
              </div>
              {error && (
                <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:bg-success/90 disabled:opacity-60"
                >
                  {sending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Mail className="h-4 w-4" /> Send emails</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
