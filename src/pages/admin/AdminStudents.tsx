import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Loader2, Eye, CheckCircle, XCircle, Clock, ChefHat, Scissors, IdCard, MapPin } from 'lucide-react';
import { format } from 'date-fns';

type Registration = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  program_id: string | null;
  education_level: string | null;
  previous_experience: string | null;
  how_heard_about_us: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  status: string;
  created_at: string;
  matriculation_number: string | null;
  payment_status: string;
  programs: {
    name: string;
    category: string;
  } | null;
  training_locations: {
    name: string;
    city: string;
  } | null;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  reviewing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  enrolled: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export default function AdminStudents() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_registrations')
      .select(`
        *,
        programs (
          name,
          category
        ),
        training_locations:preferred_location_id (
          name,
          city
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load registrations');
    } else {
      setRegistrations(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from('student_registrations')
      .update({ 
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Application ${newStatus}`);
      fetchRegistrations();
      setSelectedRegistration(null);
    }
    setUpdating(false);
  };

  const filteredRegistrations = filterStatus === 'all'
    ? registrations
    : registrations.filter(r => r.status === filterStatus);

  const statusCounts = registrations.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout title="Student Registrations">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{registrations.length}</div>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('pending')}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('approved')}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{statusCounts.approved || 0}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('enrolled')}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{statusCounts.enrolled || 0}</div>
              <p className="text-sm text-muted-foreground">Enrolled</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('rejected')}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{statusCounts.rejected || 0}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Registrations List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Applications</h3>
              <p className="text-muted-foreground">No student applications found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Contact</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Program</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Applied</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-secondary/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{reg.first_name} {reg.last_name}</p>
                          {reg.matriculation_number && (
                            <p className="text-xs font-mono text-primary flex items-center gap-1 mt-0.5">
                              <IdCard className="w-3 h-3" />
                              {reg.matriculation_number}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-foreground">{reg.email}</p>
                          <p className="text-xs text-muted-foreground">{reg.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          {reg.programs ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {reg.programs.category === 'culinary' ? (
                                  <ChefHat className="w-4 h-4 text-orange-500" />
                                ) : (
                                  <Scissors className="w-4 h-4 text-pink-500" />
                                )}
                                <span className="text-sm">{reg.programs.name}</span>
                              </div>
                              {reg.training_locations && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {reg.training_locations.name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not selected</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {format(new Date(reg.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[reg.status]} variant="outline">
                            {reg.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRegistration(reg)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedRegistration && (
              <>
                <DialogHeader>
                  <DialogTitle>Application Details</DialogTitle>
                  <DialogDescription>
                    Submitted on {format(new Date(selectedRegistration.created_at), 'MMMM d, yyyy')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{selectedRegistration.first_name} {selectedRegistration.last_name}</h3>
                      <p className="text-muted-foreground">{selectedRegistration.email}</p>
                      {selectedRegistration.matriculation_number && (
                        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-primary/10 rounded-md w-fit">
                          <IdCard className="w-4 h-4 text-primary" />
                          <span className="text-sm font-mono font-semibold text-primary">
                            Student ID: {selectedRegistration.matriculation_number}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge className={statusColors[selectedRegistration.status]} variant="outline">
                      {selectedRegistration.status}
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedRegistration.phone}</p>
                    </div>
                    {selectedRegistration.date_of_birth && (
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">{format(new Date(selectedRegistration.date_of_birth), 'MMMM d, yyyy')}</p>
                      </div>
                    )}
                    {selectedRegistration.gender && (
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">{selectedRegistration.gender}</p>
                      </div>
                    )}
                    {selectedRegistration.address && (
                      <div className="sm:col-span-2">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">
                          {selectedRegistration.address}
                          {selectedRegistration.city && `, ${selectedRegistration.city}`}
                          {selectedRegistration.state && `, ${selectedRegistration.state}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedRegistration.programs && (
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Selected Program</p>
                      <div className="flex items-center gap-2">
                        {selectedRegistration.programs.category === 'culinary' ? (
                          <ChefHat className="w-5 h-5 text-orange-500" />
                        ) : (
                          <Scissors className="w-5 h-5 text-pink-500" />
                        )}
                        <span className="font-medium">{selectedRegistration.programs.name}</span>
                      </div>
                    </div>
                  )}

                  {selectedRegistration.education_level && (
                    <div>
                      <p className="text-sm text-muted-foreground">Education Level</p>
                      <p className="font-medium capitalize">{selectedRegistration.education_level.replace('_', ' ')}</p>
                    </div>
                  )}

                  {selectedRegistration.previous_experience && (
                    <div>
                      <p className="text-sm text-muted-foreground">Previous Experience</p>
                      <p>{selectedRegistration.previous_experience}</p>
                    </div>
                  )}

                  {(selectedRegistration.emergency_contact_name || selectedRegistration.emergency_contact_phone) && (
                    <div>
                      <p className="text-sm text-muted-foreground">Emergency Contact</p>
                      <p className="font-medium">
                        {selectedRegistration.emergency_contact_name}
                        {selectedRegistration.emergency_contact_phone && ` - ${selectedRegistration.emergency_contact_phone}`}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedRegistration.status !== 'enrolled' && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                      {selectedRegistration.status === 'pending' && (
                        <Button
                          variant="outline"
                          onClick={() => updateStatus(selectedRegistration.id, 'reviewing')}
                          disabled={updating}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Mark as Reviewing
                        </Button>
                      )}
                      {selectedRegistration.status !== 'approved' && selectedRegistration.status !== 'enrolled' && (
                        <Button
                          variant="gold"
                          onClick={() => updateStatus(selectedRegistration.id, 'approved')}
                          disabled={updating}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      )}
                      {selectedRegistration.status === 'approved' && (
                        <Button
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => updateStatus(selectedRegistration.id, 'enrolled')}
                          disabled={updating}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Mark as Enrolled
                        </Button>
                      )}
                      {selectedRegistration.status !== 'rejected' && (
                        <Button
                          variant="destructive"
                          onClick={() => updateStatus(selectedRegistration.id, 'rejected')}
                          disabled={updating}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
