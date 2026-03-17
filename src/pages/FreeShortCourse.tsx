import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { GraduationCap, Loader2, ArrowLeft, Monitor, Cpu, CheckCircle2, MapPin, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const registrationSchema = z.object({
  last_name: z.string().trim().min(2, 'Surname must be at least 2 characters').max(50),
  first_name: z.string().trim().min(2, 'First name must be at least 2 characters').max(50),
  middle_name: z.string().trim().max(50).optional(),
  gender: z.enum(['male', 'female']),
  is_pwd: z.string().optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(15),
  alternative_phone: z.string().trim().max(15).optional(),
  email: z.string().trim().email('Invalid email address').max(100),
  state: z.string().trim().min(1, 'State of origin is required').max(50),
  lga: z.string().trim().min(1, 'LGA is required').max(100),
  address: z.string().trim().min(1, 'Residential address is required').max(200),
  education_level: z.string().min(1, 'Education qualification is required'),
  current_income: z.string().trim().max(100).optional(),
  previous_experience: z.string().trim().max(500).optional(),
  program_id: z.string().uuid('Please select a course'),
  can_attend_weekly: z.enum(['yes', 'no', 'maybe'], { required_error: 'Please indicate if you can attend' }),
  guarantor_full_name: z.string().trim().min(2, 'Guarantor name is required').max(100),
  guarantor_address: z.string().trim().min(5, 'Guarantor address is required').max(200),
  guarantor_phone: z.string().trim().min(10, 'Guarantor phone must be at least 10 digits').max(15),
  guarantor_email: z.string().trim().email('Invalid guarantor email').max(100),
  terms_accepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms and conditions' }) }),
});

type FormData = z.infer<typeof registrationSchema>;

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export default function FreeShortCourse() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'summary' | 'success'>('form');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<FormData>>({
    last_name: '', first_name: '', middle_name: '', gender: undefined,
    is_pwd: '', date_of_birth: '', phone: '', alternative_phone: '',
    email: '', state: '', lga: '', address: '', education_level: '',
    current_income: '', previous_experience: '', program_id: '',
    can_attend_weekly: undefined, guarantor_full_name: '', guarantor_address: '',
    guarantor_phone: '', guarantor_email: '', terms_accepted: undefined,
  });

  // Fetch Warri location
  const { data: warriLocation } = useQuery({
    queryKey: ['warri-location'],
    queryFn: async () => {
      const { data } = await supabase
        .from('training_locations')
        .select('id, name, city, state')
        .eq('is_active', true)
        .ilike('city', '%warri%')
        .single();
      return data;
    },
  });

  // Fetch free short courses at Warri
  const { data: freeCourses = [], isLoading } = useQuery({
    queryKey: ['free-short-courses', warriLocation?.id],
    queryFn: async () => {
      if (!warriLocation?.id) return [];
      const { data: lp } = await supabase
        .from('location_programs')
        .select('program_id')
        .eq('location_id', warriLocation.id)
        .eq('is_active', true);
      if (!lp?.length) return [];
      const { data } = await supabase
        .from('programs')
        .select('id, name, description, category, duration, duration_unit')
        .in('id', lp.map(l => l.program_id))
        .eq('is_active', true)
        .eq('is_free_short_course', true);
      return data || [];
    },
    enabled: !!warriLocation?.id,
  });

  // Auto-select if only one course
  useEffect(() => {
    if (freeCourses.length === 1 && !formData.program_id) {
      setFormData(prev => ({ ...prev, program_id: freeCourses[0].id }));
    }
  }, [freeCourses]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const calculatedAge = useMemo(() => {
    if (!formData.date_of_birth) return '';
    const today = new Date();
    const birthDate = new Date(formData.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age > 0 ? age.toString() : '';
  }, [formData.date_of_birth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast.error('Please fill in all required fields correctly');
      return;
    }
    setStep('summary');
  };

  const handleConfirmAndSubmit = async () => {
    if (submitting || !warriLocation?.id) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('student_registrations').insert({
        id: crypto.randomUUID(),
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || null,
        email: formData.email,
        phone: formData.phone,
        alternative_phone: formData.alternative_phone || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        is_pwd: formData.is_pwd || null,
        address: formData.address || null,
        state: formData.state || null,
        lga: formData.lga || null,
        program_id: formData.program_id,
        preferred_location_id: warriLocation.id,
        education_level: formData.education_level || null,
        current_income: formData.current_income || null,
        previous_experience: formData.previous_experience || null,
        can_attend_weekly: formData.can_attend_weekly || null,
        guarantor_full_name: formData.guarantor_full_name || null,
        guarantor_address: formData.guarantor_address || null,
        guarantor_phone: formData.guarantor_phone || null,
        guarantor_email: formData.guarantor_email || null,
        terms_accepted: formData.terms_accepted || false,
        country: 'Nigeria',
        payment_status: 'paid',
        payment_plan: 'free',
        status: 'approved',
      });
      if (error) throw error;
      setStep('success');
      toast.success('Registration successful!');
    } catch (err: any) {
      toast.error(`Registration failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProgram = freeCourses.find((p: any) => p.id === formData.program_id);

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-16 px-4">
          <div className="container mx-auto max-w-lg">
            <Card className="border-primary/20">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-display">Registration Complete!</CardTitle>
                <CardDescription>
                  You've been registered for the free short course at {warriLocation?.name || 'Warri Center'}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  We'll contact you with class schedule details. After completing this course, you can apply for our paid certification programs.
                </p>
                <div className="flex flex-col gap-2 pt-4">
                  <Link to="/register">
                    <Button className="w-full bg-gradient-primary">Apply for Paid Courses</Button>
                  </Link>
                  <Link to="/">
                    <Button variant="outline" className="w-full">Back to Home</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Summary step
  if (step === 'summary' && selectedProgram && warriLocation) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-16 px-4">
          <div className="container mx-auto max-w-lg">
            <Button variant="ghost" onClick={() => setStep('form')} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Form
            </Button>
            <Card className="border-primary/20">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-display">Confirm Your Registration</CardTitle>
                <CardDescription>Review your details before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                  <p className="font-medium text-foreground">
                    {formData.first_name} {formData.middle_name} {formData.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{formData.email}</p>
                  <p className="text-sm text-muted-foreground">{formData.phone}</p>
                </div>

                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium">{warriLocation.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {warriLocation.city}, {warriLocation.state}
                  </p>
                </div>

                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3">
                    {selectedProgram.category === 'software' ? (
                      <Monitor className="w-6 h-6 text-primary" />
                    ) : (
                      <Cpu className="w-6 h-6 text-primary" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{selectedProgram.name}</p>
                      <p className="text-sm text-muted-foreground">
                        3 Weeks • FREE
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  This is a free introductory course. No payment is required. After completion, you can apply for paid certification programs.
                </p>

                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleConfirmAndSubmit}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm & Submit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>

          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-display">Free Short Course Registration</CardTitle>
              <CardDescription>
                3-Week Introductory Course — Warri Training Center
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : freeCourses.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No free short courses are currently available. Please check back later.</p>
                  <Link to="/register">
                    <Button className="bg-gradient-primary">View Paid Courses</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  {/* Course Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Select Free Course</h3>
                    <div className="space-y-2">
                      <Label>Course *</Label>
                      <Select value={formData.program_id} onValueChange={v => handleChange('program_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Choose a free course" /></SelectTrigger>
                        <SelectContent>
                          {freeCourses.map((course: any) => (
                            <SelectItem key={course.id} value={course.id}>
                              <span className="flex items-center gap-2">
                                {course.category === 'software' ? (
                                  <Monitor className="w-4 h-4 text-primary" />
                                ) : (
                                  <Cpu className="w-4 h-4 text-primary" />
                                )}
                                {course.name} — 3 Weeks (Free)
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.program_id && <p className="text-sm text-destructive">{errors.program_id}</p>}
                    </div>
                    {warriLocation && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        Training Center: <span className="font-medium text-foreground">{warriLocation.name} — {warriLocation.city}, {warriLocation.state}</span>
                      </div>
                    )}
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Surname *</Label>
                        <Input value={formData.last_name} onChange={e => handleChange('last_name', e.target.value)} placeholder="Doe" />
                        {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>First Name *</Label>
                        <Input value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} placeholder="John" />
                        {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Middle Name</Label>
                        <Input value={formData.middle_name} onChange={e => handleChange('middle_name', e.target.value)} placeholder="Optional" />
                      </div>
                      <div className="space-y-2">
                        <Label>Sex *</Label>
                        <Select value={formData.gender} onValueChange={v => handleChange('gender', v)}>
                          <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>PWD (Person with Disability)</Label>
                        <Select value={formData.is_pwd} onValueChange={v => handleChange('is_pwd', v)}>
                          <SelectTrigger><SelectValue placeholder="Select or leave blank" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth *</Label>
                        <Input type="date" value={formData.date_of_birth || ''} onChange={e => handleChange('date_of_birth', e.target.value)} />
                        {errors.date_of_birth && <p className="text-sm text-destructive">{errors.date_of_birth}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input value={calculatedAge} readOnly disabled placeholder="Auto-calculated" className="bg-muted" />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Primary Phone Number *</Label>
                        <Input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+234 800 000 0000" />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Alternative Phone Number</Label>
                        <Input type="tel" value={formData.alternative_phone} onChange={e => handleChange('alternative_phone', e.target.value)} placeholder="+234 800 000 0000" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>E-mail *</Label>
                        <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="john@example.com" />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Location</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>State of Origin *</Label>
                        <Select value={formData.state} onValueChange={v => handleChange('state', v)}>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {NIGERIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>LGA (Local Government Area) *</Label>
                        <Input value={formData.lga} onChange={e => handleChange('lga', e.target.value)} placeholder="Enter your LGA" />
                        {errors.lga && <p className="text-sm text-destructive">{errors.lga}</p>}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Residential Address *</Label>
                        <Input value={formData.address} onChange={e => handleChange('address', e.target.value)} placeholder="123 Main Street, City" />
                        {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Background */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Background & Experience</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Highest Educational Qualification *</Label>
                        <Select value={formData.education_level} onValueChange={v => handleChange('education_level', v)}>
                          <SelectTrigger><SelectValue placeholder="Select qualification" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary School</SelectItem>
                            <SelectItem value="secondary">Secondary School (SSCE/WAEC)</SelectItem>
                            <SelectItem value="diploma">Diploma/OND</SelectItem>
                            <SelectItem value="hnd">HND</SelectItem>
                            <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                            <SelectItem value="masters">Master's Degree</SelectItem>
                            <SelectItem value="phd">PhD/Doctorate</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.education_level && <p className="text-sm text-destructive">{errors.education_level}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Currently Earning Income</Label>
                        <Input value={formData.current_income} onChange={e => handleChange('current_income', e.target.value)} placeholder="State amount or leave blank" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Work Experience</Label>
                        <Textarea value={formData.previous_experience} onChange={e => handleChange('previous_experience', e.target.value)} placeholder="Briefly describe your work experience..." rows={3} />
                      </div>
                    </div>
                  </div>

                  {/* Attendance Commitment */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Attendance Commitment</h3>
                    <div className="space-y-2">
                      <Label>Can you attend the course 2-3 times weekly for 3 weeks? *</Label>
                      <Select value={formData.can_attend_weekly} onValueChange={v => handleChange('can_attend_weekly', v)}>
                        <SelectTrigger><SelectValue placeholder="Select your answer" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="maybe">Maybe</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.can_attend_weekly && <p className="text-sm text-destructive">{errors.can_attend_weekly}</p>}
                    </div>
                  </div>

                  {/* Guarantor */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-primary" />
                      Guarantor's Information
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Guarantor's Full Name *</Label>
                        <Input value={formData.guarantor_full_name} onChange={e => handleChange('guarantor_full_name', e.target.value)} placeholder="Enter guarantor's full name" />
                        {errors.guarantor_full_name && <p className="text-sm text-destructive">{errors.guarantor_full_name}</p>}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Guarantor's Address *</Label>
                        <Input value={formData.guarantor_address} onChange={e => handleChange('guarantor_address', e.target.value)} placeholder="Enter guarantor's address" />
                        {errors.guarantor_address && <p className="text-sm text-destructive">{errors.guarantor_address}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Guarantor's Phone Number *</Label>
                        <Input type="tel" value={formData.guarantor_phone} onChange={e => handleChange('guarantor_phone', e.target.value)} placeholder="+234 800 000 0000" />
                        {errors.guarantor_phone && <p className="text-sm text-destructive">{errors.guarantor_phone}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Guarantor's Email Address *</Label>
                        <Input type="email" value={formData.guarantor_email} onChange={e => handleChange('guarantor_email', e.target.value)} placeholder="guarantor@example.com" />
                        {errors.guarantor_email && <p className="text-sm text-destructive">{errors.guarantor_email}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms_accepted"
                        checked={formData.terms_accepted === true}
                        onCheckedChange={checked => handleChange('terms_accepted', checked === true)}
                        className="mt-1"
                      />
                      <Label htmlFor="terms_accepted" className="text-sm leading-relaxed cursor-pointer">
                        Yes, I agree with the <a href="/privacy-policy" target="_blank" className="text-primary hover:underline">privacy policy</a> and <a href="/terms-and-conditions" target="_blank" className="text-primary hover:underline">terms and conditions</a>. I understand this is a free introductory course.
                      </Label>
                    </div>
                    {errors.terms_accepted && <p className="text-sm text-destructive">{errors.terms_accepted}</p>}
                  </div>

                  <div className="pt-4">
                    <Button type="submit" variant="gold" className="w-full" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submit Application
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
