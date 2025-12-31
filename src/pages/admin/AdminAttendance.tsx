import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarIcon, Users, CheckCircle, XCircle, Clock, TrendingUp, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#22c55e', '#ef4444', '#eab308', '#3b82f6'];

export default function AdminAttendance() {
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));

  // Fetch programs
  const { data: programs = [] } = useQuery({
    queryKey: ['programs-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, category')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch attendance data
  const { data: attendanceData = [], isLoading } = useQuery({
    queryKey: ['attendance-report', selectedProgram, format(dateFrom, 'yyyy-MM-dd'), format(dateTo, 'yyyy-MM-dd')],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          program_id,
          student_id,
          programs!inner(name, category),
          student_registrations!inner(first_name, last_name)
        `)
        .gte('date', format(dateFrom, 'yyyy-MM-dd'))
        .lte('date', format(dateTo, 'yyyy-MM-dd'));

      if (selectedProgram !== 'all') {
        query = query.eq('program_id', selectedProgram);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Calculate statistics
  const stats = {
    total: attendanceData.length,
    present: attendanceData.filter((a) => a.status === 'present').length,
    absent: attendanceData.filter((a) => a.status === 'absent').length,
    late: attendanceData.filter((a) => a.status === 'late').length,
    excused: attendanceData.filter((a) => a.status === 'excused').length,
  };

  const attendanceRate = stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0;

  // Pie chart data
  const pieData = [
    { name: 'Present', value: stats.present },
    { name: 'Absent', value: stats.absent },
    { name: 'Late', value: stats.late },
    { name: 'Excused', value: stats.excused },
  ].filter((d) => d.value > 0);

  // Program breakdown
  const programBreakdown = programs.map((program) => {
    const programRecords = attendanceData.filter((a) => a.program_id === program.id);
    const present = programRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
    const total = programRecords.length;
    return {
      name: program.name,
      category: program.category,
      total,
      present,
      rate: total > 0 ? (present / total) * 100 : 0,
    };
  }).filter((p) => p.total > 0);

  // Daily trend data
  const dailyTrend = attendanceData.reduce((acc, record) => {
    const date = record.date;
    if (!acc[date]) {
      acc[date] = { date, present: 0, absent: 0, late: 0, total: 0 };
    }
    acc[date].total++;
    if (record.status === 'present') acc[date].present++;
    if (record.status === 'absent') acc[date].absent++;
    if (record.status === 'late') acc[date].late++;
    return acc;
  }, {} as Record<string, { date: string; present: number; absent: number; late: number; total: number }>);

  const trendData = Object.values(dailyTrend)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      date: format(new Date(d.date), 'MMM dd'),
      rate: d.total > 0 ? Math.round(((d.present + d.late) / d.total) * 100) : 0,
    }));

  // Quick date range presets
  const setDateRange = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case 'today':
        setDateFrom(today);
        setDateTo(today);
        break;
      case 'week':
        setDateFrom(subDays(today, 7));
        setDateTo(today);
        break;
      case 'month':
        setDateFrom(startOfMonth(today));
        setDateTo(endOfMonth(today));
        break;
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(today), 1);
        setDateFrom(startOfMonth(lastMonth));
        setDateTo(endOfMonth(lastMonth));
        break;
    }
  };

  return (
    <DashboardLayout title="Attendance Reports">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Select program and date range to view attendance reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Program</label>
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateFrom, 'MMM dd, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => date && setDateFrom(date)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateTo, 'MMM dd, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => date && setDateTo(date)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDateRange('today')}>Today</Button>
                <Button variant="outline" size="sm" onClick={() => setDateRange('week')}>Last 7 Days</Button>
                <Button variant="outline" size="sm" onClick={() => setDateRange('month')}>This Month</Button>
                <Button variant="outline" size="sm" onClick={() => setDateRange('lastMonth')}>Last Month</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trend</CardTitle>
              <CardDescription>Attendance rate over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="present" stackId="a" fill="#22c55e" name="Present" />
                    <Bar dataKey="late" stackId="a" fill="#eab308" name="Late" />
                    <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No attendance data for selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Breakdown by attendance status</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No attendance data for selected period
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Program Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Program Breakdown</CardTitle>
            <CardDescription>Attendance summary by program</CardDescription>
          </CardHeader>
          <CardContent>
            {programBreakdown.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Total Records</TableHead>
                    <TableHead className="text-center">Present/Late</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programBreakdown.map((program) => (
                    <TableRow key={program.name}>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell className="capitalize">{program.category}</TableCell>
                      <TableCell className="text-center">{program.total}</TableCell>
                      <TableCell className="text-center">{program.present}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Progress value={program.rate} className="w-24" />
                          <span className={cn(
                            "text-sm font-medium",
                            program.rate >= 80 ? "text-green-600" : program.rate >= 60 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {program.rate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No attendance data for selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
