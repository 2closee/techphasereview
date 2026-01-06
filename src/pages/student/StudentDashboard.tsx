import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, CreditCard, Award, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface StudentRegistration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  program_id: string;
  payment_status: string;
  created_at: string;
  programs: {
    id: string;
    name: string;
    category: string;
    duration: string;
    duration_unit: string;
    tuition_fee: number;
    start_date: string | null;
  } | null;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  payment_method: string;
  payment_reference: string | null;
}

interface CourseProgress {
  id: string;
  completion_percentage: number;
  attended_sessions: number;
  total_sessions: number;
  status: string;
}

interface UpcomingSession {
  id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  training_locations: {
    name: string;
  } | null;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<StudentRegistration | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;

    try {
      // Fetch student registration with program details
      const { data: regData, error: regError } = await supabase
        .from('student_registrations')
        .select(`
          id,
          first_name,
          last_name,
          email,
          program_id,
          payment_status,
          created_at,
          programs:program_id (
            id,
            name,
            category,
            duration,
            duration_unit,
            tuition_fee,
            start_date
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (regData) {
        setRegistration(regData as StudentRegistration);

        // Fetch payments for this student
        const { data: paymentData } = await supabase
          .from('student_payments')
          .select('id, amount, payment_date, payment_type, payment_method, payment_reference')
          .eq('student_id', regData.id)
          .order('payment_date', { ascending: false });

        if (paymentData) {
          setPayments(paymentData);
        }

        // Fetch course progress
        const { data: progressData } = await supabase
          .from('course_progress')
          .select('id, completion_percentage, attended_sessions, total_sessions, status')
          .eq('student_id', regData.id)
          .eq('program_id', regData.program_id)
          .single();

        if (progressData) {
          setCourseProgress(progressData);
        }

        // Fetch upcoming sessions for the program
        const today = new Date().toISOString().split('T')[0];
        const { data: sessionsData } = await supabase
          .from('training_sessions')
          .select(`
            id,
            title,
            session_date,
            start_time,
            end_time,
            training_locations:location_id (
              name
            )
          `)
          .eq('program_id', regData.program_id)
          .gte('session_date', today)
          .eq('is_cancelled', false)
          .order('session_date', { ascending: true })
          .limit(5);

        if (sessionsData) {
          setUpcomingSessions(sessionsData as unknown as UpcomingSession[]);
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const tuitionFee = registration?.programs?.tuition_fee || 0;
  const balanceDue = Math.max(0, tuitionFee - totalPaid);
  const isPaid = balanceDue === 0 && tuitionFee > 0;

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!registration) {
    return (
      <DashboardLayout title="Student Dashboard">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No enrollment found. Please contact support.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const stats = [
    { 
      title: 'Enrolled Program', 
      value: '1', 
      icon: BookOpen, 
      color: 'text-blue-500' 
    },
    { 
      title: 'Attendance', 
      value: courseProgress ? `${courseProgress.attended_sessions}/${courseProgress.total_sessions || '-'}` : '-', 
      icon: Clock, 
      color: 'text-green-500' 
    },
    { 
      title: 'Balance Due', 
      value: formatCurrency(balanceDue), 
      icon: CreditCard, 
      color: isPaid ? 'text-green-500' : 'text-orange-500' 
    },
    { 
      title: 'Progress', 
      value: courseProgress ? `${courseProgress.completion_percentage || 0}%` : '0%', 
      icon: Award, 
      color: 'text-purple-500' 
    },
  ];

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-6">
        {/* Welcome banner */}
        <Card className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Welcome back, {registration.first_name}!
                </h2>
                <p className="text-muted-foreground mt-1">
                  {courseProgress 
                    ? `You're ${courseProgress.completion_percentage || 0}% through your program. Keep going!`
                    : "Your learning journey starts here!"}
                </p>
              </div>
              <div className="hidden md:block">
                <Award className="w-16 h-16 text-purple-500/30" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 bg-secondary rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Program and Schedule */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* My Program */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                My Program
              </CardTitle>
              <CardDescription>Your enrolled program details</CardDescription>
            </CardHeader>
            <CardContent>
              {registration.programs && (
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-foreground text-lg">
                        {registration.programs.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Category: {registration.programs.category}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Duration: {registration.programs.duration} {registration.programs.duration_unit}
                      </p>
                      {registration.programs.start_date && (
                        <p className="text-sm text-muted-foreground">
                          Start Date: {format(new Date(registration.programs.start_date), 'MMMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      isPaid 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {isPaid ? 'Paid' : 'Balance Due'}
                    </span>
                  </div>
                  
                  {courseProgress && (
                    <>
                      <Progress value={courseProgress.completion_percentage || 0} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {courseProgress.attended_sessions || 0} of {courseProgress.total_sessions || 'N/A'} sessions attended
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming
              </CardTitle>
              <CardDescription>Your next classes</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {format(new Date(session.session_date), 'EEE, MMM d')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {session.start_time} - {session.end_time}
                        </span>
                      </div>
                      <p className="font-medium text-foreground text-sm">{session.title}</p>
                      {session.training_locations && (
                        <p className="text-xs text-muted-foreground">
                          {session.training_locations.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming sessions scheduled
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment section */}
        <Card className={`${isPaid ? 'border-green-500/20 bg-green-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
          <CardContent className="p-4">
            {isPaid ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-foreground">Payment Complete</p>
                  <p className="text-sm text-muted-foreground">
                    You've paid {formatCurrency(totalPaid)} for your tuition
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-foreground">Payment Due</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(balanceDue)} balance remaining
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    // TODO: Integrate Paystack payment
                    alert('Paystack payment integration coming soon!');
                  }}
                >
                  Pay Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {payment.payment_type === 'tuition' ? 'Tuition Payment' : payment.payment_type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), 'MMM d, yyyy')} • {payment.payment_method}
                      </p>
                    </div>
                    <p className="font-medium text-green-500">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
