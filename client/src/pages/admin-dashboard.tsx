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
  Mail, Calendar, Clock, Plus, Trash2, CalendarDays, Bell, Video, Phone,
  PlayCircle, History, Send
} from 'lucide-react';
import type { TutorProfile, BookingPayment, Pricing, Availability, ActionLog } from '@shared/schema';

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

  // Fetch action logs for notifications (booking notifications)
  const { data: actionLogs = [], isLoading: loadingActionLogs } = useQuery<ActionLog[]>({
    queryKey: ['/api/action-logs'],
    enabled: isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds for new notifications
  });

  // Session type for admin view
  interface AdminSession extends BookingPayment {
    tutorName: string;
    tutorEmail?: string;
    tutorPhone?: string;
    status: 'upcoming' | 'in_progress' | 'completed';
  }

  // Fetch all sessions for admin
  const { data: sessions = [], isLoading: loadingSessions, refetch: refetchSessions } = useQuery<AdminSession[]>({
    queryKey: ['/api/admin/sessions'],
    enabled: isAdmin,
    queryFn: async () => {
      const token = getAdminToken();
      const response = await fetch('/api/admin/sessions', {
        headers: {
          ...(token ? { 'x-admin-token': token } : {}),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
  });

  // Filter booking notifications only
  const bookingNotifications = actionLogs.filter(log => log.actionType === 'booking_completed');

  // Type for active tutor
  interface ActiveTutor {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    subjects: string[];
    isApproved: boolean;
    isBlocked: boolean;
  }

  // Fetch currently signed-in tutors
  const { data: activeTutors = [], isLoading: loadingActiveTutors } = useQuery<ActiveTutor[]>({
    queryKey: ['/api/admin/active-tutors'],
    enabled: isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
    queryFn: async () => {
      const token = getAdminToken();
      const response = await fetch('/api/admin/active-tutors', {
        headers: {
          ...(token ? { 'x-admin-token': token } : {}),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch active tutors');
      return response.json();
    },
  });

  // Mutation to send session reminders
  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const token = getAdminToken();
      const response = await fetch('/api/admin/send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-admin-token': token } : {}),
        },
      });
      if (!response.ok) throw new Error('Failed to send reminders');
      return response.json();
    },
    onSuccess: (data: { remindersSent: number }) => {
      toast({
        title: 'Reminders Sent',
        description: `${data.remindersSent} reminder(s) sent successfully.`,
      });
      refetchSessions();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reminders.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to expire old sessions
  const expireSessionsMutation = useMutation({
    mutationFn: async () => {
      const token = getAdminToken();
      const response = await fetch('/api/admin/expire-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-admin-token': token } : {}),
        },
      });
      if (!response.ok) throw new Error('Failed to expire sessions');
      return response.json();
    },
    onSuccess: (data: { expiredCount: number }) => {
      toast({
        title: 'Sessions Expired',
        description: `${data.expiredCount} session(s) marked as expired.`,
      });
      refetchSessions();
      queryClient.invalidateQueries({ queryKey: ['/api/booking-payments'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to expire sessions.',
        variant: 'destructive',
      });
    },
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

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-3xl">
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Notifications</span>
              {bookingNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {bookingNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sessions" data-testid="tab-sessions">
              <Video className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="availability" data-testid="tab-availability">
              <CalendarDays className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Availability</span>
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

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Booking Notifications
                </CardTitle>
                <CardDescription>
                  New bookings and important updates will appear here. Notifications are sent to your email as well.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActionLogs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading notifications...</span>
                  </div>
                ) : bookingNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No booking notifications yet.</p>
                    <p className="text-sm">New bookings will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookingNotifications.map((notification) => {
                      const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
                      return (
                        <Card key={notification.id} className="border-l-4 border-l-green-500">
                          <CardContent className="pt-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                  <span className="font-semibold">New Booking</span>
                                  <Badge variant="secondary">
                                    R{metadata.amount}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{notification.description}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Student:</span>
                                    <p className="font-medium">{metadata.studentName}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Email:</span>
                                    <p className="font-medium">{metadata.studentEmail}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Subject:</span>
                                    <p className="font-medium">{metadata.subject}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Date/Time:</span>
                                    <p className="font-medium">{metadata.slotDate} {metadata.slotTime}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {notification.createdAt && new Date(notification.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Tutor Sessions
                    </CardTitle>
                    <CardDescription>
                      View all upcoming, ongoing, and completed tutoring sessions
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => sendRemindersMutation.mutate()}
                      disabled={sendRemindersMutation.isPending}
                      data-testid="button-send-reminders"
                    >
                      {sendRemindersMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Reminders
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => expireSessionsMutation.mutate()}
                      disabled={expireSessionsMutation.isPending}
                      data-testid="button-expire-sessions"
                    >
                      {expireSessionsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <History className="h-4 w-4 mr-2" />
                      )}
                      Expire Old Sessions
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading sessions...</span>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sessions found.</p>
                    <p className="text-sm">Sessions will appear here once students complete bookings.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Upcoming Sessions */}
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                        <PlayCircle className="h-5 w-5 text-blue-500" />
                        Upcoming Sessions ({sessions.filter(s => s.status === 'upcoming').length})
                      </h3>
                      {sessions.filter(s => s.status === 'upcoming').length === 0 ? (
                        <p className="text-sm text-muted-foreground ml-7">No upcoming sessions.</p>
                      ) : (
                        <div className="space-y-3">
                          {sessions.filter(s => s.status === 'upcoming').map((session) => (
                            <Card key={session.id} className="border-l-4 border-l-blue-500" data-testid={`session-upcoming-${session.id}`}>
                              <CardContent className="pt-4">
                                <div className="grid gap-4 md:grid-cols-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Student</p>
                                    <p className="font-medium">{session.studentName}</p>
                                    <p className="text-sm">{session.studentEmail}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Tutor</p>
                                    <p className="font-medium">{session.tutorName}</p>
                                    {session.tutorPhone && (
                                      <p className="text-sm flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {session.tutorPhone}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Session</p>
                                    <p className="font-medium">{session.subject || 'General'}</p>
                                    <p className="text-sm">{session.hours} hour(s) - R{session.amount}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Scheduled</p>
                                    <p className="font-medium">
                                      {session.sessionStartTime 
                                        ? new Date(session.sessionStartTime).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
                                        : 'Not set'}
                                    </p>
                                    <Badge variant="secondary" className="mt-1">
                                      {session.reminderSent ? 'Reminder Sent' : 'Pending'}
                                    </Badge>
                                  </div>
                                </div>
                                {session.meetingLink && (
                                  <div className="mt-3 pt-3 border-t">
                                    <a 
                                      href={session.meetingLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      <Video className="h-4 w-4" /> {session.meetingLink}
                                    </a>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Past Sessions */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                        <History className="h-5 w-5 text-gray-500" />
                        Completed Sessions ({sessions.filter(s => s.status === 'completed').length})
                      </h3>
                      {sessions.filter(s => s.status === 'completed').length === 0 ? (
                        <p className="text-sm text-muted-foreground ml-7">No completed sessions.</p>
                      ) : (
                        <div className="space-y-3">
                          {sessions.filter(s => s.status === 'completed').map((session) => (
                            <Card key={session.id} className="border-l-4 border-l-gray-400 opacity-75" data-testid={`session-completed-${session.id}`}>
                              <CardContent className="pt-4">
                                <div className="grid gap-4 md:grid-cols-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Student</p>
                                    <p className="font-medium">{session.studentName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Tutor</p>
                                    <p className="font-medium">{session.tutorName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Session</p>
                                    <p className="font-medium">{session.subject || 'General'}</p>
                                    <p className="text-sm">R{session.amount}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Completed</p>
                                    <p className="font-medium">
                                      {session.sessionEndTime 
                                        ? new Date(session.sessionEndTime).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
                                        : new Date(session.createdAt).toLocaleString('en-ZA', { dateStyle: 'medium' })}
                                    </p>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700">Completed</Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
            {/* Active Tutors Section - Shows tutors currently signed in */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--brand-blue))' }}>
                  <PlayCircle className="h-5 w-5" />
                  Currently Signed In ({activeTutors.length})
                </CardTitle>
                <CardDescription>
                  Tutors who are currently logged into the tutor dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActiveTutors ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : activeTutors.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No tutors currently signed in.</p>
                ) : (
                  <div className="space-y-4">
                    {activeTutors.map((tutor) => (
                      <Card key={tutor.id} data-testid={`active-tutor-${tutor.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{tutor.fullName}</p>
                                <Badge variant="default" className="bg-green-500">Online</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                {tutor.email}
                              </div>
                              {tutor.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  {tutor.phone}
                                </div>
                              )}
                              {tutor.subjects && tutor.subjects.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {tutor.subjects.map((subject, i) => (
                                    <Badge key={i} variant="secondary">{subject}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {tutor.isApproved ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>
                              ) : (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
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
            {/* Booking Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {bookings.filter(b => b.paymentStatus === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed Payments</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-yellow-600">
                    {bookings.filter(b => b.paymentStatus === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">
                    R{bookings.filter(b => b.paymentStatus === 'completed').reduce((sum, b) => sum + (b.amount || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  All Bookings
                </CardTitle>
                <CardDescription>
                  View all tutoring session bookings with payment and session status
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
                    {bookings.map((booking) => {
                      // Determine session status
                      const now = new Date();
                      const sessionStart = booking.sessionStartTime ? new Date(booking.sessionStartTime) : null;
                      const sessionEnd = booking.sessionEndTime ? new Date(booking.sessionEndTime) : null;
                      
                      let sessionStatus: 'scheduled' | 'in_progress' | 'completed' | 'not_scheduled' = 'not_scheduled';
                      if (sessionStart && sessionEnd) {
                        if (now < sessionStart) sessionStatus = 'scheduled';
                        else if (now >= sessionStart && now <= sessionEnd) sessionStatus = 'in_progress';
                        else sessionStatus = 'completed';
                      }
                      
                      // Get tutor info
                      const tutor = tutorProfiles.find(t => t.id === booking.tutorId);
                      
                      return (
                        <Card 
                          key={booking.id} 
                          className={sessionStatus === 'in_progress' ? 'border-2 border-green-500' : ''}
                          data-testid={`admin-booking-${booking.id}`}
                        >
                          <CardContent className="pt-4">
                            <div className="grid gap-4 md:grid-cols-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Student</p>
                                <p className="font-medium">{booking.studentName}</p>
                                <p className="text-sm">{booking.studentEmail}</p>
                                {booking.studentPhone && (
                                  <p className="text-sm flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {booking.studentPhone}
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Tutor & Subject</p>
                                <p className="font-medium">{tutor?.fullName || 'Unknown Tutor'}</p>
                                {booking.subject && (
                                  <Badge variant="secondary" className="mt-1">{booking.subject}</Badge>
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Session Details</p>
                                <p className="font-medium">{booking.hours} hour(s) - R{booking.amount}</p>
                                {sessionStart && (
                                  <div className="text-sm flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {sessionStart.toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
                                  </div>
                                )}
                                {sessionStart && (
                                  <div className="text-sm flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {sessionStart.toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg', timeStyle: 'short' })}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {/* Payment Status */}
                                <Badge 
                                  variant={booking.paymentStatus === 'completed' ? 'default' : 'secondary'}
                                  className={booking.paymentStatus === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}
                                >
                                  {booking.paymentStatus === 'completed' ? 'Paid' : 'Payment Pending'}
                                </Badge>
                                {/* Session Status */}
                                <Badge 
                                  variant="outline"
                                  className={
                                    sessionStatus === 'in_progress' ? 'border-green-500 text-green-600' :
                                    sessionStatus === 'completed' ? 'border-gray-400 text-gray-500' :
                                    sessionStatus === 'scheduled' ? 'border-blue-500 text-blue-600' :
                                    'border-gray-300 text-gray-400'
                                  }
                                >
                                  {sessionStatus === 'in_progress' ? 'In Progress' :
                                   sessionStatus === 'completed' ? 'Session Done' :
                                   sessionStatus === 'scheduled' ? 'Scheduled' :
                                   'Not Scheduled'}
                                </Badge>
                                {booking.meetingLink && (
                                  <Badge variant="outline" className="text-xs">
                                    <Video className="h-3 w-3 mr-1" />
                                    Zoom Link Set
                                  </Badge>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Booked: {new Date(booking.createdAt).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
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
