import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, Loader2, CheckCircle2, Lock, Mail, CreditCard, AlertCircle, Building2, CalendarClock } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useSettings } from '@/contexts/SettingsContext';

interface RegistrationData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  program_id: string;
  payment_status: string;
  account_created: boolean;
  payment_plan: string;
  programs?: {
    name: string;
    tuition_fee: number;
    registration_fee: number | null;
  };
}

type Step = 'loading' | 'payment' | 'verifying' | 'create-account' | 'invalid';
type PaymentPlan = 'full' | '2_installments' | '3_installments';

export default function CompleteEnrollment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useSettings();
  const registrationId = searchParams.get('registration_id');
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  
  const partialPercent = (settings.partial_payment_percentage as number) || 50;

  const [step, setStep] = useState<Step>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [paymentInitializing, setPaymentInitializing] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>('full');
  const [scholarshipFlow, setScholarshipFlow] = useState(false);

  useEffect(() => {
    if (registrationId) {
      fetchRegistration();
    } else {
      setStep('invalid');
    }
  }, [registrationId]);

  useEffect(() => {
    if (reference && registration && step === 'payment') {
      verifyPayment(reference);
    }
  }, [reference, registration, step]);

  const fetchRegistration = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-registration-public', {
        body: { registration_id: registrationId }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Failed to load registration');
        setStep('invalid');
        return;
      }

      if (!data?.registration) {
        toast.error('Registration not found');
        setStep('invalid');
        return;
      }

      const reg = data.registration;

      if (reg.account_created) {
        toast.info('Account already created. Please sign in.');
        navigate('/auth');
        return;
      }

      setRegistration(reg as RegistrationData);

      if (reg.payment_status === 'paid' || reg.payment_status === 'office_pending' || reg.payment_status === 'partial') {
        setStep('create-account');
      } else {
        setStep('payment');
      }
    } catch (err) {
      console.error('Fetch registration error:', err);
      toast.error('Failed to load registration');
      setStep('invalid');
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

  const totalFee = registration
    ? (registration.programs?.tuition_fee || 0) + (registration.programs?.registration_fee || 0)
    : 0;

  const getInstallmentAmount = () => {
    if (paymentPlan === '2_installments') return Math.ceil(totalFee * partialPercent / 100);
    if (paymentPlan === '3_installments') return Math.ceil(totalFee * partialPercent / 100);
    return totalFee;
  };

  const getInstallmentLabel = () => {
    if (paymentPlan === '2_installments') return `${partialPercent}% now, ${100 - partialPercent}% later`;
    if (paymentPlan === '3_installments') return `${partialPercent}% now, rest in 2 parts`;
    return 'one-time payment';
  };

  const handlePayNow = async () => {
    if (!registration) return;
    setPaymentInitializing(true);
    setError('');

    try {
      // Save the payment plan choice
      await supabase.functions.invoke('get-registration-public', {
        body: { registration_id: registration.id, update_payment_plan: paymentPlan }
      });

      const amountToPay = getInstallmentAmount();
      const callbackUrl = `${window.location.origin}/complete-enrollment?registration_id=${registration.id}`;
      
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: { 
          registration_id: registration.id,
          callback_url: callbackUrl,
          amount_override: paymentPlan !== 'full' ? amountToPay : undefined
        }
      });

      if (error) throw error;

      if (data.authorization_url) {
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

  const handlePayAtOffice = async () => {
    if (!registration) return;
    setSubmitting(true);
    setError('');

    try {
      // Update registration to office_pending via edge function
      const { data, error } = await supabase.functions.invoke('get-registration-public', {
        body: { 
          registration_id: registration.id, 
          update_payment_status: 'office_pending',
          update_payment_plan: 'office_pay'
        }
      });

      if (error) throw error;

      toast.success('You can now create your account and pay at the office later.');
      setRegistration(prev => prev ? { ...prev, payment_status: 'office_pending', payment_plan: 'office_pay' } : null);
      setStep('create-account');
    } catch (err: any) {
      console.error('Pay at office error:', err);
      setError(err.message || 'Failed to process. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyForScholarship = async () => {
    if (!registration) return;
    setSubmitting(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('get-registration-public', {
        body: { 
          registration_id: registration.id, 
          update_payment_status: 'office_pending',
          update_payment_plan: 'scholarship_pending'
        }
      });

      if (error) throw error;

      toast.success('You can now create your account and apply for a scholarship from your dashboard.');
      setScholarshipFlow(true);
      setRegistration(prev => prev ? { ...prev, payment_status: 'office_pending', payment_plan: 'scholarship_pending' } : null);
      setStep('create-account');
    } catch (err: any) {
      console.error('Scholarship flow error:', err);
      setError(err.message || 'Failed to process. Please try again.');
    } finally {
      setSubmitting(false);
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
      // Call edge function to create account server-side
      const { data, error: fnError } = await supabase.functions.invoke('create-student-account', {
        body: { registration_id: registration.id, password }
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      toast.success('Account created successfully!');

      // Sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: registration.email,
        password,
      });

      if (signInError) {
        toast.info('Please sign in with your new credentials');
        navigate('/auth');
      } else if (scholarshipFlow) {
        toast.info('Now apply for your scholarship from the dashboard.');
        navigate('/student/scholarship');
      } else {
        navigate('/student');
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
                  Hi {registration.first_name}, choose your payment option below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Program info */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-3 mb-3">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <p className="font-medium text-foreground">
                      {registration.programs?.name || 'Selected Program'}
                    </p>
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

                {/* Payment Plan Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Payment Plan</Label>
                  <RadioGroup value={paymentPlan} onValueChange={(v) => setPaymentPlan(v as PaymentPlan)} className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentPlan === 'full' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="full" id="full" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">Pay in Full</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(totalFee)} — one-time payment</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentPlan === '2_installments' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="2_installments" id="2inst" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">2 Installments</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(Math.ceil(totalFee * partialPercent / 100))} now ({partialPercent}%), balance later</p>
                      </div>
                      <CalendarClock className="w-4 h-4 text-muted-foreground" />
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentPlan === '3_installments' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="3_installments" id="3inst" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">3 Installments</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(Math.ceil(totalFee * partialPercent / 100))} now ({partialPercent}%), rest in 2 parts</p>
                      </div>
                      <CalendarClock className="w-4 h-4 text-muted-foreground" />
                    </label>
                  </RadioGroup>
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

                {/* Pay Online button */}
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handlePayNow}
                  disabled={paymentInitializing || submitting}
                >
                  {paymentInitializing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {paymentPlan === 'full' 
                    ? `Pay ${formatCurrency(totalFee)} with Paystack`
                    : `Pay 1st Installment ${formatCurrency(getInstallmentAmount())} with Paystack`
                  }
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Apply for Scholarship button */}
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleApplyForScholarship}
                  disabled={paymentInitializing || submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Apply for Scholarship
                </Button>

                {/* or divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Pay at Office button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handlePayAtOffice}
                  disabled={paymentInitializing || submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Building2 className="w-4 h-4 mr-2" />
                  Pay at Office Instead
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Apply for a scholarship (30–100% tuition discount) or pay at the office in person. 
                  Both options let you create your account now. Dashboard access may be limited until payment is confirmed.
                </p>

                <p className="text-xs text-center text-muted-foreground">
                  Online payments are secured by Paystack. Your payment information is encrypted.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Create account step
  const isOfficePay = registration.payment_status === 'office_pending';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-md">
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className={`mx-auto w-16 h-16 ${isOfficePay ? 'bg-orange-500/10' : 'bg-green-500/10'} rounded-full flex items-center justify-center mb-4`}>
                {isOfficePay 
                  ? <Building2 className="w-8 h-8 text-orange-500" />
                  : <CheckCircle2 className="w-8 h-8 text-green-500" />
                }
              </div>
              <CardTitle className="text-2xl font-display">
                {isOfficePay ? 'Pay at Office Selected' : 'Payment Successful!'}
              </CardTitle>
              <CardDescription>
                {isOfficePay 
                  ? `${registration.first_name}, create your account now. Remember to pay at the office to unlock full access.`
                  : `Welcome, ${registration.first_name}! Create your account to access your student dashboard.`
                }
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
                      {isOfficePay ? 'Payment pending — pay at office' : "You're enrolled in this program"}
                    </p>
                  </div>
                </div>
              </div>

              {isOfficePay && (
                <div className="p-3 mb-6 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                    ⚠️ Your dashboard access will be limited until payment is confirmed by the office.
                  </p>
                </div>
              )}

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
