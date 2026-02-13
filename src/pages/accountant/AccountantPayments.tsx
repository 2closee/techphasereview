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
import { Loader2, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AccountantPayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ student_id: '', amount: 0, payment_type: 'tuition', payment_method: 'cash', payment_reference: '', notes: '', program_id: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      supabase.from('student_payments').select('*, student_registrations(first_name, last_name), programs(name)').order('created_at', { ascending: false }),
      supabase.from('student_registrations').select('id, first_name, last_name, program_id').eq('status', 'enrolled')
    ]);
    setPayments(pRes.data || []);
    setStudents(sRes.data || []);
    setLoading(false);
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

  const handleAdd = async () => {
    if (!form.student_id || form.amount <= 0) {
      toast({ title: 'Error', description: 'Select student and enter amount', variant: 'destructive' }); return;
    }
    setSaving(true);
    const student = students.find(s => s.id === form.student_id);
    const { error } = await supabase.from('student_payments').insert({ ...form, program_id: student?.program_id || form.program_id });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Success', description: 'Payment recorded' }); setAddOpen(false); fetchData(); }
    setSaving(false);
  };

  const filtered = payments.filter(p => {
    const name = `${p.student_registrations?.first_name || ''} ${p.student_registrations?.last_name || ''}`;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout title="Payments">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle>Payment Records</CardTitle>
            <Button onClick={() => setAddOpen(true)} size="sm" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Record Payment</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Method</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments</TableCell></TableRow>
                  ) : filtered.slice(0, 50).map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.student_registrations?.first_name} {p.student_registrations?.last_name}</TableCell>
                      <TableCell>{fmt(Number(p.amount))}</TableCell>
                      <TableCell className="hidden sm:table-cell capitalize">{p.payment_type}</TableCell>
                      <TableCell className="hidden md:table-cell capitalize">{p.payment_method}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant={p.status === 'completed' ? 'default' : 'secondary'}>{p.status || 'completed'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Log a manual payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount (₦) *</Label><Input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Transfer</SelectItem><SelectItem value="pos">POS</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Reference</Label><Input value={form.payment_reference} onChange={e => setForm({ ...form, payment_reference: e.target.value })} /></div>
            <Button onClick={handleAdd} disabled={saving} className="w-full sm:w-auto">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Record Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
