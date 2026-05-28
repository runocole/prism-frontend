import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Play, Camera, AlertTriangle, Check, X, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  getSession,
  getRecordingUrl,
  scoreAnswer,
  submitResult,
  type APISession,
  type APIAnswer,
} from "@/services/sessions.service";

export const Route = createFileRoute("/hr/results/$inviteId")({
  head: () => ({ meta: [{ title: "Review submission — OTIC" }] }),
  loader: async ({ params }) => {
    try {
      const session = await getSession(Number(params.inviteId));
      return { session };
    } catch {
      throw notFound();
    }
  },
  component: ReviewPage,
});

type Decision = "pass" | "fail" | "hold";

// Map backend violation types to human-readable labels
const violationLabels: Record<string, string> = {
  tab_switch: "Tab switch",
  copy: "Copy attempt",
  paste: "Paste attempt",
  cut: "Cut attempt",
  fullscreen_exit: "Exited full screen",
  webcam_lost: "Webcam disconnected",
  right_click: "Right click",
};

function ReviewPage() {
  const { session: initial } = Route.useLoaderData();
  const [session] = useState<APISession>(initial);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultData, setResultData] = useState<{
    score_pct: number;
    earned_points: number;
    total_points: number;
  } | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [loadingRecording, setLoadingRecording] = useState(false);

  // ── Answer scoring ────────────────────────────────────────────────────────
  const [answerScores, setAnswerScores] = useState<Record<number, number>>(() =>
    Object.fromEntries(
      session.answers
        .filter((a) => a.manual_score !== null)
        .map((a) => [a.id, a.manual_score!]),
    ),
  );

  const handleScoreChange = async (answer: APIAnswer, score: number) => {
    setAnswerScores((prev) => ({ ...prev, [answer.id]: score }));
    try {
      await scoreAnswer(session.id, answer.id, { manual_score: score });
    } catch {
      // Revert on failure
      setAnswerScores((prev) => ({ ...prev, [answer.id]: answer.manual_score ?? 0 }));
    }
  };

  // ── Load recording ────────────────────────────────────────────────────────
  const handleLoadRecording = async () => {
    setLoadingRecording(true);
    try {
      const { url } = await getRecordingUrl(session.id);
      setRecordingUrl(url);
    } catch {
      // No recording available yet
    } finally {
      setLoadingRecording(false);
    }
  };

  // ── Submit final decision ─────────────────────────────────────────────────
  const handleSubmitResult = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      const result = await submitResult(session.id, { decision, notes });
      setResultData(result);
      setSubmitted(true);
    } catch {
      // Keep form open on error
    } finally {
      setSubmitting(false);
    }
  };

  // ── Compute MCQ auto-score total ──────────────────────────────────────────
  const mcqEarned = session.answers
    .filter((a) => a.question_type === "mcq")
    .reduce((sum, a) => sum + (a.auto_score ?? 0), 0);

  const essayEarned = Object.values(answerScores).reduce((sum, s) => sum + s, 0);

  const totalPoints = session.answers.reduce((sum, a) => sum + a.question_points, 0);
  const totalEarned = mcqEarned + essayEarned;
  const scorePct = totalPoints > 0 ? Math.round((totalEarned / totalPoints) * 100) : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/hr/results"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Results
            </Link>
            <div className="h-5 w-px bg-border" />
            <div>
              <div className="font-display text-base font-semibold">
                {session.candidate_name}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {session.candidate_email} · {session.test_title}
              </div>
            </div>
          </div>

          {/* Decision buttons */}
          {!submitted && (
            <div className="flex items-center gap-2">
              {(["fail", "hold", "pass"] as Decision[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDecision(d)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    decision === d && d === "fail" &&
                      "border-destructive bg-destructive text-destructive-foreground",
                    decision === d && d === "hold" &&
                      "border-warning bg-warning text-warning-foreground",
                    decision === d && d === "pass" &&
                      "border-success bg-success text-success-foreground",
                    decision !== d && "border-border hover:border-navy/40",
                  )}
                >
                  {d === "fail" && <X className="h-3.5 w-3.5" />}
                  {d === "hold" && <AlertTriangle className="h-3.5 w-3.5" />}
                  {d === "pass" && <Check className="h-3.5 w-3.5" />}
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          )}

          {submitted && resultData && (
            <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-1.5 text-sm font-medium text-success">
              <Check className="h-4 w-4" />
              Decision submitted — {resultData.score_pct}%
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-[1fr_380px] gap-6 p-6">
        {/* Left: answers */}
        <div className="space-y-4">

          {/* Score summary card */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Score</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {session.answers.length} question{session.answers.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-3 flex items-end gap-4">
              <span className="font-display text-5xl font-semibold tracking-tight">
                {submitted ? resultData?.score_pct ?? scorePct : scorePct}
                <span className="text-2xl text-muted-foreground">%</span>
              </span>
              <div className="mb-1 space-y-0.5 text-xs text-muted-foreground">
                <div>MCQ: {mcqEarned} pts (auto-graded)</div>
                <div>Essay: {essayEarned} pts (manual)</div>
                <div>Total: {totalEarned} / {totalPoints} pts</div>
              </div>
            </div>
          </div>

          {/* Answers */}
          <div className="rounded-lg border border-border bg-card shadow-soft">
            <div className="border-b border-border p-5">
              <h2 className="font-display text-lg font-semibold">Answers</h2>
            </div>
            <div className="divide-y divide-border">
              {session.answers.length === 0 && (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No answers submitted.
                </div>
              )}
              {session.answers.map((answer, i) => (
                <AnswerRow
                  key={answer.id}
                  answer={answer}
                  index={i}
                  score={answerScores[answer.id] ?? answer.manual_score ?? 0}
                  onScoreChange={handleScoreChange}
                  readOnly={submitted}
                />
              ))}
            </div>
          </div>

          {/* Notes + submit */}
          {!submitted && (
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-base font-semibold">Reviewer notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes about this submission…"
                className="mt-3 w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {decision
                    ? `Decision: ${decision.toUpperCase()}`
                    : "Select a decision above before submitting."}
                </p>
                <button
                  onClick={handleSubmitResult}
                  disabled={!decision || submitting}
                  className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  ) : (
                    "Submit decision"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: recording + violations */}
        <aside className="space-y-4">

          {/* Recording */}
          <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Camera className="h-3.5 w-3.5" /> Recording
              </div>
            </div>

            {recordingUrl ? (
              <video
                src={recordingUrl}
                controls
                className="w-full rounded-md bg-navy-deep"
              />
            ) : (
              <div className="aspect-video overflow-hidden rounded-md bg-navy-deep">
                <div className="grid h-full place-items-center text-navy-foreground/60">
                  <div className="text-center">
                    <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-white/10">
                      <Play className="h-5 w-5 fill-current" />
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-widest">
                      Webcam recording
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!recordingUrl && (
              <button
                onClick={handleLoadRecording}
                disabled={loadingRecording}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-60"
              >
                {loadingRecording ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</>
                ) : (
                  <><Play className="h-3.5 w-3.5" /> Load recording</>
                )}
              </button>
            )}
          </div>

          {/* Violations */}
          <div className="rounded-lg border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" /> Violations
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[11px]",
                  session.violation_count > 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {session.violation_count}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {session.violations.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No violations recorded.
                </li>
              )}
              {session.violations.map((v) => (
                <li key={v.id} className="flex items-start gap-3 p-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-destructive/10">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {violationLabels[v.type] ?? v.type}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {new Date(v.occurred_at).toLocaleTimeString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Answer row component ───────────────────────────────────────────────────────
function AnswerRow({
  answer,
  index,
  score,
  onScoreChange,
  readOnly,
}: {
  answer: APIAnswer;
  index: number;
  score: number;
  onScoreChange: (answer: APIAnswer, score: number) => void;
  readOnly: boolean;
}) {
  // Format the candidate's response for display
  const responseText =
    answer.question_type === "mcq"
      ? `Option ${((answer.response as { selected_index?: number })?.selected_index ?? 0) + 1} selected`
      : (answer.response as { text?: string })?.text ?? "No answer provided";

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Q{index + 1} · {answer.question_type === "mcq" ? "MCQ" : "Short answer"} · {answer.question_points}pts
        </div>

        {/* MCQ: show auto-score result */}
        {answer.question_type === "mcq" && answer.is_correct !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              answer.is_correct
                ? "bg-success/15 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {answer.is_correct ? (
              <><Check className="h-3 w-3" /> Correct</>
            ) : (
              <><X className="h-3 w-3" /> Incorrect</>
            )}
          </span>
        )}
      </div>

      {/* Question body */}
      <div className="mt-2 text-sm font-medium">{answer.question_body}</div>

      {/* Candidate response */}
      <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
        {responseText}
      </div>

      {/* Manual scoring for short answers */}
      {answer.question_type === "short_answer" && (
        <div className="mt-3 flex items-center gap-3">
          <label className="text-xs text-muted-foreground">Manual score</label>
          <input
            type="number"
            min={0}
            max={answer.question_points}
            value={score}
            disabled={readOnly}
            onChange={(e) => onScoreChange(answer, Number(e.target.value))}
            className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none ring-ring focus:ring-2 disabled:opacity-60"
          />
          <span className="text-xs text-muted-foreground">/ {answer.question_points}</span>
        </div>
      )}
    </div>
  );
}