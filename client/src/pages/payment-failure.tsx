import { useEffect } from "react";
import { Link } from "wouter";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentFailure() {
  useEffect(() => {
    document.title = "Payment Failed - Be Smart Online Tutorials";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-red-700 dark:text-red-400">
            Payment Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Unfortunately, your payment could not be processed. Please try again or contact support if the problem persists.
          </p>
          
          <div className="flex flex-col gap-2 mt-4">
            <Button asChild className="w-full" data-testid="button-try-again">
              <Link href="/">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full" data-testid="button-contact-support">
              <a href="mailto:onlinepresenceimpact@gmail.com">Contact Support</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
