import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, LogOut, Loader2, GraduationCap, Plus, Trash2, Eye, EyeOff, Bell, Users, AlertCircle } from 'lucide-react';
import type { Availability, TutorProfile } from '@shared/schema';

interface UpcomingSession {
  id: string;
  studentName: string;
  studentEmail: string;
  subject: string | null;
  hours: number;
  sessionStartTime: string | null;
  sessionEndTime: string | null;
  meetingLink: string | null;
  hoursUntil: number | null;
  isWithin24Hours: boolean;
}

export default function TutorDashboard() {
  const [, setLocation] = useLocation();
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
    
    // Redirect to home page
    setLocation('/');
  };

  const { data: availabilities = [], isLoading: loadingAvailabilities } = useQuery<Availability[]>({
    queryKey: ['/api/availability/tutor', tutorProfile?.id],
    enabled: !!tutorProfile?.id,
  });

  // Fetch upcoming sessions for notifications
  const { data: upcomingSessionsData, isLoading: loadingUpcomingSessions } = useQuery<{ success: boolean; sessions: UpcomingSession[] }>({
    queryKey: ['/api/tutor/upcoming-sessions'],
    enabled: !!tutorToken,
    refetchInterval: 60000, // Refetch every minute
    queryFn: async () => {
      const response = await fetch('/api/tutor/upcoming-sessions', {
        headers: {
          'x-tutor-token': tutorToken || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
  });

  const upcomingSessions = upcomingSessionsData?.sessions || [];
  const urgentSessions = upcomingSessions.filter(s => s.isWithin24Hours);

  const addAvailabilityMutation = useMutation({
    mutationFn: async (data: typeof availabilityForm) => {
      // Parse date correctly - add 'T12:00:00' to avoid timezone issues
      const dateObj = new Date(data.date + 'T12:00:00');
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = days[dateObj.getDay()];
      
      const payload: Record<string, any> = {
        tutorId: tutorProfile?.id,
        day: day,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
      };
      
      // Only add notes if it has a value
      if (data.notes && data.notes.trim()) {
        payload.notes = data.notes.trim();
      }
      
      return apiRequest('POST', '/api/availability', payload);
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
                  autoComplete="email"
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
        {/* Upcoming Sessions Notifications */}
        {upcomingSessions.length > 0 && (
          <Card className="mb-6 border-2" style={{ borderColor: urgentSessions.length > 0 ? 'hsl(var(--brand-orange))' : 'hsl(var(--brand-blue))' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Upcoming Sessions
                {urgentSessions.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {urgentSessions.length} within 24 hours
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Your scheduled tutoring sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUpcomingSessions ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div 
                      key={session.id} 
                      className={`p-4 rounded-lg border ${session.isWithin24Hours ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' : 'bg-muted/50'}`}
                      data-testid={`session-notification-${session.id}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{session.studentName}</span>
                            {session.isWithin24Hours && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {session.hoursUntil}h away
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{session.studentEmail}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {session.sessionStartTime 
                                ? new Date(session.sessionStartTime).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium' })
                                : 'Date TBD'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {session.sessionStartTime 
                                ? new Date(session.sessionStartTime).toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg', timeStyle: 'short' })
                                : 'Time TBD'}
                            </span>
                            {session.subject && (
                              <Badge variant="secondary">{session.subject}</Badge>
                            )}
                          </div>
                        </div>
                        {session.meetingLink && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(session.meetingLink!, '_blank')}
                            data-testid={`button-join-session-${session.id}`}
                          >
                            Join Session
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
              Students can book these time slots for tutoring sessions (South Africa Time - SAST)
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
              <div className="space-y-6">
                {/* Group slots by date */}
                {Object.entries(
                  [...availabilities]
                    .sort((a, b) => {
                      // Sort by date first, then by start time
                      if (a.date !== b.date) {
                        return (a.date || '') < (b.date || '') ? -1 : 1;
                      }
                      return (a.startTime || '') < (b.startTime || '') ? -1 : 1;
                    })
                    .reduce((groups: Record<string, typeof availabilities>, slot) => {
                      const dateKey = slot.date || 'No Date';
                      if (!groups[dateKey]) groups[dateKey] = [];
                      groups[dateKey].push(slot);
                      return groups;
                    }, {})
                ).map(([date, slots]) => {
                  // Format the date nicely
                  const dateObj = date !== 'No Date' ? new Date(date + 'T12:00:00') : null;
                  const formattedDate = dateObj 
                    ? dateObj.toLocaleDateString('en-ZA', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        timeZone: 'Africa/Johannesburg'
                      })
                    : date;
                  
                  // Check if date is today or in the past
                  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' });
                  const isToday = date === today;
                  const isPast = date !== 'No Date' && date < today;
                  
                  return (
                    <div key={date} className="space-y-2" data-testid={`date-group-${date}`}>
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{formattedDate}</span>
                        {isToday && (
                          <Badge variant="outline" className="border-blue-500 text-blue-600">Today</Badge>
                        )}
                        {isPast && (
                          <Badge variant="outline" className="border-gray-400 text-gray-500">Past</Badge>
                        )}
                      </div>
                      <div className="space-y-2 pl-6">
                        {slots.map((slot) => (
                          <div 
                            key={slot.id} 
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              slot.isBooked 
                                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                                : isPast 
                                  ? 'bg-gray-50 dark:bg-gray-900/20 opacity-60' 
                                  : ''
                            }`}
                            data-testid={`availability-slot-${slot.id}`}
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
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
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
