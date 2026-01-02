import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, Loader2, ArrowLeft, Monitor, Cpu, CheckCircle2 } from 'lucide-react';
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
  program_id: z.string().uuid('Please select a preferred skill training'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

type Program = {
  id: string;
  name: string;
  category: string;
  duration: string;
  duration_unit: string;
  tuition_fee: number;
};

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<RegistrationFormData>>({
    last_name: '',
    first_name: '',
    middle_name: '',
    gender: undefined,
    is_pwd: '',
    date_of_birth: '',
    phone: '',
    alternative_phone: '',
    email: '',
    state: '',
    lga: '',
    address: '',
    education_level: '',
    current_income: '',
    previous_experience: '',
    program_id: '',
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from('programs')
      .select('id, name, category, duration, duration_unit, tuition_fee')
      .eq('is_active', true)
      .order('category', { ascending: true });
    
    if (error) {
      toast.error('Failed to load programs');
    } else {
      setPrograms(data || []);
    }
    setLoading(false);
  };

  const handleChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Calculate age from date of birth
  const calculatedAge = useMemo(() => {
    if (!formData.date_of_birth) return '';
    const today = new Date();
    const birthDate = new Date(formData.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age.toString() : '';
  }, [formData.date_of_birth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('student_registrations')
      .insert({
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
        education_level: formData.education_level || null,
        current_income: formData.current_income || null,
        previous_experience: formData.previous_experience || null,
      });

    setSubmitting(false);

    if (error) {
      toast.error('Failed to submit registration. Please try again.');
    } else {
      setSubmitted(true);
      toast.success('Registration submitted successfully!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              Registration Submitted!
            </h1>
            <p className="text-muted-foreground mb-8">
              Thank you for applying to Topearl International Institute. Our admissions team will review your application and contact you within 2-3 business days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button variant="gold" onClick={() => setSubmitted(false)}>
                Submit Another
              </Button>
            </div>
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
        <div className="container mx-auto max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-display">Student Registration</CardTitle>
              <CardDescription>
                Apply to join Topearl International Institute
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : programs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No programs available at the moment.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Surname *</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => handleChange('last_name', e.target.value)}
                          placeholder="Doe"
                        />
                        {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => handleChange('first_name', e.target.value)}
                          placeholder="John"
                        />
                        {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middle_name">Middle Name</Label>
                        <Input
                          id="middle_name"
                          value={formData.middle_name}
                          onChange={(e) => handleChange('middle_name', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Sex *</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => handleChange('gender', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="is_pwd">PWD (Person with Disability)</Label>
                        <Select
                          value={formData.is_pwd}
                          onValueChange={(value) => handleChange('is_pwd', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select or leave blank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth *</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={formData.date_of_birth || ''}
                          onChange={(e) => handleChange('date_of_birth', e.target.value)}
                        />
                        {errors.date_of_birth && <p className="text-sm text-destructive">{errors.date_of_birth}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          value={calculatedAge}
                          readOnly
                          disabled
                          placeholder="Auto-calculated"
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Primary Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="+234 800 000 0000"
                        />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alternative_phone">Alternative Phone Number</Label>
                        <Input
                          id="alternative_phone"
                          type="tel"
                          value={formData.alternative_phone}
                          onChange={(e) => handleChange('alternative_phone', e.target.value)}
                          placeholder="+234 800 000 0000"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="john@example.com"
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Location</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="state">State of Origin *</Label>
                        <Select
                          value={formData.state}
                          onValueChange={(value) => handleChange('state', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {NIGERIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lga">LGA (Local Government Area) *</Label>
                        <Input
                          id="lga"
                          value={formData.lga}
                          onChange={(e) => handleChange('lga', e.target.value)}
                          placeholder="Enter your LGA"
                        />
                        {errors.lga && <p className="text-sm text-destructive">{errors.lga}</p>}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="address">Residential Address *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          placeholder="123 Main Street, City"
                        />
                        {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Background */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Background & Experience</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="education_level">Highest Educational Qualification *</Label>
                        <Select
                          value={formData.education_level}
                          onValueChange={(value) => handleChange('education_level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select qualification" />
                          </SelectTrigger>
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
                        <Label htmlFor="current_income">Currently Earning Income</Label>
                        <Input
                          id="current_income"
                          value={formData.current_income}
                          onChange={(e) => handleChange('current_income', e.target.value)}
                          placeholder="State amount or leave blank"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="previous_experience">Work Experience</Label>
                        <Textarea
                          id="previous_experience"
                          value={formData.previous_experience}
                          onChange={(e) => handleChange('previous_experience', e.target.value)}
                          placeholder="Briefly describe your work experience..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Program Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Preferred Skill Training</h3>
                    <div className="space-y-2">
                      <Label htmlFor="program_id">Select Program *</Label>
                      <Select
                        value={formData.program_id}
                        onValueChange={(value) => handleChange('program_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a program" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program) => (
                            <SelectItem key={program.id} value={program.id}>
                              <span className="flex items-center gap-2">
                                {program.category === 'software' ? (
                                  <Monitor className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <Cpu className="w-4 h-4 text-green-500" />
                                )}
                                {program.name} - {program.duration} {program.duration_unit} ({formatCurrency(program.tuition_fee)})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.program_id && <p className="text-sm text-destructive">{errors.program_id}</p>}
                    </div>
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
