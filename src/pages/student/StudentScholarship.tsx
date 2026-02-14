import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle2, Clock, Loader2, XCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const scholarshipSchema = z.object({
  employment_status: z.enum(['employed', 'unemployed', 'self_employed', 'student']),
  household_size: z.number().min(1).max(20),
  monthly_income: z.string().min(1, 'Please select your income range'),
  motivation: z.string().trim().min(20, 'Please provide at least 20 characters').max(2000, 'Maximum 2000 characters'),
  how_training_helps: z.string().trim().min(20, 'Please provide at least 20 characters').max(1000, 'Maximum 1000 characters'),
  supporting_info: z.string().max(1000).optional(),
  requested_percentage: z.number().min(30).max(100),
});

type ScholarshipForm = z.infer<typeof scholarshipSchema>;

const incomeRanges = [
  { value: 'none', label: 'No income' },
  { value: 'below_30k', label: 'Below ₦30,000' },
  { value: '30k_50k', label: '₦30,000 - ₦50,000' },
  { value: '50k_100k', label: '₦50,000 - ₦100,000' },
  { value: '100k_200k', label: '₦100,000 - ₦200,000' },
  { value: 'above_200k', label: 'Above ₦200,000' },
];

interface ExistingApplication {
  id: string;
  status: string;
  requested_percentage: number;
  granted_percentage: number | null;
  created_at: string;
  admin_notes: string | null;
}

export default function StudentScholarship() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [registration, setRegistration] = useState<{ id: string; program_id: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ScholarshipForm>({
    employment_status: 'unemployed',
    household_size: 1,
    monthly_income: '',
    motivation: '',
    how_training_helps: '',
    supporting_info: '',
    requested_percentage: 50,
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: reg } = await supabase
        .from('student_registrations')
        .select('id, program_id')
        .eq('user_id', user.id)
        .single();

      if (reg) {
        setRegistration(reg);
        const { data: app } = await supabase
          .from('scholarship_applications')
          .select('id, status, requested_percentage, granted_percentage, created_at, admin_notes')
          .eq('student_id', reg.id)
          .eq('program_id', reg.program_id)
          .maybeSingle();

        if (app) setExistingApp(app as ExistingApplication);
      }
    } catch (err) {
      console.error('Error fetching scholarship data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !registration) return;

    const result = scholarshipSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const { error } = await supabase.from('scholarship_applications').insert({
        student_id: registration.id,
        user_id: user.id,
        program_id: registration.program_id,
        employment_status: form.employment_status,
        household_size: form.household_size,
        monthly_income: form.monthly_income,
        motivation: form.motivation,
        how_training_helps: form.how_training_helps,
        supporting_info: form.supporting_info || null,
        requested_percentage: form.requested_percentage,
      });

      if (error) throw error;

      toast({ title: 'Application Submitted', description: "You'll be notified when a decision is made." });
      fetchData();
    } catch (err: any) {
      console.error('Scholarship submission error:', err);
      toast({ title: 'Submission Failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Scholarship">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (existingApp) {
    return (
      <DashboardLayout title="Scholarship Application">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {existingApp.status === 'approved' ? (
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              ) : existingApp.status === 'denied' ? (
                <XCircle className="w-16 h-16 text-destructive" />
              ) : (
                <Clock className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {existingApp.status === 'approved'
                ? 'Scholarship Approved!'
                : existingApp.status === 'denied'
                ? 'Application Not Approved'
                : 'Application Under Review'}
            </CardTitle>
            <CardDescription>
              Submitted on {new Date(existingApp.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={existingApp.status === 'approved' ? 'default' : existingApp.status === 'denied' ? 'destructive' : 'secondary'}>
                {existingApp.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Requested Discount</span>
              <span className="font-semibold text-foreground">{existingApp.requested_percentage}%</span>
            </div>
            {existingApp.granted_percentage !== null && (
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-sm text-muted-foreground">Granted Discount</span>
                <span className="font-bold text-green-600 text-lg">{existingApp.granted_percentage}%</span>
              </div>
            )}
            {existingApp.admin_notes && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Reviewer Notes</p>
                <p className="text-foreground text-sm">{existingApp.admin_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Apply for Scholarship">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Award className="w-8 h-8 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-display font-bold text-foreground text-lg">Financial Assistance Program</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We understand that financial constraints should not prevent you from acquiring valuable skills. 
                  Apply for a scholarship covering 30% to 100% of your tuition fees. All applications are reviewed individually.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scholarship Application Form</CardTitle>
            <CardDescription>Please provide accurate information to help us assess your application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employment Status */}
            <div className="space-y-2">
              <Label>Employment Status *</Label>
              <Select value={form.employment_status} onValueChange={(v) => setForm(prev => ({ ...prev, employment_status: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self_employed">Self-Employed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
              {errors.employment_status && <p className="text-sm text-destructive">{errors.employment_status}</p>}
            </div>

            {/* Household Size */}
            <div className="space-y-2">
              <Label>Household Size (number of dependents including yourself) *</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.household_size}
                onChange={(e) => setForm(prev => ({ ...prev, household_size: parseInt(e.target.value) || 1 }))}
              />
              {errors.household_size && <p className="text-sm text-destructive">{errors.household_size}</p>}
            </div>

            {/* Monthly Income */}
            <div className="space-y-2">
              <Label>Monthly Income Range *</Label>
              <Select value={form.monthly_income} onValueChange={(v) => setForm(prev => ({ ...prev, monthly_income: v }))}>
                <SelectTrigger><SelectValue placeholder="Select income range" /></SelectTrigger>
                <SelectContent>
                  {incomeRanges.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.monthly_income && <p className="text-sm text-destructive">{errors.monthly_income}</p>}
            </div>

            {/* Motivation */}
            <div className="space-y-2">
              <Label>Why do you need this scholarship? *</Label>
              <Textarea
                placeholder="Describe your financial situation and why you need assistance..."
                value={form.motivation}
                onChange={(e) => setForm(prev => ({ ...prev, motivation: e.target.value }))}
                maxLength={2000}
                rows={5}
              />
              <p className="text-xs text-muted-foreground text-right">{form.motivation.length}/2000</p>
              {errors.motivation && <p className="text-sm text-destructive">{errors.motivation}</p>}
            </div>

            {/* How Training Helps */}
            <div className="space-y-2">
              <Label>How will this training help you? *</Label>
              <Textarea
                placeholder="What do you plan to do with the skills you'll acquire?"
                value={form.how_training_helps}
                onChange={(e) => setForm(prev => ({ ...prev, how_training_helps: e.target.value }))}
                maxLength={1000}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">{form.how_training_helps.length}/1000</p>
              {errors.how_training_helps && <p className="text-sm text-destructive">{errors.how_training_helps}</p>}
            </div>

            {/* Supporting Info */}
            <div className="space-y-2">
              <Label>Any additional information (optional)</Label>
              <Textarea
                placeholder="Any other context you'd like to share..."
                value={form.supporting_info}
                onChange={(e) => setForm(prev => ({ ...prev, supporting_info: e.target.value }))}
                maxLength={1000}
                rows={3}
              />
            </div>

            {/* Requested Percentage */}
            <div className="space-y-4">
              <Label>Scholarship Amount Requested: <span className="text-primary font-bold">{form.requested_percentage}%</span></Label>
              <Slider
                value={[form.requested_percentage]}
                onValueChange={(v) => setForm(prev => ({ ...prev, requested_percentage: v[0] }))}
                min={30}
                max={100}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Submit Application</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
