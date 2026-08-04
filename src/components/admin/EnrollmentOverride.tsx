import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, Wallet } from 'lucide-react';

type Props = {
  registrationId: string;
  programId: string | null;
  currentStatus: string;
  currentPaymentStatus: string;
  onUpdated: () => void;
};

const ENROLLMENT_STATUSES = ['pending', 'reviewing', 'approved', 'enrolled', 'rejected'];
const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'pending', label: 'Pending' },
  { value: 'office_pending', label: 'Pay at Office (pending)' },
  { value: 'paid', label: 'Paid' },
  { value: 'waived', label: 'Waived / Free' },
];

export function EnrollmentOverride({
  registrationId,
  programId,
  currentStatus,
  currentPaymentStatus,
  onUpdated,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [recordPayment, setRecordPayment] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(currentStatus);
    setPaymentStatus(currentPaymentStatus);
  }, [currentStatus, currentPaymentStatus, registrationId]);

  useEffect(() => {
    if (!programId) return;
    supabase
      .from('programs')
      .select('tuition_fee, registration_fee, is_free_program')
      .eq('id', programId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setAmount(Number(data.tuition_fee || 0) + Number(data.registration_fee || 0));
      });
  }, [programId]);

  const confirmingPayment = paymentStatus === 'paid' && currentPaymentStatus !== 'paid';
  const dirty = status !== currentStatus || paymentStatus !== currentPaymentStatus;

  const handleApply = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('student_registrations')
        .update({
          status,
          payment_status: paymentStatus,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', registrationId);
      if (error) throw error;

      if (confirmingPayment && recordPayment && programId && amount > 0) {
        const { data: userData } = await supabase.auth.getUser();
        const { error: payError } = await supabase.from('student_payments').insert({
          student_id: registrationId,
          program_id: programId,
          amount,
          payment_type: 'tuition',
          payment_method: method,
          payment_reference: reference || null,
          notes: notes || 'Confirmed by admin override',
          payment_date: new Date().toISOString().slice(0, 10),
          recorded_by: userData.user?.id ?? null,
        });
        if (payError) throw payError;
      }

      toast.success('Enrollment updated');
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update enrollment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h4 className="font-semibold">Admin Override</h4>
        <Badge variant="outline" className="ml-auto capitalize">
          {currentStatus} · {currentPaymentStatus}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Set enrollment status and confirm payment manually — no re-registration needed.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Enrollment Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENROLLMENT_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Payment Status</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {confirmingPayment && (
        <div className="space-y-4 p-3 rounded-md bg-secondary/50">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wallet className="w-4 h-4" />
            Payment confirmation
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={recordPayment}
              onChange={e => setRecordPayment(e.target.checked)}
              className="accent-primary"
            />
            Record a payment receipt for this confirmation
          </label>
          {recordPayment && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Amount (₦)</Label>
                  <Input
                    type="number"
                    value={amount || ''}
                    onChange={e => setAmount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Receipt or transaction number"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>
            </>
          )}
        </div>
      )}

      <Button onClick={handleApply} disabled={saving || !dirty}>
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying...</> : 'Apply Override'}
      </Button>
    </div>
  );
}
