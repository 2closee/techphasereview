import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Code2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserProgress } from '@/lib/codingChallenges';

export default function PracticeSummaryCard() {
  const { user } = useAuth();
  const [completed, setCompleted] = useState(0);
  const [attempted, setAttempted] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchUserProgress(user.id).then((rows) => {
      if (!active) return;
      setAttempted(rows.length);
      setCompleted(rows.filter((r) => r.is_completed).length);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const pct = attempted ? (completed / attempted) * 100 : 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Code2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Coding Practice Lab</p>
              <p className="text-sm text-muted-foreground">
                {attempted === 0
                  ? 'Start practising HTML, CSS, JavaScript, SQL and PHP with instant feedback.'
                  : `${completed} of ${attempted} challenges you have opened are completed.`}
              </p>
              {attempted > 0 && <Progress value={pct} className="mt-3 w-48" />}
            </div>
          </div>
          <Link to="/student/practice">
            <Button size="sm">{attempted === 0 ? 'Start practising' : 'Continue'}</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
