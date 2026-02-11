import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Search, Shield, UserCheck, Mail, Trash2, DollarSign, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type StaffRole = 'admin' | 'teacher' | 'accountant' | 'super_admin';

interface StaffMember {
  id: string;
  user_id: string;
  role: StaffRole;
  email: string | null;
  full_name: string | null;
  is_suspended: boolean;
}

const AdminStaff = () => {
  const queryClient = useQueryClient();
  const { session, role: currentRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "" as StaffRole | "",
  });

  const { data: staffMembers = [], isLoading: loadingStaff } = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .in("role", ["admin", "teacher", "accountant", "super_admin"]);

      if (error) throw error;

      const userIds = roles?.map(r => r.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_suspended")
        .in("id", userIds);

      if (profileError) throw profileError;

      return roles?.map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role as StaffRole,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          is_suspended: profile?.is_suspended || false,
        };
      }) || [];
    },
  });

  // Create staff via edge function
  const createStaffMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.role) throw new Error("Role is required");

      const { data: response, error } = await supabase.functions.invoke("create-staff", {
        body: { email: data.email, password: data.password, full_name: data.full_name, role: data.role },
      });

      if (error) throw error;
      if (response?.error) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      setIsAddOpen(false);
      resetForm();
      toast.success("Staff member created successfully. Account is active immediately.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Suspend/unsuspend via RPC
  const toggleSuspensionMutation = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const { error } = await supabase.rpc("toggle_user_suspension", {
        target_user_id: userId,
        suspend,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("User suspension updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Staff role removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => setFormData({ email: "", password: "", full_name: "", role: "" });

  const handleSubmit = () => {
    if (!formData.email || !formData.password || !formData.full_name || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    createStaffMutation.mutate(formData);
  };

  const filteredStaff = staffMembers.filter((member) => {
    const matchesSearch =
      (member.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (member.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <ShieldCheck className="h-3 w-3 mr-1" />;
      case 'admin': return <Shield className="h-3 w-3 mr-1" />;
      case 'accountant': return <DollarSign className="h-3 w-3 mr-1" />;
      default: return <UserCheck className="h-3 w-3 mr-1" />;
    }
  };

  const isSuperAdmin = currentRole === 'super_admin';

  return (
    <DashboardLayout title="Staff Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground">Manage staff accounts securely</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Add Staff Member</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>Create a staff account. The account will be active immediately (no email verification required).</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="staff@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min 6 characters" />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={(value: StaffRole) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin"><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Admin</div></SelectItem>
                      <SelectItem value="teacher"><div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-blue-500" />Teacher</div></SelectItem>
                      <SelectItem value="accountant"><div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500" />Accountant</div></SelectItem>
                      {isSuperAdmin && (
                        <SelectItem value="super_admin"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-500" />Super Admin</div></SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSubmit} disabled={createStaffMutation.isPending || !formData.email || !formData.password || !formData.full_name || !formData.role}>
                  {createStaffMutation.isPending ? "Creating..." : "Create Staff Account"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Staff</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{staffMembers.length}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Admins</CardTitle><Shield className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{staffMembers.filter(m => m.role === 'admin' || m.role === 'super_admin').length}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Teachers</CardTitle><UserCheck className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{staffMembers.filter(m => m.role === 'teacher').length}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Accountants</CardTitle><DollarSign className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{staffMembers.filter(m => m.role === 'accountant').length}</div></CardContent></Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="accountant">Accountants</SelectItem>
                  <SelectItem value="super_admin">Super Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {loadingStaff ? (
              <div className="text-center py-8 text-muted-foreground">Loading staff...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No staff members found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name || "—"}</TableCell>
                      <TableCell><div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" />{member.email || "—"}</div></TableCell>
                      <TableCell><Badge variant={member.role === "admin" || member.role === "super_admin" ? "default" : "secondary"} className="capitalize">{roleIcon(member.role)}{member.role.replace('_', ' ')}</Badge></TableCell>
                      <TableCell><Badge variant={member.is_suspended ? "destructive" : "outline"}>{member.is_suspended ? "Suspended" : "Active"}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        {isSuperAdmin && (
                          <Button variant="ghost" size="sm" onClick={() => toggleSuspensionMutation.mutate({ userId: member.user_id, suspend: !member.is_suspended })}>
                            {member.is_suspended ? "Unsuspend" : "Suspend"}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("Remove this staff member's role?")) removeRoleMutation.mutate(member.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminStaff;
