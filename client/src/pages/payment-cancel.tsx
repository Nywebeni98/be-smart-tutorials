import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-payment-cancelled">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            You have cancelled the payment process. No charges have been made to your account.
          </p>

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => setLocation('/#tutors')}
              data-testid="button-book-again"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Book a Session
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation('/')}
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
