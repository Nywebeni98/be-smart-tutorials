import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CreditCard, Calendar, Clock, User, BookOpen } from 'lucide-react';
import type { TutorProfile, Availability } from '@shared/schema';

// Fixed Yoco payment links based on subject and duration
const PAYMENT_LINKS: Record<string, Record<string, { amount: number; url: string }>> = {
  'General Tutoring': {
    '1': { amount: 200, url: 'https://pay.yoco.com/r/4GQxeA' },
    '2': { amount: 400, url: 'https://pay.yoco.com/r/25ZL1w' },
  },
  'Physics': {
    '1': { amount: 250, url: 'https://pay.yoco.com/r/2PDlRK' },
    '2': { amount: 500, url: 'https://pay.yoco.com/r/7KvqDV' },
  },
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: TutorProfile | null;
}

export function BookingModal({ isOpen, onClose, tutor }: BookingModalProps) {
  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [hours, setHours] = useState<string>('1');
  const [subject, setSubject] = useState<string>('');

  const { data: availabilities = [], isLoading: loadingSlots } = useQuery<Availability[]>({
    queryKey: ['/api/availability/tutor', tutor?.id],
    enabled: !!tutor?.id && isOpen,
  });

  const availableSlots = availabilities.filter(slot => !slot.isBooked);

  // If tutor teaches subjects not in our pricing, default to General Tutoring
  const hasPhysics = tutor?.subjects?.some(s => 
    s.toLowerCase().includes('physics') || s.toLowerCase().includes('physical science')
  );
  const subjectOptions = hasPhysics 
    ? ['General Tutoring', 'Physics'] 
    : ['General Tutoring'];

  // Mutation to create booking token before payment
  const createTokenMutation = useMutation({
    mutationFn: async (data: { tutorId: string; availabilityId: string; subject: string; hours: number; amount: number }) => {
      return apiRequest('POST', '/api/booking/create-token', data);
    },
    onSuccess: (data: any, variables) => {
      if (data.token) {
        // Get the payment link for selected subject and hours
        const paymentInfo = PAYMENT_LINKS[subject]?.[hours];
        if (!paymentInfo) {
          toast({
            title: 'Error',
            description: 'Invalid subject or duration selection.',
            variant: 'destructive',
          });
          return;
        }

        // Store booking info and token in sessionStorage for after payment
        const bookingInfo = {
          bookingToken: data.token,
          tutorId: tutor?.id,
          tutorName: tutor?.fullName,
          tutorMeetLink: tutor?.googleMeetUrl,
          availabilityId: selectedSlot,
          subject,
          hours: parseInt(hours),
          amount: paymentInfo.amount,
          selectedSlotDetails: availabilities.find(s => s.id === selectedSlot),
        };
        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingInfo));

        // Redirect to Yoco payment link
        window.location.href = paymentInfo.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to prepare booking. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleProceedToPayment = () => {
    if (!tutor || !selectedSlot || !subject) {
      toast({
        title: 'Missing Information',
        description: 'Please select a subject and an available time slot.',
        variant: 'destructive',
      });
      return;
    }

    // Get the payment link for selected subject and hours
    const paymentInfo = PAYMENT_LINKS[subject]?.[hours];
    if (!paymentInfo) {
      toast({
        title: 'Invalid Selection',
        description: 'Please select a valid subject and duration.',
        variant: 'destructive',
      });
      return;
    }

    // Create a booking token on the server before redirecting to payment
    createTokenMutation.mutate({
      tutorId: tutor.id,
      availabilityId: selectedSlot,
      subject,
      hours: parseInt(hours),
      amount: paymentInfo.amount,
    });
  };

  const resetForm = () => {
    setSelectedSlot('');
    setHours('1');
    setSubject('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!tutor) return null;

  const hoursNum = parseInt(hours) || 1;
  const paymentInfo = subject ? PAYMENT_LINKS[subject]?.[hours] : null;
  const totalAmount = paymentInfo?.amount || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book a Session with {tutor.fullName}
          </DialogTitle>
          <DialogDescription>
            Select your subject and time slot, then proceed to payment. You will enter your contact details after payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject" data-testid="select-booking-subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((subj) => (
                    <SelectItem key={subj} value={subj}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {subj}
                      </div>
                    </SelectItem>
                  ))}
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
                <span className="text-lg" data-testid="text-booking-total">R{totalAmount}</span>
              </div>
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={!selectedSlot || !subject || createTokenMutation.isPending}
            onClick={handleProceedToPayment}
            data-testid="button-proceed-payment"
          >
            {createTokenMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay R{totalAmount} Now
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
