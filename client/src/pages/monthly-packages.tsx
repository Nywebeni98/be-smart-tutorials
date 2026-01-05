import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Check, 
  Star, 
  ArrowLeft, 
  CreditCard,
  Clock,
  BookOpen,
  Calendar,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Available subjects from the existing code
const AVAILABLE_SUBJECTS = [
  'Mathematics',
  'Physical Sciences',
  'English',
  'Maths Literacy',
  'Applied Maths (University)',
  'Afrikaans',
  'Life Sciences',
  'Geography',
  'History',
  'CAT',
  'Frontend Development',
  'Backend Development',
];

// Package definitions
const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Package',
    price: 750,
    subjectsAllowed: 1,
    sessionsPerWeek: 1,
    sessionLength: '1 hour',
    totalHours: 4,
    savings: 50,
    color: 'bg-green-500',
    borderColor: 'border-green-500',
    popular: false,
    description: 'Best for learners who need support in one subject',
    ideal: 'Revision, homework support, and steady improvement',
  },
  {
    id: 'standard',
    name: 'Standard Package',
    price: 1500,
    subjectsAllowed: 2,
    sessionsPerWeek: 2,
    sessionLength: '1 hour',
    totalHours: 8,
    savings: 100,
    color: 'bg-blue-500',
    borderColor: 'border-blue-500',
    popular: true,
    description: 'Balanced academic support across multiple subjects',
    ideal: 'Balanced academic support across multiple subjects',
  },
  {
    id: 'premium',
    name: 'Premium Package',
    price: 3200,
    subjectsAllowed: 3,
    sessionsPerWeek: 3,
    sessionLength: '1.5 hours',
    totalHours: 18,
    savings: 400,
    color: 'bg-purple-500',
    borderColor: 'border-purple-500',
    popular: false,
    description: 'Best for exam preparation and intensive support',
    ideal: 'Exam preparation, deep understanding, and fast progress',
  },
];

// Reusable Yoco payment link
const YOCO_PAYMENT_LINK = 'https://pay.yoco.com/smart-tutor1';

export default function MonthlyPackages() {
  const { user, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>('standard');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  useEffect(() => {
    document.title = "Monthly Packages - Be Smart Online Tutorials";
  }, []);

  // Get current package details
  const currentPackage = PACKAGES.find(p => p.id === selectedPackage);

  // Handle package selection
  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    setSelectedSubjects([]); // Reset subjects when package changes
  };

  // Handle subject toggle
  const handleSubjectToggle = (subject: string) => {
    if (!currentPackage) return;

    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      if (selectedSubjects.length < currentPackage.subjectsAllowed) {
        setSelectedSubjects([...selectedSubjects, subject]);
      } else {
        toast({
          title: 'Subject Limit Reached',
          description: `You can only select ${currentPackage.subjectsAllowed} subject(s) for the ${currentPackage.name}.`,
          variant: 'destructive',
        });
      }
    }
  };

  // Handle proceed to payment
  const handleProceedToPayment = () => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in with Google to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedPackage || selectedSubjects.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select a package and at least one subject.',
        variant: 'destructive',
      });
      return;
    }

    // Store package info for reference
    sessionStorage.clear();
    sessionStorage.setItem('packageName', currentPackage?.name || '');
    sessionStorage.setItem('packagePrice', String(currentPackage?.price || 0));
    sessionStorage.setItem('packageSubjects', selectedSubjects.join(', '));

    // Redirect to Yoco payment link
    window.location.href = YOCO_PAYMENT_LINK;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--brand-blue))' }}>
            Monthly Packages
          </h1>
          {user ? (
            <span className="text-sm text-muted-foreground">
              Signed in as {user.email}
            </span>
          ) : (
            <Button onClick={signInWithGoogle} variant="outline" data-testid="button-signin">
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Monthly Online Tutoring Packages</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our monthly tutoring packages are designed to give learners consistent support, 
            clear structure, and better results. All packages are based on our standard rate 
            of R200 per hour, with discounted pricing for monthly commitment.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
            <Star className="h-4 w-4" />
            Save more with monthly packages compared to pay-as-you-go lessons
          </div>
        </div>

        {/* Package Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PACKAGES.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                selectedPackage === pkg.id 
                  ? `ring-2 ring-offset-2 ${pkg.borderColor.replace('border', 'ring')}` 
                  : ''
              }`}
              onClick={() => handlePackageSelect(pkg.id)}
              data-testid={`card-package-${pkg.id}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-500 hover:bg-blue-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className={`${pkg.popular ? 'pt-6' : ''}`}>
                <div className={`w-12 h-12 rounded-lg ${pkg.color} flex items-center justify-center mb-3`}>
                  <Package className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  {pkg.name}
                  {selectedPackage === pkg.id && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-4xl font-bold">R{pkg.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{pkg.subjectsAllowed} subject{pkg.subjectsAllowed > 1 ? 's' : ''}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{pkg.sessionsPerWeek} session{pkg.sessionsPerWeek > 1 ? 's' : ''} per week</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{pkg.sessionLength} per session</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{pkg.totalHours} hours per month</span>
                  </li>
                </ul>

                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-center py-2 px-3 rounded-md text-sm font-medium">
                  Save R{pkg.savings} compared to hourly rate
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground text-center w-full">
                  Ideal for: {pkg.ideal}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Subject Selection */}
        {selectedPackage && currentPackage && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Select Your Subject{currentPackage.subjectsAllowed > 1 ? 's' : ''}
              </CardTitle>
              <CardDescription>
                Choose {currentPackage.subjectsAllowed} subject{currentPackage.subjectsAllowed > 1 ? 's' : ''} for your {currentPackage.name}. 
                Selected: {selectedSubjects.length}/{currentPackage.subjectsAllowed}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AVAILABLE_SUBJECTS.map((subject) => {
                  const isSelected = selectedSubjects.includes(subject);
                  const isDisabled = !isSelected && selectedSubjects.length >= currentPackage.subjectsAllowed;
                  
                  return (
                    <Button
                      key={subject}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto py-3 px-4 justify-start ${
                        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={() => !isDisabled && handleSubjectToggle(subject)}
                      disabled={isDisabled}
                      data-testid={`button-subject-${subject.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {isSelected && <Check className="h-4 w-4 mr-2 flex-shrink-0" />}
                      <span className="truncate">{subject}</span>
                    </Button>
                  );
                })}
              </div>

              {selectedSubjects.length > 0 && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Selected Subjects:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map((subject) => (
                      <Badge 
                        key={subject} 
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleSubjectToggle(subject)}
                      >
                        {subject}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary and Payment */}
        {selectedPackage && currentPackage && selectedSubjects.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Package:</span>
                <span className="font-medium">{currentPackage.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Subjects:</span>
                <span className="font-medium">{selectedSubjects.join(', ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Sessions:</span>
                <span className="font-medium">{currentPackage.sessionsPerWeek} per week ({currentPackage.sessionLength} each)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Hours:</span>
                <span className="font-medium">{currentPackage.totalHours} hours/month</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Amount to Pay:</span>
                  <span className="text-2xl font-bold" style={{ color: 'hsl(var(--brand-blue))' }}>
                    R{currentPackage.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Please enter this amount on the Yoco payment page
                </p>
              </div>

              {!user ? (
                <Button 
                  onClick={signInWithGoogle}
                  className="w-full"
                  size="lg"
                  data-testid="button-signin-to-pay"
                >
                  Sign In with Google to Continue
                </Button>
              ) : (
                <Button
                  onClick={handleProceedToPayment}
                  className="w-full"
                  size="lg"
                  data-testid="button-proceed-payment"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground">
                You will be redirected to Yoco to complete payment. After payment, please email proof of payment to <strong>onlinepresenceimpact@gmail.com</strong> including your package and subjects.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
