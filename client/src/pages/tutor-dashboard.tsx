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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, Mail, Phone, Link2, DollarSign, BookOpen, LogOut, AlertCircle, CheckCircle, Loader2, GraduationCap } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import type { Availability, BookingPayment } from '@shared/schema';

export default function TutorDashboard() {
  const { user, tutorProfile, userRole, signOut, refreshTutorProfile, tutorSignInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [profileForm, setProfileForm] = useState({
    fullName: tutorProfile?.fullName || '',
    bio: tutorProfile?.bio || '',
    subjects: tutorProfile?.subjects?.join(', ') || '',
    hourlyRate: tutorProfile?.hourlyRate?.toString() || '200',
    googleMeetUrl: tutorProfile?.googleMeetUrl || '',
  });

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

  const { data: bookings = [], isLoading: loadingBookings } = useQuery<BookingPayment[]>({
    queryKey: ['/api/booking-payments/tutor', tutorProfile?.id],
    enabled: !!tutorProfile?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      return apiRequest('PATCH', `/api/tutor-profiles/${tutorProfile?.id}`, {
        fullName: data.fullName,
        bio: data.bio,
        subjects: data.subjects.split(',').map(s => s.trim()).filter(Boolean),
        hourlyRate: parseInt(data.hourlyRate) || 200,
        googleMeetUrl: data.googleMeetUrl,
      });
    },
    onSuccess: async () => {
      toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
      await refreshTutorProfile();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    },
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
      toast({ title: 'Availability Added', description: 'Your availability slot has been added.' });
      queryClient.invalidateQueries({ queryKey: ['/api/availability/tutor', tutorProfile?.id] });
      setAvailabilityForm({ date: '', startTime: '', endTime: '', notes: '' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add availability.', variant: 'destructive' });
    },
  });

  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/availability/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Slot Removed', description: 'Availability slot has been removed.' });
      queryClient.invalidateQueries({ queryKey: ['/api/availability/tutor', tutorProfile?.id] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove availability.', variant: 'destructive' });
    },
  });

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

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
              Sign in with your registered tutor email to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={tutorSignInWithGoogle} 
              className="w-full gap-2"
              variant="outline"
              data-testid="button-tutor-google-signin"
            >
              <SiGoogle className="h-4 w-4" />
              Continue with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Only registered tutor emails can access this dashboard. If you're not a tutor, please contact the administrator.
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold" data-testid="text-tutor-name">
                {tutorProfile?.fullName || 'Tutor Dashboard'}
              </h1>
              <p className="text-sm text-muted-foreground">{tutorProfile?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {tutorProfile?.isApproved ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Pending Approval
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={handleSignOut} data-testid="button-tutor-signout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!tutorProfile?.isApproved && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Account Pending Approval</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Your tutor account is awaiting admin approval. You can set up your profile while you wait.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="availability" data-testid="tab-availability">Availability</TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your tutor profile to help students find you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input
                      id="profile-name"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      data-testid="input-profile-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-rate">Hourly Rate (R)</Label>
                    <Input
                      id="profile-rate"
                      type="number"
                      value={profileForm.hourlyRate}
                      onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: e.target.value })}
                      data-testid="input-profile-rate"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-subjects">Subjects (comma-separated)</Label>
                  <Input
                    id="profile-subjects"
                    placeholder="Mathematics, Physical Sciences, English"
                    value={profileForm.subjects}
                    onChange={(e) => setProfileForm({ ...profileForm, subjects: e.target.value })}
                    data-testid="input-profile-subjects"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-bio">Bio</Label>
                  <Textarea
                    id="profile-bio"
                    placeholder="Tell students about your teaching experience and style..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="min-h-[100px]"
                    data-testid="input-profile-bio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-meet">Google Meet URL</Label>
                  <Input
                    id="profile-meet"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    value={profileForm.googleMeetUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, googleMeetUrl: e.target.value })}
                    data-testid="input-profile-meet"
                  />
                  <p className="text-xs text-muted-foreground">
                    This link will be shared with students after payment
                  </p>
                </div>

                <Button 
                  onClick={() => updateProfileMutation.mutate(profileForm)}
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Add Availability
                </CardTitle>
                <CardDescription>
                  Set your available time slots for tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
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
                  data-testid="button-add-availability"
                >
                  {addAvailabilityMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Availability'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Availability Slots</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAvailabilities ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : availabilities.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No availability slots set. Add your first slot above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {availabilities.map((slot) => (
                      <div 
                        key={slot.id} 
                        className="flex items-center justify-between p-3 rounded-lg border"
                        data-testid={`availability-slot-${slot.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{slot.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </div>
                          {slot.notes && (
                            <Badge variant="secondary">{slot.notes}</Badge>
                          )}
                          {slot.isBooked && (
                            <Badge variant="default">Booked</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAvailabilityMutation.mutate(slot.id)}
                          disabled={deleteAvailabilityMutation.isPending || !!slot.isBooked}
                          data-testid={`button-delete-slot-${slot.id}`}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Your Bookings
                </CardTitle>
                <CardDescription>
                  View and manage your tutoring session bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No bookings yet. Students can book sessions once you have availability slots set.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id} data-testid={`booking-card-${booking.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{booking.studentName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{booking.studentEmail}</span>
                              </div>
                              {booking.studentPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{booking.studentPhone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">R{booking.amount} for {booking.hours} hour(s)</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant={booking.paymentStatus === 'completed' ? 'default' : 'secondary'}
                                className={booking.paymentStatus === 'completed' ? 'bg-green-600' : ''}
                              >
                                {booking.paymentStatus === 'completed' ? 'Paid' : 'Pending Payment'}
                              </Badge>
                              {booking.meetingLink && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Link2 className="h-4 w-4" />
                                  <a 
                                    href={booking.meetingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    Meeting Link
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
