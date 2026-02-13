import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AccountantRegistrations() {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { fetchRegistrations(); }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data } = await supabase.from('student_registrations')
      .select('id, first_name, last_name, email, phone, status, payment_status, created_at, programs(name)')
      .order('created_at', { ascending: false });
    setRegistrations(data || []);
    setLoading(false);
  };

  const markAsPaid = async (id: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from('student_registrations').update({ payment_status: 'paid' }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Payment status updated' });
      fetchRegistrations();
    }
    setUpdatingId(null);
  };

  const filtered = registrations.filter(r => {
    const matchSearch = `${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout title="Student Registrations">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Program</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No registrations found</TableCell></TableRow>
                  ) : filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.first_name} {r.last_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{(r.programs as any)?.name || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{r.email}</TableCell>
                      <TableCell>
                        <Badge variant={r.payment_status === 'paid' ? 'default' : 'secondary'}>{r.payment_status || 'pending'}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.payment_status !== 'paid' && (
                          <Button size="sm" variant="outline" onClick={() => markAsPaid(r.id)} disabled={updatingId === r.id} className="min-h-[44px] sm:min-h-0">
                            {updatingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Mark Paid</span></>}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
