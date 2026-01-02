import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Plus, MapPin, Clock, Users, Download, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface TrainingSession {
  id: string;
  title: string;
  description: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  max_attendees: number;
  is_cancelled: boolean;
  program_id: string;
  location_id: string;
  instructor_id: string | null;
  programs?: { name: string };
  training_locations?: { name: string; code: string; city: string };
  teachers?: { first_name: string; last_name: string } | null;
}

interface Program {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  code: string;
  city: string;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

export default function AdminSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    session_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '12:00',
    max_attendees: 30,
    program_id: '',
    location_id: '',
    instructor_id: '',
  });

  // Fetch sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['training-sessions', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*, programs(name), training_locations(name, code, city), teachers(first_name, last_name)')
        .gte('session_date', format(start, 'yyyy-MM-dd'))
        .lte('session_date', format(end, 'yyyy-MM-dd'))
        .order('session_date', { ascending: true });
      if (error) throw error;
      return data as TrainingSession[];
    },
  });

  // Fetch programs, locations, teachers
  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data } = await supabase.from('programs').select('id, name').eq('is_active', true);
      return data as Program[];
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['training-locations'],
    queryFn: async () => {
      const { data } = await supabase.from('training_locations').select('id, name, code, city').eq('is_active', true);
      return data as Location[];
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await supabase.from('teachers').select('id, first_name, last_name').eq('is_active', true);
      return data as Teacher[];
    },
  });

  // Create session mutation
  const createSession = useMutation({
    mutationFn: async (sessionData: typeof form) => {
      const { error } = await supabase.from('training_sessions').insert({
        ...sessionData,
        instructor_id: sessionData.instructor_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast({ title: 'Success', description: 'Session created successfully' });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      session_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '12:00',
      max_attendees: 30,
      program_id: '',
      location_id: '',
      instructor_id: '',
    });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.program_id || !form.location_id || !form.session_date) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await createSession.mutateAsync(form);
    setSaving(false);
  };

  // Generate ICS file for export
  const generateICS = (session: TrainingSession) => {
    const startDate = `${session.session_date.replace(/-/g, '')}T${session.start_time.replace(/:/g, '')}00`;
    const endDate = `${session.session_date.replace(/-/g, '')}T${session.end_time.replace(/:/g, '')}00`;
    const location = session.training_locations ? `${session.training_locations.name}, ${session.training_locations.city}` : '';
    
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Meranos//Training Session//EN
BEGIN:VEVENT
UID:${session.id}@meranos.ng
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${session.title}
DESCRIPTION:${session.description || ''}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter sessions
  const filteredSessions = sessions.filter(s => 
    filterLocation === 'all' || s.location_id === filterLocation
  );

  // Get sessions for selected date
  const sessionsForDate = filteredSessions.filter(s => 
    isSameDay(parseISO(s.session_date), selectedDate)
  );

  // Get days with sessions for calendar highlighting
  const daysWithSessions = filteredSessions.map(s => parseISO(s.session_date));

  return (
    <DashboardLayout title="Session Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Training Sessions</h2>
            <p className="text-muted-foreground">Schedule and manage training sessions across locations</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  Previous
                </Button>
                <span className="font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar and Sessions Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={{ hasSession: daysWithSessions }}
                modifiersStyles={{
                  hasSession: { backgroundColor: 'hsl(var(--primary))', color: 'white', borderRadius: '50%' }
                }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Sessions List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                Sessions on {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
              <CardDescription>
                {sessionsForDate.length} session(s) scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessionsForDate.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sessions scheduled for this date
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionsForDate.map(session => (
                    <div 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg border",
                        session.is_cancelled ? "bg-destructive/10 border-destructive/30" : "bg-secondary/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{session.title}</h4>
                            {session.is_cancelled && (
                              <Badge variant="destructive">Cancelled</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {session.training_locations?.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              Max {session.max_attendees}
                            </span>
                          </div>
                          {session.programs && (
                            <Badge variant="outline" className="mt-2">{session.programs.name}</Badge>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateICS(session)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Sessions This Month */}
        <Card>
          <CardHeader>
            <CardTitle>All Sessions in {format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <CardDescription>{filteredSessions.length} total sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Title</th>
                    <th className="text-left py-3 px-4">Time</th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-left py-3 px-4">Program</th>
                    <th className="text-left py-3 px-4">Instructor</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map(session => (
                    <tr key={session.id} className="border-b hover:bg-secondary/30">
                      <td className="py-3 px-4">{format(parseISO(session.session_date), 'MMM d')}</td>
                      <td className="py-3 px-4 font-medium">{session.title}</td>
                      <td className="py-3 px-4">{session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{session.training_locations?.code}</Badge>
                      </td>
                      <td className="py-3 px-4">{session.programs?.name}</td>
                      <td className="py-3 px-4">
                        {session.teachers ? `${session.teachers.first_name} ${session.teachers.last_name}` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" onClick={() => generateICS(session)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Session Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>Schedule a new training session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Session Title *</Label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="e.g., Introduction to Networking"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={form.description} 
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Session details..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program *</Label>
                <Select value={form.program_id} onValueChange={(v) => setForm({...form, program_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                  <SelectContent>
                    {programs.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location *</Label>
                <Select value={form.location_id} onValueChange={(v) => setForm({...form, location_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {locations.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {form.session_date ? format(parseISO(form.session_date), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.session_date ? parseISO(form.session_date) : undefined}
                    onSelect={(date) => date && setForm({...form, session_date: format(date, 'yyyy-MM-dd')})}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input 
                  type="time" 
                  value={form.start_time} 
                  onChange={(e) => setForm({...form, start_time: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input 
                  type="time" 
                  value={form.end_time} 
                  onChange={(e) => setForm({...form, end_time: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Attendees</Label>
                <Input 
                  type="number" 
                  value={form.max_attendees} 
                  onChange={(e) => setForm({...form, max_attendees: parseInt(e.target.value) || 30})}
                />
              </div>
              <div className="space-y-2">
                <Label>Instructor</Label>
                <Select value={form.instructor_id} onValueChange={(v) => setForm({...form, instructor_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={saving} className="w-full bg-gradient-primary">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Session'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}