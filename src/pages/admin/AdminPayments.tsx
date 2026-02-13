import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, DollarSign, Clock, CheckCircle, Loader2, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminPayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [enrollmentPayments, setEnrollmentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  const [paymentForm, setPaymentForm] = useState({
    student_id: '', program_id: '', amount: 0, payment_type: 'tuition',
    payment_method: 'cash', payment_reference: '', notes: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [spRes, epRes, studRes] = await Promise.all([
        supabase.from('student_payments').select('*, student_registrations(first_name, last_name, email), programs(name)').order('created_at', { ascending: false }),
        supabase.from('enrollment_payments').select('*, student_registrations(first_name, last_name, email, program_id, programs(name))').order('created_at', { ascending: false }),
        supabase.from('student_registrations').select('id, first_name, last_name, program_id, programs(name)').eq('status', 'enrolled')
      ]);
      setPayments(spRes.data || []);
      setEnrollmentPayments(epRes.data || []);
      setStudents(studRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

  const allPayments = [
    ...payments.map(p => ({
      id: p.id, studentName: `${p.student_registrations?.first_name || ''} ${p.student_registrations?.last_name || ''}`,
      program: p.programs?.name || 'N/A', amount: p.amount, type: p.payment_type,
      method: p.payment_method, reference: p.payment_reference, date: p.created_at, status: p.status || 'completed', source: 'manual'
    })),
    ...enrollmentPayments.map(p => ({
      id: p.id, studentName: `${p.student_registrations?.first_name || ''} ${p.student_registrations?.last_name || ''}`,
      program: p.student_registrations?.programs?.name || 'N/A', amount: p.amount, type: 'enrollment',
      method: p.payment_provider || 'online', reference: p.payment_reference, date: p.created_at, status: p.status, source: 'enrollment'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = allPayments.filter(p => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || p.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = allPayments.filter(p => p.status === 'completed' || p.status === 'success').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const thisMonth = allPayments.filter(p => {
    const d = new Date(p.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && (p.status === 'completed' || p.status === 'success');
  }).reduce((s, p) => s + Number(p.amount), 0);

  const handleRecordPayment = async () => {
    if (!paymentForm.student_id || paymentForm.amount <= 0) {
      toast({ title: 'Error', description: 'Select a student and enter valid amount', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const student = students.find(s => s.id === paymentForm.student_id);
      const { error } = await supabase.from('student_payments').insert({
        ...paymentForm, program_id: student?.program_id || paymentForm.program_id
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Payment recorded' });
      setRecordPaymentOpen(false);
      setPaymentForm({ student_id: '', program_id: '', amount: 0, payment_type: 'tuition', payment_method: 'cash', payment_reference: '', notes: '' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default', success: 'default', pending: 'secondary', failed: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{formatCurrency(totalCollected)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{formatCurrency(totalPending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">This Month</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{formatCurrency(thisMonth)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-lg">All Payments</CardTitle>
              <Button onClick={() => setRecordPaymentOpen(true)} size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span>Record Payment</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by name or reference..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden sm:table-cell">Program</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Method</TableHead>
                      <TableHead className="hidden lg:table-cell">Reference</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No payments found</TableCell></TableRow>
                    ) : filtered.slice(0, 50).map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.studentName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{p.program}</TableCell>
                        <TableCell>{formatCurrency(Number(p.amount))}</TableCell>
                        <TableCell className="hidden md:table-cell capitalize">{p.type}</TableCell>
                        <TableCell className="hidden md:table-cell capitalize">{p.method}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">{p.reference || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">{new Date(p.date).toLocaleDateString()}</TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Modal */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
            <DialogDescription>Log a cash or bank transfer payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={paymentForm.student_id} onValueChange={v => setPaymentForm({ ...paymentForm, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₦) *</Label>
                <Input type="number" value={paymentForm.amount || ''} onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={paymentForm.payment_type} onValueChange={v => setPaymentForm({ ...paymentForm, payment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">Tuition</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={paymentForm.payment_method} onValueChange={v => setPaymentForm({ ...paymentForm, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input value={paymentForm.payment_reference} onChange={e => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })} placeholder="Receipt or transaction number" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
            </div>
            <Button onClick={handleRecordPayment} disabled={saving} className="w-full sm:w-auto">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Record Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
