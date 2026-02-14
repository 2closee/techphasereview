import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, CreditCard, Award, Calendar, Loader2, CheckCircle2, Users, MapPin, IdCard, AlertTriangle, GraduationCap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const WARRI_LOCATION_ID = 'af2ca449-9394-46dd-b4b3-216bb50e9aeb';

interface StudentRegistration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  program_id: string;
  payment_status: string;
  created_at: string;
  preferred_location_id: string | null;
  batch_id: string | null;
  projected_batch_number: number | null;
  matriculation_number: string | null;
  programs: {
    id: string;
    name: string;
    category: string;
    duration: string;
    duration_unit: string;
    tuition_fee: number;
    start_date: string | null;
  } | null;
  training_locations: {
    id: string;
    name: string;
    city: string;
    state: string;
  } | null;
}

interface BatchInfo {
  id: string;
  batch_number: number;
  current_count: number;
  max_students: number;
  status: string;
  start_date: string | null;
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
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [scholarshipStatus, setScholarshipStatus] = useState<{ status: string; granted_percentage: number | null } | null>(null);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;

    try {
      // Fetch student registration with program and location details
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
          preferred_location_id,
          batch_id,
          projected_batch_number,
          matriculation_number,
          programs:program_id (
            id,
            name,
            category,
            duration,
            duration_unit,
            tuition_fee,
            start_date
          ),
          training_locations:preferred_location_id (
            id,
            name,
            city,
            state
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (regData) {
        setRegistration(regData as StudentRegistration);

        // Fetch batch info if student has a batch assignment or is at Warri
        if (regData.batch_id) {
          const { data: batchData } = await supabase
            .from('course_batches')
            .select('id, batch_number, current_count, max_students, status, start_date')
            .eq('id', regData.batch_id)
            .single();

          if (batchData) {
            setBatchInfo(batchData);
          }
        } else if (regData.preferred_location_id === WARRI_LOCATION_ID && regData.projected_batch_number) {
          // Show projected batch info for unpaid Warri students
          setBatchInfo({
            id: 'projected',
            batch_number: regData.projected_batch_number,
            current_count: 0,
            max_students: 15,
            status: 'projected',
            start_date: null
          });
        }

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
        )}

        {/* Scholarship CTA */}
        {!scholarshipStatus ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-start gap-4">
                  <GraduationCap className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display font-bold text-foreground text-lg">Need Financial Assistance?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Apply for a scholarship covering 30% to 100% of your tuition fees.
                    </p>
                  </div>
                </div>
                <Link to="/student/scholarship">
                  <Button>Apply for Scholarship</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className={scholarshipStatus.status === 'approved' ? "border-green-500/20" : "border-primary/20"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Scholarship Application</p>
                    <p className="text-sm text-muted-foreground">
                      {scholarshipStatus.status === 'approved'
                        ? "Approved - " + scholarshipStatus.granted_percentage + "% tuition discount"
                        : scholarshipStatus.status === 'denied'
                        ? 'Not approved'
                        : 'Under review'}
                    </p>
                  </div>
                </div>
                <Badge variant={scholarshipStatus.status === 'approved' ? 'default' : scholarshipStatus.status === 'denied' ? 'destructive' : 'secondary'}>
                  {scholarshipStatus.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
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

        // Fetch scholarship status
        const { data: scholarshipData } = await supabase
          .from('scholarship_applications')
          .select('status, granted_percentage')
          .eq('student_id', regData.id)
          .eq('program_id', regData.program_id)
          .maybeSingle();

        if (scholarshipData) {
          setScholarshipStatus(scholarshipData);
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
        {/* Pending payment banner for office_pending or partial */}
        {(registration.payment_status === 'office_pending' || registration.payment_status === 'unpaid') && (
          <Card className="border-orange-500/30 bg-orange-500/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Payment Pending</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {registration.payment_status === 'office_pending'
                      ? 'You selected "Pay at Office". Please visit the office to complete your payment and unlock full dashboard access.'
                      : 'Your tuition payment is pending. Please complete your payment to unlock full dashboard access.'}
                  </p>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-2">
                    Amount due: {formatCurrency(tuitionFee)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                {registration.matriculation_number && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-primary/10 rounded-md w-fit">
                    <IdCard className="w-4 h-4 text-primary" />
                    <span className="text-sm font-mono font-semibold text-primary">
                      Student ID: {registration.matriculation_number}
                    </span>
                  </div>
                )}
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

        {/* Batch Info for Warri Students */}
        {registration.preferred_location_id === WARRI_LOCATION_ID && batchInfo && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      Batch {batchInfo.batch_number}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {registration.training_locations?.name || 'Warri Center'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {batchInfo.status === 'projected' ? (
                    <span className="text-sm text-orange-500 font-medium">Pending Payment</span>
                  ) : batchInfo.status === 'open' ? (
                    <>
                      <p className="text-sm font-medium text-foreground">{batchInfo.current_count}/{batchInfo.max_students} students</p>
                      <p className="text-xs text-muted-foreground">Batch filling up</p>
                    </>
                  ) : batchInfo.status === 'full' ? (
                    <span className="text-sm text-green-500 font-medium">Batch Complete!</span>
                  ) : (
                    <span className="text-sm text-primary font-medium capitalize">{batchInfo.status}</span>
                  )}
                  {batchInfo.start_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Starts: {format(new Date(batchInfo.start_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  onClick={async () => {
                    if (!registration) return;
                    try {
                      const callbackUrl = `${window.location.origin}/student`;
                      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
                        body: { 
                          registration_id: registration.id,
                          callback_url: callbackUrl
                        }
                      });
                      if (error) throw error;
                      if (data.authorization_url) {
                        window.location.href = data.authorization_url;
                      }
                    } catch (err) {
                      console.error('Payment error:', err);
                      alert('Failed to start payment. Please try again.');
                    }
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
