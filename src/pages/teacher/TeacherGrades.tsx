import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function TeacherGrades() {
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('course_progress')
        .select('*, student_registrations(first_name, last_name), programs(name)')
        .order('updated_at', { ascending: false });
      setProgress(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <DashboardLayout title="Student Grades">
      <Card>
        <CardHeader><CardTitle>Course Progress</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : progress.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No progress records</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden sm:table-cell">Program</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="hidden md:table-cell">Sessions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progress.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.student_registrations?.first_name} {p.student_registrations?.last_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{p.programs?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Number(p.completion_percentage)} className="w-16 sm:w-24" />
                          <span className="text-xs">{Number(p.completion_percentage).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{p.attended_sessions}/{p.total_sessions}</TableCell>
                      <TableCell><Badge variant={p.status === 'completed' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
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
