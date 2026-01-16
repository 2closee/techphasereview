import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, Loader2, CheckCircle2, Lock, Mail, CreditCard, AlertCircle } from 'lucide-react';
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
    registration_fee: number | null;
  };
}

type Step = 'loading' | 'payment' | 'verifying' | 'create-account' | 'invalid';

export default function CompleteEnrollment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registrationId = searchParams.get('registration_id');
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  
  const [step, setStep] = useState<Step>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [paymentInitializing, setPaymentInitializing] = useState(false);

  useEffect(() => {
    if (registrationId) {
      fetchRegistration();
    } else {
      setStep('invalid');
    }
  }, [registrationId]);

  // Handle payment callback verification
  useEffect(() => {
    if (reference && registration && step === 'payment') {
      verifyPayment(reference);
    }
  }, [reference, registration, step]);

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
          tuition_fee,
          registration_fee
        )
      `)
      .eq('id', registrationId)
      .single();

    if (error || !data) {
      toast.error('Registration not found');
      setStep('invalid');
      return;
    }

    // Check if account already created
    if (data.account_created) {
      toast.info('Account already created. Please sign in.');
      navigate('/auth');
      return;
    }

    setRegistration(data as RegistrationData);

    // Determine which step to show
    if (data.payment_status === 'paid') {
      setStep('create-account');
    } else {
      setStep('payment');
    }
  };

  const verifyPayment = async (ref: string) => {
    setStep('verifying');
    
    try {
      const { data, error } = await supabase.functions.invoke('paystack-verify', {
        body: { reference: ref }
      });

      if (error) throw error;

      if (data.payment_successful) {
        toast.success('Payment verified successfully!');
        // Refresh registration data
        await fetchRegistration();
      } else {
        toast.error('Payment verification failed. Please try again.');
        setStep('payment');
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      toast.error('Failed to verify payment. Please try again.');
      setStep('payment');
    }
  };

  const handlePayNow = async () => {
    if (!registration) return;
    
    setPaymentInitializing(true);
    setError('');

    try {
      const callbackUrl = `${window.location.origin}/complete-enrollment?registration_id=${registration.id}`;
      
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: { 
          registration_id: registration.id,
          callback_url: callbackUrl
        }
      });

      if (error) throw error;

      if (data.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setError(err.message || 'Failed to initialize payment');
      toast.error('Failed to start payment. Please try again.');
    } finally {
      setPaymentInitializing(false);
    }
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
          emailRedirectTo: `${window.location.origin}/`,
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
        }

        // Link user to registration
        const { error: updateError } = await supabase
          .from('student_registrations')
          .update({
            user_id: authData.user.id,
            account_created: true,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (step === 'loading' || step === 'verifying') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {step === 'verifying' ? 'Verifying your payment...' : 'Loading...'}
        </p>
      </div>
    );
  }

  // Invalid registration
  if (step === 'invalid' || !registration) {
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

  const totalFee = (registration.programs?.tuition_fee || 0) + (registration.programs?.registration_fee || 0);

  // Payment step
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-16 px-4">
          <div className="container mx-auto max-w-md">
            <Card className="border-primary/20">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display">
                  Complete Your Payment
                </CardTitle>
                <CardDescription>
                  Hi {registration.first_name}, please pay your enrollment fees to create your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Program info */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-3 mb-3">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">
                        {registration.programs?.name || 'Selected Program'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tuition Fee</span>
                      <span className="font-medium">{formatCurrency(registration.programs?.tuition_fee || 0)}</span>
                    </div>
                    {registration.programs?.registration_fee && registration.programs.registration_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registration Fee</span>
                        <span className="font-medium">{formatCurrency(registration.programs.registration_fee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-primary/10">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(totalFee)}</span>
                    </div>
                  </div>
                </div>

                {/* Email reminder */}
                <div className="p-3 bg-secondary/50 rounded-lg flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{registration.email}</span>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 rounded-lg flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handlePayNow}
                  disabled={paymentInitializing}
                >
                  {paymentInitializing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Pay {formatCurrency(totalFee)} with Paystack
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secured by Paystack. Your payment information is encrypted and secure.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Create account step (after successful payment)
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
                Payment Successful!
              </CardTitle>
              <CardDescription>
                Welcome, {registration.first_name}! Create your account to access your student dashboard.
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
