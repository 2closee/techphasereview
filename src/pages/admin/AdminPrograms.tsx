import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ChefHat, Scissors, BookOpen, Loader2 } from 'lucide-react';
import { z } from 'zod';

const programSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().max(1000).optional(),
  category: z.enum(['culinary', 'fashion']),
  duration: z.string().min(1, 'Duration is required'),
  duration_unit: z.enum(['weeks', 'months', 'years']),
  tuition_fee: z.number().min(0, 'Fee must be positive'),
  registration_fee: z.number().min(0).optional(),
  max_students: z.number().min(1).optional(),
  is_active: z.boolean(),
});

type Program = {
  id: string;
  name: string;
  description: string | null;
  category: 'culinary' | 'fashion';
  duration: string;
  duration_unit: string;
  tuition_fee: number;
  registration_fee: number | null;
  is_active: boolean;
  max_students: number | null;
  start_date: string | null;
  created_at: string;
};

type ProgramFormData = z.infer<typeof programSchema>;

const defaultFormData: ProgramFormData = {
  name: '',
  description: '',
  category: 'culinary',
  duration: '',
  duration_unit: 'months',
  tuition_fee: 0,
  registration_fee: 0,
  max_students: undefined,
  is_active: true,
};

export default function AdminPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState<ProgramFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load programs');
    } else {
      setPrograms((data || []) as Program[]);
    }
    setLoading(false);
  };

  const handleOpenDialog = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        name: program.name,
        description: program.description || '',
        category: program.category,
        duration: program.duration,
        duration_unit: program.duration_unit as 'weeks' | 'months' | 'years',
        tuition_fee: program.tuition_fee,
        registration_fee: program.registration_fee || 0,
        max_students: program.max_students || undefined,
        is_active: program.is_active,
      });
    } else {
      setEditingProgram(null);
      setFormData(defaultFormData);
    }
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = programSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);

    const payload = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      duration: formData.duration,
      duration_unit: formData.duration_unit,
      tuition_fee: formData.tuition_fee,
      registration_fee: formData.registration_fee || null,
      max_students: formData.max_students || null,
      is_active: formData.is_active,
    };

    if (editingProgram) {
      const { error } = await supabase
        .from('programs')
        .update(payload)
        .eq('id', editingProgram.id);

      if (error) {
        toast.error('Failed to update program');
      } else {
        toast.success('Program updated successfully');
        setDialogOpen(false);
        fetchPrograms();
      }
    } else {
      const { error } = await supabase
        .from('programs')
        .insert(payload);

      if (error) {
        toast.error('Failed to create program');
      } else {
        toast.success('Program created successfully');
        setDialogOpen(false);
        fetchPrograms();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete program');
    } else {
      toast.success('Program deleted');
      fetchPrograms();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout title="Programs Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-muted-foreground">Manage culinary and fashion programs</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProgram ? 'Edit Program' : 'Create New Program'}</DialogTitle>
                <DialogDescription>
                  {editingProgram ? 'Update program details' : 'Add a new course to the institute'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Program Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Professional Pastry & Baking"
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: 'culinary' | 'fashion') => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="culinary">
                          <span className="flex items-center gap-2">
                            <ChefHat className="w-4 h-4" /> Culinary
                          </span>
                        </SelectItem>
                        <SelectItem value="fashion">
                          <span className="flex items-center gap-2">
                            <Scissors className="w-4 h-4" /> Fashion
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration *</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 6"
                        className="flex-1"
                      />
                      <Select
                        value={formData.duration_unit}
                        onValueChange={(value: 'weeks' | 'months' | 'years') => setFormData({ ...formData, duration_unit: value })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tuition_fee">Tuition Fee (₦) *</Label>
                    <Input
                      id="tuition_fee"
                      type="number"
                      value={formData.tuition_fee}
                      onChange={(e) => setFormData({ ...formData, tuition_fee: Number(e.target.value) })}
                      placeholder="e.g., 250000"
                    />
                    {errors.tuition_fee && <p className="text-sm text-destructive">{errors.tuition_fee}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration_fee">Registration Fee (₦)</Label>
                    <Input
                      id="registration_fee"
                      type="number"
                      value={formData.registration_fee || ''}
                      onChange={(e) => setFormData({ ...formData, registration_fee: Number(e.target.value) })}
                      placeholder="e.g., 10000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_students">Max Students</Label>
                    <Input
                      id="max_students"
                      type="number"
                      value={formData.max_students || ''}
                      onChange={(e) => setFormData({ ...formData, max_students: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g., 20"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active (visible to students)</Label>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the program..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gold" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingProgram ? 'Update Program' : 'Create Program'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : programs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Programs Yet</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first program</p>
              <Button variant="gold" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Program
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <Card key={program.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {program.category === 'culinary' ? (
                        <ChefHat className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Scissors className="w-5 h-5 text-pink-500" />
                      )}
                      <Badge variant={program.is_active ? 'default' : 'secondary'}>
                        {program.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(program)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(program.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{program.name}</CardTitle>
                  <CardDescription className="capitalize">{program.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{program.duration} {program.duration_unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tuition</span>
                      <span className="font-medium text-primary">{formatCurrency(program.tuition_fee)}</span>
                    </div>
                    {program.registration_fee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registration</span>
                        <span className="font-medium">{formatCurrency(program.registration_fee)}</span>
                      </div>
                    )}
                    {program.max_students && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Students</span>
                        <span className="font-medium">{program.max_students}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
