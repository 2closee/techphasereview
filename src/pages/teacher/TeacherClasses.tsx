import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function TeacherClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('course_batches')
        .select('*, programs(name, category), training_locations(name)')
        .order('created_at', { ascending: false });
      setClasses(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <DashboardLayout title="My Classes">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : classes.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No classes assigned yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{(c.programs as any)?.name || 'Program'}</CardTitle>
                  <Badge variant={c.status === 'open' ? 'default' : 'secondary'}>{c.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><BookOpen className="w-4 h-4" /><span>Batch {c.batch_number}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" /><span>{c.current_count} / {c.max_students} students</span></div>
                  <p className="text-xs text-muted-foreground">{(c.training_locations as any)?.name || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
