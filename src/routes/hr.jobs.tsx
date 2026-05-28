import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, ExternalLink, Copy, Check, Users, ChevronRight } from "lucide-react";
import { authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface JobPost {
  id: number;
  title: string;
  department: string;
  description: string;
  requirements: string;
  slug: string;
  status: "draft" | "open" | "closed";
  application_count: number;
  application_url: string;
  created_at: string;
}
interface Application {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;  
  email: string;
  phone: string;
  dob: string;
  cv: string;
  cover_letter: string;
  linkedin: string;
  github: string;
  twitter: string;
  instagram: string;
  tiktok: string;
  status: string;
  ai_score: number | null;
  ai_summary: string;
  submitted_at: string;
  screening_answers: Record<string, string>;
}

async function getJobs(token: string): Promise<JobPost[]> {
  const res = await authFetch(`${API}/jobs/`);
  const data = await res.json();
  return data.data;
}
export const Route = createFileRoute("/hr/jobs")({
  head: () => ({ meta: [{ title: "Jobs — OTIC" }] }),
  loader: async (): Promise<{ jobs: JobPost[] }> => {
    const token = localStorage.getItem("access_token") ?? "";
    const jobs = await getJobs(token);
    return { jobs };
  },
  component: Jobs,
});

const DEPARTMENTS = [
  "Surveying", "Accounts", "Technical", "Software Development",
  "SIWES Interns", "Business Development", "Media", "Admin", "Other",
];

const statusBadge: Record<JobPost["status"], { cls: string; label: string }> = {
  draft: { cls: "bg-muted text-muted-foreground", label: "Draft" },
  open: { cls: "bg-success/15 text-success", label: "Open" },
  closed: { cls: "bg-destructive/10 text-destructive", label: "Closed" },
};

function Jobs() {
  const { jobs: initial } = Route.useLoaderData();
  const [jobs, setJobs] = useState<JobPost[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const token = localStorage.getItem("access_token") ?? "";

 const handleOpen = async (id: number) => {
  const res = await authFetch(`${API}/jobs/${id}/open/`, { method: "POST" });
  const data = await res.json();
  if (data.success) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "open" as const } : j)));
  }
};

const handleClose = async (id: number) => {
  const res = await authFetch(`${API}/jobs/${id}/close/`, { method: "POST" });
  const data = await res.json();
  if (data.success) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "closed" as const } : j)));
  }
};
  const grouped = jobs.reduce<Record<string, JobPost[]>>((acc, job) => {
    const dept = job.department || "Other";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(job);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Recruitment
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Jobs</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep"
        >
          <Plus className="h-4 w-4" /> Post a job
        </button>
      </div>

      <div className="mt-8 space-y-8">
        {jobs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Users className="h-8 w-8 opacity-30" />
            <p className="text-sm">No jobs posted yet.</p>
          </div>
        )}

        {Object.entries(grouped).map(([dept, deptJobs]) => (
          <div key={dept}>
            <div className="mb-3 flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-base font-semibold">{dept}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {deptJobs.length} job{deptJobs.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-soft">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Title</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Applicants</th>
                    <th className="px-5 py-3 font-medium">Application link</th>
                    <th className="px-5 py-3" />
                   </tr>
                </thead>
                <tbody>
                  {deptJobs.map((job) => {
                    const badge = statusBadge[job.status];
                    return (
                      <tr key={job.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-5 py-4">
                          <div className="font-medium">{job.title}</div>
                          {job.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {job.description}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                            badge.cls,
                          )}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelectedJobId(job.id)}
                            className="inline-flex items-center gap-1.5 font-mono text-sm text-navy hover:underline"
                          >
                            <Users className="h-3.5 w-3.5" />
                            {job.application_count}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          {job.status === "open" && (
                            <CopyLink url={job.application_url} />
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {job.status === "draft" && (
                              <button
                                onClick={() => handleOpen(job.id)}
                                className="rounded-md bg-navy px-3 py-1 text-xs font-medium text-navy-foreground hover:bg-navy-deep"
                              >
                                Open
                              </button>
                            )}
                            {job.status === "open" && (
  <button
    onClick={() => handleClose(job.id)}
    className="rounded-md border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
  >
    Close
  </button>
)}
{job.status === "closed" && (
  <button
    onClick={() => handleOpen(job.id)}
    className="rounded-md border border-success/30 px-3 py-1 text-xs font-medium text-success hover:bg-success/10"
  >
    Reopen
  </button>
)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <NewJobModal
          token={token}
          onClose={() => setShowModal(false)}
          onCreated={(job) => {
            setJobs((prev) => [job, ...prev]);
            setShowModal(false);
          }}
        />
      )}

      {selectedJobId && (
        <ApplicationsDrawer
          jobId={selectedJobId}
          jobTitle={jobs.find((j) => j.id === selectedJobId)?.title ?? ""}
          token={token}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </div>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-muted-foreground truncate max-w-[180px]">
        {url.replace("http://localhost:3000", "")}
      </span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="rounded p-1 hover:bg-muted"
      >
        {copied
          ? <Check className="h-3.5 w-3.5 text-success" />
          : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        }
      </button>
      <a href={url} target="_blank" rel="noreferrer" className="rounded p-1 hover:bg-muted">
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </a>
    </div>
  );
}

const SCREENING_QUESTIONS = [
  { key: "state_of_residence", label: "State of residence" },
  { key: "age_range", label: "Age range" },
  { key: "nysc_completion", label: "NYSC completion status" },
  { key: "years_of_experience", label: "Years of relevant experience" },
  { key: "currently_employed", label: "Currently employed" },
  { key: "reason_for_leaving", label: "Reason for leaving current job" },
  { key: "salary_expectation", label: "Salary expectation" },
  { key: "available_to_resume", label: "Available to resume in" },
];

function NewJobModal({
  token,
  onClose,
  onCreated,
}: {
  token: string;
  onClose: () => void;
  onCreated: (job: JobPost) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    title: "",
    department: "",
    description: "",
    requirements: "",
  });
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleQuestion = (key: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch(`${API}/jobs/`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...form, screening_questions: selectedQuestions }),
});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onCreated(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create job.");
    } finally {
      setSaving(false);
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-lg font-semibold">Post a new job</h2>
            <div className="mt-0.5 font-mono text-xs text-muted-foreground">
              Step {step} of 2 — {step === 1 ? "Job details" : "Screening questions"}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        {/* Step 1 — Job details */}
        {step === 1 && (
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Job title <span className="text-destructive">*</span>
              </label>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Backend Engineer"
                className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Department <span className="text-destructive">*</span>
              </label>
              <select
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              >
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What is this role about?"
                className="w-full resize-none rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Requirements
              </label>
              <textarea
                rows={4}
                value={form.requirements}
                onChange={(e) => set("requirements", e.target.value)}
                placeholder="List the requirements for this role…"
                className="w-full resize-none rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              />
            </div>
          </div>
        )}

        {/* Step 2 — Screening questions */}
        {step === 2 && (
          <div className="p-5">
            <p className="mb-4 text-sm text-muted-foreground">
              Select which screening questions to include on the application form.
              All are optional for candidates.
            </p>
            <div className="space-y-2">
              {SCREENING_QUESTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors",
                    selectedQuestions.includes(key)
                      ? "border-navy bg-navy/5"
                      : "border-border hover:border-navy/40",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(key)}
                    onChange={() => toggleQuestion(key)}
                    className="accent-navy"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
            {error && (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between gap-2 border-t border-border p-4">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={!form.title.trim() || !form.department}
                onClick={() => setStep(2)}
                className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-60"
              >
                Next: Screening questions →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create job"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function ApplicationsDrawer({
  jobId,
  jobTitle,
  token,
  onClose,
}: {
  jobId: number;
  jobTitle: string;
  token: string;
  onClose: () => void;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

useEffect(() => {
  authFetch(`${API}/jobs/${jobId}/applications/`)
    .then((r) => r.json())
    .then((d) => setApplications(d.data ?? []))
    .finally(() => setLoading(false));
}, [jobId]);

  const filtered = applications.filter((app) => {
  const q = search.toLowerCase();
  return (
    (app.first_name?.toLowerCase() ?? "").includes(q) ||
    (app.last_name?.toLowerCase() ?? "").includes(q) ||
    (app.full_name?.toLowerCase() ?? "").includes(q) ||
    (app.email?.toLowerCase() ?? "").includes(q) ||
    (app.phone?.toLowerCase() ?? "").includes(q)
  );
});

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-navy-deep/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex h-full w-full max-w-2xl flex-col bg-card shadow-elevated">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Applications
            </div>
            <h2 className="font-display text-lg font-semibold">{jobTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-border px-6 py-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {search ? "No results match your search." : "No applications yet."}
            </div>
          )}
          {!loading && filtered.map((app) => (
            <div key={app.id} className="border-b border-border px-6 py-4 hover:bg-muted/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                 <div className="font-medium">
                  {app.full_name || `${app.first_name} ${app.last_name}`}
                  </div>
                 <div className="text-xs text-muted-foreground">{app.email}</div>
{app.phone && (
  <div className="text-xs text-muted-foreground">{app.phone}</div>
)}
{app.dob && (
  <div className="text-xs text-muted-foreground">
    DOB: {new Date(app.dob).toLocaleDateString("en-GB")}
  </div>
)}
                </div>
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                  app.status === "screened_in" && "bg-success/15 text-success",
                  app.status === "screened_out" && "bg-destructive/10 text-destructive",
                  app.status === "pending" && "bg-muted text-muted-foreground",
                  app.status === "invited" && "bg-warning/15 text-warning-foreground",
                  app.status === "blacklisted" && "bg-destructive/20 text-destructive",
                )}>
                  {app.status.replace("_", " ")}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-3">
                {app.linkedin && (
                  <a href={app.linkedin} target="_blank" rel="noreferrer"
                    className="text-xs text-navy hover:underline">LinkedIn</a>
                )}
                {app.twitter && (
                  <a href={app.twitter} target="_blank" rel="noreferrer"
                    className="text-xs text-navy hover:underline">Twitter</a>
                )}
                {app.instagram && (
                  <a href={app.instagram} target="_blank" rel="noreferrer"
                    className="text-xs text-navy hover:underline">Instagram</a>
                )}
                {app.tiktok && (
                  <a href={app.tiktok} target="_blank" rel="noreferrer"
                    className="text-xs text-navy hover:underline">TikTok</a>
                )}
                {app.github && (
                  <a href={app.github} target="_blank" rel="noreferrer"
                    className="text-xs text-navy hover:underline">GitHub</a>
                )}
              </div>

              <div className="mt-2 flex gap-2">
                <a
                  href={`https://pas-backend.oticgs.com${app.cv}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted"
                >
                  View CV
                </a>
                <a
                  href={`https://pas-backend.oticgs.com${app.cover_letter}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted"
                >
                  View Cover Letter
                </a>
              </div>

              {app.ai_summary && (
                <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">AI Summary: </span>
                  {app.ai_summary}
                </div>
              )}
              {Object.keys(app.screening_answers ?? {}).length > 0 && (
  <div className="mt-3 rounded-md bg-muted/50 p-3">
    <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      Screening answers
    </div>
    <div className="space-y-1">
      {Object.entries(app.screening_answers).map(([key, value]) => (
        <div key={key} className="flex gap-2 text-xs">
          <span className="font-medium capitalize text-foreground">
            {key.replace(/_/g, " ")}:
          </span>
          <span className="text-muted-foreground">{value as string}</span>
        </div>
      ))}
    </div>
  </div>
)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
