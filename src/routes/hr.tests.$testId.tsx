import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GripVertical, Plus, Trash2, CircleDot, Type, Clock, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTest,
  updateTest,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  publishTest,
  type APITest,
  type APIQuestion,
} from "@/services/assessments.service";

export const Route = createFileRoute("/hr/tests/$testId")({
  head: () => ({ meta: [{ title: "Edit Test — OTIC" }] }),
  loader: async ({ params }): Promise<{ test: APITest }> => {
    const test = await getTest(Number(params.testId));
    return { test };
  },
  component: EditTest,
});

interface LocalQuestion {
  localId: string;
  remoteId?: number;
  type: "mcq" | "short";
  prompt: string;
  options?: string[];
  correctIndex?: number;
  points: number;
}

function apiToLocal(q: APIQuestion): LocalQuestion {
  return {
    localId: String(q.id),
    remoteId: q.id,
    type: q.type === "mcq" ? "mcq" : "short",
    prompt: q.body,
    options:
      q.type === "mcq"
        ? (q.payload.options as string[]) ?? []
        : undefined,
    correctIndex:
      q.type === "mcq"
        ? (q.payload.correct_index as number) ?? 0
        : undefined,
    points: q.points,
  };
}

let nextLocalId = 1000;

function EditTest() {
  const { test: initial } = Route.useLoaderData() as { test: APITest };
  const navigate = useNavigate();
  const { testId } = Route.useParams();

  const [title, setTitle] = useState(initial.title);
  const [jobRole, setJobRole] = useState(initial.job_role ?? "");
  const [duration, setDuration] = useState(initial.duration_mins);
  const [questions, setQuestions] = useState<LocalQuestion[]>(
    (initial.questions ?? []).map(apiToLocal),
  );
  const [activeId, setActiveId] = useState<string | null>(
    questions[0]?.localId ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDraft = initial.status === "draft";
  const active = questions.find((q) => q.localId === activeId);

  const update = (localId: string, patch: Partial<LocalQuestion>) =>
    setQuestions((qs) =>
      qs.map((q) => (q.localId === localId ? { ...q, ...patch } : q)),
    );

  const addLocal = (type: "mcq" | "short") => {
    const q: LocalQuestion = {
      localId: `new_${++nextLocalId}`,
      type,
      prompt: "",
      options: type === "mcq" ? ["", "", "", ""] : undefined,
      correctIndex: type === "mcq" ? 0 : undefined,
      points: 5,
    };
    setQuestions((qs) => [...qs, q]);
    setActiveId(q.localId);
  };

  const removeLocal = (localId: string) => {
    setQuestions((qs) => {
      const next = qs.filter((q) => q.localId !== localId);
      if (activeId === localId) setActiveId(next[0]?.localId ?? null);
      return next;
    });
  };

  const handleSave = async (andPublish = false) => {
    if (!isDraft && !andPublish) return;
    setSaving(true);
    setSaveError(null);

    try {
      // Update test metadata
      await updateTest(Number(testId), {
        title: title.trim(),
        job_role: jobRole.trim(),
        duration_mins: duration,
      });

      // Sync questions
      for (const q of questions) {
        const payload =
          q.type === "mcq"
            ? { options: q.options ?? [], correct_index: q.correctIndex ?? 0 }
            : { word_limit: 300 };

        if (q.remoteId) {
          // Update existing
          await updateQuestion(Number(testId), q.remoteId, {
            body: q.prompt,
            payload,
            points: q.points,
          });
        } else {
          // New question
          await addQuestion(Number(testId), {
            type: q.type === "mcq" ? "mcq" : "short_answer",
            body: q.prompt,
            payload,
            points: q.points,
          });
        }
      }

      if (andPublish) {
        await publishTest(Number(testId));
      }

      navigate({ to: "/hr/tests" });
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
        <div className="flex items-center gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isDraft}
            className="font-display text-xl font-semibold tracking-tight outline-none focus:underline disabled:opacity-70"
          />
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest",
              initial.status === "draft"
                ? "bg-muted text-muted-foreground"
                : "bg-success/15 text-success",
            )}
          >
            {initial.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            disabled={!isDraft}
            placeholder="Job role"
            className="rounded-md border border-input bg-card px-3 py-1.5 text-sm outline-none ring-ring focus:ring-2 disabled:opacity-60"
          />
          <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              value={duration}
              disabled={!isDraft}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-12 bg-transparent text-right outline-none disabled:opacity-60"
            />
            <span className="text-muted-foreground">min</span>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {questions.length} Q · {totalPoints} pts
          </div>

          {saveError && (
            <span className="text-xs text-destructive">{saveError}</span>
          )}

          {isDraft && (
            <>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-60"
              >
                {saving ? "Publishing…" : "Save & Publish"}
              </button>
            </>
          )}

          {!isDraft && (
            <span className="text-xs text-muted-foreground">
              Published tests cannot be edited.
            </span>
          )}
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[320px_1fr] overflow-hidden">
        <aside className="overflow-y-auto border-r border-border bg-muted/30 p-4">
          <div className="mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Questions
            </span>
          </div>

          <ol className="space-y-2">
            {questions.map((q, i) => (
              <li
                key={q.localId}
                onClick={() => setActiveId(q.localId)}
                className={cn(
                  "group flex cursor-pointer items-start gap-2 rounded-md border bg-card p-3 transition-all",
                  activeId === q.localId
                    ? "border-navy shadow-soft ring-1 ring-navy"
                    : "border-border hover:border-navy/40",
                )}
              >
                <GripVertical className="mt-0.5 h-4 w-4 text-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Q{i + 1} · {q.type === "mcq" ? "MCQ" : "Short"}
                  </span>
                  <div className="mt-1 line-clamp-2 text-sm">
                    {q.prompt || (
                      <span className="italic text-muted-foreground">Untitled</span>
                    )}
                  </div>
                </div>
                {isDraft && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLocal(q.localId);
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </li>
            ))}
          </ol>

          {isDraft && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => addLocal("mcq")}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-card px-3 py-2 text-xs font-medium hover:border-navy hover:text-navy"
              >
                <CircleDot className="h-3.5 w-3.5" /> MCQ
              </button>
              <button
                onClick={() => addLocal("short")}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-card px-3 py-2 text-xs font-medium hover:border-navy hover:text-navy"
              >
                <Type className="h-3.5 w-3.5" /> Short
              </button>
            </div>
          )}
        </aside>

        <section className="overflow-y-auto p-10">
          {active ? (
            <div className="mx-auto max-w-2xl">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {isDraft ? "Editing question" : "Viewing question"}
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
                    disabled={!isDraft}
                    onChange={(e) =>
                      update(active.localId, { prompt: e.target.value })
                    }
                    rows={3}
                    placeholder="Type your question…"
                    className="w-full resize-none rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2 disabled:opacity-60"
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
                            disabled={!isDraft}
                            onChange={() =>
                              update(active.localId, { correctIndex: i })
                            }
                            className="accent-navy"
                          />
                          <input
                            value={opt}
                            disabled={!isDraft}
                            onChange={(e) => {
                              const next = [...active.options!];
                              next[i] = e.target.value;
                              update(active.localId, { options: next });
                            }}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 bg-transparent text-sm outline-none disabled:opacity-60"
                          />
                        </label>
                      ))}
                      {isDraft && (
                        <button
                          onClick={() =>
                            update(active.localId, {
                              options: [...active.options!, ""],
                            })
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-navy hover:underline"
                        >
                          <Plus className="h-3 w-3" /> Add option
                        </button>
                      )}
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
                    disabled={!isDraft}
                    onChange={(e) =>
                      update(active.localId, { points: Number(e.target.value) })
                    }
                    className="w-20 rounded-md border border-input bg-card px-3 py-2 text-sm outline-none ring-ring focus:ring-2 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Select a question or add one.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}