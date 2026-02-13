import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function TeacherTimetable() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('training_sessions')
        .select('*, programs(name), training_locations(name)')
        .order('session_date', { ascending: true });
      setSessions(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const groupedByDate: Record<string, any[]> = {};
  sessions.forEach(s => {
    const date = new Date(s.session_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(s);
  });

  return (
    <DashboardLayout title="Timetable">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : sessions.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No sessions scheduled</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" />{date}</h3>
              <div className="space-y-3">
                {items.map(s => (
                  <Card key={s.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{(s.programs as any)?.name || 'Session'}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.start_time} - {s.end_time}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{(s.training_locations as any)?.name || 'TBD'}</span>
                          </div>
                        </div>
                        <Badge variant={s.status === 'completed' ? 'default' : 'secondary'}>{s.status || 'scheduled'}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
