import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Camera, Clock, AlertTriangle,
  Check, Send, CircleDot, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { validateInviteToken } from "@/services/invites.service";
import {
  getSessionQuestions,
  saveDraft,
  syncTimer,
  submitSession,
  logViolation,
  uploadRecordingChunk,
  type APIQuestion,
} from "@/services/sessions.service";

// Search params — session_id passed from instructions page
type TestSearch = { session: number };

export const Route = createFileRoute("/c/$token/test")({
  validateSearch: (s): TestSearch => ({ session: Number(s.session ?? 0) }),
  head: () => ({
    meta: [
      { title: "Assessment in progress — OTIC" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ params, context }) => {
    // Re-validate the token so a direct URL visit doesn't bypass instructions
    try {
      const invite = await validateInviteToken(params.token);
      return { invite, token: params.token };
    } catch {
      throw notFound();
    }
  },
  component: ActiveTest,
});

// Violation types the backend accepts
type ViolationType = "tab_switch" | "copy" | "paste" | "cut" | "fullscreen_exit" | "right_click";

const violationLabels: Record<ViolationType, string> = {
  tab_switch: "Tab switch",
  copy: "Copy attempt",
  paste: "Paste attempt",
  cut: "Cut attempt",
  fullscreen_exit: "Exited full screen",
  right_click: "Right click",
};

interface LocalViolation {
  id: string;
  type: ViolationType;
  label: string;
  at: string; // formatted timestamp
}

function ActiveTest() {
  const { invite, token } = Route.useLoaderData();
  const { session: sessionId } = Route.useSearch();
  const navigate = useNavigate();

  // ── Questions ──────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<APIQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    getSessionQuestions(sessionId, token)
      .then(setQuestions)
      .finally(() => setLoadingQuestions(false));
  }, [sessionId, token]);

  // ── Answer state ──────────────────────────────────────────────────────────
  const [current, setCurrent] = useState(0);
  // answers keyed by question id: MCQ → { selected_index: n }, short → { text: "..." }
  const [answers, setAnswers] = useState<Record<number, Record<string, unknown>>>({});

  const setMcqAnswer = (qId: number, idx: number) =>
    setAnswers((a) => ({ ...a, [qId]: { selected_index: idx } }));

  const setShortAnswer = (qId: number, text: string) =>
    setAnswers((a) => ({ ...a, [qId]: { text } }));

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [secondsLeft, setSecondsLeft] = useState(invite.test.duration_mins * 60);
  const secondsRef = useRef(secondsLeft);
  secondsRef.current = secondsLeft;

  // Countdown tick
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleSubmit(true); // auto-submit on expiry
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Sync with server every 60 seconds to prevent client-side manipulation
  useEffect(() => {
    const sync = setInterval(async () => {
      try {
        const { remaining_seconds, status } = await syncTimer(sessionId, token);
        setSecondsLeft(remaining_seconds);
        if (status === "timed_out" || status === "submitted") {
          navigate({ to: "/c/$token/done", params: { token } });
        }
      } catch {
        // Silently ignore sync failures — client timer continues
      }
    }, 60_000);
    return () => clearInterval(sync);
  }, [sessionId, token]);

  // ── Auto-draft: save answers every 2 minutes ───────────────────────────────
  useEffect(() => {
    const draft = setInterval(() => {
      const payload = Object.entries(answers).map(([qId, response]) => ({
        question_id: Number(qId),
        response,
      }));
      if (payload.length > 0) {
        saveDraft(sessionId, token, payload).catch(() => {});
      }
    }, 120_000);
    return () => clearInterval(draft);
  }, [answers, sessionId, token]);

  // ── Webcam recording ──────────────────────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkIndexRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let recorder: MediaRecorder;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;

        // Attach live preview to the video element
        const video = document.getElementById("webcam-preview") as HTMLVideoElement | null;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
        }

        recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
        mediaRecorderRef.current = recorder;

        // Upload each chunk as it becomes available
        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            const idx = chunkIndexRef.current++;
            try {
              await uploadRecordingChunk(sessionId, token, e.data, idx);
            } catch {
              // Don't throw — missing a chunk is better than crashing the test
            }
          }
        };

        // Collect a chunk every 30 seconds
        recorder.start(30_000);
      })
      .catch(() => {
        // Webcam unavailable — log as a violation but don't block the test
        logViolation(sessionId, token, "webcam_lost").catch(() => {});
      });

    return () => {
      recorder?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [sessionId, token]);

  // ── Proctoring listeners ──────────────────────────────────────────────────
  const [violations, setViolations] = useState<LocalViolation[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  const logV = (type: ViolationType) => {
    // Log to backend (fire-and-forget)
    logViolation(sessionId, token, type).catch(() => {});

    // Update local UI
    const label = violationLabels[type];
    setViolations((v) => [
      {
        id: `${Date.now()}`,
        type,
        label,
        at: formatTime(secondsRef.current),
      },
      ...v,
    ].slice(0, 50));

    setWarning(label);
    setTimeout(() => setWarning(null), 2500);
  };

  useEffect(() => {
    const onVis = () => { if (document.hidden) logV("tab_switch"); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); logV("copy"); };
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); logV("paste"); };
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); logV("cut"); };
    const onCtxMenu = (e: MouseEvent) => { e.preventDefault(); logV("right_click"); };
    const onFullscreen = () => {
      if (!document.fullscreenElement) logV("fullscreen_exit");
    };

    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("cut", onCut);
    document.addEventListener("contextmenu", onCtxMenu);
    document.addEventListener("fullscreenchange", onFullscreen);

    // Request full screen on mount
    document.documentElement.requestFullscreen().catch(() => {});

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("contextmenu", onCtxMenu);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Final draft save
      const payload = Object.entries(answers).map(([qId, response]) => ({
        question_id: Number(qId),
        response,
      }));
      if (payload.length > 0) {
        await saveDraft(sessionId, token, payload);
      }

      // Stop recording and flush last chunk
      mediaRecorderRef.current?.stop();

      // Submit session
      await submitSession(sessionId, token);

      // Exit full screen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      navigate({ to: "/c/$token/done", params: { token } });
    } catch {
      setSubmitting(false);
      if (!auto) setSubmitOpen(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingQuestions) {
    return (
      <div className="grid h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading assessment…</span>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answered = Object.keys(answers).length;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-navy-gradient px-6 py-3 text-navy-foreground">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="OTIC" className="h-5 w-auto" />
          <span className="font-display text-sm font-semibold">
            {invite.test.title}
          </span>
          <span className="font-mono text-[11px] text-white/60">
            · {invite.candidate_name}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-full bg-destructive/90 px-2.5 py-1 text-[11px] font-medium">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> REC
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-sm",
              secondsLeft < 300
                ? "bg-destructive/80 text-destructive-foreground"
                : secondsLeft < 600
                  ? "bg-warning/80 text-warning-foreground"
                  : "bg-white/10",
            )}
          >
            <Clock className="h-4 w-4" />
            {formatTime(secondsLeft)}
          </div>
        </div>
      </header>

      {/* Violation flash */}
      {warning && (
        <div className="absolute left-1/2 top-20 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-medium shadow-elevated">
            <AlertTriangle className="h-4 w-4" />
            Violation logged: {warning}
          </div>
        </div>
      )}

      <div className="grid flex-1 grid-cols-[260px_1fr_280px] overflow-hidden">
        {/* Question sidebar */}
        <aside className="overflow-y-auto border-r border-border bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Questions</span>
            <span className="font-mono">{answered}/{questions.length}</span>
          </div>
          <ol className="grid grid-cols-5 gap-1.5">
            {questions.map((qq, i) => {
              const isAnswered = answers[qq.id] !== undefined;
              const isCurrent = i === current;
              return (
                <li key={qq.id}>
                  <button
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "h-9 w-full rounded-md border font-mono text-xs font-medium transition-colors",
                      isCurrent && "border-navy bg-navy text-navy-foreground",
                      !isCurrent && isAnswered && "border-success/40 bg-success/15 text-success",
                      !isCurrent && !isAnswered && "border-border bg-card text-muted-foreground hover:border-navy/40",
                    )}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ol>

          <button
            onClick={() => setSubmitOpen(true)}
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> Submit assessment
          </button>
        </aside>

        {/* Question panel */}
        <main className="overflow-y-auto p-10 select-none">
          {q ? (
            <div className="mx-auto max-w-2xl">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Question {current + 1} of {questions.length} · {q.points} point{q.points !== 1 ? "s" : ""}
              </div>
              <h2 className="mt-3 font-display text-2xl font-semibold leading-snug tracking-tight">
                {q.body}
              </h2>

              <div className="mt-8 space-y-2">
                {q.type === "mcq" &&
                  (q.payload.options as string[])?.map((opt, i) => (
                    <label
                      key={i}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border bg-card px-4 py-3 transition-colors",
                        (answers[q.id] as { selected_index?: number })?.selected_index === i
                          ? "border-navy ring-1 ring-navy/30"
                          : "border-border hover:border-navy/40",
                      )}
                    >
                      <input
                        type="radio"
                        checked={
                          (answers[q.id] as { selected_index?: number })?.selected_index === i
                        }
                        onChange={() => setMcqAnswer(q.id, i)}
                        className="accent-navy"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}

                {q.type === "short_answer" && (
                  <>
                    <textarea
                      value={
                        ((answers[q.id] as { text?: string })?.text) ?? ""
                      }
                      onChange={(e) => setShortAnswer(q.id, e.target.value)}
                      rows={8}
                      placeholder="Type your answer here…"
                      className="w-full resize-none rounded-md border border-input bg-card px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
                    />
                    <div className="text-right font-mono text-xs text-muted-foreground">
                      {((answers[q.id] as { text?: string })?.text ?? "")
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length}{" "}
                      / {(q.payload.word_limit as number) ?? "∞"} words
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  disabled={current === 0}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={current === questions.length - 1}
                  onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                  className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              No questions found.
            </div>
          )}
        </main>

        {/* Webcam + violation log */}
        <aside className="flex flex-col overflow-hidden border-l border-border bg-card">
          <div className="border-b border-border p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" /> You
              </span>
              <span className="inline-flex items-center gap-1 text-destructive">
                <CircleDot className="h-3 w-3 animate-pulse fill-current" /> live
              </span>
            </div>
            <div className="aspect-video overflow-hidden rounded-md bg-navy-deep">
              {/* Live webcam feed */}
              <video
                id="webcam-preview"
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Activity log
              </span>
              <span className="font-mono">{violations.length}</span>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {violations.length === 0 && (
                <li className="p-4 text-center text-xs text-muted-foreground">
                  No violations recorded.
                </li>
              )}
              {violations.map((v) => (
                <li
                  key={v.id}
                  className="flex items-start gap-2 border-b border-border p-3 last:border-0"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">{v.label}</div>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">{v.at}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Submit confirmation modal */}
      {submitOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-deep/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-elevated">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
              <Check className="h-6 w-6 text-success" />
            </div>
            <h2 className="text-center font-display text-xl font-semibold">
              Submit assessment?
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              You answered {answered} of {questions.length} questions. This action cannot be
              undone.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                onClick={() => setSubmitOpen(false)}
                disabled={submitting}
                className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Keep working
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  "Submit now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}