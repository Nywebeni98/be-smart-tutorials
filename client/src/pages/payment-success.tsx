import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Video, Loader2, ArrowLeft, User, Mail, Phone, Calendar, Clock, BookOpen } from 'lucide-react';

interface PendingBooking {
  bookingToken: string;
  tutorId: string;
  tutorName: string;
  tutorMeetLink: string | null;
  availabilityId: string;
  subject: string;
  hours: number;
  amount: number;
  selectedSlotDetails?: {
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  };
}

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve pending booking info from sessionStorage
    const stored = sessionStorage.getItem('pendingBooking');
    if (stored) {
      try {
        const booking = JSON.parse(stored);
        setPendingBooking(booking);
      } catch (e) {
        console.error('Failed to parse pending booking:', e);
      }
    }
  }, []);

  const createBookingMutation = useMutation({
    mutationFn: async (data: {
      bookingToken: string;
      studentName: string;
      studentEmail: string;
      studentPhone: string;
    }) => {
      return apiRequest('POST', '/api/booking-payments/complete', data);
    },
    onSuccess: (data: any) => {
      setBookingComplete(true);
      setMeetingLink(data.meetingLink || pendingBooking?.tutorMeetLink || null);
      // Clear the pending booking from storage
      sessionStorage.removeItem('pendingBooking');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/booking-payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
      toast({
        title: 'Booking Confirmed!',
        description: 'Your tutoring session has been booked successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pendingBooking || !pendingBooking.bookingToken) {
      toast({
        title: 'No Booking Found',
        description: 'Please start a new booking from the tutors page.',
        variant: 'destructive',
      });
      return;
    }

    if (!studentName || !studentEmail) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name and email address.',
        variant: 'destructive',
      });
      return;
    }

    createBookingMutation.mutate({
      bookingToken: pendingBooking.bookingToken,
      studentName,
      studentEmail,
      studentPhone,
    });
  };

  // No pending booking found
  if (!pendingBooking && !bookingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Payment Received</CardTitle>
            <CardDescription>
              If you've completed a payment, please click below to book a new session.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => setLocation('/')}
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Home Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Booking complete - show meeting link
  if (bookingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600" data-testid="text-booking-confirmed">
              Booking Confirmed!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              Your tutoring session with <span className="font-semibold">{pendingBooking?.tutorName}</span> has been booked successfully.
            </p>

            {pendingBooking?.selectedSlotDetails && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Date: <span className="font-medium">{pendingBooking.selectedSlotDetails.date}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Time: <span className="font-medium">{pendingBooking.selectedSlotDetails.startTime} - {pendingBooking.selectedSlotDetails.endTime}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>Subject: <span className="font-medium">{pendingBooking.subject}</span></span>
                </div>
              </div>
            )}

            {meetingLink ? (
              <div className="space-y-4">
                <p className="font-medium">Your Google Meet session link:</p>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => window.open(meetingLink, '_blank')}
                  data-testid="button-join-meeting"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Join Google Meet Session
                </Button>
                <p className="text-sm text-muted-foreground">
                  Save this link - you'll need it to join your tutoring session at the scheduled time.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                The tutor will send you the meeting link before your session to <span className="font-semibold">{studentEmail}</span>.
              </p>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation('/')}
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Collect student details after payment
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600" data-testid="text-payment-success">
            Payment Successful!
          </CardTitle>
          <CardDescription>
            Please enter your contact details to complete your booking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {pendingBooking && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Tutor:</span>
                <span className="font-medium">{pendingBooking.tutorName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Subject:</span>
                <span className="font-medium">{pendingBooking.subject}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Duration:</span>
                <span>{pendingBooking.hours} hour(s)</span>
              </div>
              {pendingBooking.selectedSlotDetails && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span>Date:</span>
                    <span className="font-medium">{pendingBooking.selectedSlotDetails.date}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Time:</span>
                    <span className="font-medium">{pendingBooking.selectedSlotDetails.startTime} - {pendingBooking.selectedSlotDetails.endTime}</span>
                  </div>
                </>
              )}
              <div className="border-t pt-2 flex items-center justify-between font-semibold">
                <span>Paid:</span>
                <span className="text-green-600">R{pendingBooking.amount}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitDetails} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Full Name
              </Label>
              <Input
                id="student-name"
                placeholder="Enter your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                data-testid="input-student-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="student-email"
                type="email"
                placeholder="your@email.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
                data-testid="input-student-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number (Optional)
              </Label>
              <Input
                id="student-phone"
                type="tel"
                placeholder="e.g., 0821234567"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                data-testid="input-student-phone"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createBookingMutation.isPending || !studentName || !studentEmail}
              data-testid="button-complete-booking"
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                'Complete Booking & Get Meeting Link'
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            After completing your booking, you will receive the Google Meet link for your tutoring session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
