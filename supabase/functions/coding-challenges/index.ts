import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const UPSTREAM = 'https://efiwe.com/api/api.php/api';
const TRACKS = ['html', 'css', 'js', 'sql', 'php'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// simple in-memory cache for challenge lists
const cache = new Map<string, { at: number; data: unknown }>();
const CACHE_MS = 10 * 60 * 1000;

async function upstream(path: string, init?: RequestInit) {
  const res = await fetch(`${UPSTREAM}/${path}`, init);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unexpected response from the challenge service');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const action = String(body.action ?? url.searchParams.get('action') ?? 'list');
    const track = String(body.track ?? url.searchParams.get('track') ?? 'html').toLowerCase();

    if (!TRACKS.includes(track)) return json({ error: 'Unknown track' }, 400);

    if (action === 'tracks') return json({ tracks: TRACKS });

    if (action === 'list') {
      const key = `list:${track}`;
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return json(hit.data);
      const data = await upstream(`${track}/challenges`);
      cache.set(key, { at: Date.now(), data });
      return json(data);
    }

    if (action === 'get') {
      const id = Number(body.id ?? url.searchParams.get('id'));
      if (!Number.isInteger(id) || id < 1) return json({ error: 'Invalid challenge id' }, 400);
      const key = `get:${track}:${id}`;
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return json(hit.data);
      const data = await upstream(`${track}/challenge/${id}`);
      cache.set(key, { at: Date.now(), data });
      return json(data);
    }

    if (action === 'validate') {
      const id = Number(body.id);
      const code = typeof body.code === 'string' ? body.code : '';
      if (!Number.isInteger(id) || id < 1) return json({ error: 'Invalid challenge id' }, 400);
      if (code.length > 20000) return json({ error: 'Submission is too long' }, 400);

      const result = await upstream(`${track}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, code, mode: 'default' }),
      });

      const isCorrect = result?.correct === true;
      const feedback = typeof result?.feedback === 'string' ? result.feedback : null;

      // Record progress for signed-in users (pass flag comes from upstream, not the client)
      const authHeader = req.headers.get('Authorization') ?? '';
      if (authHeader.startsWith('Bearer ')) {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        const { data: userData } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
        const userId = userData?.user?.id;
        if (userId) {
          await admin.from('coding_challenge_attempts').insert({
            user_id: userId,
            track,
            challenge_id: id,
            submitted_code: code,
            is_correct: isCorrect,
            feedback,
          });

          const { data: existing } = await admin
            .from('coding_challenge_progress')
            .select('id, attempts, is_completed')
            .eq('user_id', userId)
            .eq('track', track)
            .eq('challenge_id', id)
            .maybeSingle();

          if (existing) {
            await admin
              .from('coding_challenge_progress')
              .update({
                attempts: (existing.attempts ?? 0) + 1,
                is_completed: existing.is_completed || isCorrect,
                completed_at: existing.is_completed
                  ? undefined
                  : isCorrect
                    ? new Date().toISOString()
                    : null,
              })
              .eq('id', existing.id);
          } else {
            await admin.from('coding_challenge_progress').insert({
              user_id: userId,
              track,
              challenge_id: id,
              attempts: 1,
              is_completed: isCorrect,
              completed_at: isCorrect ? new Date().toISOString() : null,
            });
          }
        }
      }

      return json({ correct: isCorrect, feedback, diagnostics: result?.diagnostics ?? [] });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
