import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Lightbulb, Play, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  Challenge,
  TRACKS,
  TrackId,
  difficultyTone,
  fetchUserProgress,
  getChallenge,
  listChallenges,
  markGuestComplete,
  mergeGuestProgress,
  readGuestProgress,
  validateCode,
} from '@/lib/codingChallenges';

const clean = (html?: string) => DOMPurify.sanitize(html || '');

export default function PracticeWorkspace() {
  const { user } = useAuth();
  const [track, setTrack] = useState<TrackId>('html');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [current, setCurrent] = useState<Challenge | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ correct: boolean; feedback: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const merged = useRef(false);

  const trackMeta = useMemo(() => TRACKS.find((t) => t.id === track)!, [track]);

  const loadCompleted = useCallback(async () => {
    if (user) {
      const rows = await fetchUserProgress(user.id, track);
      setCompleted(new Set(rows.filter((r) => r.is_completed).map((r) => r.challenge_id)));
    } else {
      setCompleted(new Set(readGuestProgress()[track] ?? []));
    }
  }, [user, track]);

  useEffect(() => {
    if (user && !merged.current) {
      merged.current = true;
      mergeGuestProgress(user.id).then(loadCompleted).catch(() => undefined);
    }
  }, [user, loadCompleted]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setCurrent(null);
    setResult(null);
    listChallenges(track)
      .then((data) => {
        if (!active) return;
        setChallenges(Array.isArray(data) ? data : []);
      })
      .catch((e) => active && setError((e as Error).message))
      .finally(() => active && setLoading(false));
    loadCompleted();
    return () => {
      active = false;
    };
  }, [track, loadCompleted]);

  const openChallenge = async (id: number) => {
    setResult(null);
    setCode('');
    setCurrent(null);
    setError(null);
    try {
      const data = await getChallenge(track, id);
      setCurrent(data);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleCheck = async () => {
    if (!current) return;
    setChecking(true);
    setResult(null);
    try {
      const res = await validateCode(track, current.id, code);
      setResult({ correct: res.correct, feedback: res.feedback });
      if (res.correct) {
        setCompleted((prev) => new Set(prev).add(current.id));
        if (!user) markGuestComplete(track, current.id);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  const index = current ? challenges.findIndex((c) => c.id === current.id) : -1;
  const pct = challenges.length ? (completed.size / challenges.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Track selector + progress */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {TRACKS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={t.id === track ? 'default' : 'outline'}
              onClick={() => setTrack(t.id)}
              className="font-mono"
            >
              {t.label}
            </Button>
          ))}
        </div>
        <div className="min-w-[200px]">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Completed</span>
            <span className="font-mono">
              {completed.size}/{challenges.length}
            </span>
          </div>
          <Progress value={pct} />
        </div>
      </div>

      {!user && (
        <Card className="border-primary/30">
          <CardContent className="p-4 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
            You are practising as a guest — progress is kept on this device only.
            <Link to="/auth" className="text-primary underline underline-offset-4">
              Sign in
            </Link>
            to save it to your account.
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Challenge list */}
        <Card className="h-fit max-h-[70vh] overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-mono">{trackMeta.label} challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              challenges.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openChallenge(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    current?.id === c.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <span className="font-mono text-xs opacity-70 w-6 shrink-0">{c.id}</span>
                  <span className="flex-1 truncate">{c.topic}</span>
                  {completed.has(c.id) && <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Challenge detail */}
        <div className="space-y-4">
          {!current ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                Pick a challenge to start coding.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">{current.topic}</CardTitle>
                    <Badge variant="outline" className={difficultyTone(current.difficulty)}>
                      {current.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert [&_pre]:bg-muted [&_pre]:text-foreground [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_code]:font-mono text-sm"
                    dangerouslySetInnerHTML={{ __html: clean(current.introduction) }}
                  />
                  <div
                    className="text-sm font-medium [&_code]:font-mono"
                    dangerouslySetInnerHTML={{ __html: clean(current.description) }}
                  />
                  {!!current.hints?.length && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="hints" className="border-border">
                        <AccordionTrigger className="text-sm">
                          <span className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Hints
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            {current.hints.map((h, i) => (
                              <li key={i} dangerouslySetInnerHTML={{ __html: clean(h) }} />
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-mono">Your code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    rows={10}
                    placeholder="Write your answer here..."
                    className="w-full rounded-md border border-border bg-muted/60 p-3 font-mono text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={handleCheck} disabled={checking || !code.trim()}>
                      {checking ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Check answer
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={index <= 0}
                      onClick={() => openChallenge(challenges[index - 1].id)}
                      aria-label="Previous challenge"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={index < 0 || index >= challenges.length - 1}
                      onClick={() => openChallenge(challenges[index + 1].id)}
                      aria-label="Next challenge"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {result && (
                    <div
                      className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                        result.correct
                          ? 'border-primary/40 bg-primary/10 text-foreground'
                          : 'border-destructive/40 bg-destructive/10 text-foreground'
                      }`}
                    >
                      {result.correct ? (
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" />
                      ) : (
                        <XCircle className="w-4 h-4 mt-0.5 text-destructive" />
                      )}
                      <span>{result.feedback || (result.correct ? 'Correct!' : 'Not quite yet — try again.')}</span>
                    </div>
                  )}

                  {result?.correct && current.explanation && (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert text-sm"
                      dangerouslySetInnerHTML={{ __html: clean(current.explanation) }}
                    />
                  )}
                </CardContent>
              </Card>

              {trackMeta.preview && code.trim() && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono">Live preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <iframe
                      title="Live preview"
                      sandbox=""
                      srcDoc={code}
                      className="w-full h-56 rounded-md border border-border bg-white"
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
