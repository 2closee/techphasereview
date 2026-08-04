import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, ScrollText, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  DocStudent,
  downloadAcceptanceLetter,
  downloadAdmissionLetter,
  downloadConsentForm,
} from '@/lib/studentDocuments';

export default function StudentDocuments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<DocStudent | null>(null);
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('student_registrations')
        .select(`
          first_name, middle_name, last_name, email, phone, address, status, matriculation_number,
          programs:program_id (name, start_date),
          training_locations:preferred_location_id (name, city)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const r = data as any;
        setApproved(r.status === 'approved' || r.status === 'enrolled');
        setStudent({
          fullName: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' '),
          matricNumber: r.matriculation_number,
          programName: r.programs?.name || 'Training Programme',
          locationName: r.training_locations
            ? `${r.training_locations.name}, ${r.training_locations.city}`
            : null,
          address: r.address,
          phone: r.phone,
          email: r.email,
          startDate: r.programs?.start_date
            ? new Date(r.programs.start_date).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'long', year: 'numeric',
              })
            : null,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const run = async (key: string, fn: (s: DocStudent) => Promise<void>) => {
    if (!student) return;
    setBusy(key);
    try {
      await fn(student);
      toast.success('Document downloaded');
    } catch (e: any) {
      toast.error(e.message || 'Could not generate document');
    } finally {
      setBusy(null);
    }
  };

  const docs = [
    {
      key: 'admission',
      title: 'Admission Letter',
      description: 'Your official offer of admission into the six-month sponsored programme.',
      icon: FileText,
      action: downloadAdmissionLetter,
    },
    {
      key: 'acceptance',
      title: 'Acceptance Letter',
      description: 'Sign and return to confirm your place and accept the conditions of participation.',
      icon: ScrollText,
      action: downloadAcceptanceLetter,
    },
    {
      key: 'consent',
      title: 'PIND Consent Form',
      description: 'Media and photography consent form required by the PIND Foundation.',
      icon: ShieldCheck,
      action: downloadConsentForm,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="My Documents">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Documents">
      <div className="space-y-6">
        {!approved && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 text-sm text-muted-foreground">
              Your documents become available once your registration has been approved by the admissions team.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {docs.map(d => (
            <Card key={d.key} className="flex flex-col">
              <CardHeader>
                <d.icon className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">{d.title}</CardTitle>
                <CardDescription>{d.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button
                  className="w-full"
                  disabled={!student || !approved || busy === d.key}
                  onClick={() => run(d.key, d.action)}
                >
                  {busy === d.key ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
