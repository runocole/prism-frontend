/**
 * src/services/invites.service.ts
 * ────────────────────────────────
 * Invite management — single, batch, validate, revoke.
 */

import { api } from "@/lib/api";

export interface APIInvite {
  id: number;
  test: number;
  test_title: string;
  test_job_role: string;
  candidate_name: string;
  candidate_email: string;
  token: string;
  status: "pending" | "active" | "submitted" | "expired";
  expires_at: string;
  invite_url: string;
  created_at: string;
}

export interface ValidateInviteResponse {
  candidate_name: string;
  candidate_email: string;
  test: {
    title: string;
    description: string;
    duration_mins: number;
    question_count: number;
  };
  expires_at: string;
}

type Envelope<T> = { success: boolean; data: T };

export async function getInvites(testId?: number): Promise<APIInvite[]> {
  const params = testId ? { test_id: testId } : {};
  const { data } = await api.get<Envelope<APIInvite[]>>("/invites/", { params });
  return data.data;
}

export async function sendInvite(payload: {
  test_id: number;
  candidate_name: string;
  candidate_email: string;
  expires_at?: string;
}): Promise<APIInvite> {
  const { data } = await api.post<Envelope<APIInvite>>("/invites/", payload);
  return data.data;
}

export async function sendBatchInvites(payload: {
  test_id: number;
  candidates: { name: string; email: string }[];
  expires_at?: string;
}): Promise<{ created: number; invites: APIInvite[] }> {
  const { data } = await api.post<Envelope<{ created: number; invites: APIInvite[] }>>(
    "/invites/batch/",
    payload,
  );
  return data.data;
}

export async function revokeInvite(id: number): Promise<void> {
  await api.post(`/invites/${id}/revoke/`);
}

/** Public — no JWT needed. Called from the candidate instructions page. */
export async function validateInviteToken(token: string): Promise<ValidateInviteResponse> {
  const { data } = await api.get<Envelope<ValidateInviteResponse>>(
    `/invites/validate/${token}/`,
  );
  return data.data;
}