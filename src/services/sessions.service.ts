/**
 * src/services/sessions.service.ts
 * ──────────────────────────────────
 * All session API calls — candidate and HR/reviewer.
 * Candidate calls include X-Invite-Token header automatically.
 */

import { api } from "@/lib/api";

export interface APISession {
  id: number;
  candidate_name: string;
  candidate_email: string;
  test_title: string;
  status: "in_progress" | "submitted" | "timed_out";
  started_at: string;
  submitted_at: string | null;
  remaining_seconds: number;
  recording_path: string;
  violation_count: number;
  answers: APIAnswer[];
  violations: APIViolation[];
}

export interface APIAnswer {
  id: number;
  question: number;
  question_type: "mcq" | "short_answer";
  question_body: string;
  question_points: number;
  response: Record<string, unknown>;
  is_correct: boolean | null;
  auto_score: number | null;
  manual_score: number | null;
  reviewer_comment: string;
}

export interface APIViolation {
  id: number;
  type: string;
  occurred_at: string;
  snapshot_path: string;
}

export interface APIQuestion {
  id: number;
  type: "mcq" | "short_answer";
  body: string;
  payload: Record<string, unknown>;
  points: number;
  order_index: number;
}

type Envelope<T> = { success: boolean; data: T };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns axios config with the invite token header for candidate requests. */
function withToken(token: string) {
  return { headers: { "X-Invite-Token": token } };
}

// ── Candidate calls ───────────────────────────────────────────────────────────

export async function startSession(
  token: string,
): Promise<{ session_id: number; remaining_seconds: number }> {
  const { data } = await api.post<Envelope<{ session_id: number; remaining_seconds: number }>>(
    "/sessions/start/",
    { token },
    withToken(token),
  );
  return data.data;
}

export async function getSessionQuestions(
  sessionId: number,
  token: string,
): Promise<APIQuestion[]> {
  const { data } = await api.get<Envelope<APIQuestion[]>>(
    `/sessions/${sessionId}/questions/`,
    withToken(token),
  );
  return data.data;
}

export async function saveDraft(
  sessionId: number,
  token: string,
  answers: { question_id: number; response: Record<string, unknown> }[],
): Promise<void> {
  await api.post(
    `/sessions/${sessionId}/draft/`,
    { token, answers },
    withToken(token),
  );
}

export async function syncTimer(
  sessionId: number,
  token: string,
): Promise<{ remaining_seconds: number; status: string }> {
  const { data } = await api.get<Envelope<{ remaining_seconds: number; status: string }>>(
    `/sessions/${sessionId}/timer/`,
    withToken(token),
  );
  return data.data;
}

export async function submitSession(sessionId: number, token: string): Promise<void> {
  await api.post(
    `/sessions/${sessionId}/submit/`,
    { token },
    withToken(token),
  );
}

export async function logViolation(
  sessionId: number,
  token: string,
  type: string,
): Promise<void> {
  await api.post(
    `/sessions/${sessionId}/violations/`,
    { token, type },
    withToken(token),
  );
}

export async function uploadRecordingChunk(
  sessionId: number,
  token: string,
  chunk: Blob,
  chunkIndex: number,
): Promise<void> {
  const form = new FormData();
  form.append("chunk", chunk, `chunk_${chunkIndex}.webm`);
  form.append("chunk_index", String(chunkIndex));
  form.append("token", token);
  await api.post(`/sessions/${sessionId}/recording/`, form, {
    ...withToken(token),
    headers: {
      ...withToken(token).headers,
      "Content-Type": "multipart/form-data",
    },
  });
}

// ── HR / Reviewer calls ───────────────────────────────────────────────────────

export async function getSessions(): Promise<APISession[]> {
  const { data } = await api.get<Envelope<APISession[]>>("/sessions/");
  return data.data;
}

export async function getSession(id: number): Promise<APISession> {
  const { data } = await api.get<Envelope<APISession>>(`/sessions/${id}/`);
  return data.data;
}

export async function getRecordingUrl(
  sessionId: number,
): Promise<{ url: string; expires_in_seconds: number }> {
  const { data } = await api.get<Envelope<{ url: string; expires_in_seconds: number }>>(
    `/sessions/${sessionId}/recording-url/`,
  );
  return data.data;
}

export async function scoreAnswer(
  sessionId: number,
  answerId: number,
  payload: { manual_score: number; reviewer_comment?: string },
): Promise<void> {
  await api.post(`/sessions/${sessionId}/answers/${answerId}/score/`, payload);
}

export async function submitResult(
  sessionId: number,
  payload: { decision: "pass" | "fail" | "hold"; notes?: string },
): Promise<{ decision: string; score_pct: number; earned_points: number; total_points: number }> {
  const { data } = await api.post<Envelope<{
    decision: string; score_pct: number; earned_points: number; total_points: number;
  }>>(`/sessions/${sessionId}/result/`, payload);
  return data.data;
}