import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CreditCard, Calendar, Clock, User, BookOpen, Mail, LogIn } from 'lucide-react';
import type { TutorProfile, Availability } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: TutorProfile | null;
}

export function BookingModal({ isOpen, onClose, tutor }: BookingModalProps) {
  const { toast } = useToast();
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [hours, setHours] = useState<string>('1');
  const [subject, setSubject] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState<string>('');

  // Clear session storage on open to prevent stale payment success data
  useEffect(() => {
    if (isOpen) {
      sessionStorage.clear();
      window.localStorage.removeItem('pendingBooking'); // Also clear localStorage just in case
    }
  }, [isOpen]);

  // Pre-fill student info from logged in user
  useEffect(() => {
    if (user && isOpen) {
      setStudentName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      setStudentEmail(user.email || '');
    }
  }, [user, isOpen]);

  // Fixed pricing - no longer depends on payment_links table
  // Maths, English, History, CAT, Life Sciences, Geography = R200/hr
  // Physical Sciences, Afrikaans = R250/hr
  const FIXED_PRICING: Record<string, number> = {
    'Maths': 200,
    'English': 200,
    'History': 200,
    'CAT': 200,
    'Life Sciences': 200,
    'Geography': 200,
    'Physical Sciences': 250,
    'Afrikaans': 250,
  };

  // Fetch ALL available time slots from all tutors
  const { data: allAvailabilities = [], isLoading: loadingSlots } = useQuery<Availability[]>({
    queryKey: ['/api/availability'],
    enabled: isOpen,
  });

  // Filter to show only slots for this tutor that are not booked
  const availableSlots = allAvailabilities.filter(slot => slot.tutorId === tutor?.id && !slot.isBooked);

  // Debug log when modal is open
  useEffect(() => {
    if (isOpen && tutor) {
      console.log('[BookingModal OPEN] tutor:', tutor.fullName);
      console.log('[BookingModal OPEN] subjects raw:', tutor.subjects);
      console.log('[BookingModal OPEN] subjects JSON:', JSON.stringify(tutor.subjects));
      console.log('[BookingModal OPEN] type:', typeof tutor.subjects);
      console.log('[BookingModal OPEN] isArray:', Array.isArray(tutor.subjects));
      console.log('[BookingModal OPEN] subjectOptions:', getSubjectOptions());
    }
  }, [isOpen, tutor]);

  // Get subject options based on what the tutor actually teaches
  // Map tutor subjects to our supported payment subjects
  const getSubjectOptions = () => {
    if (!tutor) {
      // Modal not yet opened with a tutor - this is expected
      return [];
    }
    
    if (!tutor.subjects) {
      console.log('[getSubjectOptions] No subjects found for tutor:', tutor.fullName);
      console.log('[getSubjectOptions] Full tutor object:', JSON.stringify(tutor, null, 2));
      return [];
    }
    
    // Handle case where subjects might be a string instead of array
    let subjectsArray: string[];
    if (Array.isArray(tutor.subjects)) {
      subjectsArray = tutor.subjects;
    } else if (typeof tutor.subjects === 'string') {
      // Handle comma-separated string
      subjectsArray = (tutor.subjects as string).split(',').map(s => s.trim());
    } else {
      subjectsArray = [String(tutor.subjects)];
    }
    
    console.log('[getSubjectOptions] Processing subjects:', subjectsArray);
    
    const supportedSubjects: string[] = [];
    
    subjectsArray.forEach(s => {
      if (!s || typeof s !== 'string') {
        console.log('[getSubjectOptions] Skipping invalid subject:', s);
        return;
      }
      const lower = s.toLowerCase().trim();
      console.log('[getSubjectOptions] Checking subject:', lower);
      
      if (lower.includes('maths') || lower.includes('mathematics')) {
        if (!supportedSubjects.includes('Maths')) supportedSubjects.push('Maths');
      }
      if (lower.includes('physical science')) {
        if (!supportedSubjects.includes('Physical Sciences')) supportedSubjects.push('Physical Sciences');
      }
      if (lower === 'physics') {
        if (!supportedSubjects.includes('Physical Sciences')) supportedSubjects.push('Physical Sciences');
      }
      if (lower.includes('english')) {
        if (!supportedSubjects.includes('English')) supportedSubjects.push('English');
      }
      if (lower.includes('history')) {
        if (!supportedSubjects.includes('History')) supportedSubjects.push('History');
      }
      if (lower.includes('cat') || lower.includes('computer')) {
        if (!supportedSubjects.includes('CAT')) supportedSubjects.push('CAT');
      }
      if (lower.includes('life science')) {
        if (!supportedSubjects.includes('Life Sciences')) supportedSubjects.push('Life Sciences');
      }
      if (lower.includes('geography')) {
        if (!supportedSubjects.includes('Geography')) supportedSubjects.push('Geography');
      }
      if (lower.includes('afrikaans')) {
        if (!supportedSubjects.includes('Afrikaans')) supportedSubjects.push('Afrikaans');
      }
    });
    
    console.log('[getSubjectOptions] Supported subjects:', supportedSubjects);
    return supportedSubjects;
  };
  
  const subjectOptions = getSubjectOptions();

  // Mutation to create Yoco checkout session (generates fresh payment URL every time)
  const createCheckoutMutation = useMutation({
    mutationFn: async (data: { tutorId: string; tutorName: string; availabilityId: string; subject: string; hours: number; amount: number; studentName: string; studentEmail: string }) => {
      const response = await apiRequest('POST', '/api/yoco/create-checkout', {
        tutorId: data.tutorId,
        tutorName: data.tutorName,
        availabilityId: data.availabilityId,
        subject: data.subject,
        hours: data.hours,
        amount: data.amount,
        studentName: data.studentName,
        studentEmail: data.studentEmail,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.redirectUrl) {
        // Clear all old session data before redirecting to Yoco
        sessionStorage.clear();
        
        // Store booking ID for after payment
        sessionStorage.setItem('yocoBookingId', data.bookingId);

        // Redirect to fresh Yoco checkout URL (new session every time!)
        window.location.href = data.redirectUrl;
      } else {
        toast({
          title: 'Payment Error',
          description: data.message || 'Failed to create payment session. Please try again.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to prepare payment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleProceedToPayment = () => {
    if (!tutor || !subject) {
      toast({
        title: 'Missing Information',
        description: 'Please select a subject.',
        variant: 'destructive',
      });
      return;
    }

    if (!studentName.trim() || !studentEmail.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name and email address.',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    // Get the payment amount from fixed pricing
    const hourlyRate = FIXED_PRICING[subject];
    if (!hourlyRate) {
      toast({
        title: 'Invalid Selection',
        description: 'Please select a valid subject.',
        variant: 'destructive',
      });
      return;
    }

    const totalAmount = hourlyRate * parseInt(hours);

    // Create a fresh Yoco checkout session (new payment URL every time!)
    createCheckoutMutation.mutate({
      tutorId: tutor.id,
      tutorName: tutor.fullName,
      availabilityId: selectedSlot || '',
      subject,
      hours: parseInt(hours),
      amount: totalAmount,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
    });
  };

  const resetForm = () => {
    setSelectedSlot('');
    setHours('1');
    setSubject('');
    setStudentName('');
    setStudentEmail('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!tutor) return null;

  const hoursNum = parseInt(hours) || 1;
  const hourlyRate = subject ? FIXED_PRICING[subject] : 0;
  const displayAmount = hourlyRate * hoursNum;

  // Show sign-in prompt if user is not logged in
  if (!user && !authLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In Required
            </DialogTitle>
            <DialogDescription>
              Please sign in with your Google account to book a session with {tutor.fullName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Signing in helps us keep track of your bookings and send you session reminders.
              </p>
              <Button
                onClick={signInWithGoogle}
                className="w-full"
                style={{ backgroundColor: 'hsl(var(--brand-blue))' }}
                data-testid="button-signin-to-book"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In with Google
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel-signin">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book a Session with {tutor.fullName}
          </DialogTitle>
          <DialogDescription>
            Select your subject and time slot, then proceed to payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="studentName">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="studentName"
                  placeholder="Enter your full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="pl-10"
                  data-testid="input-student-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentEmail">Your Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="studentEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="pl-10"
                  data-testid="input-student-email"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject" data-testid="select-booking-subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {subjectOptions.length === 0 ? (
                    <div className="py-2 px-3 text-muted-foreground text-sm">No subjects available</div>
                  ) : (
                    subjectOptions.map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {subj}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Session Duration</Label>
              <Select value={hours} onValueChange={setHours}>
                <SelectTrigger id="hours" data-testid="select-booking-hours">
                  <SelectValue placeholder="Select hours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="2">2 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Available Time Slot</Label>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading available slots...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No available time slots. Please check back later.
              </div>
            ) : (
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger data-testid="select-booking-slot">
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {slot.date}
                        <Clock className="h-4 w-4 ml-2" />
                        {slot.startTime} - {slot.endTime}
                        {slot.notes && <span className="text-muted-foreground">({slot.notes})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {subject && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Tutor:
                </span>
                <span className="font-medium">{tutor.fullName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Subject:</span>
                <span className="font-medium">{subject}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Duration:</span>
                <span>{hoursNum} hour(s)</span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between font-semibold">
                <span>Total:</span>
                <span className="text-lg" data-testid="text-booking-total">R{displayAmount}</span>
              </div>
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={!selectedSlot || !subject || createCheckoutMutation.isPending}
            onClick={handleProceedToPayment}
            data-testid="button-proceed-payment"
          >
            {createCheckoutMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay R{displayAmount} Now
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You will be redirected to Yoco secure payment page. After successful payment, you will enter your contact details and receive the Google Meet link.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
