import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Building2, Type, GraduationCap, MapPin, Award, Palette, Plus, Pencil, Trash2, Save, Loader2, CreditCard, Landmark,
} from "lucide-react";

const AdminSettings = () => {
  const { settings, updateSetting } = useSettings();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  // --- Local form state for branding/hero/enrollment/attendance ---
  const [brandingForm, setBrandingForm] = useState({
    academy_name: settings.academy_name,
  });
  const [heroForm, setHeroForm] = useState({
    hero_title: settings.hero_title,
    hero_subtitle: settings.hero_subtitle,
    hero_badge_text: settings.hero_badge_text,
  });
  const [enrollmentForm, setEnrollmentForm] = useState({
    enrollment_open: settings.enrollment_open,
  });
  const [attendanceForm, setAttendanceForm] = useState({
    geofence_radius_meters: settings.geofence_radius_meters,
  });
  const [contactForm, setContactForm] = useState({
    contact_email: settings.contact_email,
    contact_phone: settings.contact_phone,
    contact_address: settings.contact_address,
    contact_office_hours: settings.contact_office_hours,
    footer_description: settings.footer_description,
  });
  const [paymentForm, setPaymentForm] = useState({
    partial_payment_percentage: (settings.partial_payment_percentage as number) || 50,
  });
  const [bankForm, setBankForm] = useState({
    bank_account_number: (settings.bank_account_number as string) || '',
    bank_account_name: (settings.bank_account_name as string) || '',
    bank_name: (settings.bank_name as string) || '',
    payment_instructions: (settings.payment_instructions as string) || '',
  });

  const saveSettings = async (fields: Record<string, unknown>, section: string) => {
    setSaving(section);
    try {
      for (const [key, value] of Object.entries(fields)) {
        await updateSetting(key, value);
      }
      toast.success(`${section} settings saved`);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(null);
    }
  };

  // --- Program Categories CRUD ---
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["program-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("program_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const [catForm, setCatForm] = useState({ name: "", slug: "", description: "" });
  const [catDialogOpen, setCatDialogOpen] = useState(false);

  const createCategoryMutation = useMutation({
    mutationFn: async (form: typeof catForm) => {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-");
      const { error } = await supabase.from("program_categories").insert({ name: form.name, slug, description: form.description || null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["program-categories"] }); setCatDialogOpen(false); setCatForm({ name: "", slug: "", description: "" }); toast.success("Category created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("program_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["program-categories"] }); toast.success("Category deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Certifications CRUD ---
  const { data: certifications = [], isLoading: loadingCerts } = useQuery({
    queryKey: ["certifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("certifications").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const [certForm, setCertForm] = useState({ name: "", provider: "", description: "" });
  const [certDialogOpen, setCertDialogOpen] = useState(false);

  const createCertMutation = useMutation({
    mutationFn: async (form: typeof certForm) => {
      const { error } = await supabase.from("certifications").insert({ name: form.name, provider: form.provider || null, description: form.description || null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["certifications"] }); setCertDialogOpen(false); setCertForm({ name: "", provider: "", description: "" }); toast.success("Certification created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["certifications"] }); toast.success("Certification deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const isSaving = (section: string) => saving === section;

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage academy configuration and preferences</p>
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="branding"><Building2 className="w-4 h-4 mr-2" />Branding</TabsTrigger>
            <TabsTrigger value="hero"><Type className="w-4 h-4 mr-2" />Hero Banner</TabsTrigger>
            <TabsTrigger value="contact"><MapPin className="w-4 h-4 mr-2" />Contact</TabsTrigger>
            <TabsTrigger value="enrollment"><GraduationCap className="w-4 h-4 mr-2" />Enrollment</TabsTrigger>
            <TabsTrigger value="attendance"><MapPin className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
            <TabsTrigger value="categories"><GraduationCap className="w-4 h-4 mr-2" />Categories</TabsTrigger>
            <TabsTrigger value="certifications"><Award className="w-4 h-4 mr-2" />Certifications</TabsTrigger>
            <TabsTrigger value="payment-plans"><CreditCard className="w-4 h-4 mr-2" />Payment Plans</TabsTrigger>
            <TabsTrigger value="bank-account"><Landmark className="w-4 h-4 mr-2" />Bank Account</TabsTrigger>
          </TabsList>

          {/* Branding */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Academy Branding</CardTitle>
                <CardDescription>Configure your academy name and identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Academy Name</Label>
                  <Input value={brandingForm.academy_name} onChange={(e) => setBrandingForm({ academy_name: e.target.value })} />
                </div>
                <Button onClick={() => saveSettings(brandingForm, "Branding")} disabled={isSaving("Branding")}>
                  {isSaving("Branding") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hero Banner */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Banner</CardTitle>
                <CardDescription>Configure the landing page hero section text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Badge Text</Label>
                  <Input value={heroForm.hero_badge_text} onChange={(e) => setHeroForm((p) => ({ ...p, hero_badge_text: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={heroForm.hero_title} onChange={(e) => setHeroForm((p) => ({ ...p, hero_title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Textarea value={heroForm.hero_subtitle} onChange={(e) => setHeroForm((p) => ({ ...p, hero_subtitle: e.target.value }))} rows={3} />
                </div>
                <Button onClick={() => saveSettings(heroForm, "Hero")} disabled={isSaving("Hero")}>
                  {isSaving("Hero") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Displayed on the landing page contact section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={contactForm.contact_email} onChange={(e) => setContactForm((p) => ({ ...p, contact_email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={contactForm.contact_phone} onChange={(e) => setContactForm((p) => ({ ...p, contact_phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={contactForm.contact_address} onChange={(e) => setContactForm((p) => ({ ...p, contact_address: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Office Hours</Label>
                  <Input value={contactForm.contact_office_hours} onChange={(e) => setContactForm((p) => ({ ...p, contact_office_hours: e.target.value }))} placeholder="Mon - Fri: 8:00 AM - 5:00 PM" />
                </div>
                <div className="space-y-2">
                  <Label>Footer Description</Label>
                  <Textarea value={contactForm.footer_description} onChange={(e) => setContactForm((p) => ({ ...p, footer_description: e.target.value }))} rows={3} placeholder="Short description shown in the website footer" />
                </div>
                <Button onClick={() => saveSettings(contactForm, "Contact")} disabled={isSaving("Contact")}>
                  {isSaving("Contact") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enrollment */}
          <TabsContent value="enrollment">
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Settings</CardTitle>
                <CardDescription>Control enrollment availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enrollment Open</Label>
                    <p className="text-sm text-muted-foreground">Allow new students to register</p>
                  </div>
                  <Switch checked={enrollmentForm.enrollment_open} onCheckedChange={(v) => setEnrollmentForm({ enrollment_open: v })} />
                </div>
                <Button onClick={() => saveSettings(enrollmentForm, "Enrollment")} disabled={isSaving("Enrollment")}>
                  {isSaving("Enrollment") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Settings</CardTitle>
                <CardDescription>Configure geofence and check-in rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Geofence Radius (meters)</Label>
                  <Input type="number" value={attendanceForm.geofence_radius_meters} onChange={(e) => setAttendanceForm({ geofence_radius_meters: Number(e.target.value) })} />
                </div>
                <Button onClick={() => saveSettings(attendanceForm, "Attendance")} disabled={isSaving("Attendance")}>
                  {isSaving("Attendance") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Program Categories</CardTitle>
                  <CardDescription>Manage dynamic taxonomy for programs</CardDescription>
                </div>
                <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Category</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Category</DialogTitle>
                      <DialogDescription>Create a new program category</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Software Development" />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug (auto-generated if blank)</Label>
                        <Input value={catForm.slug} onChange={(e) => setCatForm((p) => ({ ...p, slug: e.target.value }))} placeholder="software-development" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={catForm.description} onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))} />
                      </div>
                      <Button onClick={() => createCategoryMutation.mutate(catForm)} disabled={createCategoryMutation.isPending || !catForm.name}>
                        {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingCategories ? (
                  <p className="text-muted-foreground py-4 text-center">Loading...</p>
                ) : categories.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">No categories yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                          <TableCell><Badge variant={cat.is_active ? "default" : "secondary"}>{cat.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("Delete this category?")) deleteCategoryMutation.mutate(cat.id); }}><Trash2 className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certifications */}
          <TabsContent value="certifications">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Industry Certifications</CardTitle>
                  <CardDescription>Manage certifications directory</CardDescription>
                </div>
                <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Certification</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Certification</DialogTitle>
                      <DialogDescription>Add a new industry certification</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={certForm.name} onChange={(e) => setCertForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. CompTIA A+" />
                      </div>
                      <div className="space-y-2">
                        <Label>Provider</Label>
                        <Input value={certForm.provider} onChange={(e) => setCertForm((p) => ({ ...p, provider: e.target.value }))} placeholder="e.g. CompTIA" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={certForm.description} onChange={(e) => setCertForm((p) => ({ ...p, description: e.target.value }))} />
                      </div>
                      <Button onClick={() => createCertMutation.mutate(certForm)} disabled={createCertMutation.isPending || !certForm.name}>
                        {createCertMutation.isPending ? "Creating..." : "Create Certification"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingCerts ? (
                  <p className="text-muted-foreground py-4 text-center">Loading...</p>
                ) : certifications.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">No certifications yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certifications.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium">{cert.name}</TableCell>
                          <TableCell className="text-muted-foreground">{cert.provider || "—"}</TableCell>
                          <TableCell><Badge variant={cert.is_active ? "default" : "secondary"}>{cert.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("Delete this certification?")) deleteCertMutation.mutate(cert.id); }}><Trash2 className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Plans */}
          <TabsContent value="payment-plans">
            <Card>
              <CardHeader>
                <CardTitle>Payment Plans</CardTitle>
                <CardDescription>Configure installment payment options for student enrollment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Minimum First Payment Percentage (%)</Label>
                  <p className="text-sm text-muted-foreground">
                    When students choose installment plans, the first payment must be at least this percentage of the total fee.
                  </p>
                  <Input
                    type="number"
                    min={10}
                    max={90}
                    value={paymentForm.partial_payment_percentage}
                    onChange={(e) => setPaymentForm({ partial_payment_percentage: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: If set to 50%, a ₦100,000 program requires at least ₦50,000 as the first installment.
                  </p>
                </div>
                <Button onClick={() => saveSettings(paymentForm, "Payment Plans")} disabled={isSaving("Payment Plans")}>
                  {isSaving("Payment Plans") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Account */}
          <TabsContent value="bank-account">
            <Card>
              <CardHeader>
                <CardTitle>Bank Account & Payment Instructions</CardTitle>
                <CardDescription>Configure the bank account details shown to students for transfer payments (registration fee, tuition, etc.)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={bankForm.bank_name}
                    onChange={(e) => setBankForm((p) => ({ ...p, bank_name: e.target.value }))}
                    placeholder="e.g. First Bank of Nigeria"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={bankForm.bank_account_number}
                    onChange={(e) => setBankForm((p) => ({ ...p, bank_account_number: e.target.value }))}
                    placeholder="e.g. 0123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    value={bankForm.bank_account_name}
                    onChange={(e) => setBankForm((p) => ({ ...p, bank_account_name: e.target.value }))}
                    placeholder="e.g. Meranos ICT Training Academy"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Instructions / Narration</Label>
                  <Textarea
                    value={bankForm.payment_instructions}
                    onChange={(e) => setBankForm((p) => ({ ...p, payment_instructions: e.target.value }))}
                    placeholder="e.g. Please use your full name and program as narration when making transfer."
                    rows={4}
                  />
                </div>
                <Button onClick={() => saveSettings(bankForm, "Bank Account")} disabled={isSaving("Bank Account")}>
                  {isSaving("Bank Account") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
