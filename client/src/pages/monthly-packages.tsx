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
  X,
  Flame,
  Share2,
  MessageCircle,
  Users,
  Percent
} from "lucide-react";
import { SiFacebook, SiTiktok } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Package',
    price: 350,
    period: 'week',
    subjectsAllowed: 1,
    sessionsPerWeek: 3,
    sessionLength: '1 hour',
    totalHours: '3 hours/week',
    color: 'bg-green-500',
    borderColor: 'border-green-500',
    popular: false,
    description: 'Best for learners who need support in one subject',
    ideal: 'Revision, homework support, and steady improvement',
  },
  {
    id: 'standard',
    name: 'Standard Package',
    price: 1200,
    period: 'month',
    subjectsAllowed: 2,
    sessionsPerWeek: 2,
    sessionLength: '2 hours',
    totalHours: '16 hours/month',
    color: 'bg-blue-500',
    borderColor: 'border-blue-500',
    popular: true,
    description: 'Perfect for deeper understanding and consistent progress',
    ideal: 'Deeper understanding and consistent progress across subjects',
  },
  {
    id: 'premium',
    name: 'Premium Package',
    originalPrice: 3200,
    price: 1500,
    period: 'month',
    subjectsAllowed: 3,
    sessionsPerWeek: 3,
    sessionLength: '2 hours',
    totalHours: '24 hours/month',
    color: 'bg-purple-500',
    borderColor: 'border-purple-500',
    popular: false,
    description: 'Intensive exam preparation and major improvements',
    ideal: 'Students preparing for finals or catching up quickly',
  },
];

const YOCO_PAYMENT_LINK = 'https://pay.yoco.com/smart-tutor1';

const SALE_END_DATE = new Date('2026-03-16T23:59:59');

const SOCIAL_LINKS = [
  { name: 'Facebook', icon: SiFacebook, url: 'https://www.facebook.com/besmartonline', color: 'text-blue-600 dark:text-blue-400' },
  { name: 'TikTok', icon: SiTiktok, url: 'https://www.tiktok.com/@besmartonline5?is_from_webapp=1&sender_device=pc', color: 'text-foreground' },
];

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export default function MonthlyPackages() {
  const { user, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>('standard');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const countdown = useCountdown(SALE_END_DATE);

  useEffect(() => {
    document.title = "Tutoring Packages - Be Smart Online Tutorials";
  }, []);

  const currentPackage = PACKAGES.find(p => p.id === selectedPackage);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    setSelectedSubjects([]);
  };

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

    sessionStorage.clear();
    sessionStorage.setItem('packageName', currentPackage?.name || '');
    sessionStorage.setItem('packagePrice', String(currentPackage?.price || 0));
    sessionStorage.setItem('packageSubjects', selectedSubjects.join(', '));

    window.location.href = YOCO_PAYMENT_LINK;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-2 flex-wrap">
          <Link href="/">
            <Button variant="ghost" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--brand-blue))' }}>
            Tutoring Packages
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
        {!countdown.expired && (
          <div 
            className="mb-10 p-6 rounded-md border-2 text-center"
            style={{ 
              borderColor: 'hsl(var(--brand-orange))',
              background: 'linear-gradient(135deg, hsl(var(--brand-orange) / 0.15) 0%, hsl(var(--brand-yellow) / 0.15) 100%)'
            }}
            data-testid="banner-sale-packages"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Flame className="w-6 h-6 text-red-500" />
              <h3 className="font-heading font-bold text-2xl sm:text-3xl text-red-600 dark:text-red-400">
                LIMITED TIME SALE
              </h3>
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--brand-blue))' }}>
              Get 30% OFF your monthly charges!
            </p>

            <div className="flex justify-center gap-3 mb-5 flex-wrap">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hours', value: countdown.hours },
                { label: 'Minutes', value: countdown.minutes },
                { label: 'Seconds', value: countdown.seconds },
              ].map((item) => (
                <div key={item.label} className="bg-background rounded-md p-3 min-w-[70px] border" data-testid={`countdown-pkg-${item.label.toLowerCase()}`}>
                  <div className="text-2xl font-bold" style={{ color: 'hsl(var(--brand-blue))' }}>
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="max-w-xl mx-auto text-left space-y-2 mb-5">
              <p className="font-semibold text-base" style={{ color: 'hsl(var(--brand-blue))' }}>
                How to qualify for 30% OFF:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Share2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Follow us on ALL our social media pages (links below)</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Comment on our pages and repost our videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Send screenshots as proof to <strong>+27 79 512 3150</strong> on WhatsApp</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Bring 2 students who sign up and pay for the <strong>monthly package</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Percent className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Once confirmed, you get <strong>30% OFF</strong> your monthly charges!</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`link-social-pkg-${social.name.toLowerCase()}`}
                  >
                    <Button variant="outline" className="gap-2">
                      <Icon className={`w-4 h-4 ${social.color}`} />
                      {social.name}
                    </Button>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Tutoring Packages</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the package that best fits your learning needs. From weekly support to intensive monthly preparation.
          </p>
        </div>

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
              {'originalPrice' in pkg && pkg.originalPrice && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-red-500 hover:bg-red-500 text-white">
                    SALE
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
                  {'originalPrice' in pkg && pkg.originalPrice && (
                    <div className="text-lg text-muted-foreground line-through mb-1">
                      R{pkg.originalPrice.toLocaleString()}/{pkg.period}
                    </div>
                  )}
                  <span className="text-4xl font-bold">R{pkg.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">/{pkg.period}</span>
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
                    <span className="font-medium">{pkg.totalHours}</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground text-center w-full">
                  Ideal for: {pkg.ideal}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>

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
                <span className="font-medium">{currentPackage.totalHours}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Amount to Pay:</span>
                  <span className="text-2xl font-bold" style={{ color: 'hsl(var(--brand-blue))' }}>
                    R{currentPackage.price.toLocaleString()}/{currentPackage.period}
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
