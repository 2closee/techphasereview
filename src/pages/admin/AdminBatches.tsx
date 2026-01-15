import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, GraduationCap, MapPin, ChevronDown, ChevronUp, Loader2, Play, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Program {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  city: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  payment_status: string;
  created_at: string;
  matriculation_number: string | null;
}

interface Batch {
  id: string;
  program_id: string;
  location_id: string;
  batch_number: number;
  max_students: number;
  current_count: number;
  status: string;
  start_date: string | null;
  created_at: string;
  program?: Program;
  location?: Location;
  students?: Student[];
}

const statusColors: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  full: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  completed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  full: 'Full',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function AdminBatches() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [studentsLoading, setStudentsLoading] = useState<string | null>(null);
  
  // Filters
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch batches with program and location info
      const { data: batchesData, error: batchesError } = await supabase
        .from('course_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;

      // Fetch programs
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, name')
        .eq('is_active', true);

      if (programsError) throw programsError;

      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('training_locations')
        .select('id, name, city')
        .eq('is_active', true);

      if (locationsError) throw locationsError;

      // Map program and location data to batches
      const enrichedBatches = (batchesData || []).map(batch => ({
        ...batch,
        program: programsData?.find(p => p.id === batch.program_id),
        location: locationsData?.find(l => l.id === batch.location_id),
      }));

      setBatches(enrichedBatches);
      setPrograms(programsData || []);
      setLocations(locationsData || []);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForBatch = async (batchId: string) => {
    setStudentsLoading(batchId);
    try {
      const { data, error } = await supabase
        .from('student_registrations')
        .select('id, first_name, last_name, email, phone, payment_status, created_at, matriculation_number')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setBatches(prev => prev.map(batch => 
        batch.id === batchId ? { ...batch, students: data || [] } : batch
      ));
    } catch (error: any) {
      toast({
        title: 'Error loading students',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setStudentsLoading(null);
    }
  };

  const toggleBatchExpand = async (batchId: string) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
    } else {
      setExpandedBatch(batchId);
      const batch = batches.find(b => b.id === batchId);
      if (!batch?.students) {
        await fetchStudentsForBatch(batchId);
      }
    }
  };

  const openEditDialog = (batch: Batch) => {
    setEditingBatch(batch);
    setEditStartDate(batch.start_date || '');
    setEditStatus(batch.status);
    setEditDialogOpen(true);
  };

  const handleSaveBatch = async () => {
    if (!editingBatch) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('course_batches')
        .update({
          start_date: editStartDate || null,
          status: editStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBatch.id);

      if (error) throw error;

      toast({
        title: 'Batch updated',
        description: `Batch ${editingBatch.batch_number} has been updated successfully.`,
      });

      setEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error updating batch',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter batches
  const filteredBatches = batches.filter(batch => {
    if (selectedProgram !== 'all' && batch.program_id !== selectedProgram) return false;
    if (selectedLocation !== 'all' && batch.location_id !== selectedLocation) return false;
    if (selectedStatus !== 'all' && batch.status !== selectedStatus) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: batches.length,
    open: batches.filter(b => b.status === 'open').length,
    full: batches.filter(b => b.status === 'full').length,
    inProgress: batches.filter(b => b.status === 'in_progress').length,
    completed: batches.filter(b => b.status === 'completed').length,
    totalStudents: batches.reduce((acc, b) => acc + b.current_count, 0),
  };

  return (
    <DashboardLayout title="Batch Management">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Batch Management</h1>
          <p className="text-muted-foreground mt-1">View and manage course batches at Warri Training Center</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Batches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.open}</p>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.full}</p>
                  <p className="text-xs text-muted-foreground">Full</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Play className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map(program => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batches List */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Course Batches</CardTitle>
            <CardDescription>
              {filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No batches found</p>
                <p className="text-sm mt-1">Batches are automatically created when students register and pay at Warri.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBatches.map(batch => (
                  <div key={batch.id} className="border border-border rounded-lg overflow-hidden">
                    {/* Batch Header */}
                    <div 
                      className="flex items-center justify-between p-4 bg-card hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => toggleBatchExpand(batch.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">B{batch.batch_number}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Batch {batch.batch_number} - {batch.program?.name || 'Unknown Program'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {batch.location?.name || 'Unknown Location'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {batch.current_count}/{batch.max_students} students
                            </span>
                            {batch.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Starts {format(new Date(batch.start_date), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[batch.status]}>
                          {statusLabels[batch.status]}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(batch);
                          }}
                        >
                          Edit
                        </Button>
                        {expandedBatch === batch.id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Student List */}
                    {expandedBatch === batch.id && (
                      <div className="border-t border-border bg-secondary/30 p-4">
                        {studentsLoading === batch.id ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : batch.students && batch.students.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Enrolled</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batch.students.map((student, index) => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">{index + 1}</TableCell>
                                  <TableCell>
                                    {student.matriculation_number ? (
                                      <span className="font-mono text-primary font-semibold">
                                        {student.matriculation_number}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {student.first_name} {student.last_name}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {student.email}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {student.phone}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={student.payment_status === 'paid' ? 'default' : 'secondary'}
                                      className={student.payment_status === 'paid' ? 'bg-emerald-500' : ''}
                                    >
                                      {student.payment_status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {format(new Date(student.created_at), 'MMM d, yyyy')}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No students assigned to this batch yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch {editingBatch?.batch_number}</DialogTitle>
            <DialogDescription>
              Update the start date and status for this batch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start Date</label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                When will this batch begin training?
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open - Accepting students</SelectItem>
                  <SelectItem value="full">Full - Batch is complete</SelectItem>
                  <SelectItem value="in_progress">In Progress - Training started</SelectItem>
                  <SelectItem value="completed">Completed - Training finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBatch} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
