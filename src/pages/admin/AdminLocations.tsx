import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, MapPin, Loader2, Building, Grid3X3 } from 'lucide-react';
import { z } from 'zod';

const locationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofence_radius_meters: z.number().min(50).max(5000),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  is_active: z.boolean(),
});

type TrainingLocation = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
};

type Program = {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
};

type LocationProgram = {
  id: string;
  location_id: string;
  program_id: string;
  is_active: boolean;
};

type LocationFormData = z.infer<typeof locationSchema>;

const defaultFormData: LocationFormData = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  latitude: 0,
  longitude: 0,
  geofence_radius_meters: 150,
  phone: '',
  email: '',
  is_active: true,
};

export default function AdminLocations() {
  const [locations, setLocations] = useState<TrainingLocation[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [locationPrograms, setLocationPrograms] = useState<LocationProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<TrainingLocation | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingMatrix, setSavingMatrix] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [locationsResult, programsResult, locationProgramsResult] = await Promise.all([
      supabase
        .from('training_locations')
        .select('*')
        .order('name', { ascending: true }),
      supabase
        .from('programs')
        .select('id, name, category, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase
        .from('location_programs')
        .select('*')
    ]);
    
    if (locationsResult.error) {
      toast.error('Failed to load locations');
    } else {
      setLocations((locationsResult.data || []) as TrainingLocation[]);
    }

    if (programsResult.error) {
      toast.error('Failed to load programs');
    } else {
      setPrograms(programsResult.data || []);
    }

    if (locationProgramsResult.error) {
      toast.error('Failed to load assignments');
    } else {
      setLocationPrograms(locationProgramsResult.data || []);
    }

    setLoading(false);
  };

  const handleOpenDialog = (location?: TrainingLocation) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        code: location.code,
        address: location.address,
        city: location.city,
        state: location.state,
        latitude: location.latitude,
        longitude: location.longitude,
        geofence_radius_meters: location.geofence_radius_meters,
        phone: location.phone || '',
        email: location.email || '',
        is_active: location.is_active,
      });
    } else {
      setEditingLocation(null);
      setFormData(defaultFormData);
    }
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = locationSchema.safeParse(formData);
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
      code: formData.code.toUpperCase(),
      address: formData.address,
      city: formData.city,
      state: formData.state,
      latitude: formData.latitude,
      longitude: formData.longitude,
      geofence_radius_meters: formData.geofence_radius_meters,
      phone: formData.phone || null,
      email: formData.email || null,
      is_active: formData.is_active,
    };

    if (editingLocation) {
      const { error } = await supabase
        .from('training_locations')
        .update(payload)
        .eq('id', editingLocation.id);

      if (error) {
        toast.error('Failed to update location');
      } else {
        toast.success('Location updated successfully');
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('training_locations')
        .insert(payload);

      if (error) {
        if (error.code === '23505') {
          toast.error('A location with this code already exists. Please use a unique code.');
        } else {
          toast.error('Failed to create location: ' + error.message);
        }
      } else {
        toast.success('Location created successfully');
        setDialogOpen(false);
        fetchData();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location? This will also remove all program assignments.')) return;

    const { error } = await supabase
      .from('training_locations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete location');
    } else {
      toast.success('Location deleted');
      fetchData();
    }
  };

  const isProgramAssigned = (locationId: string, programId: string) => {
    return locationPrograms.some(
      lp => lp.location_id === locationId && lp.program_id === programId && lp.is_active
    );
  };

  const handleMatrixToggle = async (locationId: string, programId: string) => {
    setSavingMatrix(true);
    const existing = locationPrograms.find(
      lp => lp.location_id === locationId && lp.program_id === programId
    );

    try {
      if (existing) {
        // Remove assignment
        const { error } = await supabase
          .from('location_programs')
          .delete()
          .eq('id', existing.id);
        
        if (error) throw error;
        toast.success('Program removed from location');
      } else {
        // Add assignment
        const { error } = await supabase
          .from('location_programs')
          .insert({
            location_id: locationId,
            program_id: programId,
            is_active: true
          });
        
        if (error) throw error;
        toast.success('Program assigned to location');
      }
      
      fetchData();
    } catch (error) {
      console.error('Error toggling assignment:', error);
      toast.error('Failed to update assignment');
    } finally {
      setSavingMatrix(false);
    }
  };

  const getProgramCount = (locationId: string) => {
    return locationPrograms.filter(lp => lp.location_id === locationId && lp.is_active).length;
  };

  return (
    <DashboardLayout title="Training Locations">
      <div className="space-y-6">
        <Tabs defaultValue="locations" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Locations
              </TabsTrigger>
              <TabsTrigger value="matrix" className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Program Matrix
              </TabsTrigger>
            </TabsList>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingLocation ? 'Edit Location' : 'Add Training Location'}</DialogTitle>
                  <DialogDescription>
                    {editingLocation ? 'Update location details' : 'Add a new training center'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="name">Location Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Meranos Port Harcourt Center"
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g., PHC"
                        maxLength={10}
                      />
                      {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g., 274 Port Harcourt - Aba Expy"
                      />
                      {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g., Port Harcourt"
                      />
                      {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="e.g., Rivers"
                      />
                      {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude *</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 4.8156"
                      />
                      {errors.latitude && <p className="text-sm text-destructive">{errors.latitude}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude *</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 7.0498"
                      />
                      {errors.longitude && <p className="text-sm text-destructive">{errors.longitude}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="geofence_radius_meters">Geofence Radius (meters) *</Label>
                      <Input
                        id="geofence_radius_meters"
                        type="number"
                        value={formData.geofence_radius_meters}
                        onChange={(e) => setFormData({ ...formData, geofence_radius_meters: parseInt(e.target.value) || 150 })}
                        placeholder="e.g., 150"
                      />
                      {errors.geofence_radius_meters && <p className="text-sm text-destructive">{errors.geofence_radius_meters}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g., +234 803 000 0001"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g., portharcourt@meranos.ng"
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="gold" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingLocation ? 'Update Location' : 'Create Location'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Locations Tab */}
          <TabsContent value="locations">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : locations.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Training Locations</h3>
                  <p className="text-muted-foreground mb-4">Add your first training center to get started</p>
                  <Button variant="gold" onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {locations.map((location) => (
                  <Card key={location.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{location.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">{location.code}</Badge>
                          </div>
                        </div>
                        <Badge variant={location.is_active ? 'default' : 'secondary'}>
                          {location.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        <p>{location.address}</p>
                        <p>{location.city}, {location.state}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {location.phone && <span>📞 {location.phone}</span>}
                        {location.email && <span>✉️ {location.email}</span>}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">
                          {getProgramCount(location.id)} programs offered
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDialog(location)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(location.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Program Matrix Tab */}
          <TabsContent value="matrix">
            <Card>
              <CardHeader>
                <CardTitle>Program Assignment Matrix</CardTitle>
                <CardDescription>
                  Check or uncheck to assign programs to training locations. Changes are saved automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : locations.length === 0 || programs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {locations.length === 0 
                      ? 'Add training locations first' 
                      : 'Add programs first to assign them to locations'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px] bg-muted/50">Program</TableHead>
                          {locations.filter(l => l.is_active).map((location) => (
                            <TableHead 
                              key={location.id} 
                              className="text-center min-w-[120px] bg-muted/50"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-medium">{location.code}</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                  {location.city}
                                </span>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {programs.map((program) => (
                          <TableRow key={program.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={program.category === 'software' ? 'border-blue-500 text-blue-500' : 'border-orange-500 text-orange-500'}
                                >
                                  {program.category}
                                </Badge>
                                <span>{program.name}</span>
                              </div>
                            </TableCell>
                            {locations.filter(l => l.is_active).map((location) => (
                              <TableCell key={location.id} className="text-center">
                                <Checkbox
                                  checked={isProgramAssigned(location.id, program.id)}
                                  onCheckedChange={() => handleMatrixToggle(location.id, program.id)}
                                  disabled={savingMatrix}
                                  className="mx-auto"
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
