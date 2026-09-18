import { supabase } from '@/integrations/supabase/client';

export const TRACKS = [
  { id: 'html', label: 'HTML', preview: true },
  { id: 'css', label: 'CSS', preview: false },
  { id: 'js', label: 'JavaScript', preview: false },
  { id: 'sql', label: 'SQL', preview: false },
  { id: 'php', label: 'PHP', preview: false },
] as const;

export type TrackId = (typeof TRACKS)[number]['id'];

export interface Challenge {
  id: number;
  topic: string;
  difficulty: string;
  introduction?: string;
  description?: string;
  hints?: string[];
  explanation?: string;
}

export interface ValidationResult {
  correct: boolean;
  feedback: string | null;
  diagnostics?: unknown[];
}

async function callFn<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('coding-challenges', { body });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as T;
}

export const listChallenges = (track: TrackId) =>
  callFn<Challenge[]>({ action: 'list', track });

export const getChallenge = (track: TrackId, id: number) =>
  callFn<Challenge>({ action: 'get', track, id });

export const validateCode = (track: TrackId, id: number, code: string) =>
  callFn<ValidationResult>({ action: 'validate', track, id, code });

/* ---------- guest progress (local storage) ---------- */

const GUEST_KEY = 'meranos_practice_progress';

type GuestProgress = Record<string, number[]>; // track -> completed challenge ids

export function readGuestProgress(): GuestProgress {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || '{}');
  } catch {
    return {};
  }
}

export function markGuestComplete(track: string, id: number) {
  const all = readGuestProgress();
  const list = new Set(all[track] ?? []);
  list.add(id);
  all[track] = Array.from(list);
  localStorage.setItem(GUEST_KEY, JSON.stringify(all));
}

export function clearGuestProgress() {
  localStorage.removeItem(GUEST_KEY);
}

/** Push any locally-stored guest completions into the signed-in user's account. */
export async function mergeGuestProgress(userId: string) {
  const all = readGuestProgress();
  const rows = Object.entries(all).flatMap(([track, ids]) =>
    ids.map((id) => ({
      user_id: userId,
      track,
      challenge_id: id,
      attempts: 1,
      is_completed: true,
      completed_at: new Date().toISOString(),
    })),
  );
  if (!rows.length) return;
  for (const row of rows) {
    const { data: existing } = await supabase
      .from('coding_challenge_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('track', row.track)
      .eq('challenge_id', row.challenge_id)
      .maybeSingle();
    if (!existing) await supabase.from('coding_challenge_progress').insert(row);
  }
  clearGuestProgress();
}

export async function fetchUserProgress(userId: string, track?: string) {
  let query = supabase
    .from('coding_challenge_progress')
    .select('track, challenge_id, attempts, is_completed, completed_at')
    .eq('user_id', userId);
  if (track) query = query.eq('track', track);
  const { data } = await query;
  return data ?? [];
}

export function difficultyTone(difficulty: string) {
  switch ((difficulty || '').toLowerCase()) {
    case 'easy':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'medium':
      return 'bg-accent/10 text-accent-foreground border-accent/30';
    default:
      return 'bg-destructive/10 text-destructive border-destructive/30';
  }
}
