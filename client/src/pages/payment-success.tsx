import { useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentSuccess() {
  const tutorName = sessionStorage.getItem('bookingTutorName') || 'your tutor';
  const subject = sessionStorage.getItem('bookingSubject') || 'your subject';

  useEffect(() => {
    document.title = "Payment Successful - Be Smart Online Tutorials";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-green-700 dark:text-green-400">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for your payment! Your booking for <strong>{subject}</strong> with <strong>{tutorName}</strong> is being processed.
          </p>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-left text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                  Important: Send Proof of Payment
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  Please email your proof of payment to{" "}
                  <a 
                    href="mailto:onlinepresenceimpact@gmail.com" 
                    className="font-medium underline"
                  >
                    onlinepresenceimpact@gmail.com
                  </a>
                  {" "}with your tutor name and subject.
                </p>
              </div>
            </div>
          </div>

          <Button asChild className="w-full mt-4" data-testid="button-back-home">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
