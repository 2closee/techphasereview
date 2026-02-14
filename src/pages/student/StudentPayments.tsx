import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Loader2, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function StudentPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);
  const [tuitionFee, setTuitionFee] = useState(0);
  const [registrationFee, setRegistrationFee] = useState(0);
  const [scholarship, setScholarship] = useState<{ granted_percentage: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Get registration with program fees
      const { data: regs } = await supabase
        .from('student_registrations')
        .select('id, program_id, programs:program_id (tuition_fee, registration_fee)')
        .eq('user_id', user.id);

      if (!regs?.length) { setLoading(false); return; }

      const reg = regs[0] as any;
      const programTuition = reg.programs?.tuition_fee || 0;
      const programRegFee = reg.programs?.registration_fee || 0;
      setTuitionFee(programTuition);
      setRegistrationFee(programRegFee);

      // Fetch approved scholarship
      if (reg.program_id) {
        const { data: scholarshipData } = await supabase
          .from('scholarship_applications')
          .select('granted_percentage')
          .eq('student_id', reg.id)
          .eq('program_id', reg.program_id)
          .eq('status', 'approved')
          .maybeSingle();

        if (scholarshipData?.granted_percentage) {
          setScholarship({ granted_percentage: scholarshipData.granted_percentage });
        }
      }

      const regIds = regs.map((r: any) => r.id);
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
    fetchData();
  }, [user]);

  const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

  const discountAmount = scholarship ? tuitionFee * (scholarship.granted_percentage / 100) : 0;
  const effectiveTuition = tuitionFee - discountAmount;
  const totalCost = effectiveTuition + registrationFee;
  const balanceDue = Math.max(0, totalCost - totalPaid);

  return (
    <DashboardLayout title="My Payments">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg"><DollarSign className="w-6 h-6 text-orange-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="text-2xl font-bold text-foreground">{loading ? '-' : fmt(balanceDue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {scholarship && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg"><Award className="w-6 h-6 text-green-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scholarship Discount</p>
                    <p className="text-2xl font-bold text-green-600">{scholarship.granted_percentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fee Breakdown */}
        {!loading && (tuitionFee > 0 || registrationFee > 0) && (
          <Card>
            <CardHeader><CardTitle>Fee Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Tuition Fee</span>
                  <span className="font-medium text-foreground">{fmt(tuitionFee)}</span>
                </div>
                {scholarship && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-green-600 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Scholarship Discount ({scholarship.granted_percentage}%)
                    </span>
                    <span className="font-medium text-green-600">-{fmt(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Effective Tuition</span>
                  <span className="font-medium text-foreground">{fmt(effectiveTuition)}</span>
                </div>
                {registrationFee > 0 && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Registration Fee</span>
                    <span className="font-medium text-foreground">{fmt(registrationFee)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-semibold text-foreground">Total Cost</span>
                  <span className="font-bold text-foreground">{fmt(totalCost)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-medium text-foreground">{fmt(totalPaid)}</span>
                </div>
                <div className="flex justify-between py-2 bg-secondary/50 rounded-lg px-3">
                  <span className="font-semibold text-foreground">Balance Due</span>
                  <span className={"font-bold " + (balanceDue === 0 ? "text-green-600" : "text-orange-600")}>{fmt(balanceDue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
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
