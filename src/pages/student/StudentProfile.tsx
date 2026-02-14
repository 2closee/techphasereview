import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Save, Upload, Camera, IdCard, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function StudentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', bio: '', avatar_url: '' });
  const [matriculationNumber, setMatriculationNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch profile and registration in parallel
      const [profileRes, regRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_registrations').select('matriculation_number').eq('user_id', user.id).limit(1).maybeSingle(),
      ]);

      if (profileRes.data) {
        setProfile({
          full_name: profileRes.data.full_name || '',
          email: profileRes.data.email || '',
          phone: profileRes.data.phone || '',
          bio: profileRes.data.bio || '',
          avatar_url: profileRes.data.avatar_url || '',
        });
        if (profileRes.data.avatar_url) {
          setPhotoUrl(profileRes.data.avatar_url);
        }
      }

      if (regRes.data?.matriculation_number) {
        setMatriculationNumber(regRes.data.matriculation_number);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Photo must be under 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const filePath = `${user.id}/passport.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('passport-photos')
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('passport-photos').getPublicUrl(filePath);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id);

    if (updateError) {
      toast({ title: 'Error', description: 'Photo uploaded but failed to update profile', variant: 'destructive' });
    } else {
      setPhotoUrl(publicUrl);
      setProfile(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast({ title: 'Success', description: 'Passport photo updated' });
    }

    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio,
    }).eq('id', user.id);

    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Success', description: 'Profile updated' });
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const initials = profile.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST';

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-2xl space-y-6">
        {/* Student ID Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Passport Photo */}
              <div className="relative group">
                <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
                  {photoUrl ? (
                    <AvatarImage src={photoUrl} alt="Passport photo" className="object-cover" />
                  ) : null}
                  <AvatarFallback className="text-2xl font-bold bg-muted">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Student Info */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h2 className="text-xl font-bold text-foreground">{profile.full_name || 'Student'}</h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>

                <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                  <IdCard className="w-4 h-4 text-primary" />
                  {matriculationNumber ? (
                    <Badge variant="secondary" className="font-mono text-sm tracking-wider">
                      {matriculationNumber}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Mat. No. Pending
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-2"
                >
                  {uploading ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Uploading...</>
                  ) : (
                    <><Upload className="w-3 h-3 mr-1" />{photoUrl ? 'Change Photo' : 'Upload Photo'}</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
