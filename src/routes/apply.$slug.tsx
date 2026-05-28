import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, CheckCircle2, Loader2, ArrowRight, ArrowLeft, Briefcase, MapPin, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const SCREENING_OPTIONS: Record<string, { label: string; options: string[] }> = {
  state_of_residence: { label: "State of residence", options: NIGERIAN_STATES },
  age_range: { label: "Age range", options: ["18-20", "21-25", "26-30", "31-35", "35+"] },
  nysc_completion: { label: "NYSC completion status", options: ["Yes", "No"] },
  years_of_experience: { label: "Years of relevant experience", options: ["None", "1-3 years", "3-5 years", "5+ years"] },
  currently_employed: { label: "Are you currently employed?", options: ["Yes", "No"] },
  reason_for_leaving: {
    label: "Reason for leaving current job",
    options: ["Better career opportunity", "Higher compensation", "Relocation", "Company instability", "Career change", "Redundancy / Layoff", "Contract ended", "Personal reasons", "Other"],
  },
  salary_expectation: { label: "Salary expectation (₦)", options: [] },
  available_to_resume: {
    label: "Available to resume in",
    options: ["Immediately", "1 week", "2 weeks", "1 month", "3 months", "More than 3 months"],
  },
};

interface JobInfo {
  title: string;
  department: string;
  description: string;
  requirements: string;
  screening_questions: string[];
}

export const Route = createFileRoute("/apply/$slug")({
  head: () => ({
    meta: [
      { title: "Apply — OTIC" },
      { name: "robots", content: "noindex" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
  }),
  loader: async ({ params }): Promise<{ job: JobInfo; slug: string; closed: boolean }> => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/jobs/apply/${params.slug}/`);
    const data = await res.json();
    if (!data.success) return { job: {} as JobInfo, slug: params.slug, closed: true };
    return { job: data.data, slug: params.slug, closed: false };
  },
  component: ApplicationForm,
});

type Step = "intro" | "personal" | "documents" | "screening" | "done";

// ── Sub-components ─────────────────────────────────────────────────────────────

function Header({ job }: { job: JobInfo | null }) {
  return (
    <header className="border-b border-border bg-white px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="OTIC" className="h-8 w-auto" />
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            Screening System
          </div>
        </div>
        {job && (
          <div className="text-right">
            <div className="text-xs font-medium text-foreground">{job.title}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{job.department}</div>
          </div>
        )}
      </div>
    </header>
  );
}

function FileUpload({
  label, required, file, onChange,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (f: File) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-background p-8 transition-colors hover:border-navy hover:bg-accent">
        {file ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="font-medium text-success">{file.name}</span>
          </div>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/10">
              <Upload className="h-5 w-5 text-navy" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">Click to upload</div>
              <div className="text-xs text-muted-foreground">PDF only</div>
            </div>
          </>
        )}
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }}
        />
      </label>
    </div>
  );
}

// ── Salary input: numbers only, auto-formats with commas ──────────────────────
function SalaryInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const formatted = value ? Number(value).toLocaleString("en-NG") : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    onChange(digits);
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {SCREENING_OPTIONS.salary_expectation.label} <span className="text-destructive">*</span>
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={formatted}
        onChange={handleChange}
        placeholder="e.g. 300,000"
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
      />
      <p className="mt-1 text-xs text-muted-foreground">Enter monthly gross in Naira (numbers only)</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function ApplicationForm() {
  const { job, slug, closed } = Route.useLoaderData();

  const [step, setStep] = useState<Step>("intro");
  const [personal, setPersonal] = useState({
    first_name: "", last_name: "", email: "", phone: "", phone2: "", dob: "",
    linkedin: "", twitter: "", github: "", other_social: "",
  });
  const [cv, setCv] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const setField = (field: string, value: string) => setPersonal((p) => ({ ...p, [field]: value }));
  const setAnswer = (key: string, value: string) => setScreeningAnswers((a) => ({ ...a, [key]: value }));

  const hasScreening = !closed && job.screening_questions?.length > 0;
  const steps: Step[] = ["personal", "documents", ...(hasScreening ? ["screening" as Step] : [])];
  const currentIndex = steps.indexOf(step);

  const collectErrors = (): string[] => {
    const errs: string[] = [];

    if (!cv) errs.push("Please upload your CV / Resume.");
    if (!coverLetter) errs.push("Please upload your Cover Letter.");

    if (hasScreening) {
      for (const key of job.screening_questions) {
        const q = SCREENING_OPTIONS[key];
        if (!q) continue;
        if (
          key === "reason_for_leaving" &&
          job.screening_questions.includes("currently_employed") &&
          screeningAnswers["currently_employed"] !== "Yes"
        ) continue;

        const answer = screeningAnswers[key];
        if (!answer || answer.trim() === "") {
          errs.push(`Please answer: "${q.label}"`);
        }
      }
    }

    return errs;
  };

  const handleSubmit = async () => {
    setErrors([]);
    const errs = collectErrors();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    Object.entries(personal).forEach(([k, v]) => { if (v) formData.append(k, v); });
    formData.append("cv", cv!);
    formData.append("cover_letter", coverLetter!);
    formData.append("screening_answers", JSON.stringify(screeningAnswers));
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/jobs/apply/${slug}/`,
        { method: "POST", body: formData },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStep("done");
    } catch (err: unknown) {
      setErrors([err instanceof Error ? err.message : "Submission failed. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Closed ──────────────────────────────────────────────────────────────────
  if (closed) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header job={null} />
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Applications closed</h1>
            <p className="mt-3 text-muted-foreground">
              Sorry, we are no longer receiving applications for this position.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header job={job} />
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Application submitted!</h1>
            <p className="mt-3 text-muted-foreground">
              Thank you for applying for <strong>{job.title}</strong>. We'll review your application and be in touch shortly.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-navy" /> Secured by OTIC
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Intro ───────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="min-h-screen bg-background">
        <Header job={job} />

        <div className="bg-navy-gradient px-4 py-10 text-white sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-1 font-mono text-xs uppercase tracking-widest text-white/60">{job.department}</div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{job.title}</h1>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                <MapPin className="h-3.5 w-3.5" /> Nigeria
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                <Clock className="h-3.5 w-3.5" /> Full-time
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                <Briefcase className="h-3.5 w-3.5" /> {job.department}
              </span>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {job.description && (
            <div className="mb-6">
              <h2 className="mb-2 font-display text-lg font-semibold">About this role</h2>
              <p className="text-muted-foreground">{job.description}</p>
            </div>
          )}
          {job.requirements && (
            <div className="mb-8 rounded-lg border border-border bg-card p-5 shadow-soft">
              <h2 className="mb-3 font-display text-base font-semibold">Requirements</h2>
              <p className="whitespace-pre-line text-sm text-foreground">{job.requirements}</p>
            </div>
          )}
          <div className="mb-8 rounded-lg border border-navy/20 bg-navy/5 p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-navy">What to expect</h2>
            <div className="space-y-2">
              {[
                "Fill in your personal information and contact details",
                "Upload your CV and cover letter (PDF format)",
                ...(hasScreening ? ["Answer a few short screening questions"] : []),
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setStep("personal")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-5 py-3 text-sm font-medium text-white hover:bg-navy-deep sm:w-auto"
          >
            Continue application <ArrowRight className="h-4 w-4" />
          </button>
        </main>

        <footer className="mt-8 border-t border-border px-4 py-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Secured by OTIC
        </footer>
      </div>
    );
  }

  // ── Form steps (personal / documents / screening) ──────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header job={job} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Step indicators */}
        <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-soft">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  step === s ? "bg-navy text-white" : currentIndex > i ? "bg-success text-white" : "bg-muted text-muted-foreground",
                )}>
                  {currentIndex > i ? "✓" : i + 1}
                </div>
                <span className={cn(
                  "hidden text-xs sm:block",
                  step === s ? "font-semibold text-foreground" : "text-muted-foreground",
                )}>
                  {s === "personal" ? "Personal info" : s === "documents" ? "Documents" : "Questions"}
                </span>
              </div>
              {i < steps.length - 1 && <div className="mx-2 flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Personal info */}
        {step === "personal" && (
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="font-display text-lg font-semibold">Personal information</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Fields marked * are required.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  First name <span className="text-destructive">*</span>
                </label>
                <input autoFocus required value={personal.first_name} onChange={(e) => setField("first_name", e.target.value)} placeholder="John"
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last name <span className="text-destructive">*</span>
                </label>
                <input required value={personal.last_name} onChange={(e) => setField("last_name", e.target.value)} placeholder="Doe"
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email <span className="text-destructive">*</span>
                </label>
                <input required type="email" value={personal.email} onChange={(e) => setField("email", e.target.value)} placeholder="john@example.com"
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Phone <span className="text-destructive">*</span>
                </label>
                <input required type="tel" value={personal.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+234 800 000 0000"
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
              <div>
  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
    Alternative phone
  </label>
  <input
    type="tel"
    value={personal.phone2}
    onChange={(e) => setField("phone2", e.target.value)}
    placeholder="+234 800 000 0000"
    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
  />
</div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date of birth <span className="text-destructive">*</span>
                </label>
                <input required type="date" value={personal.dob} onChange={(e) => setField("dob", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">LinkedIn</label>
                <input type="url" value={personal.linkedin} onChange={(e) => setField("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">GitHub</label>
                <input type="url" value={personal.github} onChange={(e) => setField("github", e.target.value)} placeholder="https://github.com/..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Twitter / X</label>
                <input type="url" value={personal.twitter} onChange={(e) => setField("twitter", e.target.value)} placeholder="https://x.com/..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Portfolio / other</label>
                <input type="url" value={personal.other_social} onChange={(e) => setField("other_social", e.target.value)} placeholder="https://..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Documents */}
        {step === "documents" && (
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="font-display text-lg font-semibold">Documents</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">PDF files only. Max 10MB each.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FileUpload label="CV / Resume" required file={cv} onChange={setCv} />
              <FileUpload label="Cover Letter" required file={coverLetter} onChange={setCoverLetter} />
            </div>
          </div>
        )}

        {/* Step 3 — Screening (all questions now required) */}
        {step === "screening" && (
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="font-display text-lg font-semibold">A few more questions</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">All questions are required.</p>
            <div className="mt-6 space-y-6">
              {job.screening_questions.map((key: string) => {
                const q = SCREENING_OPTIONS[key];
                if (!q) return null;

                if (key === "salary_expectation") {
                  return (
                    <SalaryInput
                      key={key}
                      value={screeningAnswers[key] ?? ""}
                      onChange={(v) => setAnswer(key, v)}
                    />
                  );
                }

                if (key === "state_of_residence") {
  return (
    <div key={key} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">{q.label}</label>
        <select
          value={screeningAnswers[key] ?? ""}
          onChange={(e) => {
            setAnswer(key, e.target.value);
            // Clear relocation answer if they switch back to Lagos
            if (e.target.value === "Lagos") {
              setAnswer("willing_to_relocate", "");
            }
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
        >
          <option value="">Select state…</option>
          {q.options.map((opt) => <option key={opt}>{opt}</option>)}
        </select>
      </div>

      {/* Show relocation question if state is not Lagos */}
      {screeningAnswers[key] &&
        screeningAnswers[key] !== "Lagos" && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Are you willing to relocate to Lagos?
            </label>
            <div className="space-y-2">
              {["Yes", "No", "Open to discussion"].map((opt) => (
                <label
                  key={opt}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors",
                    screeningAnswers["willing_to_relocate"] === opt
                      ? "border-navy bg-navy/5 font-medium"
                      : "border-border hover:border-navy/40",
                  )}
                >
                  <input
                    type="radio"
                    name="willing_to_relocate"
                    checked={screeningAnswers["willing_to_relocate"] === opt}
                    onChange={() => setAnswer("willing_to_relocate", opt)}
                    className="accent-navy"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
                if (
                  key === "reason_for_leaving" &&
                  job.screening_questions.includes("currently_employed") &&
                  screeningAnswers["currently_employed"] !== "Yes"
                ) {
                  return null;
                }

                return (
                  <div key={key}>
                    <label className="mb-2 block text-sm font-medium">
                      {q.label} <span className="text-destructive">*</span>
                    </label>
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label key={opt} className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors",
                          screeningAnswers[key] === opt ? "border-navy bg-navy/5 font-medium" : "border-border hover:border-navy/40",
                        )}>
                          <input type="radio" name={key} checked={screeningAnswers[key] === opt} onChange={() => setAnswer(key, opt)} className="accent-navy" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error block — shows ALL errors at once */}
        {errors.length > 0 && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.length === 1 ? (
              errors[0]
            ) : (
              <ul className="list-disc pl-4 space-y-1">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => {
              setErrors([]);
              const prev = currentIndex > 0 ? steps[currentIndex - 1] : "intro";
              setStep(prev);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {currentIndex < steps.length - 1 ? (
            <button
              disabled={step === "personal" && (!personal.first_name.trim() || !personal.last_name.trim() || !personal.email.trim() || !personal.phone.trim() || !personal.dob.trim())}
              onClick={() => { setErrors([]); setStep(steps[currentIndex + 1]); }}
              className="inline-flex items-center gap-2 rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-deep disabled:opacity-50"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-deep disabled:opacity-60"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit application"}
            </button>
          )}
        </div>
      </main>

      <footer className="mt-8 border-t border-border px-4 py-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Secured by OTIC
      </footer>
    </div>
  );
}