import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Code2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { downloadCsv } from '@/utils/csvExport';
import { TRACKS } from '@/lib/codingChallenges';

interface Row {
  user_id: string;
  track: string;
  challenge_id: number;
  attempts: number;
  is_completed: boolean;
  completed_at: string | null;
}

interface StudentSummary {
  user_id: string;
  name: string;
  email: string;
  attempted: number;
  completed: number;
  perTrack: Record<string, { attempted: number; completed: number }>;
  lastActivity: string | null;
}

export default function PracticeReport() {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Row[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: progress } = await supabase
        .from('coding_challenge_progress')
        .select('user_id, track, challenge_id, attempts, is_completed, completed_at');
      const rows = (progress ?? []) as Row[];
      setDetails(rows);

      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profiles } = ids.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', ids)
        : { data: [] as any[] };

      const map = new Map<string, StudentSummary>();
      rows.forEach((r) => {
        const profile = profiles?.find((p) => p.id === r.user_id);
        const entry =
          map.get(r.user_id) ??
          {
            user_id: r.user_id,
            name: profile?.full_name || 'Unknown learner',
            email: profile?.email || '',
            attempted: 0,
            completed: 0,
            perTrack: {},
            lastActivity: null,
          };
        entry.attempted += 1;
        if (r.is_completed) entry.completed += 1;
        const t = (entry.perTrack[r.track] ??= { attempted: 0, completed: 0 });
        t.attempted += 1;
        if (r.is_completed) t.completed += 1;
        if (r.completed_at && (!entry.lastActivity || r.completed_at > entry.lastActivity)) {
          entry.lastActivity = r.completed_at;
        }
        map.set(r.user_id, entry);
      });

      setSummaries(Array.from(map.values()).sort((a, b) => b.completed - a.completed));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [summaries, search]);

  const handleExport = () => {
    downloadCsv(
      'coding-practice-progress.csv',
      ['Name', 'Email', 'Challenges attempted', 'Challenges completed', ...TRACKS.map((t) => `${t.label} completed`), 'Last completion'],
      filtered.map((s) => [
        s.name,
        s.email,
        String(s.attempted),
        String(s.completed),
        ...TRACKS.map((t) => String(s.perTrack[t.id]?.completed ?? 0)),
        s.lastActivity ? new Date(s.lastActivity).toLocaleDateString() : '',
      ]),
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search learner by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button variant="outline" onClick={handleExport} disabled={!filtered.length}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No practice activity recorded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.user_id}>
              <CardHeader
                className="pb-2 cursor-pointer"
                onClick={() => setExpanded(expanded === s.user_id ? null : s.user_id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    {s.name}
                    <span className="text-xs font-normal text-muted-foreground">{s.email}</span>
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {TRACKS.filter((t) => s.perTrack[t.id]).map((t) => (
                      <Badge key={t.id} variant="outline" className="font-mono text-xs">
                        {t.label} {s.perTrack[t.id].completed}/{s.perTrack[t.id].attempted}
                      </Badge>
                    ))}
                    <Badge className="font-mono text-xs">{s.completed} completed</Badge>
                  </div>
                </div>
              </CardHeader>
              {expanded === s.user_id && (
                <CardContent className="pt-0">
                  <div className="grid gap-1 text-sm sm:grid-cols-2">
                    {details
                      .filter((d) => d.user_id === s.user_id)
                      .sort((a, b) => a.track.localeCompare(b.track) || a.challenge_id - b.challenge_id)
                      .map((d) => (
                        <div
                          key={`${d.track}-${d.challenge_id}`}
                          className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-1.5"
                        >
                          <span className="font-mono text-xs uppercase">
                            {d.track} #{d.challenge_id}
                          </span>
                          <span className={d.is_completed ? 'text-primary' : 'text-muted-foreground'}>
                            {d.is_completed ? 'Completed' : `${d.attempts} attempt(s)`}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
