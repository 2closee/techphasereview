import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Search, Shield, UserCheck, UserX, Mail, Trash2 } from "lucide-react";

type AppRole = 'admin' | 'teacher';

interface StaffMember {
  id: string;
  user_id: string;
  role: AppRole;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

const AdminStaff = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "" as AppRole | "",
  });

  // Fetch staff members (admins and teachers from user_roles + profiles)
  const { data: staffMembers = [], isLoading: loadingStaff } = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role
        `)
        .in("role", ["admin", "teacher"]);

      if (error) throw error;

      // Fetch profiles for these users
      const userIds = roles?.map(r => r.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Combine data
      return roles?.map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role as AppRole,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          created_at: new Date().toISOString(), // We don't have this in user_roles
        };
      }) || [];
    },
  });

  // Create staff member mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.role) throw new Error("Role is required");

      // Create auth user with admin API (this requires service role, so we'll use signUp)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Failed to create user");

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          email: data.email,
          full_name: data.full_name,
        });

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: data.role,
        });

      if (roleError) throw roleError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      setIsAddOpen(false);
      resetForm();
      toast.success("Staff member created successfully. They will receive an email to verify their account.");
    },
    onError: (error: Error) => {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered");
      } else {
        toast.error(error.message);
      }
    },
  });

  // Remove staff member (just removes role, doesn't delete user)
  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Staff role removed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      full_name: "",
      role: "",
    });
  };

  const handleSubmit = async () => {
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

  const adminCount = staffMembers.filter((m) => m.role === "admin").length;
  const teacherCount = staffMembers.filter((m) => m.role === "teacher").length;

  return (
    <DashboardLayout title="Staff Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground">Manage admin and teacher accounts</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Create a new admin or teacher account. They will receive an email to verify their account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-blue-500" />
                          Teacher
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={createStaffMutation.isPending || !formData.email || !formData.password || !formData.full_name || !formData.role}
                >
                  {createStaffMutation.isPending ? "Creating..." : "Create Staff Account"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffMembers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{adminCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{teacherCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {member.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.role === "admin" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {member.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                          {member.role === "teacher" && <UserCheck className="h-3 w-3 mr-1" />}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this staff member's role?")) {
                              removeRoleMutation.mutate(member.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
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
