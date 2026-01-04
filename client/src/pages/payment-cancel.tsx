import { useEffect } from "react";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentCancel() {
  useEffect(() => {
    document.title = "Payment Cancelled - Be Smart Online Tutorials";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl text-amber-700 dark:text-amber-400">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment was cancelled. No charges were made to your account.
          </p>
          
          <p className="text-sm text-muted-foreground">
            If you'd like to book a session, please return to the home page and try again.
          </p>

          <Button asChild className="w-full mt-4" data-testid="button-back-home">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
