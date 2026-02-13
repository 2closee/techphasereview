import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function StudentCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get student registration IDs for this user
      const { data: regs } = await supabase.from('student_registrations').select('id, program_id, programs(name, description, duration, duration_unit, category)').eq('user_id', user.id).eq('status', 'enrolled');
      if (!regs?.length) { setLoading(false); return; }

      // Get progress for each
      const regIds = regs.map(r => r.id);
      const { data: progress } = await supabase.from('course_progress').select('*').in('student_id', regIds);

      const merged = regs.map(r => {
        const prog = progress?.find(p => p.student_id === r.id && p.program_id === r.program_id);
        return { ...r, progress: prog };
      });
      setCourses(merged);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <DashboardLayout title="My Courses"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="My Courses">
      {courses.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No enrolled courses</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" />{(c.programs as any)?.name}</CardTitle>
                  <Badge>{(c.programs as any)?.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{(c.programs as any)?.description || 'No description'}</p>
                <p className="text-xs text-muted-foreground">Duration: {(c.programs as any)?.duration} {(c.programs as any)?.duration_unit}</p>
                {c.progress && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{Number(c.progress.completion_percentage).toFixed(0)}%</span>
                    </div>
                    <Progress value={Number(c.progress.completion_percentage)} />
                    <p className="text-xs text-muted-foreground mt-1">{c.progress.attended_sessions}/{c.progress.total_sessions} sessions attended</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
