import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, GraduationCap, MapPin, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/logo.png';

export default function FreeShortCourse() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    education_level: '',
    previous_experience: '',
    how_heard_about_us: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    guarantor_full_name: '',
    guarantor_phone: '',
    guarantor_address: '',
    guarantor_email: '',
  });

  // Fetch Warri location
  const { data: warriLocation } = useQuery({
    queryKey: ['warri-location'],
    queryFn: async () => {
      const { data } = await supabase
        .from('training_locations')
        .select('id, name, city, code')
        .eq('is_active', true)
        .ilike('city', '%warri%')
        .single();
      return data;
    },
  });

  // Fetch free short courses available at Warri
  const { data: freeCourses = [] } = useQuery({
    queryKey: ['free-short-courses', warriLocation?.id],
    queryFn: async () => {
      if (!warriLocation?.id) return [];
      // Get programs linked to Warri that are free short courses
      const { data: locationPrograms } = await supabase
        .from('location_programs')
        .select('program_id')
        .eq('location_id', warriLocation.id)
        .eq('is_active', true);
      
      if (!locationPrograms?.length) return [];
      const programIds = locationPrograms.map(lp => lp.program_id);
      
      const { data } = await supabase
        .from('programs')
        .select('*')
        .in('id', programIds)
        .eq('is_active', true)
        .eq('is_free_short_course', true);
      
      return data || [];
    },
    enabled: !!warriLocation?.id,
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !warriLocation?.id || !termsAccepted) {
      toast({ title: 'Error', description: 'Please fill all required fields and accept the terms.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('student_registrations').insert({
        ...form,
        program_id: selectedProgram,
        preferred_location_id: warriLocation.id,
        status: 'approved',
        payment_status: 'paid',
        payment_plan: 'free',
        terms_accepted: termsAccepted,
        can_attend_weekly: 'yes',
        country: 'Nigeria',
      });
      
      if (error) throw error;
      setSubmitted(true);
      toast({ title: 'Registration Successful!', description: 'You have been registered for the free short course.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-display">Registration Complete!</CardTitle>
            <CardDescription>
              You've been registered for the free short course at Warri. We'll contact you with class details shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              After completing this course, you can create an account and apply for our paid certification programs.
            </p>
            <div className="flex flex-col gap-2">
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
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="Logo" className="h-8 w-auto" />
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/30 rounded-2xl p-6 md:p-8 mb-8 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <Badge className="mb-2 bg-primary/20 text-primary border-0">FREE • 3 Weeks</Badge>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                Free Short Course — Warri Center
              </h1>
              <p className="text-muted-foreground">
                Get started with a free 3-week introductory course at our Warri training center. No fees, no commitment — just learning.
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Warri Center</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 3 Weeks Duration</span>
              </div>
            </div>
          </div>
        </div>

        {freeCourses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Free Courses Available</h3>
              <p className="text-muted-foreground mb-4">There are currently no free short courses available. Please check back later.</p>
              <Link to="/register">
                <Button className="bg-gradient-primary">View Paid Courses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Course Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select a Free Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {freeCourses.map((course: any) => (
                    <label
                      key={course.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedProgram === course.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        value={course.id}
                        checked={selectedProgram === course.id}
                        onChange={() => setSelectedProgram(course.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedProgram === course.id ? 'border-primary' : 'border-muted-foreground/30'
                      }`}>
                        {selectedProgram === course.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="font-medium">{course.name}</p>
                        {course.description && <p className="text-sm text-muted-foreground">{course.description}</p>}
                        <Badge variant="secondary" className="mt-1">Free • {course.duration} {course.duration_unit}</Badge>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>First Name *</Label><Input required value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} /></div>
                  <div><Label>Middle Name</Label><Input value={form.middle_name} onChange={e => handleChange('middle_name', e.target.value)} /></div>
                  <div><Label>Last Name *</Label><Input required value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Email *</Label><Input type="email" required value={form.email} onChange={e => handleChange('email', e.target.value)} /></div>
                  <div><Label>Phone *</Label><Input type="tel" required value={form.phone} onChange={e => handleChange('phone', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Gender *</Label>
                    <Select value={form.gender} onValueChange={v => handleChange('gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} /></div>
                </div>
                <div><Label>Address</Label><Input value={form.address} onChange={e => handleChange('address', e.target.value)} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>City</Label><Input value={form.city} onChange={e => handleChange('city', e.target.value)} /></div>
                  <div><Label>State</Label><Input value={form.state} onChange={e => handleChange('state', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Education Level</Label>
                    <Select value={form.education_level} onValueChange={v => handleChange('education_level', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary (SSCE/WAEC)</SelectItem>
                        <SelectItem value="diploma">Diploma/NCE</SelectItem>
                        <SelectItem value="degree">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Previous Experience</Label><Input value={form.previous_experience} onChange={e => handleChange('previous_experience', e.target.value)} placeholder="Any related experience" /></div>
                </div>
                <div>
                  <Label>How did you hear about us?</Label>
                  <Select value={form.how_heard_about_us} onValueChange={v => handleChange('how_heard_about_us', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="friend">Friend/Family</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="flyer">Flyer/Poster</SelectItem>
                      <SelectItem value="radio">Radio/TV</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact & Guarantor */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Emergency Contact & Guarantor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Emergency Contact Name *</Label><Input required value={form.emergency_contact_name} onChange={e => handleChange('emergency_contact_name', e.target.value)} /></div>
                  <div><Label>Emergency Contact Phone *</Label><Input required type="tel" value={form.emergency_contact_phone} onChange={e => handleChange('emergency_contact_phone', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Guarantor Full Name *</Label><Input required value={form.guarantor_full_name} onChange={e => handleChange('guarantor_full_name', e.target.value)} /></div>
                  <div><Label>Guarantor Phone *</Label><Input required type="tel" value={form.guarantor_phone} onChange={e => handleChange('guarantor_phone', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Guarantor Address</Label><Input value={form.guarantor_address} onChange={e => handleChange('guarantor_address', e.target.value)} /></div>
                  <div><Label>Guarantor Email</Label><Input type="email" value={form.guarantor_email} onChange={e => handleChange('guarantor_email', e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>

            {/* Terms */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    I agree to the <Link to="/terms-and-conditions" className="text-primary underline" target="_blank">Terms and Conditions</Link> and <Link to="/privacy-policy" className="text-primary underline" target="_blank">Privacy Policy</Link>. I understand this is a free introductory course.
                  </label>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full bg-gradient-primary h-12 text-lg" disabled={isSubmitting || !selectedProgram || !termsAccepted}>
              {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</> : 'Register for Free Course'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}