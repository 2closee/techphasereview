import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['hsl(217, 91%, 50%)', 'hsl(0, 84%, 50%)', 'hsl(150, 60%, 45%)', 'hsl(45, 90%, 50%)', 'hsl(280, 60%, 55%)'];

export default function AccountantReports() {
  const [loading, setLoading] = useState(true);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [revenueByProgram, setRevenueByProgram] = useState<any[]>([]);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data: payments } = await supabase.from('student_payments').select('amount, created_at, programs(name)');
      const now = new Date();
      const monthly: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthly[d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })] = 0;
      }
      const byProgram: Record<string, number> = {};
      (payments || []).forEach((p: any) => {
        const key = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (key in monthly) monthly[key] += Number(p.amount);
        const prog = p.programs?.name || 'Other';
        byProgram[prog] = (byProgram[prog] || 0) + Number(p.amount);
      });
      setRevenueByMonth(Object.entries(monthly).map(([month, amount]) => ({ month, amount })));
      setRevenueByProgram(Object.entries(byProgram).map(([name, value]) => ({ name, value })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => r[k]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${filename}.csv`; a.click();
  };

  if (loading) return <DashboardLayout title="Reports"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Financial Reports">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div><CardTitle>Revenue by Month</CardTitle><CardDescription>Last 6 months</CardDescription></div>
            <Button variant="outline" size="sm" onClick={() => exportCSV(revenueByMonth, 'monthly-revenue')} className="w-full sm:w-auto"><Download className="w-4 h-4 mr-2" />Export</Button>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByMonth}><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']} /><Bar dataKey="amount" fill="hsl(217, 91%, 50%)" radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue by Program</CardTitle></CardHeader>
          <CardContent>
            {revenueByProgram.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={revenueByProgram} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} fontSize={11}>{revenueByProgram.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => `₦${v.toLocaleString()}`} /></PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
