import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, Users, Calendar, CheckCircle, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isFuture, isPast, isToday } from 'date-fns';

interface Session {
  id: string;
  title: string;
  description: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  max_attendees: number;
  is_cancelled: boolean;
  programs?: { name: string };
  training_locations?: { 
    id: string;
    name: string; 
    code: string; 
    city: string;
  };
  teachers?: { first_name: string; last_name: string } | null;
  session_enrollments?: { id: string; student_id: string; status: string }[];
}

interface StudentRegistration {
  id: string;
  first_name: string;
  last_name: string;
  program_id: string;
  preferred_location_id: string | null;
}

interface Location {
  id: string;
  name: string;
  code: string;
  city: string;
}

export default function StudentEnrollment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [enrollingSession, setEnrollingSession] = useState<string | null>(null);

  // Get student registration
  const { data: studentReg } = useQuery({
    queryKey: ['student-registration', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('student_registrations')
        .select('id, first_name, last_name, program_id, preferred_location_id')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as StudentRegistration;
    },
    enabled: !!user?.id,
  });

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['training-locations'],
    queryFn: async () => {
      const { data } = await supabase.from('training_locations').select('id, name, code, city').eq('is_active', true);
      return data as Location[];
    },
  });

  // Fetch upcoming sessions for student's program
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['student-sessions', studentReg?.program_id, filterLocation],
    queryFn: async () => {
      if (!studentReg?.program_id) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      let query = supabase
        .from('training_sessions')
        .select(`
          *,
          programs(name),
          training_locations(id, name, code, city),
          teachers(first_name, last_name),
          session_enrollments(id, student_id, status)
        `)
        .eq('program_id', studentReg.program_id)
        .eq('is_cancelled', false)
        .gte('session_date', today)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (filterLocation !== 'all') {
        query = query.eq('location_id', filterLocation);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Session[];
    },
    enabled: !!studentReg?.program_id,
  });

  // Enroll in session mutation
  const enrollMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!studentReg?.id) throw new Error('Student not found');
      
      const { error } = await supabase.from('session_enrollments').insert({
        session_id: sessionId,
        student_id: studentReg.id,
        status: 'enrolled',
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-sessions'] });
      toast({ title: 'Enrolled!', description: 'You have successfully enrolled in this session.' });
    },
    onError: (error: any) => {
      if (error.message.includes('duplicate')) {
        toast({ title: 'Already Enrolled', description: 'You are already enrolled in this session.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  // Cancel enrollment mutation
  const cancelMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('session_enrollments')
        .update({ status: 'cancelled' })
        .eq('id', enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-sessions'] });
      toast({ title: 'Cancelled', description: 'Your enrollment has been cancelled.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleEnroll = async (sessionId: string) => {
    setEnrollingSession(sessionId);
    await enrollMutation.mutateAsync(sessionId);
    setEnrollingSession(null);
  };

  const getEnrollmentStatus = (session: Session) => {
    if (!studentReg?.id || !session.session_enrollments) return null;
    return session.session_enrollments.find(e => e.student_id === studentReg.id);
  };

  const getCurrentEnrollmentCount = (session: Session) => {
    if (!session.session_enrollments) return 0;
    return session.session_enrollments.filter(e => e.status === 'enrolled').length;
  };

  // Generate ICS file
  const generateICS = (session: Session) => {
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

  return (
    <DashboardLayout title="Session Enrollment">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-display font-bold">Available Sessions</h2>
          <p className="text-muted-foreground">Enroll in upcoming training sessions</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.city})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                No upcoming sessions found for your program
              </CardContent>
            </Card>
          ) : (
            sessions.map(session => {
              const enrollment = getEnrollmentStatus(session);
              const isEnrolled = enrollment?.status === 'enrolled';
              const enrolledCount = getCurrentEnrollmentCount(session);
              const isFull = enrolledCount >= session.max_attendees;
              const sessionDate = parseISO(session.session_date);
              
              return (
                <Card key={session.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Date Column */}
                    <div className="bg-primary/5 p-6 flex flex-col items-center justify-center md:w-32">
                      <span className="text-3xl font-bold text-primary">{format(sessionDate, 'd')}</span>
                      <span className="text-sm text-muted-foreground">{format(sessionDate, 'MMM')}</span>
                      <span className="text-xs text-muted-foreground">{format(sessionDate, 'yyyy')}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{session.title}</h3>
                            {isToday(sessionDate) && (
                              <Badge className="bg-green-100 text-green-800">Today</Badge>
                            )}
                            {isEnrolled && (
                              <Badge><CheckCircle className="w-3 h-3 mr-1" />Enrolled</Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {session.training_locations?.name}, {session.training_locations?.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {enrolledCount}/{session.max_attendees} enrolled
                            </span>
                          </div>
                          
                          {session.description && (
                            <p className="text-sm text-muted-foreground mb-3">{session.description}</p>
                          )}
                          
                          {session.teachers && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Instructor:</span>{' '}
                              {session.teachers.first_name} {session.teachers.last_name}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {isEnrolled ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => generateICS(session)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Add to Calendar
                              </Button>
                              {isFuture(sessionDate) && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => enrollment && cancelMutation.mutate(enrollment.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </>
                          ) : isFull ? (
                            <Button disabled variant="secondary">
                              Session Full
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleEnroll(session.id)}
                              disabled={enrollingSession === session.id}
                              className="bg-gradient-primary"
                            >
                              {enrollingSession === session.id ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enrolling...</>
                              ) : (
                                'Enroll Now'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}