import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, Loader2, ArrowLeft, Monitor, Cpu, CheckCircle2, MapPin, Users, UserCheck } from 'lucide-react';
import { z } from 'zod';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const WARRI_LOCATION_ID = 'af2ca449-9394-46dd-b4b3-216bb50e9aeb';

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
  preferred_location_id: z.string().uuid('Please select a training center'),
  can_attend_weekly: z.enum(['yes', 'no', 'maybe'], { required_error: 'Please indicate if you can attend weekly' }),
  guarantor_full_name: z.string().trim().min(2, 'Guarantor name is required').max(100),
  guarantor_address: z.string().trim().min(5, 'Guarantor address is required').max(200),
  guarantor_phone: z.string().trim().min(10, 'Guarantor phone must be at least 10 digits').max(15),
  guarantor_email: z.string().trim().email('Invalid guarantor email').max(100),
  terms_accepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms and conditions' }) }),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

type Program = {
  id: string;
  name: string;
  category: string;
  duration: string;
  duration_unit: string;
  tuition_fee: number;
  registration_fee: number | null;
  is_active: boolean;
};

type TrainingLocation = {
  id: string;
  name: string;
  city: string;
  state: string;
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
  const [searchParams] = useSearchParams();
  const preSelectedProgramId = searchParams.get('program_id');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [locations, setLocations] = useState<TrainingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'summary'>('form');
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [batchInfo, setBatchInfo] = useState<{ batchNumber: number; currentCount: number } | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(false);
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
    preferred_location_id: '',
    can_attend_weekly: undefined,
    guarantor_full_name: '',
    guarantor_address: '',
    guarantor_phone: '',
    guarantor_email: '',
    terms_accepted: undefined,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  // Handle pre-selected program from URL
  useEffect(() => {
    if (preSelectedProgramId && locations.length > 0) {
      fetchLocationForProgram(preSelectedProgramId);
    }
  }, [preSelectedProgramId, locations]);

  // Fetch programs when location changes
  useEffect(() => {
    if (formData.preferred_location_id) {
      fetchProgramsForLocation(formData.preferred_location_id);
    } else {
      setPrograms([]);
    }
  }, [formData.preferred_location_id]);

  // Fetch batch info when Warri is selected with a program
  useEffect(() => {
    if (formData.preferred_location_id === WARRI_LOCATION_ID && formData.program_id) {
      fetchBatchInfo(formData.program_id);
    } else {
      setBatchInfo(null);
    }
  }, [formData.preferred_location_id, formData.program_id]);

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('training_locations')
      .select('id, name, city, state')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      toast.error('Failed to load training locations');
    } else {
      setLocations(data || []);
    }
    setLoading(false);
  };

  const fetchLocationForProgram = async (programId: string) => {
    // Find a location that offers this program
    const { data, error } = await supabase
      .from('location_programs')
      .select('location_id')
      .eq('program_id', programId)
      .eq('is_active', true)
      .limit(1);

    if (!error && data && data.length > 0) {
      const locationId = data[0].location_id;
      // Only set location if it's active
      const matchingLocation = locations.find(l => l.id === locationId);
      if (matchingLocation) {
        setFormData(prev => ({ ...prev, preferred_location_id: locationId, program_id: programId }));
      }
    }
  };

  const fetchProgramsForLocation = async (locationId: string) => {
    // Clear current program selection when location changes
    if (formData.program_id) {
      setFormData(prev => ({ ...prev, program_id: '' }));
    }

    const { data, error } = await supabase
      .from('location_programs')
      .select(`
        program_id,
        programs:program_id (
          id,
          name,
          category,
          duration,
          duration_unit,
          tuition_fee,
          registration_fee,
          is_active
        )
      `)
      .eq('location_id', locationId)
      .eq('is_active', true);

    if (error) {
      toast.error('Failed to load programs for this location');
      setPrograms([]);
    } else {
      // Extract programs from the join result and filter active ones
      const availablePrograms = (data || [])
        .map(item => item.programs as unknown as Program)
        .filter(program => program && program.is_active);
      setPrograms(availablePrograms);
    }
  };

  const fetchBatchInfo = async (programId: string) => {
    setLoadingBatch(true);
    try {
      // Count paid registrations for this program at Warri
      const { count, error } = await supabase
        .from('student_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', programId)
        .eq('preferred_location_id', WARRI_LOCATION_ID)
        .eq('payment_status', 'paid');

      if (error) throw error;

      const paidCount = count || 0;
      const batchNumber = Math.floor(paidCount / 15) + 1;
      const currentCount = paidCount % 15;

      setBatchInfo({ batchNumber, currentCount });
    } catch (error) {
      console.error('Error fetching batch info:', error);
      setBatchInfo(null);
    } finally {
      setLoadingBatch(false);
    }
  };

  const handleChange = (field: keyof RegistrationFormData, value: string | boolean) => {
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

    // Move to summary step
    setStep('summary');
  };

  const handleConfirmAndProceed = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Generate UUID client-side so we don't need SELECT permission after INSERT
      const newRegistrationId = crypto.randomUUID();

      // Calculate projected batch number for Warri registrations
      const projectedBatchNumber =
        formData.preferred_location_id === WARRI_LOCATION_ID && batchInfo ? batchInfo.batchNumber : null;

      const { error } = await supabase
        .from('student_registrations')
        .insert({
          id: newRegistrationId,
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
          preferred_location_id: formData.preferred_location_id,
          projected_batch_number: projectedBatchNumber,
          education_level: formData.education_level || null,
          current_income: formData.current_income || null,
          previous_experience: formData.previous_experience || null,
          can_attend_weekly: formData.can_attend_weekly || null,
          guarantor_full_name: formData.guarantor_full_name || null,
          guarantor_address: formData.guarantor_address || null,
          guarantor_phone: formData.guarantor_phone || null,
          guarantor_email: formData.guarantor_email || null,
          terms_accepted: formData.terms_accepted || false,
          payment_status: 'unpaid',
          status: 'pending',
        });

      if (error) {
        console.error('Registration submission error:', error);
        toast.error(`Failed to submit registration: ${error.message}`);
        return;
      }

      setRegistrationId(newRegistrationId);
      toast.success('Registration submitted! Complete your payment to continue.');
      navigate(`/complete-enrollment?registration_id=${newRegistrationId}`);
    } catch (err) {
      console.error('Unexpected registration submission error:', err);
      toast.error('Failed to submit registration due to an unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProgram = programs.find(p => p.id === formData.program_id);
  const selectedLocation = locations.find(l => l.id === formData.preferred_location_id);
  const isWarriLocation = formData.preferred_location_id === WARRI_LOCATION_ID;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Show summary step before final submission
  if (step === 'summary' && selectedProgram && selectedLocation) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-16 px-4">
          <div className="container mx-auto max-w-lg">
            <Button
              variant="ghost"
              onClick={() => setStep('form')}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Form
            </Button>

            <Card className="border-primary/20">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-display">Confirm Your Registration</CardTitle>
                <CardDescription>
                  Review your details before proceeding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Info Summary */}
                <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                  <p className="font-medium text-foreground">
                    {formData.first_name} {formData.middle_name} {formData.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{formData.email}</p>
                  <p className="text-sm text-muted-foreground">{formData.phone}</p>
                </div>

                {/* Training Center */}
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium">{selectedLocation.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {selectedLocation.city}, {selectedLocation.state}
                  </p>
                </div>

                {/* Batch Info for Warri */}
                {isWarriLocation && batchInfo && (
                  <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground">Batch Assignment</span>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      You will be in Batch {batchInfo.batchNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Currently {batchInfo.currentCount}/15 students enrolled in this batch
                    </p>
                  </div>
                )}

                {/* Program Summary */}
                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3 mb-3">
                    {selectedProgram.category === 'software' ? (
                      <Monitor className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Cpu className="w-6 h-6 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{selectedProgram.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedProgram.duration} {selectedProgram.duration_unit}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-primary/10 pt-3 mt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tuition Fee</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(selectedProgram.tuition_fee)}
                      </span>
                    </div>
                    {selectedProgram.registration_fee && selectedProgram.registration_fee > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Registration Fee</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(selectedProgram.registration_fee)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                      <span className="font-semibold text-foreground">Total Cost</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(selectedProgram.tuition_fee + (selectedProgram.registration_fee || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  After registration, you'll create your account to access your student dashboard. 
                  Payment can be made from your dashboard.
                </p>

                <Button 
                  variant="gold" 
                  className="w-full" 
                  onClick={handleConfirmAndProceed}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm & Create Account
                </Button>
              </CardContent>
            </Card>
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
                Apply to join Meranos Hub
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Training Center Selection - Always visible first */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Select Training Center</h3>
                    <div className="space-y-2">
                      <Label htmlFor="preferred_location_id_top">Training Center *</Label>
                      <Select
                        value={formData.preferred_location_id}
                        onValueChange={(value) => handleChange('preferred_location_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a training center" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                {location.name} - {location.city}, {location.state}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.preferred_location_id && <p className="text-sm text-destructive">{errors.preferred_location_id}</p>}
                    </div>
                  </div>

                  {!formData.preferred_location_id ? (
                    <div className="text-center py-12 border-t">
                      <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Please select a training center above to view available programs and continue registration.</p>
                    </div>
                  ) : programs.length === 0 ? (
                    <div className="text-center py-12 border-t">
                      <p className="text-muted-foreground">No programs are currently available at the selected location.</p>
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
                    <div className="space-y-4">
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

                      {/* Batch Info Display for Warri */}
                      {isWarriLocation && formData.program_id && (
                        <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-foreground">Batch Assignment Preview</span>
                          </div>
                          {loadingBatch ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Calculating your batch...</span>
                            </div>
                          ) : batchInfo ? (
                            <>
                              <p className="text-lg font-bold text-primary">
                                You will be assigned to Batch {batchInfo.batchNumber}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Currently {batchInfo.currentCount}/15 paid students in this batch for {selectedProgram?.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Note: Your batch is confirmed after payment. Each batch starts when 15 students have paid.
                              </p>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attendance Commitment */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Attendance Commitment</h3>
                    <div className="space-y-2">
                      <Label htmlFor="can_attend_weekly">Can you attend a course 2-3 times weekly, for 6 months? *</Label>
                      <Select
                        value={formData.can_attend_weekly}
                        onValueChange={(value) => handleChange('can_attend_weekly', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your answer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="maybe">Maybe</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.can_attend_weekly && <p className="text-sm text-destructive">{errors.can_attend_weekly}</p>}
                    </div>
                  </div>

                  {/* Guarantor Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-primary" />
                      Guarantor's Information
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="guarantor_full_name">Guarantor's Full Name *</Label>
                        <Input
                          id="guarantor_full_name"
                          value={formData.guarantor_full_name}
                          onChange={(e) => handleChange('guarantor_full_name', e.target.value)}
                          placeholder="Enter guarantor's full name"
                        />
                        {errors.guarantor_full_name && <p className="text-sm text-destructive">{errors.guarantor_full_name}</p>}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="guarantor_address">Guarantor's Address *</Label>
                        <Input
                          id="guarantor_address"
                          value={formData.guarantor_address}
                          onChange={(e) => handleChange('guarantor_address', e.target.value)}
                          placeholder="Enter guarantor's address"
                        />
                        {errors.guarantor_address && <p className="text-sm text-destructive">{errors.guarantor_address}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guarantor_phone">Guarantor's Phone Number *</Label>
                        <Input
                          id="guarantor_phone"
                          type="tel"
                          value={formData.guarantor_phone}
                          onChange={(e) => handleChange('guarantor_phone', e.target.value)}
                          placeholder="+234 800 000 0000"
                        />
                        {errors.guarantor_phone && <p className="text-sm text-destructive">{errors.guarantor_phone}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guarantor_email">Guarantor's Email Address *</Label>
                        <Input
                          id="guarantor_email"
                          type="email"
                          value={formData.guarantor_email}
                          onChange={(e) => handleChange('guarantor_email', e.target.value)}
                          placeholder="guarantor@example.com"
                        />
                        {errors.guarantor_email && <p className="text-sm text-destructive">{errors.guarantor_email}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms_accepted"
                        checked={formData.terms_accepted === true}
                        onCheckedChange={(checked) => handleChange('terms_accepted', checked === true)}
                        className="mt-1"
                      />
                      <Label htmlFor="terms_accepted" className="text-sm leading-relaxed cursor-pointer">
                        Yes, I agree with the <a href="/privacy-policy" target="_blank" className="text-primary hover:underline">privacy policy</a> and <a href="/terms-and-conditions" target="_blank" className="text-primary hover:underline">terms and conditions</a>
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
