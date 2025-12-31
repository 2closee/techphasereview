import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, Check, X, Clock, UserX, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentAttendance {
  studentId: string;
  studentName: string;
  status: AttendanceStatus | null;
  attendanceId?: string;
}

export default function TeacherAttendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch active programs
  const { data: programs = [] } = useQuery({
    queryKey: ['programs-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, category')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch enrolled students for selected program
  const { data: students = [] } = useQuery({
    queryKey: ['enrolled-students', selectedProgram],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from('student_registrations')
        .select('id, first_name, last_name')
        .eq('program_id', selectedProgram)
        .eq('status', 'enrolled')
        .order('last_name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProgram,
  });

  // Fetch existing attendance for the selected date and program
  const { data: existingAttendance = [] } = useQuery({
    queryKey: ['attendance', selectedProgram, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from('attendance')
        .select('id, student_id, status')
        .eq('program_id', selectedProgram)
        .eq('date', format(selectedDate, 'yyyy-MM-dd'));
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProgram,
  });

  // Combine students with their attendance status
  const studentAttendanceList: StudentAttendance[] = students.map((student) => {
    const attendance = existingAttendance.find((a) => a.student_id === student.id);
    return {
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      status: attendance?.status as AttendanceStatus | null,
      attendanceId: attendance?.id,
    };
  });

  // Mutation for marking attendance
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, status, attendanceId }: { studentId: string; status: AttendanceStatus; attendanceId?: string }) => {
      if (attendanceId) {
        // Update existing
        const { error } = await supabase
          .from('attendance')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', attendanceId);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            program_id: selectedProgram,
            date: format(selectedDate, 'yyyy-MM-dd'),
            status,
            marked_by: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedProgram, format(selectedDate, 'yyyy-MM-dd')] });
      toast.success('Attendance marked');
    },
    onError: (error) => {
      toast.error('Failed to mark attendance');
      console.error(error);
    },
  });

  const handleMarkAttendance = (studentId: string, status: AttendanceStatus, attendanceId?: string) => {
    markAttendanceMutation.mutate({ studentId, status, attendanceId });
  };

  // Bulk mark all as present
  const markAllPresent = () => {
    studentAttendanceList.forEach((student) => {
      if (student.status !== 'present') {
        handleMarkAttendance(student.studentId, 'present', student.attendanceId);
      }
    });
  };

  const getStatusBadge = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Late</Badge>;
      case 'excused':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Excused</Badge>;
      default:
        return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  const presentCount = studentAttendanceList.filter((s) => s.status === 'present').length;
  const absentCount = studentAttendanceList.filter((s) => s.status === 'absent').length;

  return (
    <DashboardLayout title="Attendance">
      <div className="space-y-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
            <CardDescription>Select a program and date to mark student attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name} ({program.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {selectedProgram && students.length > 0 && (
                <Button onClick={markAllPresent} variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Mark All Present
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {selectedProgram && students.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <X className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student List */}
        {selectedProgram && (
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {students.length === 0
                  ? 'No enrolled students in this program'
                  : `${students.length} enrolled students`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No enrolled students found for this program.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentAttendanceList.map((student) => (
                    <div
                      key={student.studentId}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {student.studentName.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          {getStatusBadge(student.status)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={student.status === 'present' ? 'default' : 'outline'}
                          className={student.status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => handleMarkAttendance(student.studentId, 'present', student.attendanceId)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={student.status === 'absent' ? 'default' : 'outline'}
                          className={student.status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => handleMarkAttendance(student.studentId, 'absent', student.attendanceId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={student.status === 'late' ? 'default' : 'outline'}
                          className={student.status === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                          onClick={() => handleMarkAttendance(student.studentId, 'late', student.attendanceId)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedProgram && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a program to view and mark attendance</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
