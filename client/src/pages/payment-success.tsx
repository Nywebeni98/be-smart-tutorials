import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Video, Loader2, ArrowLeft } from 'lucide-react';
import type { BookingPayment } from '@shared/schema';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('bookingId');
    setBookingId(id);
  }, []);

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/payment/complete/${id}`);
    },
  });

  const { data: booking, isLoading } = useQuery<{ booking: BookingPayment; meetingLink: string | null }>({
    queryKey: ['/api/booking-payments', bookingId],
    enabled: !!bookingId && completeMutation.isSuccess,
  });

  useEffect(() => {
    if (bookingId && !completeMutation.isSuccess && !completeMutation.isPending) {
      completeMutation.mutate(bookingId);
    }
  }, [bookingId]);

  if (isLoading || completeMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Processing your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meetingLink = completeMutation.data?.meetingLink || booking?.meetingLink;

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
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            Thank you for your payment. Your tutoring session has been booked.
          </p>

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
              The tutor will send you the meeting link before your session.
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
