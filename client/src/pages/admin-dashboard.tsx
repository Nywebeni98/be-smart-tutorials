import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Users, BookOpen, DollarSign, ShieldCheck, LogOut, 
  CheckCircle, XCircle, Ban, UserCheck, Loader2, AlertCircle,
  Mail, Calendar, Clock, Plus, Trash2, CalendarDays
} from 'lucide-react';
import type { TutorProfile, BookingPayment, Pricing, Availability } from '@shared/schema';

// Featured tutors are now loaded from the database (tutorProfiles query)
// This ensures we use the correct database UUIDs for availability

export default function AdminDashboard() {
  const { isAdmin, adminSignOut, userRole, getAdminToken } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Availability management state
  const [addSlotDialogOpen, setAddSlotDialogOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState('');
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');
  const [slotNotes, setSlotNotes] = useState('');
  const [filterTutor, setFilterTutor] = useState('all');

  const { data: tutorProfiles = [], isLoading: loadingTutors } = useQuery<TutorProfile[]>({
    queryKey: ['/api/tutor-profiles'],
    enabled: isAdmin,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery<BookingPayment[]>({
    queryKey: ['/api/booking-payments'],
    enabled: isAdmin,
  });

  const { data: pricing = [], isLoading: loadingPricing } = useQuery<Pricing[]>({
    queryKey: ['/api/pricing'],
    enabled: isAdmin,
  });

  const { data: availabilities = [], isLoading: loadingAvailabilities } = useQuery<Availability[]>({
    queryKey: ['/api/availability'],
    enabled: isAdmin,
  });

  const approveTutorMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = getAdminToken();
      const response = await fetch(`/api/tutor-profiles/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-admin-token': token } : {}),
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to approve tutor');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Tutor Approved', description: 'The tutor has been approved successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutor-profiles'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to approve tutor.', variant: 'destructive' });
    },
  });

  const blockTutorMutation = useMutation({
    mutationFn: async ({ id, blocked }: { id: string; blocked: boolean }) => {
      const token = getAdminToken();
      const response = await fetch(`/api/tutor-profiles/${id}/block`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-admin-token': token } : {}),
        },
        body: JSON.stringify({ blocked }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update tutor status');
      }
      return response.json();
    },
    onSuccess: (_, { blocked }) => {
      toast({ 
        title: blocked ? 'Tutor Blocked' : 'Tutor Unblocked', 
        description: `The tutor has been ${blocked ? 'blocked' : 'unblocked'} successfully.` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tutor-profiles'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to update tutor status.', variant: 'destructive' });
    },
  });

  // Create availability slot mutation
  const createAvailabilityMutation = useMutation({
    mutationFn: async (data: { tutorId: string; day: string; date: string; startTime: string; endTime: string; notes?: string }) => {
      return apiRequest('POST', '/api/availability', data);
    },
    onSuccess: () => {
      toast({ title: 'Slot Added', description: 'Availability slot has been added successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
      setAddSlotDialogOpen(false);
      resetSlotForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to add availability slot.', variant: 'destructive' });
    },
  });

  // Delete availability slot mutation
  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/availability/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Slot Removed', description: 'Availability slot has been removed.' });
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to remove availability slot.', variant: 'destructive' });
    },
  });

  const resetSlotForm = () => {
    setSelectedTutor('');
    setSlotDate('');
    setSlotStartTime('');
    setSlotEndTime('');
    setSlotNotes('');
  };

  const handleAddSlot = () => {
    if (!selectedTutor || !slotDate || !slotStartTime || !slotEndTime) {
      toast({ title: 'Missing Information', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    const dateObj = new Date(slotDate);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = dateObj.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

    createAvailabilityMutation.mutate({
      tutorId: selectedTutor,
      day: dayName,
      date: formattedDate,
      startTime: slotStartTime,
      endTime: slotEndTime,
      notes: slotNotes || undefined,
    });
  };

  // Filter and sort availabilities
  const filteredAvailabilities = availabilities
    .filter(slot => filterTutor === 'all' || slot.tutorId === filterTutor)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date();
      const dateB = b.date ? new Date(b.date) : new Date();
      return dateA.getTime() - dateB.getTime();
    });

  const getTutorName = (tutorId: string) => {
    const tutor = tutorProfiles.find(t => t.id === tutorId);
    return tutor?.fullName || tutorId;
  };

  const handleSignOut = () => {
    adminSignOut();
    setLocation('/');
  };

  if (!isAdmin || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => setLocation('/')} data-testid="button-go-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingTutors = tutorProfiles.filter(t => !t.isApproved && !t.isBlocked);
  const approvedTutors = tutorProfiles.filter(t => t.isApproved && !t.isBlocked);
  const blockedTutors = tutorProfiles.filter(t => t.isBlocked);
  const completedBookings = bookings.filter(b => b.paymentStatus === 'completed');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold" data-testid="text-admin-title">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage tutors, bookings, and payments</p>
            </div>
          </div>
          
          <Button variant="ghost" onClick={handleSignOut} data-testid="button-admin-signout">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card data-testid="stat-total-tutors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tutors</p>
                  <p className="text-2xl font-bold">{tutorProfiles.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-pending-approval">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold">{pendingTutors.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-total-bookings">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-revenue">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">R{totalRevenue}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="availability" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="availability" data-testid="tab-availability">
              <CalendarDays className="h-4 w-4 mr-1" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="tutors" data-testid="tab-tutors">
              Tutors
              {pendingTutors.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {pendingTutors.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
            <TabsTrigger value="pricing" data-testid="tab-pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      Tutor Availability Management
                    </CardTitle>
                    <CardDescription>
                      Add and manage available time slots for tutors
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setAddSlotDialogOpen(true)}
                    data-testid="button-add-availability"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Slot
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="filter-tutor" className="text-sm">Filter by Tutor</Label>
                  <Select value={filterTutor} onValueChange={setFilterTutor}>
                    <SelectTrigger id="filter-tutor" className="w-full md:w-64 mt-1" data-testid="select-filter-tutor">
                      <SelectValue placeholder="All Tutors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tutors</SelectItem>
                      {approvedTutors.map((tutor) => (
                        <SelectItem key={tutor.id} value={tutor.id}>
                          {tutor.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loadingAvailabilities ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAvailabilities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No availability slots configured.</p>
                    <p className="text-sm">Click "Add Time Slot" to create availability for tutors.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAvailabilities.map((slot) => (
                      <Card 
                        key={slot.id} 
                        className={slot.isBooked ? 'opacity-60' : ''}
                        data-testid={`availability-slot-${slot.id}`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{getTutorName(slot.tutorId)}</Badge>
                                {slot.isBooked && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    Booked
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{slot.day}</span>
                                  {slot.date && <span className="text-muted-foreground">({slot.date})</span>}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{slot.startTime} - {slot.endTime}</span>
                                </div>
                              </div>
                              {slot.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{slot.notes}</p>
                              )}
                            </div>
                            {!slot.isBooked && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAvailabilityMutation.mutate(slot.id)}
                                disabled={deleteAvailabilityMutation.isPending}
                                data-testid={`button-delete-slot-${slot.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutors" className="space-y-6">
            {pendingTutors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Clock className="h-5 w-5" />
                    Pending Approval ({pendingTutors.length})
                  </CardTitle>
                  <CardDescription>
                    Review and approve new tutor applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTutors ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingTutors.map((tutor) => (
                        <Card key={tutor.id} data-testid={`pending-tutor-${tutor.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="space-y-1">
                                <p className="font-medium">{tutor.fullName}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  {tutor.email}
                                </div>
                                {tutor.subjects && tutor.subjects.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {tutor.subjects.map((subject, i) => (
                                      <Badge key={i} variant="secondary">{subject}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => approveTutorMutation.mutate(tutor.id)}
                                  disabled={approveTutorMutation.isPending}
                                  data-testid={`button-approve-${tutor.id}`}
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => blockTutorMutation.mutate({ id: tutor.id, blocked: true })}
                                  disabled={blockTutorMutation.isPending}
                                  data-testid={`button-block-${tutor.id}`}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Block
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Approved Tutors ({approvedTutors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTutors ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : approvedTutors.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No approved tutors yet.</p>
                ) : (
                  <div className="space-y-4">
                    {approvedTutors.map((tutor) => (
                      <Card key={tutor.id} data-testid={`approved-tutor-${tutor.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-medium">{tutor.fullName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                {tutor.email}
                              </div>
                              {tutor.subjects && tutor.subjects.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {tutor.subjects.map((subject, i) => (
                                    <Badge key={i} variant="secondary">{subject}</Badge>
                                  ))}
                                </div>
                              )}
                              <p className="text-sm">R{tutor.hourlyRate}/hour</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => blockTutorMutation.mutate({ id: tutor.id, blocked: true })}
                              disabled={blockTutorMutation.isPending}
                              data-testid={`button-block-approved-${tutor.id}`}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Block
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {blockedTutors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    Blocked Tutors ({blockedTutors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {blockedTutors.map((tutor) => (
                      <Card key={tutor.id} className="border-destructive/50" data-testid={`blocked-tutor-${tutor.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-medium">{tutor.fullName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                {tutor.email}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => blockTutorMutation.mutate({ id: tutor.id, blocked: false })}
                              disabled={blockTutorMutation.isPending}
                              data-testid={`button-unblock-${tutor.id}`}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Unblock
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  All Bookings
                </CardTitle>
                <CardDescription>
                  View all tutoring session bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No bookings yet.</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id} data-testid={`admin-booking-${booking.id}`}>
                        <CardContent className="pt-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Student</p>
                              <p className="font-medium">{booking.studentName}</p>
                              <p className="text-sm">{booking.studentEmail}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Booking Details</p>
                              <p className="font-medium">{booking.hours} hour(s)</p>
                              <p className="text-sm">R{booking.amount}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <Badge 
                                variant={booking.paymentStatus === 'completed' ? 'default' : 'secondary'}
                                className={booking.paymentStatus === 'completed' ? 'bg-green-600' : ''}
                              >
                                {booking.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(booking.createdAt).toLocaleDateString()}
                              </p>
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

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Plans
                </CardTitle>
                <CardDescription>
                  View current pricing for tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPricing ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pricing.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No pricing configured.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {pricing.map((plan) => (
                      <Card key={plan.id} data-testid={`pricing-plan-${plan.id}`}>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold">R{plan.amount}</p>
                          <p className="text-muted-foreground">{plan.hours} hour(s)</p>
                          <Badge className="mt-2" variant={plan.isActive ? 'default' : 'secondary'}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </Badge>
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

      {/* Add Availability Slot Dialog */}
      <Dialog open={addSlotDialogOpen} onOpenChange={setAddSlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Availability Slot
            </DialogTitle>
            <DialogDescription>
              Create a new time slot for a tutor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="slot-tutor">Select Tutor</Label>
              <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                <SelectTrigger id="slot-tutor" data-testid="select-slot-tutor">
                  <SelectValue placeholder="Choose a tutor" />
                </SelectTrigger>
                <SelectContent>
                  {approvedTutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-date">Date</Label>
              <Input
                id="slot-date"
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                data-testid="input-slot-date"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slot-start">Start Time</Label>
                <Input
                  id="slot-start"
                  type="time"
                  value={slotStartTime}
                  onChange={(e) => setSlotStartTime(e.target.value)}
                  data-testid="input-slot-start"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-end">End Time</Label>
                <Input
                  id="slot-end"
                  type="time"
                  value={slotEndTime}
                  onChange={(e) => setSlotEndTime(e.target.value)}
                  data-testid="input-slot-end"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-notes">Notes (Optional)</Label>
              <Input
                id="slot-notes"
                placeholder="e.g., Maths revision session"
                value={slotNotes}
                onChange={(e) => setSlotNotes(e.target.value)}
                data-testid="input-slot-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddSlotDialogOpen(false); resetSlotForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSlot}
              disabled={!selectedTutor || !slotDate || !slotStartTime || !slotEndTime || createAvailabilityMutation.isPending}
              data-testid="button-confirm-add-slot"
            >
              {createAvailabilityMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Slot'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
