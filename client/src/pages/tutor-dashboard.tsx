import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, LogOut, Loader2, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Availability } from '@shared/schema';

export default function TutorDashboard() {
  const { user, tutorProfile, userRole, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Direct Google sign-in handler with error feedback
  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      toast({
        title: 'Configuration Error',
        description: 'Google sign-in is not configured. Please contact the administrator.',
        variant: 'destructive',
      });
      return;
    }

    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/tutor-dashboard`,
        },
      });
      
      if (error) {
        console.error('Google sign-in error:', error);
        toast({
          title: 'Sign In Failed',
          description: error.message || 'Could not connect to Google. Please try again.',
          variant: 'destructive',
        });
        setIsSigningIn(false);
      }
      // If no error, the browser will redirect to Google
    } catch (err) {
      console.error('Unexpected error during sign-in:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setIsSigningIn(false);
    }
  };

  const [availabilityForm, setAvailabilityForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const { data: availabilities = [], isLoading: loadingAvailabilities } = useQuery<Availability[]>({
    queryKey: ['/api/availability/tutor', tutorProfile?.id],
    enabled: !!tutorProfile?.id,
  });

  const addAvailabilityMutation = useMutation({
    mutationFn: async (data: typeof availabilityForm) => {
      return apiRequest('POST', '/api/availability', {
        tutorId: tutorProfile?.id,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      toast({ title: 'Time Slot Added', description: 'Your available time slot has been added.' });
      queryClient.invalidateQueries({ queryKey: ['/api/availability/tutor', tutorProfile?.id] });
      setAvailabilityForm({ date: '', startTime: '', endTime: '', notes: '' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add time slot.', variant: 'destructive' });
    },
  });

  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/availability/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Time Slot Removed', description: 'The time slot has been removed.' });
      queryClient.invalidateQueries({ queryKey: ['/api/availability/tutor', tutorProfile?.id] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove time slot.', variant: 'destructive' });
    },
  });

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Checking your account...</p>
        </div>
      </div>
    );
  }

  // Show sign-in screen if not logged in as tutor
  if (!user || userRole !== 'tutor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--brand-blue))' }}>
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Tutor Sign In</CardTitle>
            <CardDescription>
              Sign in with your registered tutor email to manage your availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGoogleSignIn} 
              className="w-full gap-2"
              variant="outline"
              disabled={isSigningIn}
              data-testid="button-tutor-google-signin"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <SiGoogle className="h-4 w-4" />
                  Continue with Google
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Only registered tutor emails can access this page. Contact the administrator if you need access.
            </p>
            <div className="pt-2 border-t">
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setLocation('/')} 
                data-testid="button-go-home"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main availability management page for signed-in tutors
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--brand-blue))' }}>
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold" data-testid="text-tutor-name">
                {tutorProfile?.fullName || 'Tutor'}
              </h1>
              <p className="text-sm text-muted-foreground">{tutorProfile?.email}</p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleSignOut} data-testid="button-tutor-signout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Add Availability Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Available Time Slot
            </CardTitle>
            <CardDescription>
              Set the times when you're available for tutoring sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="avail-date">Date</Label>
                <Input
                  id="avail-date"
                  type="date"
                  value={availabilityForm.date}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, date: e.target.value })}
                  data-testid="input-avail-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avail-start">Start Time</Label>
                <Input
                  id="avail-start"
                  type="time"
                  value={availabilityForm.startTime}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, startTime: e.target.value })}
                  data-testid="input-avail-start"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avail-end">End Time</Label>
                <Input
                  id="avail-end"
                  type="time"
                  value={availabilityForm.endTime}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, endTime: e.target.value })}
                  data-testid="input-avail-end"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avail-notes">Notes (optional)</Label>
                <Input
                  id="avail-notes"
                  placeholder="e.g., Math only"
                  value={availabilityForm.notes}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, notes: e.target.value })}
                  data-testid="input-avail-notes"
                />
              </div>
            </div>

            <Button 
              onClick={() => addAvailabilityMutation.mutate(availabilityForm)}
              disabled={addAvailabilityMutation.isPending || !availabilityForm.date || !availabilityForm.startTime || !availabilityForm.endTime}
              className="w-full sm:w-auto"
              data-testid="button-add-availability"
            >
              {addAvailabilityMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Time Slot
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Your Available Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Your Available Time Slots
            </CardTitle>
            <CardDescription>
              Students can book these time slots for tutoring sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAvailabilities ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availabilities.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No time slots added yet. Add your first available slot above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availabilities.map((slot) => (
                  <div 
                    key={slot.id} 
                    className="flex items-center justify-between p-4 rounded-lg border"
                    data-testid={`availability-slot-${slot.id}`}
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{slot.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                      {slot.notes && (
                        <Badge variant="secondary">{slot.notes}</Badge>
                      )}
                      {slot.isBooked && (
                        <Badge variant="default" className="bg-green-600">Booked</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAvailabilityMutation.mutate(slot.id)}
                      disabled={deleteAvailabilityMutation.isPending || !!slot.isBooked}
                      data-testid={`button-delete-slot-${slot.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
