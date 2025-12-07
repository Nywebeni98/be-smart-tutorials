import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CreditCard, Calendar, Clock, User } from 'lucide-react';
import type { TutorProfile, Availability } from '@shared/schema';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: TutorProfile | null;
}

export function BookingModal({ isOpen, onClose, tutor }: BookingModalProps) {
  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [hours, setHours] = useState<string>('1');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');

  const { data: availabilities = [], isLoading: loadingSlots } = useQuery<Availability[]>({
    queryKey: ['/api/availability/tutor', tutor?.id],
    enabled: !!tutor?.id && isOpen,
  });

  const availableSlots = availabilities.filter(slot => !slot.isBooked);

  const createCheckoutMutation = useMutation({
    mutationFn: async (data: {
      tutorId: string;
      tutorName: string;
      availabilityId: string;
      hours: number;
      amount: number;
      studentName: string;
      studentEmail: string;
      studentPhone: string;
    }) => {
      return apiRequest('POST', '/api/yoco/create-checkout', data);
    },
    onSuccess: (data: any) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to redirect to payment page',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Could not create booking. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tutor || !selectedSlot) {
      toast({
        title: 'Missing Information',
        description: 'Please select an available time slot.',
        variant: 'destructive',
      });
      return;
    }

    const hoursNum = parseInt(hours);
    const amount = tutor.hourlyRate * hoursNum;

    createCheckoutMutation.mutate({
      tutorId: tutor.id,
      tutorName: tutor.fullName,
      availabilityId: selectedSlot,
      hours: hoursNum,
      amount,
      studentName,
      studentEmail,
      studentPhone,
    });
  };

  const resetForm = () => {
    setSelectedSlot('');
    setHours('1');
    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!tutor) return null;

  const hoursNum = parseInt(hours) || 1;
  const totalAmount = tutor.hourlyRate * hoursNum;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book a Session with {tutor.fullName}
          </DialogTitle>
          <DialogDescription>
            Fill in your details and select an available time slot to book your tutoring session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="student-name">Your Name</Label>
              <Input
                id="student-name"
                placeholder="Enter your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                data-testid="input-booking-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email">Email Address</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="your@email.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
                data-testid="input-booking-email"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="student-phone">Phone Number (Optional)</Label>
              <Input
                id="student-phone"
                type="tel"
                placeholder="e.g., 0821234567"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                data-testid="input-booking-phone"
              />
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
                  <SelectItem value="3">3 Hours</SelectItem>
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

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Tutor:
              </span>
              <span className="font-medium">{tutor.fullName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Rate:</span>
              <span>R{tutor.hourlyRate}/hour</span>
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

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={createCheckoutMutation.isPending || !selectedSlot || !studentName || !studentEmail}
            data-testid="button-proceed-payment"
          >
            {createCheckoutMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Payment
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You will be redirected to Yoco secure payment page to complete your booking.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
