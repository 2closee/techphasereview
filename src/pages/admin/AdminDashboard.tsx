import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Users, GraduationCap, BookOpen, CreditCard, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Program {
  id: string;
  name: string;
  category: string;
  tuition_fee: number;
  registration_fee: number;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  program_id: string;
  programs?: { name: string };
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activePrograms: number;
  monthlyRevenue: number;
}

interface RecentActivity {
  action: string;
  name: string;
  program: string;
  time: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    activePrograms: 0,
    monthlyRevenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [createProgramOpen, setCreateProgramOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [studentForm, setStudentForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', program_id: ''
  });
  const [teacherForm, setTeacherForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', specialization: '', qualification: '', experience_years: 0
  });
  const [programForm, setProgramForm] = useState({
    name: '', category: 'culinary', description: '', duration: '', duration_unit: 'months', tuition_fee: 0, registration_fee: 0
  });
  const [paymentForm, setPaymentForm] = useState({
    student_id: '', program_id: '', amount: 0, payment_type: 'tuition', payment_method: 'cash', payment_reference: '', notes: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const [studentsRes, teachersRes, programsRes, paymentsRes] = await Promise.all([
        supabase.from('student_registrations').select('id, first_name, last_name, email, program_id, status, created_at, programs(name)').eq('status', 'enrolled'),
        supabase.from('teachers').select('id').eq('is_active', true),
        supabase.from('programs').select('*').eq('is_active', true),
        supabase.from('student_payments').select('amount, created_at').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      ]);

      setStats({
        totalStudents: studentsRes.data?.length || 0,
        totalTeachers: teachersRes.data?.length || 0,
        activePrograms: programsRes.data?.length || 0,
        monthlyRevenue: paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      });

      setPrograms(programsRes.data || []);
      setStudents((studentsRes.data as Student[]) || []);

      // Get recent activity from registrations and payments
      const recentRegs = await supabase
        .from('student_registrations')
        .select('first_name, last_name, status, created_at, programs(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = (recentRegs.data || []).map((r: any) => ({
        action: r.status === 'enrolled' ? 'Student enrolled' : r.status === 'approved' ? 'Application approved' : 'New registration',
        name: `${r.first_name} ${r.last_name}`,
        program: r.programs?.name || 'N/A',
        time: formatTimeAgo(new Date(r.created_at))
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
  };

  const handleAddStudent = async () => {
    if (!studentForm.first_name || !studentForm.last_name || !studentForm.email || !studentForm.phone || !studentForm.program_id) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('student_registrations').insert({
        ...studentForm,
        status: 'enrolled'
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Student added successfully' });
      setAddStudentOpen(false);
      setStudentForm({ first_name: '', last_name: '', email: '', phone: '', program_id: '' });
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!teacherForm.first_name || !teacherForm.last_name || !teacherForm.email || !teacherForm.phone || !teacherForm.specialization) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('teachers').insert(teacherForm);
      if (error) throw error;
      toast({ title: 'Success', description: 'Teacher added successfully' });
      setAddTeacherOpen(false);
      setTeacherForm({ first_name: '', last_name: '', email: '', phone: '', specialization: '', qualification: '', experience_years: 0 });
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!programForm.name || !programForm.category || !programForm.duration) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('programs').insert(programForm);
      if (error) throw error;
      toast({ title: 'Success', description: 'Program created successfully' });
      setCreateProgramOpen(false);
      setProgramForm({ name: '', category: 'culinary', description: '', duration: '', duration_unit: 'months', tuition_fee: 0, registration_fee: 0 });
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.student_id || !paymentForm.amount || paymentForm.amount <= 0) {
      toast({ title: 'Error', description: 'Please select a student and enter a valid amount', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const student = students.find(s => s.id === paymentForm.student_id);
      const { error } = await supabase.from('student_payments').insert({
        ...paymentForm,
        program_id: student?.program_id || paymentForm.program_id
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Payment recorded successfully' });
      setRecordPaymentOpen(false);
      setPaymentForm({ student_id: '', program_id: '', amount: 0, payment_type: 'tuition', payment_method: 'cash', payment_reference: '', notes: '' });
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const statsDisplay = [
    { title: 'Total Students', value: stats.totalStudents.toString(), change: 'Enrolled', icon: Users, color: 'text-blue-500' },
    { title: 'Teachers', value: stats.totalTeachers.toString(), change: 'Active', icon: GraduationCap, color: 'text-green-500' },
    { title: 'Active Programs', value: stats.activePrograms.toString(), change: 'Available', icon: BookOpen, color: 'text-purple-500' },
    { title: 'Revenue (Month)', value: formatCurrency(stats.monthlyRevenue), change: 'This month', icon: CreditCard, color: 'text-primary' },
  ];

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Welcome to Topearl LMS
                </h2>
                <p className="text-muted-foreground mt-1">
                  Manage your institute's operations from one place
                </p>
              </div>
              <div className="hidden md:block">
                <Calendar className="w-16 h-16 text-primary/30" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsDisplay.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{loading ? '-' : stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 bg-secondary rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions and recent activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <button 
                onClick={() => setAddStudentOpen(true)}
                className="p-4 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors"
              >
                <Users className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium text-foreground">Add Student</p>
                <p className="text-xs text-muted-foreground">Register new student</p>
              </button>
              <button 
                onClick={() => setAddTeacherOpen(true)}
                className="p-4 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors"
              >
                <GraduationCap className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium text-foreground">Add Teacher</p>
                <p className="text-xs text-muted-foreground">Onboard new staff</p>
              </button>
              <button 
                onClick={() => setCreateProgramOpen(true)}
                className="p-4 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors"
              >
                <BookOpen className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium text-foreground">Create Program</p>
                <p className="text-xs text-muted-foreground">Add new course</p>
              </button>
              <button 
                onClick={() => setRecordPaymentOpen(true)}
                className="p-4 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors"
              >
                <CreditCard className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium text-foreground">Record Payment</p>
                <p className="text-xs text-muted-foreground">Log fee payment</p>
              </button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across the institute</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.name} • {activity.program}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Student Modal */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Register a new student directly to a program</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={studentForm.first_name} onChange={(e) => setStudentForm({...studentForm, first_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={studentForm.last_name} onChange={(e) => setStudentForm({...studentForm, last_name: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={studentForm.email} onChange={(e) => setStudentForm({...studentForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={studentForm.phone} onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Program *</Label>
              <Select value={studentForm.program_id} onValueChange={(v) => setStudentForm({...studentForm, program_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddStudent} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add Student'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Teacher Modal */}
      <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>Onboard a new staff member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={teacherForm.first_name} onChange={(e) => setTeacherForm({...teacherForm, first_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={teacherForm.last_name} onChange={(e) => setTeacherForm({...teacherForm, last_name: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={teacherForm.phone} onChange={(e) => setTeacherForm({...teacherForm, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Specialization *</Label>
              <Select value={teacherForm.specialization} onValueChange={(v) => setTeacherForm({...teacherForm, specialization: v})}>
                <SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="culinary">Culinary Arts</SelectItem>
                  <SelectItem value="pastry">Pastry & Baking</SelectItem>
                  <SelectItem value="fashion">Fashion Design</SelectItem>
                  <SelectItem value="tailoring">Tailoring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Qualification</Label>
                <Input value={teacherForm.qualification} onChange={(e) => setTeacherForm({...teacherForm, qualification: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Experience (Years)</Label>
                <Input type="number" value={teacherForm.experience_years} onChange={(e) => setTeacherForm({...teacherForm, experience_years: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <Button onClick={handleAddTeacher} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add Teacher'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Program Modal */}
      <Dialog open={createProgramOpen} onOpenChange={setCreateProgramOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Program</DialogTitle>
            <DialogDescription>Add a new course to the institute</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Program Name *</Label>
              <Input value={programForm.name} onChange={(e) => setProgramForm({...programForm, name: e.target.value})} placeholder="e.g., Professional Pastry" />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={programForm.category} onValueChange={(v) => setProgramForm({...programForm, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="culinary">Culinary</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={programForm.description} onChange={(e) => setProgramForm({...programForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration *</Label>
                <Input value={programForm.duration} onChange={(e) => setProgramForm({...programForm, duration: e.target.value})} placeholder="e.g., 6" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={programForm.duration_unit} onValueChange={(v) => setProgramForm({...programForm, duration_unit: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tuition Fee (₦)</Label>
                <Input type="number" value={programForm.tuition_fee} onChange={(e) => setProgramForm({...programForm, tuition_fee: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label>Registration Fee (₦)</Label>
                <Input type="number" value={programForm.registration_fee} onChange={(e) => setProgramForm({...programForm, registration_fee: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <Button onClick={handleCreateProgram} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Program'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Log a student fee payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={paymentForm.student_id} onValueChange={(v) => setPaymentForm({...paymentForm, student_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₦) *</Label>
              <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={paymentForm.payment_type} onValueChange={(v) => setPaymentForm({...paymentForm, payment_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">Tuition</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({...paymentForm, payment_method: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input value={paymentForm.payment_reference} onChange={(e) => setPaymentForm({...paymentForm, payment_reference: e.target.value})} placeholder="Transaction reference" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} placeholder="Additional notes" />
            </div>
            <Button onClick={handleRecordPayment} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Recording...</> : 'Record Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
