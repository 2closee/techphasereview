import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Clock, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AccountantDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, pending: 0, thisMonth: 0, outstanding: 0 });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [spRes, epRes] = await Promise.all([
        supabase.from('student_payments').select('amount, status, created_at, student_registrations(first_name, last_name), programs(name)').order('created_at', { ascending: false }).limit(10),
        supabase.from('enrollment_payments').select('amount, status, created_at, student_registrations(first_name, last_name)')
      ]);
      const allP = [
        ...(spRes.data || []).map((p: any) => ({ amount: p.amount, status: p.status || 'completed', created_at: p.created_at, source: 'manual' as const })),
        ...(epRes.data || []).map((p: any) => ({ amount: p.amount, status: p.status, created_at: p.created_at, source: 'enrollment' as const }))
      ];
      const now = new Date();
      const completed = allP.filter(p => p.status === 'completed' || p.status === 'success');
      const pending = allP.filter(p => p.status === 'pending');
      const thisMonthP = completed.filter(p => { const d = new Date(p.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });

      setStats({
        totalRevenue: completed.reduce((s, p) => s + Number(p.amount), 0),
        pending: pending.reduce((s, p) => s + Number(p.amount), 0),
        thisMonth: thisMonthP.reduce((s, p) => s + Number(p.amount), 0),
        outstanding: pending.length
      });
      setRecentPayments((spRes.data || []).slice(0, 5));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

  const statCards = [
    { title: 'Total Revenue', value: fmt(stats.totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { title: 'Pending Payments', value: fmt(stats.pending), icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { title: 'This Month', value: fmt(stats.thisMonth), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Outstanding', value: stats.outstanding.toString(), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  return (
    <DashboardLayout title="Accountant Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(s => (
            <Card key={s.title}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 sm:p-3 rounded-lg ${s.bg}`}><s.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${s.color}`} /></div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{s.title}</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{loading ? '-' : s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : recentPayments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent payments</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((p: any, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.student_registrations?.first_name} {p.student_registrations?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{p.programs?.name || 'N/A'} • {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{fmt(Number(p.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
