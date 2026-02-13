import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, TrendingUp, Users, BookOpen, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['hsl(217, 91%, 50%)', 'hsl(0, 84%, 50%)', 'hsl(150, 60%, 45%)', 'hsl(45, 90%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(190, 70%, 45%)'];

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [programBreakdown, setProgramBreakdown] = useState<any[]>([]);
  const [locationBreakdown, setLocationBreakdown] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [paymentsRes, enrollRes, programsRes, locationsRes, attendanceRes] = await Promise.all([
        supabase.from('student_payments').select('amount, created_at, payment_type'),
        supabase.from('student_registrations').select('created_at, program_id, status, programs(name)'),
        supabase.from('programs').select('id, name').eq('is_active', true),
        supabase.from('training_locations').select('id, name'),
        supabase.from('attendance').select('status, date')
      ]);

      // Revenue by month (last 6 months)
      const monthlyRev: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyRev[key] = 0;
      }
      (paymentsRes.data || []).forEach((p: any) => {
        const d = new Date(p.created_at);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (key in monthlyRev) monthlyRev[key] += Number(p.amount);
      });
      setRevenueData(Object.entries(monthlyRev).map(([month, amount]) => ({ month, amount })));

      // Enrollment trends
      const monthlyEnroll: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyEnroll[key] = 0;
      }
      (enrollRes.data || []).forEach((e: any) => {
        const d = new Date(e.created_at);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (key in monthlyEnroll) monthlyEnroll[key]++;
      });
      setEnrollmentData(Object.entries(monthlyEnroll).map(([month, count]) => ({ month, count })));

      // Program breakdown
      const progCounts: Record<string, number> = {};
      (enrollRes.data || []).forEach((e: any) => {
        const name = (e.programs as any)?.name || 'Unknown';
        progCounts[name] = (progCounts[name] || 0) + 1;
      });
      setProgramBreakdown(Object.entries(progCounts).map(([name, value]) => ({ name, value })));

      // Location breakdown (from course_batches)
      const batchesRes = await supabase.from('course_batches').select('location_id, current_count, training_locations(name)');
      const locCounts: Record<string, number> = {};
      (batchesRes.data || []).forEach((b: any) => {
        const name = (b.training_locations as any)?.name || 'Unknown';
        locCounts[name] = (locCounts[name] || 0) + b.current_count;
      });
      setLocationBreakdown(Object.entries(locCounts).map(([name, value]) => ({ name, value })));

      // Attendance stats
      const att = attendanceRes.data || [];
      setAttendanceStats({
        present: att.filter(a => a.status === 'present').length,
        absent: att.filter(a => a.status === 'absent').length,
        late: att.filter(a => a.status === 'late').length,
        total: att.length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => row[k]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout title="Reports">
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Revenue Summary</CardTitle>
              <CardDescription>Last 6 months</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV(revenueData, 'revenue')} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="amount" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Enrollment Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Enrollment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={enrollmentData}>
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(0, 84%, 50%)" strokeWidth={2} dot={{ fill: 'hsl(0, 84%, 50%)' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Program Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Program Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {programBreakdown.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={programBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                        {programBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Location Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Location Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {locationBreakdown.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No location data</p>
              ) : (
                <div className="space-y-3">
                  {locationBreakdown.map((loc, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{loc.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((loc.value / Math.max(...locationBreakdown.map(l => l.value))) * 100, 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium text-foreground w-8 text-right">{loc.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{attendanceStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
