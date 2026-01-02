import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapPin, Clock, Users, CheckCircle, XCircle, Loader2, Navigation, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isToday, isFuture } from 'date-fns';

interface Session {
  id: string;
  title: string;
  description: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  max_attendees: number;
  is_cancelled: boolean;
  programs?: { name: string };
  training_locations?: { 
    name: string; 
    code: string; 
    city: string; 
    latitude: number;
    longitude: number;
    geofence_radius_meters: number;
  };
  teachers?: { first_name: string; last_name: string } | null;
  session_enrollments?: { status: string }[];
}

interface StudentRegistration {
  id: string;
  first_name: string;
  last_name: string;
  program_id: string;
}

export default function StudentCheckIn() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  // Get student registration
  const { data: studentReg } = useQuery({
    queryKey: ['student-registration', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('student_registrations')
        .select('id, first_name, last_name, program_id')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as StudentRegistration;
    },
    enabled: !!user?.id,
  });

  // Fetch today's sessions for student's program
  const { data: todaySessions = [], isLoading } = useQuery({
    queryKey: ['student-sessions-today', studentReg?.program_id],
    queryFn: async () => {
      if (!studentReg?.program_id) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          *,
          programs(name),
          training_locations(name, code, city, latitude, longitude, geofence_radius_meters),
          teachers(first_name, last_name),
          session_enrollments(status)
        `)
        .eq('program_id', studentReg.program_id)
        .eq('session_date', today)
        .eq('is_cancelled', false)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as Session[];
    },
    enabled: !!studentReg?.program_id,
  });

  // Check if already checked in
  const { data: existingCheckins = [] } = useQuery({
    queryKey: ['my-checkins-today', studentReg?.id],
    queryFn: async () => {
      if (!studentReg?.id) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('geolocation_checkins')
        .select('session_id, verification_status')
        .eq('student_id', studentReg.id)
        .gte('check_in_time', `${today}T00:00:00`)
        .lte('check_in_time', `${today}T23:59:59`);
      return data || [];
    },
    enabled: !!studentReg?.id,
  });

  // Get current location
  const getCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ sessionId, location }: { sessionId: string; location: { lat: number; lng: number } }) => {
      if (!studentReg?.id) throw new Error('Student not found');
      
      const session = todaySessions.find(s => s.id === sessionId);
      if (!session?.training_locations) throw new Error('Session location not found');
      
      const distance = calculateDistance(
        location.lat,
        location.lng,
        session.training_locations.latitude,
        session.training_locations.longitude
      );
      
      const isWithinGeofence = distance <= session.training_locations.geofence_radius_meters;
      
      const { error } = await supabase.from('geolocation_checkins').insert({
        session_id: sessionId,
        student_id: studentReg.id,
        latitude: location.lat,
        longitude: location.lng,
        distance_from_center_meters: Math.round(distance * 100) / 100,
        is_within_geofence: isWithinGeofence,
        verification_status: isWithinGeofence ? 'verified' : 'pending',
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
        user_agent: navigator.userAgent,
      });
      
      if (error) throw error;
      return { isWithinGeofence, distance };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['my-checkins-today'] });
      if (result.isWithinGeofence) {
        toast({ title: 'Check-in Successful!', description: 'Your attendance has been recorded.' });
      } else {
        toast({ 
          title: 'Check-in Pending', 
          description: `You are ${Math.round(result.distance)}m away from the training center. Your check-in requires manual verification.`,
          variant: 'destructive'
        });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleCheckIn = async (sessionId: string) => {
    if (!currentLocation) {
      getCurrentLocation();
      toast({ title: 'Getting Location', description: 'Please wait while we get your location...' });
      return;
    }
    
    setCheckingIn(sessionId);
    await checkInMutation.mutateAsync({ sessionId, location: currentLocation });
    setCheckingIn(null);
  };

  const getCheckinStatus = (sessionId: string) => {
    return existingCheckins.find(c => c.session_id === sessionId);
  };

  return (
    <DashboardLayout title="Session Check-In">
      <div className="space-y-6">
        {/* Location Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${currentLocation ? 'bg-green-100' : 'bg-muted'}`}>
                  <Navigation className={`w-5 h-5 ${currentLocation ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium">
                    {currentLocation ? 'Location Enabled' : 'Location Required'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentLocation 
                      ? `Lat: ${currentLocation.lat.toFixed(4)}, Lng: ${currentLocation.lng.toFixed(4)}`
                      : 'Enable location to check in to sessions'
                    }
                  </p>
                </div>
              </div>
              <Button 
                variant={currentLocation ? 'outline' : 'default'}
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className={!currentLocation ? 'bg-gradient-primary' : ''}
              >
                {gettingLocation ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Getting...</>
                ) : currentLocation ? 'Refresh Location' : 'Enable Location'}
              </Button>
            </div>
            {locationError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Location Error</AlertTitle>
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Today's Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Sessions</CardTitle>
            <CardDescription>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : todaySessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sessions scheduled for today
              </div>
            ) : (
              <div className="space-y-4">
                {todaySessions.map(session => {
                  const checkin = getCheckinStatus(session.id);
                  const isCheckedIn = !!checkin;
                  
                  return (
                    <div 
                      key={session.id} 
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{session.title}</h4>
                            {isCheckedIn && (
                              <Badge variant={checkin.verification_status === 'verified' ? 'default' : 'secondary'}>
                                {checkin.verification_status === 'verified' ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" />Verified</>
                                ) : (
                                  <>Pending Review</>
                                )}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {session.training_locations?.name}
                            </span>
                          </div>
                          {session.description && (
                            <p className="text-sm text-muted-foreground mt-2">{session.description}</p>
                          )}
                        </div>
                        <div>
                          {isCheckedIn ? (
                            <Button variant="outline" disabled>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Checked In
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleCheckIn(session.id)}
                              disabled={checkingIn === session.id || !currentLocation}
                              className="bg-gradient-primary"
                            >
                              {checkingIn === session.id ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking In...</>
                              ) : (
                                'Check In'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Check-In Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                Enable location access when prompted by your browser
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                Be within 150 meters of the training center for automatic verification
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                If you're outside the geofence, your check-in will require manual approval
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">4.</span>
                Check-in is recorded with your location and device information
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}