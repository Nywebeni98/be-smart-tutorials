import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, LogOut, Loader2, GraduationCap, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Availability, TutorProfile } from '@shared/schema';

export default function TutorDashboard() {
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [tutorToken, setTutorToken] = useState<string | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [availabilityForm, setAvailabilityForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  useEffect(() => {
    const savedToken = sessionStorage.getItem('tutorToken');
    if (savedToken) {
      setTutorToken(savedToken);
      fetchTutorProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTutorProfile = async (token: string) => {
    try {
      const response = await fetch('/api/tutor/profile', {
        headers: {
          'x-tutor-token': token,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTutorProfile(data.tutor);
        setTutorToken(token);
      } else {
        sessionStorage.removeItem('tutorToken');
        setTutorToken(null);
        setTutorProfile(null);
      }
    } catch (error) {
      console.error('Error fetching tutor profile:', error);
      sessionStorage.removeItem('tutorToken');
      setTutorToken(null);
      setTutorProfile(null);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    
    try {
      const response = await fetch('/api/tutor/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        sessionStorage.setItem('tutorToken', data.token);
        setTutorToken(data.token);
        await fetchTutorProfile(data.token);
        toast({
          title: 'Welcome!',
          description: `Signed in as ${data.tutor.fullName}`,
        });
      } else {
        toast({
          title: 'Sign In Failed',
          description: data.message || 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
    
    setIsSigningIn(false);
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/tutor/logout', {
        method: 'POST',
        headers: {
          'x-tutor-token': tutorToken || '',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    sessionStorage.removeItem('tutorToken');
    setTutorToken(null);
    setTutorProfile(null);
    setLoginForm({ email: '', password: '' });
  };

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

  if (!tutorToken || !tutorProfile) {
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
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  data-testid="input-tutor-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    className="pr-10"
                    data-testid="input-tutor-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full"
                disabled={isSigningIn}
                style={{ 
                  backgroundColor: 'hsl(var(--brand-blue))',
                  color: 'white'
                }}
                data-testid="button-tutor-signin"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Only registered tutor emails can access this page. Contact the administrator if you need access.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
