import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Award, Users, CheckCircle2, XCircle, Clock, Loader2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ScholarshipApp {
  id: string;
  student_id: string;
  user_id: string;
  program_id: string;
  employment_status: string;
  household_size: number;
  monthly_income: string;
  motivation: string;
  how_training_helps: string;
  supporting_info: string | null;
  requested_percentage: number;
  granted_percentage: number | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  student_registrations: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    payment_status: string;
  } | null;
  programs: {
    name: string;
    tuition_fee: number;
  } | null;
}

const incomeLabels: Record<string, string> = {
  none: 'No income',
  below_30k: 'Below ₦30,000',
  '30k_50k': '₦30,000 - ₦50,000',
  '50k_100k': '₦50,000 - ₦100,000',
  '100k_200k': '₦100,000 - ₦200,000',
  above_200k: 'Above ₦200,000',
};

export default function AdminScholarships() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ScholarshipApp[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<ScholarshipApp | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [grantedPct, setGrantedPct] = useState(50);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('scholarship_applications')
      .select(`
        *,
        student_registrations:student_id (first_name, last_name, email, phone, payment_status),
        programs:program_id (name, tuition_fee)
      `)
      .order('created_at', { ascending: false });

    if (data) setApplications(data as unknown as ScholarshipApp[]);
    if (error) console.error('Error fetching scholarship apps:', error);
    setLoading(false);
  };

  const handleDecision = async (status: 'approved' | 'denied') => {
    if (!selectedApp || !user) return;
    setSaving(true);
    try {
      const updateData: any = {
        status,
        admin_notes: reviewNotes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };
      if (status === 'approved') {
        updateData.granted_percentage = grantedPct;
      }

      const { error } = await supabase
        .from('scholarship_applications')
        .update(updateData)
        .eq('id', selectedApp.id);

      if (error) throw error;

      // Create notification for student
      await supabase.from('notifications').insert({
        user_id: selectedApp.user_id,
        title: status === 'approved' ? 'Scholarship Approved! 🎉' : 'Scholarship Application Update',
        message: status === 'approved'
          ? `Your scholarship application has been approved with a ${grantedPct}% tuition discount!`
          : `Your scholarship application has been reviewed. ${reviewNotes ? 'Note: ' + reviewNotes : 'Please contact the office for more information.'}`,
        type: status === 'approved' ? 'success' : 'info',
      });

      // Send email notification
      try {
        await supabase.functions.invoke('send-scholarship-email', {
          body: {
            to: selectedApp.student_registrations?.email,
            studentName: `${selectedApp.student_registrations?.first_name} ${selectedApp.student_registrations?.last_name}`,
            status,
            grantedPercentage: status === 'approved' ? grantedPct : null,
            programName: selectedApp.programs?.name || 'N/A',
            adminNotes: reviewNotes || null,
          },
        });
      } catch (emailErr) {
        console.error('Failed to send email notification:', emailErr);
      }

      toast({ title: `Application ${status}`, description: `Student has been notified.` });
      setSelectedApp(null);
      fetchApplications();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = statusFilter === 'all'
    ? applications
    : applications.filter(a => a.status === statusFilter);

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending' || a.status === 'under_review').length,
    approved: applications.filter(a => a.status === 'approved').length,
    denied: applications.filter(a => a.status === 'denied').length,
    avgDiscount: applications.filter(a => a.granted_percentage).length > 0
      ? Math.round(applications.filter(a => a.granted_percentage).reduce((s, a) => s + (a.granted_percentage || 0), 0) / applications.filter(a => a.granted_percentage).length)
      : 0,
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

  return (
    <DashboardLayout title="Scholarship Management">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg"><Users className="w-5 h-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-foreground">{stats.total}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-lg"><Clock className="w-5 h-5 text-orange-500" /></div>
              <div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-foreground">{stats.pending}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-500" /></div>
              <div><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold text-foreground">{stats.approved}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-destructive/10 rounded-lg"><XCircle className="w-5 h-5 text-destructive" /></div>
              <div><p className="text-sm text-muted-foreground">Denied</p><p className="text-2xl font-bold text-foreground">{stats.denied}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Applications</CardTitle>
                <CardDescription>Review and manage scholarship requests</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No scholarship applications found</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden md:table-cell">Program</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(app => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {app.student_registrations?.first_name} {app.student_registrations?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{app.student_registrations?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{app.programs?.name}</TableCell>
                        <TableCell className="font-semibold">{app.requested_percentage}%</TableCell>
                        <TableCell>
                          <Badge variant={
                            app.status === 'approved' ? 'default' :
                            app.status === 'denied' ? 'destructive' : 'secondary'
                          }>
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {format(new Date(app.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app);
                              setReviewNotes(app.admin_notes || '');
                              setGrantedPct(app.granted_percentage || app.requested_percentage);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedApp && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    Review Application — {selectedApp.student_registrations?.first_name} {selectedApp.student_registrations?.last_name}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedApp.programs?.name} • Tuition: {selectedApp.programs ? formatCurrency(selectedApp.programs.tuition_fee) : '-'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Applicant Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Employment</p>
                      <p className="font-medium text-foreground capitalize">{selectedApp.employment_status.replace('_', ' ')}</p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Household Size</p>
                      <p className="font-medium text-foreground">{selectedApp.household_size}</p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Monthly Income</p>
                      <p className="font-medium text-foreground">{incomeLabels[selectedApp.monthly_income] || selectedApp.monthly_income}</p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Requested Discount</p>
                      <p className="font-medium text-foreground">{selectedApp.requested_percentage}%</p>
                    </div>
                  </div>

                  {/* Motivation */}
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Why they need this scholarship</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedApp.motivation}</p>
                  </div>

                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">How training will help</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedApp.how_training_helps}</p>
                  </div>

                  {selectedApp.supporting_info && (
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Additional information</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selectedApp.supporting_info}</p>
                    </div>
                  )}

                  {/* Decision Section */}
                  {(selectedApp.status === 'pending' || selectedApp.status === 'under_review') && (
                    <div className="border-t border-border pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Grant Percentage: <span className="text-primary font-bold">{grantedPct}%</span></Label>
                        <Slider
                          value={[grantedPct]}
                          onValueChange={(v) => setGrantedPct(v[0])}
                          min={30}
                          max={100}
                          step={5}
                        />
                        {selectedApp.programs && (
                          <p className="text-xs text-muted-foreground">
                            Student will pay: {formatCurrency(selectedApp.programs.tuition_fee * (1 - grantedPct / 100))} 
                            {' '}(saving {formatCurrency(selectedApp.programs.tuition_fee * grantedPct / 100)})
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Admin Notes</Label>
                        <Textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Internal notes about this decision..."
                          rows={3}
                          maxLength={1000}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          className="flex-1"
                          onClick={() => handleDecision('approved')}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                          Approve ({grantedPct}%)
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleDecision('denied')}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                          Deny
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Already decided */}
                  {selectedApp.status === 'approved' && selectedApp.granted_percentage !== null && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="font-medium text-green-600">Approved with {selectedApp.granted_percentage}% discount</p>
                      {selectedApp.admin_notes && <p className="text-sm text-muted-foreground mt-1">{selectedApp.admin_notes}</p>}
                    </div>
                  )}
                  {selectedApp.status === 'denied' && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="font-medium text-destructive">Application denied</p>
                      {selectedApp.admin_notes && <p className="text-sm text-muted-foreground mt-1">{selectedApp.admin_notes}</p>}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
