/**
 * src/services/assessments.service.ts
 * ─────────────────────────────────────
 * Test builder API calls — create, update, publish tests and questions.
 */

import { api } from "@/lib/api";

export interface APIQuestion {
  id: number;
  type: "mcq" | "short_answer";
  body: string;
  payload: Record<string, unknown>;
  points: number;
  order_index: number;
}

export interface APITest {
  id: number;
  title: string;
  description: string;
  job_role: string;
  duration_mins: number;
  pass_mark_pct: number;
  status: "draft" | "published" | "archived";
  total_points: number;
  question_count?: number;
  created_at: string;
  questions?: APIQuestion[];
}

type Envelope<T> = { success: boolean; data: T };

// ── Tests ─────────────────────────────────────────────────────────────────────

export async function getTests(): Promise<APITest[]> {
  const { data } = await api.get<Envelope<APITest[]>>("/assessments/");
  return data.data;
}

export async function getTest(id: number): Promise<APITest> {
  const { data } = await api.get<Envelope<APITest>>(`/assessments/${id}/`);
  return data.data;
}

export async function createTest(payload: {
  title: string;
  description?: string;
  job_role?: string;
  duration_mins: number;
  pass_mark_pct?: number;
}): Promise<APITest> {
  const { data } = await api.post<Envelope<APITest>>("/assessments/", payload);
  return data.data;
}

export async function updateTest(
  id: number,
  payload: Partial<{ title: string; description: string; job_role: string; duration_mins: number; pass_mark_pct: number }>,
): Promise<APITest> {
  const { data } = await api.patch<Envelope<APITest>>(`/assessments/${id}/`, payload);
  return data.data;
}

export async function publishTest(id: number): Promise<APITest> {
  const { data } = await api.post<Envelope<APITest>>(`/assessments/${id}/publish/`);
  return data.data;
}

export async function deleteTest(id: number): Promise<void> {
  await api.delete(`/assessments/${id}/`);
}

// ── Questions ─────────────────────────────────────────────────────────────────

export async function addQuestion(
  testId: number,
  payload: { type: string; body: string; payload: Record<string, unknown>; points: number },
): Promise<APIQuestion> {
  const { data } = await api.post<Envelope<APIQuestion>>(
    `/assessments/${testId}/questions/`,
    payload,
  );
  return data.data;
}

export async function updateQuestion(
  testId: number,
  questionId: number,
  payload: Partial<{ body: string; payload: Record<string, unknown>; points: number; order_index: number }>,
): Promise<APIQuestion> {
  const { data } = await api.patch<Envelope<APIQuestion>>(
    `/assessments/${testId}/questions/${questionId}/`,
    payload,
  );
  return data.data;
}

export async function deleteQuestion(testId: number, questionId: number): Promise<void> {
  await api.delete(`/assessments/${testId}/questions/${questionId}/`);
}