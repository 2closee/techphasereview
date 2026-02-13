import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function StudentPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: regs } = await supabase.from('student_registrations').select('id').eq('user_id', user.id);
      if (!regs?.length) { setLoading(false); return; }
      const regIds = regs.map(r => r.id);
      const [spRes, epRes] = await Promise.all([
        supabase.from('student_payments').select('*').in('student_id', regIds).order('created_at', { ascending: false }),
        supabase.from('enrollment_payments').select('*').in('registration_id', regIds).order('created_at', { ascending: false })
      ]);
      const all: any[] = [
        ...(spRes.data || []).map((p: any) => ({ id: p.id, amount: p.amount, status: 'completed', type: p.payment_type, created_at: p.created_at, source: 'manual' })),
        ...(epRes.data || []).map((p: any) => ({ id: p.id, amount: p.amount, status: p.status, type: 'enrollment', created_at: p.created_at, source: 'enrollment' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPayments(all);
      setTotalPaid(all.filter((p: any) => p.status === 'completed' || p.status === 'success').reduce((s: number, p: any) => s + Number(p.amount), 0));
      setLoading(false);
    };
    fetch();
  }, [user]);

  const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

  return (
    <DashboardLayout title="My Payments">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg"><DollarSign className="w-6 h-6 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-foreground">{loading ? '-' : fmt(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No payment records</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{fmt(Number(p.amount))}</TableCell>
                        <TableCell className="capitalize text-sm">{p.type}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant={p.status === 'completed' || p.status === 'success' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
