import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function StudentGrades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: regs } = await supabase.from('student_registrations').select('id').eq('user_id', user.id);
      if (!regs?.length) { setLoading(false); return; }
      const { data } = await supabase.from('course_progress').select('*, programs(name)').in('student_id', regs.map(r => r.id));
      setGrades(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout title="My Grades">
      <Card>
        <CardHeader><CardTitle>Course Progress</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : grades.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No grades available</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="hidden sm:table-cell">Sessions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map(g => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.programs?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Number(g.completion_percentage)} className="w-16 sm:w-24" />
                          <span className="text-xs">{Number(g.completion_percentage).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">{g.attended_sessions}/{g.total_sessions}</TableCell>
                      <TableCell><Badge variant={g.status === 'completed' ? 'default' : 'secondary'}>{g.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
