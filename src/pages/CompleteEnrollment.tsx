import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, Loader2, CheckCircle2, Lock, Mail } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

interface RegistrationData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  program_id: string;
  payment_status: string;
  account_created: boolean;
  programs?: {
    name: string;
    tuition_fee: number;
  };
}

export default function CompleteEnrollment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registrationId = searchParams.get('registration_id');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (registrationId) {
      fetchRegistration();
    } else {
      setLoading(false);
    }
  }, [registrationId]);

  const fetchRegistration = async () => {
    const { data, error } = await supabase
      .from('student_registrations')
      .select(`
        id,
        first_name,
        last_name,
        email,
        program_id,
        payment_status,
        account_created,
        programs:program_id (
          name,
          tuition_fee
        )
      `)
      .eq('id', registrationId)
      .single();

    if (error || !data) {
      toast.error('Registration not found');
      navigate('/register');
      return;
    }

    // Check if account already created
    if (data.account_created) {
      toast.info('Account already created. Please sign in.');
      navigate('/auth');
      return;
    }

    // For now, allow account creation even without payment (Paystack integration later)
    setRegistration(data as RegistrationData);
    setLoading(false);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!registration) return;

    setSubmitting(true);

    try {
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registration.email,
        password,
        options: {
          data: {
            full_name: `${registration.first_name} ${registration.last_name}`,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Assign student role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'student',
          });

        if (roleError) {
          console.error('Role assignment error:', roleError);
          // Don't throw - account is created, role can be fixed later
        }

        // Link user to registration
        const { error: updateError } = await supabase
          .from('student_registrations')
          .update({
            user_id: authData.user.id,
            account_created: true,
            status: 'approved', // Auto-approve since they registered through the proper flow
          })
          .eq('id', registration.id);

        if (updateError) {
          console.error('Registration update error:', updateError);
        }

        toast.success('Account created successfully!');
        
        // Auto sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: registration.email,
          password,
        });

        if (signInError) {
          toast.info('Please sign in with your new credentials');
          navigate('/auth');
        } else {
          navigate('/student');
        }
      }
    } catch (err: any) {
      console.error('Account creation error:', err);
      setError(err.message || 'Failed to create account');
      toast.error('Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!registrationId || !registration) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              Invalid Registration Link
            </h1>
            <p className="text-muted-foreground mb-6">
              This link is invalid or has expired. Please start a new registration.
            </p>
            <Button onClick={() => navigate('/register')}>
              Start Registration
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-md">
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-display">
                Welcome, {registration.first_name}!
              </CardTitle>
              <CardDescription>
                Complete your account setup to access your student dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Program info */}
              <div className="p-4 bg-primary/5 rounded-lg mb-6 border border-primary/10">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">
                      {registration.programs?.name || 'Selected Program'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You're enrolled in this program
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={registration.email}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  variant="gold"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create My Account
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
