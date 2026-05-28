import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GripVertical, Plus, Trash2, CircleDot, Type, Clock, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question, QuestionType } from "@/lib/mock-data";
import { createTest, addQuestion, publishTest } from "@/services/assessments.service";
import { Upload, Loader2 } from "lucide-react";
export const Route = createFileRoute("/hr/tests/new")({
  head: () => ({ meta: [{ title: "Test Builder — OTIC" }] }),
  component: TestBuilder,
});

let nextId = 100;
const newQ = (type: QuestionType): Question => ({
  id: `q${++nextId}`,
  type,
  prompt: "",
  options: type === "mcq" ? ["", "", "", ""] : undefined,
  correctIndex: type === "mcq" ? 0 : undefined,
  points: 5,
});

function TestBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Untitled Assessment");
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(true);
 
  const active = questions.find((q) => q.id === activeId);

  const update = (id: string, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const remove = (id: string) =>
    setQuestions((qs) => {
      const next = qs.filter((q) => q.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });

  const add = (type: QuestionType) => {
    const q = newQ(type);
    setQuestions((qs) => [...qs, q]);
    setActiveId(q.id);
  };

  const onDragStart = (id: string) => setDraggingId(id);
  const onDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;
    setQuestions((qs) => {
      const from = qs.findIndex((q) => q.id === draggingId);
      const to = qs.findIndex((q) => q.id === overId);
      const next = [...qs];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleSave = async (andPublish = false) => {
    if (!title.trim()) {
      setSaveError("Please add a test title.");
      return;
    }
    if (questions.length === 0) {
      setSaveError("Add at least one question before saving.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      // 1. Create the test
      const test = await createTest({
  title: title.trim(),
  description: "",
  job_role: jobRole.trim(),
  duration_mins: duration,
  pass_mark_pct: 50,
});

      // 2. Add questions one by one
      for (const q of questions) {
        await addQuestion(test.id, {
          type: q.type === "mcq" ? "mcq" : "short_answer",
          body: q.prompt,
          payload:
            q.type === "mcq"
              ? {
                  options: q.options ?? [],
                  correct_index: q.correctIndex ?? 0,
                }
              : { word_limit: 300 },
          points: q.points,
        });
      }

      // 3. ly publish immediately
      if (andPublish) {
        await publishTest(test.id);
      }

      navigate({ to: "/hr/tests" });;
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || file.type !== "application/pdf") {
    setUploadError("Please upload a PDF file.");
    return;
  }

  setUploading(true);
  setUploadError(null);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/assessments/parse-pdf/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!data.success) throw new Error(data.error);

    const parsed: Question[] = data.data.map((q: {
      type: string;
      prompt: string;
      options?: string[];
      correct_index?: number;
      points: number;
    }) => ({
      id: `q${++nextId}`,
      type: q.type === "mcq" ? "mcq" : "short" as QuestionType,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correct_index,
      points: q.points ?? 5,
    }));

    setQuestions((qs) => [...qs, ...parsed]);
    if (parsed[0]) setActiveId(parsed[0].id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to parse PDF.";
    setUploadError(msg);
  } finally {
    setUploading(false);
    e.target.value = "";
  }
};
if (showSetup) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-elevated">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          New assessment
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Let's set this up
        </h1>
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Department <span className="text-destructive">*</span>
            </label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            >
              <option value="">Select department…</option>
              <option>Surveying</option>
              <option>Accounts</option>
              <option>Technical</option>
              <option>Software Development</option>
              <option>SIWES Interns</option>
              <option>Business Development</option>
              <option>Media</option>
              <option>Admin</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Job role <span className="text-destructive">*</span>
            </label>
            <input
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Duration (minutes) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              placeholder="60"
              min={5}
              max={180}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Description{" "}
              <span className="text-muted-foreground normal-case">()</span>
            </label>
            <textarea
              rows={3}
              placeholder="What is this assessment testing for?"
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => navigate({ to: "/hr/tests" })}
            className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            disabled={!title.trim() || !jobRole.trim() || duration < 5}
            onClick={() => setShowSetup(false)}
            className="flex-1 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-50"
          >
            Start building →
          </button>
        </div>
      </div>
    </div>
  );
}
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
        <div className="flex items-center gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-display text-xl font-semibold tracking-tight outline-none focus:underline"
          />
          <input
  value={jobRole}
  onChange={(e) => setJobRole(e.target.value)}
  placeholder="Job role (e.g. Frontend Engineer)"
  className="rounded-md border border-input bg-card px-3 py-1.5 text-sm outline-none ring-ring focus:ring-2"
/>
          <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Draft
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-12 bg-transparent text-right outline-none"
            />
            <span className="text-muted-foreground">min</span>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {questions.length} Q · {totalPoints} pts
          </div>

          {saveError && (
            <span className="text-xs text-destructive">{saveError}</span>
          )}

          {/* Save as draft */}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save draft"}
          </button>

          {/* Save and publish */}
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-60"
          >
            {saving ? "Publishing…" : "Save & Publish"}
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[320px_1fr] overflow-hidden">
        {/* Question list */}
        <aside className="overflow-y-auto border-r border-border bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Questions
            </span>
          </div>

          <ol className="space-y-2">
            {questions.map((q, i) => (
              <li
                key={q.id}
                draggable
                onDragStart={() => onDragStart(q.id)}
                onDragOver={(e) => onDragOver(e, q.id)}
                onDragEnd={() => setDraggingId(null)}
                onClick={() => setActiveId(q.id)}
                className={cn(
                  "group flex cursor-pointer items-start gap-2 rounded-md border bg-card p-3 transition-all",
                  activeId === q.id
                    ? "border-navy shadow-soft ring-1 ring-navy"
                    : "border-border hover:border-navy/40",
                  draggingId === q.id && "opacity-50",
                )}
              >
                <GripVertical className="mt-0.5 h-4 w-4 cursor-grab text-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Q{i + 1} · {q.type === "mcq" ? "MCQ" : "Short"}
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm">
                    {q.prompt || (
                      <span className="italic text-muted-foreground">Untitled</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(q.id);
                  }}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </li>
            ))}
          </ol>

          {questions.length === 0 && (
            <div className="mt-6 text-center text-xs text-muted-foreground">
              No questions yet. Add one below.
            </div>
          )}
         {/* PDF Upload */}
<div className="mt-4">
  <label className={cn(
    "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-3 py-2.5 text-xs font-medium transition-colors hover:border-navy hover:text-navy w-full",
    uploading && "opacity-60 cursor-not-allowed"
  )}>
    {uploading ? (
      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Parsing PDF…</>
    ) : (
      <><Upload className="h-3.5 w-3.5" /> Upload PDF questions</>
    )}
    <input
      type="file"
      accept="application/pdf"
      className="hidden"
      disabled={uploading}
      onChange={handlePdfUpload}
    />
  </label>
  {uploadError && (
    <p className="mt-1.5 text-xs text-destructive">{uploadError}</p>
  )}
</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => add("mcq")}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-card px-3 py-2 text-xs font-medium hover:border-navy hover:text-navy"
            >
              <CircleDot className="h-3.5 w-3.5" /> MCQ
            </button>
            <button
              onClick={() => add("short")}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-card px-3 py-2 text-xs font-medium hover:border-navy hover:text-navy"
            >
              <Type className="h-3.5 w-3.5" /> Short
            </button>
          </div>
        </aside>

        {/* Editor */}
        <section className="overflow-y-auto p-10">
          {active ? (
            <div className="mx-auto max-w-2xl">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Editing question
              </div>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                {active.type === "mcq" ? "Multiple choice" : "Short answer"}
              </h2>

              <div className="mt-8 space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Prompt
                  </label>
                  <textarea
                    value={active.prompt}
                    onChange={(e) => update(active.id, { prompt: e.target.value })}
                    rows={3}
                    placeholder="Type your question…"
                    className="w-full resize-none rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                  />
                </div>

                {active.type === "mcq" && active.options && (
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Options · pick the correct answer
                    </label>
                    <div className="space-y-2">
                      {active.options.map((opt, i) => (
                        <label
                          key={i}
                          className={cn(
                            "flex items-center gap-3 rounded-md border bg-card px-3 py-2.5 transition-colors",
                            active.correctIndex === i
                              ? "border-success ring-1 ring-success/30"
                              : "border-border",
                          )}
                        >
                          <input
                            type="radio"
                            checked={active.correctIndex === i}
                            onChange={() => update(active.id, { correctIndex: i })}
                            className="accent-navy"
                          />
                          <input
                            value={opt}
                            onChange={(e) => {
                              const next = [...active.options!];
                              next[i] = e.target.value;
                              update(active.id, { options: next });
                            }}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 bg-transparent text-sm outline-none"
                          />
                        </label>
                      ))}
                      <button
                        onClick={() =>
                          update(active.id, { options: [...active.options!, ""] })
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-navy hover:underline"
                      >
                        <Plus className="h-3 w-3" /> Add option
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Points
                  </label>
                  <input
                    type="number"
                    value={active.points}
                    onChange={(e) =>
                      update(active.id, { points: Number(e.target.value) })
                    }
                    className="w-20 rounded-md border border-input bg-card px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
  <span className="text-xs text-muted-foreground">
    Question {questions.findIndex(q => q.id === active.id) + 1} of {questions.length}
  </span>
  <button
    onClick={() => {
      const currentIndex = questions.findIndex(q => q.id === active.id);
      if (currentIndex < questions.length - 1) {
        setActiveId(questions[currentIndex + 1].id);
      } else {
        add(active.type);
      }
    }}
    className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep"
  >
    {questions.findIndex(q => q.id === active.id) < questions.length - 1
      ? "Next question →"
      : "+ Add next question"}
  </button>
</div>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              <div>
                <div className="mb-2 text-2xl">✏️</div>
                Select a question from the left or add a new one to get started.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}