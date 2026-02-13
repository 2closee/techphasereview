import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function TeacherProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', bio: '', specialization: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile({ full_name: data.full_name || '', email: data.email || '', phone: data.phone || '', bio: data.bio || '', specialization: data.specialization || '' });
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(profile).eq('id', user.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Success', description: 'Profile updated' });
    setSaving(false);
  };

  if (loading) return <DashboardLayout title="Profile"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="My Profile">
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Specialization</Label><Input value={profile.specialization} onChange={e => setProfile({ ...profile, specialization: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Bio</Label><Textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3} /></div>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
