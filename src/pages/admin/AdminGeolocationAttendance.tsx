import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Clock, Users, CheckCircle, XCircle, AlertCircle, Calendar as CalendarIcon, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface CheckIn {
  id: string;
  check_in_time: string;
  latitude: number;
  longitude: number;
  distance_from_center_meters: number;
  is_within_geofence: boolean;
  verification_status: string;
  device_info: any;
  notes: string | null;
  student_registrations?: { first_name: string; last_name: string; email: string };
  training_sessions?: { 
    title: string; 
    session_date: string;
    training_locations?: { name: string; code: string };
  };
}

interface Location {
  id: string;
  name: string;
  code: string;
}

export default function AdminGeolocationAttendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['training-locations'],
    queryFn: async () => {
      const { data } = await supabase.from('training_locations').select('id, name, code');
      return data as Location[];
    },
  });

  // Fetch check-ins
  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['geolocation-checkins', format(selectedDate, 'yyyy-MM-dd'), filterLocation, filterStatus],
    queryFn: async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      let query = supabase
        .from('geolocation_checkins')
        .select(`
          *,
          student_registrations(first_name, last_name, email),
          training_sessions(title, session_date, training_locations(name, code))
        `)
        .gte('check_in_time', `${dateStr}T00:00:00`)
        .lte('check_in_time', `${dateStr}T23:59:59`)
        .order('check_in_time', { ascending: false });
      
      if (filterStatus !== 'all') {
        query = query.eq('verification_status', filterStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by location after fetch (nested filter)
      let filtered = data as CheckIn[];
      if (filterLocation !== 'all') {
        filtered = filtered.filter(c => 
          c.training_sessions?.training_locations?.code === locations.find(l => l.id === filterLocation)?.code
        );
      }
      
      return filtered;
    },
  });

  // Verify check-in mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ checkInId, status }: { checkInId: string; status: string }) => {
      const { error } = await supabase
        .from('geolocation_checkins')
        .update({ 
          verification_status: status,
          verified_at: new Date().toISOString(),
        })
        .eq('id', checkInId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geolocation-checkins'] });
      toast({ title: 'Updated', description: 'Check-in status updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Stats
  const stats = {
    total: checkIns.length,
    verified: checkIns.filter(c => c.verification_status === 'verified').length,
    pending: checkIns.filter(c => c.verification_status === 'pending').length,
    rejected: checkIns.filter(c => c.verification_status === 'rejected').length,
    withinGeofence: checkIns.filter(c => c.is_within_geofence).length,
  };

  const getStatusBadge = (status: string, isWithinGeofence: boolean) => {
    if (status === 'verified') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    }
    if (status === 'rejected') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    if (status === 'manual_override') {
      return <Badge className="bg-blue-100 text-blue-800">Manual</Badge>;
    }
    return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Time', 'Student', 'Email', 'Session', 'Location', 'Distance (m)', 'Within Geofence', 'Status'];
    const rows = checkIns.map(c => [
      format(parseISO(c.check_in_time), 'HH:mm:ss'),
      `${c.student_registrations?.first_name} ${c.student_registrations?.last_name}`,
      c.student_registrations?.email || '',
      c.training_sessions?.title || '',
      c.training_sessions?.training_locations?.name || '',
      c.distance_from_center_meters?.toString() || '',
      c.is_within_geofence ? 'Yes' : 'No',
      c.verification_status,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Geolocation Attendance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Geolocation Attendance</h2>
            <p className="text-muted-foreground">Monitor and verify location-based check-ins</p>
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Check-ins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
              <p className="text-sm text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.withinGeofence}</p>
              <p className="text-sm text-muted-foreground">Within Geofence</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                  />
                </PopoverContent>
              </Popover>
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
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Check-ins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Check-ins for {format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
            <CardDescription>{checkIns.length} check-in(s) found</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : checkIns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No check-ins found for this date
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Time</th>
                      <th className="text-left py-3 px-4">Student</th>
                      <th className="text-left py-3 px-4">Session</th>
                      <th className="text-left py-3 px-4">Location</th>
                      <th className="text-left py-3 px-4">Distance</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkIns.map(checkIn => (
                      <tr key={checkIn.id} className="border-b hover:bg-secondary/30">
                        <td className="py-3 px-4">
                          {format(parseISO(checkIn.check_in_time), 'HH:mm:ss')}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">
                              {checkIn.student_registrations?.first_name} {checkIn.student_registrations?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{checkIn.student_registrations?.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{checkIn.training_sessions?.title}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">
                            {checkIn.training_sessions?.training_locations?.code}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className={checkIn.is_within_geofence ? 'text-green-600' : 'text-amber-600'}>
                            {checkIn.distance_from_center_meters?.toFixed(0)}m
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(checkIn.verification_status, checkIn.is_within_geofence)}
                        </td>
                        <td className="py-3 px-4">
                          {checkIn.verification_status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => verifyMutation.mutate({ checkInId: checkIn.id, status: 'verified' })}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => verifyMutation.mutate({ checkInId: checkIn.id, status: 'rejected' })}
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}