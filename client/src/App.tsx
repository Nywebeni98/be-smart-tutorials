import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/home";
import TutorDashboard from "@/pages/tutor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import MonthlyPackages from "@/pages/monthly-packages";
import PaymentSuccess from "@/pages/payment-success";
import PaymentFailure from "@/pages/payment-failure";
import PaymentCancel from "@/pages/payment-cancel";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import { SiWhatsapp } from "react-icons/si";

function Router() {
  return (
    <Switch>
      {/* Home page with all sections */}
      <Route path="/" component={Home} />
      
      {/* Tutor dashboard - protected route */}
      <Route path="/tutor-dashboard" component={TutorDashboard} />
      
      {/* Admin dashboard - protected route */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Monthly packages page */}
      <Route path="/packages" component={MonthlyPackages} />
      
      {/* Payment callback pages */}
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/failure" component={PaymentFailure} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      
      {/* Password reset page */}
      <Route path="/reset-password" component={ResetPassword} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function WhatsAppButton() {
  const whatsappNumber = "27795123150";
  const message = encodeURIComponent("Hello! I'm interested in Be Smart Online Tutoring.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
  
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600"
      aria-label="Chat on WhatsApp"
      data-testid="button-whatsapp"
    >
      <SiWhatsapp className="h-7 w-7" />
    </a>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <WhatsAppButton />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
