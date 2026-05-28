/**
 * src/lib/mock-data.ts
 * ─────────────────────
 * Types are preserved exactly so all your existing pages compile.
 * Mock arrays are kept small as fallbacks during development.
 * Real data comes from the service functions in src/services/.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuestionType = "mcq" | "short";
export type InviteStatus = "pending" | "started" | "submitted" | "expired";
export type ViolationType =
  | "tab_switch"
  | "copy_attempt"
  | "paste_attempt"
  | "fullscreen_exit"
  | "webcam_lost";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  points: number;
}

export interface Test {
  id: string;
  title: string;
  durationMinutes: number;
  status: "draft" | "live" | "archived";
  questions: Question[];
}

export interface Invite {
  id: string;
  token: string;
  candidateName: string;
  candidateEmail: string;
  testId: string;
  testTitle: string;
  sentAt: string;
  status: InviteStatus;
  score?: number;
  decision?: "pass" | "fail" | "review";
}

export interface Violation {
  id: string;
  type: ViolationType;
  timestampSec: number;
  note?: string;
}

// ── Violation labels (used in test + review pages) ────────────────────────────
export const violationLabels: Record<ViolationType, string> = {
  tab_switch: "Tab switch",
  copy_attempt: "Copy attempt",
  paste_attempt: "Paste attempt",
  fullscreen_exit: "Exited full screen",
  webcam_lost: "Webcam disconnected",
};

// ── Minimal mock fallbacks (used during development only) ──────────────────────
export const mockKpis = {
  activeTests: 0,
  invitesSent: 0,
  inProgress: 0,
  awaitingReview: 0,
};

export const mockInvites: Invite[] = [];
export const mockTests: Test[] = [];
export const mockViolations: Violation[] = [];

// ── Lookup helpers (used in candidate flow with real token data) ───────────────
export function getInviteByToken(token: string): Invite | undefined {
  return mockInvites.find((i) => i.token === token);
}

export function getTestById(id: string): Test | undefined {
  return mockTests.find((t) => t.id === id);
}